import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import Redis from 'ioredis';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly redisClient: Redis | null = null;
    private readonly memoryStore = new Map<string, { otp: string; expires: number }>();
    private readonly otpTtl = 300; // 5 minutes in seconds

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
    ) {
        try {
            this.redisClient = new Redis({
                host: this.configService.get<string>('redis.host'),
                port: this.configService.get<number>('redis.port'),
                retryStrategy: (times) => {
                    if (times > 1) return null; // Only try once, then fail over
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
            // Check if there are orders with this email to pre-fill?
            // For now, we return a mock user if not found to allow testing the dashboard
            // In production, this would be handled differently.
            user = await this.usersService.createOrUpdate(email, { fullName: 'Guest User' });
        }

        // MOCK: JWT token issuance
        const token = `mock-jwt-token-for-${user.id}`;

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
}
