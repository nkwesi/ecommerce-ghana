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

describe('PaymentsService transaction reconciliation', () => {
    const payment = {
        orderId: 'order-1',
        paymentIntentId: 'GH_reference',
        paymentProvider: 'paystack',
        amountPesewas: 12550,
        currency: 'GHS',
        status: 'pending',
    };
    const order = { id: 'order-1', orderNumber: 'GH-20260716-0001', status: 'pending' };
    const paymentRepository = { findOne: jest.fn() };
    const manager = {
        findOne: jest.fn(),
        save: jest.fn(async (_entity, value) => value),
        update: jest.fn(),
    };
    const dataSource = { transaction: jest.fn(async (callback) => callback(manager)) };
    const service = new PaymentsService(
        paymentRepository as never,
        {} as never,
        {} as never,
        {} as never,
        dataSource as never,
        { get: (key: string, fallback: unknown) => ({
            'app.paymentMode': 'paystack',
            'app.paystackSecretKey': 'sk_test',
            'app.paystackWebhookSecret': 'sk_test',
        }[key] ?? fallback) } as never,
    );

    beforeEach(() => {
        jest.clearAllMocks();
        payment.status = 'pending';
        order.status = 'pending';
        paymentRepository.findOne.mockResolvedValue(payment);
        manager.findOne.mockImplementation(async (entity) => entity.name === 'Payment' ? payment : order);
    });

    afterEach(() => jest.restoreAllMocks());

    it('marks an exactly matched verified transaction paid once', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({ status: true, data: {
                reference: payment.paymentIntentId,
                amount: payment.amountPesewas,
                currency: payment.currency,
                status: 'success',
                metadata: { orderId: order.id },
            } }),
        } as Response);

        await expect(service.reconcileOrderPayment(order.id)).resolves.toBe('succeeded');
        expect(payment.status).toBe('succeeded');
        expect(order.status).toBe('paid');
        expect(manager.update).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('rejects a verified amount mismatch without marking the order paid', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({ status: true, data: {
                reference: payment.paymentIntentId,
                amount: payment.amountPesewas - 1,
                currency: payment.currency,
                status: 'success',
            } }),
        } as Response);

        await expect(service.reconcileOrderPayment(order.id)).rejects.toThrow('amount mismatch');
        expect(payment.status).toBe('pending');
        expect(order.status).toBe('pending');
        expect(manager.update).not.toHaveBeenCalled();
    });
});
