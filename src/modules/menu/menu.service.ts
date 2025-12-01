import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { CreateModifierDto } from './dto/create-modifier.dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  // Categories
  async getCategories() {
    return this.prisma.menuCategory.findMany({
      where: { deletedAt: null },
      include: {
        items: {
          where: { deletedAt: null, isActive: true },
          include: {
            modifiers: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getCategory(id: number) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id },
      include: {
        items: {
          where: { deletedAt: null },
          include: {
            modifiers: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async createCategory(createCategoryDto: CreateCategoryDto) {
    return this.prisma.menuCategory.create({
      data: createCategoryDto,
    });
  }

  async updateCategory(id: number, updateData: Partial<CreateCategoryDto>) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.menuCategory.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteCategory(id: number) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Soft delete
    return this.prisma.menuCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Items
  async getItems(categoryId?: number) {
    const where: any = { deletedAt: null, isActive: true };
    if (categoryId) {
      where.categoryId = categoryId;
    }

    return this.prisma.menuItem.findMany({
      where,
      include: {
        category: true,
        modifiers: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getItem(id: number) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        modifiers: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return item;
  }

  async createItem(createItemDto: CreateItemDto) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id: createItemDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.menuItem.create({
      data: {
        categoryId: createItemDto.categoryId,
        name: createItemDto.name,
        description: createItemDto.description,
        price: createItemDto.price,
        imageUrl: createItemDto.imageUrl,
        isActive: createItemDto.isActive ?? true,
      },
      include: {
        category: true,
        modifiers: true,
      },
    });
  }

  async updateItem(id: number, updateData: Partial<CreateItemDto>) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return this.prisma.menuItem.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        modifiers: true,
      },
    });
  }

  async deleteItem(id: number) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    // Soft delete
    return this.prisma.menuItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Modifiers
  async getModifiers(itemId: number) {
    return this.prisma.menuModifier.findMany({
      where: { itemId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createModifier(createModifierDto: CreateModifierDto) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: createModifierDto.itemId },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return this.prisma.menuModifier.create({
      data: {
        itemId: createModifierDto.itemId,
        name: createModifierDto.name,
        price: createModifierDto.price,
      },
    });
  }

  async updateModifier(id: number, updateData: Partial<CreateModifierDto>) {
    const modifier = await this.prisma.menuModifier.findUnique({
      where: { id },
    });

    if (!modifier) {
      throw new NotFoundException('Modifier not found');
    }

    return this.prisma.menuModifier.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteModifier(id: number) {
    const modifier = await this.prisma.menuModifier.findUnique({
      where: { id },
    });

    if (!modifier) {
      throw new NotFoundException('Modifier not found');
    }

    return this.prisma.menuModifier.delete({
      where: { id },
    });
  }
}



