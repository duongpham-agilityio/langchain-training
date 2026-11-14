import type { RunAgentInput } from "@ag-ui/client";
import { Command } from "@langchain/langgraph";
import { isValidEmailAddress } from "@training/contracts";

// Constants
import { APPROVAL_REJECT_MESSAGE, EMAIL_APPROVAL_REJECT_INVALID_RECIPIENT } from "@/constants";

type ApprovalDecision = { type: "approve" } | { type: "reject"; message: string };

type ResumeEntries = NonNullable<RunAgentInput["resume"]>;

/** An approval that carries a `recipient` (email card) with an invalid address: the server refuses it. */
const hasInvalidRecipient = (entry: ResumeEntries[number]): boolean =>
  entry.payload?.recipient !== undefined && !isValidEmailAddress(entry.payload.recipient);

/**
 * The recipient typed on the email approval card, for the approved entry that has one. It is read
 * here and handed to the tool through `configurable`; it is not part of the resume command, so it
 * never reaches the model, the checkpoint or the graph trace. `undefined` = none (or invalid).
 */
export const findResumeRecipient = (resume: ResumeEntries): string | undefined => {
  const entry = resume.find(
    (e) => e.status === "resolved" && e.payload?.decision === "approve" && !hasInvalidRecipient(e),
  );
  const recipient = entry?.payload?.recipient;
  return isValidEmailAddress(recipient) ? recipient.trim() : undefined;
};

/**
 * AG-UI resume entries -> the decisions `humanInTheLoopMiddleware` expects.
 * Only an explicit `resolved` answer with `approve` approves; anything else rejects, and so does an
 * approval whose recipient is present but not a valid address (the card checks it too, this is the
 * server-side check).
 */
export const toResumeCommand = (resume: ResumeEntries) =>
  new Command({
    resume: {
      decisions: resume.map(
        (entry): ApprovalDecision =>
          entry.status === "resolved" && entry.payload?.decision === "approve"
            ? hasInvalidRecipient(entry)
              ? { type: "reject", message: EMAIL_APPROVAL_REJECT_INVALID_RECIPIENT }
              : { type: "approve" }
            : { type: "reject", message: APPROVAL_REJECT_MESSAGE },
      ),
    },
  });
