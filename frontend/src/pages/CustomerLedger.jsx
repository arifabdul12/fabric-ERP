import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatINR, formatDate } from "../lib/format";
import { ArrowLeft } from "lucide-react";

export default function CustomerLedger() {
  const { name } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/customers/${encodeURIComponent(name)}`)
      .then((r) => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [name]);

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (!data) return <div className="p-8 text-red-700">Customer not found.</div>;

  const s = data.summary;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/customers" className="inline-flex items-center gap-2 text-sm font-semibold mb-4" style={{ color: "#003B73" }}>
        <ArrowLeft className="w-4 h-4" /> All Customers
      </Link>
      <h1 className="text-3xl sm:text-4xl font-bold mb-1">{decodeURIComponent(name)}</h1>
      <p className="text-sm mb-8" style={{ color: "#3F3F46" }}>{s.bills_count} bills · Ledger view</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-300 rounded-md p-5">
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>Total Billed</div>
          <div className="text-2xl font-bold font-num">{formatINR(s.total_billed, { decimals: 0 })}</div>
        </div>
        <div className="bg-white border border-gray-300 rounded-md p-5">
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>Credit Applied</div>
          <div className="text-2xl font-bold font-num" style={{ color: "#2E7D32" }}>{formatINR(s.credit_applied, { decimals: 0 })}</div>
        </div>
        <div className="bg-white border border-gray-300 rounded-md p-5">
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>Open Credit</div>
          <div className="text-2xl font-bold font-num" style={{ color: "#F57C00" }}>{formatINR(s.open_credit_notes, { decimals: 0 })}</div>
        </div>
        <div className="bg-white border border-gray-300 rounded-md p-5">
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>Outstanding</div>
          <div className="text-2xl font-bold font-num">{formatINR(s.outstanding, { decimals: 0 })}</div>
        </div>
      </div>

      <div className="bg-white border border-gray-300 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="ledger-table">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr className="text-left text-xs uppercase tracking-wider" style={{ color: "#3F3F46" }}>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3 text-right">Debit</th>
                <th className="px-4 py-3 text-right">Credit</th>
                <th className="px-4 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-12 text-center" style={{ color: "#71717A" }}>No transactions.</td></tr>
              ) : data.entries.map((e, i) => (
                <tr key={i} className="border-b border-gray-200 even:bg-gray-50">
                  <td className="px-4 py-3 text-xs font-num" style={{ color: "#3F3F46" }}>{formatDate(e.date)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded" style={{
                      background: e.type === "bill" ? "#E3F2FD" : e.type === "credit_note" ? "#FFF3E0" : "#E8F5E9",
                      color: e.type === "bill" ? "#003B73" : e.type === "credit_note" ? "#F57C00" : "#2E7D32",
                    }}>
                      {e.type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-num font-semibold">
                    {e.type === "bill" && e.id ? (
                      <Link to={`/bills/${e.id}`} style={{ color: "#003B73" }}>{e.reference}</Link>
                    ) : e.reference}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#3F3F46" }}>{e.note}</td>
                  <td className="px-4 py-3 text-right font-num">{e.debit > 0 ? formatINR(e.debit, { decimals: 0 }) : "—"}</td>
                  <td className="px-4 py-3 text-right font-num" style={{ color: "#2E7D32" }}>{e.credit > 0 ? formatINR(e.credit, { decimals: 0 }) : "—"}</td>
                  <td className="px-4 py-3 text-right font-num font-bold">{formatINR(e.balance, { decimals: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
