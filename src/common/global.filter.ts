import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

import { FileNotExistException } from '../files/exceptions/file-not-exist.exception';
import { UserNotFoundException } from '../telegram/exceptions/user-not-found.exception';

@Catch()
export class GlobalExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(this.constructor.name);

  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    let httpException: HttpException = new InternalServerErrorException();
    if (exception instanceof BadRequestException) {
      httpException = exception;
    }
    if (exception instanceof FileNotExistException) {
      httpException = new NotFoundException(exception.message);
    }
    if (exception instanceof UserNotFoundException) {
      httpException = new NotFoundException(exception.message);
    }

    super.catch(httpException, host);
  }
}
