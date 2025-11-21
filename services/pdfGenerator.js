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

// ============= PURCHASE ORDER PDF GENERATOR =============

export const generatePurchaseOrderHtml = (order, supplier, companyInfo) => {
    // Validate required company info
    if (!companyInfo) {
        throw new Error('Company information is required to generate purchase order');
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

    // Calculate totals
    const items = order.items || [];
    let totalHT = 0;

    items.forEach(item => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.purchase_price || item.unit_price) || 0;
        totalHT += qty * price;
    });

    const totalVAT = totalHT * 0.19; // 19% VAT
    const totalTTC = totalHT + totalVAT;

    // Status translation
    const statusLabels = {
        'pending': 'En attente',
        'confirmed': 'Confirmé',
        'received': 'Reçu',
        'cancelled': 'Annulé'
    };

    // Generate item rows
    const itemRows = items.map((item, index) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.purchase_price || item.unit_price) || 0;
        const lineTotal = qty * price;

        return `
            <tr>
                <td class="text-center">${index + 1}</td>
                <td class="text-left">${item.item_name || item.article_name || item.description || '-'}</td>
                <td class="text-center">${formatNumber(qty)}</td>
                <td class="text-right">${formatNumber(price)}</td>
                <td class="text-right font-bold">${formatNumber(lineTotal)}</td>
            </tr>
        `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bon de Commande ${order.order_number}</title>
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
                background: linear-gradient(135deg, #059669 0%, #10B981 100%);
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

            .order-title {
                text-align: right;
                flex: 1;
                background: #F3F4F6;
                padding: 15px;
                border-radius: 8px;
                border: 2px solid #000;
            }

            .order-type {
                font-size: 24px;
                font-weight: bold;
                color: #000;
                margin-bottom: 0px;
                text-transform: uppercase;
            }

            /* Order Info Box */
            .order-info-box {
                border: 2px solid #000;
                border-radius: 0px;
                padding: 0;
                margin-bottom: 15px;
                background: white;
            }

            .order-info-grid {
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

            /* Supplier Section */
            .supplier-section {
                background: white;
                border: 2px solid #000;
                padding: 12px 15px;
                margin-bottom: 15px;
                border-radius: 0px;
            }

            .supplier-label {
                font-size: 10px;
                font-weight: bold;
                color: #000;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.8px;
            }

            .supplier-name {
                font-size: 13px;
                font-weight: bold;
                color: #000;
                margin-bottom: 6px;
            }

            .supplier-details {
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

            /* Totals Summary */
            .totals-section {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 20px;
            }

            .totals-box {
                width: 50%;
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
                margin-top: 30px;
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
                <div class="order-title">
                    <div class="order-type">Bon de Commande</div>
                </div>
            </div>

            <!-- Order Info Box -->
            <div class="order-info-box">
                <div class="order-info-grid">
                    <div class="info-item">
                        <div class="info-label">Numéro</div>
                        <div class="info-value">${order.order_number || 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Date</div>
                        <div class="info-value">${formatDate(order.created_at)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Statut</div>
                        <div class="info-value">${statusLabels[order.status] || order.status}</div>
                    </div>
                </div>
            </div>

            <!-- Supplier Section -->
            <div class="supplier-section">
                <div class="supplier-label">Fournisseur:</div>
                <div class="supplier-name">${supplier?.name || 'N/A'}</div>
                <div class="supplier-details">
                    ${supplier?.address ? '<strong>Adresse:</strong> ' + supplier.address + '<br>' : ''}
                    ${supplier?.matricule_fiscale ? '<strong>M.F:</strong> ' + supplier.matricule_fiscale + '<br>' : ''}
                    ${supplier?.phone ? '<strong>Tél:</strong> ' + supplier.phone : ''}
                </div>
            </div>

            <!-- Items Table -->
            <table class="items-table">
                <thead>
                    <tr>
                        <th class="text-center" style="width: 8%;">Ord.</th>
                        <th class="text-left" style="width: 50%;">Article</th>
                        <th class="text-center" style="width: 12%;">Quantité</th>
                        <th class="text-right" style="width: 15%;">Prix Unitaire</th>
                        <th class="text-right" style="width: 15%;">Total HT</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemRows || '<tr><td colspan="5" class="text-center">Aucun article</td></tr>'}
                </tbody>
            </table>

            <!-- Totals Section -->
            <div class="totals-section">
                <div class="totals-box">
                    <div class="total-row">
                        <span class="total-label">Total HT</span>
                        <span class="total-value">${formatNumber(totalHT)} TND</span>
                    </div>
                    <div class="total-row">
                        <span class="total-label">TVA (19%)</span>
                        <span class="total-value">${formatNumber(totalVAT)} TND</span>
                    </div>
                    <div class="total-row">
                        <span class="total-label">Total TTC</span>
                        <span class="total-value">${formatNumber(totalTTC)} TND</span>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <div class="footer-note">
                    Arrêté La Présente Commande à La Somme De:<br>
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

// Export function for web browser printing (Purchase Order)
export const printPurchaseOrderWeb = (order, supplier, companyInfo) => {
    const html = generatePurchaseOrderHtml(order, supplier, companyInfo);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
};

// Export function for downloading PDF on web (Purchase Order)
export const downloadPurchaseOrderPDFWeb = (order, supplier, companyInfo) => {
    printPurchaseOrderWeb(order, supplier, companyInfo);
};

// Tax Withholding Certificate Print Function (Retenue à la source)
export const printTaxWithholdingCertificate = (documentData, isClient, companyInfo = {}) => {
    const formatDate = (date) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatAmount = (amount) => {
        return parseFloat(amount || 0).toFixed(3);
    };

    const getCurrentYear = () => new Date().getFullYear();
    
    const entityName = isClient ? documentData.client : documentData.supplier;
    const retentionRate = parseFloat(documentData.retention_rate || 1.5).toFixed(2);
    const invoiceAmount = parseFloat(documentData.invoice_amount || 0);
    const retentionAmount = parseFloat(documentData.retention_amount || 0);
    const netAmount = invoiceAmount - retentionAmount;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Certificat de Retenue d'Impôt</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                @page { 
                    size: A4;
                    margin: 15mm;
                }
                body { 
                    font-family: 'Arial', sans-serif; 
                    font-size: 9pt;
                    line-height: 1.2;
                    color: #000;
                    max-width: 210mm;
                    margin: 0 auto;
                }
                .header {
                    text-align: center;
                    margin-bottom: 15px;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #000;
                }
                .header-title {
                    font-size: 8pt;
                    font-weight: bold;
                    text-transform: uppercase;
                    margin-bottom: 2px;
                }
                .reference {
                    text-align: right;
                    margin-bottom: 10px;
                    font-size: 8pt;
                    line-height: 1.3;
                }
                .section {
                    margin: 8px 0;
                    border: 1.5px solid #000;
                    padding: 8px;
                }
                .section-title {
                    font-weight: bold;
                    margin-bottom: 6px;
                    background-color: #f0f0f0;
                    padding: 4px 8px;
                    border: 1px solid #000;
                    font-size: 8pt;
                }
                .info-row {
                    display: flex;
                    margin: 3px 0;
                    padding: 2px 0;
                    font-size: 8pt;
                }
                .info-label {
                    font-weight: bold;
                    min-width: 180px;
                }
                .info-value {
                    flex: 1;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 8px 0;
                }
                table th, table td {
                    border: 1.5px solid #000;
                    padding: 4px 6px;
                    text-align: center;
                    font-size: 8pt;
                }
                table th {
                    background-color: #f0f0f0;
                    font-weight: bold;
                }
                .amount-cell {
                    text-align: right;
                    font-weight: bold;
                }
                .total-row {
                    background-color: #f8f8f8;
                    font-weight: bold;
                }
                .footer-text {
                    text-align: center;
                    font-size: 7pt;
                    font-style: italic;
                    margin: 10px 0;
                    line-height: 1.4;
                }
                .signature-section {
                    margin-top: 15px;
                    text-align: right;
                }
                .signature-line {
                    font-size: 8pt;
                    margin-top: 5px;
                }
                .footer-note {
                    font-size: 6pt;
                    margin-top: 15px;
                    padding-top: 8px;
                    border-top: 1px solid #ccc;
                    color: #666;
                    line-height: 1.3;
                }
                @media print {
                    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                    .section { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="header-title">RÉPUBLIQUE TUNISIENNE</div>
                <div class="header-title">MINISTÈRE DES FINANCES</div>
                <div style="margin-top: 15px; font-size: 10pt; font-weight: bold;">
                    CERTIFICAT DE RETENUE D'IMPÔT<br>
                    SUR LE REVENU OU<br>
                    D'IMPÔT SUR LES SOCIÉTÉS
                </div>
            </div>

            <div style="text-align: center; font-size: 8pt; margin-bottom: 8px;">
                ${companyInfo.tax_office || 'DIRECTION GÉNÉRALE DU CONTRÔLE FISCAL'}
            </div>

            <div class="reference">
                <strong>Retenue Effective le:</strong> ${formatDate(documentData.retention_date)}<br>
                <strong>Fact Client-FA:</strong> ${documentData.invoice_number || '-'}
            </div>

            <!-- Section A: Payeur -->
            <div class="section">
                <div class="section-title">A - PERSONNE OU ORGANISME PAYEUR:</div>
                <div class="info-row">
                    <div class="info-label">Dénomination de la personne ou de l'organisme payeur:</div>
                    <div class="info-value">${companyInfo.name || '-'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Adresse:</div>
                    <div class="info-value">${companyInfo.address || '-'}</div>
                </div>
                <div style="margin-top: 8px;">
                    <table style="margin: 0;">
                        <tr>
                            <th style="width: 50%;">IDENTIFIANT</th>
                            <th style="width: 50%;"></th>
                        </tr>
                        <tr>
                            <td><strong>Matricule Fiscal</strong></td>
                            <td>${companyInfo.tax_id || '-'}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Section B: Retenues effectuées -->
            <div class="section">
                <div class="section-title">B - RETENUES EFFECTUÉES SUR</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 40%;"></th>
                            <th style="width: 20%;">MONTANT BRUT</th>
                            <th style="width: 20%;">RETENUE</th>
                            <th style="width: 20%;">MONTANT NET</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="text-align: left; padding-left: 8px;"><strong>RETENUE À SOURCE SUR MARCHÉ ${retentionRate}%</strong></td>
                            <td class="amount-cell">${formatAmount(invoiceAmount)}</td>
                            <td class="amount-cell">${formatAmount(retentionAmount)}</td>
                            <td class="amount-cell">${formatAmount(netAmount)}</td>
                        </tr>
                        <tr class="total-row">
                            <td style="text-align: right; padding-right: 8px;"><strong>Total Général</strong></td>
                            <td class="amount-cell">${formatAmount(invoiceAmount)}</td>
                            <td class="amount-cell">${formatAmount(retentionAmount)}</td>
                            <td class="amount-cell">${formatAmount(netAmount)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Section C: Bénéficiaire -->
            <div class="section">
                <div class="section-title">C - BÉNÉFICIAIRE</div>
                <div class="info-row">
                    <div class="info-label">N° de la carte d'identité<br>ou séjour pour les étrangers</div>
                    <div class="info-value" style="border: 1px solid #000; padding: 2px 8px; min-height: 20px;">${documentData.id_number || ''}</div>
                    <div class="info-label" style="margin-left: 20px;">IDENTIFIANT</div>
                </div>
                <div class="info-row">
                    <div class="info-label"></div>
                    <div class="info-value"></div>
                    <div class="info-label" style="margin-left: 20px;"><strong>Matricule Fiscal</strong></div>
                </div>
                <div class="info-row">
                    <div class="info-label"></div>
                    <div class="info-value"></div>
                    <div class="info-value" style="border: 1px solid #000; padding: 2px 8px; margin-left: 20px; min-height: 20px;">${documentData.tax_id || '-'}</div>
                </div>
                <div class="info-row" style="margin-top: 8px;">
                    <div class="info-label">Nom, Prénom ou raison sociale:</div>
                    <div class="info-value">${entityName || '-'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Adresse professionnelle:</div>
                    <div class="info-value">${documentData.address || '-'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Adresse de résidence:</div>
                    <div class="info-value">${documentData.address || '-'}</div>
                </div>
            </div>

            <div class="footer-text">
                Je soussigné, certifie exacts les renseignements figurant sur le présent<br>
                certificat et m'engage aux sanctions prévues par la loi pour toute inexactitude.
            </div>

            <div class="signature-section">
                <div class="signature-line">
                    À ${companyInfo.city || 'SFAX'}, le ${formatDate(new Date())}
                </div>
                <div class="signature-line" style="margin-top: 20px;">
                    <strong>Cachet et signature du payeur</strong>
                </div>
            </div>

            <div class="footer-note">
                (1) Le certificat est délivré à l'occasion de chaque paiement. Toutefois, pour les opérations répétitives, le certificat peut être délivré mensuellement ou trimestriellement.<br>
                (2) En cas de déclaration au montant global, joindre la liste du détail des paiements (nom, prénom, adresse et montant payé): les règles de publicité prévues par la loi)<br>
                à l'égard du revenu ou sur les sociétés (pénalisations et établissements publics): E. établissements secondaires.
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
    }, 250);
};

// Generic Finance Document Print Function
export const printFinanceDocument = (documentData, documentType, companyInfo = {}) => {
    // Check if it's a tax withholding certificate
    if (documentType === 'client_return' || documentType === 'supplier_return') {
        return printTaxWithholdingCertificate(documentData, documentType === 'client_return', companyInfo);
    }

    const formatDate = (date) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR');
    };

    const formatAmount = (amount) => {
        return parseFloat(amount || 0).toFixed(3);
    };

    const getDocumentTitle = (type) => {
        const titles = {
            check: 'Chèque',
            payment_slip: 'Bordereau de Versement',
            client_payment: 'Ordre d\'Encaissement Client',
            supplier_payment: 'Ordre de Paiement Fournisseur',
            fiscal_year: 'Exercice Fiscal',
            bank_account: 'Compte Bancaire'
        };
        return titles[type] || 'Document Financier';
    };

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${getDocumentTitle(documentType)}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
                .container { max-width: 800px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #6366f1; padding-bottom: 20px; }
                .company-name { font-size: 24px; font-weight: bold; color: #6366f1; margin-bottom: 10px; }
                .company-info { font-size: 12px; color: #666; line-height: 1.6; }
                .doc-title { font-size: 28px; font-weight: bold; color: #1f2937; margin: 30px 0; text-align: center; }
                .doc-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                .info-row:last-child { border-bottom: none; }
                .info-label { font-weight: 600; color: #6366f1; min-width: 200px; }
                .info-value { color: #1f2937; flex: 1; }
                .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 20px; }
                .signature-section { margin-top: 60px; display: flex; justify-content: space-between; }
                .signature-box { width: 200px; text-align: center; border-top: 1px solid #333; padding-top: 10px; }
                @media print { body { padding: 20px; } }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="company-name">${companyInfo.name || 'Entreprise'}</div>
                    <div class="company-info">
                        ${companyInfo.address || ''}<br>
                        ${companyInfo.phone ? 'Tél: ' + companyInfo.phone : ''} ${companyInfo.email ? '• Email: ' + companyInfo.email : ''}<br>
                        ${companyInfo.tax_id ? 'MF: ' + companyInfo.tax_id : ''}
                    </div>
                </div>

                <div class="doc-title">${getDocumentTitle(documentType)}</div>

                <div class="doc-info">
                    ${Object.entries(documentData).map(([key, value]) => {
                        if (key === 'id' || key === 'created_at' || key === 'updated_at' || key === 'created_by' || key === 'user_id') return '';
                        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        let displayValue = value;
                        
                        if (key.includes('date')) displayValue = formatDate(value);
                        else if (key.includes('amount') || key.includes('balance')) displayValue = formatAmount(value) + ' TND';
                        else if (key === 'status') displayValue = value?.replace(/_/g, ' ').toUpperCase();
                        else if (typeof value === 'boolean') displayValue = value ? 'Oui' : 'Non';
                        else if (value === null || value === undefined) displayValue = '-';
                        
                        return `
                            <div class="info-row">
                                <div class="info-label">${label}</div>
                                <div class="info-value">${displayValue}</div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div class="signature-section">
                    <div class="signature-box">Préparé par</div>
                    <div class="signature-box">Approuvé par</div>
                </div>

                <div class="footer">
                    Document généré le ${formatDate(new Date())} - ${companyInfo.name || 'Gestion Commerciale'}
                </div>
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
    }, 250);
};
