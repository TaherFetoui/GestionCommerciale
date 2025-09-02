import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNPrint from 'react-native-print';

// This function would be inside your component
const handlePrintInvoice = async (invoiceData) => {
  // 1. Create your HTML content string
  const htmlContent = `
    <html>
      <head><style>body { font-family: sans-serif; padding: 20px; }</style></head>
      <body>
        <h1>Invoice #${invoiceData.invoice_number}</h1>
        <p>Client: ${invoiceData.client.name}</p>
        <p>Total: $${invoiceData.total_amount}</p>
        </body>
    </html>
  `;

  // 2. Generate PDF from HTML
  try {
    const pdf = await RNHTMLtoPDF.convert({
      html: htmlContent,
      fileName: `Invoice-${invoiceData.invoice_number}`,
      directory: 'Documents',
    });

    // 3. Print the generated PDF
    await RNPrint.print({ filePath: pdf.filePath });

  } catch (error) {
    console.error('Failed to print invoice', error);
  }
};

// <Button title="Print Invoice" onPress={() => handlePrintInvoice(currentInvoice)} />