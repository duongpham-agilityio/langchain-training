export { PROJECT_ID_HEADER, PROJECT_NAME_MAX_LENGTH, PROJECTS_PATH } from "@training/contracts";

/** REST answer (404) for a project that is not the caller's or does not exist: same wording for both, so ids of others leak nothing. */
export const PROJECT_NOT_FOUND_MESSAGE = "Project not found";

/** Run error for a missing or foreign project. Same wording for "not yours" and "does not exist". */
export const PROJECT_ACCESS_DENIED_MESSAGE = "Project not available";

/** Tool answer when a run carries no project (should not happen: the run is refused first). */
export const PROJECT_REQUIRED_MESSAGE = "No project is selected, so nothing was saved or sent.";
