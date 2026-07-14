export const deliveryZones = [
  {
    id: 'central_accra',
    name: 'Central Accra',
    areas: 'Osu, Ridge, Cantonments, Airport and East Legon',
    fee: 35,
  },
  {
    id: 'wider_accra',
    name: 'Wider Accra',
    areas: 'Circle, Lapaz, Achimota, Madina, Adenta, Spintex, Dansoman and Weija',
    fee: 50,
  },
  {
    id: 'tema_corridor',
    name: 'Tema corridor',
    areas: 'Tema Communities 1–12 and long-haul Tema routes',
    fee: 60,
  },
] as const;

export type DeliveryZoneId = (typeof deliveryZones)[number]['id'];

export function getDeliveryZone(id: DeliveryZoneId) {
  return deliveryZones.find((zone) => zone.id === id) ?? deliveryZones[0];
}
