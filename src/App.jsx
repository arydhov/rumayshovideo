import { useState, useEffect, useRef } from 'react'
import { BudgetOverviewCard } from './BudgetOverviewCard'

// ─── Constants ───────────────────────────────────────────────────────────────
const APP_PASSWORD = 'untukmassudib'
const ADMIN_PASSCODE = '1234'
const BASE_SALARY = 3000000
const DEFAULT_GS_URL =
  'https://script.google.com/macros/s/AKfycbw4AKi7ajWJ-Ovoh2z-na-wZ4w33O0XDZoPiUs4kV1Z-IhuOTjG-qJmRFqoWWSOZOA5/exec'
const STORAGE_KEY = 'trackerPekerjaanData'
const APP_UNLOCKED_KEY = 'appUnlocked'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

function formatRupiah(n) {
  const val = Math.abs(n)
  const formatted = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(val)
  return (n < 0 ? '-' : '') + 'Rp ' + formatted
}

function formatPeriodHeader(s, e) {
  if (!s || !e) return 'Periode Belum Diatur'
  const d1 = new Date(s),
    d2 = new Date(e)
  return `${d1.toLocaleDateString('id-ID', { month: 'long' })} - ${d2.toLocaleDateString('id-ID', {
    month: 'short',
    year: 'numeric',
  })}`
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: generateId(),
            startDate: '2026-03-10',
            endDate: '2026-04-10',
            isClosed: false,
            items: [],
          },
        ]
  } catch {
    return [
      {
        id: generateId(),
        startDate: '2026-03-10',
        endDate: '2026-04-10',
        isClosed: false,
        items: [],
      },
    ]
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AuthModal({ onClose, onSuccess }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef()

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  function verify() {
    if (pin === ADMIN_PASSCODE) {
      setPin('')
      setError(false)
      onSuccess()
    } else {
      setError(true)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') verify()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-10 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-black text-slate-900 text-center mb-6 uppercase tracking-tight">
          Verifikasi Admin
        </h3>
        <input
          ref={inputRef}
          type="password"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError(false) }}
          onKeyDown={handleKey}
          placeholder="PIN"
          className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none text-center text-4xl font-black tracking-[0.5em] mb-4 bg-slate-50 transition-all"
        />
        {error && (
          <div className="text-red-500 text-[10px] font-black text-center mb-6 uppercase tracking-widest">
            Akses Ditolak
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-sm"
          >
            Batal
          </button>
          <button
            onClick={verify}
            className="px-4 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-100"
          >
            Konfirmasi
          </button>
        </div>
      </div>
    </div>
  )
}

function PasswordGate({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef()

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  function verify() {
    if (password === APP_PASSWORD) {
      setPassword('')
      setError(false)
      localStorage.setItem(APP_UNLOCKED_KEY, 'true')
      onSuccess()
    } else {
      setError(true)
      setPassword('')
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') verify()
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-10 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 mx-auto mb-4">
            <i className="fas fa-lock text-white text-2xl" />
          </div>
          <h3 className="text-xl font-black text-slate-900 text-center uppercase tracking-tight">
            Budgeting Produksi
          </h3>
          <p className="text-xs text-slate-500 mt-2">Masukkan password untuk melanjutkan</p>
        </div>
        <input
          ref={inputRef}
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false) }}
          onKeyDown={handleKey}
          placeholder="Password"
          className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none text-center text-lg font-semibold mb-4 bg-slate-50 transition-all"
        />
        {error && (
          <div className="text-red-500 text-xs font-black text-center mb-6 uppercase tracking-widest">
            ❌ Password Salah
          </div>
        )}
        <button
          onClick={verify}
          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors"
        >
          Akses
        </button>
      </div>
    </div>
  )
}

function PeriodCard({ period, isAdmin, onUpdate, onDelete }) {
  const [newTitle, setNewTitle] = useState('')
  const [newPrice, setNewPrice] = useState('')

  // Computed values
  const projectTotal = period.items.filter((i) => i.price > 0).reduce((s, i) => s + i.price, 0)
  const totalInitialBudget = projectTotal + BASE_SALARY
  const refundCarryOvers = period.items.filter((i) => i.price < 0)
  const mainWorkItems = period.items.filter((i) => i.price >= 0)
  const mainWorkDoneItems = mainWorkItems.filter((i) => i.status === 'selesai' && i.price > 0)
  const mainWorkDoneTotal = mainWorkDoneItems.reduce((s, i) => s + i.price, 0)
  const mainWorkRefundItems = mainWorkItems.filter((i) => i.status === 'refund' && i.price > 0)
  const mainWorkRefundTotal = mainWorkRefundItems.reduce((s, i) => s + i.price, 0)
  const totalDone = period.items.filter((i) => i.status === 'selesai').reduce((s, i) => s + i.price, 0)
  const totalRef = period.items.filter((i) => i.price > 0 && i.status === 'refund').reduce((s, i) => s + i.price, 0)
  const totalCarryOverValue = refundCarryOvers.reduce((s, i) => s + i.price, 0)
  const totalPlannedSum = period.items.filter((i) => i.status === 'planned' && i.price > 0).reduce((s, i) => s + i.price, 0)
  const overviewAnggaranAwal = BASE_SALARY + mainWorkDoneTotal + mainWorkRefundTotal + totalPlannedSum
  const overviewSisaDicairkan = overviewAnggaranAwal - Math.abs(totalCarryOverValue)
  const effectiveProjectValue = totalDone === 0 ? totalPlannedSum : totalDone
  const totalNetReceived = BASE_SALARY + effectiveProjectValue + totalRef - Math.abs(totalCarryOverValue)

  function handleAddItem() {
    if (!newTitle || !newPrice) return
    onUpdate(period.id, 'addItem', {
      id: generateId(),
      title: newTitle,
      price: parseFloat(newPrice),
      status: 'planned',
      isCarryOver: false,
      isManualAdjustment: parseFloat(newPrice) < 0,
    })
    setNewTitle('')
    setNewPrice('')
  }

  function handleCycleStatus(itemId) {
    const item = period.items.find((i) => i.id === itemId)
    if (!item || period.isClosed || !isAdmin) return
    let next = 'planned'
    if (item.status === 'planned') next = 'selesai'
    else if (item.status === 'selesai') next = item.price < 0 ? 'planned' : 'refund'
    onUpdate(period.id, 'cycleItemStatus', { itemId, status: next })
  }

  return (
    <section
      className={`relative bg-white rounded-2xl shadow-2xl shadow-slate-200 overflow-hidden border border-slate-200 transition-all ${
        period.isClosed ? 'opacity-95' : ''
      }`}
    >
      {/* Header */}
      <div className="p-6 md:p-10 bg-slate-50 flex flex-col gap-6">
        <div className="flex flex-row justify-between items-center">
          {isAdmin && (
            <label className="inline-flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={period.isClosed}
                  onChange={() => onUpdate(period.id, 'toggleClosed')}
                  className="sr-only peer"
                />
                <div
                  className={`w-12 h-6 rounded-full transition-all relative shadow-inner cursor-pointer ${
                    period.isClosed ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${
                      period.isClosed ? 'left-7' : 'left-1'
                    }`}
                  />
                </div>
              </div>
              <span className="ml-3 text-[10px] font-black uppercase text-slate-500">
                {period.isClosed ? 'Laporan Terkunci' : 'Laporan Aktif'}
              </span>
            </label>
          )}
          <div className="flex items-center gap-4 ml-auto">
            {isAdmin && (
              <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <input
                  type="date"
                  value={period.startDate}
                  onChange={(e) => onUpdate(period.id, 'startDate', e.target.value)}
                  className="text-xs font-black text-slate-700 outline-none bg-transparent"
                />
                <i className="fas fa-arrow-right text-[10px] text-slate-300" />
                <input
                  type="date"
                  value={period.endDate}
                  onChange={(e) => onUpdate(period.id, 'endDate', e.target.value)}
                  className="text-xs font-black text-slate-700 outline-none bg-transparent"
                />
              </div>
            )}
            {isAdmin && (
              <button
                onClick={() => onDelete(period.id)}
                className="text-slate-300 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                title="Hapus Periode"
              >
                <i className="fas fa-trash-alt text-lg" />
              </button>
            )}
          </div>
        </div>

        <div className="w-full">
          {period.isClosed ? (
            <div className="w-full px-6 py-3 rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm">
              <div className="w-full flex items-center justify-center gap-3 text-xs font-black text-emerald-900 uppercase tracking-widest">
                <i className="fas fa-lock" aria-hidden="true" />
                Periode ini sudah selesai
              </div>
            </div>
          ) : (
            <div className="w-full px-6 py-3 rounded-2xl border border-emerald-200 shadow-sm loading-bar-track">
              <div className="relative z-10 w-full flex items-center justify-center text-xs font-black text-emerald-900 uppercase tracking-widest">
                <span className="active-dot-emerald mr-3" aria-hidden="true" />
                Project sedang berjalan
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-row gap-6">
          <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-xl flex-1 transform hover:scale-[1.01] transition-all overflow-hidden">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Periode Laporan
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight truncate">
              {formatPeriodHeader(period.startDate, period.endDate)}
            </h2>
            <div className="mt-2 text-xs font-semibold text-slate-400">
              Dimulai pada tanggal 10 di setiap periode
            </div>
          </div>
          <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-xl shrink-0 text-right transform hover:scale-[1.01] transition-all">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Anggaran Awal (Net)
            </span>
            <span className="text-3xl md:text-5xl font-black text-indigo-700 tabular-nums tracking-tighter">
              {formatRupiah(totalInitialBudget)}
            </span>
          </div>
        </div>
      </div>

      {/* Summary & totals */}
      <div className="p-6 md:p-8 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-0">
            <div className="w-full">
              <span className="inline-flex w-full items-center justify-center gap-1.5 px-3 py-2 rounded-t-2xl rounded-b-none border border-slate-700 border-b-0 bg-slate-800 text-[10px] md:text-[11px] font-normal text-white leading-relaxed text-center">
                Dari dana yang dianggarkan, terdapat potongan hutang sebesar{' '}
                <span className="font-black tabular-nums whitespace-nowrap text-red-400">
                  {formatRupiah(Math.abs(totalCarryOverValue))}
                </span>{' '}
                sehingga dana yang dapat dicairkan sebesar{' '}
                <span className="font-black tabular-nums whitespace-nowrap text-white">
                  {formatRupiah(overviewSisaDicairkan)}
                </span>
              </span>
            </div>

            <BudgetOverviewCard
              gaji={BASE_SALARY}
              videoDone={mainWorkDoneTotal}
              videoRefund={mainWorkRefundTotal}
              hutang={Math.abs(totalCarryOverValue)}
              joinedTop
              mainWorkItems={mainWorkItems}
              refundCarryOvers={refundCarryOvers}
              isAdmin={isAdmin}
              isClosed={period.isClosed}
              onCycleStatus={handleCycleStatus}
              onUpdateTitle={(itemId, val) => onUpdate(period.id, 'updateItemTitle', { itemId, val })}
              onUpdatePrice={(itemId, val) => onUpdate(period.id, 'updateItemPrice', { itemId, val })}
              onDeleteItem={(itemId) => onUpdate(period.id, 'deleteItem', { itemId })}
            />
          </div>

          {/* Main disbursement card */}
          <div className="relative bg-indigo-600 rounded-2xl p-12 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left flex-1">
              <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-200 block mb-2">
                {period.isClosed ? 'Anggaran yang dicairkan' : 'Anggaran yang diajukan'}
              </span>
              <h3 className="font-black tracking-tighter tabular-nums whitespace-nowrap text-[clamp(2.2rem,5.6vw,4.2rem)] leading-none">
                {formatRupiah(totalNetReceived)}
              </h3>
              {period.startDate && (
                <p className="mt-2 text-xs text-indigo-200 font-medium">
                  {period.isClosed ? 'Telah' : 'Akan'} dicairkan ke rekening yang bersangkutan pada tanggal{' '}
                  <span className="font-black text-white">
                    {(() => { const [y,m,d] = period.startDate.split('-'); return new Date(y, m-1, d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) })()}
                  </span>
                </p>
              )}
            </div>
            <div className="h-20 w-px bg-indigo-400 opacity-30 hidden md:block" />
            <div className={`px-4 py-2 rounded-lg text-[11px] md:text-xs font-black uppercase tracking-widest border shadow-sm whitespace-nowrap ${
              period.isClosed
                ? 'text-emerald-700 bg-emerald-100 border-emerald-200'
                : 'text-slate-700 bg-slate-100 border-slate-200'
            }`}>
              {period.isClosed ? '✅ Dana telah dicairkan (Settled)' : '⏳ Dana sedang diajukan'}
            </div>
            {period.isClosed && <div className="stamp-overlay">SETTLED</div>}
          </div>

          {/* Add item form */}
          {isAdmin && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
              <div className="md:col-span-8">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-1">
                  Deskripsi Project Reguler
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nama project..."
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-slate-900 shadow-sm transition-all"
                />
              </div>
              <div className="md:col-span-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-1">
                  Nominal Budget
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">Rp</span>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Budget"
                    className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-right text-slate-900 shadow-sm transition-all"
                  />
                </div>
              </div>
              <button
                onClick={handleAddItem}
                className="md:col-span-1 p-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all"
              >
                <i className="fas fa-plus" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [appData, setAppData] = useState(loadFromStorage)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isAppUnlocked, setIsAppUnlocked] = useState(() => localStorage.getItem(APP_UNLOCKED_KEY) === 'true')
  const [syncStatus, setSyncStatus] = useState('Sistem Terkoneksi')
  const syncTimerRef = useRef(null)
  const gsUrl = localStorage.getItem('tracker_gs_url') || DEFAULT_GS_URL

  // Pull from cloud on mount + scroll to bottom
  useEffect(() => {
    handleCloudSync('pull')
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })
  }, [])

  // Scroll to bottom when app unlocked
  useEffect(() => {
    if (isAppUnlocked) {
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }), 100)
    }
  }, [isAppUnlocked])

  // Save to localStorage whenever appData changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData))
    if (isAdmin) triggerAutoPush()
  }, [appData])

  async function handleCloudSync(mode) {
    setSyncStatus('Sinkronisasi...')
    try {
      if (mode === 'push') {
        if (!isAdmin) return
        await fetch(gsUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ action: 'push', data: appData }),
        })
        setSyncStatus('Cloud Aktif ✓')
      } else {
        const res = await fetch(`${gsUrl}?action=pull`)
        const result = await res.json()
        if (result?.data) {
          setAppData(result.data)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data))
        }
        setSyncStatus('Cloud Aktif ✓')
      }
    } catch {
      setSyncStatus('Cloud Offline')
    }
  }

  function triggerAutoPush() {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => handleCloudSync('push'), 2000)
  }

  function handleAdminAuth() {
    if (isAdmin) {
      setIsAdmin(false)
    } else {
      setShowAuthModal(true)
    }
  }

  function onAuthSuccess() {
    setIsAdmin(true)
    setShowAuthModal(false)
  }

  function addNewPeriod() {
    if (!isAdmin) return
    setAppData((prev) => {
      let start = new Date()
      start.setDate(10)
      let nextItems = []

      if (prev.length > 0) {
        const last = prev[prev.length - 1]
        if (last.endDate) start = new Date(last.endDate)
        const refundItems = last.items.filter((i) => i.status === 'refund' && i.price > 0)
        refundItems.forEach((i) => {
          nextItems.push({ id: generateId(), title: i.title, price: -i.price, status: 'planned', isCarryOver: true })
          nextItems.push({ id: generateId(), title: i.title, price: 0, status: 'planned', isCarryOver: false, isRework: true })
        })
      }

      const end = new Date(start)
      end.setMonth(end.getMonth() + 1)

      return [
        ...prev,
        {
          id: generateId(),
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          isClosed: false,
          items: nextItems,
        },
      ]
    })
  }

  function handlePeriodUpdate(periodId, action, payload) {
    if (!isAdmin) return
    setAppData((prev) =>
      prev.map((p) => {
        if (p.id !== periodId) return p

        switch (action) {
          case 'toggleClosed':
            return { ...p, isClosed: !p.isClosed }
          case 'startDate':
            return { ...p, startDate: payload }
          case 'endDate':
            return { ...p, endDate: payload }
          case 'addItem':
            return { ...p, items: [...p.items, payload] }
          case 'addRefundItem':
            return { ...p, items: [...p.items, {
              id: generateId(),
              title: payload.title,
              price: -Math.abs(payload.price), // Pastikan selalu negative
              status: 'planned',
              isCarryOver: false,
              isManualAdjustment: true,
            }] }
          case 'deleteItem':
            return { ...p, items: p.items.filter((i) => i.id !== payload.itemId) }
          case 'cycleItemStatus':
            return {
              ...p,
              items: p.items.map((i) => (i.id === payload.itemId ? { ...i, status: payload.status } : i)),
            }
          case 'updateItemTitle':
            return {
              ...p,
              items: p.items.map((i) => (i.id === payload.itemId ? { ...i, title: payload.val } : i)),
            }
          case 'updateItemPrice': {
            const price = parseFloat(payload.val) || 0
            return {
              ...p,
              items: p.items.map((i) =>
                i.id === payload.itemId ? { ...i, price, isManualAdjustment: price < 0 } : i
              ),
            }
          }
          default:
            return p
        }
      })
    )
  }

  function handleDeletePeriod(periodId) {
    if (!isAdmin) return
    if (appData.length <= 1) {
      alert('Tidak dapat menghapus periode terakhir')
      return
    }
    if (window.confirm('Apakah Anda yakin ingin menghapus periode ini?')) {
      setAppData((prev) => prev.filter((p) => p.id !== periodId))
    }
  }

  return (
    <>
      {!isAppUnlocked ? (
        <PasswordGate onSuccess={() => setIsAppUnlocked(true)} />
      ) : (
        <div className="text-slate-900 min-h-screen overflow-x-hidden">
          {/* Floating sticky header */}
          <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/60 shadow-lg shadow-slate-900/30">
            <div className="max-w-5xl mx-auto px-4 md:px-8">
              <header className="flex items-center justify-between py-3 gap-4">
                {/* Brand */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                    <i className="fas fa-film text-white text-xs" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-sm md:text-base font-black tracking-tight text-white leading-tight">
                      Budgeting <span className="text-indigo-400">Produksi</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-medium leading-tight truncate">
                      Rekap perencanaan dan budgeting bulanan produksi konten (video) di channel rumaysho.com
                    </p>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 no-print shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <i className="fas fa-circle text-[6px] text-indigo-400" />
                    {syncStatus}
                  </span>
                  {isAdmin && (
                    <span className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest">
                      Admin
                    </span>
                  )}
                  <button
                    onClick={handleAdminAuth}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${
                      isAdmin ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-700 text-white hover:bg-slate-600'
                    }`}
                  >
                    <i className={`fas ${isAdmin ? 'fa-lock-open' : 'fa-lock'} text-[10px]`} />
                    <span>{isAdmin ? 'Logout' : 'Login'}</span>
                  </button>
                </div>
              </header>
            </div>
          </div>

          <div className="p-1 sm:p-4 md:p-8 pt-0 sm:pt-0 md:pt-0">
          <div className="max-w-5xl mx-auto">
            {/* Period Cards */}
            <main className="space-y-0 mt-4 md:mt-6">
              {appData.map((period, idx) => (
                <div key={period.id}>
                  <PeriodCard
                    period={period}
                    isAdmin={isAdmin}
                    onUpdate={handlePeriodUpdate}
                    onDelete={handleDeletePeriod}
                  />
                  {idx !== appData.length - 1 && (
                    <div className="my-12 md:my-16 w-[100dvw] ml-[calc(50%-50dvw)] h-1.5 md:h-2 bg-white" />
                  )}
                </div>
              ))}
            </main>

            {/* Add Period Button */}
            {isAdmin && (
              <div className="mt-12 text-center pb-16">
                <button
                  onClick={addNewPeriod}
                  className="px-12 py-6 bg-white border-2 border-dashed border-slate-300 hover:border-indigo-400 text-slate-700 hover:text-indigo-600 rounded-2xl font-black transition-all flex items-center gap-3 mx-auto shadow-sm text-sm group"
                >
                  <i className="fas fa-plus-circle text-xl group-hover:scale-110 transition-transform" />
                  Tambah Periode Produksi Baru
                </button>
              </div>
            )}
          </div>
          </div>

          {/* Auth Modal */}
          {showAuthModal && (
            <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={onAuthSuccess} />
          )}
        </div>
      )}
    </>
  )
}
