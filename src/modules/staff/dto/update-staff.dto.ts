import { IsString, IsEnum, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UpdateStaffDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.KITCHEN, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ example: '+995555123456', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'password123', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}



