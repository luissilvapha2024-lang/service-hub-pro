interface OrderService {
  service_name: string;
  price: number;
  quantity: number;
}

interface PrintOrderData {
  orderNumber: number;
  createdAt: string;
  clientName?: string;
  clientPhone?: string;
  deviceModel: string;
  deviceImei?: string;
  reportedIssue: string;
  diagnosis?: string;
  observations?: string;
  status: string;
  estimatedValue?: number;
  finalValue?: number;
  services?: OrderService[];
  companyName?: string;
  companyPhone?: string;
  companyAddress?: string;
}

const statusLabels: Record<string, string> = {
  em_analise: 'Em Análise',
  aguardando_autorizacao: 'Aguardando Autorização',
  aguardando_pecas: 'Aguardando Peças',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  entregue: 'Entregue',
  pago: 'Pago',
};

export function printOrder(data: PrintOrderData): void {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const servicesHtml = data.services?.length
    ? `
      <div class="section">
        <div class="section-title">SERVIÇOS</div>
        <table class="services-table">
          <thead>
            <tr>
              <th style="text-align:left;">Serviço</th>
              <th style="text-align:center;">Qtd</th>
              <th style="text-align:right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${data.services.map(s => `
              <tr>
                <td>${s.service_name}</td>
                <td style="text-align:center;">${s.quantity}</td>
                <td style="text-align:right;">${formatCurrency(s.price * s.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>OS-${String(data.orderNumber).padStart(3, '0')}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          max-width: 210mm;
          padding: 15mm;
          background: white;
          color: #000;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #000;
        }
        .company-name { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
        .company-info { font-size: 11px; color: #444; }
        .order-title {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          margin: 15px 0;
          padding: 8px;
          background: #f0f0f0;
          border: 1px solid #ccc;
        }
        .order-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          font-size: 11px;
          color: #555;
        }
        .section {
          margin-bottom: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }
        .section-title {
          background: #333;
          color: white;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .section-body { padding: 10px; }
        .field { margin-bottom: 8px; }
        .field-label { font-weight: bold; font-size: 11px; color: #333; }
        .field-value { font-size: 12px; margin-top: 2px; }
        .row { display: flex; gap: 20px; }
        .row .field { flex: 1; }
        .services-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .services-table th, .services-table td {
          padding: 5px 10px;
          border-bottom: 1px dotted #ccc;
        }
        .services-table th { font-size: 10px; text-transform: uppercase; color: #666; }
        .values-section {
          display: flex;
          justify-content: flex-end;
          gap: 30px;
          padding: 10px;
          background: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 15px;
        }
        .value-item { text-align: right; }
        .value-label { font-size: 10px; color: #666; text-transform: uppercase; }
        .value-amount { font-size: 16px; font-weight: bold; }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
          background: #e0e0e0;
        }
        .signature-area {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          gap: 40px;
        }
        .signature-line {
          flex: 1;
          text-align: center;
          padding-top: 8px;
          border-top: 1px solid #000;
          font-size: 11px;
          color: #555;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #999;
          border-top: 1px dashed #ccc;
          padding-top: 10px;
        }
        @media print {
          body { padding: 10mm; }
          @page { size: A4; margin: 10mm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${data.companyName || 'Assistência Técnica'}</div>
        ${data.companyPhone ? `<div class="company-info">Tel: ${data.companyPhone}</div>` : ''}
        ${data.companyAddress ? `<div class="company-info">${data.companyAddress}</div>` : ''}
      </div>

      <div class="order-title">
        ORDEM DE SERVIÇO Nº ${String(data.orderNumber).padStart(3, '0')}
      </div>

      <div class="order-meta">
        <span>Data de Abertura: ${formatDate(data.createdAt)}</span>
        <span>Status: <span class="status-badge">${statusLabels[data.status] || data.status}</span></span>
      </div>

      <div class="section">
        <div class="section-title">Dados do Cliente</div>
        <div class="section-body">
          <div class="row">
            <div class="field">
              <div class="field-label">Nome</div>
              <div class="field-value">${data.clientName || '—'}</div>
            </div>
            <div class="field">
              <div class="field-label">Telefone</div>
              <div class="field-value">${data.clientPhone || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Dados do Aparelho</div>
        <div class="section-body">
          <div class="row">
            <div class="field">
              <div class="field-label">Modelo</div>
              <div class="field-value">${data.deviceModel}</div>
            </div>
            <div class="field">
              <div class="field-label">IMEI</div>
              <div class="field-value">${data.deviceImei || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Defeito Relatado</div>
        <div class="section-body">
          <div class="field-value">${data.reportedIssue}</div>
        </div>
      </div>

      ${data.diagnosis ? `
        <div class="section">
          <div class="section-title">Diagnóstico Técnico</div>
          <div class="section-body">
            <div class="field-value">${data.diagnosis}</div>
          </div>
        </div>
      ` : ''}

      ${data.observations ? `
        <div class="section">
          <div class="section-title">Observações</div>
          <div class="section-body">
            <div class="field-value">${data.observations}</div>
          </div>
        </div>
      ` : ''}

      ${servicesHtml}

      <div class="values-section">
        ${data.estimatedValue ? `
          <div class="value-item">
            <div class="value-label">Valor Estimado</div>
            <div class="value-amount">${formatCurrency(data.estimatedValue)}</div>
          </div>
        ` : ''}
        ${data.finalValue ? `
          <div class="value-item">
            <div class="value-label">Valor Final</div>
            <div class="value-amount">${formatCurrency(data.finalValue)}</div>
          </div>
        ` : ''}
        ${!data.estimatedValue && !data.finalValue ? `
          <div class="value-item">
            <div class="value-label">Valor</div>
            <div class="value-amount">A definir</div>
          </div>
        ` : ''}
      </div>

      <div class="signature-area">
        <div class="signature-line">Assinatura do Técnico</div>
        <div class="signature-line">Assinatura do Cliente</div>
      </div>

      <div class="footer">
        <p>Documento impresso em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      }, 250);
    };
  }
}
