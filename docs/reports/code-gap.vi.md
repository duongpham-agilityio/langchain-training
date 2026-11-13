# Báo cáo lỗ hổng mã nguồn: trạng thái sau các bản sửa GF

Kiểm tra trên `practices` @ 186c051 (đã gộp #127 đến #136), 2026-11-13. Trạng thái được đọc từ mã trên commit này, không lấy từ tiêu đề PR. `docs/reports/repro/run.sh` (typecheck, lint, build và bốn script repro) chạy qua.

Báo cáo review gốc với danh sách G-xx đầy đủ chưa từng được commit. File này được dựng lại từ các issue GF (#115 đến #125), nên chỉ liệt kê các gap mà các issue đó nêu: G-03, G-05, G-06, G-08, G-10, G-11, G-13, G-14, G-15, G-17, G-18. Các G-xx khác của review gốc không nằm trong file này.

Bản tiếng Anh: [code-gap.md](code-gap.md).

## Trạng thái từng gap

| Gap | Vấn đề | Ticket | PR | Trạng thái | Bằng chứng trên `practices` |
| --- | --- | --- | --- | --- | --- |
| G-03 | Tool tạo bản nháp ném lỗi khi đọc version thất bại; chữ lỗi DB thô tới chat | #115 (GF-02) | #128 | đã sửa | `tools/release-notes-preview.ts` trả `ok: false` với `RELEASE_NOTES_VERSION_ERROR`; lỗi thật chỉ ghi log ở server |
| G-05 | Thread cũ mở ra trống sau khi restart server | #122 (GF-16) | #133 | đã sửa (mã); chưa kiểm lại restart thật | `runner/checkpoint-agent-runner.ts` phát lại `toAguiMessages(state.values.messages)`; repro 122: chủ thread nhận `MESSAGES_SNAPSHOT` kèm tool call, người khác nhận 0 event |
| G-06 | Server bỏ qua bản nháp đang hiện trên màn hình (`input.context`) | #117 (GF-10) | #135 | đã sửa | `agui/index.ts` đọc `findDraftContext(input.context)`; repro 117 in `true` |
| G-08 | Tên định dạng như "GitHub", "App Store" bị từ chối | #116 (GF-09) | #127 | đã sửa | bảng alias `RELEASE_FORMAT_ALIASES` áp dụng trước khi kiểm danh sách cho phép |
| G-10 | `threads.updated_at` chỉ ghi một lần | #120 (GF-14) | #131 | đã sửa | `touchThread` được gọi từ thread gate; repro 119-120: `updated>created=true`, "updated_at moved" |
| G-11 | Chat mới hiện UUID; thiếu dòng khi tạo title lỗi hoặc lượt đầu bị chặn | #120 (GF-14), #121 (GF-15) | #131, #132 | đã sửa | repro 119-120: dòng tồn tại, title điền sau; repro 121: sidebar hiện "New chat" cho id và title rỗng |
| G-13 | Người dùng đăng nhập nào cũng đọc và tiếp tục được thread theo id | #119 (GF-13) | #131 | đã sửa | `identifyUser` trên `CopilotRuntime`; repro 119-120: người thứ hai nhận `RUN_ERROR`, không đọc state của graph |
| G-14 | Gửi lại (retry) lưu tin nhắn người dùng hai lần | #118 (GF-12) | #130 | đã sửa | `toLangChainMessages` truyền `id` AG-UI vào `HumanMessage`. Không có script nào trong repo (block G-14 của `agent-gaps` chưa từng được commit) |
| G-15 | Web tính "hôm nay" theo America/New_York, server đóng dấu theo múi giờ trình duyệt | #123 (GF-17) | #129 | đã sửa | web dùng `getBrowserTimeZone()` trong `release-title.ts` và phần nhóm theo thời gian; `RELEASE_NOTES_DEFAULT_TIME_ZONE` đã bị xoá khỏi web |
| G-17 | Hằng số và schema sao chép tay giữa `apps/ai` và `apps/web` | #124 (GF-18) | #136 | đã sửa | `packages/contracts` (`@training/contracts`) được cả hai app dùng; `PLATFORM_CHARACTER_LIMITS` đã xoá. Ba route server không có nơi gọi từ web được giữ lại và ghi chú trong `apps/ai/CLAUDE.md` |
| G-18 | Tài liệu và comment trỏ tới thứ không còn (Mastra, migration đã xoá) | #121 (GF-15, comment ở web), #125 (GF-19) | #132, #134 | đã sửa | không còn `Mastra` hay `tripwire` trong `apps/*/src`; `apps/ai/CLAUDE.md` đã cập nhật |

## Còn mở (không phải bản sửa gap, theo dõi ở issue riêng)

| Mục | Vì sao còn mở | Issue |
| --- | --- | --- |
| Migration `release_history` / `release_sends` chưa áp dụng vào database Supabase dev | Cần người có quyền vào project dev; tới khi áp dụng, bước tra version của tool tạo bản nháp sẽ lỗi ở đó | #109 |
| Route History vẫn đọc/ghi các cột phẳng cũ; chưa có gì đọc `release_sends`; `GET /release-history` lỗi trên database có schema mới | Là việc tính năng (F-11, F-12), ngoài phạm vi các bản sửa gap | #80, #81 |
| Draft card / Live Preview theo kết quả mới (F-10) | Việc tính năng | #79 |
| Kiểm tra chất lượng câu trả lời theo release object (F-14) | Việc tính năng | #83 |
| Chưa có kiểm tra thường trực: các block repro chưa phải test | Chưa có test runner | #70 |

## Kiểm tra thường trực (xây khi #70 xong, chưa xây bây giờ)

- 117: khối ngữ cảnh bản nháp chỉ nằm ở tin nhắn người dùng mới nhất và không vào checkpoint.
- 119-120: chủ thread thứ hai bị từ chối; `updated_at` thay đổi; dòng tồn tại sau khi gọi tạo title lỗi.
- 122: runner sau restart phát lại tin nhắn và tool call, chỉ cho chủ thread.
- 121: `ThreadListItem` hiện "New chat" cho UUID hoặc title rỗng.
- Hiện thiếu và nên thêm: alias G-08, một tin nhắn người dùng duy nhất cho G-14, "Today" cho release lúc 22:00 ở Los Angeles (G-15), `ok: false` khi version lưu sai (G-03).

## Chưa kiểm chứng

- Báo cáo này không chạy lại trên trình duyệt thật. Chưa bao gồm: G-05 sau restart `pnpm dev:ai` thật, kiểm tra hai tài khoản cho G-13, và luồng bản nháp Slack của #109.
- #130 ghi nhận card `renderReleaseNotesPreview` từng hiện "sent unusable data" khi model gọi tool với bản preview streaming; chưa kiểm lại ở đây.
