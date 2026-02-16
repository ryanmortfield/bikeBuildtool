/**
 * Component taxonomy for the build template.
 * Order and grouping define the UI; component keys are used in parts and build_parts.
 */

export type ComponentKey =
  | 'frame'
  | 'fork'
  | 'headset'
  | 'headset_spacers'
  | 'thru_axles'
  | 'crankset'
  | 'bottom_bracket'
  | 'chain'
  | 'cassette'
  | 'front_derailleur'
  | 'rear_derailleur'
  | 'shifters_brake_levers'
  | 'brake_calipers'
  | 'brake_rotors'
  | 'cables_housing'
  | 'shift_wires_batteries'
  | 'front_wheel'
  | 'rear_wheel'
  | 'tires'
  | 'inner_tubes'
  | 'rim_tape'
  | 'tubeless_valves_sealant'
  | 'handlebars_stem'
  | 'bar_tape'
  | 'saddle'
  | 'seatpost'
  | 'seatpost_clamp'
  | 'pedals'

export type ComponentGroup =
  | 'Frameset'
  | 'Drivetrain'
  | 'Braking & control'
  | 'Wheelset'
  | 'Cockpit'

export interface ComponentDef {
  key: ComponentKey
  label: string
  group: ComponentGroup
}

export const COMPONENTS: ComponentDef[] = [
  { key: 'frame', label: 'Frame', group: 'Frameset' },
  { key: 'fork', label: 'Fork', group: 'Frameset' },
  { key: 'headset', label: 'Headset', group: 'Frameset' },
  { key: 'headset_spacers', label: 'Headset Spacers', group: 'Frameset' },
  { key: 'thru_axles', label: 'Thru-Axles / Quick Releases', group: 'Frameset' },
  { key: 'crankset', label: 'Crankset (one complete part or Crank arms + Chainrings + Hardware)', group: 'Drivetrain' },
  { key: 'bottom_bracket', label: 'Bottom Bracket', group: 'Drivetrain' },
  { key: 'chain', label: 'Chain', group: 'Drivetrain' },
  { key: 'cassette', label: 'Cassette', group: 'Drivetrain' },
  { key: 'front_derailleur', label: 'Front Derailleur', group: 'Drivetrain' },
  { key: 'rear_derailleur', label: 'Rear Derailleur', group: 'Drivetrain' },
  { key: 'shifters_brake_levers', label: 'Shifters / Brake Levers', group: 'Braking & control' },
  { key: 'brake_calipers', label: 'Brake Calipers', group: 'Braking & control' },
  { key: 'brake_rotors', label: 'Brake Rotors', group: 'Braking & control' },
  { key: 'cables_housing', label: 'Cables & Housing', group: 'Braking & control' },
  { key: 'shift_wires_batteries', label: 'Shift Wires / Batteries', group: 'Braking & control' },
  { key: 'front_wheel', label: 'Front Wheel', group: 'Wheelset' },
  { key: 'rear_wheel', label: 'Rear Wheel', group: 'Wheelset' },
  { key: 'tires', label: 'Tires', group: 'Wheelset' },
  { key: 'inner_tubes', label: 'Inner Tubes', group: 'Wheelset' },
  { key: 'rim_tape', label: 'Rim Tape', group: 'Wheelset' },
  { key: 'tubeless_valves_sealant', label: 'Tubeless Valves & Sealant', group: 'Wheelset' },
  { key: 'handlebars_stem', label: 'Handlebars & Stem (integrated or separate)', group: 'Cockpit' },
  { key: 'bar_tape', label: 'Bar Tape', group: 'Cockpit' },
  { key: 'saddle', label: 'Saddle', group: 'Cockpit' },
  { key: 'seatpost', label: 'Seatpost', group: 'Cockpit' },
  { key: 'seatpost_clamp', label: 'Seatpost Clamp', group: 'Cockpit' },
  { key: 'pedals', label: 'Pedals', group: 'Cockpit' },
]

export const COMPONENT_KEYS: ComponentKey[] = COMPONENTS.map((c) => c.key)

export function isComponentKey(s: string): s is ComponentKey {
  return COMPONENT_KEYS.includes(s as ComponentKey)
}
