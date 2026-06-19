'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { Download, Shield, Bot, User, DollarSign } from 'lucide-react';

export default function SettingsPage() {
  const { profile, updateProfile, exportData } = useStore();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '',
    quote: '',
    currency: 'USD',
    aiProvider: 'none' as 'openai' | 'anthropic' | 'none',
    aiApiKey: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        quote: profile.quote || '',
        currency: profile.currency || 'USD',
        aiProvider: profile.aiProvider || 'none',
        aiApiKey: profile.aiApiKey || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    await updateProfile(form);
    toast('Settings saved');
  };

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#2D2D2D]">Settings</h1>
        <p className="text-sm text-[#9CA3AF] mt-0.5">Personalize your calm finance experience</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User size={16} className="text-[#7C9A92]" />
            <CardTitle>Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Your Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
          />
          <Input
            label="Personal Quote"
            value={form.quote}
            onChange={(e) => setForm({ ...form, quote: e.target.value })}
            placeholder='"A calm mind brings inner strength..."'
          />
        </CardContent>
      </Card>

      {/* Currency */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-[#7C9A92]" />
            <CardTitle>Currency</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Select
            label="Display Currency"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            options={[
              { label: 'USD – US Dollar', value: 'USD' },
              { label: 'EUR – Euro', value: 'EUR' },
              { label: 'GBP – British Pound', value: 'GBP' },
              { label: 'JPY – Japanese Yen', value: 'JPY' },
              { label: 'CAD – Canadian Dollar', value: 'CAD' },
              { label: 'AUD – Australian Dollar', value: 'AUD' },
              { label: 'CHF – Swiss Franc', value: 'CHF' },
              { label: 'INR – Indian Rupee', value: 'INR' },
              { label: 'BRL – Brazilian Real', value: 'BRL' },
              { label: 'MXN – Mexican Peso', value: 'MXN' },
            ]}
          />
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-[#7C9A92]" />
            <CardTitle>AI Assistant</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="AI Provider"
            value={form.aiProvider}
            onChange={(e) => setForm({ ...form, aiProvider: e.target.value as typeof form.aiProvider })}
            options={[
              { label: 'None (offline mode)', value: 'none' },
              { label: 'OpenAI (GPT-4o-mini)', value: 'openai' },
              { label: 'Anthropic (Claude Haiku)', value: 'anthropic' },
            ]}
          />
          {form.aiProvider !== 'none' && (
            <Input
              label={`${form.aiProvider === 'openai' ? 'OpenAI' : 'Anthropic'} API Key`}
              type="password"
              value={form.aiApiKey}
              onChange={(e) => setForm({ ...form, aiApiKey: e.target.value })}
              placeholder={form.aiProvider === 'openai' ? 'sk-...' : 'sk-ant-...'}
            />
          )}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#F5F3F0] text-xs text-[#6B7280]">
            <Shield size={14} className="mt-0.5 shrink-0 text-[#9CA3AF]" />
            <p>
              Your API key is stored locally on your device and sent only to the AI provider you choose. We never see or store it.
              {form.aiProvider === 'none' && ' Without an API key, the assistant uses built-in rule-based insights.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <Button onClick={handleSave} className="w-full" size="lg">
        Save Settings
      </Button>

      {/* Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#7C9A92]" />
            <CardTitle>Data & Privacy</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[#6B7280] leading-relaxed">
            All your financial data is stored exclusively on this device using IndexedDB. Nothing is sent to any server. You own your data completely.
          </p>
          <Button variant="secondary" onClick={exportData} className="w-full">
            <Download size={15} /> Export All Data as JSON
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
