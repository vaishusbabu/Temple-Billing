export function Field({ label, hint, error, children }) {
  return (
    <div>
      {label ? (
        <div className="flex items-end justify-between gap-2">
          <label className="text-sm font-medium text-slate-700">{label}</label>
          {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
        </div>
      ) : null}
      <div className="mt-1">{children}</div>
      {error ? (
        <div className="mt-1 text-xs font-medium text-red-600">{error}</div>
      ) : null}
    </div>
  )
}

const controlBase =
  "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none shadow-sm placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300"

export function Input({ className = "", ...props }) {
  return <input className={[controlBase, className].join(" ")} {...props} />
}

export function Textarea({ className = "", ...props }) {
  return <textarea className={[controlBase, className].join(" ")} {...props} />
}

export function Select({ className = "", ...props }) {
  return <select className={[controlBase, className].join(" ")} {...props} />
}

