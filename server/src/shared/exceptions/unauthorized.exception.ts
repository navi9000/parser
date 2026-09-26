import { HttpException, HttpStatus } from '@nestjs/common';

export class UnauthorizedException extends HttpException {
  constructor() {
    super('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  getResponse(): string | object {
    return {
      message: 'Unauthorized',
      errors: {
        authorizationError: 'Не авторизован',
      },
    };
  }
}
