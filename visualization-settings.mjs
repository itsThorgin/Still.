export const VISUALIZATION_MODES = Object.freeze([
  { value: 'wires', label: 'Soft wires' },
  { value: 'oscilloscope', label: 'Oscilloscope' },
  { value: 'spectrum', label: 'Spectrum' },
  { value: 'mirror', label: 'Mirror wave' },
]);

export function normalizeVisualization(input) {
  return {
    enabled: input?.enabled === true,
    mode: VISUALIZATION_MODES.some(mode => mode.value === input?.mode) ? input.mode : 'wires',
  };
}
