import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatApiErrorDetail } from "../lib/api";
import { formatINR } from "../lib/format";
import { AlertTriangle, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

const emptyForm = { name: "", address: "", phone: "", gst_number: "", credit_period_days: "45", firm_id: "" };

export default function Customers() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [master, setMaster] = useState([]);
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [c, m, f] = await Promise.all([
        api.get("/customers"),
        api.get("/customers-master"),
        api.get("/firms"),
      ]);
      setRows(c.data);
      setMaster(m.data);
      setFirms(f.data);
    } catch (e) { /* noop */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openForm = () => {
    setForm({ ...emptyForm, firm_id: user?.firm_id || "" });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/customers-master", {
        name: form.name.trim(),
        address: form.address,
        phone: form.phone,
        gst_number: form.gst_number,
        credit_period_days: parseInt(form.credit_period_days) || 45,
        firm_id: form.firm_id,
      });
      toast.success("Customer added");
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Failed");
    }
    setSaving(false);
  };

  // Merge master customers (with 0 activity) into ledger view
  const merged = React.useMemo(() => {
    const byName = new Map(rows.map((r) => [r.customer_name, r]));
    master.forEach((m) => {
      if (!byName.has(m.name)) {
        byName.set(m.name, {
          customer_name: m.name, customer_phone: m.phone, customer_gst: m.gst_number,
          total_billed: 0, credit_applied: 0, open_credit_notes: 0, outstanding: 0,
          bills_count: 0, days_since_last_bill: null, overdue: false,
        });
      }
    });
    return Array.from(byName.values());
  }, [rows, master]);

  const overdueCount = merged.filter((r) => r.overdue).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
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
        <button onClick={openForm} data-testid="add-customer-button"
          className="inline-flex items-center gap-2 px-5 min-h-[48px] rounded-md text-white font-semibold"
          style={{ background: "#003B73" }}>
          <Plus className="w-5 h-5" /> Add Customer
        </button>
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
              ) : merged.length === 0 ? (
                <tr><td colSpan="8" className="px-4 py-12 text-center" style={{ color: "#71717A" }}>No customers yet. Click Add Customer to start.</td></tr>
              ) : merged.map((c) => (
                <tr key={c.customer_name} className="border-b border-gray-200 even:bg-gray-50">
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
                    ) : c.bills_count === 0 ? (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{ background: "#F5F5F5", color: "#71717A" }}>New</span>
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

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-md w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-300 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add Customer</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4" data-testid="customer-form">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>Customer Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="customer-name-input"
                  className="w-full min-h-[44px] px-3 border border-gray-400 rounded-md text-base focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>Customer Address</label>
                <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  data-testid="customer-address-input"
                  className="w-full px-3 py-2 border border-gray-400 rounded-md text-base focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>Mobile Number</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    data-testid="customer-phone-input"
                    className="w-full min-h-[44px] px-3 border border-gray-400 rounded-md text-base font-num focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>GST Number</label>
                  <input type="text" value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value })}
                    data-testid="customer-gst-input"
                    className="w-full min-h-[44px] px-3 border border-gray-400 rounded-md text-base font-num focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>Credit Period (days)</label>
                  <input type="number" min="0" value={form.credit_period_days} onChange={(e) => setForm({ ...form, credit_period_days: e.target.value })}
                    data-testid="customer-credit-period-input"
                    className="w-full min-h-[44px] px-3 border border-gray-400 rounded-md text-base font-num focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>Firm *</label>
                  <select required value={form.firm_id} onChange={(e) => setForm({ ...form, firm_id: e.target.value })}
                    data-testid="customer-firm-select"
                    className="w-full min-h-[44px] px-3 border border-gray-400 rounded-md text-base bg-white focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none">
                    <option value="">— Choose firm —</option>
                    {firms.map((f) => (
                      <option key={f.id} value={f.id} disabled={user?.role !== "admin" && f.id !== user?.firm_id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 min-h-[44px] border border-gray-400 rounded-md font-semibold">Cancel</button>
                <button type="submit" disabled={saving} data-testid="customer-submit"
                  className="px-5 min-h-[44px] rounded-md text-white font-semibold disabled:opacity-60" style={{ background: "#003B73" }}>
                  {saving ? "Saving…" : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
