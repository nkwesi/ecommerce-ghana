import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async findByEmailWithPassword(email: string): Promise<User | null> {
        return this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.email = :email', { email })
            .getOne();
    }

    async findById(id: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { id } });
    }

    async create(userData: Partial<User>): Promise<User> {
        const user = this.userRepository.create(userData);
        return this.userRepository.save(user);
    }

    async update(id: string, userData: Partial<User>): Promise<User | null> {
        await this.userRepository.update(id, userData);
        return this.userRepository.findOne({ where: { id } });
    }

    async delete(id: string): Promise<void> {
        await this.userRepository.update(id, { isActive: false });
        // In production, you might want to actually delete or anonymize the user
    }

    async createOrUpdate(email: string, userData: Partial<User>): Promise<User> {
        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            return this.update(existingUser.id, userData) as Promise<User>;
        }
        return this.create({ ...userData, email });
    }

    async createAdmin(email: string, hashedPassword: string, fullName: string): Promise<User> {
        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            // Update existing user to admin
            return this.update(existingUser.id, {
                password: hashedPassword,
                fullName,
                role: UserRole.ADMIN,
            }) as Promise<User>;
        }
        return this.create({
            email,
            password: hashedPassword,
            fullName,
            role: UserRole.ADMIN,
        });
    }

    async findAllUsers(limit = 50, offset = 0): Promise<{ users: User[]; total: number }> {
        const [users, total] = await this.userRepository.findAndCount({
            take: limit,
            skip: offset,
            order: { createdAt: 'DESC' },
        });
        return { users, total };
    }
}
