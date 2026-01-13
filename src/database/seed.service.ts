import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
    private readonly logger = new Logger(SeedService.name);

    constructor(private prisma: PrismaService) { }

    // Called by PrismaService AFTER migrations complete
    async runSeeds() {
        this.logger.log('🌱 Starting database seeding...');
        await this.seedAdminUser();
        await this.seedMenuData();
        this.logger.log('🌱 Database seeding complete!');
    }

    private async seedAdminUser() {
        const adminPhone = '555000001';

        try {
            // Check if admin already exists
            const existingAdmin = await this.prisma.staff.findFirst({
                where: { role: 'ADMIN' },
            });

            if (existingAdmin) {
                this.logger.log('Admin user already exists, skipping seed');
                return;
            }

            // Create default admin
            const passwordHash = await bcrypt.hash('admin123', 10);

            await this.prisma.staff.create({
                data: {
                    name: 'Administrator',
                    phone: adminPhone,
                    role: 'ADMIN',
                    passwordHash,
                },
            });

            this.logger.log('✅ Default admin user created!');
            this.logger.log('📱 Phone: 555000001');
            this.logger.log('🔑 Password: admin123');
            this.logger.warn('⚠️  IMPORTANT: Change the default password after first login!');
        } catch (error: any) {
            this.logger.error('Failed to seed admin user:', error?.message);
        }
    }

    private async seedMenuData() {
        try {
            // Check if menu data exists
            const categoryCount = await this.prisma.menuCategory.count();
            if (categoryCount > 0) {
                this.logger.log('Menu data already exists, skipping seed');
                return;
            }

            // Create categories
            const burgers = await this.prisma.menuCategory.create({
                data: {
                    name: 'Burgers',
                    sortOrder: 1,
                },
            });

            const sides = await this.prisma.menuCategory.create({
                data: {
                    name: 'Sides',
                    sortOrder: 2,
                },
            });

            const drinks = await this.prisma.menuCategory.create({
                data: {
                    name: 'Drinks',
                    sortOrder: 3,
                },
            });

            // Create menu items
            await this.prisma.menuItem.createMany({
                data: [
                    {
                        categoryId: burgers.id,
                        name: 'Classic Cheeseburger',
                        description: 'Juicy beef patty with cheddar cheese, lettuce, tomato, and our secret sauce',
                        price: 12.99,
                        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
                        isActive: true,
                    },
                    {
                        categoryId: burgers.id,
                        name: 'Bacon BBQ Burger',
                        description: 'Smoky BBQ sauce, crispy bacon, onion rings, and pepper jack cheese',
                        price: 15.49,
                        imageUrl: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500',
                        isActive: true,
                    },
                    {
                        categoryId: burgers.id,
                        name: 'Mushroom Swiss Burger',
                        description: 'Sautéed mushrooms, swiss cheese, caramelized onions, and truffle mayo',
                        price: 14.50,
                        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500',
                        isActive: true,
                    },
                    {
                        categoryId: burgers.id,
                        name: 'Double Smash Burger',
                        description: 'Two thin crispy patties, American cheese, pickles, and special sauce',
                        price: 16.99,
                        imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500',
                        isActive: true,
                    },
                    {
                        categoryId: sides.id,
                        name: 'Crispy Fries',
                        description: 'Golden, perfectly salted french fries',
                        price: 4.99,
                        imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500',
                        isActive: true,
                    },
                    {
                        categoryId: sides.id,
                        name: 'Onion Rings',
                        description: 'Beer-battered onion rings with chipotle dip',
                        price: 5.99,
                        imageUrl: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=500',
                        isActive: true,
                    },
                    {
                        categoryId: drinks.id,
                        name: 'Fresh Lemonade',
                        description: 'House-made lemonade with fresh lemons and mint',
                        price: 3.99,
                        imageUrl: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=500',
                        isActive: true,
                    },
                    {
                        categoryId: drinks.id,
                        name: 'Craft Cola',
                        description: 'Premium artisan cola with natural ingredients',
                        price: 2.99,
                        imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=500',
                        isActive: true,
                    },
                ],
            });

            this.logger.log('✅ Sample menu data seeded!');
            this.logger.log(`   - Burgers category with 4 items`);
            this.logger.log(`   - Sides category with 2 items`);
            this.logger.log(`   - Drinks category with 2 items`);
        } catch (error: any) {
            this.logger.error('Failed to seed menu data:', error?.message);
        }
    }
}
