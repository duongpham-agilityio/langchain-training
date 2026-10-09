/**
 * RAG - PDF (Agentic)
 * * Indexing giống pdf.ts
 * * Retriever được bọc thành tool, agent tự quyết gọi hay không, gọi mấy lần, query gì
 */

import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { AIMessage, createAgent, tool } from "langchain";
import * as z from "zod";

// ---------- Indexing ----------

const docs = await new PDFLoader("./data/urban-beekeeping.pdf").load();
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 150,
});
const chunks = await splitter.splitDocuments(docs);
const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" });
const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
const retriever = vectorStore.asRetriever({ k: 3 });

// ---------- Tool ----------

const searchPaper = tool(
  async ({ query }) => {
    const hits = await retriever.invoke(query);
    return hits
      .map(
        (doc) =>
          `[trang ${doc.metadata.loc?.pageNumber ?? "?"}] ${doc.pageContent}`,
      )
      .join("\n\n");
  },
  {
    name: "search_paper",
    description:
      "Tìm đoạn liên quan trong bài nghiên cứu về nuôi ong đô thị (nhiệt độ tổ ong, giao thức Reed-and-Reflect, sản lượng mật). Mỗi lần tìm một ý cụ thể, tiếng Anh.",
    schema: z.object({
      query: z.string().describe("nội dung cần tìm, một ý duy nhất"),
    }),
  },
);

// ---------- Agent ----------

const agent = createAgent({
  model: process.env.AI_MODEL ?? "",
  tools: [searchPaper],
  systemPrompt: `Bạn là trợ lý trả lời câu hỏi về bài nghiên cứu nuôi ong đô thị.
- Câu hỏi về nội dung bài: dùng search_paper. Câu hỏi nhiều ý thì tìm từng ý riêng.
- Nếu kết quả chưa đủ, tìm lại với query khác.
- Câu hỏi không liên quan bài: trả lời ngắn gọn, không cần tìm.
- Chỉ khẳng định điều có trong kết quả tìm. Trả lời tiếng Việt, ghi rõ trang nguồn.`,
});

const questions = [
  "Giao thức Reed-and-Reflect gồm những gì và tốn bao nhiêu tiền?",
  "Độ cao của mái nhà ảnh hưởng thế nào đến sản lượng?",
  "Thủ đô của Pháp là gì?",
];

for (const question of questions) {
  const result = await agent.invoke({
    messages: [{ role: "user", content: question }],
  });

  console.log(`\nHỏi: ${question}`);

  // In các lần agent gọi tool để thấy nó tự quyết
  let calls = 0;
  for (const message of result.messages) {
    if (AIMessage.isInstance(message)) {
      for (const call of message.tool_calls ?? []) {
        calls++;
        console.log(`  → search_paper(${JSON.stringify(call.args)})`);
      }
    }
  }
  console.log(`  Số lần tìm: ${calls}`);
  console.log(`Đáp: ${result.messages.at(-1)?.contentBlocks.at(-1)?.text}`);
}
