// Fuente única de las posiciones: el valor es lo que guarda el backend, la etiqueta es lo que ve el usuario.
export const POSITIONS = [
  { value: 'goalkeeper', label: 'Arquero' },
  { value: 'defender', label: 'Cierre / Defensor' },
  { value: 'winger', label: 'Ala' },
  { value: 'pivot', label: 'Pívot / Delantero' }, // el backend valida: goalkeeper, defender, winger, pivot
] as const;

export const DEFAULT_POSITION = 'winger';

// Valores en español que pudieron guardarse antes de unificar el catálogo
const LEGACY_LABELS: Record<string, string> = {
  Portero: 'Arquero',
  Cierre: 'Cierre / Defensor',
  Ala: 'Ala',
  'Pívot': 'Pívot / Delantero',
  forward: 'Pívot / Delantero', // valor que el frontend enviaba antes y el backend rechazaba
};

/** Convierte el valor guardado (goalkeeper, winger...) en la etiqueta en español para mostrar en tablas y listas. */
export const positionLabel = (value?: string | null): string => {
  if (!value) return 'Sin posición';
  return POSITIONS.find((p) => p.value === value)?.label ?? LEGACY_LABELS[value] ?? value;
};
