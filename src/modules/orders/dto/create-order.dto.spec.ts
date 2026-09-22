import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { CreateOrderDto } from './create-order.dto';

// Same options as the global pipe in main.ts
const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
const validate = (body: unknown) =>
  pipe.transform(body, { type: 'body', metatype: CreateOrderDto });

describe('CreateOrderDto', () => {
  const validOrder = {
    type: 'INSTANT',
    deliveryType: 'OWN',
    addressId: '3f0e8a52-0c1d-4c4e-9a8b-2f6f3c1b7d10',
    items: [{ itemId: 1, quantity: 2, price: 12.99, modifiers: [{ modifierId: 3, price: 1.5 }] }],
  };

  it('accepts items with modifiers under the global pipe options', async () => {
    const dto = await validate(validOrder);
    expect(dto.items[0]).toMatchObject({ itemId: 1, quantity: 2, price: 12.99 });
    expect(dto.items[0].modifiers[0]).toMatchObject({ modifierId: 3, price: 1.5 });
  });

  it('accepts contact phone, notes and payment method', async () => {
    const dto = await validate({
      ...validOrder,
      paymentMethod: 'CASH',
      contactPhone: '+995555123456',
      notes: 'Gate code 1234',
    });
    expect(dto).toMatchObject({ paymentMethod: 'CASH', contactPhone: '+995555123456' });
  });

  it('rejects a non-Georgian mobile number', async () => {
    const error = await validate({ ...validOrder, contactPhone: '+15551234567' }).catch((e) => e);
    expect(error.getResponse().message).toContain(
      'contactPhone must be a Georgian mobile number (+9955XXXXXXXX)',
    );
  });

  it('rejects an empty cart', async () => {
    await expect(validate({ ...validOrder, items: [] })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reports nested field paths for invalid items', async () => {
    const error = await validate({
      ...validOrder,
      items: [{ itemId: 1, quantity: 0, price: 12.99 }],
    }).catch((e) => e);

    expect(error).toBeInstanceOf(BadRequestException);
    expect(error.getResponse().message).toContain('items.0.quantity must not be less than 1');
  });
});
