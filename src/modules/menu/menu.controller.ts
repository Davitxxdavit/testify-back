import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { CreateModifierDto } from './dto/create-modifier.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname } from 'path';

const imageStorage = diskStorage({
  destination: './uploads/menu',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // Categories - Public
  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Get all menu categories with items' })
  async getCategories() {
    return this.menuService.getCategories();
  }

  @Public()
  @Get('categories/:id')
  @ApiOperation({ summary: 'Get a category by ID' })
  async getCategory(@Param('id') id: string) {
    return this.menuService.getCategory(+id);
  }

  // Categories - Admin
  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.menuService.createCategory(createCategoryDto);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category (Admin only)' })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateCategoryDto>,
  ) {
    return this.menuService.updateCategory(+id, updateData);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a category (Admin only)' })
  async deleteCategory(@Param('id') id: string) {
    return this.menuService.deleteCategory(+id);
  }

  // Items - Public
  @Public()
  @Get('items')
  @ApiOperation({ summary: 'Get all menu items' })
  async getItems(@Query('categoryId') categoryId?: string) {
    return this.menuService.getItems(categoryId ? +categoryId : undefined);
  }

  @Public()
  @Get('items/:id')
  @ApiOperation({ summary: 'Get a menu item by ID' })
  async getItem(@Param('id') id: string) {
    return this.menuService.getItem(+id);
  }

  // Items - Admin
  @Post('items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new menu item (Admin only)' })
  async createItem(@Body() createItemDto: CreateItemDto) {
    return this.menuService.createItem(createItemDto);
  }

  @Post('items/upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: imageStorage,
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload menu item image (Admin only)' })
  async uploadImage(@UploadedFile() file: any) {
    return {
      url: `/uploads/menu/${file.filename}`,
      filename: file.filename,
    };
  }

  @Put('items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a menu item (Admin only)' })
  async updateItem(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateItemDto>,
  ) {
    return this.menuService.updateItem(+id, updateData);
  }

  @Delete('items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a menu item (Admin only)' })
  async deleteItem(@Param('id') id: string) {
    return this.menuService.deleteItem(+id);
  }

  // Modifiers - Public
  @Public()
  @Get('items/:itemId/modifiers')
  @ApiOperation({ summary: 'Get modifiers for a menu item' })
  async getModifiers(@Param('itemId') itemId: string) {
    return this.menuService.getModifiers(+itemId);
  }

  // Modifiers - Admin
  @Post('modifiers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new modifier (Admin only)' })
  async createModifier(@Body() createModifierDto: CreateModifierDto) {
    return this.menuService.createModifier(createModifierDto);
  }

  @Put('modifiers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a modifier (Admin only)' })
  async updateModifier(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateModifierDto>,
  ) {
    return this.menuService.updateModifier(+id, updateData);
  }

  @Delete('modifiers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a modifier (Admin only)' })
  async deleteModifier(@Param('id') id: string) {
    return this.menuService.deleteModifier(+id);
  }
}

