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
import type { PolarWebhookEvent } from './payments.service';

@Controller('api/v1/webhooks')
export class WebhookController {
    constructor(private readonly paymentsService: PaymentsService) { }

    /**
     * Handle Polar webhook events.
     * CRITICAL: This endpoint receives payment status updates.
     */
    @Post('polar')
    async handlePolarWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('x-polar-signature') signature: string,
        @Body() body: PolarWebhookEvent,
    ) {
        // Verify webhook signature
        const rawBody = req.rawBody?.toString() ?? JSON.stringify(body);

        if (signature && !this.paymentsService.verifyWebhookSignature(rawBody, signature)) {
            throw new HttpException('Invalid webhook signature', HttpStatus.UNAUTHORIZED);
        }

        try {
            await this.paymentsService.processWebhook(body);
            return { received: true };
        } catch (error) {
            // Log but still return 200 to prevent retries for unrecoverable errors
            console.error('Webhook processing error:', error);
            return { received: true, error: error.message };
        }
    }

    /**
     * Simulate payment success (for testing only).
     */
    @Post('test/success')
    async simulateSuccess(@Body() body: { paymentIntentId: string }) {
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
        await this.paymentsService.simulatePaymentFailure(
            body.paymentIntentId,
            body.reason ?? 'Payment declined',
        );
        return { success: true };
    }
}
