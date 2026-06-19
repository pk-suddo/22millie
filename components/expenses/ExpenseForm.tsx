'use client';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ui/toast';
import { EXPENSE_CATEGORIES, getLocalToday } from '@/lib/utils';
import type { Expense } from '@/lib/db';

const EMOJI_OPTIONS = ['🏷️','🎮','🐾','🌿','🔧','💼','🏋️','🎵','🍕','🚀','🏠','💳','🎓','✂️','🌊','🔑','🎨','🧘','🍷','📷'];
const COLOR_OPTIONS = ['#FF6152','#7B61FF','#00C896','#FFB547','#4A9EFF','#FF79A8','#34D399','#F472B6','#A78BFA','#9096B4'];

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Expense;
}

export function ExpenseForm({ open, onClose, editing }: Props) {
  const { addExpense, updateExpense, customCategories, addCategory, removeCategory } = useStore();
  const { toast } = useToast();

  const allCategories = [
    ...EXPENSE_CATEGORIES,
    ...customCategories.map(c => ({ label: c.label, value: c.value, icon: c.icon })),
  ];

  const [form, setForm] = useState({
    amount: editing?.amount?.toString() || '',
    category: editing?.category || 'Food',
    date: editing?.date || getLocalToday(),
    note: editing?.note || '',
    recurring: editing?.tags?.includes('recurring') || false,
  });

  const [showAddCat, setShowAddCat] = useState(false);
  const [newCat, setNewCat] = useState({ label: '', icon: '🏷️', color: '#9096B4' });

  // Sync when editing prop changes
  useEffect(() => {
    if (open) {
      setForm({
        amount: editing?.amount?.toString() || '',
        category: editing?.category || 'Food',
        date: editing?.date || getLocalToday(),
        note: editing?.note || '',
        recurring: editing?.tags?.includes('recurring') || false,
      });
      setShowAddCat(false);
    }
  }, [open, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.date) return;
    const tags = form.recurring ? ['recurring'] : [];
    const data = {
      amount: parseFloat(form.amount),
      category: form.category,
      date: form.date,
      note: form.note,
      tags,
    };
    if (editing?.id) {
      await updateExpense(editing.id, data);
      toast('Expense updated');
    } else {
      await addExpense(data);
      toast('Expense logged');
    }
    onClose();
  };

  const handleAddCategory = async () => {
    if (!newCat.label.trim()) return;
    const value = newCat.label.trim().replace(/\s+/g, '_');
    await addCategory({ value, label: newCat.label.trim(), icon: newCat.icon, color: newCat.color });
    setForm(f => ({ ...f, category: value }));
    setNewCat({ label: '', icon: '🏷️', color: '#9096B4' });
    setShowAddCat(false);
    toast('Category added');
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Expense' : 'Log Expense'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Amount (NPR)"
          type="number"
          placeholder="0.00"
          step="0.01"
          min="0"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />

        {/* Category picker */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Category</label>
            <button
              type="button"
              onClick={() => setShowAddCat(!showAddCat)}
              className="text-xs font-semibold text-[#7B61FF] hover:opacity-70 flex items-center gap-1"
            >
              {showAddCat ? '✕ Cancel' : '+ Add'}
            </button>
          </div>

          {/* Add custom category panel */}
          {showAddCat && (
            <div className="mb-3 p-3 bg-[#F8F7FF] rounded-2xl border border-[#E0DBFF] space-y-3">
              <Input
                label="Name"
                placeholder="e.g. Gym, Coffee"
                value={newCat.label}
                onChange={e => setNewCat({ ...newCat, label: e.target.value })}
              />
              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Icon</p>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_OPTIONS.map(em => (
                    <button key={em} type="button"
                      onClick={() => setNewCat({ ...newCat, icon: em })}
                      className={`w-8 h-8 rounded-xl text-base flex items-center justify-center transition-all ${newCat.icon === em ? 'bg-[#7B61FF] shadow-md scale-110' : 'bg-white border border-[#E8E5E0] hover:bg-[#F0EEFF]'}`}>
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Color</p>
                <div className="flex gap-1.5 flex-wrap">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} type="button"
                      onClick={() => setNewCat({ ...newCat, color: c })}
                      className={`w-7 h-7 rounded-full transition-all ${newCat.color === c ? 'ring-2 ring-offset-1 ring-[#7B61FF] scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <button type="button" onClick={handleAddCategory}
                className="w-full py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg, #7B61FF, #5B41CF)' }}>
                Add Category
              </button>
            </div>
          )}

          {/* Category grid */}
          <div className="grid grid-cols-3 gap-2">
            {allCategories.map(cat => {
              const isCustom = customCategories.some(c => c.value === cat.value);
              const isSelected = form.category === cat.value;
              return (
                <div key={cat.value} className="relative">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, category: cat.value })}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      isSelected
                        ? 'text-white border-transparent shadow-md'
                        : 'bg-white text-[#4A4A6A] border-[#E8E5E0] hover:border-[#C8C5FF] hover:bg-[#F8F7FF]'
                    }`}
                    style={isSelected ? { background: 'linear-gradient(135deg, #7B61FF, #5B41CF)' } : {}}
                  >
                    <span className="text-base shrink-0">{cat.icon}</span>
                    <span className="truncate text-xs">{cat.label}</span>
                  </button>
                  {isCustom && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await removeCategory(cat.value);
                        if (form.category === cat.value) setForm(f => ({ ...f, category: 'Food' }));
                        toast('Category removed');
                      }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#FF6152] text-white rounded-full text-[9px] flex items-center justify-center hover:bg-[#E84545] shadow-sm z-10"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recurring toggle */}
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, recurring: !f.recurring }))}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
            form.recurring
              ? 'bg-[#FFF8ED] border-[#FFB547] text-[#B07A00]'
              : 'bg-white border-[#E8E5E0] text-[#6B7280] hover:border-[#FFB547]'
          }`}
        >
          <span className="text-lg">🔄</span>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold">Mark as Recurring</p>
            <p className="text-xs opacity-60">Fixed payment that repeats (rent, subscription, etc.)</p>
          </div>
          <div className={`w-10 h-5 rounded-full transition-all relative ${form.recurring ? 'bg-[#FFB547]' : 'bg-[#E8E5E0]'}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.recurring ? 'left-5' : 'left-0.5'}`}/>
          </div>
        </button>

        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />
        <Input
          label="Note"
          placeholder="e.g. Grocery run, Coffee with Jane"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {editing ? 'Save Changes' : 'Log Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
