import { PolicyPage } from '@/components/policy-page';

export default function Page() {
  return <PolicyPage title="Delivery information" updated="14 July 2026">
    <h2>Accra delivery</h2>
    <p>Drobe 233 delivers across Accra through third-party courier partners. Delivery fees are calculated by the zone selected at checkout and shown before payment.</p>

    <h2>Delivery zones</h2>
    <p>Central Accra is GH₵35 and includes Osu, Ridge, Cantonments, Airport and East Legon. Wider Accra is GH₵50 and includes Circle, Lapaz, Achimota, Madina, Adenta, Spintex, Dansoman and Weija. The Tema corridor is GH₵60 and covers Tema Communities 1–12 and long-haul Tema routes.</p>

    <h2>Timing and tracking</h2>
    <p>Same-day delivery is subject to order time, payment confirmation and rider availability. Customers receive an order number after checkout, and courier tracking is shared when available.</p>

    <h2>Address checks</h2>
    <p>Please provide an accurate phone number, neighbourhood, street or digital address, and a useful landmark. We will contact you before dispatch if the selected zone or address needs clarification.</p>

    <h2>Third-party delivery</h2>
    <p>A courier partner performs the physical delivery, but Drobe 233 remains your point of contact for order support. Delivery fees and coverage may be updated when courier pricing changes.</p>
  </PolicyPage>;
}
