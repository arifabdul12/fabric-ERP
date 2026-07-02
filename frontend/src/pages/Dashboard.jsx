import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatINR, formatMeters, formatDate } from "../lib/format";
import { TrendingUp, Package, AlertTriangle, FileText, Plus } from "lucide-react";

function MetricCard({ label, value, sub, accent, testid }) {
  return (
    <div className="bg-white border border-gray-300 rounded-md p-5" data-testid={testid}>
      <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>{label}</div>
      <div className="text-3xl font-bold font-num" style={{ color: accent || "#0A0A0A" }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: "#71717A" }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard").then((r) => {
      setData(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (!data) return <div className="p-8 text-red-700">Failed to load dashboard.</div>;

  const m = data.metrics;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#3F3F46" }}>Dashboard</div>
          <h1 className="text-3xl sm:text-4xl font-bold" data-testid="dashboard-firm-name">{data.firm?.name}</h1>
          {data.firm?.gst_number && (
            <div className="text-sm font-num mt-1" style={{ color: "#3F3F46" }}>GSTIN: {data.firm.gst_number}</div>
          )}
        </div>
        <Link
          to="/bills/new"
          data-testid="create-bill-cta"
          className="inline-flex items-center gap-2 px-5 min-h-[48px] rounded-md text-white font-semibold"
          style={{ background: "#003B73" }}
        >
          <Plus className="w-5 h-5" /> Create Bill
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Monthly Sales"
          value={formatINR(m.monthly_sales, { decimals: 0 })}
          sub={`${m.bills_this_month} bills this month`}
          accent="#003B73"
          testid="metric-monthly-sales"
        />
        <MetricCard
          label="Total Sales"
          value={formatINR(m.total_sales, { decimals: 0 })}
          sub="All-time"
          testid="metric-total-sales"
        />
        <MetricCard
          label="Stock On Hand"
          value={`${m.total_meters.toLocaleString("en-IN")} m`}
          sub={`${m.fabric_count} fabric lines`}
          testid="metric-stock"
        />
        <MetricCard
          label="Low Stock Items"
          value={m.low_stock_count}
          sub={m.low_stock_count > 0 ? "Action required" : "All good"}
          accent={m.low_stock_count > 0 ? "#D32F2F" : "#2E7D32"}
          testid="metric-low-stock"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent bills */}
        <section className="bg-white border border-gray-300 rounded-md">
          <header className="px-5 py-4 border-b border-gray-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: "#003B73" }} />
              <h2 className="text-base font-semibold">Recent Bills</h2>
            </div>
            <Link to="/bills" className="text-sm font-semibold" style={{ color: "#003B73" }}>View all →</Link>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="recent-bills-table">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider" style={{ color: "#3F3F46" }}>
                  <th className="px-4 py-3">Bill No</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">HSN</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_bills.length === 0 ? (
                  <tr><td colSpan="5" className="px-4 py-8 text-center" style={{ color: "#71717A" }}>No bills yet. Create your first bill →</td></tr>
                ) : data.recent_bills.map((b) => {
                  const hsn = [...new Set((b.items || []).map((i) => i.hsn_code).filter(Boolean))].join(", ");
                  return (
                  <tr key={b.id} className="border-t border-gray-200 even:bg-gray-50">
                    <td className="px-4 py-3 font-num font-semibold"><Link to={`/bills/${b.id}`} style={{ color: "#003B73" }}>{b.bill_no}</Link></td>
                    <td className="px-4 py-3">{b.customer_name}</td>
                    <td className="px-4 py-3 font-num text-xs" style={{ color: "#3F3F46" }}>{hsn || "—"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#3F3F46" }}>{formatDate(b.created_at)}</td>
                    <td className="px-4 py-3 text-right font-num font-semibold">{formatINR(b.total, { decimals: 0 })}</td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </section>

        {/* Low stock */}
        <section className="bg-white border border-gray-300 rounded-md">
          <header className="px-5 py-4 border-b border-gray-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" style={{ color: data.low_stock.length > 0 ? "#D32F2F" : "#2E7D32" }} />
              <h2 className="text-base font-semibold">Low Stock Alerts</h2>
            </div>
            <Link to="/inventory" className="text-sm font-semibold" style={{ color: "#003B73" }}>Inventory →</Link>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="low-stock-table">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider" style={{ color: "#3F3F46" }}>
                  <th className="px-4 py-3">Fabric</th>
                  <th className="px-4 py-3">Shade</th>
                  <th className="px-4 py-3 text-right">In Stock</th>
                </tr>
              </thead>
              <tbody>
                {data.low_stock.length === 0 ? (
                  <tr><td colSpan="3" className="px-4 py-8 text-center" style={{ color: "#71717A" }}>No low stock items.</td></tr>
                ) : data.low_stock.map((f) => (
                  <tr key={f.id} className="border-t border-gray-200 even:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{f.fabric_name}</div>
                      <div className="text-xs" style={{ color: "#71717A" }}>{f.mill_name} · {f.fabric_count}</div>
                    </td>
                    <td className="px-4 py-3 font-num">{f.shade_no}</td>
                    <td className="px-4 py-3 text-right font-num font-semibold" style={{ color: "#D32F2F" }}>{formatMeters(f.meters)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
