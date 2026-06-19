'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDateShort, monthlySavingsNeeded, monthsUntil, EXPENSE_CATEGORIES, getLocalToday } from '@/lib/utils';
import { GoalForm } from '@/components/goals/GoalForm';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Plus, X, Trash2, Check, RefreshCw, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { Goal, BorrowLend } from '@/lib/db';

/* ── Progress Ring ─────────────────────────────────────────── */
function Ring({ pct, size = 80, color = '#7B61FF' }: { pct: number; size?: number; color?: string }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F0EEF8" strokeWidth={7}/>
      <motion.circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={7} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (Math.min(pct, 100) / 100) * circ }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />
    </svg>
  );
}

/* ── Borrow & Lend Drawer ───────────────────────────────────── */
function BorrowLendDrawer({ onClose }: { onClose: () => void }) {
  const { borrowLends, addBorrowLend, deleteBorrowLend, logBLPayment } = useStore();
  const { toast } = useToast();
  const currency = useStore(s => s.profile?.currency) || 'NPR';

  const [adding, setAdding] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payAmt, setPayAmt] = useState('');
  const [form, setForm] = useState({
    name: '',
    direction: 'borrowed' as 'borrowed' | 'lent',
    totalAmount: '',
    monthlyPayment: '',
    startDate: getLocalToday(),
    note: '',
  });

  const active = borrowLends.filter(b => b.paidAmount < b.totalAmount);
  const settled = borrowLends.filter(b => b.paidAmount >= b.totalAmount);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.totalAmount) return;
    await addBorrowLend({
      name: form.name.trim(),
      direction: form.direction,
      totalAmount: parseFloat(form.totalAmount),
      paidAmount: 0,
      monthlyPayment: parseFloat(form.monthlyPayment) || 0,
      startDate: form.startDate,
      note: form.note,
    });
    toast(`${form.direction === 'borrowed' ? 'Borrowed' : 'Lent'} from ${form.name} recorded`);
    setForm({ name: '', direction: 'borrowed', totalAmount: '', monthlyPayment: '', startDate: getLocalToday(), note: '' });
    setAdding(false);
  };

  const handleLogPayment = async (id: number) => {
    const n = parseFloat(payAmt);
    if (!n || n <= 0) return;
    await logBLPayment(id, n);
    toast(`Payment of ${formatCurrency(n, currency)} logged`);
    setPayingId(null);
    setPayAmt('');
  };

  const monthsLeft = (b: BorrowLend) => {
    const remaining = b.totalAmount - b.paidAmount;
    if (b.monthlyPayment <= 0 || remaining <= 0) return null;
    return Math.ceil(remaining / b.monthlyPayment);
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}/>
      <motion.div
        className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[92vh] flex flex-col"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#F5F5F8]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1A1A2E]">Borrow & Lend 💸</h2>
              <p className="text-sm text-[#9096B4]">Track money you owe or are owed</p>
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => setAdding(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #7B61FF, #5B41CF)' }}>
                <Plus size={14}/> Add
              </motion.button>
              <button onClick={onClose} className="p-2 rounded-xl bg-[#F5F5F8] text-[#9096B4]"><X size={16}/></button>
            </div>
          </div>

          {/* Summary pills */}
          {borrowLends.length > 0 && (
            <div className="flex gap-2 mt-3">
              {(() => {
                const totalBorrowed = borrowLends.filter(b => b.direction === 'borrowed').reduce((s, b) => s + (b.totalAmount - b.paidAmount), 0);
                const totalLent = borrowLends.filter(b => b.direction === 'lent').reduce((s, b) => s + (b.totalAmount - b.paidAmount), 0);
                return (
                  <>
                    {totalBorrowed > 0 && (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FFF0EE] text-[#FF6152] text-xs font-semibold">
                        <ArrowDownLeft size={11}/> Owe {formatCurrency(totalBorrowed, currency)}
                      </span>
                    )}
                    {totalLent > 0 && (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#E8FBF6] text-[#00C896] text-xs font-semibold">
                        <ArrowUpRight size={11}/> Owed {formatCurrency(totalLent, currency)}
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Add form */}
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="border-b border-[#F5F5F8] overflow-hidden">
              <div className="px-6 py-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[#9096B4]">New Entry</p>

                {/* Direction toggle */}
                <div className="flex gap-2">
                  {(['borrowed', 'lent'] as const).map(dir => (
                    <button key={dir} type="button"
                      onClick={() => setForm(f => ({ ...f, direction: dir }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        form.direction === dir
                          ? dir === 'borrowed'
                            ? 'bg-[#FFF0EE] border-[#FF6152] text-[#FF6152]'
                            : 'bg-[#E8FBF6] border-[#00C896] text-[#00C896]'
                          : 'bg-white border-[#E8E5E0] text-[#9096B4]'
                      }`}>
                      {dir === 'borrowed' ? <><ArrowDownLeft size={14}/> I Borrowed</> : <><ArrowUpRight size={14}/> I Lent</>}
                    </button>
                  ))}
                </div>

                <Input label="Person / Place" placeholder="e.g. Aarav, Bank, Rohan"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />

                <div className="grid grid-cols-2 gap-2">
                  <Input label="Total Amount" type="number" placeholder="0"
                    value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} />
                  <Input label="Monthly Repayment" type="number" placeholder="0 (optional)"
                    value={form.monthlyPayment} onChange={e => setForm(f => ({ ...f, monthlyPayment: e.target.value }))} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input label="Start Date" type="date"
                    value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                  <Input label="Note" placeholder="Optional"
                    value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setAdding(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#F5F5F8] text-[#9096B4] text-sm font-semibold">Cancel</button>
                  <button onClick={handleAdd}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, #7B61FF, #5B41CF)' }}>Save</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {borrowLends.length === 0 && !adding && (
            <div className="text-center py-14">
              <p className="text-4xl mb-3">💸</p>
              <p className="text-sm text-[#9096B4]">No entries yet</p>
              <p className="text-xs text-[#C0BFCC] mt-1">Track money you borrowed or lent</p>
            </div>
          )}

          {active.map((b, i) => {
            const remaining = b.totalAmount - b.paidAmount;
            const pct = (b.paidAmount / b.totalAmount) * 100;
            const ml = monthsLeft(b);
            const isBorrowed = b.direction === 'borrowed';

            return (
              <motion.div key={b.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#FAFAF8] rounded-2xl p-4 border border-[#F0EDE8]">

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${isBorrowed ? 'bg-[#FFF0EE]' : 'bg-[#E8FBF6]'}`}>
                      {isBorrowed ? '⬇️' : '⬆️'}
                    </div>
                    <div>
                      <p className="font-bold text-[#1A1A2E] text-sm">{b.name}</p>
                      <p className={`text-xs font-semibold ${isBorrowed ? 'text-[#FF6152]' : 'text-[#00C896]'}`}>
                        {isBorrowed ? 'I borrowed' : 'I lent'} · {formatDateShort(b.startDate)}
                      </p>
                    </div>
                  </div>
                  <button onClick={async () => { if (confirm('Remove this entry?')) await deleteBorrowLend(b.id!); }}
                    className="p-1.5 rounded-lg hover:bg-[#FFF0EE] text-[#C0BFCC] hover:text-[#FF6152] transition-colors">
                    <Trash2 size={13}/>
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#9096B4]">Paid {formatCurrency(b.paidAmount, currency)}</span>
                    <span className="font-semibold text-[#1A1A2E]">{formatCurrency(remaining, currency)} left</span>
                  </div>
                  <div className="h-2 bg-[#F0EDE8] rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      style={{ backgroundColor: isBorrowed ? '#FF6152' : '#00C896' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}/>
                  </div>
                </div>

                {/* Footer info + log payment */}
                <div className="flex items-center justify-between mt-2.5">
                  <div className="flex gap-3 text-xs text-[#9096B4]">
                    {b.monthlyPayment > 0 && (
                      <span>{formatCurrency(b.monthlyPayment, currency)}/mo</span>
                    )}
                    {ml !== null && (
                      <span>~{ml} month{ml !== 1 ? 's' : ''} left</span>
                    )}
                    {b.note && <span className="italic truncate max-w-[100px]">{b.note}</span>}
                  </div>

                  {payingId === b.id ? (
                    <div className="flex items-center gap-1.5">
                      <input type="number" placeholder="Amount" value={payAmt}
                        onChange={e => setPayAmt(e.target.value)}
                        className="w-24 px-2 py-1 rounded-lg border border-[#EEEDF5] text-xs text-[#1A1A2E] focus:outline-none focus:border-[#7B61FF]"
                        autoFocus onKeyDown={e => e.key === 'Enter' && handleLogPayment(b.id!)}/>
                      <button onClick={() => handleLogPayment(b.id!)}
                        className="px-2.5 py-1 rounded-lg text-white text-xs font-semibold"
                        style={{ background: '#7B61FF' }}>✓</button>
                      <button onClick={() => { setPayingId(null); setPayAmt(''); }}
                        className="px-2 py-1 rounded-lg bg-[#F5F5F8] text-[#9096B4] text-xs">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => { setPayingId(b.id!); setPayAmt(b.monthlyPayment > 0 ? b.monthlyPayment.toString() : ''); }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isBorrowed ? 'bg-[#FFF0EE] text-[#FF6152] hover:bg-[#FFE0DC]' : 'bg-[#E8FBF6] text-[#00C896] hover:bg-[#C0F5E8]'
                      }`}>
                      <Check size={11}/> Log payment
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}

          {settled.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#9096B4] mb-2 mt-2">Settled ✓</p>
              {settled.map(b => (
                <div key={b.id} className="flex items-center gap-3 py-2.5 border-b border-[#F5F5F8] last:border-0 opacity-50">
                  <span className="text-base">{b.direction === 'borrowed' ? '⬇️' : '⬆️'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A1A2E] line-through truncate">{b.name}</p>
                  </div>
                  <span className="text-xs text-[#9096B4]">{formatCurrency(b.totalAmount, currency)}</span>
                  <button onClick={() => deleteBorrowLend(b.id!)}
                    className="text-[#C0BFCC] hover:text-[#FF6152] transition-colors">
                    <X size={13}/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Goal Detail Drawer ─────────────────────────────────────── */
function GoalDrawer({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { goalDeposits, addGoalDeposit, updateGoal, deleteGoal, addExpense } = useStore();
  const { toast } = useToast();
  const currency = useStore(s => s.profile?.currency) || 'NPR';

  const [tab, setTab] = useState<'deposit' | 'recurring'>('deposit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);

  const [recAmount, setRecAmount] = useState('');
  const [recCategory, setRecCategory] = useState('Other');
  const [recNote, setRecNote] = useState('');
  const [addingRec, setAddingRec] = useState(false);

  const deposits = goalDeposits.filter(d => d.goalId === goal.id).sort((a, b) => b.date.localeCompare(a.date));
  const pct = Math.min((goal.currentSaved / goal.targetAmount) * 100, 100);
  const monthly = monthlySavingsNeeded(goal.targetAmount, goal.currentSaved, goal.targetDate);
  const months = monthsUntil(goal.targetDate);
  const remaining = goal.targetAmount - goal.currentSaved;
  const ringColor = pct >= 100 ? '#00C896' : pct >= 60 ? '#7B61FF' : pct >= 30 ? '#FFB547' : '#FF6152';

  const handleAddDeposit = async () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    await addGoalDeposit(goal.id!, n, note || undefined);
    toast(`Added ${formatCurrency(n, currency)} 🎉`);
    setAmount(''); setNote(''); setAdding(false);
  };

  const handleAddRecurring = async () => {
    const n = parseFloat(recAmount);
    if (!n || n <= 0) return;
    await addExpense({
      amount: n,
      category: recCategory,
      date: getLocalToday(),
      note: recNote || `${goal.name} — recurring`,
      tags: ['recurring'],
    });
    toast(`Recurring payment of ${formatCurrency(n, currency)} logged 🔄`);
    setRecAmount(''); setRecNote(''); setAddingRec(false);
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}/>
      <motion.div
        className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[92vh] flex flex-col"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}>

        <div className="px-6 pt-6 pb-4 border-b border-[#F5F5F8]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Ring pct={pct} size={72} color={ringColor}/>
                <div className="absolute inset-0 flex items-center justify-center text-2xl">{goal.emoji}</div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1A1A2E]">{goal.name}</h2>
                <p className="text-sm text-[#9096B4]">{Math.round(pct)}% complete</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {pct >= 100 && (
                <button onClick={async () => { await updateGoal(goal.id!, { achieved: true }); toast('🎉 Goal achieved!'); onClose(); }}
                  className="p-2 rounded-xl bg-[#E8FBF6] text-[#00C896]"><Check size={16}/></button>
              )}
              <button onClick={async () => { if (confirm('Remove this goal?')) { await deleteGoal(goal.id!); onClose(); } }}
                className="p-2 rounded-xl bg-[#FFF0EE] text-[#FF6152]"><Trash2 size={14}/></button>
              <button onClick={onClose} className="p-2 rounded-xl bg-[#F5F5F8] text-[#9096B4]"><X size={16}/></button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Saved', value: formatCurrency(goal.currentSaved, currency) },
              { label: 'Remaining', value: formatCurrency(Math.max(remaining, 0), currency) },
              { label: months > 0 ? `${months}mo left` : 'Overdue', value: monthly > 0 ? `${formatCurrency(monthly, currency)}/mo` : '🎉' },
            ].map(stat => (
              <div key={stat.label} className="bg-[#F8F8FC] rounded-2xl p-3 text-center">
                <p className="text-xs text-[#9096B4] mb-0.5">{stat.label}</p>
                <p className="text-xs font-bold text-[#1A1A2E] leading-tight">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-1 px-6 pt-4 pb-0">
          <button onClick={() => setTab('deposit')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'deposit' ? 'text-white' : 'text-[#9096B4] hover:bg-[#F5F5F8]'}`}
            style={tab === 'deposit' ? { background: 'linear-gradient(135deg, #7B61FF, #5B41CF)' } : {}}>
            💰 Add Savings
          </button>
          <button onClick={() => setTab('recurring')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${tab === 'recurring' ? 'text-white' : 'text-[#9096B4] hover:bg-[#F5F5F8]'}`}
            style={tab === 'recurring' ? { background: 'linear-gradient(135deg, #FFB547, #E09030)' } : {}}>
            <RefreshCw size={13}/> Recurring
          </button>
        </div>

        <div className="px-6 py-4 border-b border-[#F5F5F8]">
          <AnimatePresence mode="wait">
            {tab === 'deposit' ? (
              <motion.div key="deposit" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <AnimatePresence mode="wait">
                  {adding ? (
                    <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                      <div className="flex gap-2">
                        <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)}
                          className="flex-1 px-3 py-2.5 rounded-xl border border-[#EEEDF5] bg-[#FAFAF8] text-sm text-[#1A1A2E] placeholder:text-[#C0BFCC] focus:outline-none focus:border-[#7B61FF]"
                          autoFocus/>
                        <input type="text" placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)}
                          className="flex-1 px-3 py-2.5 rounded-xl border border-[#EEEDF5] bg-[#FAFAF8] text-sm text-[#1A1A2E] placeholder:text-[#C0BFCC] focus:outline-none focus:border-[#7B61FF]"
                          onKeyDown={e => e.key === 'Enter' && handleAddDeposit()}/>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setAdding(false)} className="flex-1 py-2.5 rounded-xl bg-[#F5F5F8] text-[#9096B4] text-sm font-semibold">Cancel</button>
                        <button onClick={handleAddDeposit} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #7B61FF, #5B41CF)' }}>Save</button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      onClick={() => setAdding(true)}
                      className="w-full py-3 rounded-2xl border-2 border-dashed border-[#EEEDF5] text-[#7B61FF] text-sm font-semibold hover:border-[#7B61FF]/50 hover:bg-[#F8F6FF] transition-colors flex items-center justify-center gap-2">
                      <Plus size={15}/> Add deposit
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div key="recurring" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <p className="text-xs text-[#9096B4] mb-3">Log a recurring payment for this goal — it will appear in Expenses with a 🔄 tag.</p>
                <AnimatePresence mode="wait">
                  {addingRec ? (
                    <motion.div key="rec-form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                      <div className="flex gap-2">
                        <input type="number" placeholder="Amount" value={recAmount} onChange={e => setRecAmount(e.target.value)}
                          className="flex-1 px-3 py-2.5 rounded-xl border border-[#EEEDF5] bg-[#FAFAF8] text-sm text-[#1A1A2E] placeholder:text-[#C0BFCC] focus:outline-none focus:border-[#FFB547]"
                          autoFocus/>
                        <select value={recCategory} onChange={e => setRecCategory(e.target.value)}
                          className="flex-1 px-3 py-2.5 rounded-xl border border-[#EEEDF5] bg-[#FAFAF8] text-sm text-[#1A1A2E] focus:outline-none focus:border-[#FFB547]">
                          {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                        </select>
                      </div>
                      <input type="text" placeholder={`Note (default: ${goal.name} — recurring)`} value={recNote} onChange={e => setRecNote(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#EEEDF5] bg-[#FAFAF8] text-sm text-[#1A1A2E] placeholder:text-[#C0BFCC] focus:outline-none focus:border-[#FFB547]"
                        onKeyDown={e => e.key === 'Enter' && handleAddRecurring()}/>
                      <div className="flex gap-2">
                        <button onClick={() => setAddingRec(false)} className="flex-1 py-2.5 rounded-xl bg-[#F5F5F8] text-[#9096B4] text-sm font-semibold">Cancel</button>
                        <button onClick={handleAddRecurring} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #FFB547, #E09030)' }}>Log Payment</button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button key="rec-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      onClick={() => setAddingRec(true)}
                      className="w-full py-3 rounded-2xl border-2 border-dashed border-[#FFE0A0] text-[#E09030] text-sm font-semibold hover:border-[#FFB547] hover:bg-[#FFFBF0] transition-colors flex items-center justify-center gap-2">
                      <RefreshCw size={14}/> Log recurring payment
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#9096B4] mb-3">Deposit History</p>
          {deposits.length === 0 ? (
            <p className="text-sm text-[#C0BFCC] text-center py-6">No deposits yet</p>
          ) : (
            <div className="space-y-2">
              {deposits.map((d, i) => (
                <motion.div key={d.id}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 py-2.5 border-b border-[#F5F5F8] last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7B61FF] shrink-0 mt-0.5"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A1A2E]">+{formatCurrency(d.amount, currency)}</p>
                    {d.note && <p className="text-xs text-[#9096B4] truncate">{d.note}</p>}
                  </div>
                  <span className="text-xs text-[#C0BFCC] shrink-0">{formatDateShort(d.date)}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Goal Card ──────────────────────────────────────────────── */
function GoalCard({ goal, onClick }: { goal: Goal; onClick: () => void }) {
  const currency = useStore(s => s.profile?.currency) || 'NPR';
  const pct = Math.min((goal.currentSaved / goal.targetAmount) * 100, 100);
  const ringColor = pct >= 100 ? '#00C896' : pct >= 60 ? '#7B61FF' : pct >= 30 ? '#FFB547' : '#FF6152';

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-3xl p-5 border border-[#EEEDF5] shadow-sm cursor-pointer flex flex-col items-center gap-3 relative overflow-hidden">
      {pct >= 100 && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#E8FBF6] flex items-center justify-center">
          <span className="text-xs">✓</span>
        </div>
      )}
      <div className="relative">
        <Ring pct={pct} size={88} color={ringColor}/>
        <div className="absolute inset-0 flex items-center justify-center text-3xl">{goal.emoji}</div>
      </div>
      <div className="text-center">
        <p className="font-bold text-[#1A1A2E] text-sm leading-snug mb-1">{goal.name}</p>
        <p className="text-2xl font-black" style={{ color: ringColor }}>{Math.round(pct)}%</p>
        <p className="text-xs text-[#9096B4] mt-0.5">
          {formatCurrency(goal.currentSaved, currency)} of {formatCurrency(goal.targetAmount, currency)}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Borrow & Lend Summary Card ─────────────────────────────── */
function BorrowLendCard({ onClick }: { onClick: () => void }) {
  const { borrowLends } = useStore();
  const currency = useStore(s => s.profile?.currency) || 'NPR';

  const totalOwed = borrowLends.filter(b => b.direction === 'borrowed').reduce((s, b) => s + Math.max(b.totalAmount - b.paidAmount, 0), 0);
  const totalOwedToMe = borrowLends.filter(b => b.direction === 'lent').reduce((s, b) => s + Math.max(b.totalAmount - b.paidAmount, 0), 0);
  const active = borrowLends.filter(b => b.paidAmount < b.totalAmount);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="col-span-2 bg-white rounded-3xl p-5 border border-[#EEEDF5] shadow-sm cursor-pointer relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)' }}>

      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #7B61FF, transparent)' }}/>

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-0.5">Borrow & Lend</p>
          <p className="text-white font-bold text-base">💸 {active.length} active {active.length === 1 ? 'entry' : 'entries'}</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl">💸</div>
      </div>

      <div className="flex gap-3">
        {totalOwed > 0 && (
          <div className="flex-1 bg-[#FF6152]/20 rounded-2xl p-3">
            <div className="flex items-center gap-1 mb-1">
              <ArrowDownLeft size={11} className="text-[#FF8C73]"/>
              <span className="text-[10px] font-bold text-[#FF8C73] uppercase tracking-wide">I Owe</span>
            </div>
            <p className="text-white font-bold text-sm">{formatCurrency(totalOwed, currency)}</p>
          </div>
        )}
        {totalOwedToMe > 0 && (
          <div className="flex-1 bg-[#00C896]/20 rounded-2xl p-3">
            <div className="flex items-center gap-1 mb-1">
              <ArrowUpRight size={11} className="text-[#00E5B0]"/>
              <span className="text-[10px] font-bold text-[#00E5B0] uppercase tracking-wide">Owed to Me</span>
            </div>
            <p className="text-white font-bold text-sm">{formatCurrency(totalOwedToMe, currency)}</p>
          </div>
        )}
        {active.length === 0 && (
          <div className="flex-1 text-center py-1">
            <p className="text-white/40 text-sm">Tap to track borrowing & lending</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function GoalsPage() {
  const { goals } = useStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | undefined>();
  const [selectedGoal, setSelectedGoal] = useState<Goal | undefined>();
  const [blOpen, setBlOpen] = useState(false);

  const active   = goals.filter(g => !g.achieved);
  const achieved = goals.filter(g => g.achieved);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">Goals 🎯</h1>
          <p className="text-sm text-[#9096B4]">{active.length} active · {achieved.length} achieved</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }}
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-white text-sm font-bold shadow-lg"
          style={{ background: 'linear-gradient(135deg, #7B61FF, #5B41CF)' }}>
          <Plus size={15}/> New Goal
        </motion.button>
      </div>

      {/* Grid: goals + borrow/lend card */}
      <div className="grid grid-cols-2 gap-4">
        {active.map((goal, i) => (
          <motion.div key={goal.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}>
            <GoalCard goal={goal} onClick={() => setSelectedGoal(goal)}/>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: active.length * 0.08, ease: [0.16, 1, 0.3, 1] }}>
          <BorrowLendCard onClick={() => setBlOpen(true)}/>
        </motion.div>
      </div>

      {active.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white rounded-3xl border border-[#EEEDF5] p-12 text-center">
          <p className="text-5xl mb-3">🎯</p>
          <p className="text-[#9096B4] text-sm">Set your first goal</p>
        </motion.div>
      )}

      {achieved.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#9096B4] mb-3">Achieved 🏆</p>
          <div className="space-y-2">
            {achieved.map(goal => (
              <motion.div key={goal.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-[#EEEDF5]">
                <span className="text-xl">{goal.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#9096B4] line-through">{goal.name}</p>
                </div>
                <span className="text-lg">🏆</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <GoalForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(undefined); }} editing={editing}/>

      <AnimatePresence>
        {selectedGoal && (
          <GoalDrawer
            goal={goals.find(g => g.id === selectedGoal.id) || selectedGoal}
            onClose={() => setSelectedGoal(undefined)}/>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {blOpen && <BorrowLendDrawer onClose={() => setBlOpen(false)}/>}
      </AnimatePresence>
    </div>
  );
}
