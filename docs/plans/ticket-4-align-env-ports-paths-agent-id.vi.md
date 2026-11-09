# Plan: [M-01] Đồng bộ env, port, path và agent id giữa web và server

## Mục tiêu
Web và server dùng chung một địa chỉ runtime, điều khiển qua env: web dựng URL CopilotKit từ `VITE_API_SERVER_URL` cộng `COPILOTKIT_ROUTE_PATH`, khớp với `:4000` + `/api/copilotkit` của server. Server đăng ký agent là `releaseCopilotAgent`, nên tin nhắn chat từ web tới được agent. `pnpm dev` chạy cả hai app, không có banner lỗi kết nối.

## Giả định
- Port và path: giá trị nào cũng được miễn hai bên khớp nhau; mặc định `:4000` và `/api/copilotkit` (đã trả lời trong doc analysis).
- Bỏ `VITE_COPILOTKIT_RUNTIME_URL`; runtime URL là `VITE_API_SERVER_URL` + `COPILOTKIT_ROUTE_PATH` (đã trả lời, phương án B).
- Chưa xác nhận: repo chưa có test runner và không có file `*.test.*` (`apps/ai` chỉ có `typecheck` và `build`; `apps/web` có `lint` và `build`). Thêm runner cần dependency mới, nên không thêm test tự động; kiểm tra bằng typecheck, lint, build và chạy tay.
- Chưa xác nhận: các file `.env` chưa được track (`apps/ai/.env`, `apps/web/.env`) có thể còn giá trị cũ (`:4111`, `VITE_COPILOTKIT_RUNTIME_URL`); dev phải sửa tay. `apps/ai` khi dev còn load `../web/.env`, nên `AI_PORT` ở đó sẽ ghi đè.
- Chưa xác nhận: client CopilotKit v2 tự nối thêm sub-path vào `runtimeUrl`, nên giá trị phải đúng bằng `basePath` của server (không có dấu `/` ở cuối).

## Các bước
1. Code (server): đăng ký agent với id mà web gọi.
   Files: `apps/ai/src/index.ts`, `apps/ai/src/constants/server.ts` - Thay đổi: trong `CopilotRuntime({ agents })` đổi key `default` thành `releaseCopilotAgent`, định nghĩa một lần thành hằng số có tên trong `constants/server.ts` (không viết thẳng). Giữ `DEFAULT_PORT = 4000` và `RUNTIME_BASE_PATH = "/api/copilotkit"`.
2. Code (web, path): cho path khớp với server.
   Files: `apps/web/src/constants/endpoints.ts` - Thay đổi: đặt `COPILOTKIT_ROUTE_PATH` thành `/api/copilotkit`.
3. Code (web, URL): dựng runtime URL từ origin của server cộng route path.
   Files: `apps/web/src/providers/AppProviders.tsx`, `apps/web/src/lib/env.ts` (hoặc helper nhỏ mới cạnh đó) - Thay đổi: thay `import.meta.env.VITE_COPILOTKIT_RUNTIME_URL` bằng `getRequiredEnv(import.meta.env.VITE_API_SERVER_URL, 'VITE_API_SERVER_URL')` nối với `COPILOTKIT_ROUTE_PATH`, cắt dấu `/` cuối của origin. Thiếu `VITE_API_SERVER_URL` sẽ báo lỗi có tên biến như hiện tại.
4. Code (file env và type): bỏ biến cũ, trỏ về port của server.
   Files: `apps/web/.env.example`, `apps/web/src/vite-env.d.ts` - Thay đổi: `.env.example` chỉ giữ `VITE_API_SERVER_URL=http://localhost:4000` (xoá `VITE_COPILOTKIT_RUNTIME_URL`); xoá `VITE_COPILOTKIT_RUNTIME_URL` khỏi `ImportMetaEnv`. Grep xác nhận không còn chỗ nào khác đọc biến này.
5. Kiểm tra docs: giữ ghi chú nhất quán.
   Files: `apps/web/CLAUDE.md`, `apps/ai/CLAUDE.md`, `apps/ai/.env.example` - Thay đổi: chỉ sửa nếu có nhắc `:4111`, `/copilotkit` hoặc `VITE_COPILOTKIT_RUNTIME_URL`; `AI_PORT=4000` đã khớp.
6. Kiểm tra tay (không có automation): chạy `pnpm dev`, mở web, xác nhận không có banner lỗi kết nối, gửi một tin nhắn chat, thấy log server nhận request dưới `releaseCopilotAgent`. Thử đổi `AI_PORT` và `VITE_API_SERVER_URL` cùng lúc để xác nhận port điều khiển được qua env.

## Kiểm tra hoàn thành
- `pnpm typecheck`, `pnpm lint`, `pnpm build` đều exit 0 (repo không có script `pnpm test`)
- Grep không còn `4111`, `VITE_COPILOTKIT_RUNTIME_URL` hay agent id đăng ký là `default` trong `apps`
- Chạy tay (bước 6): web kết nối được, không có banner lỗi, tin nhắn chat tới `releaseCopilotAgent`
