'use client';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDate, EXPENSE_CATEGORIES } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function RecentTransactions() {
  const { expenses, income, selectedMonth } = useStore();

  const recent = [
    ...expenses.filter((e) => e.date.startsWith(selectedMonth)).map((e) => ({
      id: `exp-${e.id}`,
      type: 'expense' as const,
      amount: e.amount,
      label: e.note || e.category,
      sub: e.category,
      date: e.date,
      icon: EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.icon || '📦',
    })),
    ...income.filter((i) => i.date.startsWith(selectedMonth)).map((i) => ({
      id: `inc-${i.id}`,
      type: 'income' as const,
      amount: i.amount,
      label: i.name,
      sub: i.source,
      date: i.date,
      icon: '💰',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between !pb-2">
        <CardTitle>Recent Transactions</CardTitle>
        <Link href="/expenses" className="text-xs text-[#7C9A92] hover:text-[#5B8A8A] flex items-center gap-1">
          View all <ArrowRight size={12} />
        </Link>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-[#B0ACA8] py-4 text-center">No transactions this month</p>
        ) : (
          <div className="divide-y divide-[#F5F3F0]">
            {recent.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-xl bg-[#F5F3F0] flex items-center justify-center text-base shrink-0">
                  {tx.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#2D2D2D] truncate">{tx.label}</div>
                  <div className="text-xs text-[#9CA3AF]">{tx.sub} · {formatDate(tx.date)}</div>
                </div>
                <span className={`text-sm font-semibold shrink-0 ${tx.type === 'income' ? 'text-[#7FA98E]' : 'text-[#2D2D2D]'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
