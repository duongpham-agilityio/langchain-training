import { HumanMessage, initChatModel, SystemMessage } from "langchain";

const standaloneModel = await initChatModel(process.env.AI_MODEL);

const largeContext = `
Bạn là trợ lý AI giúp phân loại commit

# Examples
Commit: "refactor: rename getUser() to fetchUser() in public SDK"

Theo tôi thấy commit này đại điện cho việc tên hàm trong public SDK → code người dùng đang gọi getUser()
sẽ lỗi. Dù prefix là refactor, đây là thay đổi không tương thích ngược. Thi commit này được xem là **breaking-change**

Commit: "fix: correct typo in README"
Trong commit này chỉ sửa tài liệu nội bộ, không ảnh hưởng người dùng. Nó là loại **skip**

Commit: "feat: add dark mode toggle in settings"
Commit này có tính năng mới, người dùng nhìn thấy được, không phá vỡ gì cũ. Đây là **feature
`;

const inputs = [
  "feat(memory): add MemorySaver checkpointer to short-term example",
  "feat(agent): add news agent practice with summary tool",
  "refactor(agent): move first agent example from step-1 to agent.ts",
  "chore(skills): add gitlab workflow skill",
];

let index = 1;

for await (const input of inputs) {
  console.log(`User: ${index}:`, input, "\n");

  const turn = await standaloneModel.invoke([
    new SystemMessage(largeContext),
    new HumanMessage(input),
  ]);

  console.log(`Response ${index++}:`, turn.content, "\n\n");
}

// ---- Result ----

// User: 1: feat(memory): add MemorySaver checkpointer to short-term example
// Response 1: Commit này giới thiệu một tính năng mới, cụ thể là một "MemorySaver checkpointer" cho ví dụ ngắn hạn. Đây là một bổ sung có thể mang lại lợi ích cho người dùng mà không làm ảnh hưởng đến các tính năng hiện có. Do đó, commit này được xem là **feature**.

// User: 2: feat(agent): add news agent practice with summary tool
// Response 2: Commit này giới thiệu một tính năng mới "news agent practice with summary tool", điều này mang lại cho người dùng khả năng sử dụng một công cụ tổng hợp mới. Do đó, commit này được phân loại là **feature**.

// User: 3: refactor(agent): move first agent example from step-1 to agent.ts
// Response 3: Commit này liên quan đến việc tái cấu trúc mã nguồn mà không phá vỡ chức năng hiện tại. Việc di chuyển ví dụ đầu tiên của agent từ step-1 đến agent.ts không ảnh hưởng đến người dùng và không làm thay đổi các chức năng đang có. Vì vậy, commit này được xem là **skip**.

// User: 4: chore(skills): add gitlab workflow skill
// Response 4: Commit này liên quan đến việc thêm một kỹ năng vào danh sách hoặc tài liệu mà không ảnh hưởng đến mã nguồn hoặc chức năng của hệ thống. Đây là một thay đổi không ảnh hưởngđến người dùng trực tiếp và thường được xem là một nhiệm vụ bảo trì hoặc cải tiến tài liệu.Do đó, commit này là **chore**.
