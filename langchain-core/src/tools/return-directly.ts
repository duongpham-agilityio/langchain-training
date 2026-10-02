import { createAgent, HumanMessage, tool } from "langchain";
import * as z from "zod";

const products = [
  {
    id: "product-1",
    name: "Product 1",
    description: "This is product 1",
    price: "$10.0",
  },
  {
    id: "product-2",
    name: "Product 2",
    description: "This is product 2",
    price: "$20.0",
  },
  {
    id: "product-3",
    name: "Product 3",
    description: "This is product 3",
    price: "$30.0",
  },
] as const;

const dataSets = [
  {
    value: "product-1",
    label: "Valid product id",
    returnDirect: false,
  },
  {
    value: "product-5",
    label: "Invalid product id",
    returnDirect: true,
  },
] as const;

for await (const data of dataSets) {
  const searchProductById = tool(
    (id: string) => {
      const product = products.find((p) => p.id === id);

      if (!product) {
        return `Không tìm thấy sản phẩm với id: ${id}`;
      }

      return `Tìm thấy sản phẩm với id: ${id}. \n\n Đây là thông tin của sản phẩm : ${JSON.stringify(product)}`;
    },
    {
      description: "Tìm kiếm sản phẩm theo id",
      name: "searchProductById",
      schema: z.string().describe("id của sản phẩm"),
      returnDirect: data.returnDirect,
    },
  );

  const agent = createAgent({
    model: process.env.AI_MODEL ?? "",
    systemPrompt: `Bạn là một trợ lý chuyên về summary thông tin nhận được từ user`,
    tools: [searchProductById],
  });

  const result = await agent.invoke({
    messages: [
      new HumanMessage({
        contentBlocks: [
          {
            type: "text",
            text: `Lấy cho tôi thông tin của sản phẩm có mã là ${data.value}`,
          },
        ],
      }),
    ],
  });

  console.log(
    "Dưới đây là kết quả trả về từ agent với returnDirect = " +
      data.returnDirect +
      "\n\n",
    result.messages.at(-1)?.contentBlocks.at(-1)?.text,
    "\n\n------------------------------------------------------------\n\n",
  );
}
