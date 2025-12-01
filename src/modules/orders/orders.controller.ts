import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { UserRole, OrderStatus, PaymentStatus } from '@prisma/client';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order (instant or scheduled)' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(user.id, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user orders' })
  async getUserOrders(@CurrentUser() user: CurrentUserPayload) {
    return this.ordersService.getUserOrders(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.ordersService.findOne(id, user.id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  async cancel(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.ordersService.cancel(id, user.id);
  }

  // Admin endpoints
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Get all orders (Admin/Kitchen only)' })
  async findAll(
    @Query('status') status?: OrderStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    return this.ordersService.findAll(undefined, {
      status,
      paymentStatus,
      limit: limit ? +limit : undefined,
      skip: skip ? +skip : undefined,
    });
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Update order status (Admin/Kitchen only)' })
  async updateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateStatusDto, user.id);
  }
}



