import { randomUUID } from "node:crypto";
import { EventType, type BaseEvent } from "@ag-ui/client";
import {
  InMemoryAgentRunner,
  type AgentRunnerConnectRequest,
} from "@copilotkit/runtime/v2";
import type { BaseMessage } from "@langchain/core/messages";
import type { Pool } from "pg";
import { Observable } from "rxjs";

// Agents
import type { BaseAgent } from "@/agent";

// Agui
import { toAguiMessages } from "@/agui";

// Db
import { getThreadOwner } from "@/db";

/**
 * `InMemoryAgentRunner` keeps replay events in process memory, so after a restart `connect()` finds
 * nothing and the web shows an empty chat. This runner keeps the in-memory replay (live streaming in
 * the same process) and, only when that yields no event at all, rebuilds the history from the
 * Postgres checkpoint.
 */
export class CheckpointAgentRunner extends InMemoryAgentRunner {
  constructor(
    private readonly agent: BaseAgent,
    private readonly pool: Pool,
  ) {
    super();
  }

  override connect(request: AgentRunnerConnectRequest): Observable<BaseEvent> {
    return new Observable<BaseEvent>((subscriber) => {
      let emitted = false;
      const subscription = super.connect(request).subscribe({
        next: (event) => {
          emitted = true;
          subscriber.next(event);
        },
        error: (error) => subscriber.error(error),
        complete: () => {
          if (emitted) {
            subscriber.complete();
            return;
          }
          // replayFromCheckpoint never rejects, so the stream always completes.
          void this.replayFromCheckpoint(request).then((events) => {
            events.forEach((event) => subscriber.next(event));
            subscriber.complete();
          });
        },
      });
      return () => subscription.unsubscribe();
    });
  }

  /** RUN_STARTED, one MESSAGES_SNAPSHOT, RUN_FINISHED; empty for a stranger, an unknown thread or a read error. */
  private replayFromCheckpoint = async ({ threadId, ownerId }: AgentRunnerConnectRequest): Promise<BaseEvent[]> => {
    try {
      // Same answer for "not yours" and "does not exist", so a caller learns nothing about other threads.
      if (!ownerId || (await getThreadOwner(this.pool, threadId)) !== ownerId) return [];
      // Cast: the agent's state type is not inferred through `createAgent` (same cast as in `agui/index.ts`).
      const state = (await this.agent.getState({ configurable: { thread_id: threadId } })) as {
        values?: { messages?: BaseMessage[] };
      };
      const messages = toAguiMessages(state.values?.messages ?? [], threadId);
      if (!messages.length) return [];
      const runId = randomUUID();
      return [
        { type: EventType.RUN_STARTED, threadId, runId },
        { type: EventType.MESSAGES_SNAPSHOT, messages },
        { type: EventType.RUN_FINISHED, threadId, runId },
      ] as BaseEvent[];
    } catch (error) {
      console.error("[ai] checkpoint replay failed", error);
      return [];
    }
  };
}

/** Factory used by `index.ts`; the agent must be the one built with the same checkpointer. */
export const createCheckpointAgentRunner = (agent: BaseAgent, pool: Pool): CheckpointAgentRunner =>
  new CheckpointAgentRunner(agent, pool);
