'use client';
import { useStore } from '@/store/useStore';
import { formatCurrency, monthlySavingsNeeded, monthsUntil } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

function generateInsight(income: number, expenses: number, goals: Array<{ name: string; targetAmount: number; currentSaved: number; targetDate: string; emoji: string }>): { text: string; tone: 'positive' | 'neutral' | 'nudge' } {
  const net = income - expenses;
  const savingsRate = income > 0 ? (net / income) * 100 : 0;

  if (income === 0) {
    return { text: "Welcome! Start by logging your income this month to see your financial picture.", tone: 'neutral' };
  }

  const nearGoal = goals.find((g) => {
    const pct = (g.currentSaved / g.targetAmount) * 100;
    return pct >= 80 && pct < 100;
  });
  if (nearGoal) {
    const remaining = nearGoal.targetAmount - nearGoal.currentSaved;
    return {
      text: `You're so close to your ${nearGoal.emoji} ${nearGoal.name} goal! Just ${formatCurrency(remaining)} more to go.`,
      tone: 'positive',
    };
  }

  if (savingsRate >= 25) {
    return {
      text: `Amazing! You're saving ${Math.round(savingsRate)}% of your income this month — well above the 20% recommended. Keep it up!`,
      tone: 'positive',
    };
  }

  if (savingsRate > 0 && savingsRate < 10) {
    const topGoal = goals[0];
    if (topGoal) {
      const needed = monthlySavingsNeeded(topGoal.targetAmount, topGoal.currentSaved, topGoal.targetDate);
      return {
        text: `Saving ${Math.round(savingsRate)}% this month. To reach your ${topGoal.emoji} ${topGoal.name} goal, you'd need ${formatCurrency(needed)}/month — consider trimming discretionary spending.`,
        tone: 'nudge',
      };
    }
    return { text: `You're saving ${Math.round(savingsRate)}% this month. Even small increases add up — try saving just 5% more!`, tone: 'nudge' };
  }

  if (net < 0) {
    return {
      text: `You've spent ${formatCurrency(Math.abs(net))} more than you've earned this month. Let's look at where you can trim back.`,
      tone: 'nudge',
    };
  }

  return {
    text: `You've saved ${formatCurrency(net)} this month (${Math.round(savingsRate)}% of income). Steady progress!`,
    tone: 'neutral',
  };
}

export function AIInsightCard() {
  const { income, expenses, goals, selectedMonth } = useStore();

  const totalIncome = income.filter((i) => i.date.startsWith(selectedMonth)).reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth)).reduce((s, e) => s + e.amount, 0);
  const activeGoals = goals.filter((g) => !g.achieved);

  const { text, tone } = generateInsight(totalIncome, totalExpenses, activeGoals);

  const toneStyles = {
    positive: 'bg-[#EBF5EE] border-[#BFD9C8]',
    neutral: 'bg-[#EBF2F0] border-[#C0D4CF]',
    nudge: 'bg-[#F5EFE6] border-[#D4C5A9]',
  };

  const iconColors = {
    positive: 'text-[#7FA98E]',
    neutral: 'text-[#7C9A92]',
    nudge: 'text-[#C4A882]',
  };

  return (
    <div className={`rounded-2xl border p-5 ${toneStyles[tone]}`}>
      <div className="flex gap-3">
        <div className="mt-0.5">
          <Sparkles size={18} className={iconColors[tone]} />
        </div>
        <div>
          <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Monthly Insight</div>
          <p className="text-sm text-[#3D3D3D] leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}
