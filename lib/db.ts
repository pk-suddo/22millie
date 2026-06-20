import Dexie, { type Table } from 'dexie';

export interface Income {
  id?: number;
  name: string;
  amount: number;
  frequency: 'monthly' | 'one-time' | 'weekly';
  date: string;
  source: string;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id?: number;
  amount: number;
  category: string;
  date: string;
  note: string;
  tags: string[];
  createdAt: string;
}

export interface Goal {
  id?: number;
  name: string;
  targetAmount: number;
  currentSaved: number;
  targetDate: string;
  emoji: string;
  achieved: boolean;
  createdAt: string;
}

export interface GoalDeposit {
  id?: number;
  goalId: number;
  amount: number;
  date: string;
  note?: string;
}

export interface CustomCategory {
  value: string;
  label: string;
  icon: string;
  color: string;
}

export interface BLPayment {
  id: number;
  amount: number;
  date: string;
  note?: string;
}

export interface BorrowLend {
  id?: number;
  name: string;
  direction: 'borrowed' | 'lent';
  totalAmount: number;
  paidAmount: number;
  monthlyPayment: number;
  startDate: string;
  note?: string;
  payments: BLPayment[];
  createdAt: string;
}

export interface AIInsight {
  id?: number;
  text: string;
  type: 'tip' | 'warning' | 'celebration' | 'prediction';
  generatedAt: string;
}

export interface UserProfile {
  id?: number;
  name: string;
  quote: string;
  photoUrl?: string;
  currency: string;
  aiProvider: 'openai' | 'anthropic' | 'none';
  aiApiKey?: string;
}

class CalmFinanceDB extends Dexie {
  income!: Table<Income>;
  expenses!: Table<Expense>;
  goals!: Table<Goal>;
  goalDeposits!: Table<GoalDeposit>;
  insights!: Table<AIInsight>;
  profile!: Table<UserProfile>;

  constructor() {
    super('CalmFinanceDB');
    this.version(1).stores({
      income: '++id, date, source, frequency',
      expenses: '++id, date, category',
      goals: '++id, targetDate, achieved',
      insights: '++id, generatedAt',
      profile: '++id',
    });
    this.version(2).stores({
      income: '++id, date, source, frequency',
      expenses: '++id, date, category',
      goals: '++id, targetDate, achieved',
      goalDeposits: '++id, goalId, date',
      insights: '++id, generatedAt',
      profile: '++id',
    });
  }
}

export const db = new CalmFinanceDB();

export async function seedIfEmpty() {
  const profileCount = await db.profile.count();
  if (profileCount === 0) {
    await db.profile.add({
      name: 'Your Name',
      quote: '"A calm mind brings inner strength."',
      currency: 'NPR',
      aiProvider: 'none',
    });
  } else {
    // Migrate currency to NPR
    const profiles = await db.profile.toArray();
    if (profiles[0] && profiles[0].currency === 'USD') {
      await db.profile.update(profiles[0].id!, { currency: 'NPR' });
    }
  }

  const incomeCount = await db.income.count();
  if (incomeCount === 0) {
    const now = new Date();
    const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await db.income.bulkAdd([
      { name: 'Salary', amount: 75000, frequency: 'monthly', date: `${m}-01`, source: 'Primary Job', createdAt: new Date().toISOString() },
      { name: 'Freelance Design', amount: 15000, frequency: 'one-time', date: `${m}-10`, source: 'Freelance', createdAt: new Date().toISOString() },
    ]);
  }

  const goalsCount = await db.goals.count();
  if (goalsCount === 0) {
    const g1 = await db.goals.add({ name: 'Emergency Fund', targetAmount: 500000, currentSaved: 160000, targetDate: '2026-12-31', emoji: '🛡️', achieved: false, createdAt: new Date().toISOString() });
    const g2 = await db.goals.add({ name: 'Japan Trip 2027', targetAmount: 300000, currentSaved: 95000, targetDate: '2027-03-01', emoji: '🗾', achieved: false, createdAt: new Date().toISOString() });
    const g3 = await db.goals.add({ name: 'New Laptop', targetAmount: 150000, currentSaved: 125000, targetDate: '2026-09-01', emoji: '💻', achieved: false, createdAt: new Date().toISOString() });

    const now = new Date();
    const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await db.goalDeposits.bulkAdd([
      { goalId: g1 as number, amount: 10000, date: `${m}-05`, note: 'Monthly saving' },
      { goalId: g1 as number, amount: 15000, date: `${m}-01`, note: 'Salary deduction' },
      { goalId: g1 as number, amount: 10000, date: `2026-05-15`, note: 'Bonus' },
      { goalId: g2 as number, amount: 5000, date: `${m}-08`, note: 'Trip fund' },
      { goalId: g2 as number, amount: 8000, date: `2026-05-20`, note: 'Monthly saving' },
      { goalId: g3 as number, amount: 25000, date: `${m}-02`, note: 'Freelance income' },
      { goalId: g3 as number, amount: 20000, date: `2026-05-10`, note: 'Monthly saving' },
    ]);
  }

  const expenseCount = await db.expenses.count();
  if (expenseCount === 0) {
    const now = new Date();
    const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await db.expenses.bulkAdd([
      { amount: 25000, category: 'Rent', date: `${m}-01`, note: 'Monthly rent', tags: ['fixed'], createdAt: new Date().toISOString() },
      { amount: 4500, category: 'Food', date: `${m}-03`, note: 'Grocery run', tags: [], createdAt: new Date().toISOString() },
      { amount: 1500, category: 'Transport', date: `${m}-05`, note: 'Bus pass', tags: ['recurring'], createdAt: new Date().toISOString() },
      { amount: 800, category: 'Subscriptions', date: `${m}-07`, note: 'Spotify + Netflix', tags: ['recurring'], createdAt: new Date().toISOString() },
      { amount: 3200, category: 'Food', date: `${m}-09`, note: 'Dinner with friends', tags: ['social'], createdAt: new Date().toISOString() },
      { amount: 1200, category: 'Health', date: `${m}-12`, note: 'Vitamins & meds', tags: [], createdAt: new Date().toISOString() },
      { amount: 2500, category: 'Shopping', date: `${m}-14`, note: 'Clothes', tags: [], createdAt: new Date().toISOString() },
    ]);
  }
}
