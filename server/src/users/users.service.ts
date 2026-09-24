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

  async findByName(name: string) {
    const plan = db.sql.public.user
      .select('id', 'login', 'password')
      .where((f, fns) => fns.eq(f.login, name))
      .limit(1)
      .build();

    const result = await db.runtime().query(plan);

    return result[0] ?? null;
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
