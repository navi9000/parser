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
import { UpdateEntityDto } from './dto/update-entity.dto.js';

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
  @UseGuards(AuthGuard)
  getAll() {
    return this.entitiesService.getAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  getById(@Param('id') id: string) {
    return this.entitiesService.getById(id);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  updateById(
    @Param('id') id: string,
    @Body() updateEntityDto: UpdateEntityDto,
  ) {
    return this.entitiesService.update(id, updateEntityDto);
  }
}
