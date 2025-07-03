import React from "react";

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className = "",
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <textarea
      className={`border rounded-md p-2 w-full ${className}`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
    />
  );
} 