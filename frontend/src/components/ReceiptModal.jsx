import Card from "./Card.jsx"
import Button from "./ui/Button.jsx"

function formatMoney(n) {
  return `₹${Number(n || 0).toFixed(2)}`
}

export default function ReceiptModal({ open, onClose, data }) {
  if (!open) return null

  const bill = data?.bill
  const items = data?.items_used || []

  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <Card
          title="Receipt"
          right={
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4 print:text-black">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs text-slate-500">Bill ID</div>
                <div className="font-semibold text-slate-900">#{bill?.id}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Date/Time</div>
                <div className="font-semibold text-slate-900">
                  {bill?.created_at ? new Date(bill.created_at).toLocaleString() : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Devotee</div>
                <div className="font-semibold text-slate-900">{bill?.devotee_name}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Pooja</div>
                <div className="font-semibold text-slate-900">{bill?.pooja_name}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">
                      Item
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-700">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-700">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.length ? (
                    items.map((it) => (
                      <tr key={it.item_id} className="border-t border-slate-200/70">
                        <td className="px-3 py-2">
                          <div className="font-medium text-slate-900">{it.item_name}</div>
                          <div className="text-xs text-slate-500">{it.unit}</div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {Number(it.quantity_used || 0).toFixed(3)}
                        </td>
                        <td className="px-3 py-2 text-right">{formatMoney(it.cost)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-slate-200/70">
                      <td className="px-3 py-3 text-slate-600" colSpan={3}>
                        No inventory items mapped to this pooja.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200/70">
                  <tr>
                    <td className="px-3 py-2 font-semibold text-slate-700">Total</td>
                    <td className="px-3 py-2"></td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900">
                      {formatMoney(bill?.amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {bill?.notes ? (
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm">
                <div className="text-xs font-medium text-slate-500">Notes</div>
                <div className="text-slate-800">{bill.notes}</div>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  )
}

