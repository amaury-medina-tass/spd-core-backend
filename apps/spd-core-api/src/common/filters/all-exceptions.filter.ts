import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response, Request } from "express";
import type { ApiResponse } from "../interfaces/api-response.interface";
import { randomUUID } from "crypto";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse() as any;
      message = r?.message ?? exception.message ?? "Request error";
      errors = r?.error ?? r;
    } else if (exception instanceof Error) {
      message = exception.message;
      errors = exception.stack; // Optional: include stack in dev, or remove for prod
    }

    const requestId = (req.headers["x-request-id"] as string) || randomUUID();

    const body: ApiResponse = {
      success: false,
      statusCode: status,
      message,
      data: null,
      errors,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        path: req.url,
        method: req.method,
      },
    };

    res.status(status).json(body);
  }
}
