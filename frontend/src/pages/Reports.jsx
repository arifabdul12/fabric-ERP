import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatINR, formatDate } from "../lib/format";
import { AlertTriangle } from "lucide-react";

const TABS = [
  { key: "monthly-sales", label: "Monthly Sales" },
  { key: "mill-purchases", label: "Mill-wise Purchases" },
  { key: "fabric-movement", label: "Fast / Slow Moving" },
  { key: "overdue", label: "Overdue Payments" },
];

const num = (v, d = 2) => (Number.isFinite(Number(v)) ? Number(v).toFixed(d) : (0).toFixed(d));

export default function Reports() {
  const [tab, setTab] = useState("monthly-sales");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api.get(`/reports/${tab}`)
      .then((r) => { setRows(Array.isArray(r.data) ? r.data : []); setLoading(false); })
      .catch((e) => { setError(e.response?.data?.detail || e.message); setRows([]); setLoading(false); });
  }, [tab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#3F3F46" }}>Module</div>
        <h1 className="text-3xl sm:text-4xl font-bold">Reports</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-300">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} data-testid={`report-tab-${t.key}`}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.key ? "border-[#003B73] text-[#003B73]" : "border-transparent text-gray-600 hover:text-gray-900"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-300 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-4 py-8 text-center" style={{ color: "#71717A" }}>Loading…</div>
          ) : error ? (
            <div className="px-4 py-8 text-center" style={{ color: "#D32F2F" }} data-testid="report-error">Error: {error}</div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-12 text-center" style={{ color: "#71717A" }}>No data available for this report.</div>
          ) : tab === "monthly-sales" ? (
            <table className="w-full text-sm" data-testid="report-monthly-sales-table">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr className="text-left text-xs uppercase tracking-wider" style={{ color: "#3F3F46" }}>
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3 text-right">Bills</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                  <th className="px-4 py-3 text-right">GST</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.month} className="border-b border-gray-200 even:bg-gray-50">
                    <td className="px-4 py-3 font-num font-semibold">{r.month}</td>
                    <td className="px-4 py-3 text-right font-num">{r.bills_count}</td>
                    <td className="px-4 py-3 text-right font-num">{formatINR(r.subtotal, { decimals: 0 })}</td>
                    <td className="px-4 py-3 text-right font-num text-xs">{formatINR(r.gst, { decimals: 0 })}</td>
                    <td className="px-4 py-3 text-right font-num font-bold">{formatINR(r.total, { decimals: 0 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : tab === "mill-purchases" ? (
            <table className="w-full text-sm" data-testid="report-mill-purchases-table">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr className="text-left text-xs uppercase tracking-wider" style={{ color: "#3F3F46" }}>
                  <th className="px-4 py-3">Mill</th>
                  <th className="px-4 py-3">Fabric</th>
                  <th className="px-4 py-3">Shade</th>
                  <th className="px-4 py-3">Count</th>
                  <th className="px-4 py-3 text-right">Meters</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                  <th className="px-4 py-3">Bill No.</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Firm</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-200 even:bg-gray-50">
                    <td className="px-4 py-3 font-semibold">{r.mill_name}</td>
                    <td className="px-4 py-3">{r.fabric_name}</td>
                    <td className="px-4 py-3 font-num">{r.shade_no || "—"}</td>
                    <td className="px-4 py-3 font-num">{r.fabric_count || "—"}</td>
                    <td className="px-4 py-3 text-right font-num">{num(r.meters)}</td>
                    <td className="px-4 py-3 text-right font-num">{formatINR(r.rate, { decimals: 0 })}</td>
                    <td className="px-4 py-3 font-num">{r.bill_number || "—"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#3F3F46" }}>{formatDate(r.bill_date)}</td>
                    <td className="px-4 py-3 text-xs">{r.firm_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : tab === "fabric-movement" ? (
            <table className="w-full text-sm" data-testid="report-fabric-movement-table">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr className="text-left text-xs uppercase tracking-wider" style={{ color: "#3F3F46" }}>
                  <th className="px-4 py-3">Fabric</th>
                  <th className="px-4 py-3">Mill</th>
                  <th className="px-4 py-3">Shade</th>
                  <th className="px-4 py-3 text-right">Total Sold (m)</th>
                  <th className="px-4 py-3 text-right">In Stock</th>
                  <th className="px-4 py-3 text-right">Movement</th>
                  <th className="px-4 py-3">Firm</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const color = r.movement === "fast" ? "#2E7D32" : r.movement === "slow" ? "#D32F2F" : "#F57C00";
                  const bg = r.movement === "fast" ? "#E8F5E9" : r.movement === "slow" ? "#FFEBEE" : "#FFF3E0";
                  return (
                    <tr key={r.id} className="border-b border-gray-200 even:bg-gray-50">
                      <td className="px-4 py-3 font-semibold">{r.fabric_name}</td>
                      <td className="px-4 py-3">{r.mill_name}</td>
                      <td className="px-4 py-3 font-num">{r.shade_no || "—"}</td>
                      <td className="px-4 py-3 text-right font-num font-semibold">{num(r.sold_meters)}</td>
                      <td className="px-4 py-3 text-right font-num">{num(r.current_stock)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: bg, color }}>{r.movement}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">{r.firm_name}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm" data-testid="report-overdue-table">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr className="text-left text-xs uppercase tracking-wider" style={{ color: "#3F3F46" }}>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Firm</th>
                  <th className="px-4 py-3">Bill No.</th>
                  <th className="px-4 py-3">Bill Date</th>
                  <th className="px-4 py-3 text-right">Amount Due</th>
                  <th className="px-4 py-3 text-right">Days Overdue</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-200" style={{ background: "#FFEBEE" }}>
                    <td className="px-4 py-3 font-semibold" style={{ color: "#D32F2F" }}>{r.customer_name}</td>
                    <td className="px-4 py-3 text-xs">{r.firm_name}</td>
                    <td className="px-4 py-3 font-num font-semibold">{r.bill_number}</td>
                    <td className="px-4 py-3 text-xs font-num">{formatDate(r.bill_date)}</td>
                    <td className="px-4 py-3 text-right font-num font-bold" style={{ color: "#D32F2F" }}>{formatINR(r.amount_due, { decimals: 0 })}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold" style={{ background: "#D32F2F", color: "#fff" }}>
                        <AlertTriangle className="w-3 h-3" /> {r.days_overdue} d
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
