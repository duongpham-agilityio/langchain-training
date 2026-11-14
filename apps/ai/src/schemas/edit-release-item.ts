import { EditReleaseItemToolInputSchema } from "@training/contracts";

import { ReleaseSchema } from "./release";

export { type EditReleaseItemToolInput } from "@training/contracts";

/** Model-facing input: `describe` text stays here, on top of the shared schema. */
export const EditReleaseItemInputSchema = EditReleaseItemToolInputSchema.extend({
  itemId: EditReleaseItemToolInputSchema.shape.itemId.describe(
    "The item id from the edit request: `openingLine` or the id of one change.",
  ),
  description: EditReleaseItemToolInputSchema.shape.description.describe(
    "The new text of that item, one sentence on one line. Never touch any other item.",
  ),
  release: ReleaseSchema.describe("The release object from the edit request, copied unchanged."),
  hash: EditReleaseItemToolInputSchema.shape.hash.describe("The draft hash from the edit request, copied unchanged."),
});
