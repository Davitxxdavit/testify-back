import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class NotificationsService {
  // This will be injected with the WebSocket gateway
  private orderGateway: any;
  private chatGateway: any;

  setOrderGateway(gateway: any) {
    this.orderGateway = gateway;
  }

  setChatGateway(gateway: any) {
    this.chatGateway = gateway;
  }

  async emitOrderCreated(orderId: string) {
    if (this.orderGateway) {
      this.orderGateway.emitOrderCreated(orderId);
    }
  }

  async emitOrderUpdated(orderId: string, status: OrderStatus) {
    if (this.orderGateway) {
      this.orderGateway.emitOrderUpdated(orderId, status);
    }
  }

  async emitOrderCancelled(orderId: string) {
    if (this.orderGateway) {
      this.orderGateway.emitOrderCancelled(orderId);
    }
  }

  async emitOrderReady(orderId: string) {
    if (this.orderGateway) {
      this.orderGateway.emitOrderReady(orderId);
    }
  }

  async emitOrderDelivering(orderId: string) {
    if (this.orderGateway) {
      this.orderGateway.emitOrderDelivering(orderId);
    }
  }

  async emitOrderCompleted(orderId: string) {
    if (this.orderGateway) {
      this.orderGateway.emitOrderCompleted(orderId);
    }
  }

  async emitAdminNewOrder(orderId: string) {
    if (this.orderGateway) {
      this.orderGateway.emitAdminNewOrder(orderId);
    }
  }

  async emitAdminOrderUpdate(orderId: string, status: OrderStatus) {
    if (this.orderGateway) {
      this.orderGateway.emitAdminOrderUpdate(orderId, status);
    }
  }

  async emitChatMessage(orderId: string, message: any) {
    if (this.chatGateway) {
      this.chatGateway.emitChatMessage(orderId, message);
    }
  }
}



