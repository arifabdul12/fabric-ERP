import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatINR, formatDate } from "../lib/format";
import { Plus, Eye } from "lucide-react";

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/bills").then((r) => { setBills(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#3F3F46" }}>Module</div>
          <h1 className="text-3xl sm:text-4xl font-bold">Sales Bills</h1>
          <p className="text-sm mt-1" style={{ color: "#3F3F46" }}>GST-compliant invoices · Auto-deducts inventory</p>
        </div>
        <Link
          to="/bills/new"
          data-testid="new-bill-button"
          className="inline-flex items-center gap-2 px-5 min-h-[48px] rounded-md text-white font-semibold"
          style={{ background: "#003B73" }}
        >
          <Plus className="w-5 h-5" /> New Bill
        </Link>
      </div>

      <div className="bg-white border border-gray-300 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="bills-table">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr className="text-left text-xs uppercase tracking-wider" style={{ color: "#3F3F46" }}>
                <th className="px-4 py-3">Bill No</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">HSN</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
                <th className="px-4 py-3 text-right">GST</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="px-4 py-8 text-center" style={{ color: "#71717A" }}>Loading…</td></tr>
              ) : bills.length === 0 ? (
                <tr><td colSpan="9" className="px-4 py-12 text-center" style={{ color: "#71717A" }}>
                  No bills yet. <Link to="/bills/new" style={{ color: "#003B73" }} className="font-semibold">Create the first one →</Link>
                </td></tr>
              ) : bills.map((b) => {
                const hsnCodes = [...new Set((b.items || []).map((i) => i.hsn_code).filter(Boolean))];
                return (
                <tr key={b.id} className="border-b border-gray-200 even:bg-gray-50">
                  <td className="px-4 py-3 font-num font-semibold">
                    <Link to={`/bills/${b.id}`} style={{ color: "#003B73" }}>{b.bill_no}</Link>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#3F3F46" }}>{formatDate(b.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{b.customer_name}</div>
                    {b.customer_state && <div className="text-xs" style={{ color: "#71717A" }}>{b.customer_state}</div>}
                  </td>
                  <td className="px-4 py-3 font-num text-xs" style={{ color: "#3F3F46" }}>
                    {hsnCodes.length ? hsnCodes.join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-num">{b.items?.length || 0}</td>
                  <td className="px-4 py-3 text-right font-num">{formatINR(b.subtotal, { decimals: 0 })}</td>
                  <td className="px-4 py-3 text-right font-num text-xs" style={{ color: "#3F3F46" }}>
                    {formatINR(b.cgst + b.sgst + b.igst, { decimals: 0 })}
                  </td>
                  <td className="px-4 py-3 text-right font-num font-bold">{formatINR(b.total, { decimals: 0 })}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/bills/${b.id}`} data-testid={`view-bill-${b.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-400 rounded text-xs font-semibold hover:bg-gray-100">
                      <Eye className="w-3 h-3" /> View
                    </Link>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
