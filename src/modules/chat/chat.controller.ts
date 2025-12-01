import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':orderId')
  @ApiOperation({ summary: 'Get chat history for an order' })
  async getChatHistory(
    @Param('orderId') orderId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chatService.getChatHistory(
      orderId,
      user.id,
      user.type === 'staff',
    );
  }

  @Post(':orderId')
  @ApiOperation({ summary: 'Send a chat message' })
  async sendMessage(
    @Param('orderId') orderId: string,
    @Body('message') message: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chatService.sendMessage(orderId, message, user);
  }
}



