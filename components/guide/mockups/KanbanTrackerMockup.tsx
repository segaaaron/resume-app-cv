interface Props { locale?: string }

export default function KanbanTrackerMockup({ locale = "es" }: Props) {
  const isEs = locale === "es"

  const boardTitle   = isEs ? "ReadyCVV · Seguimiento" : "ReadyCVV · Tracker"
  const appliedLabel = isEs ? "Enviadas"   : "Applied"
  const interviewLbl = isEs ? "Entrevista" : "Interview"
  const offerLabel   = isEs ? "Oferta"     : "Offer"
  const reminderText = isEs ? "Dar seguimiento a Stripe" : "Follow up with Stripe"
  const reminderStage = isEs ? "Tras la entrevista" : "After your interview"
  const reminderWhen = isEs ? "en 2 días" : "in 2 days"

  const roleFront = isEs ? "Frontend Sr." : "Sr. Frontend"
  const roleFull  = isEs ? "Full-Stack"   : "Full-Stack"
  const roleUi     = isEs ? "UI Engineer"  : "UI Engineer"

  const columns = [
    {
      label: appliedLabel, count: 3, accent: "#94a3b8", tint: "#f8fafc",
      cards: [
        { company: "Vercel", role: roleFront },
        { company: "Linear", role: roleUi },
      ],
    },
    {
      label: interviewLbl, count: 2, accent: "#00D4FF", tint: "rgba(0,212,255,0.06)",
      cards: [
        { company: "Stripe", role: roleFull },
      ],
    },
    {
      label: offerLabel, count: 1, accent: "#22c55e", tint: "#f0fdf4",
      cards: [
        { company: "Datadog", role: roleFront },
      ],
    },
  ]

  return (
    <div className="w-full max-w-[360px] mx-auto flex flex-col gap-2">
      {/* Board card */}
      <div className="bg-white rounded-[18px] border-[1.5px] border-[rgba(0,212,255,0.2)] shadow-[0_6px_28px_rgba(0,212,255,0.08)] p-[16px]">
        {/* Chrome */}
        <div className="flex items-center gap-[5px] mb-[14px]">
          <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
          <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
          <div className="w-2 h-2 rounded-full bg-[#28c840]" />
          <span className="text-[10px] text-slate-400 ml-2 font-mono">{boardTitle}</span>
        </div>

        {/* Columns */}
        <div className="flex gap-[7px]">
          {columns.map(col => (
            <div key={col.label} className="flex-1 flex flex-col gap-[6px]">
              {/* Column header */}
              <div className="flex items-center gap-[4px] mb-[1px]">
                <span className="w-[6px] h-[6px] rounded-full" style={{ background: col.accent }} />
                <span className="text-[8.5px] font-extrabold text-dash-navy uppercase tracking-[0.06em] leading-none">
                  {col.label}
                </span>
                <span className="text-[8px] font-bold text-slate-400 leading-none">{col.count}</span>
              </div>

              {/* Cards */}
              {col.cards.map(card => (
                <div
                  key={card.company}
                  className="rounded-[9px] border px-[7px] py-[6px]"
                  style={{ background: col.tint, borderColor: "rgba(15,23,42,0.06)" }}
                >
                  <p className="text-[10px] font-extrabold text-dash-navy leading-none mb-[3px]">{card.company}</p>
                  <p className="text-[8px] text-slate-500 leading-none">{card.role}</p>
                  <div className="mt-[5px] h-[2.5px] rounded-full" style={{ background: col.accent, opacity: 0.5, width: "60%" }} />
                </div>
              ))}

              {/* Ghost slot for rhythm */}
              <div className="rounded-[9px] border border-dashed border-slate-200 h-[7px]" />
            </div>
          ))}
        </div>
      </div>

      {/* Follow-up reminder chip */}
      <div className="bg-white rounded-[14px] border-[1.5px] border-dash-border-s shadow-[0_4px_20px_rgba(26,46,74,0.07)] px-[12px] py-[9px] flex items-center gap-[8px]">
        <span className="relative flex items-center justify-center w-[24px] h-[24px] rounded-full bg-[rgba(0,212,255,0.1)] shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-[3px] right-[3px] w-[6px] h-[6px] rounded-full bg-[#22c55e] border border-white" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-dash-navy leading-none mb-[3px]">{reminderText}</p>
          <p className="text-[8.5px] text-slate-400 leading-none">{reminderStage}</p>
        </div>
        <span className="text-[8.5px] font-extrabold text-dash-cyan bg-[rgba(0,212,255,0.08)] rounded-full px-[8px] py-[3px] shrink-0">
          {reminderWhen}
        </span>
      </div>
    </div>
  )
}
