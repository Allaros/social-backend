import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    function isObject(value: unknown): value is Record<string, unknown> {
      return typeof value === 'object' && value !== null;
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (isObject(exceptionResponse)) {
        if ('message' in exceptionResponse) {
          const msg = exceptionResponse.message;

          if (typeof msg === 'string') {
            message = msg;
          }

          if (Array.isArray(msg)) {
            message = msg.join(', ');
          }
        }

        if (
          'code' in exceptionResponse &&
          typeof exceptionResponse.code === 'string'
        ) {
          code = exceptionResponse.code;
        } else {
          code = this.mapStatusToCode(status);
        }
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      code,
    });
  }

  private mapStatusToCode(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 404:
        return 'NOT_FOUND';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}
