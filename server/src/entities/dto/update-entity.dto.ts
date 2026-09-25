import { IsString, IsInt, IsDecimal, IsOptional } from 'class-validator';

export class UpdateEntityDto {
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
