import { AIMessage } from "@langchain/core/messages";
import { createMiddleware } from "langchain";

// Constants
import { TOOL_NAMES } from "@/constants";

/**
 * Human-in-the-loop for Slack publish (spike path A): when the model asks for
 * `confirmSlackPublish`, end the run so the web card can answer; the answer
 * comes back as a tool message in the next run's history.
 */
export const confirmationMiddleware = createMiddleware({
  name: "ConfirmationMiddleware",
  afterModel: {
    canJumpTo: ["end"],
    hook: (state) => {
      const last = state.messages.at(-1);
      const asksToConfirm =
        AIMessage.isInstance(last) &&
        last.tool_calls?.some((call) => call.name === TOOL_NAMES.confirmSlackPublish);
      return asksToConfirm ? { jumpTo: "end" } : undefined;
    },
  },
});
