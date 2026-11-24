// Las fechas de partido son la hora local de la cancha. El backend las envía sin zona horaria;
// si alguna llegara con sufijo "Z", se ignora para no convertirla a la zona del navegador.
const toLocalDate = (value: string): Date => new Date(value.replace(/(\.\d+)?Z$/, ''));

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "Mié, 25 nov" */
export const formatMatchDay = (value: string): string =>
  capitalize(toLocalDate(value).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }));

/** "19:00" */
export const formatMatchTime = (value: string): string =>
  toLocalDate(value).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });

/** Valor para <input type="datetime-local">: "2026-11-25T19:00" */
export const toDateTimeLocal = (value?: string | null): string =>
  value ? value.replace(/(\.\d+)?Z$/, '').slice(0, 16) : '';

/** De <input type="datetime-local"> al formato que espera el backend: "2026-11-25 19:00:00" */
export const toApiDateTime = (value: string): string => {
  const [date, time = '00:00'] = value.split('T');
  return `${date} ${time.length === 5 ? `${time}:00` : time}`;
};
