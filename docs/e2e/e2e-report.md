# E2E report: Release Notes Builder (LangChainJS)

- Ngày chạy: 2026-11-16
- Cách chạy: Playwright MCP, context **incognito** riêng (`incognito-test`), viewport desktop, LLM thật.
- Tài khoản: `test@asnet.com.vn` (chính), `demo@asnet.com.vn` (kiểm tra cô lập dữ liệu và template).
- Chuẩn so sánh: [docs/practice-plan/README.md](../practice-plan/README.md).
- Ngoài phạm vi theo yêu cầu: Scheduled Slack send, Email sender. Gửi Slack thật cũng bỏ qua (xem Môi trường).
- Ảnh minh họa: thư mục [screens/](screens/).

## Môi trường và cách chạy (quan trọng cho người fix)

1. DB đang kết nối có đủ bảng, nhưng nằm ở schema `release-builder-dev`, còn `search_path` của kết nối là `"$user", public, extensions`. Code truy vấn `release_history` không kèm schema nên lỗi `42P01` (xem BUG-01). Để test tiếp, tôi chạy agent server với `DATABASE_URL` thêm `options=-c search_path="release-builder-dev",public` (chỉ trong lúc chạy, không sửa `.env`).
2. Chạy `pnpm dev` qua turbo sẽ **không** truyền `DATABASE_URL` ghi đè xuống app; phải chạy `pnpm --filter @training/ai dev` trực tiếp.
3. `SLACK_WEBHOOK_URL` chưa cấu hình, nên không thể kiểm tra gửi Slack thành công. Phần Slack chỉ kiểm tra approval card, Reject, và xử lý lỗi.
4. Độ trễ: các trang History, Changelog, danh sách thread mất khoảng 6 đến 9 giây để tải (DB từ xa). Không tính là bug.

## Kết quả theo feature

| Feature | Kết quả |
| :---- | :---- |
| Sign-in email/password, sai mật khẩu, sign out, route bảo vệ | Đạt |
| Sign-in GitHub | Không test (cần tài khoản GitHub bên ngoài) |
| Dán git log, tóm tắt đếm (Features/Fixes/Internal/Total/Breaking) | Đạt |
| Preview Markdown, App Store, Google Play, Slack, JSON, HTML email | Đạt (sau khi vượt BUG-01) |
| Vượt giới hạn ký tự (Google Play 500) | Đạt: báo lỗi "2442 characters; the limit is 500", không cắt |
| Live Preview, Archive, Toast | Đạt |
| Release History: danh sách, search, filter Sent/Not sent, chi tiết, đổi format | Đạt (còn BUG-09) |
| Changelog: danh sách, lọc theo version | Đạt; thiếu lọc change type (GAP-03); pagination chưa kiểm được (chỉ 5 release) |
| Thread: tạo, tự đặt tên, reload thread, tiếp tục chat | Đạt (còn BUG-07) |
| Chặn prompt injection | Đạt với mẫu rõ ràng; có false positive (BUG-04) |
| Redact PII (email, phone) | Đạt (tác dụng phụ ở BUG-10) |
| Edit trực tiếp trên preview: chọn câu, Accept, Reject | Đạt cho Markdown; còn BUG-03, GAP-02 |
| Cô lập dữ liệu giữa 2 user (History theo id: 404; không token: 401; thread của người khác) | Đạt |
| User template (khác nhau giữa 2 user) | Một phần: demo có template và áp dụng đúng; test không lưu được (BUG-04, GAP-01) |
| Ask AI về changelog | Một phần: có câu trả lời sai (BUG-05) |
| Slack publish từ chat và từ History | Approval card và Reject đạt; gửi thật không test được; lỗi cấu hình thiếu (BUG-08) |
| Model fallback, tracing, đánh giá chất lượng, conversation memory (tóm tắt tin cũ) | Không kiểm tra được từ UI |

## Bug

### BUG-01 (Blocker): Truy vấn bảng không kèm schema, preview, History, Changelog, Slack đều hỏng

1. **Mô tả bug**: Các bảng `release_history`, `release_sends`, `scheduled_sends`, `threads` nằm ở schema `release-builder-dev`. `threads` và checkpointer dùng tên có schema (`DB_SCHEMA`), còn `apps/ai/src/db/release-history.ts` và các file `db/` khác truy vấn `release_history` không kèm schema, trong khi `createPgPool` ([apps/ai/src/db/pg.ts](../../apps/ai/src/db/pg.ts)) không đặt `search_path`. Migration trong `supabase/migrations/` thì tạo bảng ở `public`. Kết quả: trên DB này mọi truy vấn history đều lỗi `relation "release_history" does not exist`.
2. **Repro**:
   1. Chạy `pnpm dev` với `DATABASE_URL` của project (search_path mặc định).
   2. Đăng nhập `test@asnet.com.vn`, dán một git log, chọn "Markdown".
   3. Kết quả: thẻ lỗi đỏ "Release Builder sent unusable data for renderReleaseNotesPreview" kèm đoạn JSON lỗi Zod rất dài; assistant nói "I couldn't determine the next release version". Log server: `[ai] next release version failed: error: relation "release_history" does not exist` (code `42P01`), tại `getLatestReleaseVersion`.
   4. History, Changelog và Archive cũng không dùng được. Ảnh: [03-preview.png](screens/03-preview.png) (sau khi sửa môi trường).

### BUG-02: Lỗi của tool preview hiện ra thành dump Zod cho người dùng

1. **Mô tả bug**: Khi tool `renderReleaseNotesPreview` thất bại do lỗi DB, kết quả không khớp bất kỳ nhánh nào của schema kết quả ở client, nên UI hiện thẻ "sent unusable data" kèm JSON lỗi dài thay vì thông báo lỗi dễ hiểu. Câu "Try again" không có tác dụng vì lỗi là cố định.
2. **Repro**: như BUG-01 (hoặc làm tool lỗi bằng bất kỳ cách nào khiến nó trả kết quả không có `ok` và `release`). Thấy thẻ lỗi ở bước 3 của BUG-01.

### BUG-03: Yêu cầu sửa trên preview hiển thị nguyên JSON trong bubble chat của người dùng

1. **Mô tả bug**: Khi gửi yêu cầu "make it shorter" từ menu chọn câu, bubble tin nhắn của người dùng chứa toàn bộ chỉ dẫn nội bộ: "Edit one item of the release notes draft...", `Draft hash`, và cả `Release object: {...}` JSON. Dài, khó đọc, lộ chi tiết nội bộ.
2. **Repro**:
   1. Tạo preview Markdown cho một git log.
   2. Bôi đen câu "Added coupon code support to the cart" trong Live Preview, nhập "make it shorter" vào "How should this change?", Enter.
   3. Xem khung chat: bubble người dùng chứa JSON. Ảnh: [13-edit-proposal.png](screens/13-edit-proposal.png).

### BUG-04: Guard prompt-injection chặn nhầm yêu cầu lưu preferences hợp lệ

1. **Mô tả bug**: Yêu cầu lưu tone, style, opening line bị phân loại là injection và trả lời "I can't follow that request because it looks like an attempt to override my instructions". Vì vậy tài khoản `test` không thể lưu template qua chat (đây là đường duy nhất, xem GAP-01). Tài khoản `demo` có template từ trước.
2. **Repro**:
   1. Đăng nhập `test@asnet.com.vn`, mở thread mới.
   2. Gửi: `Remember my preferences: tone is very formal, writing style is concise bullet points, and the opening line should always be "Dear valued customers,".`
   3. Kết quả: bị từ chối. Thử diễn đạt khác: `Please save my release note style: formal tone, short bullet writing style, opening line "Dear valued customers,".` cũng bị từ chối (2/2 lần).
   4. Ảnh: [17-template.png](screens/17-template.png).

### BUG-05: Ask AI về changelog trả lời sai so với dữ liệu đã lưu

1. **Mô tả bug**: Câu trả lời ghi "v6.0.0 — No fixes", trong khi trang Changelog cho thấy v6.0.0 có fix "Fixed a crash when logging in with an empty password". Việc chỉ dùng bản ghi thật chỉ được bảo đảm bằng prompt, không có kiểm tra bằng code, nên model bỏ sót dữ liệu.
2. **Repro**:
   1. Đăng nhập `test@asnet.com.vn` (có release v1.0.0, v6.0.0 đến v9.0.0).
   2. Mở trang Changelog, xem v6.0.0 có mục FIXES.
   3. Ở dashboard gửi "What fixes were released in November 2026?".
   4. Kết quả: "Found 5 fixes across 4 releases", v6.0.0 ghi "No fixes". Ảnh: [16-ask-changelog.png](screens/16-ask-changelog.png).

### BUG-06: Câu hỏi bị bỏ sót khi agent hỏi lại làm rõ (Ask AI)

1. **Mô tả bug**: Hỏi liên tiếp hai câu thiếu năm: agent hỏi lại "Which year...?" cho cả hai. Trả lời "2026" chỉ được áp dụng cho câu thứ hai (September), câu November bị bỏ.
2. **Repro**:
   1. Gửi "What fixes were released in November?" và nhận câu hỏi lại về năm.
   2. Không trả lời, gửi tiếp "What features were released in September?" và nhận câu hỏi lại.
   3. Gửi "2026": chỉ nhận câu trả lời cho September.

### BUG-07: Thread mới không ghi `?thread=<id>` lên URL, reload mất thread

1. **Mô tả bug**: Theo `apps/web/CLAUDE.md`, id thread nằm trong URL. Thực tế sau khi gửi tin nhắn đầu tiên trong thread mới, URL vẫn là `/`. Chỉ khi chọn lại thread từ sidebar mới thấy `/?thread=...`. Reload ngay sau khi chat sẽ về màn hình trống.
2. **Repro**:
   1. Nhấn "New thread", gửi một tin nhắn, chờ trả lời.
   2. Xem URL: `http://localhost:5173/`.
   3. Reload: màn hình "How can I help with your release notes?" (conversation vẫn còn trong sidebar).

### BUG-08: Lỗi Slack lộ tên biến môi trường và hướng dẫn `.env` cho người dùng cuối

1. **Mô tả bug**: Khi thiếu webhook, UI hiển thị "Missing required env var: SLACK_WEBHOOK_URL. Set it in .env, then restart the server." trong toast, trong mục Sends của History và lưu thành một dòng `Failed` trong `release_sends`. Trong chat cũng nói "SLACK_WEBHOOK_URL is missing". Thông tin cấu hình nội bộ không nên đến người dùng. Mỗi lần thử còn thêm một dòng Failed mới.
2. **Repro** (môi trường chưa có `SLACK_WEBHOOK_URL`):
   1. Vào History, chọn v9.0.0, nhấn "Send to Slack".
   2. Thấy toast "Couldn't send to Slack" kèm tên env var, và dòng `Failed` trong mục Sends. Ảnh: [21-history-slack.png](screens/21-history-slack.png).
   3. Trong chat: tạo preview, nhấn "Send to Slack", Approve: "Nothing was sent—Slack is not configured because SLACK_WEBHOOK_URL is missing."

### BUG-09: Chi tiết History hiển thị markdown thô

1. **Mô tả bug**: Trong chi tiết History (format GitHub Markdown), mục breaking hiện chữ `**Breaking:** Removed...` với dấu sao thật, trong khi Live Preview ở dashboard hiển thị in đậm đúng. Ngoài ra tiêu đề chi tiết dùng cả câu opening line làm H1 rất lớn, che khuất thông tin version.
2. **Repro**: History, chọn v9.0.0, cuộn đến mục Fixes. Ảnh: [21-history-slack.png](screens/21-history-slack.png).

### BUG-10 (Thấp): Placeholder PII lọt vào nội dung release notes

1. **Mô tả bug**: Email và số điện thoại được redact thành `[REDACTED_EMAIL]`, `[REDACTED_PHONE]` ngay ở input, và model đưa nguyên placeholder vào release notes: "Notified [REDACTED_EMAIL] and called [REDACTED_PHONE] when a login failure occurred". Không lộ PII nhưng nội dung xuất bản mang placeholder vô nghĩa.
2. **Repro**: gửi `abc1234 feat(auth): notify john.doe@example.com and call +84 912 345 678 on login failure` rồi chọn "App Store". Ảnh: [10-appstore-pii.png](screens/10-appstore-pii.png).

### BUG-11 (Thấp, cần xác nhận): Tin nhắn đầu tiên đôi khi không gửi đi

1. **Mô tả bug**: Quan sát 1 lần: nhấn "New thread" rồi ngay lập tức điền và nhấn Enter, văn bản vẫn nằm trong ô nhập và server không nhận request chạy agent. Nhấn Enter lần nữa thì gửi bình thường. Chưa tái hiện lại nhiều lần.
2. **Repro**: tải `/`, nhấn "New thread", điền ngay một git log và nhấn Enter trong khoảng 1 giây.

### BUG-12 (Thấp): Cảnh báo console cho tool `load_skill`

1. **Mô tả bug**: Console dev báo `[CopilotKit] The agent called the tool "load_skill", and no renderer is registered` mỗi lượt có load skill. Không ảnh hưởng người dùng.
2. **Repro**: mở console, gửi một git log, đọc cảnh báo.

## Gap (so với README)

### GAP-01: Không có nơi để người dùng lưu User template

1. **Yêu cầu thực tế**: "Each user saves tone, writing style, and an opening line. The agent applies them to every later generation." Done when: hai user khác template cho kết quả khác; sửa template đổi lần generate kế tiếp. Người dùng cần một cách thấy và sửa template.
2. **Behavior hiện tại**: Chỉ lưu bằng cách nhờ agent trong chat (`saveUserPreferences`), không có màn hình xem/sửa/xóa template. Việc áp dụng đúng: tài khoản `demo` (đã có template) tạo ra opening line "Hello Team Rocket, fresh release inbound!", tài khoản `test` cho "This release adds fuzzy search and fixes cart total rounding" cùng một input. Nhưng khi lưu qua chat bị guard chặn nhầm (BUG-04). Việc "sửa template đổi lần generate kế" chưa kiểm được vì không lưu được trên `test`.

### GAP-02: Edit trực tiếp trên preview chỉ hoạt động ở định dạng render theo mục

1. **Yêu cầu thực tế**: "Select a sentence, ask for a change in a chat menu, then Accept or Reject". Done when: chỉ đổi đúng text đã chọn; Reject không đổi; draft cũ bị từ chối. Không giới hạn theo format.
2. **Behavior hiện tại**: Menu "How should this change?" chỉ xuất hiện trên preview Markdown/HTML có mục render. Với định dạng text thuần (App Store, Google Play, Slack) bôi đen câu không hiện menu, không báo lý do. Chặn draft cũ (`checkEditHash`) có trong code nhưng chưa được kiểm bằng UI.

### GAP-03: Changelog thiếu bộ lọc change type

1. **Yêu cầu thực tế**: "A page to browse all past releases with filters (date, change type, version) and pagination."
2. **Behavior hiện tại**: Chỉ có Version, From, To (và Apply/Clear). Không có lọc theo loại thay đổi (feature, fix, internal, docs). Pagination chưa kiểm được vì tài khoản `test` chỉ có 5 release (chưa thấy nút/tải thêm).

### GAP-04: Ask AI về changelog chưa đạt "chỉ dùng bản ghi hiện có"

1. **Yêu cầu thực tế**: "The agent turns the question into a time range and change type, reads the matching records, and summarizes only those." Done when: câu trả lời chỉ dùng bản ghi có thật; kết quả rỗng được nói rõ; mốc tháng đúng theo múi giờ người dùng; user này không thấy dữ liệu user kia.
2. **Behavior hiện tại**: Kết quả rỗng được nói rõ ("Nothing was found for September 2026"), và cô lập dữ liệu đạt. Nhưng agent hỏi lại năm thay vì mặc định năm hiện tại (2026), và có lỗi nội dung (BUG-05) vì tính đúng đắn chỉ dựa vào prompt, không có bước kiểm bằng code. Biên tháng theo múi giờ chưa kiểm được ở UI.

### GAP-05: Đảm bảo "Sent" và gửi Slack chưa kiểm chứng được

1. **Yêu cầu thực tế**: Slack publish từ chat và History hoạt động như app cũ; "Sends are recorded per release, which also fixes the Sent gap."
2. **Behavior hiện tại**: Không có webhook nên chỉ kiểm được approval card, Reject (không gửi gì) và hiển thị lỗi; chưa xác nhận được nhãn "Sent" sau khi gửi thành công, và lọc "Sent" luôn rỗng (0 release). Cần chạy lại khi có `SLACK_WEBHOOK_URL`.

### GAP-06: Chưa có đường kiểm tra parity với app cũ

1. **Yêu cầu thực tế**: "Parity check: run the input set on the old and new app. Both apps give matching results."
2. **Behavior hiện tại**: Không có input set hoặc kết quả đối chiếu của app cũ trong repo, nên không thể xác nhận parity trong lần e2e này.
## Thứ tự ưu tiên đề xuất

1. BUG-01 (blocker), BUG-02
2. BUG-04, GAP-01 (template dùng được end to end)
3. BUG-05, GAP-04, BUG-06 (Ask AI)
4. GAP-03, GAP-02
5. BUG-03, BUG-07, BUG-08, BUG-09, BUG-10, BUG-11, BUG-12
6. GAP-05, GAP-06 (cần môi trường và dữ liệu)
