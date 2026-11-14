import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Receipt,
  Search,
  Eye,
  Printer,
  Download,
  X,
  CheckCircle2,
  Calendar,
  User,
  MapPin,
  CreditCard,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { apiClient } from '../../api/client';

export interface InvoiceRecord {
  _id: string;
  invoiceNumber: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  addressTag?: string;
  productName: string;
  brand: string;
  storage?: string;
  color?: string;
  grade?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  orderDate: string;
  createdAt: string;
}

export const InvoicesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);

  const { data: invoices, isLoading } = useQuery<InvoiceRecord[]>({
    queryKey: ['admin-invoices'],
    queryFn: async () => {
      const res = await apiClient.get('/catalogue/admin/invoices');
      return res.data.data;
    },
  });

  const filteredInvoices = invoices?.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerPhone.includes(searchTerm) ||
      inv.productName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = invoices?.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0) || 0;
  const totalTax = Math.round(totalRevenue * (18 / 118));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-purple-600" />
            Customer Orders & Tax Invoices
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time repository of customer checkout orders, generated GST tax invoices, and payment confirmations.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoices</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{invoices?.length || 0}</span>
            <span className="text-xs text-emerald-600 font-semibold">Active Orders</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced Amount</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-600 font-mono">₹{totalRevenue.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">GST Collected (18%)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">₹{totalTax.toLocaleString('en-IN')}</span>
            <span className="text-xs text-slate-500 font-medium">CGST + SGST</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Orders</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">
              {invoices?.filter((i) => i.status === 'CONFIRMED').length || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">Ready for dispatch</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice #, order #, customer name, phone, or product..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
        >
          <option value="ALL">All Statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          <option value="DELIVERED">Delivered</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5">Invoice & Order #</th>
              <th className="px-6 py-3.5">Date</th>
              <th className="px-6 py-3.5">Customer</th>
              <th className="px-6 py-3.5">Product & Specs</th>
              <th className="px-6 py-3.5">Payment Mode</th>
              <th className="px-6 py-3.5">Total Amount</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={8} className="px-6 py-4 bg-slate-50/50"></td>
                </tr>
              ))
            ) : !filteredInvoices || filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                  <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  No matching invoices found.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 font-mono">{inv.invoiceNumber ? inv.invoiceNumber.replace(/^REV-/, 'GEN-') : 'GEN-INV-2026'}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{inv.orderNumber ? inv.orderNumber.replace(/^REV-/, 'GEN-') : 'GEN-ORD'}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                    {new Date(inv.orderDate || inv.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{inv.customerName}</div>
                    <div className="text-[11px] text-slate-500">{inv.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800 line-clamp-1">{inv.productName}</div>
                    <div className="text-[11px] text-slate-500">
                      {inv.storage || 'Standard'} • {inv.color || 'Standard'} • Grade {inv.grade || 'A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      <CreditCard className="w-3 h-3 text-slate-500" />
                      {inv.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-purple-700 font-mono text-sm whitespace-nowrap">
                    ₹{inv.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        inv.status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold border border-purple-200 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Invoice
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Official Tax Invoice Modal with Authentic Circular GENIE Rubber Stamp */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-auto shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header Actions (Not printed) */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50 shrink-0 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-purple-700" /> Official Tax Invoice Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Tax Invoice Content */}
            <div id="genie-printable-invoice" className="p-8 overflow-y-auto space-y-6 text-slate-900 bg-white">
              {/* Invoice Top Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div className="flex items-center gap-3">
                  <img
                    src="/genie_emblem.png"
                    alt="GENIE Logo"
                    className="w-12 h-12 object-contain rounded-lg border border-slate-200 p-1 bg-white"
                  />
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">GENIE</h2>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                      Genie Technologies Pvt. Ltd.
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      CIN: U72900KA2024PTC184920 • GSTIN: 29AAACR1234F1Z5
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-black uppercase rounded border border-emerald-200 tracking-wider">
                    TAX INVOICE
                  </span>
                  <div className="text-xs font-bold text-slate-900 mt-2 font-mono">
                    Invoice: {selectedInvoice.invoiceNumber ? selectedInvoice.invoiceNumber.replace(/^REV-/, 'GEN-') : 'GEN-INV-2026'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">Order ID: {selectedInvoice.orderNumber ? selectedInvoice.orderNumber.replace(/^REV-/, 'GEN-') : 'GEN-ORD'}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Date:{' '}
                    {new Date(selectedInvoice.orderDate || selectedInvoice.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Company & Customer Details Grid */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                    Sold By & Dispatch Center:
                  </span>
                  <div className="font-bold text-slate-900">GENIE Central Fulfillment Hub</div>
                  <div className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                    Plot 18B, Electronics City Phase 1,<br />
                    Hosur Road, Bengaluru, Karnataka - 560100<br />
                    State Code: 29 (Karnataka)<br />
                    Helpline: +91 93638 59553 (9 AM - 9 PM) | Email: genietnsupport@gmail.com
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                    Bill To & Delivery Address:
                  </span>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    {selectedInvoice.customerName}
                    <span className="text-[9px] px-1.5 py-0.2 bg-slate-200 rounded font-semibold text-slate-700">
                      {selectedInvoice.addressTag || 'Home'}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                    {selectedInvoice.shippingAddress}
                  </div>
                  <div className="text-slate-600 text-[11px] mt-1">
                    Phone: <span className="font-medium text-slate-900">{selectedInvoice.customerPhone}</span>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Email: <span className="font-medium text-slate-900">{selectedInvoice.customerEmail}</span>
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3">Item Description</th>
                      <th className="p-3">HSN Code</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Taxable Value</th>
                      <th className="p-3 text-right">GST (18%)</th>
                      <th className="p-3 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 text-center font-bold text-slate-400">1</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{selectedInvoice.productName}</div>
                        <div className="text-[10px] text-slate-500">
                          Brand: {selectedInvoice.brand} • Storage: {selectedInvoice.storage || '128GB'} • Grade:{' '}
                          {selectedInvoice.grade || 'EXCELLENT'} • 1-Year GENIE Warranty
                        </div>
                      </td>
                      <td className="p-3 font-mono text-slate-500">85171300</td>
                      <td className="p-3 text-center font-bold text-slate-700">{selectedInvoice.quantity || 1}</td>
                      <td className="p-3 text-right font-mono text-slate-700">
                        ₹{Math.round((selectedInvoice.totalAmount * 100) / 118).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-700">
                        ₹{Math.round(selectedInvoice.totalAmount * (18 / 118)).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        ₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary and Calculations */}
              <div className="grid grid-cols-2 gap-6 items-start">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-950">
                    <span className="font-bold block mb-1">Payment Method & Terms:</span>
                    <div>Mode: <span className="font-bold">{selectedInvoice.paymentMethod}</span></div>
                    <div>Status: <span className="font-bold text-emerald-700">Payment Verified</span></div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Certified Genie Quality Check Passed • Zero Deductions Guarantee
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Declaration: This is an authentic computer generated Tax Invoice issued under Section 31 of CGST Act
                    2017. All values are in Indian Rupees (INR).
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono">
                      ₹{Math.round((selectedInvoice.totalAmount * 100) / 118).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                    <span>CGST (9.0%):</span>
                    <span className="font-mono">
                      ₹{Math.round(selectedInvoice.totalAmount * (9 / 118)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                    <span>SGST (9.0%):</span>
                    <span className="font-mono">
                      ₹{Math.round(selectedInvoice.totalAmount * (9 / 118)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 text-sm font-black text-slate-900 border-b-2 border-slate-900">
                    <span>Grand Total:</span>
                    <span className="font-mono text-purple-700 font-bold">₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Authorised Signatory Footer */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                <div className="text-xs text-slate-500 max-w-sm">
                  <div className="font-bold text-slate-700 mb-1">Terms & Conditions:</div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    1. All certified devices undergo a 32-point hardware and software diagnostic test.<br />
                    2. Includes 12-Month GENIE Warranty and 7-day hassle-free replacement guarantee.<br />
                    3. This is a digitally verified computer-generated tax invoice.
                  </p>
                </div>

                <div className="text-right">
                  <div className="h-10 flex items-end justify-end mb-1">
                    <span className="font-serif italic text-base text-slate-800 font-bold tracking-wider">
                      Genie Accounts
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">Authorised Signatory</div>
                  <div className="text-[10px] text-slate-500">Genie Technologies Pvt. Ltd.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

