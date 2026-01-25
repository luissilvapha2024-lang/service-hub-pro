interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  type: 'product' | 'service' | 'order';
}

interface ReceiptData {
  saleNumber: number;
  date: Date;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  clientName?: string;
  companyName?: string;
  companyPhone?: string;
  companyAddress?: string;
}

export function printReceipt(data: ReceiptData): void {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getItemTypeLabel = (type: 'product' | 'service' | 'order') => {
    switch (type) {
      case 'product': return 'Produto';
      case 'service': return 'Serviço';
      case 'order': return 'Ordem de Serviço';
    }
  };

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 4px 0; border-bottom: 1px dotted #ddd;">
          ${item.quantity}x ${item.name}
          <small style="color: #666;">(${getItemTypeLabel(item.type)})</small>
        </td>
        <td style="padding: 4px 0; text-align: right; border-bottom: 1px dotted #ddd;">
          ${formatCurrency(item.totalPrice)}
        </td>
      </tr>
    `
    )
    .join('');

  const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Comprovante de Venda #${data.saleNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          width: 80mm;
          max-width: 80mm;
          padding: 10px;
          background: white;
          color: #000;
        }
        .header {
          text-align: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px dashed #000;
        }
        .company-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .company-info {
          font-size: 10px;
          color: #444;
        }
        .sale-info {
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px dashed #000;
        }
        .sale-info p {
          margin: 3px 0;
        }
        .items-table {
          width: 100%;
          margin-bottom: 15px;
        }
        .totals {
          border-top: 1px dashed #000;
          padding-top: 10px;
          margin-bottom: 15px;
        }
        .totals p {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
        }
        .total-final {
          font-size: 14px;
          font-weight: bold;
          border-top: 2px solid #000;
          padding-top: 8px;
          margin-top: 8px;
        }
        .payment {
          text-align: center;
          padding: 10px 0;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          margin-bottom: 15px;
        }
        .footer {
          text-align: center;
          font-size: 10px;
          color: #666;
        }
        .footer p {
          margin: 3px 0;
        }
        @media print {
          body {
            width: 80mm;
            margin: 0;
            padding: 5mm;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${data.companyName || 'Assistência Técnica'}</div>
        ${data.companyPhone ? `<div class="company-info">Tel: ${data.companyPhone}</div>` : ''}
        ${data.companyAddress ? `<div class="company-info">${data.companyAddress}</div>` : ''}
      </div>

      <div class="sale-info">
        <p><strong>CUPOM NÃO FISCAL</strong></p>
        <p>Venda #${data.saleNumber}</p>
        <p>Data: ${formatDate(data.date)}</p>
        ${data.clientName ? `<p>Cliente: ${data.clientName}</p>` : ''}
      </div>

      <table class="items-table">
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <p>
          <span>Subtotal:</span>
          <span>${formatCurrency(data.subtotal)}</span>
        </p>
        ${
          data.discount > 0
            ? `<p style="color: green;">
                <span>Desconto:</span>
                <span>-${formatCurrency(data.discount)}</span>
              </p>`
            : ''
        }
        <p class="total-final">
          <span>TOTAL:</span>
          <span>${formatCurrency(data.total)}</span>
        </p>
      </div>

      <div class="payment">
        <strong>Pagamento:</strong><br/>
        ${data.paymentMethod}
      </div>

      <div class="footer">
        <p>Obrigado pela preferência!</p>
        <p>Volte sempre!</p>
        <p style="margin-top: 10px;">
          ${formatDate(new Date())}
        </p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=320,height=600');
  if (printWindow) {
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }, 250);
    };
  }
}
