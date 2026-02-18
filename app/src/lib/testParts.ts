/**
 * Test parts for UI development: one per fixed scaffold component.
 * Names are prefixed so we can find them when filling a build.
 */
export const TEST_PART_PREFIX = 'Test: '

export const TEST_PARTS: { name: string; component: string; weightG?: number; price?: number; currency?: string }[] = [
  { name: 'Test: Frame', component: 'frame', weightG: 1200, price: 899, currency: 'USD' },
  { name: 'Test: Fork', component: 'fork', weightG: 450, price: 349, currency: 'USD' },
  { name: 'Test: Headset', component: 'headset', weightG: 120, price: 45, currency: 'USD' },
  { name: 'Test: Headset Spacers', component: 'headset_spacers', weightG: 15, price: 8, currency: 'USD' },
  { name: 'Test: Thru-Axles', component: 'thru_axles', weightG: 85, price: 55, currency: 'USD' },
  { name: 'Test: Crankset', component: 'crankset', weightG: 680, price: 220, currency: 'USD' },
  { name: 'Test: Bottom Bracket', component: 'bottom_bracket', weightG: 85, price: 42, currency: 'USD' },
  { name: 'Test: Chain', component: 'chain', weightG: 258, price: 35, currency: 'USD' },
  { name: 'Test: Cassette', component: 'cassette', weightG: 285, price: 95, currency: 'USD' },
  { name: 'Test: Front Derailleur', component: 'front_derailleur', weightG: 115, price: 65, currency: 'USD' },
  { name: 'Test: Rear Derailleur', component: 'rear_derailleur', weightG: 235, price: 120, currency: 'USD' },
  { name: 'Test: Shifters', component: 'shifters_brake_levers', weightG: 420, price: 180, currency: 'USD' },
  { name: 'Test: Brake Calipers', component: 'brake_calipers', weightG: 380, price: 150, currency: 'USD' },
  { name: 'Test: Brake Rotors', component: 'brake_rotors', weightG: 220, price: 80, currency: 'USD' },
  { name: 'Test: Cables & Housing', component: 'cables_housing', weightG: 120, price: 25, currency: 'USD' },
  { name: 'Test: Shift Wires', component: 'shift_wires_batteries', weightG: 45, price: 30, currency: 'USD' },
  { name: 'Test: Front Wheel', component: 'front_wheel', weightG: 850, price: 400, currency: 'USD' },
  { name: 'Test: Rear Wheel', component: 'rear_wheel', weightG: 920, price: 450, currency: 'USD' },
  { name: 'Test: Tires', component: 'tires', weightG: 520, price: 90, currency: 'USD' },
  { name: 'Test: Inner Tubes', component: 'inner_tubes', weightG: 180, price: 15, currency: 'USD' },
  { name: 'Test: Rim Tape', component: 'rim_tape', weightG: 35, price: 12, currency: 'USD' },
  { name: 'Test: Tubeless Sealant', component: 'tubeless_valves_sealant', weightG: 120, price: 28, currency: 'USD' },
  { name: 'Test: Handlebars & Stem', component: 'handlebars_stem', weightG: 380, price: 140, currency: 'USD' },
  { name: 'Test: Bar Tape', component: 'bar_tape', weightG: 65, price: 22, currency: 'USD' },
  { name: 'Test: Saddle', component: 'saddle', weightG: 245, price: 85, currency: 'USD' },
  { name: 'Test: Seatpost', component: 'seatpost', weightG: 210, price: 65, currency: 'USD' },
  { name: 'Test: Seatpost Clamp', component: 'seatpost_clamp', weightG: 45, price: 18, currency: 'USD' },
  { name: 'Test: Pedals', component: 'pedals', weightG: 320, price: 55, currency: 'USD' },
]
