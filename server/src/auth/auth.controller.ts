import {
  Body,
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { SignInDto } from './dto/sign-in.dto.js';
import { ValidationPipe } from '../shared/pipes/validation.pipe.js';
import { Public } from '../shared/decorators/public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body(ValidationPipe) signInDto: SignInDto) {
    return this.authService.signIn(signInDto.login, signInDto.password);
  }

  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }
}
