import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatINR, formatDate, inrInWords } from "../lib/format";
import { Printer, ArrowLeft } from "lucide-react";

export default function ViewBill() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/bills/${id}`).then((r) => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (!data) return <div className="p-8 text-red-700">Bill not found.</div>;

  const { bill, firm } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6 no-print">
        <Link to="/bills" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "#003B73" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Bills
        </Link>
        <button
          onClick={() => window.print()}
          data-testid="print-bill-button"
          className="inline-flex items-center gap-2 px-5 min-h-[44px] rounded-md text-white font-semibold"
          style={{ background: "#003B73" }}
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      <div className="bg-white border border-gray-300 rounded-md print-area" data-testid="bill-printable">
        {/* Header */}
        <div className="px-8 py-6 border-b-2 border-black text-center">
          <h1 className="text-2xl font-bold uppercase tracking-tight">{firm?.name}</h1>
          {firm?.address && <div className="text-sm mt-1">{firm.address}</div>}
          <div className="text-sm font-num mt-1">
            {firm?.gst_number && <>GSTIN: <strong>{firm.gst_number}</strong></>}
            {firm?.state && <span className="ml-3">State: {firm.state} {firm.state_code && `(${firm.state_code})`}</span>}
            {firm?.phone && <span className="ml-3">Phone: {firm.phone}</span>}
          </div>
          <div className="text-base font-bold mt-3 uppercase tracking-wider">Tax Invoice</div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 border-b border-black">
          <div className="px-6 py-4 border-r border-black">
            <div className="text-xs uppercase tracking-wider font-semibold mb-2">Bill To</div>
            <div className="text-base font-bold">{bill.customer_name}</div>
            {bill.customer_phone && <div className="text-sm font-num">Phone: {bill.customer_phone}</div>}
            {bill.customer_gst && <div className="text-sm font-num">GSTIN: {bill.customer_gst}</div>}
            {bill.customer_state && (
              <div className="text-sm">State: {bill.customer_state} {bill.customer_state_code && `(${bill.customer_state_code})`}</div>
            )}
          </div>
          <div className="px-6 py-4">
            <div className="text-xs uppercase tracking-wider font-semibold mb-2">Invoice Details</div>
            <div className="text-sm"><strong>Bill No:</strong> <span className="font-num">{bill.bill_no}</span></div>
            <div className="text-sm"><strong>Date:</strong> <span className="font-num">{formatDate(bill.created_at)}</span></div>
            <div className="text-sm"><strong>GST Type:</strong> {bill.is_interstate ? "Interstate (IGST)" : "Intrastate (CGST+SGST)"}</div>
          </div>
        </div>

        {/* Items */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black bg-gray-100">
              <th className="px-3 py-2 text-left text-xs uppercase">#</th>
              <th className="px-3 py-2 text-left text-xs uppercase">Particulars</th>
              <th className="px-3 py-2 text-left text-xs uppercase">HSN</th>
              <th className="px-3 py-2 text-right text-xs uppercase">Pcs</th>
              <th className="px-3 py-2 text-right text-xs uppercase">Meters</th>
              <th className="px-3 py-2 text-right text-xs uppercase">Rate</th>
              <th className="px-3 py-2 text-right text-xs uppercase">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((it, i) => (
              <tr key={i} className="border-b border-gray-400">
                <td className="px-3 py-2 align-top font-num">{i + 1}</td>
                <td className="px-3 py-2 align-top">
                  <div className="font-semibold">{it.fabric_name}</div>
                  <div className="text-xs font-num">
                    {it.shade_no && <>Shade: {it.shade_no}</>}
                    {it.fabric_count && <span className="ml-2">Count: {it.fabric_count}</span>}
                  </div>
                </td>
                <td className="px-3 py-2 align-top font-num">{it.hsn_code || "—"}</td>
                <td className="px-3 py-2 align-top text-right font-num">{it.pieces}</td>
                <td className="px-3 py-2 align-top text-right font-num">{it.meters.toFixed(2)}</td>
                <td className="px-3 py-2 align-top text-right font-num">{formatINR(it.rate)}</td>
                <td className="px-3 py-2 align-top text-right font-num font-semibold">{formatINR(it.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="grid grid-cols-2 border-t-2 border-black">
          <div className="px-6 py-4 border-r border-black">
            <div className="text-xs uppercase tracking-wider font-semibold mb-1">Amount in Words</div>
            <div className="text-sm italic">{inrInWords(bill.total)}</div>
            {bill.notes && (
              <div className="mt-4">
                <div className="text-xs uppercase tracking-wider font-semibold mb-1">Notes</div>
                <div className="text-sm whitespace-pre-wrap">{bill.notes}</div>
              </div>
            )}
          </div>
          <div className="px-6 py-4">
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="py-1">Subtotal</td><td className="py-1 text-right font-num font-semibold">{formatINR(bill.subtotal)}</td></tr>
                {bill.is_interstate ? (
                  <tr><td className="py-1">IGST @ {bill.gst_rate}%</td><td className="py-1 text-right font-num">{formatINR(bill.igst)}</td></tr>
                ) : (
                  <>
                    <tr><td className="py-1">CGST @ {bill.gst_rate/2}%</td><td className="py-1 text-right font-num">{formatINR(bill.cgst)}</td></tr>
                    <tr><td className="py-1">SGST @ {bill.gst_rate/2}%</td><td className="py-1 text-right font-num">{formatINR(bill.sgst)}</td></tr>
                  </>
                )}
                <tr className="border-t-2 border-black">
                  <td className="pt-2 font-bold text-base">GRAND TOTAL</td>
                  <td className="pt-2 text-right font-num font-bold text-base">{formatINR(bill.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-6 grid grid-cols-2 text-xs">
          <div>
            <div className="font-semibold mb-1">Declaration:</div>
            <div>Certified that the particulars given above are true and correct.</div>
          </div>
          <div className="text-right">
            <div className="mt-8 border-t border-black pt-1">For {firm?.name}</div>
            <div className="text-xs mt-1">Authorised Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
}
