'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatCompact, getMonthKey, getMonthLabel, EXPENSE_CATEGORIES, CATEGORY_COLORS } from '@/lib/utils';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { useToast } from '@/components/ui/toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Flame, TrendingDown } from 'lucide-react';
import type { Expense } from '@/lib/db';

type View = 'list' | 'donut' | 'bars';

const VIEWS: { id: View; emoji: string; label: string }[] = [
  { id: 'list',  emoji: '📋', label: 'List'  },
  { id: 'donut', emoji: '🍩', label: 'Donut' },
  { id: 'bars',  emoji: '📊', label: 'Bars'  },
];

const FUN_TIPS = [
  "Your wallet called. It needs a hug. 🫂",
  "Rent ate the budget again 🏠",
  "Food > savings apparently 🍜",
  "Subscriptions: the silent budget killer 📱",
  "Shop till you drop... the savings rate 🛍️",
];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  const currency = useStore.getState().profile?.currency || 'NPR';
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-2xl px-3.5 py-2.5 shadow-lg border border-[#EEEDF5]">
      <p className="text-sm font-bold text-[#1A1A2E]">{payload[0].name}</p>
      <p className="text-sm text-[#FF6152] font-bold">{formatCurrency(payload[0].value, currency)}</p>
    </div>
  );
};

export default function ExpensesPage() {
  const { expenses, deleteExpense, selectedMonth, setSelectedMonth } = useStore();
  const { toast } = useToast();
  const currency = useStore(s => s.profile?.currency) || 'NPR';
  const [view, setView] = useState<View>('list');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | undefined>();
  const [selectedCat, setSelectedCat] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const go = (d: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    setSelectedMonth(getMonthKey(new Date(y, m - 1 + d, 1)));
  };

  const monthExp = useMemo(() => expenses.filter(e => e.date.startsWith(selectedMonth)), [expenses, selectedMonth]);
  const total = monthExp.reduce((s, e) => s + e.amount, 0);

  const byCategory = useMemo(() =>
    EXPENSE_CATEGORIES.map(cat => ({
      name: cat.label, value: monthExp.filter(e => e.category === cat.value).reduce((s, e) => s + e.amount, 0),
      color: CATEGORY_COLORS[cat.value], icon: cat.icon, key: cat.value,
    })).filter(c => c.value > 0).sort((a, b) => b.value - a.value),
    [monthExp]
  );

  const topCat = byCategory[0];
  const tipIndex = topCat ? EXPENSE_CATEGORIES.findIndex(c => c.value === topCat.key) % FUN_TIPS.length : 0;

  const filtered = useMemo(() =>
    monthExp.filter(e => {
      const matchS = !search || e.note.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase());
      const matchC = !selectedCat || e.category === selectedCat;
      return matchS && matchC;
    }).sort((a, b) => b.date.localeCompare(a.date)),
    [monthExp, search, selectedCat]
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">Expenses 💸</h1>
          <p className="text-sm text-[#9096B4]">{getMonthLabel(selectedMonth)}</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }}
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-white text-sm font-bold shadow-lg"
          style={{ background: 'linear-gradient(135deg, #FF6152, #E84545)' }}>
          <Plus size={15}/> Log
        </motion.button>
      </div>

      {/* Month nav + total hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}
        className="rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #FF6152 0%, #C93B2E 100%)' }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10" style={{ background: 'radial-gradient(circle,#fff,transparent)' }}/>
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Total Spent</p>
            <p className="text-4xl font-black">{formatCompact(total, currency)}</p>
          </div>
          <div className="flex items-center gap-1 bg-white/20 rounded-2xl px-2 py-1">
            <button onClick={() => go(-1)} className="p-1 text-white/70 hover:text-white"><ChevronLeft size={13}/></button>
            <span className="text-xs font-semibold text-white/80 min-w-[72px] text-center">{getMonthLabel(selectedMonth)}</span>
            <button onClick={() => go(1)} disabled={selectedMonth === getMonthKey()} className="p-1 text-white/70 hover:text-white disabled:opacity-30"><ChevronRight size={13}/></button>
          </div>
        </div>
        {topCat && (
          <div className="flex items-center gap-2 bg-white/15 rounded-2xl px-3 py-2 w-fit">
            <Flame size={13} className="text-orange-200"/>
            <span className="text-xs font-semibold text-white/90">{FUN_TIPS[tipIndex]}</span>
          </div>
        )}
        {monthExp.length === 0 && <p className="text-white/60 text-sm mt-1">Nothing logged yet ✨</p>}
      </motion.div>

      {/* View toggle */}
      <div className="flex gap-1.5 bg-white rounded-2xl p-1.5 border border-[#EEEDF5] shadow-sm w-fit">
        {VIEWS.map(v => (
          <motion.button key={v.id} onClick={() => setView(v.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === v.id ? 'text-white shadow-sm' : 'text-[#9096B4] hover:text-[#1A1A2E]'}`}
            style={view === v.id ? { background: 'linear-gradient(135deg, #FF6152, #C93B2E)' } : {}}
            whileTap={{ scale: 0.95 }}>
            <span>{v.emoji}</span> {v.label}
          </motion.button>
        ))}
      </div>

      {/* Chart / List area */}
      <AnimatePresence mode="wait">
        {byCategory.length === 0 && view !== 'list' ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white rounded-3xl border border-[#EEEDF5] p-16 text-center">
            <motion.p className="text-6xl mb-3" animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>💸</motion.p>
            <p className="text-[#9096B4] text-sm font-medium">No expenses this month</p>
            <p className="text-[#C0BFCC] text-xs mt-1">Your wallet is thriving 🌱</p>
          </motion.div>

        ) : view === 'donut' ? (
          /* ── DONUT ── */
          <motion.div key="donut" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl border border-[#EEEDF5] shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4" style={{ background: 'linear-gradient(135deg, #FFF5F4 0%, #F8F6FF 100%)' }}>
              <p className="text-xs font-bold uppercase tracking-widest text-[#9096B4] mb-0.5">Breakdown</p>
              <p className="text-2xl font-black text-[#1A1A2E]">{formatCompact(total, currency)}</p>
            </div>
            <div className="p-5 flex gap-5 items-center">
              {/* Donut */}
              <div className="relative shrink-0" style={{ width: 160, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={72}
                      paddingAngle={4} dataKey="value" animationBegin={0} animationDuration={1000} startAngle={90} endAngle={-270}>
                      {byCategory.map((entry, i) => (
                        <Cell key={i} fill={entry.color}
                          opacity={!selectedCat || selectedCat === entry.key ? 1 : 0.2}
                          strokeWidth={selectedCat === entry.key ? 3 : 0}
                          stroke={selectedCat === entry.key ? '#fff' : 'transparent'}/>
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip/>}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-0.5">
                  <span className="text-2xl">{selectedCat ? byCategory.find(c=>c.key===selectedCat)?.icon ?? topCat?.icon : topCat?.icon || '💸'}</span>
                  <span className="text-[11px] font-black text-[#1A1A2E]">
                    {selectedCat ? formatCompact(byCategory.find(c=>c.key===selectedCat)?.value ?? 0, currency) : formatCompact(total, currency)}
                  </span>
                  <span className="text-[9px] text-[#C0BFCC]">{selectedCat || 'total'}</span>
                </div>
              </div>
              {/* Legend */}
              <div className="flex-1 space-y-2 min-w-0">
                {byCategory.map((cat, i) => {
                  const pct = total > 0 ? (cat.value / total) * 100 : 0;
                  return (
                    <motion.button key={cat.key}
                      onClick={() => setSelectedCat(selectedCat === cat.key ? '' : cat.key)}
                      whileTap={{ scale: 0.97 }}
                      className={`w-full text-left rounded-xl px-2 py-1.5 transition-all ${selectedCat === cat.key ? 'bg-[#F8F6FF]' : 'hover:bg-[#FAFAF8]'}`}
                      style={{ opacity: !selectedCat || selectedCat === cat.key ? 1 : 0.45 }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{cat.icon}</span>
                          <span className="text-xs font-semibold text-[#1A1A2E] truncate max-w-[80px]">{cat.name}</span>
                        </div>
                        <span className="text-[10px] font-black shrink-0 ml-1" style={{ color: cat.color }}>{Math.round(pct)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#F0EEF8] overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: cat.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.9, delay: i * 0.07, ease: [0.16,1,0.3,1] }}/>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>

        ) : view === 'bars' ? (
          /* ── BARS ── */
          <motion.div key="bars" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl border border-[#EEEDF5] shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4" style={{ background: 'linear-gradient(135deg, #FFF5F4 0%, #F8F6FF 100%)' }}>
              <p className="text-xs font-bold uppercase tracking-widest text-[#9096B4] mb-0.5">By Category</p>
              <p className="text-2xl font-black text-[#1A1A2E]">{byCategory.length} categories</p>
            </div>
            <div className="p-5 space-y-4">
              {byCategory.map((cat, i) => {
                const pct = total > 0 ? (cat.value / total) * 100 : 0;
                return (
                  <motion.div key={cat.key}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07, ease: [0.16,1,0.3,1] }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ backgroundColor: `${cat.color}18` }}>
                          {cat.icon}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1A1A2E]">{cat.name}</p>
                          <p className="text-[10px] text-[#9096B4]">{Math.round(pct)}% of spending</p>
                        </div>
                      </div>
                      <span className="text-sm font-black" style={{ color: cat.color }}>{formatCompact(cat.value, currency)}</span>
                    </div>
                    <div className="h-3 rounded-full bg-[#F5F5F8] overflow-hidden">
                      <motion.div className="h-full rounded-full relative overflow-hidden"
                        style={{ backgroundColor: cat.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: i * 0.08, ease: [0.16,1,0.3,1] }}>
                        <div className="absolute inset-0 opacity-25"
                          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)' }}/>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
              <div className="flex gap-2 pt-1 flex-wrap">
                {byCategory.slice(0, 3).map((cat, i) => (
                  <div key={cat.key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: cat.color }}>
                    {['🥇','🥈','🥉'][i]} {cat.name}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        ) : (
          /* ── LIST ── */
          <motion.div key="list-outer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button onClick={() => setSelectedCat('')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${!selectedCat ? 'text-white' : 'bg-white border border-[#EEEDF5] text-[#9096B4]'}`}
                style={!selectedCat ? { background: '#1A1A2E' } : {}}>
                All {monthExp.length > 0 && `(${monthExp.length})`}
              </button>
              {byCategory.map(cat => (
                <button key={cat.key} onClick={() => setSelectedCat(selectedCat === cat.key ? '' : cat.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-all ${selectedCat === cat.key ? 'text-white' : 'bg-white border border-[#EEEDF5] text-[#9096B4]'}`}
                  style={selectedCat === cat.key ? { backgroundColor: cat.color } : {}}>
                  {cat.icon} {cat.key}
                </button>
              ))}
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search expenses..."
              className="w-full px-4 py-3 rounded-2xl border border-[#EEEDF5] bg-white text-sm text-[#1A1A2E] placeholder:text-[#C0BFCC] focus:outline-none focus:border-[#FF6152] shadow-sm"/>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction list — shows in list view OR when category filter active from donut */}
      {(view === 'list' || (view === 'donut' && selectedCat)) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-[#EEEDF5] shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">🔍</p>
              <p className="text-[#9096B4] text-sm">No expenses found</p>
            </div>
          ) : (
            <>
              <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-[#9096B4]">{filtered.length} transactions</p>
                <div className="flex items-center gap-1 text-xs text-[#FF6152] font-bold">
                  <TrendingDown size={12}/>
                  {formatCompact(filtered.reduce((s,e) => s+e.amount,0), currency)}
                </div>
              </div>
              <div className="divide-y divide-[#F5F5F8]">
                {filtered.map((exp, i) => {
                  const cat = EXPENSE_CATEGORIES.find(c => c.value === exp.category);
                  const color = CATEGORY_COLORS[exp.category] || '#9096B4';
                  const isExpanded = expandedId === exp.id;
                  return (
                    <motion.div key={exp.id}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}>
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : (exp.id ?? null))}
                        className="flex items-center gap-3 px-5 py-4 group hover:bg-[#FAFAF8] transition-colors cursor-pointer">
                        <motion.div whileHover={{ scale: 1.12, rotate: 4 }}
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm"
                          style={{ backgroundColor: `${color}15`, border: `1.5px solid ${color}25` }}>
                          {cat?.icon || '📦'}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#1A1A2E] truncate">{exp.note || exp.category}</p>
                          <p className="text-xs text-[#9096B4]">
                            <span className="font-semibold" style={{ color }}>{exp.category}</span>
                            {' · '}{new Date(exp.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {exp.tags?.includes('recurring') && <span className="ml-1.5 text-[#FFB547] font-bold">🔄</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#1A1A2E] text-sm">{formatCurrency(exp.amount, currency)}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setEditing(exp); setFormOpen(true); }}
                              className="p-1.5 rounded-xl hover:bg-[#F0EEFF] text-[#C0BFCC] hover:text-[#7B61FF]"><Edit2 size={13}/></button>
                            <button onClick={async () => { if (exp.id) { await deleteExpense(exp.id); toast('Removed 🗑️'); } }}
                              className="p-1.5 rounded-xl hover:bg-[#FFF0EE] text-[#C0BFCC] hover:text-[#FF6152]"><Trash2 size={13}/></button>
                          </div>
                        </div>
                      </div>
                      <AnimatePresence>
                        {isExpanded && exp.description && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden">
                            <div className="mx-5 mb-3 px-4 py-3 rounded-2xl bg-[#F8F8FC] border border-[#EEEDF5]">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-[#C0BFCC] mb-1">Note</p>
                              <p className="text-sm text-[#4A4A6A]">{exp.description}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </motion.div>
      )}

      <ExpenseForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(undefined); }} editing={editing}/>
    </div>
  );
}
