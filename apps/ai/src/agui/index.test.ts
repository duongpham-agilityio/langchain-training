import { lastValueFrom, toArray } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import { createAguiAgent } from "./index";

// The `@/utils` -> `@/db` barrel reaches `config.ts`, which requires env vars at import.
vi.mock("@/config", () => ({ config: {} }));

const USER = "user-1";
const PROJECT = "project-1";
const input = (threadId = "thread-1") =>
  ({
    threadId,
    runId: "run-1",
    messages: [{ id: "m1", role: "user", content: "hello" }],
    tools: [],
    context: [],
    state: {},
    forwardedProps: {},
  }) as never;

const setup = ({
  projectOk = true,
  threadOk = true,
  headers = { authorization: "Bearer t", "x-project-id": PROJECT } as Record<string, string>,
} = {}) => {
  const getState = vi.fn().mockResolvedValue({ values: { messages: [] } });
  const stream = vi.fn().mockResolvedValue((async function* () {})());
  const projects = vi.fn().mockResolvedValue(projectOk);
  const threads = {
    canUse: vi.fn().mockResolvedValue(threadOk),
    claim: vi.fn().mockResolvedValue(true),
    touch: vi.fn().mockResolvedValue(undefined),
  };
  const agent = createAguiAgent(
    { getState, stream } as never,
    undefined,
    undefined,
    undefined,
    threads,
    vi.fn().mockResolvedValue(USER),
    projects,
  );
  agent.headers = headers;
  const run = (threadId?: string) =>
    lastValueFrom(agent.run(input(threadId)).pipe(toArray())).then(
      (events) => ({ events, error: undefined as unknown }),
      (error: unknown) => ({ events: [], error }),
    );
  return { run, getState, stream, projects, threads };
};

describe("run: project check", () => {
  it("refuses a project the user does not own before any gate or state read", async () => {
    const { run, getState, stream, threads, projects } = setup({ projectOk: false });
    const { error } = await run();
    expect(String(error)).toContain("Project not available");
    expect(projects).toHaveBeenCalledWith(USER, PROJECT);
    expect(threads.canUse).not.toHaveBeenCalled();
    expect(getState).not.toHaveBeenCalled();
    expect(stream).not.toHaveBeenCalled();
  });

  it("refuses a run with no project header", async () => {
    const { run, getState, projects } = setup({ headers: { authorization: "Bearer t" } });
    const { error } = await run();
    expect(String(error)).toContain("Project not available");
    expect(projects).not.toHaveBeenCalled();
    expect(getState).not.toHaveBeenCalled();
  });

  it("refuses a thread that belongs to another project, with no state read", async () => {
    const { run, getState, threads } = setup({ threadOk: false });
    const { error } = await run();
    expect(String(error)).toContain("Thread not available");
    expect(threads.canUse).toHaveBeenCalledWith(USER, PROJECT, "thread-1");
    expect(getState).not.toHaveBeenCalled();
  });

  it("puts the verified project in the run context and the trace metadata", async () => {
    const { run, stream, threads } = setup();
    await run();
    const options = stream.mock.calls[0][1];
    expect(options.context).toMatchObject({ userId: USER, projectId: PROJECT });
    expect(options.metadata).toMatchObject({ project_id: PROJECT, user_id: USER });
    expect(threads.claim).toHaveBeenCalledWith(USER, PROJECT, "thread-1");
  });
});
