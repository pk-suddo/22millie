'use client';
import { useStore } from '@/store/useStore';
import { ProgressRing } from '@/components/ui/progress-ring';
import { formatCurrency, monthlySavingsNeeded, monthsUntil } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function GoalsSummary() {
  const { goals } = useStore();
  const activeGoals = goals.filter((g) => !g.achieved).slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between !pb-2">
        <CardTitle>Goals</CardTitle>
        <Link href="/goals" className="text-xs text-[#7C9A92] hover:text-[#5B8A8A] flex items-center gap-1">
          View all <ArrowRight size={12} />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeGoals.length === 0 ? (
          <p className="text-sm text-[#B0ACA8] py-4 text-center">No active goals — start one!</p>
        ) : (
          activeGoals.map((goal) => {
            const percent = Math.min((goal.currentSaved / goal.targetAmount) * 100, 100);
            const monthly = monthlySavingsNeeded(goal.targetAmount, goal.currentSaved, goal.targetDate);
            const months = monthsUntil(goal.targetDate);

            return (
              <div key={goal.id} className="flex items-center gap-4 py-2">
                <ProgressRing percent={percent} size={56} strokeWidth={5}>
                  <span className="text-lg">{goal.emoji}</span>
                </ProgressRing>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-sm text-[#2D2D2D] truncate">{goal.name}</span>
                    <span className="text-xs text-[#9CA3AF] shrink-0">{Math.round(percent)}%</span>
                  </div>
                  <div className="text-xs text-[#9CA3AF] mt-0.5">
                    {formatCurrency(goal.currentSaved)} of {formatCurrency(goal.targetAmount)}
                  </div>
                  {months > 0 && monthly > 0 && (
                    <div className="text-xs text-[#7C9A92] mt-0.5">
                      {formatCurrency(monthly)}/mo needed · {months} months left
                    </div>
                  )}
                  {months <= 0 && <div className="text-xs text-[#C4A882] mt-0.5">Past target date</div>}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
