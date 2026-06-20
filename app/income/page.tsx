'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatCompact, getMonthKey, getMonthLabel } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { IncomeForm } from '@/components/income/IncomeForm';
import { useToast } from '@/components/ui/toast';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, TrendingUp } from 'lucide-react';
import type { Income } from '@/lib/db';

const SOURCE_META: Record<string, { color: string; gradient: string; icon: string }> = {
  'Primary Job':    { color: '#00C896', gradient: 'linear-gradient(135deg,#00C896,#009B75)', icon: '💼' },
  'Freelance':      { color: '#7B61FF', gradient: 'linear-gradient(135deg,#7B61FF,#5B41CF)', icon: '🎨' },
  'Investments':    { color: '#4A9EFF', gradient: 'linear-gradient(135deg,#4A9EFF,#2A7EDF)', icon: '📈' },
  'Side Hustle':    { color: '#FFB547', gradient: 'linear-gradient(135deg,#FFB547,#E09027)', icon: '⚡' },
  'Gifts':          { color: '#FF79A8', gradient: 'linear-gradient(135deg,#FF79A8,#E05988)', icon: '🎁' },
  'Rental Income':  { color: '#FF6152', gradient: 'linear-gradient(135deg,#FF6152,#E04132)', icon: '🏠' },
  'Other':          { color: '#9096B4', gradient: 'linear-gradient(135deg,#9096B4,#707694)', icon: '💡' },
};

const FREQ_LABEL: Record<string, string> = {
  monthly: 'Monthly', 'one-time': 'One-time', weekly: 'Weekly',
};
const FREQ_ICON: Record<string, string> = {
  monthly: '🔄', 'one-time': '⚡', weekly: '📅',
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

  const bySource = useMemo(() => {
    const sources = [...new Set(monthIncome.map(i => i.source))];
    return sources.map(src => ({
      source: src,
      total: monthIncome.filter(i => i.source === src).reduce((s, i) => s + i.amount, 0),
      count: monthIncome.filter(i => i.source === src).length,
      meta: SOURCE_META[src] || SOURCE_META['Other'],
    })).sort((a, b) => b.total - a.total);
  }, [monthIncome]);

  const filtered = useMemo(() =>
    monthIncome.filter(i => !selectedSource || i.source === selectedSource)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [monthIncome, selectedSource]
  );

  const topSource = bySource[0];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">Income 💰</h1>
          <p className="text-sm text-[#9096B4]">{getMonthLabel(selectedMonth)}</p>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-white text-sm font-bold shadow-lg"
          style={{ background: 'linear-gradient(135deg, #00C896, #009B75)' }}>
          <Plus size={15}/> Add
        </motion.button>
      </div>

      {/* ── Hero Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0D2137 50%, #0A2E1F 100%)' }}>

        {/* Floating orbs */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #00C896, transparent)' }}/>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #7B61FF, transparent)' }}/>
        <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #4A9EFF, transparent)' }}/>

        {/* Grid lines decoration */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }}/>

        <div className="relative px-6 pt-6 pb-5">
          {/* Month nav */}
          <div className="flex items-center gap-3 mb-5">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => go(-1)}
              className="w-8 h-8 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 flex items-center justify-center transition-colors">
              <ChevronLeft size={14}/>
            </motion.button>
            <span className="text-sm font-bold text-white/70 tracking-wide">{getMonthLabel(selectedMonth)}</span>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => go(1)}
              disabled={selectedMonth === getMonthKey()}
              className="w-8 h-8 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-30">
              <ChevronRight size={14}/>
            </motion.button>
          </div>

          {/* Total */}
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/30 mb-1">Total Income</p>
          <AnimatedNumber
            value={total}
            formatter={n => formatCurrency(n, currency)}
            className="text-4xl font-black text-white tracking-tight mb-1"
          />
          <div className="flex items-center gap-2 mt-1">
            <TrendingUp size={12} className="text-[#00C896]"/>
            <p className="text-xs text-white/40">{monthIncome.length} {monthIncome.length === 1 ? 'entry' : 'entries'}</p>
            {topSource && (
              <>
                <span className="text-white/20">·</span>
                <p className="text-xs text-white/40">Top: <span style={{ color: topSource.meta.color }}>{topSource.source}</span></p>
              </>
            )}
          </div>

          {/* Source breakdown mini bars */}
          {bySource.length > 0 && (
            <div className="mt-5 flex gap-1.5">
              {bySource.map(s => {
                const pct = total > 0 ? (s.total / total) * 100 : 0;
                return (
                  <motion.button key={s.source}
                    onClick={() => setSelectedSource(selectedSource === s.source ? '' : s.source)}
                    whileTap={{ scale: 0.96 }}
                    className={`flex-1 rounded-xl p-2.5 text-left transition-all border ${
                      selectedSource === s.source
                        ? 'border-white/30 bg-white/15'
                        : selectedSource
                          ? 'border-white/5 bg-white/5 opacity-50'
                          : 'border-white/10 bg-white/8 hover:bg-white/12'
                    }`}
                    style={{ background: selectedSource === s.source ? `${s.meta.color}22` : undefined }}>
                    <p className="text-lg mb-1">{s.meta.icon}</p>
                    <p className="text-[10px] font-bold text-white/50 truncate">{s.source.split(' ')[0]}</p>
                    <p className="text-xs font-black text-white">{formatCompact(s.total, currency)}</p>
                    <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        style={{ backgroundColor: s.meta.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}/>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Source breakdown bars ── */}
      {bySource.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${Math.min(bySource.length, 3)}, 1fr)` }}>
          {bySource.map((s, i) => {
            const pct = total > 0 ? (s.total / total) * 100 : 0;
            const isSelected = selectedSource === s.source;
            return (
              <motion.button key={s.source}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.06 }}
                whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedSource(isSelected ? '' : s.source)}
                className={`rounded-2xl p-4 text-left border-2 transition-all ${
                  isSelected ? 'border-transparent shadow-lg' : 'bg-white border-[#F0EDE8] hover:border-[#E0DDF8]'
                }`}
                style={isSelected ? { background: s.meta.gradient, boxShadow: `0 8px 24px ${s.meta.color}40` } : {}}>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{s.meta.icon}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'text-white'}`}
                    style={!isSelected ? { backgroundColor: s.meta.color } : {}}>
                    {Math.round(pct)}%
                  </span>
                </div>
                <p className={`text-[11px] font-semibold mb-0.5 ${isSelected ? 'text-white/70' : 'text-[#9096B4]'}`}>{s.source}</p>
                <p className={`text-lg font-black leading-tight ${isSelected ? 'text-white' : 'text-[#1A1A2E]'}`}>{formatCompact(s.total, currency)}</p>
                <div className={`h-1.5 rounded-full mt-2.5 overflow-hidden ${isSelected ? 'bg-white/20' : 'bg-[#F0EDE8]'}`}>
                  <motion.div className="h-full rounded-full"
                    style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : s.meta.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: 0.15 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}/>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* ── Filter pill (when source selected) ── */}
      <AnimatePresence>
        {selectedSource && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <button onClick={() => setSelectedSource('')}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white shadow-md"
              style={{ background: SOURCE_META[selectedSource]?.gradient || '#9096B4' }}>
              {SOURCE_META[selectedSource]?.icon} {selectedSource}
              <span className="ml-1 bg-white/25 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✕</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Transaction list ── */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white rounded-3xl border border-[#EEEDF5] p-16 text-center">
            <motion.p className="text-5xl mb-3" animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>💰</motion.p>
            <p className="text-[#9096B4] text-sm">No income logged{selectedSource ? ` for ${selectedSource}` : ''}</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setFormOpen(true)}
              className="mt-4 px-5 py-2.5 rounded-2xl text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #00C896, #009B75)' }}>
              + Add Income
            </motion.button>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ delay: 0.18 }}
            className="bg-white rounded-3xl border border-[#EEEDF5] shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-[#9096B4]">
                {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
              </p>
              <div className="flex items-center gap-1 text-xs font-bold text-[#00C896]">
                <TrendingUp size={11}/>
                {formatCompact(filtered.reduce((s, i) => s + i.amount, 0), currency)}
              </div>
            </div>
            <div className="divide-y divide-[#F8F8FC]">
              {filtered.map((item, i) => {
                const meta = SOURCE_META[item.source] || SOURCE_META['Other'];
                const dateStr = new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-3.5 px-5 py-4 group hover:bg-[#FAFAF8] transition-colors">

                    {/* Avatar */}
                    <motion.div whileHover={{ scale: 1.1, rotate: 3 }}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm shrink-0 relative overflow-hidden"
                      style={{ background: meta.gradient }}>
                      <div className="absolute inset-0 opacity-20"
                        style={{ background: 'radial-gradient(circle at 30% 30%, white, transparent)' }}/>
                      <span className="relative z-10">{meta.icon}</span>
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1A1A2E] truncate">{item.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: meta.color }}>
                          {item.source}
                        </span>
                        <span className="text-xs text-[#C0BFCC]">·</span>
                        <span className="text-xs text-[#9096B4]">{FREQ_ICON[item.frequency]} {FREQ_LABEL[item.frequency]}</span>
                        <span className="text-xs text-[#C0BFCC]">·</span>
                        <span className="text-xs text-[#9096B4]">{dateStr}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-base font-black" style={{ color: meta.color }}>
                        +{formatCompact(item.amount, currency)}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditing(item); setFormOpen(true); }}
                          className="p-1.5 rounded-xl hover:bg-[#F0EEFF] text-[#C0BFCC] hover:text-[#7B61FF] transition-colors">
                          <Edit2 size={13}/>
                        </button>
                        <button onClick={async () => { if (item.id) { await deleteIncome(item.id); toast('Removed'); } }}
                          className="p-1.5 rounded-xl hover:bg-[#FFF0EE] text-[#C0BFCC] hover:text-[#FF6152] transition-colors">
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <IncomeForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(undefined); }} editing={editing}/>
    </div>
  );
}
