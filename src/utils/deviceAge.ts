/**
 * "How old is your phone?" options (same bands and wording as the website). The website asks it when
 * the customer says the warranty is valid; the admin sets the % of the price taken off for each band.
 * Stored on the model as `deviceAgeDeductions` (shared by the model editor and the Pricing page).
 */
export const DEVICE_AGE_BANDS = [
  { key: 'BELOW_3_MONTHS', label: 'Below 3 months' },
  { key: '3_TO_6_MONTHS', label: '3 to 6 months' },
  { key: '6_TO_11_MONTHS', label: '6 to 11 months' },
  { key: 'ABOVE_11_MONTHS', label: 'Above 11 months' },
] as const;

export type DeviceAgeBand = (typeof DEVICE_AGE_BANDS)[number]['key'];
export type DeviceAgePercentages = Partial<Record<DeviceAgeBand, number>>;

/** Highest % the engine applies for a band. */
export const DEVICE_AGE_MAX_PCT = 90;

export const zeroAgePercentages = (): Record<string, number | string> =>
  Object.fromEntries(DEVICE_AGE_BANDS.map((b) => [b.key, 0]));

/** Saved values -> form values (missing or invalid -> 0). */
export const ageFormValues = (saved?: Record<string, unknown> | null): Record<string, number | string> =>
  Object.fromEntries(
    DEVICE_AGE_BANDS.map(({ key }) => {
      const raw = saved?.[key];
      const v = Number(raw);
      return [key, raw !== undefined && raw !== null && raw !== '' && Number.isFinite(v) ? v : 0];
    })
  );

/** Form values -> payload (numbers between 0 and the max). */
export const agePayload = (form: Record<string, number | string>): DeviceAgePercentages =>
  Object.fromEntries(
    DEVICE_AGE_BANDS.map(({ key }) => [key, Math.min(DEVICE_AGE_MAX_PCT, Math.max(0, Number(form[key]) || 0))])
  ) as DeviceAgePercentages;
