import { IsNotEmpty, IsInt, IsString, IsEnum } from 'class-validator';

enum Rating {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
}

export class CreateReviewDto {
  @IsNotEmpty()
  @IsInt()
  readonly entity_id: number;

  @IsNotEmpty()
  @IsString()
  readonly author: string;

  @IsNotEmpty()
  @IsEnum(Rating)
  readonly rating: number;

  @IsNotEmpty()
  @IsString()
  readonly text: string;
}
