'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatCompact, getMonthKey, getMonthLabel, INCOME_SOURCES } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { IncomeForm } from '@/components/income/IncomeForm';
import { useToast } from '@/components/ui/toast';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2 } from 'lucide-react';
import type { Income } from '@/lib/db';

const SOURCE_COLORS: Record<string, string> = {
  'Primary Job': '#00C896', 'Freelance': '#7B61FF', 'Investments': '#4A9EFF',
  'Side Hustle': '#FFB547', 'Gifts': '#FF79A8', 'Rental Income': '#FF6152', 'Other': '#9096B4',
};

export default function IncomePage() {
  const { income, deleteIncome, selectedMonth, setSelectedMonth } = useStore();
  const { toast } = useToast();
  const currency = useStore(s => s.profile?.currency) || 'NPR';
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Income | undefined>();
  const [selectedSource, setSelectedSource] = useState('');

  const go = (d: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    setSelectedMonth(getMonthKey(new Date(y, m - 1 + d, 1)));
  };

  const monthIncome = useMemo(() => income.filter(i => i.date.startsWith(selectedMonth)), [income, selectedMonth]);
  const total = useMemo(() => monthIncome.reduce((s, i) => s + i.amount, 0), [monthIncome]);

  const filtered = useMemo(() =>
    monthIncome.filter(i => !selectedSource || i.source === selectedSource)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [monthIncome, selectedSource]
  );

  const usedSources = [...new Set(monthIncome.map(i => i.source))];

  // By source breakdown
  const bySource = useMemo(() =>
    usedSources.map(src => ({
      source: src,
      total: monthIncome.filter(i => i.source === src).reduce((s, i) => s + i.amount, 0),
      color: SOURCE_COLORS[src] || '#9096B4',
    })).sort((a, b) => b.total - a.total),
    [monthIncome, usedSources]
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">Income 💰</h1>
          <p className="text-sm text-[#9096B4]">{getMonthLabel(selectedMonth)}</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }}
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-white text-sm font-bold shadow-lg"
          style={{ background: 'linear-gradient(135deg, #00C896, #00A876)' }}>
          <Plus size={15}/> Add
        </motion.button>
      </div>

      {/* Month Nav + Total */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}
        className="rounded-3xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #00C896 0%, #009B75 100%)' }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fff, transparent)' }}/>
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => go(-1)} className="p-1 rounded-lg bg-white/20 text-white hover:bg-white/30"><ChevronLeft size={14}/></button>
          <span className="text-sm font-semibold text-white/80">{getMonthLabel(selectedMonth)}</span>
          <button onClick={() => go(1)} disabled={selectedMonth === getMonthKey()} className="p-1 rounded-lg bg-white/20 text-white hover:bg-white/30 disabled:opacity-30"><ChevronRight size={14}/></button>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Total Income</p>
        <AnimatedNumber value={total} formatter={n => formatCurrency(n, currency)} className="text-4xl font-black"/>
        <p className="text-sm text-white/60 mt-1">{monthIncome.length} {monthIncome.length === 1 ? 'entry' : 'entries'}</p>
      </motion.div>

      {/* Source breakdown pills */}
      {bySource.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="scroll-x flex gap-2 pb-1">
            <button onClick={() => setSelectedSource('')}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${!selectedSource ? 'text-white' : 'bg-white border border-[#EEEDF5] text-[#9096B4]'}`}
              style={!selectedSource ? { background: '#1A1A2E' } : {}}>
              All · {formatCompact(total, currency)}
            </button>
            {bySource.map(s => (
              <button key={s.source} onClick={() => setSelectedSource(selectedSource === s.source ? '' : s.source)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${selectedSource === s.source ? 'text-white' : 'bg-white border border-[#EEEDF5] text-[#9096B4]'}`}
                style={selectedSource === s.source ? { backgroundColor: s.color } : {}}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }}/>
                {s.source} · {formatCompact(s.total, currency)}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Source bars */}
      {bySource.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl border border-[#EEEDF5] shadow-sm p-5 space-y-3">
          {bySource.map((s, i) => (
            <div key={s.source}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-semibold text-[#1A1A2E]">{s.source}</span>
                <span className="font-bold" style={{ color: s.color }}>{formatCurrency(s.total, currency)}</span>
              </div>
              <div className="h-2 rounded-full bg-[#F5F5F8] overflow-hidden">
                <motion.div className="h-full rounded-full"
                  style={{ backgroundColor: s.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${total > 0 ? (s.total / total) * 100 : 0}%` }}
                  transition={{ duration: 0.9, delay: i * 0.08, ease: 'easeOut' }}/>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Income list */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white rounded-3xl border border-[#EEEDF5] p-16 text-center">
          <p className="text-5xl mb-3">💰</p>
          <p className="text-[#9096B4] text-sm">No income logged{selectedSource ? ` for ${selectedSource}` : ''}</p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-[#EEEDF5] shadow-sm overflow-hidden">
          <div className="divide-y divide-[#F5F5F8]">
            {filtered.map((item, i) => {
              const color = SOURCE_COLORS[item.source] || '#9096B4';
              const freqMap = { monthly: '🔄 Monthly', 'one-time': '1️⃣ One-time', weekly: '📅 Weekly' };
              return (
                <motion.div key={item.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.22 + i * 0.05 }}
                  className="flex items-center gap-3 px-5 py-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0"
                    style={{ backgroundColor: color }}>
                    {item.source.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1A1A2E] truncate">{item.name}</p>
                    <p className="text-xs text-[#9096B4]">
                      {freqMap[item.frequency]} · {new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className="font-black text-sm shrink-0" style={{ color }}>+{formatCompact(item.amount, currency)}</span>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => { setEditing(item); setFormOpen(true); }}
                      className="p-1.5 rounded-xl hover:bg-[#F0EEFF] text-[#C0BFCC] hover:text-[#7B61FF]"><Edit2 size={13}/></button>
                    <button onClick={async () => { if (item.id) { await deleteIncome(item.id); toast('Removed'); } }}
                      className="p-1.5 rounded-xl hover:bg-[#FFF0EE] text-[#C0BFCC] hover:text-[#FF6152]"><Trash2 size={13}/></button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      <IncomeForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(undefined); }} editing={editing}/>
    </div>
  );
}
