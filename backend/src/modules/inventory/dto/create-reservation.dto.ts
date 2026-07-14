import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @IsInt()
  @Min(1)
  @Max(20)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sessionId: string;
}
