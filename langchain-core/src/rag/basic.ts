/**
 * RAG - Basic
 * * Indexing: Load -> Split -> Embed -> Store
 * * 2-Step RAG: luôn retrieve rồi mới generate
 * * Agentic RAG: retriever là tool, agent tự quyết khi nào gọi
 */

import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import {
  createAgent,
  HumanMessage,
  initChatModel,
  SystemMessage,
  tool,
} from "langchain";
import * as z from "zod";

// ---------- Indexing ----------

// 1. Load: dữ liệu private giả lập (thực tế dùng document loader)
const docs = [
  new Document({
    pageContent:
      "Chính sách nghỉ phép: nhân viên được 12 ngày phép mỗi năm. Cần xin phép trước 3 ngày làm việc.",
    metadata: { source: "hr-handbook" },
  }),
  new Document({
    pageContent:
      "Chính sách làm việc từ xa: tối đa 2 ngày mỗi tuần, cần quản lý trực tiếp duyệt.",
    metadata: { source: "hr-handbook" },
  }),
  new Document({
    pageContent:
      "Chính sách lương: lương được trả vào ngày 5 hàng tháng qua chuyển khoản.",
    metadata: { source: "hr-handbook" },
  }),
];

// 2. Split
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 200,
  chunkOverlap: 20,
});
const chunks = await splitter.splitDocuments(docs);

// 3. Embed + 4. Store
const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" });
const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);

const retriever = vectorStore.asRetriever({ k: 2 });

const model = await initChatModel(process.env.AI_MODEL);

// ---------- Retrieval thuần: chưa có LLM ----------

const question = "Tôi được nghỉ phép bao nhiêu ngày một năm?";

console.log("=== Retrieval ===");
const hits = await retriever.invoke(question);
hits.forEach((doc, i) => console.log(`[${i}] ${doc.pageContent}`));

// ---------- A. 2-Step RAG ----------

console.log("\n=== 2-Step RAG ===");
const context = hits.map((doc) => doc.pageContent).join("\n\n");
const answer = await model.invoke([
  new SystemMessage(
    `Chỉ trả lời dựa trên context bên dưới. Nếu không có thông tin, hãy nói không biết.\n\nContext:\n${context}`,
  ),
  new HumanMessage(question),
]);
console.log(answer.content);

// ---------- B. Agentic RAG ----------

console.log("\n=== Agentic RAG ===");
const searchPolicy = tool(
  async ({ query }) => {
    const found = await retriever.invoke(query);
    return found.map((doc) => doc.pageContent).join("\n\n");
  },
  {
    name: "search_policy",
    description: "Tìm thông tin trong chính sách nhân sự của công ty",
    schema: z.object({ query: z.string().describe("nội dung cần tìm") }),
  },
);

const agent = createAgent({
  model: process.env.AI_MODEL ?? "",
  tools: [searchPolicy],
  systemPrompt:
    "Bạn là trợ lý nhân sự. Dùng search_policy khi cần thông tin chính sách công ty.",
});

// Câu 1 cần tra tài liệu, câu 2 không cần
for (const input of [question, "1 + 1 bằng mấy?"]) {
  const result = await agent.invoke({
    messages: [{ role: "user", content: input }],
  });

  console.log(`\nHỏi: ${input}`);
  result.messages.forEach((message) => {
    console.log(`${message.type}: ${message.contentBlocks.at(-1)?.text ?? ""}`);
  });
}
