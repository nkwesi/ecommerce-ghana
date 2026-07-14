export enum DeliveryZone {
    CENTRAL_ACCRA = 'central_accra',
    WIDER_ACCRA = 'wider_accra',
    TEMA_CORRIDOR = 'tema_corridor',
}

export const DELIVERY_ZONE_FEES: Record<DeliveryZone, number> = {
    [DeliveryZone.CENTRAL_ACCRA]: 35,
    [DeliveryZone.WIDER_ACCRA]: 50,
    [DeliveryZone.TEMA_CORRIDOR]: 60,
};

export function getDeliveryFee(zone: DeliveryZone): number {
    return DELIVERY_ZONE_FEES[zone];
}
