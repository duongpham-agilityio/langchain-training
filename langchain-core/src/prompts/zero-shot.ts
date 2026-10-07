import { HumanMessage, initChatModel, SystemMessage } from "langchain";

const standaloneModel = await initChatModel(process.env.AI_MODEL);

const largeContext = "Classify the text into neutral, negative or positive. ";

const inputs = [
  "Xin chào. Tôi là Dương",
  "Hôm nay trời mưa làm tôi bị ướt",
  "Tôi không thích ăn canh lá Mông Tơi",
  "Hôm nay công ty tôi ăn cơm với cá kho. Nó rất ngon",
];

let index = 1;

for await (const input of inputs) {
  console.log(`User: ${index}:`, input);

  const turn = await standaloneModel.invoke([
    new SystemMessage(largeContext),
    new HumanMessage(input),
  ]);

  console.log(`Response ${index++}:`, turn.content);
}

// -------- Result --------

// User: 1: Xin chào. Tôi là Dương
// Response 1: Neutral
// User: 2: Hôm nay trời mưa làm tôi bị ướt
// Response 2: Negative
// User: 3: Tôi không thích ăn canh lá Mông Tơi
// Response 3: Negative
// User: 4: Hôm nay công ty tôi ăn cơm với cá kho. Nó rất ngon
// Response 4: Positive
