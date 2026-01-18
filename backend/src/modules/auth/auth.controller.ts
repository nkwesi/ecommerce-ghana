import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

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
}
