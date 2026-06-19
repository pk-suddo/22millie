'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatCompact, getMonthKey, getMonthLabel, EXPENSE_CATEGORIES, CATEGORY_COLORS } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { IncomeForm } from '@/components/income/IncomeForm';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { GoalForm } from '@/components/goals/GoalForm';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { ChevronLeft, ChevronRight, Plus, Edit2, MessageCircle } from 'lucide-react';
import { CalendarPopover } from '@/components/ui/CalendarPopover';
import Link from 'next/link';

/* ── Month Nav ─────────────────────────────────────────────── */
function MonthNav() {
  const { selectedMonth, setSelectedMonth } = useStore();
  const go = (d: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    setSelectedMonth(getMonthKey(new Date(y, m - 1 + d, 1)));
  };
  return (
    <div className="flex items-center gap-1.5 bg-white rounded-2xl px-2 py-1.5 shadow-sm border border-[#EEEDF5]">
      <button onClick={() => go(-1)} className="p-1 rounded-xl hover:bg-gray-50 text-[#9096B4]"><ChevronLeft size={15}/></button>
      <span className="text-sm font-semibold text-[#1A1A2E] min-w-[110px] text-center">{getMonthLabel(selectedMonth)}</span>
      <button onClick={() => go(1)} disabled={selectedMonth === getMonthKey()} className="p-1 rounded-xl hover:bg-gray-50 text-[#9096B4] disabled:opacity-30"><ChevronRight size={15}/></button>
    </div>
  );
}

/* ── Hero Networth Card ─────────────────────────────────────── */
function NetworthHero() {
  const { income, expenses } = useStore();
  const allIncome  = income.reduce((s, i) => s + i.amount, 0);
  const allExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const networth = allIncome - allExpenses;
  const currency = useStore(s => s.profile?.currency) || 'NPR';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-3xl overflow-hidden p-7 text-white"
      style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 55%, #0F3460 100%)' }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #7B61FF, transparent)' }} />
      <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #00C896, transparent)' }} />

      <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 mb-3">Net Worth</p>
      <div className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
        <AnimatedNumber
          value={networth}
          formatter={(n) => `${currency} ${n.toLocaleString()}`}
        />
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1 bg-[#00C896]/20 text-[#00E5B0] text-xs font-semibold px-3 py-1.5 rounded-full">
          ↑ All time savings
        </span>
        <span className="text-white/30 text-xs">{income.length} income entries</span>
      </div>
    </motion.div>
  );
}

/* ── Metric Tile ────────────────────────────────────────────── */
function MetricTile({ label, value, icon, gradient, delay }: { label: string; value: number | string; icon: string; gradient: string; delay: number }) {
  const currency = useStore(s => s.profile?.currency) || 'NPR';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-5 text-white relative overflow-hidden"
      style={{ background: gradient }}
    >
      <div className="absolute top-3 right-3 text-2xl opacity-80">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">{label}</p>
      {typeof value === 'number' ? (
        <AnimatedNumber
          value={value}
          formatter={(n) => formatCompact(n, currency)}
          className="text-2xl font-bold"
        />
      ) : (
        <span className="text-2xl font-bold">{value}</span>
      )}
    </motion.div>
  );
}

/* ── Flow Bar ────────────────────────────────────────────────── */
function FlowBar({ income, expenses }: { income: number; expenses: number }) {
  const currency = useStore(s => s.profile?.currency) || 'NPR';
  const total = income || 1;
  const expPct = Math.min((expenses / total) * 100, 100);
  const savePct = Math.max(100 - expPct, 0);
  const savings = income - expenses;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-2xl p-5 border border-[#EEEDF5] shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-[#1A1A2E]">Cash Flow</p>
        <span className="text-xs text-[#9096B4]">{getMonthLabel(useStore.getState().selectedMonth)}</span>
      </div>

      {/* Bar */}
      <div className="h-4 rounded-full overflow-hidden bg-[#F5F5F8] mb-4 flex">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #00C896, #00E5B0)' }}
          initial={{ width: 0 }}
          animate={{ width: `${savePct}%` }}
          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
        />
        <motion.div
          className="h-full"
          style={{ background: 'linear-gradient(90deg, #FF6152, #FF8C73)' }}
          initial={{ width: 0 }}
          animate={{ width: `${expPct}%` }}
          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
        />
      </div>

      <div className="flex justify-between text-sm">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#00C896' }}/>
            <span className="text-[#9096B4] text-xs">Saved</span>
          </div>
          <span className="font-bold text-[#1A1A2E]">{formatCompact(savings, currency)}</span>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black" style={{ color: savings >= 0 ? '#00C896' : '#FF6152' }}>
            {income > 0 ? Math.round(savePct) : 0}%
          </div>
          <div className="text-xs text-[#9096B4]">savings rate</div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 mb-0.5 justify-end">
            <span className="text-[#9096B4] text-xs">Spent</span>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF6152' }}/>
          </div>
          <span className="font-bold text-[#1A1A2E]">{formatCompact(expenses, currency)}</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Spending Ring ──────────────────────────────────────────── */
function SpendingRings() {
  const { expenses, selectedMonth } = useStore();
  const currency = useStore(s => s.profile?.currency) || 'NPR';
  const monthExp = expenses.filter(e => e.date.startsWith(selectedMonth));
  const total = monthExp.reduce((s, e) => s + e.amount, 0);

  const byCategory = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    value: monthExp.filter(e => e.category === cat.value).reduce((s, e) => s + e.amount, 0),
    color: CATEGORY_COLORS[cat.value],
  })).filter(c => c.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);

  if (byCategory.length === 0) return (
    <div className="bg-white rounded-2xl p-5 border border-[#EEEDF5] text-center py-10 text-[#9096B4] text-sm">
      No expenses logged this month
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-2xl p-5 border border-[#EEEDF5] shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-[#1A1A2E]">Top Spending</p>
        <Link href="/expenses" className="text-xs font-semibold text-[#7B61FF] hover:opacity-70">See all →</Link>
      </div>
      <div className="space-y-3">
        {byCategory.map((cat, i) => (
          <motion.div
            key={cat.value}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.07 }}
            className="flex items-center gap-3"
          >
            <span className="text-xl w-8 shrink-0 text-center">{cat.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-[#1A1A2E] font-medium">{cat.label}</span>
                <span className="text-sm font-bold text-[#1A1A2E]">{formatCompact(cat.value, currency)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#F5F5F8] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: cat.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${total > 0 ? (cat.value / total) * 100 : 0}%` }}
                  transition={{ duration: 0.8, delay: 0.55 + i * 0.07, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Goals Strip ────────────────────────────────────────────── */
function GoalStrip() {
  const { goals } = useStore();
  const currency = useStore(s => s.profile?.currency) || 'NPR';
  const active = goals.filter(g => !g.achieved);
  if (active.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-[#1A1A2E]">Goals</p>
        <Link href="/goals" className="text-xs font-semibold text-[#7B61FF] hover:opacity-70">Manage →</Link>
      </div>
      <div className="scroll-x flex gap-3 pb-1">
        {active.map(goal => {
          const pct = Math.min((goal.currentSaved / goal.targetAmount) * 100, 100);
          const size = 56;
          const r = (size - 6) / 2;
          const circ = 2 * Math.PI * r;
          return (
            <Link key={goal.id} href="/goals">
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="bg-white rounded-2xl p-4 border border-[#EEEDF5] shadow-sm flex flex-col items-center gap-2 min-w-[100px] cursor-pointer"
              >
                <div className="relative" style={{ width: size, height: size }}>
                  <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F0EEF8" strokeWidth={5}/>
                    <motion.circle
                      cx={size/2} cy={size/2} r={r} fill="none"
                      stroke="#7B61FF" strokeWidth={5} strokeLinecap="round"
                      strokeDasharray={circ}
                      initial={{ strokeDashoffset: circ }}
                      animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
                      transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xl">{goal.emoji}</div>
                </div>
                <p className="text-xs font-semibold text-[#1A1A2E] text-center leading-tight max-w-[80px] truncate">{goal.name}</p>
                <p className="text-xs text-[#9096B4]">{Math.round(pct)}%</p>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ── Recent Transactions ────────────────────────────────────── */
function RecentActivity() {
  const { income, expenses, selectedMonth } = useStore();
  const currency = useStore(s => s.profile?.currency) || 'NPR';

  const items = [
    ...expenses.filter(e => e.date.startsWith(selectedMonth)).map(e => ({
      id: `e-${e.id}`, type: 'expense' as const, amount: e.amount,
      label: e.note || e.category, date: e.date,
      icon: EXPENSE_CATEGORIES.find(c => c.value === e.category)?.icon || '📦',
      color: CATEGORY_COLORS[e.category] || '#9096B4',
    })),
    ...income.filter(i => i.date.startsWith(selectedMonth)).map(i => ({
      id: `i-${i.id}`, type: 'income' as const, amount: i.amount,
      label: i.name, date: i.date, icon: '💰', color: '#00C896',
    })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.58, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-2xl border border-[#EEEDF5] shadow-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <p className="text-sm font-bold text-[#1A1A2E]">Recent</p>
        <Link href="/expenses" className="text-xs font-semibold text-[#7B61FF] hover:opacity-70">All →</Link>
      </div>
      <div className="divide-y divide-[#F5F5F8]">
        {items.map((tx, i) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.62 + i * 0.05 }}
            className="flex items-center gap-3 px-5 py-3"
          >
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-base shrink-0"
              style={{ backgroundColor: `${tx.color}18` }}>
              {tx.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A1A2E] truncate">{tx.label}</p>
              <p className="text-xs text-[#9096B4]">{new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            </div>
            <span className="text-sm font-bold shrink-0" style={{ color: tx.type === 'income' ? '#00C896' : '#1A1A2E' }}>
              {tx.type === 'income' ? '+' : '-'}{formatCompact(tx.amount, currency)}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── FAB ────────────────────────────────────────────────────── */
function QuickAddFAB({ onIncome, onExpense, onGoal }: { onIncome: () => void; onExpense: () => void; onGoal: () => void }) {
  const [open, setOpen] = useState(false);
  const items = [
    { label: 'Income', icon: '💰', color: '#00C896', action: onIncome },
    { label: 'Expense', icon: '💸', color: '#FF6152', action: onExpense },
    { label: 'Goal', icon: '🎯', color: '#7B61FF', action: onGoal },
  ];
  return (
    <div className="fixed bottom-8 right-6 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && items.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => { item.action(); setOpen(false); }}
            className="flex items-center gap-2 pr-4 pl-3 py-2.5 rounded-2xl text-white text-sm font-semibold shadow-lg"
            style={{ backgroundColor: item.color }}
          >
            <span className="text-base">{item.icon}</span>{item.label}
          </motion.button>
        ))}
      </AnimatePresence>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-2xl text-white text-2xl flex items-center justify-center shadow-xl"
        style={{ background: 'linear-gradient(135deg, #7B61FF, #FF6152)' }}
      >
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>+</motion.span>
      </motion.button>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { income, expenses, selectedMonth, profile, updateProfile, toggleAIChat, isLoading } = useStore();
  const { toast } = useToast();
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', quote: '' });
  const currency = profile?.currency || 'NPR';

  const monthIncome   = useMemo(() => income.filter(i => i.date.startsWith(selectedMonth)).reduce((s, i) => s + i.amount, 0), [income, selectedMonth]);
  const monthExpenses = useMemo(() => expenses.filter(e => e.date.startsWith(selectedMonth)).reduce((s, e) => s + e.amount, 0), [expenses, selectedMonth]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen">
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: 'linear-gradient(135deg, #7B61FF, #FF6152)' }}>
        ✦
      </motion.div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => { setProfileForm({ name: profile?.name || '', quote: profile?.quote || '' }); setEditProfileOpen(true); }}
            className="flex items-center gap-2 group">
            <h1 className="text-xl font-bold text-[#1A1A2E]">
              {profile?.name ? `Hi, ${profile.name.split(' ')[0]} 👋` : 'Calm Finance 👋'}
            </h1>
            <Edit2 size={12} className="text-[#CCCCDD] group-hover:text-[#7B61FF] transition-colors"/>
          </button>
          {profile?.quote && <p className="text-xs text-[#9096B4] mt-0.5 italic">{profile.quote}</p>}
        </div>
        <div className="flex items-center gap-2">
          <MonthNav />
          <CalendarPopover />
          <button onClick={toggleAIChat} className="w-9 h-9 rounded-xl bg-white border border-[#EEEDF5] flex items-center justify-center text-[#7B61FF] hover:bg-[#F0EEFF] transition-colors shadow-sm">
            <MessageCircle size={16}/>
          </button>
        </div>
      </div>

      <NetworthHero />

      {/* 3 Metric Tiles */}
      <div className="grid grid-cols-3 gap-3">
        <MetricTile label="Income" value={monthIncome} icon="💰"
          gradient="linear-gradient(135deg, #00C896 0%, #00A876 100%)" delay={0.18}/>
        <MetricTile label="Spent" value={monthExpenses} icon="💸"
          gradient="linear-gradient(135deg, #FF6152 0%, #E84545 100%)" delay={0.24}/>
        <MetricTile label="Rate" value={`${monthIncome > 0 ? Math.round(((monthIncome - monthExpenses) / monthIncome) * 100) : 0}%`} icon="📈"
          gradient="linear-gradient(135deg, #7B61FF 0%, #5B41CF 100%)" delay={0.30}/>
      </div>

      <FlowBar income={monthIncome} expenses={monthExpenses}/>
      <SpendingRings />
      <GoalStrip />
      <RecentActivity />

      {/* Modals */}
      <IncomeForm open={incomeOpen} onClose={() => setIncomeOpen(false)}/>
      <ExpenseForm open={expenseOpen} onClose={() => setExpenseOpen(false)}/>
      <GoalForm open={goalOpen} onClose={() => setGoalOpen(false)}/>
      <Modal open={editProfileOpen} onClose={() => setEditProfileOpen(false)} title="Your Profile">
        <div className="space-y-4">
          <Input label="Name" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} placeholder="Your name"/>
          <Input label="Quote" value={profileForm.quote} onChange={e => setProfileForm({ ...profileForm, quote: e.target.value })} placeholder="A personal motto..."/>
          <button onClick={async () => { await updateProfile(profileForm); toast('Profile updated'); setEditProfileOpen(false); }}
            className="w-full py-3 rounded-2xl text-white font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg, #7B61FF, #5B41CF)' }}>
            Save
          </button>
        </div>
      </Modal>

      <QuickAddFAB onIncome={() => setIncomeOpen(true)} onExpense={() => setExpenseOpen(true)} onGoal={() => setGoalOpen(true)}/>
    </div>
  );
}
