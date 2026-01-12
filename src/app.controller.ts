import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
    constructor(private readonly configService: ConfigService) { }

    @Get()
    @ApiExcludeEndpoint()
    @Redirect()
    root() {
        const apiPrefix = this.configService.get<string>('apiPrefix') || 'api';
        return { url: `/${apiPrefix}/v1/docs` };
    }
}
