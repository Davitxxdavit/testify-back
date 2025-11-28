import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentProvider, PaymentStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createPaymentIntent(createPaymentIntentDto: CreatePaymentIntentDto) {
    const { orderId, provider, amount } = createPaymentIntentDto;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    // Generate idempotency key
    const idempotencyKey = `${orderId}-${Date.now()}`;

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        provider,
        amount,
        status: PaymentStatus.PENDING,
        idempotencyKey,
      },
    });

    // TODO: Create actual payment intent with Stripe/Adyen
    // For now, return a placeholder response
    return {
      paymentId: payment.id,
      clientSecret: `placeholder_client_secret_${payment.id}`,
      idempotencyKey,
      message: 'Payment intent created (placeholder - integrate with actual provider)',
    };
  }

  async handleWebhook(provider: PaymentProvider, payload: any, signature: string) {
    // TODO: Verify webhook signature based on provider
    // For now, this is a placeholder

    let paymentId: string;
    let status: PaymentStatus;

    if (provider === PaymentProvider.STRIPE) {
      // TODO: Verify Stripe signature
      // const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      // paymentId = event.data.object.id;
      // status = event.type === 'payment_intent.succeeded' ? PaymentStatus.PAID : PaymentStatus.FAILED;
      
      // Placeholder logic
      paymentId = payload.id || 'placeholder';
      status = PaymentStatus.PAID;
    } else if (provider === PaymentProvider.ADYEN) {
      // TODO: Verify Adyen signature
      // Placeholder logic
      paymentId = payload.pspReference || 'placeholder';
      status = PaymentStatus.PAID;
    } else {
      throw new BadRequestException('Unknown payment provider');
    }

    // Find payment by provider payment ID
    const payment = await this.prisma.payment.findFirst({
      where: {
        provider,
        providerPaymentId: paymentId,
      },
      include: { order: true },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for provider payment ID: ${paymentId}`);
      return { received: true };
    }

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status },
    });

    // Update order payment status
    if (status === PaymentStatus.PAID) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: PaymentStatus.PAID },
      });

      // Notify kitchen
      await this.notificationsService.emitAdminNewOrder(payment.orderId);
    } else if (status === PaymentStatus.FAILED) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: PaymentStatus.FAILED },
      });
    }

    return { received: true, paymentId: payment.id, status };
  }
}

