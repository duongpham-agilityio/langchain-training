/**
 * Models - Configure
 * * Prompt Caching
 * * Structured Output
 */

import { HumanMessage, initChatModel, SystemMessage, tool } from "langchain";
import * as z from "zod";

const standaloneModel = await initChatModel(process.env.AI_MODEL);

const OutputSchema = z.object({
  userInput: z.string().describe("yêu cầu của người dùng."),
  userIntent: z
    .string()
    .describe("ý định của người dùng, được trích xuất từ yêu cầu của họ."),
  modelResponse: z
    .string()
    .describe("phản hồi của mô hình đối với yêu cầu của người dùng."),
});

const structuredModel = standaloneModel.withStructuredOutput(OutputSchema);

const largeContext = `
LangGraph is a library for building stateful, multi-actor applications with LLMs, built on top of LangChain. 
It extends the LangChain expression language (LCEL) with the ability to coordinate multiple chains (or actors) across multiple steps in a cyclic graph topology.
This is crucial for complex agentic workflows where agents need to loop, make decisions, call tools, and manage shared state over time.

${"Detailed specification and documentation content. ".repeat(240)}
`;

const staticSystemPrompt = `
Bạn là một trợ lý ảo thông minh.
Bạn có tên là David.

${largeContext}
`.trim();

const inputs = ["Xin chào. Tôi là Dương", "Nói cho tôi về LangGraph"];

let index = 1;

for await (const input of inputs) {
  const turn = await structuredModel.invoke([
    new SystemMessage(staticSystemPrompt),
    new HumanMessage(input),
  ]);

  console.log(`Turn ${index++}:`, turn);
}
