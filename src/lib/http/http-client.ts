import { toNetworkErrorMessage } from '@/lib/network-error-message.ts';

export interface HttpRequestOptions {
  query?: Record<string, string>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  target?: string;
}

export interface HttpService {
  get: <T = unknown>(path: string, options?: HttpRequestOptions) => Promise<T>;
  post: <T = unknown>(
    path: string,
    body?: unknown,
    options?: HttpRequestOptions,
  ) => Promise<T>;
  put: <T = unknown>(
    path: string,
    body?: unknown,
    options?: HttpRequestOptions,
  ) => Promise<T>;
  patch: <T = unknown>(
    path: string,
    body?: unknown,
    options?: HttpRequestOptions,
  ) => Promise<T>;
  delete: <T = unknown>(path: string, options?: HttpRequestOptions) => Promise<T>;
}

export class HttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}

export interface HttpClientConfig {
  // Resolved on every call, not once at construction, so a client built
  // before an env var is available (or one shared across requests with
  // different bases) always reads the current value.
  baseUrl: () => string;
  // Left out of src/services/ call sites and injected here instead, so this
  // module stays importable from src/mastra/ (server bundle) without pulling
  // in the client-only Zustand auth store.
  getAuthHeader?: () => Record<string, string>;
  timeoutMs: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const extractErrorMessage = (body: unknown, fallback: string): string =>
  isRecord(body) && typeof body.error === 'string' ? body.error : fallback;

const parseJsonSafe = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export class HttpClient implements HttpService {
  constructor(private readonly config: HttpClientConfig) {}

  get<T = unknown>(path: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  post<T = unknown>(
    path: string,
    body?: unknown,
    options?: HttpRequestOptions,
  ): Promise<T> {
    return this.request<T>('POST', path, options, body);
  }

  put<T = unknown>(
    path: string,
    body?: unknown,
    options?: HttpRequestOptions,
  ): Promise<T> {
    return this.request<T>('PUT', path, options, body);
  }

  patch<T = unknown>(
    path: string,
    body?: unknown,
    options?: HttpRequestOptions,
  ): Promise<T> {
    return this.request<T>('PATCH', path, options, body);
  }

  delete<T = unknown>(path: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  private async request<T>(
    method: string,
    path: string,
    { query, headers, signal, target }: HttpRequestOptions = {},
    body?: unknown,
  ): Promise<T> {
    const url = new URL(path, this.config.baseUrl());
    for (const [key, value] of Object.entries(query ?? {})) {
      url.searchParams.set(key, value);
    }

    const requestTarget = target ?? path;
    const timeoutSignal = AbortSignal.timeout(this.config.timeoutMs);
    const combinedSignal = signal
      ? AbortSignal.any([timeoutSignal, signal])
      : timeoutSignal;

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...this.config.getAuthHeader?.(),
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: combinedSignal,
      });
    } catch (error) {
      throw new HttpError(toNetworkErrorMessage(error, requestTarget), 0, null, {
        cause: error,
      });
    }

    const responseBody =
      response.status === 204 ? null : await parseJsonSafe(response);

    if (!response.ok) {
      throw new HttpError(
        extractErrorMessage(
          responseBody,
          `${method} ${requestTarget} failed with status ${response.status}.`,
        ),
        response.status,
        responseBody,
      );
    }

    return responseBody as T;
  }
}
