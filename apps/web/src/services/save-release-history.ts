import {
  RELEASE_HISTORY_PATH,
  type SaveReleaseHistoryRequest,
} from '@training/contracts';
import { HttpError } from '@/lib/http/http-client.ts';
import { releaseCopilotHttpClient } from '@/services/http-client.ts';

interface SaveReleaseHistoryResult {
  ok: boolean;
  id?: string;
  error?: string;
}

const isRecordWithId = (value: unknown): value is { id: string } =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  typeof (value as { id: unknown }).id === 'string';

export const saveReleaseHistory = async (
  payload: SaveReleaseHistoryRequest,
): Promise<SaveReleaseHistoryResult> => {
  try {
    const body = await releaseCopilotHttpClient.post(
      RELEASE_HISTORY_PATH,
      payload,
      { target: 'the release history save route' },
    );
    return { ok: true, id: isRecordWithId(body) ? body.id : undefined };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof HttpError ? error.message : String(error),
    };
  }
};
