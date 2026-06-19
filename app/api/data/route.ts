import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'finance.json');

const DEFAULT_DATA = () => {
  const now = new Date();
  const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return {
    profile: { id: 1, name: 'Your Name', quote: '"A calm mind brings inner strength."', currency: 'NPR', aiProvider: 'none' },
    income: [
      { id: 1, name: 'Salary', amount: 75000, frequency: 'monthly', date: `${m}-01`, source: 'Primary Job', createdAt: now.toISOString() },
      { id: 2, name: 'Freelance Design', amount: 15000, frequency: 'one-time', date: `${m}-10`, source: 'Freelance', createdAt: now.toISOString() },
    ],
    expenses: [
      { id: 1, amount: 25000, category: 'Rent', date: `${m}-01`, note: 'Monthly rent', tags: ['fixed'], createdAt: now.toISOString() },
      { id: 2, amount: 4500, category: 'Food', date: `${m}-03`, note: 'Grocery run', tags: [], createdAt: now.toISOString() },
      { id: 3, amount: 1500, category: 'Transport', date: `${m}-05`, note: 'Bus pass', tags: ['recurring'], createdAt: now.toISOString() },
      { id: 4, amount: 800, category: 'Subscriptions', date: `${m}-07`, note: 'Spotify + Netflix', tags: ['recurring'], createdAt: now.toISOString() },
      { id: 5, amount: 3200, category: 'Food', date: `${m}-09`, note: 'Dinner with friends', tags: ['social'], createdAt: now.toISOString() },
      { id: 6, amount: 1200, category: 'Health', date: `${m}-12`, note: 'Vitamins & meds', tags: [], createdAt: now.toISOString() },
      { id: 7, amount: 2500, category: 'Shopping', date: `${m}-14`, note: 'Clothes', tags: [], createdAt: now.toISOString() },
    ],
    goals: [
      { id: 1, name: 'Emergency Fund', targetAmount: 500000, currentSaved: 160000, targetDate: '2026-12-31', emoji: '🛡️', achieved: false, createdAt: now.toISOString() },
      { id: 2, name: 'Japan Trip 2027', targetAmount: 300000, currentSaved: 95000, targetDate: '2027-03-01', emoji: '🗾', achieved: false, createdAt: now.toISOString() },
      { id: 3, name: 'New Laptop', targetAmount: 150000, currentSaved: 125000, targetDate: '2026-09-01', emoji: '💻', achieved: false, createdAt: now.toISOString() },
    ],
    goalDeposits: [
      { id: 1, goalId: 1, amount: 10000, date: `${m}-05`, note: 'Monthly saving' },
      { id: 2, goalId: 1, amount: 15000, date: `${m}-01`, note: 'Salary deduction' },
      { id: 3, goalId: 2, amount: 5000, date: `${m}-08`, note: 'Trip fund' },
      { id: 4, goalId: 3, amount: 25000, date: `${m}-02`, note: 'Freelance income' },
    ],
    customCategories: [],
    borrowLends: [],
    _nextId: { income: 3, expenses: 8, goals: 4, goalDeposits: 5, borrowLends: 1 },
  };
};

function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    const defaults = DEFAULT_DATA();
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeData(data: unknown) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  const data = readData();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  writeData(body);
  return NextResponse.json({ ok: true });
}
