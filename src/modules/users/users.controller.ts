import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.getProfile(user.id);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'Get user addresses' })
  async getAddresses(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.getAddresses(user.id);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Create a new address' })
  async createAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.usersService.createAddress(user.id, createAddressDto);
  }

  @Put('addresses/:id')
  @ApiOperation({ summary: 'Update an address' })
  async updateAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') addressId: string,
    @Body() updateData: Partial<CreateAddressDto>,
  ) {
    return this.usersService.updateAddress(user.id, addressId, updateData);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Delete an address' })
  async deleteAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') addressId: string,
  ) {
    return this.usersService.deleteAddress(user.id, addressId);
  }
}



