'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatCompact, formatDateShort, monthlySavingsNeeded, monthsUntil, EXPENSE_CATEGORIES, getLocalToday } from '@/lib/utils';
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
      <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={7} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (Math.min(pct, 100) / 100) * circ }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />
    </svg>
  );
}

/* ── Entry Detail Drawer — mounted at page level (z-[70]) ─── */
function BLEntryDrawer({ entry, onClose }: { entry: BorrowLend; onClose: () => void }) {
  const { logBLPayment, deleteBorrowLend } = useStore();
  const { toast } = useToast();
  const currency = useStore(s => s.profile?.currency) || 'NPR';

  const [payAmt, setPayAmt] = useState(entry.monthlyPayment > 0 ? entry.monthlyPayment.toString() : '');
  const [payNote, setPayNote] = useState('');
  const [paying, setPaying] = useState(false);

  const remaining = entry.totalAmount - entry.paidAmount;
  const pct = Math.min((entry.paidAmount / entry.totalAmount) * 100, 100);
  const isBorrowed = entry.direction === 'borrowed';
  const accentColor = isBorrowed ? '#FF6152' : '#00C896';
  const ml = entry.monthlyPayment > 0 && remaining > 0 ? Math.ceil(remaining / entry.monthlyPayment) : null;
  const payments = (entry.payments ?? []).slice().reverse();

  const handleLogPayment = async () => {
    const n = parseFloat(payAmt);
    if (!n || n <= 0) return;
    await logBLPayment(entry.id!, n, payNote || undefined);
    toast(`Payment of ${formatCurrency(n, currency)} logged`);
    setPaying(false);
    setPayAmt('');
    setPayNote('');
  };

  const handleDelete = async () => {
    if (!window.confirm(`Remove entry for "${entry.name}"?`)) return;
    await deleteBorrowLend(entry.id!);
    onClose();
    toast('Entry removed');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col"
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}>

        {/* Dark hero header */}
        <div className="relative px-6 pt-6 pb-5 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 55%, #0F3460 100%)' }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10"
            style={{ background: `radial-gradient(circle, ${accentColor}, transparent)` }}/>

          <div className="relative flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${isBorrowed ? 'bg-[#FF6152]/20' : 'bg-[#00C896]/20'}`}>
                {isBorrowed ? '⬇️' : '⬆️'}
              </div>
              <div>
                <h2 className="text-xl font-black text-white">{entry.name}</h2>
                <p className="text-sm font-semibold" style={{ color: accentColor }}>
                  {isBorrowed ? 'I borrowed' : 'I lent'} · {formatDateShort(entry.startDate)}
                </p>
                {entry.note && <p className="text-xs text-white/40 mt-0.5 italic">{entry.note}</p>}
              </div>
            </div>
            {/* Buttons — stopPropagation prevents backdrop click */}
            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
              <button
                onClick={handleDelete}
                className="p-2 rounded-xl bg-white/10 text-white/60 hover:bg-[#FF6152]/40 hover:text-white transition-colors">
                <Trash2 size={14}/>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors">
                <X size={16}/>
              </button>
            </div>
          </div>

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">Remaining</p>
            <p className="text-4xl font-black text-white mb-1">{formatCompact(remaining, currency)}</p>
            {ml && <p className="text-sm text-white/40">~{ml} month{ml !== 1 ? 's' : ''} to clear</p>}

            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden my-3">
              <motion.div className="h-full rounded-full"
                style={{ backgroundColor: accentColor }}
                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}/>
            </div>

            <div className="flex gap-3">
              {[
                { label: 'Total', value: formatCompact(entry.totalAmount, currency) },
                { label: 'Paid back', value: formatCompact(entry.paidAmount, currency) },
                ...(entry.monthlyPayment > 0 ? [{ label: 'Monthly', value: formatCompact(entry.monthlyPayment, currency) }] : []),
              ].map(s => (
                <div key={s.label} className="flex-1 rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <p className="text-[10px] text-white/40 mb-0.5">{s.label}</p>
                  <p className="text-sm font-bold text-white">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Log payment */}
        <div className="px-6 py-4 border-b border-[#F5F5F8]">
          <AnimatePresence mode="wait">
            {paying ? (
              <motion.div key="form" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                <div className="flex gap-2">
                  <input type="number" placeholder="Amount" value={payAmt}
                    onChange={e => setPayAmt(e.target.value)} autoFocus
                    className="flex-1 px-3 py-2.5 rounded-xl border border-[#EEEDF5] bg-[#FAFAF8] text-sm focus:outline-none focus:border-[#7B61FF]"/>
                  <input type="text" placeholder="Comment (optional)" value={payNote}
                    onChange={e => setPayNote(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogPayment()}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-[#EEEDF5] bg-[#FAFAF8] text-sm focus:outline-none focus:border-[#7B61FF]"/>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPaying(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#F5F5F8] text-[#9096B4] text-sm font-semibold">Cancel</button>
                  <button onClick={handleLogPayment}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: `linear-gradient(135deg, ${accentColor}, ${isBorrowed ? '#E84545' : '#00A876'})` }}>
                    Log Payment
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.button key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => setPaying(true)} disabled={remaining <= 0}
                className="w-full py-3 rounded-2xl border-2 border-dashed text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ borderColor: accentColor, color: accentColor }}>
                <Check size={15}/> {isBorrowed ? 'Log repayment' : 'Log received payment'}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Payment history */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#9096B4] mb-3">
            Payment History · {payments.length} {payments.length === 1 ? 'entry' : 'entries'}
          </p>
          {payments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">🧾</p>
              <p className="text-sm text-[#C0BFCC]">No payments logged yet</p>
            </div>
          ) : (
            <div>
              {payments.map((p, i) => (
                <motion.div key={p.id}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 py-3 border-b border-[#F5F5F8] last:border-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0"
                    style={{ backgroundColor: `${accentColor}18` }}>💸</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A1A2E]">{formatCurrency(p.amount, currency)}</p>
                    {p.note && <p className="text-xs text-[#9096B4] truncate">{p.note}</p>}
                  </div>
                  <span className="text-xs text-[#C0BFCC] shrink-0">{formatDateShort(p.date)}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Borrow & Lend Drawer ───────────────────────────────────── */
function BorrowLendDrawer({
  onClose,
  onEntryClick,
}: {
  onClose: () => void;
  onEntryClick: (entry: BorrowLend) => void;
}) {
  const { borrowLends, addBorrowLend } = useStore();
  const { toast } = useToast();
  const currency = useStore(s => s.profile?.currency) || 'NPR';

  const [tab, setTab] = useState<'borrowed' | 'lent'>('borrowed');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    name: '',
    direction: 'borrowed' as 'borrowed' | 'lent',
    totalAmount: '',
    monthlyPayment: '',
    startDate: getLocalToday(),
    note: '',
  });

  const borrowed = borrowLends.filter(b => b.direction === 'borrowed');
  const lent = borrowLends.filter(b => b.direction === 'lent');
  const list = tab === 'borrowed' ? borrowed : lent;

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
      payments: [],
    });
    toast(`${form.direction === 'borrowed' ? 'Borrowed from' : 'Lent to'} ${form.name} recorded`);
    setForm({ name: '', direction: 'borrowed', totalAmount: '', monthlyPayment: '', startDate: getLocalToday(), note: '' });
    setAdding(false);
  };

  const openAdd = (dir: 'borrowed' | 'lent') => {
    setForm(f => ({ ...f, direction: dir }));
    setAdding(true);
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}/>
      <motion.div
        className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[92vh] flex flex-col"
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}>

        {/* Tab header */}
        <div className="px-5 pt-5 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1A1A2E]">Borrow & Lend 💸</h2>
            <button onClick={onClose} className="p-2 rounded-xl bg-[#F5F5F8] text-[#9096B4]"><X size={16}/></button>
          </div>

          {/* Side-by-side tabs */}
          <div className="grid grid-cols-2 gap-2 mb-1">
            <button
              onClick={() => setTab('borrowed')}
              className={`flex flex-col items-center gap-1 py-3 px-4 rounded-2xl border-2 transition-all ${
                tab === 'borrowed' ? 'border-[#FF6152] bg-[#FFF0EE]' : 'border-[#F0EDE8] bg-white hover:bg-[#FFF8F7]'
              }`}>
              <div className="flex items-center gap-2">
                <ArrowDownLeft size={15} className={tab === 'borrowed' ? 'text-[#FF6152]' : 'text-[#9096B4]'}/>
                <span className={`text-sm font-bold ${tab === 'borrowed' ? 'text-[#FF6152]' : 'text-[#9096B4]'}`}>Borrowed</span>
              </div>
              <p className={`text-xs ${tab === 'borrowed' ? 'text-[#FF6152]/70' : 'text-[#C0BFCC]'}`}>
                {borrowed.length} {borrowed.length === 1 ? 'entry' : 'entries'} · {formatCompact(borrowed.reduce((s, b) => s + Math.max(b.totalAmount - b.paidAmount, 0), 0), currency)} left
              </p>
            </button>
            <button
              onClick={() => setTab('lent')}
              className={`flex flex-col items-center gap-1 py-3 px-4 rounded-2xl border-2 transition-all ${
                tab === 'lent' ? 'border-[#00C896] bg-[#E8FBF6]' : 'border-[#F0EDE8] bg-white hover:bg-[#F0FBF7]'
              }`}>
              <div className="flex items-center gap-2">
                <ArrowUpRight size={15} className={tab === 'lent' ? 'text-[#00C896]' : 'text-[#9096B4]'}/>
                <span className={`text-sm font-bold ${tab === 'lent' ? 'text-[#00C896]' : 'text-[#9096B4]'}`}>Lent</span>
              </div>
              <p className={`text-xs ${tab === 'lent' ? 'text-[#00C896]/70' : 'text-[#C0BFCC]'}`}>
                {lent.length} {lent.length === 1 ? 'entry' : 'entries'} · {formatCompact(lent.reduce((s, b) => s + Math.max(b.totalAmount - b.paidAmount, 0), 0), currency)} outstanding
              </p>
            </button>
          </div>
        </div>

        {/* Add form */}
        <AnimatePresence>
          {adding && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-[#F5F5F8]">
              <div className="px-5 py-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[#9096B4]">
                  New {form.direction === 'borrowed' ? 'Borrowing' : 'Lending'}
                </p>
                <Input label="Person / Place" placeholder="e.g. Didi, Bank, Rohan"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Total Amount" type="number" placeholder="0"
                    value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} />
                  <Input label="Monthly Repayment" type="number" placeholder="0 (optional)"
                    value={form.monthlyPayment} onChange={e => setForm(f => ({ ...f, monthlyPayment: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Date" type="date"
                    value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                  <Input label="Description / Note" placeholder="What's this for?"
                    value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setAdding(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#F5F5F8] text-[#9096B4] text-sm font-semibold">Cancel</button>
                  <button onClick={handleAdd}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: form.direction === 'borrowed' ? 'linear-gradient(135deg, #FF6152, #E84545)' : 'linear-gradient(135deg, #00C896, #00A876)' }}>
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, x: tab === 'borrowed' ? -12 : 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              {list.length === 0 ? (
                <div className="text-center py-14">
                  <p className="text-4xl mb-3">{tab === 'borrowed' ? '⬇️' : '⬆️'}</p>
                  <p className="text-sm text-[#9096B4]">No {tab} entries yet</p>
                  <button onClick={() => openAdd(tab)}
                    className="mt-4 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-white text-sm font-bold mx-auto"
                    style={{ background: tab === 'borrowed' ? 'linear-gradient(135deg, #FF6152, #E84545)' : 'linear-gradient(135deg, #00C896, #00A876)' }}>
                    <Plus size={14}/> Add {tab === 'borrowed' ? 'Borrowing' : 'Lending'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {list.map((b, i) => {
                    const remaining = b.totalAmount - b.paidAmount;
                    const pct = (b.paidAmount / b.totalAmount) * 100;
                    const isSettled = remaining <= 0;
                    const accentColor = tab === 'borrowed' ? '#FF6152' : '#00C896';

                    return (
                      <motion.div key={b.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => onEntryClick(b)}
                        className={`rounded-2xl p-4 border cursor-pointer transition-all hover:shadow-md ${
                          isSettled ? 'bg-[#F8F8F8] border-[#EEEEEE] opacity-60' : 'bg-white border-[#F0EDE8] hover:border-[#D0CEFF]'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${tab === 'borrowed' ? 'bg-[#FFF0EE]' : 'bg-[#E8FBF6]'}`}>
                            {isSettled ? '✅' : tab === 'borrowed' ? '⬇️' : '⬆️'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className={`font-bold text-[#1A1A2E] text-sm ${isSettled ? 'line-through' : ''}`}>{b.name}</p>
                              <p className="text-sm font-black" style={{ color: isSettled ? '#9096B4' : accentColor }}>
                                {isSettled ? 'Settled' : formatCompact(remaining, currency)}
                              </p>
                            </div>
                            {b.note && <p className="text-xs text-[#9096B4] truncate mb-1">{b.note}</p>}
                            {!isSettled && (
                              <div className="h-1 bg-[#F0EDE8] rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all"
                                  style={{ width: `${pct}%`, backgroundColor: accentColor }}/>
                              </div>
                            )}
                          </div>
                        </div>
                        {!isSettled && (
                          <div className="flex justify-between text-[10px] text-[#C0BFCC] mt-2 pl-13">
                            <span>{formatDateShort(b.startDate)}</span>
                            <span>{(b.payments ?? []).length} payment{(b.payments ?? []).length !== 1 ? 's' : ''} · {formatCompact(b.paidAmount, currency)} paid</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* Add button at bottom of list */}
                  <button onClick={() => openAdd(tab)}
                    className="w-full mt-1 py-3 rounded-2xl border-2 border-dashed text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                    style={{ borderColor: tab === 'borrowed' ? '#FFCCC8' : '#B0F0E0', color: tab === 'borrowed' ? '#FF6152' : '#00C896' }}>
                    <Plus size={14}/> Add {tab === 'borrowed' ? 'Borrowing' : 'Lending'}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
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
    <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={onClick}
      className="bg-white rounded-3xl p-5 border border-[#EEEDF5] shadow-sm cursor-pointer flex flex-col items-center gap-3 relative overflow-hidden">
      {pct >= 100 && <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#E8FBF6] flex items-center justify-center"><span className="text-xs">✓</span></div>}
      <div className="relative">
        <Ring pct={pct} size={88} color={ringColor}/>
        <div className="absolute inset-0 flex items-center justify-center text-3xl">{goal.emoji}</div>
      </div>
      <div className="text-center">
        <p className="font-bold text-[#1A1A2E] text-sm leading-snug mb-1">{goal.name}</p>
        <p className="text-2xl font-black" style={{ color: ringColor }}>{Math.round(pct)}%</p>
        <p className="text-xs text-[#9096B4] mt-0.5">{formatCurrency(goal.currentSaved, currency)} of {formatCurrency(goal.targetAmount, currency)}</p>
      </div>
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
    await addExpense({ amount: n, category: recCategory, date: getLocalToday(), note: recNote || `${goal.name} — recurring`, tags: ['recurring'] });
    toast(`Recurring payment of ${formatCurrency(n, currency)} logged 🔄`);
    setRecAmount(''); setRecNote(''); setAddingRec(false);
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}/>
      <motion.div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[92vh] flex flex-col"
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
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
              {pct >= 100 && <button onClick={async () => { await updateGoal(goal.id!, { achieved: true }); toast('🎉 Goal achieved!'); onClose(); }} className="p-2 rounded-xl bg-[#E8FBF6] text-[#00C896]"><Check size={16}/></button>}
              <button onClick={async () => { if (confirm('Remove this goal?')) { await deleteGoal(goal.id!); onClose(); } }} className="p-2 rounded-xl bg-[#FFF0EE] text-[#FF6152]"><Trash2 size={14}/></button>
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
          <button onClick={() => setTab('deposit')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'deposit' ? 'text-white' : 'text-[#9096B4] hover:bg-[#F5F5F8]'}`} style={tab === 'deposit' ? { background: 'linear-gradient(135deg, #7B61FF, #5B41CF)' } : {}}>💰 Add Savings</button>
          <button onClick={() => setTab('recurring')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${tab === 'recurring' ? 'text-white' : 'text-[#9096B4] hover:bg-[#F5F5F8]'}`} style={tab === 'recurring' ? { background: 'linear-gradient(135deg, #FFB547, #E09030)' } : {}}><RefreshCw size={13}/> Recurring</button>
        </div>
        <div className="px-6 py-4 border-b border-[#F5F5F8]">
          <AnimatePresence mode="wait">
            {tab === 'deposit' ? (
              <motion.div key="deposit" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <AnimatePresence mode="wait">
                  {adding ? (
                    <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                      <div className="flex gap-2">
                        <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl border border-[#EEEDF5] bg-[#FAFAF8] text-sm focus:outline-none focus:border-[#7B61FF]" autoFocus/>
                        <input type="text" placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl border border-[#EEEDF5] bg-[#FAFAF8] text-sm focus:outline-none focus:border-[#7B61FF]" onKeyDown={e => e.key === 'Enter' && handleAddDeposit()}/>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setAdding(false)} className="flex-1 py-2.5 rounded-xl bg-[#F5F5F8] text-[#9096B4] text-sm font-semibold">Cancel</button>
                        <button onClick={handleAddDeposit} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #7B61FF, #5B41CF)' }}>Save</button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setAdding(true)} className="w-full py-3 rounded-2xl border-2 border-dashed border-[#EEEDF5] text-[#7B61FF] text-sm font-semibold hover:border-[#7B61FF]/50 hover:bg-[#F8F6FF] transition-colors flex items-center justify-center gap-2"><Plus size={15}/> Add deposit</motion.button>
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
                        <input type="number" placeholder="Amount" value={recAmount} onChange={e => setRecAmount(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl border border-[#EEEDF5] bg-[#FAFAF8] text-sm focus:outline-none focus:border-[#FFB547]" autoFocus/>
                        <select value={recCategory} onChange={e => setRecCategory(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl border border-[#EEEDF5] bg-[#FAFAF8] text-sm focus:outline-none focus:border-[#FFB547]">
                          {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                        </select>
                      </div>
                      <input type="text" placeholder={`Note (default: ${goal.name} — recurring)`} value={recNote} onChange={e => setRecNote(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-[#EEEDF5] bg-[#FAFAF8] text-sm focus:outline-none focus:border-[#FFB547]" onKeyDown={e => e.key === 'Enter' && handleAddRecurring()}/>
                      <div className="flex gap-2">
                        <button onClick={() => setAddingRec(false)} className="flex-1 py-2.5 rounded-xl bg-[#F5F5F8] text-[#9096B4] text-sm font-semibold">Cancel</button>
                        <button onClick={handleAddRecurring} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #FFB547, #E09030)' }}>Log Payment</button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button key="rec-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setAddingRec(true)} className="w-full py-3 rounded-2xl border-2 border-dashed border-[#FFE0A0] text-[#E09030] text-sm font-semibold hover:border-[#FFB547] hover:bg-[#FFFBF0] transition-colors flex items-center justify-center gap-2"><RefreshCw size={14}/> Log recurring payment</motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#9096B4] mb-3">Deposit History</p>
          {deposits.length === 0 ? <p className="text-sm text-[#C0BFCC] text-center py-6">No deposits yet</p> : (
            <div>
              {deposits.map((d, i) => (
                <motion.div key={d.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
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

/* ── Borrow & Lend Hero Card ─────────────────────────────────── */
function BorrowLendCard({ onClick }: { onClick: () => void }) {
  const { borrowLends } = useStore();
  const currency = useStore(s => s.profile?.currency) || 'NPR';
  const totalOwed = borrowLends.filter(b => b.direction === 'borrowed').reduce((s, b) => s + Math.max(b.totalAmount - b.paidAmount, 0), 0);
  const totalOwedToMe = borrowLends.filter(b => b.direction === 'lent').reduce((s, b) => s + Math.max(b.totalAmount - b.paidAmount, 0), 0);
  const active = borrowLends.filter(b => b.paidAmount < b.totalAmount);
  const netBalance = totalOwedToMe - totalOwed;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.01, y: -2 }} whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="col-span-2 relative rounded-3xl overflow-hidden p-6 cursor-pointer"
      style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 55%, #0F3460 100%)' }}>
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #7B61FF, transparent)' }}/>
      <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #FF6152, transparent)' }}/>
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 mb-1">Borrow & Lend</p>
            <p className="text-white/60 text-sm">{active.length} active {active.length === 1 ? 'entry' : 'entries'}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl">💸</div>
        </div>
        <div className="mb-4">
          <p className="text-3xl font-black text-white">
            {netBalance >= 0 ? '+' : ''}{formatCompact(netBalance, currency)}
          </p>
          <p className="text-xs text-white/30 mt-0.5">
            {netBalance > 0 ? 'net owed to you' : netBalance < 0 ? 'net you owe' : active.length === 0 ? 'tap to track borrowing & lending' : 'balanced'}
          </p>
        </div>
        {(totalOwed > 0 || totalOwedToMe > 0) ? (
          <div className="flex gap-2">
            {totalOwed > 0 && (
              <div className="flex-1 rounded-2xl px-3 py-2.5" style={{ background: 'rgba(255,97,82,0.15)' }}>
                <div className="flex items-center gap-1 mb-1"><ArrowDownLeft size={10} className="text-[#FF8C73]"/><span className="text-[9px] font-bold text-[#FF8C73] uppercase tracking-wide">I Owe</span></div>
                <p className="text-white font-bold text-sm">{formatCompact(totalOwed, currency)}</p>
              </div>
            )}
            {totalOwedToMe > 0 && (
              <div className="flex-1 rounded-2xl px-3 py-2.5" style={{ background: 'rgba(0,200,150,0.15)' }}>
                <div className="flex items-center gap-1 mb-1"><ArrowUpRight size={10} className="text-[#00E5B0]"/><span className="text-[9px] font-bold text-[#00E5B0] uppercase tracking-wide">Owed to Me</span></div>
                <p className="text-white font-bold text-sm">{formatCompact(totalOwedToMe, currency)}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-white/20 text-sm">Tap to add entries →</p>
        )}
      </div>
    </motion.div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function GoalsPage() {
  const { goals, borrowLends } = useStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | undefined>();
  const [selectedGoal, setSelectedGoal] = useState<Goal | undefined>();
  const [blOpen, setBlOpen] = useState(false);
  // Entry detail lives at page level — no z-index stacking issues
  const [selectedBLEntry, setSelectedBLEntry] = useState<BorrowLend | null>(null);

  const active   = goals.filter(g => !g.achieved);
  const achieved = goals.filter(g => g.achieved);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">Goals 🎯</h1>
          <p className="text-sm text-[#9096B4]">{active.length} active · {achieved.length} achieved</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-white text-sm font-bold shadow-lg"
          style={{ background: 'linear-gradient(135deg, #7B61FF, #5B41CF)' }}>
          <Plus size={15}/> New Goal
        </motion.button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {active.map((goal, i) => (
          <motion.div key={goal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}>
            <GoalCard goal={goal} onClick={() => setSelectedGoal(goal)}/>
          </motion.div>
        ))}
        <BorrowLendCard onClick={() => setBlOpen(true)}/>
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
                <div className="flex-1"><p className="text-sm font-semibold text-[#9096B4] line-through">{goal.name}</p></div>
                <span className="text-lg">🏆</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <GoalForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(undefined); }} editing={editing}/>

      <AnimatePresence>
        {selectedGoal && <GoalDrawer goal={goals.find(g => g.id === selectedGoal.id) || selectedGoal} onClose={() => setSelectedGoal(undefined)}/>}
      </AnimatePresence>

      <AnimatePresence>
        {blOpen && (
          <BorrowLendDrawer
            onClose={() => setBlOpen(false)}
            onEntryClick={(entry) => setSelectedBLEntry(entry)}
          />
        )}
      </AnimatePresence>

      {/* Entry detail — at page level, z-[70], above the list drawer */}
      <AnimatePresence>
        {selectedBLEntry && (
          <BLEntryDrawer
            entry={borrowLends.find(b => b.id === selectedBLEntry.id) || selectedBLEntry}
            onClose={() => setSelectedBLEntry(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
