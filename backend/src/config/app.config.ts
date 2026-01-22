import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT ?? '3001', 10),
    apiVersion: process.env.API_VERSION || 'v1',

    // JWT Configuration
    jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-change-in-prod',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

    // Business configuration
    countryCode: process.env.COUNTRY_CODE || 'GH',
    currency: process.env.CURRENCY || 'GHS',
    vatRate: parseFloat(process.env.VAT_RATE ?? '0.125'),
    defaultReservationMinutes: parseInt(process.env.DEFAULT_RESERVATION_MINUTES ?? '10', 10),
    stockSafetyBuffer: parseInt(process.env.STOCK_SAFETY_BUFFER ?? '1', 10),

    // Payment
    polarApiKey: process.env.POLAR_API_KEY || '',
    polarWebhookSecret: process.env.POLAR_WEBHOOK_SECRET || '',
    polarMode: process.env.POLAR_MODE || 'test',
}));
