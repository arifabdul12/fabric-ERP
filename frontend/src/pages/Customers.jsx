import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatINR } from "../lib/format";
import { AlertTriangle } from "lucide-react";

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/customers").then((r) => { setRows(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const overdueCount = rows.filter((r) => r.overdue).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#3F3F46" }}>Module</div>
        <h1 className="text-3xl sm:text-4xl font-bold">Customer Ledger</h1>
        <p className="text-sm mt-1" style={{ color: "#3F3F46" }}>
          Track billed · credit notes · outstanding · overdue alerts
          {overdueCount > 0 && (
            <span className="ml-3 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold" style={{ background: "#FFEBEE", color: "#D32F2F" }}>
              <AlertTriangle className="w-3 h-3" /> {overdueCount} overdue
            </span>
          )}
        </p>
      </div>

      <div className="bg-white border border-gray-300 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="customers-table">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr className="text-left text-xs uppercase tracking-wider" style={{ color: "#3F3F46" }}>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3 text-right">Bills</th>
                <th className="px-4 py-3 text-right">Billed</th>
                <th className="px-4 py-3 text-right">Credit Applied</th>
                <th className="px-4 py-3 text-right">Open Credit</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
                <th className="px-4 py-3 text-right">Age (days)</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center" style={{ color: "#71717A" }}>Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan="8" className="px-4 py-12 text-center" style={{ color: "#71717A" }}>No customers yet. Create a bill to add one.</td></tr>
              ) : rows.map((c) => (
                <tr key={c.customer_name} className="border-b border-gray-200 even:bg-gray-50" data-testid={`customer-row-${c.customer_name}`}>
                  <td className="px-4 py-3">
                    <Link to={`/customers/${encodeURIComponent(c.customer_name)}`} className="font-semibold" style={{ color: "#003B73" }}>
                      {c.customer_name}
                    </Link>
                    {c.customer_phone && <div className="text-xs font-num" style={{ color: "#71717A" }}>{c.customer_phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-right font-num">{c.bills_count}</td>
                  <td className="px-4 py-3 text-right font-num">{formatINR(c.total_billed, { decimals: 0 })}</td>
                  <td className="px-4 py-3 text-right font-num text-xs" style={{ color: "#2E7D32" }}>−{formatINR(c.credit_applied, { decimals: 0 })}</td>
                  <td className="px-4 py-3 text-right font-num text-xs" style={{ color: "#F57C00" }}>{formatINR(c.open_credit_notes, { decimals: 0 })}</td>
                  <td className="px-4 py-3 text-right font-num font-bold">{formatINR(c.outstanding, { decimals: 0 })}</td>
                  <td className="px-4 py-3 text-right font-num text-xs">{c.days_since_last_bill ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {c.overdue ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold" style={{ background: "#FFEBEE", color: "#D32F2F" }}>
                        <AlertTriangle className="w-3 h-3" /> OVERDUE
                      </span>
                    ) : c.outstanding > 0 ? (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{ background: "#FFF3E0", color: "#F57C00" }}>Pending</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{ background: "#E8F5E9", color: "#2E7D32" }}>Clear</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
