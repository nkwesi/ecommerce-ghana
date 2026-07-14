import { DeliveryZone, getDeliveryFee } from './delivery-zones';

describe('delivery zone pricing', () => {
    it.each([
        [DeliveryZone.CENTRAL_ACCRA, 35],
        [DeliveryZone.WIDER_ACCRA, 50],
        [DeliveryZone.TEMA_CORRIDOR, 60],
    ])('charges %s at GHS %i', (zone, expectedFee) => {
        expect(getDeliveryFee(zone)).toBe(expectedFee);
    });
});
