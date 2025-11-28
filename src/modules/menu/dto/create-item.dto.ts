import { IsString, IsNumber, IsOptional, IsBoolean, IsUrl, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  categoryId: number;

  @ApiProperty({ example: 'Classic Burger' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'A delicious classic burger', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 15.99 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({ example: 'https://example.com/burger.jpg', required: false })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


