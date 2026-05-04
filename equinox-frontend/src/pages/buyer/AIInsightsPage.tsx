import React, { useState } from 'react';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Send, Sparkles, Zap } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { aiService } from '../../services/ai.service';

const SUGGESTED_QUESTIONS = [
  'Which provider gives me the best value for money?',
  'What is my estimated spending for Q3 2026?',
  'Are there any SLA risks in my current contracts?',
  'Recommend providers for a mobile app project',
];

const IMPACT_COLOR: Record<string, string> = {
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  URGENT: 'bg-red-100 text-red-700',
  LOW: 'bg-surface-100 text-surface-600',
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  recommendation: <Lightbulb size={18} className="text-amber-500" />,
  trend: <TrendingUp size={18} className="text-blue-500" />,
  alert: <AlertTriangle size={18} className="text-red-500" />,
  cost: <Zap size={18} className="text-purple-500" />,
};

const TYPE_BG: Record<string, string> = {
  recommendation: 'bg-amber-50',
  trend: 'bg-blue-50',
  alert: 'bg-red-50',
  cost: 'bg-purple-50',
};

const AIInsightsPage: React.FC = () => {
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'Hello! I\'m your Equinox AI Copilot. I can analyze your spending patterns, provider performance, and contracts to give you actionable insights. What would you like to know?' },
  ]);
  const [loading, setLoading] = useState(false);

  const { data: insights } = useApi(() => aiService.getInsights(), []);
  const insightsList: Record<string, unknown>[] = insights || [];

  const handleSend = async (text?: string) => {
    const msg = text || chatInput;
    if (!msg.trim()) return;
    setChatHistory(h => [...h, { role: 'user', text: msg }]);
    setChatInput('');
    setLoading(true);
    try {
      const res = await aiService.chat(msg);
      setChatHistory(h => [...h, { role: 'assistant', text: res?.reply || res?.message || 'I\'ve analyzed your request. Based on your account data, I recommend reviewing your active contracts and spending patterns for optimization opportunities.' }]);
    } catch {
      // Fallback responses if AI endpoint fails
      const RESPONSES: Record<string, string> = {
        default: 'Based on your account data, I\'ve analyzed your service history and identified some key opportunities. Would you like me to elaborate on any specific area — spending optimization, provider performance, or contract management?',
      };
      const question = msg.toLowerCase();
      let response = RESPONSES.default;
      if (question.includes('value') || question.includes('money')) {
        response = 'Your best value providers are those with high completion rates and competitive rates. Check the Providers section for detailed performance metrics.';
      } else if (question.includes('spending') || question.includes('q3')) {
        response = 'Based on your current contracts and historical patterns, review your invoice history in the Wallet section for spending projections.';
      } else if (question.includes('sla') || question.includes('risk')) {
        response = 'Check your Tasks section for SLA breach indicators — tasks marked with red "SLA Breached" badges require immediate attention.';
      } else if (question.includes('mobile') || question.includes('app')) {
        response = 'For mobile app development, browse the Marketplace for providers with "Mobile Development" or "Software" categories. Filter by rating and check their completed jobs.';
      }
      setChatHistory(h => [...h, { role: 'assistant', text: response }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <Brain size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">AI Insights</h1>
          <p className="text-surface-500 text-sm">Powered by Equinox AI Copilot</p>
        </div>
        <span className="ml-auto badge bg-purple-100 text-purple-700 px-3 py-1.5 text-xs font-medium">
          <Sparkles size={12} className="inline mr-1" />Beta
        </span>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Insights cards */}
        <div className="space-y-4">
          <h2 className="font-bold text-surface-800">Automated Insights</h2>
          {insightsList.length === 0 && (
            <div className="text-center py-12 text-surface-400">
              <Brain size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No insights yet. Use the AI Copilot to analyze your account.</p>
            </div>
          )}
          {insightsList.map((insight, i) => {
            const type = (insight.type as string || 'recommendation').toLowerCase();
            return (
              <div key={insight.id as string || i} className="card border border-surface-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_BG[type] || 'bg-surface-50'}`}>
                    {TYPE_ICON[type] || <Lightbulb size={18} className="text-surface-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-surface-800 text-sm">{insight.title as string}</h3>
                      {insight.impact && (
                        <span className={`badge text-xs font-medium ${IMPACT_COLOR[(insight.impact as string).toUpperCase()] || IMPACT_COLOR.LOW}`}>
                          {insight.impact as string}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-surface-600 leading-relaxed">{insight.content as string}</p>
                    <button className="text-xs text-primary-600 font-medium mt-2 hover:underline">Take action →</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Chat */}
        <div className="card flex flex-col" style={{ minHeight: '500px' }}>
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-surface-100">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Brain size={15} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-surface-800 text-sm">AI Copilot</p>
              <p className="text-xs text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" /> Online</p>
            </div>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 scrollbar-thin">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : 'bg-surface-100 text-surface-800 rounded-bl-md'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface-100 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggested questions */}
          <div className="flex gap-2 flex-wrap mb-3">
            {SUGGESTED_QUESTIONS.map(q => (
              <button key={q} onClick={() => handleSend(q)} className="text-xs bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full border border-primary-200 hover:bg-primary-100 transition-colors">
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything about your account..."
              className="flex-1 bg-transparent text-sm outline-none text-surface-700 placeholder-surface-400"
            />
            <button onClick={() => handleSend()} className="w-8 h-8 bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center justify-center text-white transition-colors">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsPage;
