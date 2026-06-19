'use client';
import { useStore } from '@/store/useStore';
import { EXPENSE_CATEGORIES, CATEGORY_COLORS, formatCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-[#E8E5E0] rounded-xl px-3.5 py-2.5 shadow-lg">
        <p className="text-sm font-medium text-[#2D2D2D]">{payload[0].name}</p>
        <p className="text-sm text-[#7C9A92]">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export function SpendingChart() {
  const { expenses, selectedMonth } = useStore();

  const monthExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));

  const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
    name: cat.label,
    value: monthExpenses
      .filter((e) => e.category === cat.value)
      .reduce((s, e) => s + e.amount, 0),
    color: CATEGORY_COLORS[cat.value] || '#B0A8B0',
    icon: cat.icon,
    key: cat.value,
  })).filter((c) => c.value > 0).sort((a, b) => b.value - a.value);

  if (byCategory.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Spending Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-[#B0ACA8] text-sm">
            No expenses logged this month
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = byCategory.reduce((s, c) => s + c.value, 0);

  return (
    <Card>
      <CardHeader><CardTitle>Spending Breakdown</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="w-48 h-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {byCategory.map((entry, index) => (
                    <Cell key={index} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2 w-full">
            {byCategory.map((cat) => (
              <div key={cat.key} className="flex items-center gap-3">
                <span className="text-base shrink-0">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm text-[#4A4A4A] truncate">{cat.name}</span>
                    <span className="text-sm font-medium text-[#2D2D2D] ml-2 shrink-0">{formatCurrency(cat.value)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#F0EDE8] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(cat.value / total) * 100}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
