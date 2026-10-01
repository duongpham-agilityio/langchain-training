// Add tool to agent

import { createAgent, tool } from "langchain";
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
  },
);

const agent = createAgent({
  model: "openai:gpt-4o-mini",
  systemPrompt: `Bạn là một trợ lý chuyên về summary thông tin nhận được từ user`,
  tools: [searchProductById],
});

const dataSets = [
  {
    value: "product-1",
    label: "Valid product id",
  },
  {
    value: "product-5",
    label: "Invalid product id",
  },
] as const;

dataSets.forEach(async (dataSet) => {
  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content: `Lấy cho tôi thông tin của sản phẩm có mã là ${dataSet.value}`,
      },
    ],
  });

  console.log(result.messages.at(-1)?.content);
});
