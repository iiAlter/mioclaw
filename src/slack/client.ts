// Stub for removed Slack channel
export interface WebClient {
  conversations?: {
    list(params?: unknown): Promise<{ channels?: unknown[] }>;
    info(params?: unknown): Promise<{ channel?: { is_im?: boolean; is_mpim?: boolean } }>;
  };
}
export interface WebClientOptions {
  retryConfig?: RetryOptions;
}
export interface RetryOptions {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  randomize?: boolean;
}

export const SLACK_DEFAULT_RETRY_OPTIONS: RetryOptions = {
  retries: 2,
  factor: 2,
  minTimeout: 500,
  maxTimeout: 3000,
  randomize: true,
};

export function resolveSlackWebClientOptions(options: WebClientOptions = {}): WebClientOptions {
  return {
    ...options,
    retryConfig: options.retryConfig ?? SLACK_DEFAULT_RETRY_OPTIONS,
  };
}

export function createSlackWebClient(_token: string, _options: WebClientOptions = {}): WebClient {
  return { conversations: {} } as WebClient;
}
