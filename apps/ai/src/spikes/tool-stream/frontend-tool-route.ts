import { LangChainAgent } from "@ag-ui/langchain";
import { FakeToolStreamModel } from "./fake-model";

/**
 * SPIKE route A: frontend tool. The stock bridge streams the model directly
 * (`model` config, no `chainFn`), converts the tool_call_chunks to
 * TOOL_CALL_START/ARGS/END, and the run ends. The browser owns the tool
 * (`useFrontendTool` + handler) and resumes the run with the result.
 */
export const createFrontendToolAgent = () =>
  new LangChainAgent({ model: new FakeToolStreamModel() });
