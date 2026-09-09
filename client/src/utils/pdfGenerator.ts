import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SalesChallan } from '../types';
import { formatDate, formatCurrencyDetailed } from './formatters';

export function generateChallanPDF(challan: SalesChallan, action: 'download' | 'print' | 'blob' = 'download') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary Header Bar
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Company Brand Name & Tagline
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('FLOWLEDGER', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('Every sale. Every stock movement. One clear workflow.', 14, 18);
  doc.text('GSTIN: 27AABCU9603R1ZM | CIN: U72900HR2026PTC109822', 14, 23);

  // Document Title Pill
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('DELIVERY SALES CHALLAN', pageWidth - 14, 14, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`ORIGINAL FOR RECIPIENT`, pageWidth - 14, 20, { align: 'right' });

  // Challan Info Box & Customer Info Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 34, 88, 38, 2, 2, 'FD');
  doc.roundedRect(108, 34, 88, 38, 2, 2, 'FD');

  // Box 1: Challan Metadata
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CHALLAN DETAILS', 18, 40);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`Challan No:`, 18, 46);
  doc.setFont('helvetica', 'bold');
  doc.text(challan.challanNumber, 44, 46);

  doc.setFont('helvetica', 'normal');
  doc.text(`Challan Date:`, 18, 52);
  doc.text(formatDate(challan.createdAt), 44, 52);

  doc.text(`Status:`, 18, 58);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(
    challan.status === 'CONFIRMED' ? 16 : challan.status === 'DRAFT' ? 202 : 225,
    challan.status === 'CONFIRMED' ? 185 : challan.status === 'DRAFT' ? 138 : 29,
    challan.status === 'CONFIRMED' ? 129 : challan.status === 'DRAFT' ? 4 : 72
  );
  doc.text(challan.status, 44, 58);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`Transporter:`, 18, 64);
  doc.text(challan.dispatchThrough || 'Self / Direct Dispatch', 44, 64);

  doc.text(`Vehicle No:`, 18, 70);
  doc.text(challan.vehicleNumber || '—', 44, 70);

  // Box 2: Billed / Shipped To (Customer)
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CONSIGNEE / CUSTOMER DETAILS', 112, 40);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.text(challan.customer.businessName, 112, 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Attn: ${challan.customer.name} (${challan.customer.mobile})`, 112, 51);
  doc.text(`GSTIN: ${challan.customer.gstNumber || 'Unregistered / Retail'}`, 112, 56);

  // Address line wrapping
  const splitAddress = doc.splitTextToSize(
    `${challan.customer.address}, ${challan.customer.city}, ${challan.customer.state} ${challan.customer.pincode || ''}`,
    80
  );
  doc.text(splitAddress, 112, 61);

  // Items Table
  const tableData = challan.items.map((item, index) => [
    index + 1,
    item.skuSnapshot,
    item.productNameSnapshot,
    `${item.quantity}`,
    formatCurrencyDetailed(item.unitPriceSnapshot),
    formatCurrencyDetailed(item.lineTotal),
  ]);

  autoTable(doc, {
    startY: 78,
    head: [['#', 'SKU Code', 'Item Description', 'Qty', 'Unit Rate', 'Line Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 32, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 150;

  // Calculation Summary Section
  const summaryBoxY = finalY + 6;

  // Notes & Terms Box on Left
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, summaryBoxY, 100, 36, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('TERMS & CONDITIONS:', 18, summaryBoxY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('1. Goods received in good condition & verified count.', 18, summaryBoxY + 12);
  doc.text('2. Dispatched subject to standard company warranty.', 18, summaryBoxY + 17);
  doc.text('3. Any discrepancies must be reported within 24 hours of receipt.', 18, summaryBoxY + 22);
  if (challan.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(`Dispatch Note: ${challan.notes.slice(0, 65)}`, 18, summaryBoxY + 30);
  }

  // Totals Box on Right
  doc.roundedRect(120, summaryBoxY, 76, 36, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text('Sub Total:', 124, summaryBoxY + 8);
  doc.text(formatCurrencyDetailed(challan.subTotal), pageWidth - 18, summaryBoxY + 8, { align: 'right' });

  doc.text(`Integrated GST (${challan.taxRate}%):`, 124, summaryBoxY + 15);
  doc.text(formatCurrencyDetailed(challan.taxAmount), pageWidth - 18, summaryBoxY + 15, { align: 'right' });

  doc.text('Total Dispatch Units:', 124, summaryBoxY + 22);
  doc.text(`${challan.totalQuantity} Units`, pageWidth - 18, summaryBoxY + 22, { align: 'right' });

  doc.setDrawColor(203, 213, 225);
  doc.line(124, summaryBoxY + 25, pageWidth - 18, summaryBoxY + 25);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Grand Total:', 124, summaryBoxY + 32);
  doc.text(formatCurrencyDetailed(challan.grandTotal), pageWidth - 18, summaryBoxY + 32, { align: 'right' });

  // Signatures Section
  const sigY = summaryBoxY + 48;

  doc.setDrawColor(203, 213, 225);
  doc.line(18, sigY + 16, 75, sigY + 16);
  doc.line(pageWidth - 75, sigY + 16, pageWidth - 18, sigY + 16);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text("Customer / Receiver's Signature & Stamp", 18, sigY + 21);
  doc.text('Authorized Signatory (FlowLedger)', pageWidth - 75, sigY + 21);

  // Footer bar
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated by FlowLedger Operations Engine • ${new Date().toLocaleString('en-IN')} • System Document ID: ${challan.id}`,
    pageWidth / 2,
    285,
    { align: 'center' }
  );

  if (action === 'download') {
    doc.save(`Sales_Challan_${challan.challanNumber}.pdf`);
  } else if (action === 'print') {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  } else if (action === 'blob') {
    return doc.output('bloburl');
  }
}
