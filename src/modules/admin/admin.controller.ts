import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('analytics/daily-sales')
  @ApiOperation({ summary: 'Get daily sales analytics' })
  async getAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  async getUsers(
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    return this.adminService.getUsers({
      limit: limit ? +limit : undefined,
      skip: skip ? +skip : undefined,
    });
  }

  @Get('chat/:orderId')
  @ApiOperation({ summary: 'Get chat history for an order' })
  async getChatHistory(@Param('orderId') orderId: string) {
    return this.adminService.getChatHistory(orderId);
  }
}

