import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { db } from '../prisma/db.js';

@Injectable()
export class UsersService {
  async create(createUserDto: CreateUserDto) {
    const { login, password } = createUserDto;
    const result = await db.orm.public.User.create({ login, password });
    return { ...result };
  }

  async findByName(name: string) {
    const result = await db.orm.public.User.where({ login: name }).first();
    return result ? { ...result } : null;
  }
}
