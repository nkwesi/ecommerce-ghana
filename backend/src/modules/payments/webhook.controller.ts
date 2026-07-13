import {
    Controller,
    Post,
    Body,
    Headers,
    HttpException,
    HttpStatus,
    Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import type { PaystackWebhookEvent } from './payments.service';
import { ConfigService } from '@nestjs/config';

@Controller('webhooks')
export class WebhookController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Handle Polar webhook events.
     * CRITICAL: This endpoint receives payment status updates.
     */
    @Post('paystack')
    async handlePaystackWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('x-paystack-signature') signature: string,
        @Body() body: PaystackWebhookEvent,
    ) {
        // Verify webhook signature
        const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(body));

        if (!this.paymentsService.verifyWebhookSignature(rawBody, signature)) {
            throw new HttpException('Invalid webhook signature', HttpStatus.UNAUTHORIZED);
        }

        try {
            await this.paymentsService.processWebhook(body);
            return { received: true };
        } catch (error) {
            console.error('Webhook processing error:', error);
            throw new HttpException('Webhook processing failed', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Simulate payment success (for testing only).
     */
    @Post('test/success')
    async simulateSuccess(@Body() body: { paymentIntentId: string }) {
        this.assertTestEndpointsEnabled();
        await this.paymentsService.simulatePaymentSuccess(body.paymentIntentId);
        return { success: true };
    }

    /**
     * Simulate payment failure (for testing only).
     */
    @Post('test/failure')
    async simulateFailure(
        @Body() body: { paymentIntentId: string; reason?: string },
    ) {
        this.assertTestEndpointsEnabled();
        await this.paymentsService.simulatePaymentFailure(
            body.paymentIntentId,
            body.reason ?? 'Payment declined',
        );
        return { success: true };
    }

    private assertTestEndpointsEnabled(): void {
        if (!this.configService.get<boolean>('app.paymentTestEndpointsEnabled', false)) {
            throw new HttpException('Not found', HttpStatus.NOT_FOUND);
        }
    }
}
