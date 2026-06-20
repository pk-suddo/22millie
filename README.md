# 22millie 💰

> *Your money, your story — tracked with calm.*

**22millie** is a privacy-first, local personal finance tracker built for the Nepali context. No accounts, no cloud sync, no subscriptions — your financial data lives entirely on your own device.

---

## ✨ Features

### 📊 Dashboard
- Live net worth snapshot (income minus expenses, up to today's date in Nepal time)
- Income, Spent, and Recurring payment tiles for the current month
- Cash flow bar with savings rate percentage
- Recent transactions feed
- Interactive calendar — tap any day to add, edit, or delete income and expenses

### 💰 Income
- Log income with title, amount, source, frequency (monthly / one-time / weekly), and date
- Dark galaxy hero card with animated total
- Interactive source breakdown cards (Primary Job, Freelance, Investments, Side Hustle, etc.)
- Tap any source card to filter the list

### 💸 Expenses
- Log expenses with a **Title** (shown in list) and a private **Note** (only visible when tapped)
- 12 built-in categories + unlimited custom categories with emoji + color picker
- Hide any category from the picker (persisted across sessions)
- Recurring expense toggle
- Tap any transaction row to reveal the private note inline
- Donut chart and Bar chart views by category

### 🎯 Goals
- Savings goals with target amount, target date, and emoji
- Circular progress ring per goal
- Deposit history with date and note

### 🤝 Borrow & Lend
- Separate **Borrowed** and **Lent** tabs — merchant-ledger style
- Per-entry detail drawer: remaining balance, progress bar, months to clear
- Log repayments with amount, date, and comment
- **Inline edit & delete** each payment history entry
- Remaining balance auto-recalculates after every edit or deletion

### 🤖 AI Assistant
- Optional AI chat powered by OpenAI or Anthropic
- Reads your actual transaction data for personalized financial insights

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| State | Zustand |
| Persistence | File-based JSON (`data/finance.json`) via Next.js API routes |
| Charts | Recharts |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install & Run

```bash
git clone https://github.com/vincity409/22millie.git
cd 22millie
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The app seeds sample data on first launch so you can explore immediately.

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
│   ├── expenses/         # Expense tracker
│   ├── goals/            # Goals + Borrow & Lend
│   └── api/data/         # File-based persistence API (GET/POST)
├── components/
│   ├── expenses/         # ExpenseForm with category picker
│   ├── goals/            # GoalForm
│   ├── income/           # IncomeForm
│   └── ui/               # Modal, Input, Toast, Calendar, AnimatedNumber…
├── store/
│   └── useStore.ts       # Zustand global store + all mutations
├── lib/
│   ├── db.ts             # TypeScript interfaces (Income, Expense, Goal, BorrowLend…)
│   └── utils.ts          # Formatters, category data, Nepal timezone helpers
└── data/
    └── finance.json      # Your local data — gitignored, stays on your machine
```

---

## 🔒 Privacy

`data/finance.json` is listed in `.gitignore` and **never leaves your machine**. There is no telemetry, no analytics, and no third-party data sharing of any kind.

---

## 🌏 Nepal-First Design

- Currency defaults to **NPR (Nepalese Rupee)**
- All dates and "today" comparisons use **Nepal Standard Time (UTC+5:45)** to avoid timezone drift
- Compact number formatting: NPR 1.5L, NPR 85.4K

---

## 🗺 Roadmap

- [ ] Export to CSV / PDF
- [ ] Budget limits per category with alerts
- [ ] Recurring income auto-entry each month
- [ ] Multi-currency support
- [ ] PWA / installable mobile app

---

## 🤝 Contributing

Pull requests are welcome. For major changes please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT © 2026 Pritam — built with ❤️ in Nepal
