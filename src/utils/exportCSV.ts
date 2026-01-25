interface ExportOptions {
  filename: string;
  headers: string[];
  data: (string | number)[][];
}

export function exportToCSV({ filename, headers, data }: ExportOptions) {
  // Add BOM for UTF-8 encoding (helps Excel recognize special characters)
  const BOM = '\uFEFF';
  
  // Create CSV content
  const csvContent = [
    headers.join(';'),
    ...data.map(row => row.map(cell => {
      // Escape quotes and wrap in quotes if contains separator
      const cellStr = String(cell ?? '');
      if (cellStr.includes(';') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(';'))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatCurrencyForExport(value: number): string {
  return value.toFixed(2).replace('.', ',');
}
