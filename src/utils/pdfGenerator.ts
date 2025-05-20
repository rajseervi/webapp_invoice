import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  // Add more styles...
});

export const generatePDF = async (invoice: any) => {
  const InvoiceDocument = () => (
    <Document>
      <Page size="A4" style={styles.page} >
        <View style={styles.header}>
          <Text style={styles.title}>INVOICE</Text>
          <Text>{invoice.invoiceDetails.invoiceNumber}</Text>
        </View>
        {/* Add more invoice content */}
      </Page>
    </Document>
  );

  return (
    <PDFDownloadLink
      document={<InvoiceDocument />}
      fileName={`invoice-${invoice.invoiceDetails.invoiceNumber}.pdf`}
    >
      {({ loading }) => (loading ? 'Generating PDF...' : 'Download PDF')}
    </PDFDownloadLink>
  );
};