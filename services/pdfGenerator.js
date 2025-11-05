// Professional Invoice PDF Generator
// Generates styled HTML for PDF conversion with modern, professional design

// Helper function to convert numbers to French words (Tunisian Dinar)
const numberToFrenchWords = (num) => {
    if (num === 0) return 'zéro';
    
    const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
    
    const convertLessThanThousand = (n) => {
        if (n === 0) return '';
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) {
            const ten = Math.floor(n / 10);
            const one = n % 10;
            if (ten === 7 || ten === 9) {
                // 70-79 and 90-99 special cases
                return tens[ten] + (one === 1 && ten === 7 ? ' et onze' : one > 0 ? '-' + teens[one] : '');
            }
            if (ten === 8 && one === 0) return 'quatre-vingts'; // 80 special case
            return tens[ten] + (one === 1 && ten < 8 ? ' et un' : one > 0 ? '-' + ones[one] : '');
        }
        const hundred = Math.floor(n / 100);
        const rest = n % 100;
        const hundredWord = hundred === 1 ? 'cent' : ones[hundred] + ' cent';
        return hundredWord + (rest > 0 ? ' ' + convertLessThanThousand(rest) : hundred > 1 && rest === 0 ? 's' : '');
    };
    
    const convertInteger = (n) => {
        if (n === 0) return 'zéro';
        if (n < 1000) return convertLessThanThousand(n);
        
        const million = Math.floor(n / 1000000);
        const thousand = Math.floor((n % 1000000) / 1000);
        const rest = n % 1000;
        
        let result = '';
        if (million > 0) {
            result += (million === 1 ? 'un million' : convertLessThanThousand(million) + ' millions');
        }
        if (thousand > 0) {
            if (result) result += ' ';
            result += (thousand === 1 ? 'mille' : convertLessThanThousand(thousand) + ' mille');
        }
        if (rest > 0) {
            if (result) result += ' ';
            result += convertLessThanThousand(rest);
        }
        return result;
    };
    
    // Split into integer and decimal parts
    const integer = Math.floor(num);
    const decimal = Math.round((num - integer) * 1000); // 3 decimal places for millimes
    
    let result = convertInteger(integer);
    result = result.charAt(0).toUpperCase() + result.slice(1); // Capitalize first letter
    
    if (decimal > 0) {
        result += ' Dinars et ' + convertInteger(decimal) + ' Millimes Tunisien';
    } else {
        result += ' Dinars Tunisien';
    }
    
    return result;
};

export const generateInvoiceHtml = (invoice, client, companyInfo) => {
    // Validate required company info
    if (!companyInfo) {
        throw new Error('Company information is required to generate invoice');
    }

    // Helper to format numbers to 3 decimal places
    const formatNumber = (num) => (num ? parseFloat(num).toFixed(3) : '0.000');
    
    // Helper to format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Extract company info from database
    const company = {
        name: companyInfo.name || 'N/A',
        address: companyInfo.address || 'N/A',
        city: companyInfo.city || '',
        postalCode: companyInfo.postal_code || '',
        phone: companyInfo.phone || '',
        email: companyInfo.email || '',
        website: companyInfo.website || companyInfo.email || '',
        taxId: companyInfo.tax_id || '',
        tradeRegister: companyInfo.trade_register || ''
    };

    // Calculate totals and VAT summary
    const items = invoice.items || [];
    let totalHT = 0;
    let totalTVA = 0;
    const vatGroups = {};

    items.forEach(item => {
        const qty = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const vatRate = parseFloat(item.vatRate) || 0;
        const lineHT = qty * unitPrice;
        const lineTVA = lineHT * (vatRate / 100);

        totalHT += lineHT;
        totalTVA += lineTVA;

        if (!vatGroups[vatRate]) {
            vatGroups[vatRate] = { base: 0, amount: 0 };
        }
        vatGroups[vatRate].base += lineHT;
        vatGroups[vatRate].amount += lineTVA;
    });

    const fiscalStamp = parseFloat(invoice.fiscal_stamp) || 1.000;
    const totalTTC = totalHT + totalTVA + fiscalStamp;

    // Generate item rows
    const itemRows = items.map((item, index) => {
        const qty = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const vatRate = parseFloat(item.vatRate) || 0;
        const lineHT = qty * unitPrice;
        const lineTTC = lineHT * (1 + vatRate / 100);

        return `
            <tr>
                <td class="text-center">${index + 1}</td>
                <td class="text-left">${item.ref || '-'}</td>
                <td class="text-left">${item.description || ''}</td>
                <td class="text-center">${qty}</td>
                <td class="text-right">${formatNumber(unitPrice)}</td>
                <td class="text-right">${formatNumber(lineHT)}</td>
                <td class="text-center">${vatRate}%</td>
                <td class="text-right font-bold">${formatNumber(lineTTC)}</td>
            </tr>
        `;
    }).join('');

    // Generate VAT summary rows
    const vatSummaryRows = Object.entries(vatGroups).map(([rate, totals]) => `
        <tr>
            <td class="text-center">${rate}%</td>
            <td class="text-right">${formatNumber(totals.base)}</td>
            <td class="text-right font-bold">${formatNumber(totals.amount)}</td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Facture ${invoice.invoice_number}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            @page {
                size: A4;
                margin: 0;
            }

            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 11px;
                line-height: 1.4;
                color: #333;
                background: white;
            }

            .page {
                width: 210mm;
                min-height: 297mm;
                padding: 15mm;
                margin: 0 auto;
                background: white;
            }

            /* Header Section */
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding-bottom: 20px;
                border-bottom: 4px solid #000;
                margin-bottom: 15px;
            }

            .company-info {
                flex: 1;
                max-width: 55%;
            }

            .company-logo {
                width: 120px;
                height: 80px;
                background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 12px;
                border: 2px solid #E5E7EB;
            }

            .company-logo-text {
                color: white;
                font-size: 36px;
                font-weight: bold;
                letter-spacing: 2px;
            }

            .company-name {
                font-size: 18px;
                font-weight: bold;
                color: #000;
                margin-bottom: 8px;
                text-transform: uppercase;
            }

            .company-details {
                font-size: 9px;
                color: #333;
                line-height: 1.8;
            }

            .invoice-title {
                text-align: right;
                flex: 1;
                background: #F3F4F6;
                padding: 15px;
                border-radius: 8px;
                border: 2px solid #000;
            }

            .invoice-type {
                font-size: 24px;
                font-weight: bold;
                color: #000;
                margin-bottom: 0px;
                text-transform: uppercase;
            }

            /* Invoice Info Box */
            .invoice-info-box {
                border: 2px solid #000;
                border-radius: 0px;
                padding: 0;
                margin-bottom: 15px;
                background: white;
            }

            .invoice-info-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 0;
            }

            .info-item {
                display: flex;
                flex-direction: column;
                padding: 10px 12px;
                border-right: 1px solid #000;
                border-bottom: 1px solid #000;
            }

            .info-item:nth-child(3n) {
                border-right: none;
            }

            .info-item:nth-last-child(-n+3) {
                border-bottom: none;
            }

            .info-label {
                font-size: 8px;
                color: #000;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
            }

            .info-value {
                font-size: 11px;
                font-weight: 600;
                color: #000;
            }

            /* Client Section */
            .client-section {
                background: white;
                border: 2px solid #000;
                padding: 12px 15px;
                margin-bottom: 15px;
                border-radius: 0px;
            }

            .client-label {
                font-size: 10px;
                font-weight: bold;
                color: #000;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.8px;
            }

            .client-name {
                font-size: 13px;
                font-weight: bold;
                color: #000;
                margin-bottom: 6px;
            }

            .client-details {
                font-size: 9px;
                color: #000;
                line-height: 1.8;
            }

            /* Items Table */
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
                border: 2px solid #000;
            }

            .items-table thead {
                background: white;
                color: #000;
                border-bottom: 2px solid #000;
            }

            .items-table th {
                padding: 10px 6px;
                text-align: left;
                font-size: 9px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                border-right: 1px solid #000;
            }

            .items-table th:last-child {
                border-right: none;
            }

            .items-table tbody tr {
                border-bottom: 1px solid #000;
            }

            .items-table tbody tr:last-child {
                border-bottom: 2px solid #000;
            }

            .items-table tbody tr:nth-child(even) {
                background-color: #F9FAFB;
            }

            .items-table td {
                padding: 8px 6px;
                font-size: 9px;
                color: #000;
                border-right: 1px solid #D1D5DB;
            }

            .items-table td:last-child {
                border-right: none;
            }

            .text-left { text-align: left; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 600; }

            /* Summary Section */
            .summary-section {
                display: flex;
                justify-content: space-between;
                gap: 15px;
                margin-bottom: 20px;
            }

            .vat-summary, .totals-summary {
                flex: 1;
            }

            .summary-table {
                width: 100%;
                border-collapse: collapse;
                border: 2px solid #000;
            }

            .summary-table thead {
                background: white;
                border-bottom: 2px solid #000;
            }

            .summary-table th {
                padding: 8px 6px;
                text-align: left;
                font-size: 8px;
                font-weight: bold;
                color: #000;
                text-transform: uppercase;
                border-right: 1px solid #000;
            }

            .summary-table th:last-child {
                border-right: none;
            }

            .summary-table td {
                padding: 6px;
                font-size: 9px;
                border-bottom: 1px solid #D1D5DB;
                border-right: 1px solid #D1D5DB;
            }

            .summary-table td:last-child {
                border-right: none;
            }

            .summary-table tfoot td {
                background: #F3F4F6;
                font-weight: bold;
                border-top: 2px solid #000;
                border-bottom: none;
            }

            .totals-box {
                background: white;
                border: 2px solid #000;
                border-radius: 0px;
                overflow: hidden;
            }

            .total-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 12px;
                border-bottom: 1px solid #D1D5DB;
            }

            .total-row:last-child {
                background: #000;
                color: white;
                border-bottom: none;
                font-size: 13px;
                font-weight: bold;
                padding: 12px;
            }

            .total-label {
                font-size: 10px;
                color: #000;
                font-weight: 600;
            }

            .total-value {
                font-size: 10px;
                font-weight: bold;
                color: #000;
            }

            .total-row:last-child .total-label,
            .total-row:last-child .total-value {
                color: white;
                font-size: 13px;
            }

            /* Footer */
            .footer {
                margin-top: 20px;
                padding-top: 15px;
                border-top: 3px solid #000;
            }

            .footer-note {
                background: white;
                border: 2px solid #000;
                padding: 10px 12px;
                margin-bottom: 20px;
                border-radius: 0px;
                font-size: 9px;
                color: #000;
                font-weight: 600;
            }

            .footer-note strong {
                font-size: 10px;
                text-transform: lowercase;
            }

            .company-footer {
                text-align: center;
                font-size: 8px;
                color: #000;
                line-height: 1.8;
                padding: 8px;
                border: 1px solid #000;
                background: #F9FAFB;
            }

            .signature-section {
                margin-top: 30px;
                margin-bottom: 15px;
                text-align: right;
            }

            .signature-label {
                font-size: 10px;
                color: #000;
                font-weight: bold;
                margin-bottom: 50px;
                text-transform: uppercase;
            }

            .signature-line {
                border-top: 2px solid #000;
                width: 200px;
                margin-left: auto;
                padding-top: 5px;
                font-size: 8px;
                color: #666;
                text-align: center;
            }

            @media print {
                .page {
                    margin: 0;
                    box-shadow: none;
                }
                body {
                    background: white;
                }
            }
        </style>
    </head>
    <body>
        <div class="page">
            <!-- Header -->
            <div class="header">
                <div class="company-info">
                    <div class="company-logo">
                        <div class="company-logo-text">${company.name.substring(0, 2).toUpperCase()}</div>
                    </div>
                    <div class="company-name">${company.name}</div>
                    <div class="company-details">
                        ${company.address}${company.city ? ', ' + company.city : ''}<br>
                        ${company.postalCode ? company.postalCode + '<br>' : ''}
                        ${company.phone ? 'TEL: ' + company.phone : ''}${company.phone ? '<br>' : ''}
                        ${company.website ? 'Site Web: ' + company.website : ''}${company.website ? '<br>' : ''}
                        ${company.email ? 'Email: ' + company.email : ''}
                    </div>
                </div>
                <div class="invoice-title">
                    <div class="invoice-type">Facture client</div>
                </div>
            </div>

            <!-- Invoice Info Box -->
            <div class="invoice-info-box">
                <div class="invoice-info-grid">
                    <div class="info-item">
                        <div class="info-label">Numéro</div>
                        <div class="info-value">${invoice.invoice_number || 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Date</div>
                        <div class="info-value">${formatDate(invoice.issue_date)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Code Client</div>
                        <div class="info-value">${(client.id || '').substring(0, 8).toUpperCase()}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Échéance le</div>
                        <div class="info-value">${formatDate(invoice.due_date)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Mode de paiement</div>
                        <div class="info-value">${invoice.payment_method || 'Non spécifié'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">M.F</div>
                        <div class="info-value">${company.taxId || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <!-- Client and Address Section -->
            <div class="client-section">
                <div class="client-label">Client:</div>
                <div class="client-name">${client.name || 'N/A'}</div>
                <div class="client-details">
                    <strong>Adresse:</strong> ${client.address || 'N/A'}<br>
                    <strong>M.F:</strong> ${client.matricule_fiscale || 'N/A'}
                </div>
            </div>

            <!-- Items Table -->
            <table class="items-table">
                <thead>
                    <tr>
                        <th class="text-center" style="width: 5%;">Ord.</th>
                        <th class="text-left" style="width: 12%;">Réf. Produit</th>
                        <th class="text-left" style="width: 33%;">Libellé</th>
                        <th class="text-center" style="width: 8%;">Qté</th>
                        <th class="text-right" style="width: 12%;">P.Unit.HT</th>
                        <th class="text-right" style="width: 12%;">Net H.T</th>
                        <th class="text-center" style="width: 8%;">TVA%</th>
                        <th class="text-right" style="width: 13%;">Net TTC</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemRows || '<tr><td colspan="8" class="text-center">Aucun article</td></tr>'}
                </tbody>
            </table>

            <!-- Summary Section -->
            <div class="summary-section">
                <!-- VAT Summary -->
                <div class="vat-summary">
                    <table class="summary-table">
                        <thead>
                            <tr>
                                <th class="text-center">TVA</th>
                                <th class="text-right">Base TVA</th>
                                <th class="text-right">Montant TVA</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${vatSummaryRows}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td class="text-center">Total</td>
                                <td class="text-right">${formatNumber(totalHT)}</td>
                                <td class="text-right">${formatNumber(totalTVA)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <!-- Totals Summary -->
                <div class="totals-summary">
                    <div class="totals-box">
                        <div class="total-row">
                            <span class="total-label">Total HT Net</span>
                            <span class="total-value">${formatNumber(totalHT)}</span>
                        </div>
                        <div class="total-row">
                            <span class="total-label">Total TVA</span>
                            <span class="total-value">${formatNumber(totalTVA)}</span>
                        </div>
                        <div class="total-row">
                            <span class="total-label">Timbre Fiscal</span>
                            <span class="total-value">${formatNumber(fiscalStamp)}</span>
                        </div>
                        <div class="total-row">
                            <span class="total-label">Total TTC</span>
                            <span class="total-value">${formatNumber(totalTTC)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <div class="footer-note">
                    Arrêté La Présente Facture Client à La Somme De:<br>
                    <strong>${numberToFrenchWords(totalTTC)}</strong>
                </div>

                <div class="signature-section">
                    <div class="signature-label">Cachet et Signature</div>
                    <div class="signature-line">Signature autorisée</div>
                </div>

                <div class="company-footer">
                    ${company.address ? 'Siège: ' + company.address + (company.city ? ', ' + company.city : '') : ''}${company.address ? '<br>' : ''}
                    ${company.phone ? 'Tél: ' + company.phone : ''}${company.website ? ' - Site Web: ' + company.website : ''}${company.email ? ' - Email: ' + company.email : ''}${(company.phone || company.website || company.email) ? '<br>' : ''}
                    ${company.tradeRegister ? 'RC: ' + company.tradeRegister : ''}
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Export function for web browser printing
export const printInvoiceWeb = (invoice, client, companyInfo) => {
    const html = generateInvoiceHtml(invoice, client, companyInfo);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
};

// Export function for downloading PDF on web (using browser's print to PDF)
export const downloadInvoicePDFWeb = (invoice, client, companyInfo) => {
    printInvoiceWeb(invoice, client, companyInfo);
};