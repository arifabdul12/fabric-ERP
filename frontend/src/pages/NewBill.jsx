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
  hsn_code: "",
  pieces: 1,
  meters: "",
  rate: "",
};

export default function NewBill() {
  const nav = useNavigate();
  const [fabrics, setFabrics] = useState([]);
  const [customer, setCustomer] = useState({
    customer_name: "",
    customer_state: "",
    customer_state_code: "",
    customer_phone: "",
    customer_gst: "",
  });
  const [isInterstate, setIsInterstate] = useState(false);
  const [gstRate] = useState(5);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/fabrics").then((r) => setFabrics(r.data));
  }, []);

  const setLine = (i, patch) => {
    setLines((arr) => arr.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };

  const onPickFabric = (i, id) => {
    if (!id) {
      setLine(i, { fabric_id: "", fabric_name: "", shade_no: "", fabric_count: "" });
      return;
    }
    const f = fabrics.find((x) => x.id === id);
    if (!f) return;
    setLine(i, {
      fabric_id: f.id,
      fabric_name: f.fabric_name,
      shade_no: f.shade_no,
      fabric_count: f.fabric_count,
    });
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    lines.forEach((l) => {
      const m = parseFloat(l.meters) || 0;
      const r = parseFloat(l.rate) || 0;
      subtotal += m * r;
    });
    subtotal = Math.round(subtotal * 100) / 100;
    const gst = Math.round(subtotal * gstRate) / 100;
    const cgst = isInterstate ? 0 : Math.round(gst * 50) / 100;
    const sgst = isInterstate ? 0 : Math.round((gst - cgst) * 100) / 100;
    const igst = isInterstate ? gst : 0;
    return { subtotal, gst, cgst, sgst, igst, total: Math.round((subtotal + gst) * 100) / 100 };
  }, [lines, gstRate, isInterstate]);

  const submit = async (e) => {
    e.preventDefault();
    if (!customer.customer_name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    const items = lines
      .filter((l) => l.fabric_name && parseFloat(l.meters) > 0)
      .map((l) => ({
        fabric_id: l.fabric_id || null,
        fabric_name: l.fabric_name.trim(),
        shade_no: l.shade_no || "",
        fabric_count: l.fabric_count || "",
        hsn_code: l.hsn_code || "",
        pieces: parseInt(l.pieces) || 1,
        meters: parseFloat(l.meters) || 0,
        rate: parseFloat(l.rate) || 0,
      }));
    if (items.length === 0) {
      toast.error("Add at least one item with meters and rate");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/bills", {
        ...customer,
        items,
        gst_rate: gstRate,
        is_interstate: isInterstate,
        notes,
      });
      toast.success(`Bill ${data.bill_no} created`);
      nav(`/bills/${data.id}`);
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Failed to create bill");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/bills" className="inline-flex items-center gap-2 text-sm font-semibold mb-4" style={{ color: "#003B73" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Bills
      </Link>

      <h1 className="text-3xl sm:text-4xl font-bold mb-1">New Bill</h1>
      <p className="text-sm mb-8" style={{ color: "#3F3F46" }}>Fill customer details, add items, save. Stock will auto-deduct.</p>

      <form onSubmit={submit} className="space-y-6" data-testid="new-bill-form">
        {/* Customer card */}
        <section className="bg-white border border-gray-300 rounded-md p-6">
          <h2 className="text-base font-semibold mb-4">Customer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>Customer Name *</label>
              <input
                type="text"
                required
                value={customer.customer_name}
                onChange={(e) => setCustomer({ ...customer, customer_name: e.target.value })}
                data-testid="bill-customer-name-input"
                className="w-full min-h-[44px] px-3 border border-gray-400 rounded-md text-base focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>State</label>
              <input
                type="text"
                value={customer.customer_state}
                onChange={(e) => setCustomer({ ...customer, customer_state: e.target.value })}
                className="w-full min-h-[44px] px-3 border border-gray-400 rounded-md text-base focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>State Code</label>
              <input
                type="text"
                value={customer.customer_state_code}
                onChange={(e) => setCustomer({ ...customer, customer_state_code: e.target.value })}
                className="w-full min-h-[44px] px-3 border border-gray-400 rounded-md text-base font-num focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>Phone</label>
              <input
                type="text"
                value={customer.customer_phone}
                onChange={(e) => setCustomer({ ...customer, customer_phone: e.target.value })}
                className="w-full min-h-[44px] px-3 border border-gray-400 rounded-md text-base font-num focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>Customer GSTIN</label>
              <input
                type="text"
                value={customer.customer_gst}
                onChange={(e) => setCustomer({ ...customer, customer_gst: e.target.value })}
                className="w-full min-h-[44px] px-3 border border-gray-400 rounded-md text-base font-num focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input
              id="interstate"
              type="checkbox"
              checked={isInterstate}
              onChange={(e) => setIsInterstate(e.target.checked)}
              data-testid="bill-interstate-toggle"
              className="w-5 h-5"
            />
            <label htmlFor="interstate" className="text-sm">Interstate sale (apply IGST instead of CGST+SGST)</label>
          </div>
        </section>

        {/* Items card */}
        <section className="bg-white border border-gray-300 rounded-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Items</h2>
            <button
              type="button"
              onClick={() => setLines((arr) => [...arr, { ...emptyLine }])}
              data-testid="add-line-button"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-400 rounded-md text-sm font-semibold hover:bg-gray-50"
            >
              <Plus className="w-4 h-4" /> Add Line
            </button>
          </div>

          <div className="space-y-4">
            {lines.map((l, i) => {
              const amount = (parseFloat(l.meters) || 0) * (parseFloat(l.rate) || 0);
              return (
                <div key={i} className="border border-gray-300 rounded-md p-4 bg-gray-50" data-testid={`bill-line-${i}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#3F3F46" }}>Item {i + 1}</span>
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLines((arr) => arr.filter((_, idx) => idx !== i))}
                        data-testid={`remove-line-${i}`}
                        className="p-1.5 hover:bg-red-100 rounded"
                        style={{ color: "#D32F2F" }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5">
                      <label className="block text-xs font-semibold mb-1" style={{ color: "#3F3F46" }}>Pick fabric from inventory</label>
                      <select
                        value={l.fabric_id}
                        onChange={(e) => onPickFabric(i, e.target.value)}
                        data-testid={`bill-line-${i}-fabric-select`}
                        className="w-full min-h-[40px] px-2 border border-gray-400 rounded-md text-sm bg-white focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none"
                      >
                        <option value="">— Free-text below —</option>
                        {fabrics.map((f) => (
                          <option key={f.id} value={f.id} disabled={f.meters <= 0}>
                            {f.fabric_name} · {f.shade_no} · {f.fabric_count} · {f.meters}m
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-xs font-semibold mb-1" style={{ color: "#3F3F46" }}>Fabric Name *</label>
                      <input
                        type="text"
                        required
                        value={l.fabric_name}
                        onChange={(e) => setLine(i, { fabric_name: e.target.value })}
                        data-testid={`bill-line-${i}-name`}
                        className="w-full min-h-[40px] px-2 border border-gray-400 rounded-md text-sm focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold mb-1" style={{ color: "#3F3F46" }}>HSN</label>
                      <input
                        type="text"
                        value={l.hsn_code}
                        onChange={(e) => setLine(i, { hsn_code: e.target.value })}
                        data-testid={`bill-line-${i}-hsn`}
                        className="w-full min-h-[40px] px-2 border border-gray-400 rounded-md text-sm font-num focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold mb-1" style={{ color: "#3F3F46" }}>Shade No.</label>
                      <input
                        type="text"
                        value={l.shade_no}
                        onChange={(e) => setLine(i, { shade_no: e.target.value })}
                        className="w-full min-h-[40px] px-2 border border-gray-400 rounded-md text-sm font-num focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold mb-1" style={{ color: "#3F3F46" }}>Count</label>
                      <input
                        type="text"
                        value={l.fabric_count}
                        onChange={(e) => setLine(i, { fabric_count: e.target.value })}
                        className="w-full min-h-[40px] px-2 border border-gray-400 rounded-md text-sm font-num focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1" style={{ color: "#3F3F46" }}>Pieces</label>
                      <input
                        type="number"
                        min="1"
                        value={l.pieces}
                        onChange={(e) => setLine(i, { pieces: e.target.value })}
                        className="w-full min-h-[40px] px-2 border border-gray-400 rounded-md text-sm font-num focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1" style={{ color: "#3F3F46" }}>Meters *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={l.meters}
                        onChange={(e) => setLine(i, { meters: e.target.value })}
                        data-testid={`bill-line-${i}-meters`}
                        className="w-full min-h-[40px] px-2 border border-gray-400 rounded-md text-sm font-num focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1" style={{ color: "#3F3F46" }}>Rate ₹/m *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={l.rate}
                        onChange={(e) => setLine(i, { rate: e.target.value })}
                        data-testid={`bill-line-${i}-rate`}
                        className="w-full min-h-[40px] px-2 border border-gray-400 rounded-md text-sm font-num focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-3 text-right text-sm">
                    <span className="font-semibold" style={{ color: "#3F3F46" }}>Line Total: </span>
                    <span className="font-num font-bold text-base">{formatINR(amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Totals + Notes */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-300 rounded-md p-6">
            <h2 className="text-base font-semibold mb-3">Notes (optional)</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-400 rounded-md text-sm focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none"
              placeholder="Delivery instructions, payment terms, etc."
            />
          </div>

          <div className="bg-white border border-gray-300 rounded-md p-6">
            <h2 className="text-base font-semibold mb-4">Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-num font-semibold">{formatINR(totals.subtotal)}</dd></div>
              {isInterstate ? (
                <div className="flex justify-between"><dt>IGST @ {gstRate}%</dt><dd className="font-num">{formatINR(totals.igst)}</dd></div>
              ) : (
                <>
                  <div className="flex justify-between"><dt>CGST @ {gstRate/2}%</dt><dd className="font-num">{formatINR(totals.cgst)}</dd></div>
                  <div className="flex justify-between"><dt>SGST @ {gstRate/2}%</dt><dd className="font-num">{formatINR(totals.sgst)}</dd></div>
                </>
              )}
              <div className="flex justify-between pt-3 border-t-2 border-gray-800 text-lg">
                <dt className="font-bold">Grand Total</dt>
                <dd className="font-num font-bold" data-testid="bill-grand-total">{formatINR(totals.total)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Link to="/bills" className="px-6 min-h-[48px] inline-flex items-center border border-gray-400 rounded-md font-semibold">Cancel</Link>
          <button
            type="submit"
            disabled={submitting}
            data-testid="save-bill-button"
            className="px-8 min-h-[48px] rounded-md text-white font-semibold disabled:opacity-60"
            style={{ background: "#003B73" }}
          >
            {submitting ? "Saving…" : "Save Bill"}
          </button>
        </div>
      </form>
    </div>
  );
}
