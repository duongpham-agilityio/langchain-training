import { piiMiddleware } from "langchain";

// Utils
import { detectPhone } from "@/utils";

/**
 * Redacts email and phone in user messages before the model call. The redacted text replaces
 * the message in agent state, so the checkpointer stores the redacted version too.
 * URLs and IPs stay: they are normal in commit and PR text.
 */
export const createPiiMiddleware = () => [
  piiMiddleware("email", { strategy: "redact", applyToInput: true }),
  piiMiddleware("phone", { strategy: "redact", detector: detectPhone, applyToInput: true }),
];
