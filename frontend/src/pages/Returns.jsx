import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatINR, formatDate } from "../lib/format";
import { Plus } from "lucide-react";

export default function Returns() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/returns").then((r) => { setRows(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#3F3F46" }}>Module</div>
          <h1 className="text-3xl sm:text-4xl font-bold">Sales Returns · Credit Notes</h1>
          <p className="text-sm mt-1" style={{ color: "#3F3F46" }}>Returned fabric goes back to stock · Credit note generated against customer</p>
        </div>
        <Link
          to="/returns/new"
          data-testid="new-return-button"
          className="inline-flex items-center gap-2 px-5 min-h-[48px] rounded-md text-white font-semibold"
          style={{ background: "#003B73" }}
        >
          <Plus className="w-5 h-5" /> New Return
        </Link>
      </div>

      <div className="bg-white border border-gray-300 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="returns-table">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr className="text-left text-xs uppercase tracking-wider" style={{ color: "#3F3F46" }}>
                <th className="px-4 py-3">Credit Note No.</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Against Bill</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Credit Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="px-4 py-8 text-center" style={{ color: "#71717A" }}>Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-12 text-center" style={{ color: "#71717A" }}>
                  No returns yet. <Link to="/returns/new" style={{ color: "#003B73" }} className="font-semibold">Record a return →</Link>
                </td></tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-200 even:bg-gray-50">
                  <td className="px-4 py-3 font-num font-semibold" style={{ color: "#003B73" }}>{r.credit_note_no}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#3F3F46" }}>{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3 font-semibold">{r.customer_name}</td>
                  <td className="px-4 py-3 font-num text-xs">{r.original_bill_no || "—"}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#3F3F46" }}>{r.reason || "—"}</td>
                  <td className="px-4 py-3 text-right font-num">{r.items?.length || 0}</td>
                  <td className="px-4 py-3 text-right font-num font-bold" style={{ color: "#2E7D32" }}>{formatINR(r.total, { decimals: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
