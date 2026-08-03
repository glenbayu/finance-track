"use client";

import { useEffect, useState } from "react";

type DateInputProps = {
  name: string;
  defaultValue: string;
  required?: boolean;
  className?: string;
  ariaLabel?: string;
};

export default function DateInput({
  name,
  defaultValue,
  required,
  className = "",
  ariaLabel = "Pilih tanggal",
}: DateInputProps) {
  const [displayDate, setDisplayDate] = useState(defaultValue);

  useEffect(() => {
    setDisplayDate(defaultValue);
  }, [defaultValue]);

  return (
    <input
      type="date"
      name={name}
      value={displayDate}
      onChange={(event) => setDisplayDate(event.currentTarget.value)}
      className={className}
      required={required}
      aria-label={ariaLabel}
    />
  );
}
