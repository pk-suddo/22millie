'use client';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Wallet, Percent } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function QuickStats() {
  const { income, expenses, selectedMonth } = useStore();

  const monthIncome = income
    .filter((i) => i.date.startsWith(selectedMonth))
    .reduce((s, i) => s + i.amount, 0);

  const monthExpenses = expenses
    .filter((e) => e.date.startsWith(selectedMonth))
    .reduce((s, e) => s + e.amount, 0);

  const net = monthIncome - monthExpenses;
  const savingsRate = monthIncome > 0 ? Math.round((net / monthIncome) * 100) : 0;

  const stats = [
    {
      label: 'Income',
      value: formatCurrency(monthIncome),
      icon: TrendingUp,
      color: 'text-[#7C9A92]',
      bg: 'bg-[#EBF2F0]',
    },
    {
      label: 'Expenses',
      value: formatCurrency(monthExpenses),
      icon: TrendingDown,
      color: 'text-[#C4A882]',
      bg: 'bg-[#F5EFE6]',
    },
    {
      label: 'Net Savings',
      value: formatCurrency(net),
      icon: Wallet,
      color: net >= 0 ? 'text-[#7FA98E]' : 'text-[#C4827A]',
      bg: net >= 0 ? 'bg-[#EBF5EE]' : 'bg-[#F5EAEA]',
    },
    {
      label: 'Savings Rate',
      value: `${savingsRate}%`,
      icon: Percent,
      color: 'text-[#8BA7A0]',
      bg: 'bg-[#EBF2F0]',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm text-[#9CA3AF] font-medium">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <Icon size={15} className={stat.color} />
                </div>
              </div>
              <div className={`text-xl font-semibold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
