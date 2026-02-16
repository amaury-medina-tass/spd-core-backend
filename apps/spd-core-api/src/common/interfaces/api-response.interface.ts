export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  errors: Record<string, unknown> | Array<{ message: string }> | null;
  meta?: {
    timestamp: string;
    requestId: string;
    path: string;
    method: string;
    [key: string]: any;
  };
}
