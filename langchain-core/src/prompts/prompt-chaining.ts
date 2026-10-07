import {
  createAgent,
  HumanMessage,
  initChatModel,
  SystemMessage,
  tool,
} from "langchain";
import * as z from "zod";

const CommitsSchema = z.object({
  commits: z.array(
    z.object({
      hash: z.string().describe("Hash của commit, giữ nguyên như input"),
      type: z.enum(["feat", "fix", "refactor", "docs", "chore", "other"]),
      scope: z
        .string()
        .nullable()
        .describe("Scope trong type(scope); null nếu không rõ"),
      summary: z
        .string()
        .describe(
          "Mô tả ngắn bằng tiếng Việt, dễ hiểu cho người không đọc code",
        ),
    }),
  ),
});

const clarify = tool(
  (input: string) => {
    const classifyPrompt = `
Bạn là assistant phân loại commit để chuẩn bị viết release notes.

# Nhiệm vụ
Phân loại TỪNG commit trong <commits> (mỗi dòng là một commit: "<hash> <message>").

# Quy tắc
- type: một trong feat | fix | refactor | docs | chore | other
- Nếu commit theo Conventional Commits ("type(scope): mô tả"), lấy type và scope từ đó.
- Nếu không theo chuẩn, suy ra type từ nội dung; scope là null nếu không rõ.
- summary: mô tả ngắn bằng tiếng Việt, dễ hiểu cho người không đọc code.
- Không bỏ sót, không gộp commit, không thêm thông tin không có trong commit.
- Chỉ trả về JSON trong <result></result>, không giải thích thêm.

# Ví dụ
<commits>
d7b63b9 feat(prompts): add zero-shot, few-shot and chain-of-thought examples
a12f9c0 fix(memory): thread id lost after page reload
9e4b2d1 update readme
</commits>
`;

    const userMessage = `<commits>\n${input}\n</commits>`;

    return standaloneModel
      .withStructuredOutput(CommitsSchema)
      .invoke([
        new SystemMessage(classifyPrompt),
        new HumanMessage(userMessage),
      ]);
  },
  {
    name: "clarify",
    description: "Làm rõ các commits dựa trên đầu vào của người dùng",
    schema: z.string().describe("Yêu cầu của user"),
  },
);

const commit = `
commit d7b63b9a10dbf75ebd89f2513a8a4a318f5c6d36 (HEAD -> examples, origin/examples)
Author: duong.pham <duong.pham@asnet.com.vn>
Date:   Wed Oct 7 14:45:35 2026 +0700

    feat(prompts): add zero-shot, few-shot and chain-of-thought examples

commit b5f54cdd43735cbe96e8d15a6e12a5b3f67af68d
Author: duong.pham <duong.pham@asnet.com.vn>
Date:   Mon Oct 5 16:04:31 2026 +0700

    feat(agent): add runtime context example with dynamic prompt middleware

commit 07fdc763c4a2f0b4dc0b9c95d762a4ec038d3c10
Author: duong.pham <duong.pham@asnet.com.vn>
Date:   Mon Oct 5 14:13:47 2026 +0700

    feat(agent): add news agent practice with summary tool

commit 4416ff611b87cd19ab0868e7c622d8fee6da76e9
Author: duong.pham <duong.pham@asnet.com.vn>
Date:   Mon Oct 5 09:54:27 2026 +0700

    feat(memory): read thread messages via agent.getState in short-term example
`;

const buildRelease = tool(
  async (input: string) => {
    const parser = await clarify.invoke(input);

    const changes = parser.commits
      .map(
        (commit) =>
          `- ${commit.type}${commit.scope ? `(${commit.scope})` : ""}: ${commit.summary} (${commit.hash})`,
      )
      .join("\n");

    const buildReleasePrompt = `
Bạn viết release notes bằng tiếng Việt cho người dùng sản phẩm.
Đầu vào là danh sách thay đổi ĐÃ được phân loại trong <changes>.

# Quy tắc
- Nhóm theo loại: Tính năng mới (feat), Sửa lỗi (fix), Khác.
- Mở đầu bằng 1–2 câu tóm tắt điểm nổi bật.
- Không thêm thay đổi nào không có trong <changes>. Giữ hash ở cuối mỗi mục.
`;

    const res = await standaloneModel.invoke([
      new SystemMessage(buildReleasePrompt),
      new HumanMessage(`<changes>\n${changes}\n</changes>`),
    ]);
    return res.text;
  },
  {
    name: "buildRelease",
    description: "Tạo release notes",
    schema: z.string().describe("Yêu cầu của user"),
  },
);

const inputs = [
  "Giúo tôi clean commit bên dưới",
  "Giúp tôi tạo 1 release notes",
].map((input) => `${input} \n\n ${commit}`);

let index = 1;

const standaloneModel = await initChatModel(process.env.AI_MODEL);
const agent = createAgent({
  systemPrompt: `Bạn là một assistant sẽ hỗ trợ user làm việc với clarify commits và xây dựng release notes dựa trên commits`,
  model: standaloneModel,
  tools: [clarify, buildRelease],
});

for await (const input of inputs) {
  console.log(`User: ${index}:`, input, "\n");

  const turn = await agent.invoke({
    messages: [new HumanMessage(input)],
  });

  console.log(`Response: ${index++}:`, turn.messages.at(-1)?.content, "\n\n");
}
