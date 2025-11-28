import { IsString, IsOptional, IsNumber, IsBoolean, IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  street: string;

  @ApiProperty({ example: 'Tbilisi' })
  @IsString()
  city: string;

  @ApiProperty({ example: '0100', required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ example: 'Georgia', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: 41.7151, required: false })
  @IsOptional()
  @IsNumber()
  @IsLatitude()
  latitude?: number;

  @ApiProperty({ example: 44.8271, required: false })
  @IsOptional()
  @IsNumber()
  @IsLongitude()
  longitude?: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

