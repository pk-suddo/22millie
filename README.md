# 👑 CEO Networth

> *Know where every rupee goes. Build wealth like a CEO.*

**CEO Networth** is the cleanest personal finance tracker for daily transactions — built for Nepal, works offline, zero cloud dependency. No accounts. No subscriptions. Your data stays on your device.

🔗 **GitHub:** [github.com/pk-suddo/22millie](https://github.com/pk-suddo/22millie)

---

## 📸 Screenshots

| Dashboard | Expenses |
|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Expenses](docs/screenshots/expenses.png) |

| Income | Goals & Borrow/Lend |
|---|---|
| ![Income](docs/screenshots/income.png) | ![Goals](docs/screenshots/goals.png) |

---

## ✨ Features

### 📊 Dashboard
- Live net worth snapshot (income minus all expenses, Nepal time)
- Monthly income, spent, and recurring payment summary tiles
- Cash flow bar with savings rate
- Recent transactions feed
- Interactive calendar — tap any date to add or edit transactions

### 💰 Income
- Log income with title, source, frequency (monthly / one-time / weekly), and date
- Dark hero card with animated total and source breakdown
- Filter by source (Primary Job, Freelance, Investments, Side Hustle…)
- Edit and delete any entry inline

### 💸 Expenses
- Log with a **Title** (visible in list) + private **Note** (tap to reveal)
- Date-grouped transaction list with daily totals
- Sort by: Newest · Oldest · Highest Amount · Lowest Amount · **Group by Category**
- 12 built-in categories + unlimited custom categories (emoji + color picker)
- Hide any category from the picker — persisted across sessions
- Donut chart and Bar chart breakdown by category
- Search and filter by category

### 🎯 Goals & Savings
- Set savings goals with target amount, target date, and emoji
- Circular progress ring per goal
- Deposit log with date and note per goal

### 🤝 Borrow & Lend
- Separate **Borrowed** and **Lent** tabs — merchant-ledger style
- Per-entry detail: remaining balance, progress bar, months to clear
- Log repayments with amount, date, and comment
- Inline edit and delete each payment history entry
- Balance auto-recalculates after every change

### 🤖 AI Assistant
- Optional AI chat that reads your actual transaction data
- Personalized spending insights and financial advice

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| State | Zustand |
| Persistence | localStorage (instant) + file-based JSON sync |
| Charts | Recharts |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install & Run

```bash
git clone https://github.com/pk-suddo/22millie.git
cd 22millie
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The app loads from `localStorage` instantly — data persists across browser sessions without needing the server running.

### Build for Production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
22millie/
├── app/
│   ├── page.tsx          # Dashboard
│   ├── income/           # Income tracker
│   ├── expenses/         # Expense tracker + sort/group
│   ├── goals/            # Goals + Borrow & Lend
│   └── api/data/         # File-based sync API (GET/POST)
├── components/
│   ├── expenses/         # ExpenseForm with category picker
│   ├── goals/            # GoalForm + BorrowLendDrawer
│   ├── income/           # IncomeForm
│   └── ui/               # Modal, Input, Toast, Calendar, AnimatedNumber…
├── store/
│   └── useStore.ts       # Zustand store — localStorage + API dual persistence
├── lib/
│   ├── db.ts             # TypeScript interfaces
│   └── utils.ts          # Formatters, category data, Nepal timezone helpers
└── data/
    └── finance.json      # Server-side backup — gitignored
```

---

## 🔒 Privacy First

- `data/finance.json` is **gitignored** — never committed, never uploaded
- Data lives in **your browser's localStorage** and optionally synced to a local file
- Zero telemetry, zero analytics, zero third-party data sharing

---

## 🌏 Built for Nepal

- Currency defaults to **NPR (Nepalese Rupee)**
- All date comparisons use **Nepal Standard Time (UTC+5:45)**
- Compact formatting: NPR 1.5L, NPR 85.4K

---

## 🗺 Roadmap

- [ ] Export to CSV / PDF
- [ ] Budget limits per category with alerts
- [ ] Recurring income auto-entry each month
- [ ] Multi-currency support
- [ ] PWA / installable as mobile app

---

## 🤝 Contributing

Pull requests are welcome. Open an issue first for major changes.

1. Fork the repo
2. Create your branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT © 2026 Pritam — built with ❤️ in Nepal
