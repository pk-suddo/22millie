'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDateShort, monthlySavingsNeeded, monthsUntil } from '@/lib/utils';
import { GoalForm } from '@/components/goals/GoalForm';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Plus, X, Trash2, Edit2, Check } from 'lucide-react';
import type { Goal } from '@/lib/db';

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

/* ── Goal Detail Drawer ─────────────────────────────────────── */
function GoalDrawer({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { goalDeposits, addGoalDeposit, updateGoal, deleteGoal } = useStore();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);
  const currency = useStore(s => s.profile?.currency) || 'NPR';

  const deposits = goalDeposits.filter(d => d.goalId === goal.id).sort((a, b) => b.date.localeCompare(a.date));
  const pct = Math.min((goal.currentSaved / goal.targetAmount) * 100, 100);
  const monthly = monthlySavingsNeeded(goal.targetAmount, goal.currentSaved, goal.targetDate);
  const months = monthsUntil(goal.targetDate);
  const remaining = goal.targetAmount - goal.currentSaved;

  const ringColor = pct >= 100 ? '#00C896' : pct >= 60 ? '#7B61FF' : pct >= 30 ? '#FFB547' : '#FF6152';

  const handleAdd = async () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    await addGoalDeposit(goal.id!, n, note || undefined);
    toast(`Added ${formatCurrency(n, currency)} 🎉`);
    setAmount(''); setNote('');
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}/>
      <motion.div
        className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[92vh] flex flex-col"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        {/* Header */}
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

          {/* Stats row */}
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

        {/* Add savings */}
        <div className="px-6 py-4 border-b border-[#F5F5F8]">
          <AnimatePresence mode="wait">
            {adding ? (
              <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="number" placeholder="Amount" value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-[#EEEDF5] bg-[#FAFAF8] text-sm text-[#1A1A2E] placeholder:text-[#C0BFCC] focus:outline-none focus:border-[#7B61FF]"
                    autoFocus
                  />
                  <input
                    type="text" placeholder="Note (optional)" value={note}
                    onChange={e => setNote(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-[#EEEDF5] bg-[#FAFAF8] text-sm text-[#1A1A2E] placeholder:text-[#C0BFCC] focus:outline-none focus:border-[#7B61FF]"
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setAdding(false)} className="flex-1 py-2.5 rounded-xl bg-[#F5F5F8] text-[#9096B4] text-sm font-semibold">Cancel</button>
                  <button onClick={handleAdd} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #7B61FF, #5B41CF)' }}>Add</button>
                </div>
              </motion.div>
            ) : (
              <motion.button key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => setAdding(true)}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-[#EEEDF5] text-[#7B61FF] text-sm font-semibold hover:border-[#7B61FF]/50 hover:bg-[#F8F6FF] transition-colors flex items-center justify-center gap-2">
                <Plus size={15}/> Add Savings
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Deposit history */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#9096B4] mb-3">Deposit History</p>
          {deposits.length === 0 ? (
            <p className="text-sm text-[#C0BFCC] text-center py-6">No deposits yet</p>
          ) : (
            <div className="space-y-2">
              {deposits.map((d, i) => (
                <motion.div key={d.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
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
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-3xl p-5 border border-[#EEEDF5] shadow-sm cursor-pointer flex flex-col items-center gap-3 relative overflow-hidden"
    >
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

/* ── Page ────────────────────────────────────────────────────── */
export default function GoalsPage() {
  const { goals, updateGoal } = useStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | undefined>();
  const [selectedGoal, setSelectedGoal] = useState<Goal | undefined>();

  const active   = goals.filter(g => !g.achieved);
  const achieved = goals.filter(g => g.achieved);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">Goals 🎯</h1>
          <p className="text-sm text-[#9096B4]">{active.length} active · {achieved.length} achieved</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-white text-sm font-bold shadow-lg"
          style={{ background: 'linear-gradient(135deg, #7B61FF, #5B41CF)' }}
        >
          <Plus size={15}/> New Goal
        </motion.button>
      </div>

      {/* Active goals grid */}
      {active.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white rounded-3xl border border-[#EEEDF5] p-16 text-center">
          <p className="text-5xl mb-3">🎯</p>
          <p className="text-[#9096B4] text-sm">Set your first goal</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {active.map((goal, i) => (
            <motion.div key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}>
              <GoalCard goal={goal} onClick={() => setSelectedGoal(goal)}/>
            </motion.div>
          ))}
        </div>
      )}

      {/* Achieved */}
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
            onClose={() => setSelectedGoal(undefined)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
