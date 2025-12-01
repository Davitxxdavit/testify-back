import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export class CreateStaffDto {
  name: string;
  role: UserRole;
  phone: string;
  password: string;
}

export class UpdateStaffDto {
  name?: string;
  role?: UserRole;
  phone?: string;
  password?: string;
}

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.staff.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    return staff;
  }

  async create(createStaffDto: CreateStaffDto) {
    const existingStaff = await this.prisma.staff.findUnique({
      where: { phone: createStaffDto.phone },
    });

    if (existingStaff) {
      throw new ConflictException('Staff with this phone already exists');
    }

    const passwordHash = await bcrypt.hash(createStaffDto.password, 10);

    return this.prisma.staff.create({
      data: {
        name: createStaffDto.name,
        role: createStaffDto.role,
        phone: createStaffDto.phone,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, updateStaffDto: UpdateStaffDto) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    const updateData: any = { ...updateStaffDto };

    if (updateStaffDto.password) {
      updateData.passwordHash = await bcrypt.hash(updateStaffDto.password, 10);
      delete updateData.password;
    }

    return this.prisma.staff.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    // Soft delete
    return this.prisma.staff.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}



