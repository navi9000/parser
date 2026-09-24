import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { EntitiesService } from './entities.service.js';
import { CreateEntityDto } from './dto/create-entity.dto.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { ValidationPipe } from '../shared/pipes/validation.pipe.js';

@Controller('entities')
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) {}

  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  @Post()
  create(@Body() createEntityDto: CreateEntityDto) {
    return this.entitiesService.create(createEntityDto);
  }

  @Get()
  getAll() {
    return this.entitiesService.getAll();
  }

  @Get(':id')
  getById(@Param() params: any) {
    return this.entitiesService.getById(params.id);
  }

  @Put(':id')
  updateById(@Param() params: any, @Body() updateEntityDto: any) {
    return this.entitiesService.update(params.id, updateEntityDto);
  }
}
