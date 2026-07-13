import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Needed for webhook signature verification
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3001);
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');
  const jwtSecret = configService.get<string>('app.jwtSecret', '');
  const paymentMode = configService.get<string>('app.paymentMode', 'demo');

  if (nodeEnv === 'production' && jwtSecret === 'default-jwt-secret-change-in-prod') {
    throw new Error('JWT_SECRET must be configured in production');
  }
  if (nodeEnv === 'production' && paymentMode !== 'paystack') {
    throw new Error('PAYMENT_MODE must be paystack in production');
  }
  if (paymentMode === 'paystack' && !configService.get<string>('app.paystackSecretKey')) {
    throw new Error('PAYSTACK_SECRET_KEY is required when PAYMENT_MODE=paystack');
  }

  // Enable CORS for frontend
  app.enableCors({
    origin: configService.get<string[]>('app.corsOrigins', ['http://localhost:3000']),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // Set global API prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
  console.log(`🚀 E-commerce Ghana API running on http://localhost:${port}`);
  console.log(`📦 API endpoints: http://localhost:${port}/api/v1`);
}

bootstrap();
