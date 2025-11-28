import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentProvider, PaymentStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
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
    // Verify webhook signature based on provider
    const webhookSecret = this.configService.get<string>(
      provider === PaymentProvider.STRIPE
        ? 'payments.stripe.webhookSecret'
        : 'payments.adyen.webhookSecret',
    );

    if (!webhookSecret) {
      this.logger.warn(`Webhook secret not configured for ${provider}`);
      // In development, allow without verification
      const nodeEnv = this.configService.get<string>('nodeEnv');
      if (nodeEnv === 'production') {
        throw new BadRequestException('Webhook secret not configured');
      }
    } else {
      // Verify signature
      const isValid = this.verifyWebhookSignature(provider, payload, signature, webhookSecret);
      if (!isValid) {
        this.logger.error(`Invalid webhook signature for ${provider}`);
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    let paymentId: string;
    let status: PaymentStatus;

    if (provider === PaymentProvider.STRIPE) {
      // Stripe webhook payload structure
      paymentId = payload.data?.object?.id || payload.id || 'unknown';
      const eventType = payload.type || '';
      
      if (eventType === 'payment_intent.succeeded' || payload.data?.object?.status === 'succeeded') {
        status = PaymentStatus.PAID;
      } else if (eventType === 'payment_intent.payment_failed' || payload.data?.object?.status === 'failed') {
        status = PaymentStatus.FAILED;
      } else {
        status = PaymentStatus.PENDING;
      }
    } else if (provider === PaymentProvider.ADYEN) {
      // Adyen webhook payload structure
      paymentId = payload.pspReference || payload.merchantReference || 'unknown';
      const resultCode = payload.resultCode || payload.eventCode || '';
      
      if (resultCode === 'Authorised' || resultCode === 'Received') {
        status = PaymentStatus.PAID;
      } else if (resultCode === 'Refused' || resultCode === 'Error') {
        status = PaymentStatus.FAILED;
      } else {
        status = PaymentStatus.PENDING;
      }
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

    // Update payment and order status in a transaction with retry logic
    await this.prisma.executeWithRetry(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status },
      });

      if (status === PaymentStatus.PAID) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: PaymentStatus.PAID },
        });
      } else if (status === PaymentStatus.FAILED) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: PaymentStatus.FAILED },
        });
      }
    });

    // Notify kitchen after transaction completes
    if (status === PaymentStatus.PAID) {
      await this.notificationsService.emitAdminNewOrder(payment.orderId);
    }

    return { received: true, paymentId: payment.id, status };
  }

  private verifyWebhookSignature(
    provider: PaymentProvider,
    payload: any,
    signature: string,
    secret: string,
  ): boolean {
    try {
      if (provider === PaymentProvider.STRIPE) {
        // Stripe signature verification
        // Format: timestamp,payload,signature
        const elements = signature.split(',');
        const timestamp = elements.find((e) => e.startsWith('t='))?.substring(2);
        const signatureHash = elements.find((e) => e.startsWith('v1='))?.substring(3);

        if (!timestamp || !signatureHash) {
          return false;
        }

        const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
        const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(signedPayload, 'utf8')
          .digest('hex');

        // Use constant-time comparison to prevent timing attacks
        return crypto.timingSafeEqual(
          Buffer.from(signatureHash),
          Buffer.from(expectedSignature),
        );
      } else if (provider === PaymentProvider.ADYEN) {
        // Adyen signature verification
        // Adyen uses HMAC SHA-256 with specific format
        const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
        const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(payloadString, 'utf8')
          .digest('base64');

        return crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature),
        );
      }

      return false;
    } catch (error) {
      this.logger.error(`Webhook signature verification error: ${error.message}`);
      return false;
    }
  }
}

