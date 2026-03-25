import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;

        if ('message' in res) {
          const msg = res.message;

          if (typeof msg === 'string') {
            message = msg;
          }

          if (Array.isArray(msg)) {
            message = msg.join(', ');
          }
        }

        if ('code' in res && typeof res.code === 'string') {
          code = res.code;
        }
      }
    }

    if (exception instanceof Error) {
      this.logger.error(
        `${request.method} ${request.url} ${status}`,
        exception.stack,
      );
    } else {
      this.logger.error(`${request.method} ${request.url} ${status}`);
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
