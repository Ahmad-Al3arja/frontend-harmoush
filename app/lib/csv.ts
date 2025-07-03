export function downloadCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return;

  const replacer = (key: string, value: any) => (value === null ? "" : value);
  const header = Object.keys(data[0]);
  const csv = [
    header.join(","),
    ...data.map(row =>
      header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(",")
    ),
  ].join("\r\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
} 