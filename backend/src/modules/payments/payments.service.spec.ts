import * as crypto from 'crypto';
import { PaymentsService } from './payments.service';

describe('PaymentsService webhook verification', () => {
    const secret = 'test_webhook_secret';
    const service = new PaymentsService(
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        { get: (_key: string, fallback: string) => secret || fallback } as never,
    );

    it('accepts a valid Paystack SHA-512 signature', () => {
        const payload = Buffer.from('{"event":"charge.success"}');
        const signature = crypto.createHmac('sha512', secret).update(payload).digest('hex');
        expect(service.verifyWebhookSignature(payload, signature)).toBe(true);
    });

    it('rejects a missing or invalid signature', () => {
        const payload = Buffer.from('{"event":"charge.success"}');
        expect(service.verifyWebhookSignature(payload, '')).toBe(false);
        expect(service.verifyWebhookSignature(payload, 'invalid')).toBe(false);
    });
});
