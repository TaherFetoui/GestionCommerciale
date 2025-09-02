// This function takes invoice data and generates a styled HTML string for the PDF
export const generateInvoiceHtml = (invoice, client) => {
    // Helper to format numbers to 3 decimal places
    const formatNumber = (num) => (num ? num.toFixed(3) : '0.000');

    // Dynamically generate rows for the line items table
    const itemRows = invoice.items.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.ref || ''}</td>
            <td>${item.description}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${formatNumber(parseFloat(item.unitPrice))}</td>
            <td class="text-right">${formatNumber(item.quantity * item.unitPrice)}</td>
            <td class="text-right">${item.vatRate}%</td>
            <td class="text-right">${formatNumber(item.quantity * item.unitPrice * (1 + item.vatRate / 100))}</td>
        </tr>
    `).join('');

    // Dynamically generate rows for the VAT summary table
    let totalBaseVAT = 0;
    let totalAmountVAT = 0;
    const vatSummaryRows = Object.entries(invoice.items.reduce((acc, item) => {
        const rate = parseFloat(item.vatRate) || 0;
        const base = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
        if (!acc[rate]) {
            acc[rate] = { base: 0, amount: 0 };
        }
        acc[rate].base += base;
        acc[rate].amount += base * (rate / 100);
        return acc;
    }, {})).map(([rate, totals]) => {
        totalBaseVAT += totals.base;
        totalAmountVAT += totals.amount;
        return `
            <tr>
                <td>${rate}%</td>
                <td class="text-right">${formatNumber(totals.base)}</td>
                <td class="text-right">${formatNumber(totals.amount)}</td>
            </tr>
        `;
    }).join('');

    return `
    <html>
        <head>
            <meta charset="utf8">
            <title>Invoice</title>
            <style>
                body { font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 12px; color: #333; }
                .container { width: 100%; padding: 20px; }
                .header, .footer { text-align: center; margin-bottom: 20px; }
                .company-details, .client-details { width: 48%; display: inline-block; vertical-align: top; }
                .invoice-details { border: 1px solid #000; padding: 10px; margin-bottom: 20px; }
                .invoice-details table { width: 100%; }
                .items-table, .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .items-table th, .items-table td, .summary-table th, .summary-table td { border: 1px solid #000; padding: 8px; }
                .items-table th { background-color: #f2f2f2; }
                .text-right { text-align: right; }
                .total-section { float: right; width: 40%; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>GENERAL INFORMATIQUE YMZ</h1>
                    <p>Route Gremda k7 av khaled ibn walid sfax 3022</p>
                </div>

                <div class="invoice-details">
                    <table>
                        <tr>
                            <td><strong>Numéro:</strong> ${invoice.invoice_number}</td>
                            <td><strong>Date:</strong> ${new Date(invoice.issue_date).toLocaleDateString()}</td>
                            <td><strong>Code Client:</strong> ${client.id.substring(0, 8).toUpperCase()}</td>
                        </tr>
                        <tr>
                            <td><strong>Échéance le:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</td>
                            <td><strong>Mode de paiement:</strong> ${invoice.payment_method || ''}</td>
                            <td></td>
                        </tr>
                    </table>
                </div>

                <div class="client-details">
                    <strong>Client:</strong> ${client.name}<br>
                    <strong>Adresse:</strong> ${client.address || ''}<br>
                    <strong>M.F:</strong> ${client.mf || ''}
                </div>

                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Ord.</th>
                            <th>Réf. Produit</th>
                            <th>Libellé</th>
                            <th>Qté</th>
                            <th>P.Unit.HT</th>
                            <th>Net H.T</th>
                            <th>TVA%</th>
                            <th>Net TTC</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemRows}
                    </tbody>
                </table>

                <div class="summary-section">
                    <table class="summary-table" style="width: 40%; float: left;">
                        <thead>
                            <tr>
                                <th>TVA</th>
                                <th>Base TVA</th>
                                <th>Montant TVA</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${vatSummaryRows}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td><strong>Total</strong></td>
                                <td class="text-right"><strong>${formatNumber(totalBaseVAT)}</strong></td>
                                <td class="text-right"><strong>${formatNumber(totalAmountVAT)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>

                    <table class="summary-table" style="width: 40%; float: right;">
                        <tr><td>Total HT Net</td><td class="text-right">${formatNumber(invoice.total_ht)}</td></tr>
                        <tr><td>Total TVA</td><td class="text-right">${formatNumber(invoice.total_vat)}</td></tr>
                        <tr><td>Timbre Fiscal</td><td class="text-right">${formatNumber(invoice.fiscal_stamp)}</td></tr>
                        <tr><td><strong>Total TTC</strong></td><td class="text-right"><strong>${formatNumber(invoice.total_amount)}</strong></td></tr>
                    </table>
                </div>

                <div style="clear: both;"></div>

                <div class="footer">
                    <p>Arrêté La Présente Facture Client à La Somme De: ...</p>
                </div>
            </div>
        </body>
    </html>
    `;
};