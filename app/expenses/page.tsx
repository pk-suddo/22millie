'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatCompact, getMonthKey, getMonthLabel, EXPENSE_CATEGORIES, CATEGORY_COLORS } from '@/lib/utils';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { useToast } from '@/components/ui/toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Flame, TrendingDown } from 'lucide-react';
import type { Expense } from '@/lib/db';

type View = 'donut' | 'bars' | 'list';

const VIEWS: { id: View; emoji: string; label: string }[] = [
  { id: 'donut', emoji: '🍩', label: 'Donut' },
  { id: 'bars',  emoji: '📊', label: 'Bars'  },
  { id: 'list',  emoji: '📋', label: 'List'  },
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
  const [view, setView] = useState<View>('donut');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | undefined>();
  const [selectedCat, setSelectedCat] = useState('');
  const [search, setSearch] = useState('');

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
        {monthExp.length === 0 && (
          <p className="text-white/60 text-sm mt-1">Nothing logged yet ✨</p>
        )}
      </motion.div>

      {/* View toggle — emoji pill tabs */}
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

      {/* Chart area */}
      <AnimatePresence mode="wait">
        {byCategory.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white rounded-3xl border border-[#EEEDF5] p-16 text-center">
            <motion.p className="text-6xl mb-3" animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>💸</motion.p>
            <p className="text-[#9096B4] text-sm font-medium">No expenses this month</p>
            <p className="text-[#C0BFCC] text-xs mt-1">Your wallet is thriving 🌱</p>
          </motion.div>

        ) : view === 'donut' ? (
          <motion.div key="donut" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl border border-[#EEEDF5] shadow-sm p-5">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Donut with center label */}
              <div className="relative shrink-0" style={{ width: 190, height: 190 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={82}
                      paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={900}>
                      {byCategory.map((entry, i) => (
                        <Cell key={i} fill={entry.color} strokeWidth={0}
                          opacity={!selectedCat || selectedCat === entry.key ? 1 : 0.2}/>
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip/>}/>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg">{topCat?.icon || '💸'}</span>
                  <span className="text-xs font-black text-[#1A1A2E]">{formatCompact(total, currency)}</span>
                  <span className="text-[9px] text-[#9096B4]">total</span>
                </div>
              </div>

              {/* Category legend with clickable bars */}
              <div className="flex-1 space-y-2 w-full">
                {byCategory.map((cat, i) => (
                  <motion.button key={cat.key} onClick={() => setSelectedCat(selectedCat === cat.key ? '' : cat.key)}
                    whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-2.5 text-left rounded-2xl px-3 py-2 transition-all ${selectedCat === cat.key ? 'ring-2' : 'hover:bg-[#FAFAF8]'}`}
                    style={selectedCat === cat.key ? { backgroundColor: `${cat.color}12` } : {}}>
                    <span className="text-lg w-6 text-center">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-[#1A1A2E] truncate">{cat.name}</span>
                        <span className="font-black ml-2 shrink-0" style={{ color: cat.color }}>{formatCompact(cat.value, currency)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#F5F5F8] overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: cat.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${total > 0 ? (cat.value / total) * 100 : 0}%` }}
                          transition={{ duration: 0.9, delay: i * 0.06, ease: 'easeOut' }}/>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

        ) : view === 'bars' ? (
          <motion.div key="bars" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl border border-[#EEEDF5] shadow-sm p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#9096B4] mb-4">Spending by category</p>
            <div style={{ height: Math.max(byCategory.length * 52, 200) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory} layout="vertical" margin={{ left: 8, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F8" horizontal={false}/>
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9096B4' }} tickFormatter={v => formatCompact(v, currency)} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#1A1A2E' }} width={90} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} animationBegin={0} animationDuration={900}>
                    {byCategory.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Fun rank badges */}
            <div className="flex gap-2 mt-4 flex-wrap">
              {byCategory.slice(0, 3).map((cat, i) => (
                <div key={cat.key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: cat.color }}>
                  {['🥇','🥈','🥉'][i]} {cat.name}
                </div>
              ))}
            </div>
          </motion.div>

        ) : (
          /* LIST VIEW */
          <motion.div key="list-outer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Category filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scroll-x">
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

            {/* Search */}
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search expenses..."
              className="w-full px-4 py-3 rounded-2xl border border-[#EEEDF5] bg-white text-sm text-[#1A1A2E] placeholder:text-[#C0BFCC] focus:outline-none focus:border-[#FF6152] shadow-sm"/>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction list — shows in list view OR when category filter active */}
      {(view === 'list' || selectedCat) && (
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
                  return (
                    <motion.div key={exp.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 px-5 py-4 group hover:bg-[#FAFAF8] transition-colors">
                      <motion.div whileHover={{ scale: 1.15, rotate: 5 }}
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm"
                        style={{ backgroundColor: `${color}18`, border: `1.5px solid ${color}30` }}>
                        {cat?.icon || '📦'}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1A1A2E] truncate">{exp.note || exp.category}</p>
                        <p className="text-xs text-[#9096B4]">
                          <span className="font-medium" style={{ color }}>{exp.category}</span>
                          {' · '}{new Date(exp.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[#1A1A2E] text-sm">{formatCurrency(exp.amount, currency)}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditing(exp); setFormOpen(true); }}
                            className="p-1.5 rounded-xl hover:bg-[#F0EEFF] text-[#C0BFCC] hover:text-[#7B61FF]"><Edit2 size={13}/></button>
                          <button onClick={async () => { if (exp.id) { await deleteExpense(exp.id); toast('Removed 🗑️'); } }}
                            className="p-1.5 rounded-xl hover:bg-[#FFF0EE] text-[#C0BFCC] hover:text-[#FF6152]"><Trash2 size={13}/></button>
                        </div>
                      </div>
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
