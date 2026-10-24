import React, { useState } from 'react';
import { X, Printer, Download, Share2, FileText } from 'lucide-react';
import PrintableBill from './PrintableBill';
import api from '../services/api';
import toast from 'react-hot-toast';

export const BillPreviewModal = ({ isOpen, onClose, bill, settings }) => {
  const [printFormat, setPrintFormat] = useState('80mm'); // '80mm' (3 inch) | 'a4' (200mm)
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Manage print class on body for clean borderless isolation
  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('bill-print-active');
    } else {
      document.body.classList.remove('bill-print-active');
    }
    return () => {
      document.body.classList.remove('bill-print-active');
    };
  }, [isOpen]);

  if (!isOpen || !bill) return null;

  const handlePrint = () => {
    const printableElement = document.getElementById('printable-bill-content');
    if (!printableElement) {
      window.print();
      return;
    }

    // Clean up any existing print frame
    const existingFrame = document.getElementById('thermal-print-iframe');
    if (existingFrame) {
      existingFrame.remove();
    }

    // Create an isolated iframe so TVSE RP3200 Lite prints on EXACTLY 1 single sheet
    const iframe = document.createElement('iframe');
    iframe.id = 'thermal-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = printFormat === '80mm' ? '76mm' : '200mm';
    iframe.style.height = '100px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    // Collect all stylesheets from main document
    const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title></title>
          ${headStyles}
          <style>
            @page {
              size: auto;
              margin: 0mm !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              width: ${printFormat === '80mm' ? '76mm' : '100%'} !important;
              max-width: ${printFormat === '80mm' ? '76mm' : '200mm'} !important;
              height: max-content !important;
              min-height: 0 !important;
              overflow: hidden !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            }
            .thermal-receipt {
              width: 76mm !important;
              max-width: 76mm !important;
              margin: 0 !important;
              padding: 1.5mm 2.5mm 2mm 2.5mm !important;
              box-sizing: border-box !important;
              border: none !important;
              box-shadow: none !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
              height: auto !important;
              overflow: hidden !important;
            }
            .a4-invoice {
              width: 100% !important;
              max-width: 200mm !important;
              margin: 0 auto !important;
              padding: 6mm 8mm !important;
              box-sizing: border-box !important;
              border: none !important;
              box-shadow: none !important;
            }
            img {
              display: block !important;
              max-width: 100% !important;
              height: auto !important;
              border: none !important;
            }
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                height: max-content !important;
                overflow: hidden !important;
              }
              .thermal-receipt {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
            }
          </style>
        </head>
        <body>
          ${printableElement.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    // Give iframe short tick to apply styles then print cleanly
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Iframe print error, falling back to window.print', err);
        window.print();
      }
    }, 200);
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloadingPDF(true);
      toast.loading('Generating invoice PDF...', { id: 'pdf-dl' });
      const res = await api.get(`/bills/${bill._id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Nagulan_Invoice_${bill.billNumber || 'Bill'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      toast.success('Invoice PDF downloaded successfully!', { id: 'pdf-dl' });
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error('Could not download server PDF. Opening print dialog to save as PDF...', { id: 'pdf-dl' });
      window.print();
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleWhatsAppShare = () => {
    const mobile = bill.customer?.mobile?.replace(/\D/g, '');
    if (!mobile) {
      toast.error('Customer mobile number is missing');
      return;
    }

    const formattedMobile = mobile.length === 10 ? `91${mobile}` : mobile;
    const text = encodeURIComponent(
      `Hello ${bill.customer?.name || 'Customer'},\n\nThank you for choosing *NAGULAN Unisex Salon*! ✨\n\n*Invoice No:* #${bill.billNumber}\n*Date:* ${new Date(
        bill.billDate
      ).toLocaleDateString('en-IN')}\n*Total Amount:* ₹${bill.grandTotal}\n*Payment Method:* ${
        bill.paymentMethod
      }\n*Status:* ${bill.paymentStatus}\n\nFranchise Enquiry: 97899 61617\nVisit Again!`
    );

    window.open(`https://wa.me/${formattedMobile}?text=${text}`, '_blank');
    toast.success('Opening WhatsApp with bill summary!');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white dark:bg-charcoal-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 dark:border-charcoal-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-charcoal-800 flex items-center justify-between bg-gray-50 dark:bg-charcoal-950/60 no-print">
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold-500" />
              Invoice Preview: #{bill.billNumber}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Customer: {bill.customer?.name} ({bill.customer?.mobile})
            </p>
          </div>

          {/* Format Switcher */}
          <div className="flex items-center gap-2">
            <div className="bg-gray-200 dark:bg-charcoal-800 p-0.5 rounded-lg flex text-xs">
              <button
                onClick={() => setPrintFormat('80mm')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  printFormat === '80mm'
                    ? 'bg-black text-white dark:bg-gold-500 dark:text-black shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                3" (80mm) Thermal
              </button>
              <button
                onClick={() => setPrintFormat('a4')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  printFormat === 'a4'
                    ? 'bg-black text-white dark:bg-gold-500 dark:text-black shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                A4 (200mm) Invoice
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-charcoal-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Bill Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100 dark:bg-charcoal-950/40">
          <div className="flex justify-center w-full">
            <div id="printable-bill-content" className="w-full flex justify-center">
              <PrintableBill bill={bill} settings={settings} format={printFormat} />
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 flex flex-wrap items-center justify-between gap-3 no-print">
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-xs sm:text-sm shadow transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Share on WhatsApp</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-charcoal-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-800 font-medium text-xs sm:text-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 font-bold text-xs sm:text-sm shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print {printFormat === '80mm' ? '3" (80mm) Receipt' : 'A4 (200mm) Bill'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillPreviewModal;
