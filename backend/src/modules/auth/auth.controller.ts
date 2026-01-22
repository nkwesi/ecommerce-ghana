import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // ============================================
    // OTP-based Login (for Customers)
    // ============================================

    @Post('request-otp')
    async requestOtp(
        @Body('email') email: string,
        @Res() res: Response,
    ) {
        if (!email) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Email is required' });
        }

        const otp = await this.authService.requestOtp(email);

        const isDev = process.env.NODE_ENV === 'development';

        return res.status(HttpStatus.OK).json({
            message: 'OTP sent successfully',
            ...(isDev ? { dev_otp: otp } : {})
        });
    }

    @Post('verify-otp')
    async verifyOtp(
        @Body('email') email: string,
        @Body('otp') otp: string,
        @Res() res: Response,
    ) {
        if (!email || !otp) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Email and OTP are required' });
        }

        const result = await this.authService.verifyOtp(email, otp);

        if (!result) {
            return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Invalid or expired OTP' });
        }

        return res.status(HttpStatus.OK).json(result);
    }

    // ============================================
    // Password-based Login (for Admins)
    // ============================================

    @Post('admin/login')
    async adminLogin(
        @Body('email') email: string,
        @Body('password') password: string,
        @Res() res: Response,
    ) {
        if (!email || !password) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Email and password are required' });
        }

        try {
            const result = await this.authService.loginWithPassword(email, password);
            return res.status(HttpStatus.OK).json(result);
        } catch (error) {
            return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Invalid credentials' });
        }
    }

    @Post('admin/setup')
    async setupAdmin(
        @Body('email') email: string,
        @Body('password') password: string,
        @Body('fullName') fullName: string,
        @Body('setupKey') setupKey: string,
        @Res() res: Response,
    ) {
        // Simple setup key check - in production, use a more secure method
        const validSetupKey = process.env.ADMIN_SETUP_KEY || 'admin-setup-secret';

        if (setupKey !== validSetupKey) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Invalid setup key' });
        }

        if (!email || !password || !fullName) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Email, password, and fullName are required' });
        }

        try {
            const user = await this.authService.createAdminUser(email, password, fullName);
            return res.status(HttpStatus.CREATED).json({
                message: 'Admin user created successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                },
            });
        } catch (error) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to create admin user' });
        }
    }
}
