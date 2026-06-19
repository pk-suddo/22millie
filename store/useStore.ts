import { create } from 'zustand';
import { getMonthKey } from '@/lib/utils';
import type { Income, Expense, Goal, GoalDeposit, UserProfile, CustomCategory, BorrowLend } from '@/lib/db';

interface DB {
  income: Income[];
  expenses: Expense[];
  goals: Goal[];
  goalDeposits: GoalDeposit[];
  customCategories: CustomCategory[];
  borrowLends: BorrowLend[];
  profile: UserProfile;
  _nextId: Record<string, number>;
}

async function load(): Promise<DB> {
  const res = await fetch('/api/data');
  return res.json();
}

async function save(data: DB) {
  await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

interface FinanceState {
  income: Income[];
  expenses: Expense[];
  goals: Goal[];
  goalDeposits: GoalDeposit[];
  customCategories: CustomCategory[];
  borrowLends: BorrowLend[];
  profile: UserProfile | null;
  selectedMonth: string;
  isLoading: boolean;
  aiChatOpen: boolean;

  loadAll: () => Promise<void>;
  setSelectedMonth: (month: string) => void;
  toggleAIChat: () => void;

  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => Promise<void>;
  updateIncome: (id: number, income: Partial<Income>) => Promise<void>;
  deleteIncome: (id: number) => Promise<void>;

  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: number, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;

  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: number, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: number) => Promise<void>;
  addGoalDeposit: (goalId: number, amount: number, note?: string) => Promise<void>;

  addCategory: (cat: CustomCategory) => Promise<void>;
  removeCategory: (value: string) => Promise<void>;

  addBorrowLend: (entry: Omit<BorrowLend, 'id' | 'createdAt'>) => Promise<void>;
  updateBorrowLend: (id: number, updates: Partial<BorrowLend>) => Promise<void>;
  deleteBorrowLend: (id: number) => Promise<void>;
  logBLPayment: (id: number, amount: number) => Promise<void>;

  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  exportData: () => void;
}

export const useStore = create<FinanceState>((set, get) => ({
  income: [],
  expenses: [],
  goals: [],
  goalDeposits: [],
  customCategories: [],
  borrowLends: [],
  profile: null,
  selectedMonth: getMonthKey(),
  isLoading: true,
  aiChatOpen: false,

  loadAll: async () => {
    set({ isLoading: true });
    const db = await load();
    set({
      income: db.income ?? [],
      expenses: db.expenses ?? [],
      goals: db.goals ?? [],
      goalDeposits: db.goalDeposits ?? [],
      customCategories: db.customCategories ?? [],
      borrowLends: db.borrowLends ?? [],
      profile: db.profile ?? null,
      isLoading: false,
    });
  },

  setSelectedMonth: (month) => set({ selectedMonth: month }),
  toggleAIChat: () => set((s) => ({ aiChatOpen: !s.aiChatOpen })),

  addIncome: async (income) => {
    const db = await load();
    const id = (db._nextId.income ?? 1);
    db.income.push({ ...income, id, createdAt: new Date().toISOString() });
    db._nextId.income = id + 1;
    await save(db);
    await get().loadAll();
  },

  updateIncome: async (id, updates) => {
    const db = await load();
    db.income = db.income.map(i => i.id === id ? { ...i, ...updates } : i);
    await save(db);
    await get().loadAll();
  },

  deleteIncome: async (id) => {
    const db = await load();
    db.income = db.income.filter(i => i.id !== id);
    await save(db);
    await get().loadAll();
  },

  addExpense: async (expense) => {
    const db = await load();
    const id = (db._nextId.expenses ?? 1);
    db.expenses.push({ ...expense, id, createdAt: new Date().toISOString() });
    db._nextId.expenses = id + 1;
    await save(db);
    await get().loadAll();
  },

  updateExpense: async (id, updates) => {
    const db = await load();
    db.expenses = db.expenses.map(e => e.id === id ? { ...e, ...updates } : e);
    await save(db);
    await get().loadAll();
  },

  deleteExpense: async (id) => {
    const db = await load();
    db.expenses = db.expenses.filter(e => e.id !== id);
    await save(db);
    await get().loadAll();
  },

  addGoal: async (goal) => {
    const db = await load();
    const id = (db._nextId.goals ?? 1);
    db.goals.push({ ...goal, id, createdAt: new Date().toISOString() });
    db._nextId.goals = id + 1;
    await save(db);
    await get().loadAll();
  },

  updateGoal: async (id, updates) => {
    const db = await load();
    db.goals = db.goals.map(g => g.id === id ? { ...g, ...updates } : g);
    await save(db);
    await get().loadAll();
  },

  deleteGoal: async (id) => {
    const db = await load();
    db.goals = db.goals.filter(g => g.id !== id);
    db.goalDeposits = db.goalDeposits.filter(d => d.goalId !== id);
    await save(db);
    await get().loadAll();
  },

  addGoalDeposit: async (goalId, amount, note) => {
    const db = await load();
    const id = (db._nextId.goalDeposits ?? 1);
    db.goalDeposits.push({ id, goalId, amount, date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kathmandu' }), note });
    db._nextId.goalDeposits = id + 1;
    const goal = db.goals.find(g => g.id === goalId);
    if (goal) goal.currentSaved += amount;
    await save(db);
    await get().loadAll();
  },

  addCategory: async (cat) => {
    const db = await load();
    if (!db.customCategories) db.customCategories = [];
    if (!db.customCategories.find(c => c.value === cat.value)) {
      db.customCategories.push(cat);
    }
    await save(db);
    await get().loadAll();
  },

  removeCategory: async (value) => {
    const db = await load();
    if (!db.customCategories) db.customCategories = [];
    db.customCategories = db.customCategories.filter(c => c.value !== value);
    await save(db);
    await get().loadAll();
  },

  addBorrowLend: async (entry) => {
    const db = await load();
    if (!db.borrowLends) db.borrowLends = [];
    const id = db._nextId.borrowLends ?? 1;
    db.borrowLends.push({ ...entry, id, createdAt: new Date().toISOString() });
    db._nextId.borrowLends = id + 1;
    await save(db);
    await get().loadAll();
  },

  updateBorrowLend: async (id, updates) => {
    const db = await load();
    if (!db.borrowLends) db.borrowLends = [];
    db.borrowLends = db.borrowLends.map(b => b.id === id ? { ...b, ...updates } : b);
    await save(db);
    await get().loadAll();
  },

  deleteBorrowLend: async (id) => {
    const db = await load();
    if (!db.borrowLends) db.borrowLends = [];
    db.borrowLends = db.borrowLends.filter(b => b.id !== id);
    await save(db);
    await get().loadAll();
  },

  logBLPayment: async (id, amount) => {
    const db = await load();
    if (!db.borrowLends) db.borrowLends = [];
    db.borrowLends = db.borrowLends.map(b =>
      b.id === id ? { ...b, paidAmount: Math.min(b.paidAmount + amount, b.totalAmount) } : b
    );
    await save(db);
    await get().loadAll();
  },

  updateProfile: async (updates) => {
    const db = await load();
    db.profile = { ...db.profile, ...updates };
    await save(db);
    await get().loadAll();
  },

  exportData: () => {
    const { income, expenses, goals, goalDeposits, profile } = get();
    const data = { income, expenses, goals, goalDeposits, profile, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `22millie-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
}));
