import {
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { PaymentProvider } from '@prisma/client';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a payment intent' })
  async createPaymentIntent(@Body() createPaymentIntentDto: CreatePaymentIntentDto) {
    return this.paymentsService.createPaymentIntent(createPaymentIntentDto);
  }

  @Public()
  @Post('webhooks/stripe')
  @ApiOperation({ summary: 'Stripe webhook endpoint (placeholder)' })
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(
      PaymentProvider.STRIPE,
      req.body,
      signature,
    );
  }

  @Public()
  @Post('webhooks/adyen')
  @ApiOperation({ summary: 'Adyen webhook endpoint (placeholder)' })
  async adyenWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('adyen-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(
      PaymentProvider.ADYEN,
      req.body,
      signature,
    );
  }
}


