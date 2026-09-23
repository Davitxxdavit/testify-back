import { Prisma } from '@prisma/client';

/**
 * Prisma filter for an order the given principal may access: staff can access
 * any order, customers only their own.
 *
 * (An empty object inside `OR` does not act as "match everything" in Prisma,
 * so `OR: [{ userId }, {}]` locked staff out of every order.)
 */
export function orderAccessWhere(
  orderId: string,
  principal: { id?: string; type: 'user' | 'staff' },
): Prisma.OrderWhereInput {
  return principal.type === 'staff' ? { id: orderId } : { id: orderId, userId: principal.id };
}
