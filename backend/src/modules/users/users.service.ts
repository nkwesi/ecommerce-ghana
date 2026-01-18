import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async create(userData: Partial<User>): Promise<User> {
        const user = this.userRepository.create(userData);
        return this.userRepository.save(user);
    }

    async update(id: string, userData: Partial<User>): Promise<User | null> {
        await this.userRepository.update(id, userData);
        return this.userRepository.findOne({ where: { id } });
    }

    async createOrUpdate(email: string, userData: Partial<User>): Promise<User> {
        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            return this.update(existingUser.id, userData) as Promise<User>;
        }
        return this.create({ ...userData, email });
    }
}
