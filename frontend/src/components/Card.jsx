export default function Card({ title, children, right }) {
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
      {title ? (
        <header className="px-5 py-4 border-b border-slate-200/70 flex items-center gap-3">
          <h2 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h2>
          <div className="ml-auto">{right}</div>
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  )
}

