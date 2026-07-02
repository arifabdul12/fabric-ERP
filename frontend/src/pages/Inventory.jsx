import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "../lib/api";
import { formatMeters } from "../lib/format";
import { Plus, Pencil, Trash2, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const empty = {
  mill_name: "",
  fabric_name: "",
  shade_no: "",
  fabric_count: "",
  meters: "",
  low_stock_threshold: "50",
};

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/fabrics");
      setItems(data);
    } catch (e) {
      toast.error("Failed to load inventory");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      mill_name: item.mill_name,
      fabric_name: item.fabric_name,
      shade_no: item.shade_no,
      fabric_count: item.fabric_count,
      meters: String(item.meters),
      low_stock_threshold: String(item.low_stock_threshold || 50),
    });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      mill_name: form.mill_name.trim(),
      fabric_name: form.fabric_name.trim(),
      shade_no: form.shade_no.trim(),
      fabric_count: form.fabric_count.trim(),
      meters: parseFloat(form.meters) || 0,
      low_stock_threshold: parseFloat(form.low_stock_threshold) || 50,
    };
    try {
      if (editing) {
        await api.put(`/fabrics/${editing.id}`, payload);
        toast.success("Fabric updated");
      } else {
        await api.post("/fabrics", payload);
        toast.success("Fabric added");
      }
      setShowForm(false);
      load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Save failed");
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete ${item.fabric_name} (${item.shade_no})?`)) return;
    try {
      await api.delete(`/fabrics/${item.id}`);
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const filtered = items.filter((i) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [i.mill_name, i.fabric_name, i.shade_no, i.fabric_count]
      .some((v) => v && v.toLowerCase().includes(q));
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#3F3F46" }}>Module</div>
          <h1 className="text-3xl sm:text-4xl font-bold">Inventory</h1>
          <p className="text-sm mt-1" style={{ color: "#3F3F46" }}>Track fabric stock in meters · Low stock auto-flagged</p>
        </div>
        <button
          onClick={openCreate}
          data-testid="add-fabric-button"
          className="inline-flex items-center gap-2 px-5 min-h-[48px] rounded-md text-white font-semibold"
          style={{ background: "#003B73" }}
        >
          <Plus className="w-5 h-5" /> Add Fabric
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by mill, fabric name, shade, count…"
          data-testid="inventory-search"
          className="w-full sm:max-w-md min-h-[44px] px-4 border border-gray-400 rounded-md text-sm focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none"
        />
      </div>

      <div className="bg-white border border-gray-300 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="inventory-table">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr className="text-left text-xs uppercase tracking-wider" style={{ color: "#3F3F46" }}>
                <th className="px-4 py-3">Mill</th>
                <th className="px-4 py-3">Fabric Name</th>
                <th className="px-4 py-3">Shade</th>
                <th className="px-4 py-3">Count</th>
                <th className="px-4 py-3 text-right">In Stock</th>
                <th className="px-4 py-3 text-right">Threshold</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="px-4 py-8 text-center" style={{ color: "#71717A" }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-12 text-center" style={{ color: "#71717A" }}>
                  {items.length === 0 ? "No fabrics yet. Click Add Fabric to start." : "No matches."}
                </td></tr>
              ) : filtered.map((it) => {
                const low = it.meters <= (it.low_stock_threshold || 50);
                return (
                  <tr key={it.id} className="border-b border-gray-200 even:bg-gray-50" data-testid={`fabric-row-${it.id}`}>
                    <td className="px-4 py-3">{it.mill_name}</td>
                    <td className="px-4 py-3 font-semibold">{it.fabric_name}</td>
                    <td className="px-4 py-3 font-num">{it.shade_no}</td>
                    <td className="px-4 py-3 font-num">{it.fabric_count}</td>
                    <td className="px-4 py-3 text-right font-num font-semibold" style={{ color: low ? "#D32F2F" : "#0A0A0A" }}>
                      <div className="flex items-center justify-end gap-1">
                        {low && <AlertTriangle className="w-3 h-3" />}
                        {formatMeters(it.meters)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-num text-xs" style={{ color: "#71717A" }}>{it.low_stock_threshold} m</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(it)} data-testid={`edit-fabric-${it.id}`} className="p-2 hover:bg-gray-200 rounded">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => remove(it)} data-testid={`delete-fabric-${it.id}`} className="p-2 hover:bg-red-50 rounded" style={{ color: "#D32F2F" }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-md w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-300 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editing ? "Edit Fabric" : "Add Fabric"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4" data-testid="fabric-form">
              {[
                { name: "mill_name", label: "Mill Name", placeholder: "e.g. Mafatlal, Ruby Mill" },
                { name: "fabric_name", label: "Fabric Name", placeholder: "e.g. Suiting Wool Blend" },
                { name: "shade_no", label: "Shade Number", placeholder: "e.g. 1234" },
                { name: "fabric_count", label: "Fabric Count", placeholder: "e.g. 80x80" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>{f.label}</label>
                  <input
                    type="text"
                    required
                    value={form[f.name]}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    placeholder={f.placeholder}
                    data-testid={`fabric-${f.name}-input`}
                    className="w-full min-h-[44px] px-3 border border-gray-400 rounded-md text-base focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>Meters in Stock</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.meters}
                    onChange={(e) => setForm({ ...form, meters: e.target.value })}
                    data-testid="fabric-meters-input"
                    className="w-full min-h-[44px] px-3 border border-gray-400 rounded-md text-base font-num focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>Low-Stock Alert (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.low_stock_threshold}
                    onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                    data-testid="fabric-threshold-input"
                    className="w-full min-h-[44px] px-3 border border-gray-400 rounded-md text-base font-num focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 min-h-[44px] border border-gray-400 rounded-md font-semibold">Cancel</button>
                <button type="submit" data-testid="fabric-submit" className="px-5 min-h-[44px] rounded-md text-white font-semibold" style={{ background: "#003B73" }}>
                  {editing ? "Save Changes" : "Add Fabric"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
