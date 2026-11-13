import { z } from "zod";
import {
  ChangeSchema as SharedChangeSchema,
  ReleaseSchema as SharedReleaseSchema,
  type Change,
  type ChangeType,
  type Release,
} from "@training/contracts";

// Utils
import { joinLines } from "@/utils";

export { ChangeTypeSchema } from "@training/contracts";
export type { Change, ChangeType, Release };

// The shared schemas carry structure and limits; the `.describe` text the model reads lives here.
export const ChangeSchema = SharedChangeSchema.extend({
  id: SharedChangeSchema.shape.id.describe(
    joinLines(
      "Stable identifier of this change within the release. Keep the same id",
      "when the change is edited or the release is re-rendered.",
    ),
  ),
  type: SharedChangeSchema.shape.type.describe(
    "Exactly one type. A breaking feature is still a feature.",
  ),
  breaking: SharedChangeSchema.shape.breaking.describe(
    "Whether this change breaks existing behaviour, whatever its type.",
  ),
  description: SharedChangeSchema.shape.description.describe(
    "One sentence in plain language describing the change.",
  ),
  refs: SharedChangeSchema.shape.refs.describe(
    joinLines(
      "PR numbers and commit hashes copied from the pasted input, as written.",
      "Never invent one; omit the field when the input has none.",
    ),
  ),
});

export const ReleaseSchema = SharedReleaseSchema.extend({
  date: SharedReleaseSchema.shape.date.describe("Release date as yyyymmdd."),
  openingLine: SharedReleaseSchema.shape.openingLine.describe(
    "One opening line summarising the release.",
  ),
  changes: z.array(ChangeSchema),
});
