import { HumanMessage, initChatModel, SystemMessage } from "langchain";

const standaloneModel = await initChatModel(process.env.AI_MODEL);

const largeContext = `
Classify the text into one of: positive, negative, neutral.
Respond with only the label in lowercase.

# Examples

Text: This pho is so delicious, I'll definitely come back!
Label: positive

Text: The delivery was late and the soup was cold.
Label: negative

Text: The shop opens at 8am on weekdays.
Label: neutral

Text: Not bad at all, better than I expected.
Label: positive

Text: The food was delicious, but I couldn't eat it because it contained an ingredient I'm allergic to.
Label: negative
`;

const inputs = [
  "Tôi thấy quán này không hợp khẩu vị. Có thể tôi không ăn ở đây nữa",
  "Tôi khá thích ăn canh bí đỏ",
  "Quán này cũng khá bình thường",
  "Tôi không thể ăn món này mặc dù nó thật sự ngon. Vì tôi không ăn được Mồng tơi",
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

// ---- Result ----

// User: 1: Tôi thấy quán này không hợp khẩu vị. Có thể tôi không ăn ở đây nữa
// Response 1: negative
// User: 2: Tôi khá thích ăn canh bí đỏ
// Response 2: positive
// User: 3: Quán này cũng khá bình thường
// Response 3: neutral
// User: 4: Tôi không thể ăn món này mặc dù nó thật sự ngon. Vì tôi không ăn được Mồng tơi
// Response 4: negative
