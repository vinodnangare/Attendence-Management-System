export function formatDateISO(d = new Date()) {
  return new Date(d).toISOString().slice(0,10);
}
