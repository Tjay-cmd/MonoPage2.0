export const NICHES = [
  {
    value: "plumber",
    label: "Plumber",
    description: "Schedule jobs, manage quotes, and track inventory",
  },
  {
    value: "photographer",
    label: "Photographer",
    description: "Showcase portfolios, book sessions, and deliver galleries",
  },
  {
    value: "barber",
    label: "Barber",
    description: "Online booking, client management, and appointment reminders",
  },
] as const;

export type NicheValue = (typeof NICHES)[number]["value"];

export const VALID_NICHES: string[] = NICHES.map((n) => n.value);

export function isValidNiche(value: string): value is NicheValue {
  return VALID_NICHES.includes(value);
}
