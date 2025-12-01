import { Controller, Post, Body, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GlovoService } from './glovo.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('glovo')
@Controller('glovo')
export class GlovoController {
  constructor(private readonly glovoService: GlovoService) {}

  @Public()
  @Post('webhooks')
  @ApiOperation({ summary: 'Glovo webhook endpoint (mock)' })
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('glovo-signature') signature: string,
  ) {
    return this.glovoService.handleWebhook(req.body, signature);
  }
}



