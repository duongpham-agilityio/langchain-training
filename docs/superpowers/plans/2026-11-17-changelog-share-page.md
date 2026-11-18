# Changelog Share Page Implementation Plan

> **Dành cho agent thực thi:** REQUIRED SUB-SKILL: dùng superpowers:executing-plans để làm plan này từng task. Các bước dùng checkbox (`- [ ]`) để theo dõi.

**Mục tiêu:** Khi user yêu cầu rõ ràng ("build artifact để gửi PM"), AI build một trang HTML tự chứa, lưu vào Postgres và trả link công khai; câu hỏi changelog thường vẫn trả Markdown như cũ.

**Kiến trúc:** Bảng `public.shared_pages` (migration mới). Tool `publishChangelogPage` kiểm tra rồi chèn một dòng và trả `url`. Route công khai `GET /shared/:file` đọc dòng đó và trả HTML. `vercel.json` thêm rewrite để `/shared/*` đi vào service `ai`. Skill `changelog-page` chứa quy tắc thiết kế; đoạn prompt nói khi nào được dùng. `showChangelogAnswer` và web client không đổi.

**Tech Stack:** Hono trên Vercel, `pg` (pool có sẵn), Supabase migration, LangChain `tool`, zod v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-17-changelog-share-page-design.md`

## Ràng buộc chung

- Code ở `apps/ai`, import qua alias `@/...` và barrel (`@/constants`, `@/schemas`, `@/utils`, `@/db`); arrow function + `export const`; nháy kép, có dấu chấm phẩy (theo `apps/ai/CLAUDE.md`).
- Thêm tool = 3 phần: tên trong `TOOL_NAMES` (`packages/contracts/src/constants.ts`), schema zod trong `schemas/`, `tool(...)` trong `tools/` rồi thêm vào `createTools`.
- Hằng số vào `constants/`, env chỉ đọc trong `config.ts`; tên bảng trong `constants/database.ts`.
- Vercel: đĩa của function chỉ đọc, không ghi file được. Trang phải nằm trong Postgres.
- Id do database sinh (`gen_random_uuid()`), model không chọn id hay đường dẫn.
- `CHANGELOG_PAGE_MAX_LENGTH = 200_000` ký tự; html phải bắt đầu bằng `<!doctype html` (không phân biệt hoa thường, sau khi trim).
- Base URL của link: `AI_PUBLIC_URL`, mặc định `http://localhost:4000`; trên Vercel đặt bằng domain production.
- Không thêm guardrail mới (không CSP, không sandbox); chỉ dựa vào `createPromptInjectionGuard` có sẵn.
- Không commit trong plan này (quy tắc của người dùng): chỉ lưu thay đổi; commit khi họ yêu cầu bằng skill `commit`. Migration chỉ được tạo file, không tự áp lên Supabase; người dùng áp.

## Điểm cần review kỹ (Review Focus)

Mỗi dòng có test ghim ở task sở hữu.

1. Id không phải UUID hoặc đuôi khác `.html` trên route công khai: 404 và không chạm database. (Task 2)
2. Lỗi database khi publish: tool trả `ok: false` với câu cố định, không lộ chi tiết lỗi cho model. Lỗi database khi đọc: route trả 500 với body cố định. (Task 1, 2)
3. `AI_PUBLIC_URL` có dấu `/` ở cuối: link không bị `//shared`. (Task 1)
4. Html có khoảng trắng đầu hoặc `<!DOCTYPE` viết hoa vẫn được nhận; html không phải trang đầy đủ bị từ chối và không có lệnh `insert` nào. (Task 1)
5. Id hợp lệ nhưng không có dòng: 404, không phải 500. (Task 2)

---

### Task 1: Bảng, lớp db và tool `publishChangelogPage`

**Files:**
- Create: `supabase/migrations/20261118000000_create_shared_pages.sql`
- Create: `apps/ai/src/constants/changelog-page.ts`
- Create: `apps/ai/src/schemas/changelog-page.ts`
- Create: `apps/ai/src/utils/shared-page-url.ts`
- Create: `apps/ai/src/db/shared-pages.ts`
- Create: `apps/ai/src/tools/publish-changelog-page.ts`
- Modify: `packages/contracts/src/constants.ts` (thêm `publishChangelogPage: "publishChangelogPage"` vào `TOOL_NAMES`)
- Modify: `apps/ai/src/constants/database.ts` (thêm `SHARED_PAGES_TABLE`)
- Modify: barrel `constants/index.ts`, `schemas/index.ts`, `utils/index.ts`, `db/index.ts`, `tools/index.ts`; `createTools`
- Modify: `apps/ai/src/config.ts` (`publicBaseUrl`), `apps/ai/src/agent/index.ts` (truyền `config.publicBaseUrl` vào `createTools`), `apps/ai/.env.example` (thêm `AI_PUBLIC_URL`)
- Test: `apps/ai/src/tools/publish-changelog-page.test.ts`, `apps/ai/src/utils/shared-page-url.test.ts`

**Interfaces:**
- Produces:
  - Migration: `public.shared_pages(id uuid pk default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, title text not null, html text not null, created_at timestamptz not null default now())`, bật RLS và không có policy (server dùng pool trực tiếp), theo phong cách file migration có sẵn.
  - `constants/changelog-page.ts`: `CHANGELOG_PAGE_MAX_LENGTH = 200_000`, `SHARED_PAGES_PATH = "/shared"`, `DEFAULT_PUBLIC_URL = "http://localhost:4000"`, `SHARED_PAGE_FILE_PATTERN` (UUID + `.html`), `CHANGELOG_PAGE_MESSAGES = { NOT_SIGNED_IN, TOO_LONG, NOT_HTML, SAVE_FAILED }` (as const), `PUBLISH_CHANGELOG_PAGE_DESCRIPTION` (chỉ gọi khi user yêu cầu artifact/trang/link để chia sẻ, sau `getChangelog`, một lần).
  - `schemas/changelog-page.ts`: `publishChangelogPageSchema = z.object({ title: string 1..120, html: string min 1 })` kèm `.describe(...)`.
  - `utils/shared-page-url.ts`: `buildSharedPageUrl(baseUrl: string, id: string): string` → `<baseUrl không có "/" cuối>/shared/<id>.html`.
  - `db/shared-pages.ts`: `insertSharedPage(pool: Pool, page: { ownerId: string; title: string; html: string }): Promise<string>` (trả id) và `getSharedPageHtml(pool: Pool, id: string): Promise<string | null>`.
  - `tools/publish-changelog-page.ts`: `createPublishChangelogPage(pool: Pool, baseUrl: string)` trả `tool(...)`; kết quả JSON `{ ok: true, title, url }` hoặc `{ ok: false, error }`.
  - `config.publicBaseUrl: string`; `createTools(pool, store?, publicBaseUrl = DEFAULT_PUBLIC_URL)`.

- [ ] **Bước 1: Viết test thất bại cho `buildSharedPageUrl`** (`utils/shared-page-url.test.ts`): `("http://x:4000", id)` và `("http://x:4000/", id)` đều ra `http://x:4000/shared/<id>.html`.

- [ ] **Bước 2: Chạy** `pnpm --filter @training/ai test shared-page-url` — Expected: FAIL.

- [ ] **Bước 3: Viết constants, schema, `buildSharedPageUrl`, `TOOL_NAMES`**, thêm vào các barrel. Chạy lại bước 2, Expected: PASS.

- [ ] **Bước 4: Viết test thất bại cho tool** (`tools/publish-changelog-page.test.ts`, pool giả `{ query: vi.fn() }` trả `{ rows: [{ id }] }`, `userContext.run({ userId: "u1", timeZone: "UTC" }, ...)` như `show-changelog-answer.test.ts`):
  - thành công: `ok: true`, `url` = `buildSharedPageUrl(base, id)`, `query` được gọi một lần với `u1`, title đã trim và đúng html.
  - không đăng nhập: `ok: false`, `query` không được gọi.
  - html dài hơn `CHANGELOG_PAGE_MAX_LENGTH`: `ok: false`, không gọi `query`.
  - html không phải trang đầy đủ (`<div>x</div>`): `ok: false`, không gọi `query`.
  - khoảng trắng đầu và `<!DOCTYPE html>` viết hoa: `ok: true`.
  - `query` ném lỗi (`new Error("secret detail")`): `ok: false`, `error` bằng `SAVE_FAILED` và không chứa `secret detail`.
  - `baseUrl` có `/` cuối: url không chứa `//shared`.

- [ ] **Bước 5: Chạy** `pnpm --filter @training/ai test publish-changelog-page` — Expected: FAIL.

- [ ] **Bước 6: Viết migration, `db/shared-pages.ts` (SQL tham số hóa như `db/scheduled-sends.ts`), `createPublishChangelogPage`** theo thứ tự kiểm tra: user → độ dài → doctype → insert (bọc try/catch, log lỗi, trả `SAVE_FAILED`). Thêm tool vào `createTools`; sửa `agent/index.ts`, `config.ts`, `.env.example`.

- [ ] **Bước 7: Chạy** `pnpm --filter @training/ai test publish-changelog-page` và `pnpm --filter @training/ai typecheck` — Expected: PASS.

---

### Task 2: Route công khai `/shared/:file` và rewrite Vercel

**Files:**
- Create: `apps/ai/src/routes/shared-pages.ts`
- Modify: `apps/ai/src/routes/index.ts` (barrel), `apps/ai/src/index.ts` (mount), `vercel.json` (rewrite)
- Test: `apps/ai/src/routes/shared-pages.test.ts`

**Interfaces:**
- Consumes: `SHARED_PAGE_FILE_PATTERN`, `getSharedPageHtml` (Task 1).
- Produces: `createSharedPagesRoute(pool: Pool)` trả một `Hono` app có `GET /shared/:file`, không cần đăng nhập.

- [ ] **Bước 1: Viết test thất bại** (`routes/shared-pages.test.ts`, pool giả, `app.request(...)`):
  - id có dòng: 200, `content-type` chứa `text/html`, body đúng html đã lưu.
  - UUID hợp lệ nhưng không có dòng (`rows: []`): 404.
  - `/shared/..%2Fsecret.html`, `/shared/not-a-uuid.html`, `/shared/<uuid>.txt`: 404 và `query` không được gọi.
  - `query` ném lỗi: 500, body là câu cố định không chứa chi tiết lỗi.

- [ ] **Bước 2: Chạy** `pnpm --filter @training/ai test shared-pages` — Expected: FAIL.

- [ ] **Bước 3: Implement `createSharedPagesRoute`**: kiểm `:file` bằng `SHARED_PAGE_FILE_PATTERN` trước, bỏ đuôi `.html` để lấy id, gọi `getSharedPageHtml`, `null` = 404, ngoại lệ = log + 500, thành công = `c.html(html)`. Mount trong `index.ts` ngoài các guard `/api`. Thêm vào `vercel.json`, trước rewrite `/(.*)`: `{ "source": "/shared/(.*)", "destination": { "service": "ai" } }`.

- [ ] **Bước 4: Chạy** `pnpm --filter @training/ai test shared-pages` và `pnpm --filter @training/ai typecheck` — Expected: PASS.

---

### Task 3: Skill `changelog-page` và quy tắc trong prompt

**Files:**
- Create: `apps/ai/src/skills/changelog-page.ts`
- Modify: `apps/ai/src/skills/index.ts` (thêm vào `SKILLS`), `apps/ai/src/constants/changelog-qa.ts` (thêm đoạn quy tắc vào cuối `CHANGELOG_QA_RULE`)
- Test: `apps/ai/src/skills/changelog-page.test.ts`

**Interfaces:**
- Consumes: `TOOL_NAMES.publishChangelogPage` (Task 1).
- Produces: skill `{ name: "changelog-page", description, content }` đúng kiểu `Skill`.

- [ ] **Bước 1: Viết test thất bại**:
  - `SKILLS` có phần tử `changelog-page`.
  - `content` chứa các quy tắc cứng của spec: một tài liệu tự chứa, CSS và JS inline, không script/font/ảnh ngoài, token màu trên `:root` kèm `prefers-color-scheme`, đọc được ở 400px, nội dung hiện sẵn khi tải, chỉ dùng release do `getChangelog` trả về.
  - `SYSTEM_PROMPT` chứa `publishChangelogPage`, `changelog-page` và `showChangelogAnswer`; đoạn mới nêu: chỉ build khi user yêu cầu rõ ràng, tái dùng kết quả `getChangelog` trong thread nếu có (không thì gọi trước), không dán HTML vào chat.

- [ ] **Bước 2: Chạy** `pnpm --filter @training/ai test changelog-page` — Expected: FAIL.

- [ ] **Bước 3: Viết skill** theo định dạng skill có sẵn (module TS `as const`, mô tả một câu nói khi nào load). Nội dung rút gọn từ hướng dẫn artifact-design: token màu, sáng/tối, responsive 400px, bố cục tiêu đề → khoảng thời gian → mỗi release một mục (version, ngày, thay đổi nhóm theo loại), chỉ dữ liệu thật. Thêm vào `SKILLS`; thêm một mục tiêu đề riêng vào `CHANGELOG_QA_RULE`, không đổi 7 bước hiện có.

- [ ] **Bước 4: Chạy** `pnpm --filter @training/ai test` (cả bộ, để test cũ như `show-changelog-answer.test.ts` vẫn qua) và `pnpm --filter @training/ai typecheck` — Expected: PASS.

---

### Task 4: Kiểm tra cuối và thử thủ công

**Files:** không thêm file (chỉ sửa lỗi nếu phát hiện).

- [ ] **Bước 1: Chạy** `pnpm typecheck`, `pnpm test`, `pnpm build` từ root — Expected: PASS.

- [ ] **Bước 2: Người dùng áp migration** `20261118000000_create_shared_pages.sql` lên Supabase (dán vào SQL editor hoặc `supabase db push`) và đặt `AI_PUBLIC_URL` trên Vercel; agent không tự làm hai việc này.

- [ ] **Bước 3: Thử thủ công** (chạy local hoặc bản deploy): hỏi "tháng trước ra gì?" — Expected: vẫn Markdown ở Live Preview. Rồi nói "build artifact để gửi PM" — Expected: AI trả một dòng kèm link `.../shared/<uuid>.html`, không có HTML trong chat.

- [ ] **Bước 4: Mở link trong cửa sổ ẩn danh trên domain Vercel** — Expected: trang hiện không cần đăng nhập, chỉ chứa release thật, đọc được ở chiều rộng điện thoại và chế độ tối. `/shared/abc.html` — Expected: 404.

- [ ] **Bước 5: Lưu kết quả** — chưa commit; báo user đã chạy gì và chưa chạy được gì (ví dụ chưa thử trên Vercel thật nếu chỉ chạy local).
