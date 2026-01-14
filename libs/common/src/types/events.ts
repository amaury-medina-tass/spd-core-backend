export interface OutboxEventEnvelope {
  id: string;
  name: string;
  payload: Record<string, any>;
  headers?: Record<string, any>;
}
