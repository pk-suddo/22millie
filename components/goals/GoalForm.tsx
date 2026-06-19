'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ui/toast';
import type { Goal } from '@/lib/db';

const GOAL_EMOJIS = ['🎯', '✈️', '💻', '🏠', '🚗', '💍', '📚', '🛡️', '🎸', '🌴', '💪', '🗾', '🎓', '💎', '🌟'];

interface GoalFormProps {
  open: boolean;
  onClose: () => void;
  editing?: Goal;
}

export function GoalForm({ open, onClose, editing }: GoalFormProps) {
  const { addGoal, updateGoal } = useStore();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: editing?.name || '',
    targetAmount: editing?.targetAmount?.toString() || '',
    currentSaved: editing?.currentSaved?.toString() || '0',
    targetDate: editing?.targetDate || '',
    emoji: editing?.emoji || '🎯',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.targetAmount || !form.targetDate) return;
    const data = {
      name: form.name,
      targetAmount: parseFloat(form.targetAmount),
      currentSaved: parseFloat(form.currentSaved) || 0,
      targetDate: form.targetDate,
      emoji: form.emoji,
      achieved: editing?.achieved || false,
    };
    if (editing?.id) {
      await updateGoal(editing.id, data);
      toast('Goal updated');
    } else {
      await addGoal(data);
      toast('Goal created');
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Goal' : 'New Goal'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-[#4A4A4A] block mb-1.5">Icon</label>
          <div className="flex flex-wrap gap-2">
            {GOAL_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setForm({ ...form, emoji })}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                  form.emoji === emoji
                    ? 'bg-[#EBF2F0] ring-2 ring-[#7C9A92]'
                    : 'bg-[#F5F3F0] hover:bg-[#EBF2F0]'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <Input
          label="Goal Name"
          placeholder="e.g. Japan Trip, New Laptop, Emergency Fund"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          label="Target Amount"
          type="number"
          placeholder="0.00"
          step="0.01"
          min="0"
          value={form.targetAmount}
          onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
          required
        />
        <Input
          label="Already Saved"
          type="number"
          placeholder="0.00"
          step="0.01"
          min="0"
          value={form.currentSaved}
          onChange={(e) => setForm({ ...form, currentSaved: e.target.value })}
        />
        <Input
          label="Target Date"
          type="date"
          value={form.targetDate}
          onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
          required
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {editing ? 'Save Changes' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
