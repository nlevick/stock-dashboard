export const formatPrice = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format;

export const formatShareCount = new Intl.NumberFormat('en-US').format;

const observationDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatObservationDate(date: string) {
  return observationDate.format(new Date(date));
}
