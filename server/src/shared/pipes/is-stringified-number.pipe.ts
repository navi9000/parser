import {
  Injectable,
  NotFoundException,
  Param,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class IsStringifiedNumberPipe implements PipeTransform {
  async transform(@Param('id') id: string) {
    const idAsNum = +id;
    if (isNaN(idAsNum)) {
      throw new NotFoundException();
    }
    return idAsNum;
  }
}
