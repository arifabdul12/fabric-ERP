import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatINR, formatDate } from "../lib/format";
import { Plus, Eye } from "lucide-react";

export default function Purchases() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/purchases").then((r) => { setRows(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#3F3F46" }}>Module</div>
          <h1 className="text-3xl sm:text-4xl font-bold">Purchases</h1>
          <p className="text-sm mt-1" style={{ color: "#3F3F46" }}>Record mill purchases · Auto-increments inventory</p>
        </div>
        <Link
          to="/purchases/new"
          data-testid="new-purchase-button"
          className="inline-flex items-center gap-2 px-5 min-h-[48px] rounded-md text-white font-semibold"
          style={{ background: "#003B73" }}
        >
          <Plus className="w-5 h-5" /> New Purchase
        </Link>
      </div>

      <div className="bg-white border border-gray-300 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="purchases-table">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr className="text-left text-xs uppercase tracking-wider" style={{ color: "#3F3F46" }}>
                <th className="px-4 py-3">Mill</th>
                <th className="px-4 py-3">Bill No.</th>
                <th className="px-4 py-3">Bill Date</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Total Meters</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center" style={{ color: "#71717A" }}>Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan="6" className="px-4 py-12 text-center" style={{ color: "#71717A" }}>
                  No purchases recorded yet. <Link to="/purchases/new" style={{ color: "#003B73" }} className="font-semibold">Record the first one →</Link>
                </td></tr>
              ) : rows.map((p) => {
                const meters = (p.items || []).reduce((s, i) => s + (i.meters || 0), 0);
                return (
                  <tr key={p.id} className="border-b border-gray-200 even:bg-gray-50">
                    <td className="px-4 py-3 font-semibold">{p.mill_name}</td>
                    <td className="px-4 py-3 font-num">{p.bill_number || "—"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#3F3F46" }}>{formatDate(p.bill_date)}</td>
                    <td className="px-4 py-3 text-right font-num">{p.items?.length || 0}</td>
                    <td className="px-4 py-3 text-right font-num">{meters.toFixed(2)} m</td>
                    <td className="px-4 py-3 text-right font-num font-bold">{formatINR(p.total, { decimals: 0 })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
