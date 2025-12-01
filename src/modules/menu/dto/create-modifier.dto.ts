import { IsString, IsNumber, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateModifierDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  itemId: number;

  @ApiProperty({ example: 'Extra Cheese' })
  @IsString()
  name: string;

  @ApiProperty({ example: 2.50 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;
}



