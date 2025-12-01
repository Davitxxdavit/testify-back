import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: any): Promise<CurrentUserPayload> {
    const { sub, type } = payload;

    if (type === 'user') {
      const user = await this.prisma.user.findUnique({
        where: { id: sub },
        select: { id: true, email: true, phone: true, name: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        type: 'user',
      };
    } else if (type === 'staff') {
      const staff = await this.prisma.staff.findUnique({
        where: { id: sub },
        select: { id: true, name: true, role: true, phone: true },
      });

      if (!staff) {
        throw new UnauthorizedException('Staff not found');
      }

      return {
        id: staff.id,
        phone: staff.phone,
        role: staff.role,
        type: 'staff',
      };
    }

    throw new UnauthorizedException('Invalid token type');
  }
}



