export type StockApiErrorCode =
  | 'RATE_LIMITED'
  | 'ACCESS_RESTRICTED'
  | 'INVALID_SYMBOL'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'HTTP_ERROR';

export class StockApiError extends Error {
  constructor(
    public readonly code: StockApiErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'StockApiError';
  }
}

export interface ApiError {
  code: StockApiErrorCode;
  message: string;
}
