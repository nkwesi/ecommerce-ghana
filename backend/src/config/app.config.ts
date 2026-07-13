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
    // Configure from accountant-confirmed tax treatment. Use 0 for tax-inclusive prices.
    vatRate: parseFloat(process.env.VAT_RATE ?? '0'),
    defaultReservationMinutes: parseInt(process.env.DEFAULT_RESERVATION_MINUTES ?? '10', 10),
    stockSafetyBuffer: parseInt(process.env.STOCK_SAFETY_BUFFER ?? '1', 10),

    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),

    // Payment
    paymentMode: process.env.PAYMENT_MODE || 'demo',
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
    paystackWebhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY || '',
    paymentTestEndpointsEnabled: process.env.PAYMENT_TEST_ENDPOINTS_ENABLED === 'true',
}));
