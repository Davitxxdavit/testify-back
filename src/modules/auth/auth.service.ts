import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, phone, password, name } = registerDto;

    if (!email && !phone) {
      throw new ConflictException('Email or phone is required');
    }

    // Check if user already exists
    if (email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    if (phone) {
      const existingUser = await this.prisma.user.findUnique({
        where: { phone },
      });
      if (existingUser) {
        throw new ConflictException('User with this phone already exists');
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        phone,
        name,
        passwordHash,
      },
    });

    return this.generateTokens(user.id, 'user', {
      email: user.email,
      phone: user.phone,
      name: user.name,
    });
  }

  async login(loginDto: LoginDto, type: 'user' | 'staff' = 'user'): Promise<AuthResponseDto> {
    const { email, phone, password } = loginDto;

    if (!email && !phone) {
      throw new UnauthorizedException('Email or phone is required');
    }

    let user: any;

    if (type === 'user') {
      user = email
        ? await this.prisma.user.findUnique({ where: { email } })
        : await this.prisma.user.findUnique({ where: { phone } });
    } else {
      user = await this.prisma.staff.findUnique({ where: { phone } });
      if (!user && email) {
        // Staff might use email-like identifier
        user = await this.prisma.staff.findFirst({
          where: { phone: email },
        });
      }
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (type === 'user') {
      return this.generateTokens(user.id, 'user', {
        email: user.email,
        phone: user.phone,
        name: user.name,
      });
    } else {
      return this.generateTokens(user.id, 'staff', {
        name: user.name,
        phone: user.phone,
        role: user.role,
      });
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone: email }],
      },
    });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  private async generateTokens(
    userId: string,
    type: 'user' | 'staff',
    userData: any,
  ): Promise<AuthResponseDto> {
    const payload = { sub: userId, type };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        ...userData,
        type,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const { sub, type } = payload;

      if (type === 'user') {
        const user = await this.prisma.user.findUnique({
          where: { id: sub },
          select: { id: true, email: true, phone: true, name: true },
        });

        if (!user) {
          throw new UnauthorizedException('User not found');
        }

        return this.generateTokens(user.id, 'user', {
          email: user.email,
          phone: user.phone,
          name: user.name,
        });
      } else {
        const staff = await this.prisma.staff.findUnique({
          where: { id: sub },
          select: { id: true, name: true, role: true, phone: true },
        });

        if (!staff) {
          throw new UnauthorizedException('Staff not found');
        }

        return this.generateTokens(staff.id, 'staff', {
          name: staff.name,
          phone: staff.phone,
          role: staff.role,
        });
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}


