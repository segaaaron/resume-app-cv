"use client"

import { useState, useCallback } from "react"

interface AIUsageRow {
  userId: string
  email: string
  plan: string
  calls: number
  promptTokens: number
  completionTokens: number
  costUsd: number
  lastUsedAt: string | null
}

interface AIUsageResponse {
  totals: { calls: number; costUsd: number; activeUsers: number }
  rows: AIUsageRow[]
  total: number
}

const PAGE_SIZE = 50

function formatCost(usd: number): string {
  return "$" + usd.toFixed(4)
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString()
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return String(n)
}

export default function AIUsagePanel() {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [data, setData] = useState<AIUsageResponse | null>(null)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (newOffset = 0) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(newOffset) })
      if (from) params.set("from", from)
      if (to) params.set("to", to)
      const res = await fetch(`/api/admin/ai-usage?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: AIUsageResponse = await res.json()
      setData(json)
      setOffset(newOffset)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error fetching data")
    } finally {
      setLoading(false)
    }
  }, [from, to])

  const handleApply = () => fetchData(0)
  const hasNext = data ? offset + PAGE_SIZE < data.total : false
  const hasPrev = offset > 0

  return (
    <div className="dash-card-in" style={{ animationDelay: "150ms" }}>
      {/* Section header */}
      <div className="mb-5">
        <div className="flex items-center gap-[7px] text-[10px] font-bold tracking-[0.1em] uppercase text-[#00D4FF] mb-[5px]">
          <span className="inline-block w-[14px] h-[1.5px] bg-[#00D4FF] opacity-50" />
          AI Cost Tracking
        </div>
        <h2
          className="text-[20px] font-bold text-[#1a2e4a] tracking-[-0.025em] leading-[1.2] m-0"
          style={{ fontFamily: "var(--dash-serif,'Playfair Display',Georgia,serif)" }}
        >
          OpenAI Usage
        </h2>
        <p className="text-[12.5px] text-[#6B7A8C] mt-[4px]">
          Real token consumption and cost per user. Read-only.
        </p>
      </div>

      {/* Date filters */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6B7A8C]">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 px-3 rounded-[7px] border border-[#D9E1ED] bg-white text-[13px] text-[#1a2e4a] focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[rgba(0,212,255,0.3)] transition-all"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6B7A8C]">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 px-3 rounded-[7px] border border-[#D9E1ED] bg-white text-[13px] text-[#1a2e4a] focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[rgba(0,212,255,0.3)] transition-all"
          />
        </div>
        <button
          onClick={handleApply}
          disabled={loading}
          className="h-8 px-4 rounded-[7px] bg-gradient-to-r from-[#00D4FF] to-[#00A8CC] text-white text-[12px] font-bold tracking-[0.05em] shadow-[0_2px_10px_rgba(0,212,255,0.35)] hover:shadow-[0_4px_16px_rgba(0,212,255,0.45)] hover:-translate-y-px active:translate-y-0 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Loading..." : "Apply"}
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-[8px] bg-[rgba(255,80,80,0.08)] border border-[rgba(255,80,80,0.2)] text-[12.5px] text-red-500">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="bg-white border border-[#D9E1ED] rounded-[10px] p-4 relative overflow-hidden">
              <div className="text-[10px] font-bold tracking-[0.08em] uppercase text-[#6B7A8C] mb-1.5">
                Total Calls
              </div>
              <div
                className="text-[22px] font-bold text-[#1a2e4a] tracking-[-0.02em] leading-none"
                style={{ fontFamily: "var(--mono,monospace)" }}
              >
                {data.totals.calls.toLocaleString()}
              </div>
              <span className="absolute bottom-[8px] right-3 text-[26px] text-[#00D4FF] opacity-[0.05] leading-none pointer-events-none select-none">
                #
              </span>
            </div>

            <div className="bg-gradient-to-br from-[rgba(0,212,255,0.05)] to-[rgba(0,212,255,0.02)] border border-[rgba(0,212,255,0.15)] rounded-[10px] p-4 relative overflow-hidden">
              <div className="text-[10px] font-bold tracking-[0.08em] uppercase text-[#00D4FF] mb-1.5">
                Total Cost
              </div>
              <div
                className="text-[22px] font-bold text-[#00D4FF] tracking-[-0.02em] leading-none"
                style={{ fontFamily: "var(--mono,monospace)" }}
              >
                {formatCost(data.totals.costUsd)}
              </div>
              <span className="absolute bottom-[8px] right-3 text-[26px] text-[#00D4FF] opacity-[0.05] leading-none pointer-events-none select-none">
                $
              </span>
            </div>

            <div className="bg-white border border-[#D9E1ED] rounded-[10px] p-4 relative overflow-hidden">
              <div className="text-[10px] font-bold tracking-[0.08em] uppercase text-[#6B7A8C] mb-1.5">
                Active Users
              </div>
              <div
                className="text-[22px] font-bold text-[#1a2e4a] tracking-[-0.02em] leading-none"
                style={{ fontFamily: "var(--mono,monospace)" }}
              >
                {data.totals.activeUsers}
              </div>
              <span className="absolute bottom-[8px] right-3 text-[26px] text-[#00D4FF] opacity-[0.05] leading-none pointer-events-none select-none">
                ◈
              </span>
            </div>
          </div>

          {/* Table */}
          {data.rows.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[#6B7A8C]">
              No AI usage data found for the selected period.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-[10px] border border-[#D9E1ED]">
                <table className="w-full min-w-[720px] border-collapse">
                  <thead>
                    <tr className="bg-[#f5f8fc]">
                      {["Email", "Plan", "Calls", "Input Tokens", "Output Tokens", "Cost USD", "Last Call"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-[#6B7A8C] border-b border-[#D9E1ED] whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, i) => (
                      <tr
                        key={row.userId}
                        className={`transition-colors duration-100 hover:bg-[rgba(0,212,255,0.03)] ${
                          i % 2 === 0 ? "bg-white" : "bg-[#fafbfd]"
                        }`}
                      >
                        <td className="px-4 py-3 text-[12.5px] text-[#1a2e4a] font-medium border-b border-[#F0F3F8]">
                          {row.email}
                        </td>
                        <td className="px-4 py-3 border-b border-[#F0F3F8]">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-[0.06em] uppercase ${
                              row.plan === "PRO"
                                ? "bg-[rgba(0,212,255,0.12)] text-[#00A8CC] border border-[rgba(0,212,255,0.25)]"
                                : row.plan === "LIMITED"
                                ? "bg-[rgba(26,46,74,0.08)] text-[#4B5A6E] border border-[rgba(26,46,74,0.12)]"
                                : "bg-[#F0F3F8] text-[#9BABB8] border border-[#D9E1ED]"
                            }`}
                          >
                            {row.plan || "—"}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 text-[12.5px] text-[#1a2e4a] border-b border-[#F0F3F8] tabular-nums"
                          style={{ fontFamily: "var(--mono,monospace)" }}
                        >
                          {row.calls.toLocaleString()}
                        </td>
                        <td
                          className="px-4 py-3 text-[12px] text-[#6B7A8C] border-b border-[#F0F3F8] tabular-nums"
                          style={{ fontFamily: "var(--mono,monospace)" }}
                        >
                          {formatTokens(row.promptTokens)}
                        </td>
                        <td
                          className="px-4 py-3 text-[12px] text-[#6B7A8C] border-b border-[#F0F3F8] tabular-nums"
                          style={{ fontFamily: "var(--mono,monospace)" }}
                        >
                          {formatTokens(row.completionTokens)}
                        </td>
                        <td
                          className="px-4 py-3 text-[12.5px] font-semibold text-[#00A8CC] border-b border-[#F0F3F8] tabular-nums"
                          style={{ fontFamily: "var(--mono,monospace)" }}
                        >
                          {formatCost(row.costUsd)}
                        </td>
                        <td className="px-4 py-3 text-[11.5px] text-[#6B7A8C] border-b border-[#F0F3F8] whitespace-nowrap">
                          {formatDate(row.lastUsedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {(hasPrev || hasNext) && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[11.5px] text-[#6B7A8C]">
                    Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, data.total)} of {data.total} users
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchData(offset - PAGE_SIZE)}
                      disabled={!hasPrev || loading}
                      className="h-7 px-3 rounded-[6px] border border-[#D9E1ED] bg-white text-[11.5px] text-[#1a2e4a] font-medium hover:border-[#00D4FF] hover:text-[#00A8CC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => fetchData(offset + PAGE_SIZE)}
                      disabled={!hasNext || loading}
                      className="h-7 px-3 rounded-[6px] border border-[#D9E1ED] bg-white text-[11.5px] text-[#1a2e4a] font-medium hover:border-[#00D4FF] hover:text-[#00A8CC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {!data && !loading && (
        <div className="py-8 text-center text-[13px] text-[#6B7A8C]">
          Set a date range (optional) and click Apply to load usage data.
        </div>
      )}
    </div>
  )
}
