import { IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentProvider } from '@prisma/client';

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 'order-uuid' })
  @IsString()
  orderId: string;

  @ApiProperty({ enum: PaymentProvider, example: PaymentProvider.STRIPE })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @ApiProperty({ example: 25.99 })
  @IsNumber()
  @Min(0)
  amount: number;
}

