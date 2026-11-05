import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsDecimal,
  IsOptional,
} from 'class-validator';

export class CreateEntityDto {
  @IsString()
  readonly slug: string;

  @IsString()
  readonly office_id: string;

  @IsString()
  @IsOptional()
  readonly name?: string;

  @IsInt()
  @IsOptional()
  readonly review_count?: number;

  @IsDecimal()
  @IsOptional()
  readonly avg_rating?: string;
}
