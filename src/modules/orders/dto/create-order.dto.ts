import {
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
  IsUUID,
  IsInt,
  IsNumber,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DeliveryType, OrderType } from '@prisma/client';

export class OrderItemModifierDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  modifierId: number;

  @ApiProperty({ example: 2.5 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;
}

export class OrderItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  itemId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(99)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ example: 15.99 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({ type: [OrderItemModifierDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemModifierDto)
  modifiers?: OrderItemModifierDto[];
}

export class CreateOrderDto {
  @ApiProperty({ enum: OrderType, example: OrderType.INSTANT })
  @IsEnum(OrderType)
  type: OrderType;

  @ApiProperty({ enum: DeliveryType, example: DeliveryType.OWN })
  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @ApiProperty({ example: '2024-12-25T14:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @ApiProperty({ example: 'uuid-address-id', required: false })
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
