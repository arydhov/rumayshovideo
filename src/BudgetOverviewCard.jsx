import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js/auto'

function fmtRp(n) {
  return 'Rp ' + Math.round(Math.abs(n)).toLocaleString('id-ID')
}

export function BudgetOverviewCard({
  gaji,
  videoDone,
  videoRefund,
  hutang = 0,
  joinedTop = false,
  mainWorkItems = [],
  refundCarryOvers = [],
  isAdmin = false,
  isClosed = false,
  onCycleStatus,
  onUpdateTitle,
  onUpdatePrice,
  onDeleteItem,
}) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  const g = Number(gaji) || 0
  const vDone = Number(videoDone) || 0
  const vRefund = Number(videoRefund) || 0
  const h = Number(hutang) || 0
  const vPlanned = mainWorkItems.filter(i => i.status === 'planned').reduce((s, i) => s + (i.price || 0), 0)
  const allPlannedCheck = mainWorkItems.length > 0 && mainWorkItems.every(i => i.status === 'planned')
  const anggaranAwal = allPlannedCheck ? g + vPlanned : g + vDone + vRefund
  const total = anggaranAwal
  const sisaDicairkan = anggaranAwal - h

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    chartRef.current?.destroy()

    const empty = anggaranAwal === 0
    const data = empty ? [1] : allPlannedCheck ? [g, vPlanned] : [g, vDone, vRefund]
    const colors = empty ? ['#334155'] : allPlannedCheck ? ['#7c3aed', '#6366f1'] : ['#7c3aed', '#22c55e', '#ca8a04']

    chartRef.current = new Chart(canvas, {
      type: 'doughnut',
      data: {
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderWidth: 0,
            borderRadius: 6,
            spacing: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        rotation: -90,
        circumference: 180,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: !empty,
            callbacks: {
              label: (ctx) => {
                const labels = ['Gaji', 'Finished Project', 'Refund']
                const val = typeof ctx.raw === 'number' ? ctx.raw : ctx.parsed
                return `${labels[ctx.dataIndex]}: ${fmtRp(val)}`
              },
            },
          },
        },
      },
      plugins: [
        {
          id: 'patternFill',
          afterDatasetDraw(chart, args) {
            const { ctx } = chart
            if (args.index !== 0) return
            const meta = chart.getDatasetMeta(0)
            const element = meta.data[2]
            if (!element || !vRefund) return

            ctx.save()
            element.draw(ctx)
            ctx.clip()

            const bounds = element.getProps(['x', 'y', 'outerRadius', 'innerRadius'], true)
            const radius = bounds.outerRadius
            const step = 8
            ctx.strokeStyle = 'rgba(202, 138, 4, 0.55)'
            ctx.lineWidth = 1.5

            for (let i = -radius; i <= radius * 2; i += step) {
              ctx.beginPath()
              ctx.moveTo(i, -radius)
              ctx.lineTo(i + radius * 2, radius)
              ctx.stroke()
            }
            ctx.restore()
          },
        },
      ],
    })

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [g, vDone, vRefund, total])

  const legendItems = allPlannedCheck
    ? [
        { label: 'Gaji', color: '#7c3aed', val: g, hatched: false },
        {
          label: `${mainWorkItems.length} video diajukan senilai`,
          color: '#6366f1',
          val: vPlanned,
          hatched: false,
        },
      ]
    : [
        { label: 'Gaji', color: '#7c3aed', val: g, hatched: false },
        { label: 'Finished', color: '#22c55e', val: vDone, hatched: false },
        { label: 'Fail/Refund', color: '#ca8a04', val: vRefund, hatched: true },
      ]

  return (
    <div
      className={`bg-slate-900 border border-slate-700/60 overflow-hidden ${
        joinedTop ? 'rounded-b-2xl rounded-t-none border-t-0' : 'rounded-2xl'
      }`}
    >
      {/* ── Chart ── */}
      <div className="flex justify-center pt-6 px-6">
        <div className="relative w-full max-w-[520px]" style={{ height: 260 }}>
          <canvas ref={canvasRef} className="block w-full h-full" />
          {/* Center label */}
          <div
            className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none"
            style={{ bottom: 12 }}
          >
            <p className="text-[11px] font-semibold text-slate-400 leading-tight">Anggaran awal</p>
            <p className="mt-1 text-[clamp(1.5rem,5vw,2.25rem)] font-black tracking-tight text-sky-300 tabular-nums whitespace-nowrap leading-none">
              {fmtRp(anggaranAwal)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Legend pills + Items list (satu group) ── */}
      <div className="mx-6 mb-4 rounded-2xl border border-slate-700/40 overflow-hidden">
        {/* Legend pills row */}
        <div className="p-3 flex items-center justify-between gap-2 bg-slate-800/60">
          {legendItems.map((row) => (
            <div
              key={row.label}
              className={`flex items-center gap-4 px-5 py-5 rounded-xl border border-slate-700/50 bg-slate-800/50 ${allPlannedCheck && row.label !== 'Gaji' ? 'flex-1' : ''}`}
            >
              <div
                className="w-[3px] h-10 rounded-full shrink-0"
                style={
                  row.hatched
                    ? {
                        background: row.color,
                        backgroundImage:
                          'repeating-linear-gradient(135deg, rgba(202,138,4,0.9) 0 2px, rgba(202,138,4,0.2) 2px 5px)',
                      }
                    : { background: row.color }
                }
              />
              <p className="text-lg font-semibold text-slate-300 truncate">{row.label}</p>
              <p className="text-lg font-black text-slate-100 tabular-nums whitespace-nowrap">
                {fmtRp(row.val)}
              </p>
            </div>
          ))}
        </div>
        {/* Items list langsung di bawah */}
        {mainWorkItems.length > 0 && (() => {
          const normalItems = mainWorkItems.filter(i => i.status !== 'refund')
          const refundItems = mainWorkItems.filter(i => i.status === 'refund')
          const totalRefundVal = refundItems.reduce((s, i) => s + i.price, 0)
          const normalStartIdx = 0
          const refundStartIdx = normalItems.length
          return (
            <div className="bg-white pt-4 pb-4">
              {/* Item normal (selesai / planned) */}
              {normalItems.map((item, idx) => {
                const isDone = item.status === 'selesai'
                const canEdit = isAdmin && !isClosed
                return (
                  <div key={item.id} className={`flex items-center gap-2 px-4 py-2 mx-16 ${idx > 0 ? 'border-t border-slate-100' : ''}`}>
                    <div className="w-5 h-5 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-[9px] font-black text-slate-500 shrink-0">
                      {normalStartIdx + idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      {canEdit ? (
                        <input
                          type="text"
                          defaultValue={item.title}
                          onBlur={(e) => onUpdateTitle?.(item.id, e.target.value)}
                          className="w-full bg-transparent outline-none text-xs font-medium text-slate-800 focus:text-indigo-700"
                        />
                      ) : (
                        <p className="text-xs font-medium leading-snug truncate text-slate-800">{item.title}</p>
                      )}
                    </div>
                    {canEdit ? (
                      <input
                        type="number"
                        defaultValue={item.price}
                        onBlur={(e) => onUpdatePrice?.(item.id, e.target.value)}
                        className={`shrink-0 w-28 text-right bg-transparent outline-none text-xs font-black tabular-nums ${isDone ? 'text-emerald-600' : 'text-slate-500'}`}
                      />
                    ) : (
                      <p className={`shrink-0 text-xs font-black tabular-nums ${isDone ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {fmtRp(item.price)}
                      </p>
                    )}
                    <button
                      onClick={() => canEdit && onCycleStatus?.(item.id)}
                      disabled={!canEdit}
                      className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      } ${canEdit ? 'cursor-pointer hover:opacity-80 active:scale-95' : 'cursor-default'}`}
                    >
                      {isDone ? 'Selesai' : 'Planned'}
                    </button>
                    {canEdit && (
                      <button onClick={() => onDeleteItem?.(item.id)} className="shrink-0 text-slate-300 hover:text-red-500 transition-colors">
                        <i className="fas fa-times text-[10px]" />
                      </button>
                    )}
                  </div>
                )
              })}

              {/* Semua item refund dijadikan 1 bubble */}
              {refundItems.length > 0 && (
                <div className="mx-16 mt-2 mb-4 rounded-xl border border-amber-300 bg-amber-50 overflow-hidden">
                  {/* List item refund di dalam bubble */}
                  {refundItems.map((item, idx) => (
                    <div key={item.id} className={`flex items-center gap-2 px-3 py-1.5 ${idx > 0 ? 'border-t border-amber-200' : ''}`}>
                      <div className="w-5 h-5 rounded-full border border-amber-300 bg-amber-100 flex items-center justify-center text-[9px] font-black text-amber-700 shrink-0">
                        {refundStartIdx + idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium leading-snug truncate line-through text-amber-500">{item.title}</p>
                      </div>
                      <p className="shrink-0 text-xs font-black tabular-nums text-amber-700">
                        -{fmtRp(item.price)}
                      </p>
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-300">
                        Refund
                      </span>
                    </div>
                  ))}
                  {/* Summary footer */}
                  <div className="px-4 py-3 border-t border-amber-300 bg-amber-100/60 flex items-center justify-center gap-2">
                    <i className="fas fa-exclamation-triangle text-xs text-amber-500" />
                    <span className="text-xs text-amber-800 leading-tight text-center">
                      <span className="font-black">{refundItems.length} item gagal</span>
                      {' '}senilai{' '}
                      <span className="font-black">{fmtRp(totalRefundVal)}</span>
                      {' '}akan dianggap hutang di periode selanjutnya
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* ── Hutang header + Items list (satu group) ── */}
      {(h > 0 || refundCarryOvers.length > 0) && (
        <div className="mx-6 mb-4 rounded-2xl border border-slate-700/40 overflow-hidden">
          {/* Header */}
          <div className="p-3 bg-slate-800/60">
            <div className="inline-flex items-center gap-4 px-5 py-5 rounded-xl border border-slate-700/50 bg-slate-800/50">
              <div className="w-[3px] h-10 rounded-full shrink-0 bg-red-500" />
              <p className="text-lg font-semibold text-slate-300">Hutang bulan lalu</p>
              <p className="text-lg font-black text-red-400 tabular-nums whitespace-nowrap">
                {h > 0 ? `\u2212\u00A0${fmtRp(h)}` : '\u2212\u00A0Rp 0'}
              </p>
            </div>
          </div>
          {/* Items langsung di bawah */}
          {refundCarryOvers.length > 0 && (
            <div className="bg-white pt-4 pb-4">
              {refundCarryOvers.map((item, idx) => {
                const absPrice = Math.abs(item.price)
                const templateName = absPrice >= 2400000 ? 'Animasi potongan kajian' : 'Animasi materi script'
                return (
                  <div key={item.id} className={`flex items-center gap-2 px-4 py-2 mx-16 ${idx > 0 ? 'border-t border-slate-100' : ''}`}>
                    <div className="w-5 h-5 rounded-full border border-red-200 bg-red-50 flex items-center justify-center text-[9px] font-black text-red-500 shrink-0">
                      {idx + 1}
                    </div>
                    <p className="flex-1 text-xs text-slate-600 truncate">{templateName}</p>
                    <p className="text-xs font-black text-red-500 tabular-nums whitespace-nowrap">
                      {`\u2212${fmtRp(absPrice)}`}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Calculation summary ── */}
      <div className="px-6 pb-6">
        <div className="rounded-2xl bg-slate-800 border border-slate-700/50 overflow-hidden">
          <div className="flex flex-col items-end px-5 py-4 gap-0">
            {/* Row: Total anggaran */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-slate-300">Total anggaran</span>
              <span className="text-sm font-black text-white tabular-nums">{fmtRp(anggaranAwal)}</span>
            </div>

            {h > 0 && (
              <>
                {/* Divider */}
                <div className="w-full h-px bg-slate-700/60 my-3" />
                {/* Row: Hutang */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-slate-300">Hutang bulan lalu</span>
                  <span className="text-sm font-black text-red-400 tabular-nums">
                    {`\u2212\u00A0${fmtRp(h)}`}
                  </span>
                </div>
              </>
            )}

            {/* Connector: selalu tampil */}
            <div className="flex flex-col items-center py-1">
              <div className="w-1 h-1 rounded-full bg-slate-500" />
              <div className="w-px h-8 bg-slate-600" />
              <div className="w-1 h-1 rounded-full bg-slate-500" />
            </div>

            {/* Result: selalu tampil */}
            <div className="flex items-baseline gap-2 pb-2">
              <span className="text-xs font-semibold text-slate-400">sisa pencairan</span>
              <p className="text-xl font-black tracking-tight text-white tabular-nums leading-none">
                {fmtRp(Math.max(0, sisaDicairkan))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
