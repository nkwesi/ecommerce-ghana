import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';
import Redis from 'ioredis';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly redisClient: Redis | null = null;
    private readonly memoryStore = new Map<string, { otp: string; expires: number }>();
    private readonly otpTtl = 300; // 5 minutes in seconds

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) {
        try {
            this.redisClient = new Redis({
                host: this.configService.get<string>('redis.host'),
                port: this.configService.get<number>('redis.port'),
                retryStrategy: (times) => {
                    if (times > 1) return null;
                    return 0;
                }
            });

            this.redisClient.on('error', (err) => {
                this.logger.warn(`Redis connection failed: ${err.message}. Falling back to memory store.`);
            });
        } catch (err) {
            this.logger.warn(`Failed to initialize Redis: ${err}. Using memory store.`);
        }
    }

    // ============================================
    // OTP-based Login (for Customers)
    // ============================================

    async requestOtp(email: string): Promise<string> {
        const otp = crypto.randomInt(100000, 999999).toString();
        const key = `otp:${email}`;

        if (this.redisClient && this.redisClient.status === 'ready') {
            try {
                await this.redisClient.set(key, otp, 'EX', this.otpTtl);
            } catch (err) {
                this.saveToMemory(key, otp);
            }
        } else {
            this.saveToMemory(key, otp);
        }

        // MOCK: Sending email
        this.logger.log(`[AUTH] Generated OTP ${otp} for ${email}`);
        console.log(`\n-----------------------------------------`);
        console.log(`AUTH OTP FOR ${email}: ${otp}`);
        console.log(`-----------------------------------------\n`);

        return otp;
    }

    private saveToMemory(key: string, otp: string) {
        this.memoryStore.set(key, {
            otp,
            expires: Date.now() + (this.otpTtl * 1000)
        });
    }

    async verifyOtp(email: string, otp: string): Promise<{ user: any; token: string } | null> {
        const key = `otp:${email}`;
        let storedOtp: string | null = null;

        if (this.redisClient && this.redisClient.status === 'ready') {
            try {
                storedOtp = await this.redisClient.get(key);
            } catch (err) {
                storedOtp = this.getFromMemory(key);
            }
        } else {
            storedOtp = this.getFromMemory(key);
        }

        if (!storedOtp || storedOtp !== otp) {
            return null;
        }

        // Delete OTP after successful verification
        if (this.redisClient && this.redisClient.status === 'ready') {
            await this.redisClient.del(key).catch(() => this.memoryStore.delete(key));
        } else {
            this.memoryStore.delete(key);
        }

        let user = await this.usersService.findByEmail(email);

        if (!user) {
            user = await this.usersService.createOrUpdate(email, { fullName: 'Guest User' });
        }

        const token = this.generateJwt(user);

        return { user, token };
    }

    private getFromMemory(key: string): string | null {
        const data = this.memoryStore.get(key);
        if (!data) return null;
        if (Date.now() > data.expires) {
            this.memoryStore.delete(key);
            return null;
        }
        return data.otp;
    }

    // ============================================
    // Password-based Login (for Admins)
    // ============================================

    async loginWithPassword(email: string, password: string): Promise<{ user: any; token: string }> {
        const user = await this.usersService.findByEmailWithPassword(email);

        if (!user || !user.password) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
            throw new UnauthorizedException('Admin access required');
        }

        const token = this.generateJwt(user);

        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
            token,
        };
    }

    async createAdminUser(email: string, password: string, fullName: string): Promise<any> {
        const hashedPassword = await bcrypt.hash(password, 10);
        return this.usersService.createAdmin(email, hashedPassword, fullName);
    }

    // ============================================
    // JWT Token Generation
    // ============================================

    private generateJwt(user: any): string {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return this.jwtService.sign(payload);
    }
}
