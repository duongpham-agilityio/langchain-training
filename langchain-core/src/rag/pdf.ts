/**
 * RAG - PDF
 * * Load PDF thật -> Split -> Embed -> Store
 * * Hỏi bằng tiếng Việt, tài liệu tiếng Anh
 * * Trả lời kèm nguồn (trang) lấy từ metadata
 */

import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HumanMessage, initChatModel, SystemMessage } from "langchain";

// 1. Load: mỗi trang PDF = 1 Document
const docs = await new PDFLoader("./data/urban-beekeeping.pdf").load();
console.log(`Loaded ${docs.length} trang`);

// 2. Split
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 150,
});
const chunks = await splitter.splitDocuments(docs);
console.log(`Split thành ${chunks.length} chunk`);

// 3. Embed + 4. Store
const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" });
const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
const retriever = vectorStore.asRetriever({ k: 3 });

const model = await initChatModel(process.env.AI_MODEL);

const questions = [
  "Giao thức Reed-and-Reflect gồm những gì và tốn bao nhiêu tiền?",
  "Sản lượng mật ong của tổ được xử lý tăng bao nhiêu so với nhóm đối chứng?",
  "Độ cao của mái nhà ảnh hưởng thế nào đến sản lượng?",
  "Thủ đô của Pháp là gì?", // ngoài tài liệu: model phải nói không biết
];

for (const question of questions) {
  // Retrieve
  const hits = await retriever.invoke(question);
  const context = hits
    .map(
      (doc) =>
        `[trang ${doc.metadata.loc?.pageNumber ?? "?"}] ${doc.pageContent}`,
    )
    .join("\n\n");

  // Generate
  const answer = await model.invoke([
    new SystemMessage(
      `Chỉ trả lời dựa trên context bên dưới, bằng tiếng Việt, ngắn gọn. Ghi rõ trang nguồn. Nếu context không có thông tin, nói "Tài liệu không đề cập".\n\nContext:\n${context}`,
    ),
    new HumanMessage(question),
  ]);

  console.log(`\nHỏi: ${question}`);
  console.log(
    `Chunk lấy được: ${hits.map((d) => `trang ${d.metadata.loc?.pageNumber}`).join(", ")}`,
  );
  console.log(`Đáp: ${answer.content}`);
}
