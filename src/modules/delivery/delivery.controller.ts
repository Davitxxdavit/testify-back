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
import { DeliveryService } from './delivery.service';
import { AssignCourierDto } from './dto/assign-courier.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { UserRole, DeliveryTaskStatus } from '@prisma/client';

@ApiTags('delivery')
@Controller('delivery')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('tasks/:orderId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create delivery task for an order (Admin only)' })
  async createDeliveryTask(@Param('orderId') orderId: string) {
    return this.deliveryService.createDeliveryTask(orderId);
  }

  @Patch('tasks/:orderId/assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign courier to delivery task (Admin only)' })
  async assignCourier(
    @Param('orderId') orderId: string,
    @Body() assignCourierDto: AssignCourierDto,
  ) {
    return this.deliveryService.assignCourier(orderId, assignCourierDto);
  }

  @Patch('tasks/:orderId/status')
  @Roles(UserRole.ADMIN, UserRole.COURIER)
  @ApiOperation({ summary: 'Update delivery task status (Admin/Courier only)' })
  async updateDeliveryStatus(
    @Param('orderId') orderId: string,
    @Body('status') status: DeliveryTaskStatus,
  ) {
    return this.deliveryService.updateDeliveryStatus(orderId, status);
  }

  @Get('tasks')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all delivery tasks (Admin only)' })
  async getDeliveryTasks(
    @Query('status') status?: DeliveryTaskStatus,
    @Query('courierId') courierId?: string,
  ) {
    return this.deliveryService.getDeliveryTasks({ status, courierId });
  }

  @Get('tasks/my')
  @Roles(UserRole.COURIER)
  @ApiOperation({ summary: 'Get courier tasks (Courier only)' })
  async getCourierTasks(@CurrentUser() user: CurrentUserPayload) {
    return this.deliveryService.getCourierTasks(user.id);
  }
}

