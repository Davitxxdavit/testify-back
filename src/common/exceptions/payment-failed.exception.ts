import { BadRequestException } from '@nestjs/common';

export class PaymentFailedException extends BadRequestException {
  constructor(message: string = 'Payment processing failed') {
    super(message);
  }
}



