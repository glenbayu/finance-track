"use client";

type DateInputProps = {
  id?: string;
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;
  ariaLabel?: string;
};

export default function DateInput({
  id,
  name,
  defaultValue = "",
  value,
  onChange,
  required,
  className = "",
  ariaLabel = "Pilih tanggal",
}: DateInputProps) {
  if (value !== undefined) {
    return (
      <input
        id={id}
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        className={className}
        required={required}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <input
      id={id}
      type="date"
      name={name}
      defaultValue={defaultValue}
      onChange={onChange}
      className={className}
      required={required}
      aria-label={ariaLabel}
    />
  );
}
