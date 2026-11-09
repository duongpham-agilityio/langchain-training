# Ticket 8: [M-05] Spike B: agent confirmation request shows in the UI

## What it asks
Spike (throwaway code, real finding): a tool that needs human approval. Check the approval prompt shows in the UI, Approve and Reject both resume the run, and Reject stops the action.
Done when: "both paths work in the UI, or the blocker and fallback are written down."

## What's ambiguous
- "Throwaway tool that needs approval": which mechanism? Frontend tool with `useHumanInTheLoop` (client renders the prompt), or LangChain `humanInTheLoopMiddleware` (server `interrupt`)? Ticket does not say.
- "Reject stops the action": not stated whether the agent should tell the user it was cancelled or end silently.
- No model credentials or sign-in are needed to prove the transport; ticket does not say if a real LLM run is required.

## First step
Read how `@ag-ui/langchain` `LangChainAgent` forwards tool calls and the frontend tools list (`ChainFnParams.tools`), since `apps/ai/src/agui` drops tool calls today.

## Clarifying questions
1. Is the frontend-tool route (`useHumanInTheLoop`) acceptable as the primary path, with the middleware `interrupt` route only analysed?
   Default assumption: yes. Correct?
   Answer: _(pending)_
2. After Reject, should the agent reply with a short "cancelled" text?
   Default assumption: yes. Correct?
   Answer: _(pending)_
3. Is a scripted fake model enough to prove the UI/transport path (real LLM run noted as not verified)?
   Default assumption: yes. Correct?
   Answer: _(pending)_
