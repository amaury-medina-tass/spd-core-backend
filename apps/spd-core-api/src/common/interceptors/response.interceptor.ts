import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { randomUUID } from "crypto";
import { ApiResponse } from "../interfaces/api-response.interface";
import { Reflector } from "@nestjs/core";
import { RESPONSE_MESSAGE_KEY } from "../decorators/response-message.decorator";

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;

    const requestId = randomUUID();
    request.headers["x-request-id"] = requestId;

    const message = this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
      context.getHandler(),
      context.getClass()
    ]) || "Operación realizada correctamente";

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode,
        message,
        data: data || null,
        errors: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          path: request.url,
          method: request.method
        }
      }))
    );
  }
}
