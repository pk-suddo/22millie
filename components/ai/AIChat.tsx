'use client';
import { useStore } from '@/store/useStore';
import { useEffect, useRef, useState } from 'react';
import { X, Send, Bot, Loader2 } from 'lucide-react';
import { formatCurrency, getMonthKey } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function buildContext(income: typeof useStore extends (arg: infer A) => infer R ? (R extends { income: infer I } ? I : never) : never, expenses: unknown[], goals: unknown[], profile: unknown) {
  return '';
}

export function AIChat() {
  const { aiChatOpen, toggleAIChat, income, expenses, goals, profile, selectedMonth } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your calm finance assistant. Ask me anything about your finances — goals, spending patterns, savings projections, or what you can afford." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aiChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [aiChatOpen]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const monthIncome = income.filter((i) => i.date.startsWith(selectedMonth));
  const monthExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));
  const totalIncome = monthIncome.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0);

  const buildSystemContext = () => {
    const goalsText = goals.map((g) => `${g.emoji} ${g.name}: saved ${formatCurrency(g.currentSaved)} of ${formatCurrency(g.targetAmount)} (target: ${g.targetDate})`).join(', ');
    return `You are a calm, supportive personal finance assistant. The user's finances for ${getMonthKey()}:
- Total income this month: ${formatCurrency(totalIncome)}
- Total expenses this month: ${formatCurrency(totalExpenses)}
- Net savings this month: ${formatCurrency(totalIncome - totalExpenses)}
- Active goals: ${goalsText || 'None set'}
- Currency: ${profile?.currency || 'USD'}

Be warm, encouraging, and concise. Give specific numbers when helpful. Keep responses under 3 sentences unless more detail is genuinely needed.`;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const apiKey = profile?.aiApiKey;
      const provider = profile?.aiProvider;

      if (!apiKey || provider === 'none') {
        // Offline fallback
        await new Promise((r) => setTimeout(r, 600));
        const net = totalIncome - totalExpenses;
        let reply = `I'm currently in offline mode (no AI API key configured). Based on your data: this month you've earned ${formatCurrency(totalIncome)} and spent ${formatCurrency(totalExpenses)}, leaving ${formatCurrency(net)} in savings. Head to Settings to connect an AI provider for smart insights!`;
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMsg }],
          systemContext: buildSystemContext(),
          apiKey,
          provider,
        }),
      });

      if (!res.ok) throw new Error('API error');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || parsed.delta?.text || '';
              assistantText += delta;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: assistantText };
                return next;
              });
            } catch {}
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I had trouble connecting. Please check your API settings and try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!aiChatOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-[#E8E5E0] shadow-[-8px_0_32px_rgba(0,0,0,0.06)] z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0EDE8]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#EBF2F0] flex items-center justify-center">
            <Bot size={16} className="text-[#7C9A92]" />
          </div>
          <div>
            <div className="font-semibold text-sm text-[#2D2D2D]">Finance Assistant</div>
            <div className="text-xs text-[#9CA3AF]">
              {profile?.aiProvider === 'none' ? 'Offline mode' : 'AI powered'}
            </div>
          </div>
        </div>
        <button
          onClick={toggleAIChat}
          className="p-1.5 rounded-lg hover:bg-[#F0EDE8] text-[#9CA3AF]"
        >
          <X size={16} />
        </button>
      </div>

      {/* Quick prompts */}
      {messages.length === 1 && (
        <div className="px-4 py-3 border-b border-[#F0EDE8]">
          <p className="text-xs text-[#9CA3AF] mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              'Am I saving enough?',
              'When will I hit my goals?',
              'Where am I overspending?',
              'How much can I spend on vacation?',
            ].map((q) => (
              <button
                key={q}
                onClick={() => { setInput(q); inputRef.current?.focus(); }}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-[#F5F3F0] text-[#6B7280] hover:bg-[#EBF2F0] hover:text-[#5B8A8A] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-[#7C9A92] text-white rounded-br-md'
                  : 'bg-[#F5F3F0] text-[#2D2D2D] rounded-bl-md'
              )}
            >
              {msg.content || (loading && i === messages.length - 1 && (
                <Loader2 size={14} className="animate-spin text-[#9CA3AF]" />
              ))}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-[#F0EDE8]">
        <div className="flex items-center gap-2 bg-[#F5F3F0] rounded-xl px-3.5 py-2.5">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent text-sm text-[#2D2D2D] placeholder:text-[#B0ACA8] focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-1 rounded-lg text-[#7C9A92] hover:text-[#5B8A8A] disabled:text-[#C0BFBC] disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <p className="text-center text-[10px] text-[#C0BFBC] mt-2">Data stays on your device</p>
      </div>
    </div>
  );
}
