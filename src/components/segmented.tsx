import { Chips } from "./ui";

export type SegmentedProps = {
  label: string;
  options: number[];
  value: number;
  onChange: (value: number) => void;
  /** How each option reads, e.g. 30 → "30%". */
  format: (value: number) => string;
};

/**
 * Fallback for web and Android: wrapping chips, since Paper's segmented
 * buttons overflow a phone at five or more options. iOS uses the native picker.
 */
export function Segmented({
  label,
  options,
  value,
  onChange,
  format,
}: SegmentedProps) {
  return (
    <Chips
      label={label}
      value={String(value)}
      onChange={(v) => onChange(Number(v))}
      options={options.map((o) => ({ label: format(o), value: String(o) }))}
    />
  );
}
