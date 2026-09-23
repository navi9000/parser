import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { db } from '../prisma/db.js';

@Injectable()
export class UsersService {
  async create(createUserDto: CreateUserDto) {
    const { login, password } = createUserDto;

    const plan = db.sql.public.user.insert([{ login, password }]).build();
    const result = await db.runtime().query(plan);

    return result;
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
