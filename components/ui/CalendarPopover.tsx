'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { formatCompact } from '@/lib/utils';
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function CalendarPopover() {
  const { income, expenses } = useStore();
  const currency = useStore(s => s.profile?.currency) || 'NPR';
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'month' | 'day'>('month');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const monthKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
  const monthName = new Date(calYear, calMonth).toLocaleString('default', { month: 'long', year: 'numeric' });

  const go = (d: number) => {
    const dt = new Date(calYear, calMonth + d, 1);
    setCalYear(dt.getFullYear());
    setCalMonth(dt.getMonth());
  };

  // Build per-day flow map
  const dayFlow: Record<number, { income: number; expense: number }> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    dayFlow[d] = { income: 0, expense: 0 };
  }
  income.filter(i => i.date.startsWith(monthKey)).forEach(i => {
    const d = parseInt(i.date.split('-')[2]);
    if (dayFlow[d]) dayFlow[d].income += i.amount;
  });
  expenses.filter(e => e.date.startsWith(monthKey)).forEach(e => {
    const d = parseInt(e.date.split('-')[2]);
    if (dayFlow[d]) dayFlow[d].expense += e.amount;
  });

  const selDay = selectedDay;
  const selFlow = selDay ? dayFlow[selDay] : null;
  const selDate = selDay ? `${monthKey}-${String(selDay).padStart(2, '0')}` : null;
  const selIncome = income.filter(i => i.date === selDate);
  const selExpenses = expenses.filter(e => e.date === selDate);

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(o => !o)}
        className="p-2.5 rounded-2xl bg-white border border-[#EEEDF5] shadow-sm text-[#7B61FF] hover:bg-[#F0EEFF] transition-colors"
      >
        <Calendar size={18} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ type: 'spring', damping: 28, stiffness: 400 }}
              className="absolute right-0 top-12 z-50 bg-white rounded-3xl shadow-2xl border border-[#EEEDF5] w-80 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#F5F5F8]">
                <div className="flex items-center gap-2">
                  <button onClick={() => go(-1)} className="p-1 rounded-lg hover:bg-[#F5F5F8] text-[#9096B4]"><ChevronLeft size={14}/></button>
                  <span className="text-sm font-bold text-[#1A1A2E]">{monthName}</span>
                  <button onClick={() => go(1)} className="p-1 rounded-lg hover:bg-[#F5F5F8] text-[#9096B4]"><ChevronRight size={14}/></button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setView('month'); setSelectedDay(null); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${view === 'month' ? 'bg-[#7B61FF] text-white' : 'text-[#9096B4] hover:bg-[#F5F5F8]'}`}>
                    Month
                  </button>
                  <button onClick={() => setView('day')} disabled={!selectedDay}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${view === 'day' ? 'bg-[#7B61FF] text-white' : 'text-[#9096B4] hover:bg-[#F5F5F8] disabled:opacity-30'}`}>
                    Day
                  </button>
                  <button onClick={() => setOpen(false)} className="ml-1 p-1 rounded-lg hover:bg-[#F5F5F8] text-[#C0BFCC]"><X size={13}/></button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {view === 'month' ? (
                  <motion.div key="month-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
                    {/* Day labels */}
                    <div className="grid grid-cols-7 mb-2">
                      {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-[#C0BFCC] py-1">{d}</div>
                      ))}
                    </div>
                    {/* Days grid */}
                    <div className="grid grid-cols-7 gap-0.5">
                      {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`}/>)}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const d = i + 1;
                        const flow = dayFlow[d];
                        const net = flow.income - flow.expense;
                        const hasData = flow.income > 0 || flow.expense > 0;
                        const isToday = calYear === now.getFullYear() && calMonth === now.getMonth() && d === now.getDate();
                        const isSel = selectedDay === d;

                        return (
                          <button key={d} onClick={() => { setSelectedDay(d); setView('day'); }}
                            className={`relative flex flex-col items-center rounded-xl py-1.5 px-0.5 transition-all hover:bg-[#F0EEFF] ${isSel ? 'bg-[#7B61FF]' : ''} ${isToday && !isSel ? 'ring-2 ring-[#7B61FF] ring-inset' : ''}`}>
                            <span className={`text-xs font-bold ${isSel ? 'text-white' : isToday ? 'text-[#7B61FF]' : 'text-[#1A1A2E]'}`}>{d}</span>
                            {hasData && (
                              <span className={`text-[8px] font-black leading-tight ${isSel ? 'text-white/80' : net >= 0 ? 'text-[#00C896]' : 'text-[#FF6152]'}`}>
                                {net >= 0 ? '+' : ''}{net >= 1000 ? `${Math.round(net/1000)}K` : Math.abs(net) >= 1000 ? `-${Math.round(Math.abs(net)/1000)}K` : net}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Month summary */}
                    <div className="mt-4 pt-3 border-t border-[#F5F5F8] flex justify-between text-xs">
                      <div className="text-center">
                        <p className="text-[#9096B4] mb-0.5">Income</p>
                        <p className="font-black text-[#00C896]">+{formatCompact(income.filter(i => i.date.startsWith(monthKey)).reduce((s,i)=>s+i.amount,0), currency)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#9096B4] mb-0.5">Spent</p>
                        <p className="font-black text-[#FF6152]">-{formatCompact(expenses.filter(e => e.date.startsWith(monthKey)).reduce((s,e)=>s+e.amount,0), currency)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#9096B4] mb-0.5">Net</p>
                        <p className="font-black text-[#7B61FF]">{formatCompact(
                          income.filter(i=>i.date.startsWith(monthKey)).reduce((s,i)=>s+i.amount,0) -
                          expenses.filter(e=>e.date.startsWith(monthKey)).reduce((s,e)=>s+e.amount,0), currency)}</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="day-view" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <button onClick={() => setView('month')} className="text-xs text-[#9096B4] hover:text-[#7B61FF]">← Back</button>
                      <span className="text-sm font-bold text-[#1A1A2E]">
                        {selDay && new Date(calYear, calMonth, selDay).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {/* Net badge */}
                    {selFlow && (selFlow.income > 0 || selFlow.expense > 0) ? (
                      <>
                        <div className={`rounded-2xl p-3 mb-3 text-center ${selFlow.income - selFlow.expense >= 0 ? 'bg-[#E8FBF6]' : 'bg-[#FFF0EE]'}`}>
                          <p className="text-xs text-[#9096B4] mb-0.5">Net</p>
                          <p className={`text-2xl font-black ${selFlow.income - selFlow.expense >= 0 ? 'text-[#00C896]' : 'text-[#FF6152]'}`}>
                            {selFlow.income - selFlow.expense >= 0 ? '+' : ''}{formatCompact(selFlow.income - selFlow.expense, currency)}
                          </p>
                        </div>

                        {selIncome.length > 0 && (
                          <div className="mb-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9096B4] mb-1.5">Income</p>
                            {selIncome.map(i => (
                              <div key={i.id} className="flex justify-between text-sm py-1.5 border-b border-[#F5F5F8]">
                                <span className="text-[#1A1A2E]">{i.name}</span>
                                <span className="font-bold text-[#00C896]">+{formatCompact(i.amount, currency)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {selExpenses.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9096B4] mb-1.5">Expenses</p>
                            {selExpenses.map(e => (
                              <div key={e.id} className="flex justify-between text-sm py-1.5 border-b border-[#F5F5F8]">
                                <span className="text-[#1A1A2E]">{e.note || e.category}</span>
                                <span className="font-bold text-[#FF6152]">-{formatCompact(e.amount, currency)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-3xl mb-2">📅</p>
                        <p className="text-sm text-[#C0BFCC]">Nothing logged this day</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
