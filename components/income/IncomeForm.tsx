'use client';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ui/toast';
import { INCOME_SOURCES, getLocalToday } from '@/lib/utils';
import type { Income } from '@/lib/db';

interface IncomeFormProps {
  open: boolean;
  onClose: () => void;
  editing?: Income;
  defaultDate?: string;
}

export function IncomeForm({ open, onClose, editing, defaultDate }: IncomeFormProps) {
  const { addIncome, updateIncome } = useStore();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: editing?.name || '',
    amount: editing?.amount?.toString() || '',
    frequency: editing?.frequency || 'one-time',
    date: editing?.date || defaultDate || getLocalToday(),
    source: editing?.source || 'Primary Job',
    notes: editing?.notes || '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: editing?.name || '',
        amount: editing?.amount?.toString() || '',
        frequency: editing?.frequency || 'one-time',
        date: editing?.date || defaultDate || getLocalToday(),
        source: editing?.source || 'Primary Job',
        notes: editing?.notes || '',
      });
    }
  }, [open, editing, defaultDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.amount || !form.date) return;
    const data = {
      name: form.name,
      amount: parseFloat(form.amount),
      frequency: form.frequency as Income['frequency'],
      date: form.date,
      source: form.source,
      notes: form.notes,
    };
    if (editing?.id) {
      await updateIncome(editing.id, data);
      toast('Income updated');
    } else {
      await addIncome(data);
      toast('Income added');
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Income' : 'Add Income'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          placeholder="e.g. Salary, Freelance Project"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
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
          label="Frequency"
          value={form.frequency}
          onChange={(e) => setForm({ ...form, frequency: e.target.value as Income['frequency'] })}
          options={[
            { label: 'Monthly', value: 'monthly' },
            { label: 'One-time', value: 'one-time' },
            { label: 'Weekly', value: 'weekly' },
          ]}
        />
        <Input
          label="Date Received"
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />
        <Select
          label="Source"
          value={form.source}
          onChange={(e) => setForm({ ...form, source: e.target.value })}
          options={INCOME_SOURCES.map((s) => ({ label: s, value: s }))}
        />
        <Input
          label="Notes (optional)"
          placeholder="Any notes..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {editing ? 'Save Changes' : 'Add Income'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
