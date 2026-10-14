import { Field } from "./ui";

export type DateFieldProps = {
  label: string;
  /** YYYY-MM-DD */
  value: string;
  onChange: (day: string) => void;
  /** Earliest / latest selectable day, YYYY-MM-DD. */
  min?: string;
  max?: string;
};

/** Fallback for web and Android: a plain text field. iOS uses the native picker. */
export function DateField({ label, value, onChange }: DateFieldProps) {
  return (
    <Field
      label={label + " (YYYY-MM-DD)"}
      placeholder="2026-10-21"
      value={value}
      onChangeText={onChange}
      maxLength={10}
      autoCorrect={false}
      autoComplete="off"
    />
  );
}
