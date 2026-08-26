import React from 'react';
import NagulanBanner from './NagulanBanner';
import nagulanBannerImg from '../assets/nagulan-banner.jpg';

export const PrintableBill = ({ bill, settings = {}, format = '80mm' }) => {
  if (!bill) return null;

  const salonName = settings.salonName || 'NAGULAN Unisex Salon';
  const tagline = settings.tagline || 'Hair | Skin | Beauty | Makeup';
  const franchisePhone = settings.franchiseEnquiry || '97899 61617';
  const salonAddress = settings.address || 'Nagulan salon , Indur , Dharmapuri , PIN 636803';
  const footerMessage = settings.receiptFooterMessage || 'Thank you for visiting NAGULAN Unisex Salon';
  const subFooter = settings.receiptSubFooter || 'Visit Again';
  const bannerSrc = settings.bannerUrl || nagulanBannerImg || '/nagulan-banner.jpg';

  // 80mm Thermal Receipt View
  if (format === '80mm') {
    return (
      <div className="thermal-receipt bg-white text-black p-3 font-mono text-xs leading-relaxed max-w-[80mm] mx-auto border border-dashed border-gray-400">
        {/* Official Brand Banner at Top */}
        <div className="text-center pb-2 border-b border-black">
          <div className="w-full bg-black rounded p-1 mb-2">
            <img
              src={bannerSrc}
              alt="NAGULAN Unisex Salon"
              className="w-full h-auto object-contain rounded"
            />
          </div>
          <p className="text-[10px] font-bold text-gray-900 mt-1 uppercase">{salonAddress}</p>
          <p className="text-[9px] text-gray-700 mt-0.5 font-semibold">
            Franchise Enquiry: <span className="font-bold text-black">{franchisePhone}</span>
          </p>
        </div>

        {/* Bill & Customer Meta */}
        <div className="py-2 text-[10px] border-b border-dashed border-black space-y-1">
          <div className="flex justify-between">
            <span className="font-semibold">Bill No:</span>
            <span className="font-bold">{bill.billNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date & Time:</span>
            <span>{new Date(bill.billDate).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Customer:</span>
            <span className="font-bold">{bill.customer?.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Mobile:</span>
            <span className="font-mono">{bill.customer?.mobile}</span>
          </div>
          <div className="flex justify-between">
            <span>Stylist / Attendant:</span>
            <span className="font-semibold">{bill.attendant?.name || 'Salon Stylist'}</span>
          </div>
          <div className="flex justify-between">
            <span>Station / Chair:</span>
            <span>{bill.chair?.name || bill.chair?.chairNumber || 'Main Salon'}</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-2 border-b border-dashed border-black">
          <div className="grid grid-cols-12 font-bold text-[10px] pb-1 border-b border-black">
            <span className="col-span-6">Item / Service</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-2 text-right">Rate</span>
            <span className="col-span-2 text-right">Amt</span>
          </div>

          <div className="pt-1.5 space-y-1 text-[10px]">
            {bill.items?.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12">
                <span className="col-span-6 truncate font-medium">{item.name}</span>
                <span className="col-span-2 text-center">{item.quantity}</span>
                <span className="col-span-2 text-right">₹{item.unitPrice}</span>
                <span className="col-span-2 text-right font-bold">₹{item.totalAmount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="py-2 text-[10px] space-y-1 border-b border-black">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹ {Number(bill.subtotal).toFixed(2)}</span>
          </div>

          {bill.discountTotal > 0 && (
            <div className="flex justify-between text-black font-semibold">
              <span>Discount ({bill.discountType === 'percentage' ? `${bill.discountValue}%` : 'Flat'}):</span>
              <span>- ₹ {Number(bill.discountTotal).toFixed(2)}</span>
            </div>
          )}

          {bill.cgst > 0 && (
            <div className="flex justify-between">
              <span>CGST (9%):</span>
              <span>₹ {Number(bill.cgst).toFixed(2)}</span>
            </div>
          )}

          {bill.sgst > 0 && (
            <div className="flex justify-between">
              <span>SGST (9%):</span>
              <span>₹ {Number(bill.sgst).toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-xs font-black pt-1.5 border-t border-black">
            <span>GRAND TOTAL:</span>
            <span className="text-sm">₹ {Number(bill.grandTotal).toFixed(2)}</span>
          </div>

          <div className="flex justify-between pt-1">
            <span>Payment Mode:</span>
            <span className="font-bold uppercase">{bill.paymentMethod}</span>
          </div>

          <div className="flex justify-between">
            <span>Amount Received:</span>
            <span className="font-semibold">₹ {Number(bill.amountReceived || bill.grandTotal).toFixed(2)}</span>
          </div>

          {bill.balanceAmount > 0 && (
            <div className="flex justify-between font-bold">
              <span>Balance Due:</span>
              <span>₹ {Number(bill.balanceAmount).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Footer Notes */}
        <div className="pt-3 text-center text-[10px] space-y-0.5">
          <p className="font-bold">{footerMessage}</p>
          <p className="italic font-serif">{subFooter}</p>
          <p className="text-[8px] text-gray-600 mt-2">Billed By: {bill.createdByName || 'System'}</p>
        </div>
      </div>
    );
  }

  // Standard A4 Format Invoice View
  return (
    <div className="a4-invoice bg-white text-black p-6 sm:p-8 max-w-[210mm] mx-auto border border-gray-300 shadow-sm text-sm">
      {/* Official Brand Banner at Very Top */}
      <div className="w-full mb-6">
        <NagulanBanner printable={true} customUrl={settings.bannerUrl} />
      </div>

      {/* Invoice Details & Meta */}
      <div className="grid grid-cols-2 gap-8 my-4 pb-4 border-b border-gray-200">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Billed To</h3>
          <p className="font-bold text-base text-gray-900">{bill.customer?.name}</p>
          <p className="text-gray-600 font-mono">Mobile: {bill.customer?.mobile}</p>
          {bill.customer?.email && <p className="text-gray-600">Email: {bill.customer.email}</p>}
        </div>

        <div className="text-right">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Invoice Information</h3>
          <p className="font-bold text-base text-gray-900">Tax Invoice: #{bill.billNumber}</p>
          <p className="text-gray-600">Date: {new Date(bill.billDate).toLocaleString('en-IN')}</p>
          <p className="text-gray-600">Stylist: <span className="font-semibold text-gray-900">{bill.attendant?.name || 'Salon Stylist'}</span></p>
          <p className="text-gray-600">Station / Chair: {bill.chair?.name || bill.chair?.chairNumber || 'Main Salon'}</p>
        </div>
      </div>

      {/* Itemized Table */}
      <table className="w-full text-left border-collapse mb-6">
        <thead>
          <tr className="bg-black text-white text-xs uppercase tracking-wider">
            <th className="py-2.5 px-3">#</th>
            <th className="py-2.5 px-3">Item / Service Name</th>
            <th className="py-2.5 px-3">Category</th>
            <th className="py-2.5 px-3 text-center">Qty</th>
            <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
            <th className="py-2.5 px-3 text-right">Disc (₹)</th>
            <th className="py-2.5 px-3 text-right">Total (₹)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-xs">
          {bill.items?.map((item, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="py-2 px-3">{idx + 1}</td>
              <td className="py-2 px-3 font-medium text-gray-900">{item.name}</td>
              <td className="py-2 px-3 text-gray-500">{item.category || item.itemType}</td>
              <td className="py-2 px-3 text-center font-bold">{item.quantity}</td>
              <td className="py-2 px-3 text-right">₹ {Number(item.unitPrice).toFixed(2)}</td>
              <td className="py-2 px-3 text-right">₹ {Number(item.discountAmount || 0).toFixed(2)}</td>
              <td className="py-2 px-3 text-right font-bold text-gray-900">₹ {Number(item.totalAmount).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Box */}
      <div className="flex justify-end mb-8">
        <div className="w-72 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold">₹ {Number(bill.subtotal).toFixed(2)}</span>
          </div>

          {bill.discountTotal > 0 && (
            <div className="flex justify-between py-1 border-b border-gray-100 text-red-600">
              <span>Discount ({bill.discountType === 'percentage' ? `${bill.discountValue}%` : 'Flat'}):</span>
              <span>- ₹ {Number(bill.discountTotal).toFixed(2)}</span>
            </div>
          )}

          {bill.cgst > 0 && (
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">CGST (9%):</span>
              <span>₹ {Number(bill.cgst).toFixed(2)}</span>
            </div>
          )}

          {bill.sgst > 0 && (
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">SGST (9%):</span>
              <span>₹ {Number(bill.sgst).toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between py-2.5 bg-black text-white px-3 rounded-lg font-bold text-sm">
            <span>Grand Total:</span>
            <span className="text-gold-400 text-base">₹ {Number(bill.grandTotal).toFixed(2)}</span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="text-gray-600">Payment Mode:</span>
            <span className="font-semibold uppercase">{bill.paymentMethod}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Amount Paid:</span>
            <span className="font-semibold">₹ {Number(bill.amountReceived || bill.grandTotal).toFixed(2)}</span>
          </div>

          {bill.balanceAmount > 0 && (
            <div className="flex justify-between font-bold text-amber-700">
              <span>Balance Due:</span>
              <span>₹ {Number(bill.balanceAmount).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 pt-6 text-center text-xs space-y-1 text-gray-700">
        <p className="font-bold text-gray-900 text-sm">{footerMessage}</p>
        <p className="italic font-serif text-gold-600">{subFooter}</p>
        <p className="text-[11px] text-gray-700 pt-2 font-medium">
          {salonAddress} | Franchise Enquiry: {franchisePhone}
        </p>
      </div>
    </div>
  );
};

export default PrintableBill;
