import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PREPARING })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({ example: 'Order is being prepared', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}



