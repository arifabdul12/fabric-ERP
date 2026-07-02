import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, formatApiErrorDetail } from "../lib/api";
import { formatINR } from "../lib/format";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const emptyLine = {
  fabric_id: "",
  fabric_name: "",
  shade_no: "",
  fabric_count: "",
  meters: "",
  rate: "",
};

export default function NewReturn() {
  const nav = useNavigate();
  const [fabrics, setFabrics] = useState([]);
  const [bills, setBills] = useState([]);
  const [customer, setCustomer] = useState("");
  const [originalBillId, setOriginalBillId] = useState("");
  const [reason, setReason] = useState("");
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/fabrics").then((r) => setFabrics(r.data));
    api.get("/bills").then((r) => setBills(r.data));
  }, []);

  const setLine = (i, patch) => setLines((arr) => arr.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const onPickFabric = (i, id) => {
    if (!id) {
      setLine(i, { fabric_id: "", fabric_name: "", shade_no: "", fabric_count: "" });
      return;
    }
    const f = fabrics.find((x) => x.id === id);
    if (!f) return;
    setLine(i, { fabric_id: f.id, fabric_name: f.fabric_name, shade_no: f.shade_no, fabric_count: f.fabric_count });
  };

  const onPickBill = (billId) => {
    setOriginalBillId(billId);
    if (!billId) return;
    const b = bills.find((x) => x.id === billId);
    if (!b) return;
    setCustomer(b.customer_name || "");
    // Prefill lines from the bill items
    if (b.items?.length) {
      setLines(
        b.items.map((it) => ({
          fabric_id: it.fabric_id || "",
          fabric_name: it.fabric_name || "",
          shade_no: it.shade_no || "",
          fabric_count: it.fabric_count || "",
          meters: "",
          rate: String(it.rate || ""),
        }))
      );
    }
  };

  const total = useMemo(() => {
    let t = 0;
    lines.forEach((l) => { t += (parseFloat(l.meters) || 0) * (parseFloat(l.rate) || 0); });
    return Math.round(t * 100) / 100;
  }, [lines]);

  const submit = async (e) => {
    e.preventDefault();
    if (!customer.trim()) { toast.error("Customer name required"); return; }
    const items = lines
      .filter((l) => l.fabric_name && parseFloat(l.meters) > 0)
      .map((l) => ({
        fabric_id: l.fabric_id || null,
        fabric_name: l.fabric_name.trim(),
        shade_no: l.shade_no || "",
        fabric_count: l.fabric_count || "",
        meters: parseFloat(l.meters) || 0,
        rate: parseFloat(l.rate) || 0,
      }));
    if (items.length === 0) { toast.error("Add at least one item to return"); return; }
    setSubmitting(true);
    const originalBill = bills.find((x) => x.id === originalBillId);
    try {
      const { data } = await api.post("/returns", {
        customer_name: customer,
        original_bill_id: originalBillId || null,
        original_bill_no: originalBill?.bill_no || "",
        items,
        reason,
      });
      toast.success(`Credit Note ${data.credit_note_no} generated · Stock updated`);
      nav("/returns");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Failed");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/returns" className="inline-flex items-center gap-2 text-sm font-semibold mb-4" style={{ color: "#003B73" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Returns
      </Link>
      <h1 className="text-3xl sm:text-4xl font-bold mb-1">New Return</h1>
      <p className="text-sm mb-8" style={{ color: "#3F3F46" }}>Fabric goes back to inventory · A credit note is generated for the customer.</p>

      <form onSubmit={submit} className="space-y-6" data-testid="new-return-form">
        <section className="bg-white border border-gray-300 rounded-md p-6">
          <h2 className="text-base font-semibold mb-4">Return Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>Against Bill (optional)</label>
              <select value={originalBillId} onChange={(e) => onPickBill(e.target.value)}
                data-testid="return-original-bill"
                className="w-full min-h-[44px] px-3 border border-gray-400 rounded-md text-base bg-white focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none">
                <option value="">— Standalone return —</option>
                {bills.map((b) => (
                  <option key={b.id} value={b.id}>{b.bill_no} · {b.customer_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>Customer Name *</label>
              <input type="text" required value={customer} onChange={(e) => setCustomer(e.target.value)}
                data-testid="return-customer-name"
                className="w-full min-h-[44px] px-3 border border-gray-400 rounded-md text-base focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>Reason</label>
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Shade mismatch, damaged, size issue"
                className="w-full min-h-[44px] px-3 border border-gray-400 rounded-md text-base focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none" />
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-300 rounded-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Returned Items</h2>
            <button type="button" onClick={() => setLines((arr) => [...arr, { ...emptyLine }])}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-400 rounded-md text-sm font-semibold hover:bg-gray-50">
              <Plus className="w-4 h-4" /> Add Line
            </button>
          </div>

          <div className="space-y-4">
            {lines.map((l, i) => {
              const amt = (parseFloat(l.meters) || 0) * (parseFloat(l.rate) || 0);
              return (
                <div key={i} className="border border-gray-300 rounded-md p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#3F3F46" }}>Item {i + 1}</span>
                    {lines.length > 1 && (
                      <button type="button" onClick={() => setLines((arr) => arr.filter((_, idx) => idx !== i))}
                        className="p-1.5 hover:bg-red-100 rounded" style={{ color: "#D32F2F" }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className="block text-xs font-semibold mb-1" style={{ color: "#3F3F46" }}>Fabric (stock restored)</label>
                      <select value={l.fabric_id} onChange={(e) => onPickFabric(i, e.target.value)}
                        data-testid={`return-line-${i}-fabric-select`}
                        className="w-full min-h-[40px] px-2 border border-gray-400 rounded-md text-sm bg-white focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none">
                        <option value="">— Free-text (won't update stock) —</option>
                        {fabrics.map((f) => (
                          <option key={f.id} value={f.id}>{f.fabric_name} · {f.shade_no} · {f.fabric_count}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-6">
                      <label className="block text-xs font-semibold mb-1" style={{ color: "#3F3F46" }}>Fabric Name *</label>
                      <input type="text" required value={l.fabric_name}
                        onChange={(e) => setLine(i, { fabric_name: e.target.value })}
                        className="w-full min-h-[40px] px-2 border border-gray-400 rounded-md text-sm focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none" />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold mb-1" style={{ color: "#3F3F46" }}>Shade</label>
                      <input type="text" value={l.shade_no} onChange={(e) => setLine(i, { shade_no: e.target.value })}
                        className="w-full min-h-[40px] px-2 border border-gray-400 rounded-md text-sm font-num focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none" />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold mb-1" style={{ color: "#3F3F46" }}>Count</label>
                      <input type="text" value={l.fabric_count} onChange={(e) => setLine(i, { fabric_count: e.target.value })}
                        className="w-full min-h-[40px] px-2 border border-gray-400 rounded-md text-sm font-num focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none" />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold mb-1" style={{ color: "#3F3F46" }}>Meters *</label>
                      <input type="number" step="0.01" required value={l.meters}
                        onChange={(e) => setLine(i, { meters: e.target.value })}
                        data-testid={`return-line-${i}-meters`}
                        className="w-full min-h-[40px] px-2 border border-gray-400 rounded-md text-sm font-num focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none" />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold mb-1" style={{ color: "#3F3F46" }}>Rate ₹/m *</label>
                      <input type="number" step="0.01" required value={l.rate}
                        onChange={(e) => setLine(i, { rate: e.target.value })}
                        data-testid={`return-line-${i}-rate`}
                        className="w-full min-h-[40px] px-2 border border-gray-400 rounded-md text-sm font-num focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none" />
                    </div>
                  </div>
                  <div className="mt-3 text-right text-sm">
                    <span className="font-semibold" style={{ color: "#3F3F46" }}>Line Credit: </span>
                    <span className="font-num font-bold text-base">{formatINR(amt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white border border-gray-300 rounded-md p-6 flex items-center justify-between">
          <div className="text-sm" style={{ color: "#3F3F46" }}>
            Credit Note will be generated for the customer for the amount below.
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: "#3F3F46" }}>Credit Amount</div>
            <div className="text-2xl font-bold font-num" data-testid="return-grand-total" style={{ color: "#2E7D32" }}>{formatINR(total)}</div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Link to="/returns" className="px-6 min-h-[48px] inline-flex items-center border border-gray-400 rounded-md font-semibold">Cancel</Link>
          <button type="submit" disabled={submitting} data-testid="save-return-button"
            className="px-8 min-h-[48px] rounded-md text-white font-semibold disabled:opacity-60" style={{ background: "#003B73" }}>
            {submitting ? "Saving…" : "Save Return · Generate Credit Note"}
          </button>
        </div>
      </form>
    </div>
  );
}
