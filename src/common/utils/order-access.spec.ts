import { orderAccessWhere } from './order-access';

describe('orderAccessWhere', () => {
  it('limits customers to their own orders', () => {
    expect(orderAccessWhere('order-1', { id: 'user-1', type: 'user' })).toEqual({
      id: 'order-1',
      userId: 'user-1',
    });
  });

  it('lets staff access any order', () => {
    expect(orderAccessWhere('order-1', { id: 'staff-1', type: 'staff' })).toEqual({ id: 'order-1' });
  });
});
