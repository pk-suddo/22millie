'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ui/toast';
import { EXPENSE_CATEGORIES } from '@/lib/utils';
import type { Expense } from '@/lib/db';

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  editing?: Expense;
}

export function ExpenseForm({ open, onClose, editing }: ExpenseFormProps) {
  const { addExpense, updateExpense } = useStore();
  const { toast } = useToast();
  const [form, setForm] = useState({
    amount: editing?.amount?.toString() || '',
    category: editing?.category || 'Food',
    date: editing?.date || new Date().toISOString().split('T')[0],
    note: editing?.note || '',
    tags: editing?.tags?.join(', ') || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.date) return;
    const data = {
      amount: parseFloat(form.amount),
      category: form.category,
      date: form.date,
      note: form.note,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
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

  const categoryOpts = EXPENSE_CATEGORIES.map((c) => ({
    label: `${c.icon} ${c.label}`,
    value: c.value,
  }));

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Expense' : 'Log Expense'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Amount"
          type="number"
          placeholder="0.00"
          step="0.01"
          min="0"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />
        <Select
          label="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          options={categoryOpts}
        />
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
        <Input
          label="Tags (comma separated)"
          placeholder="e.g. recurring, social, work"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
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
