'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from '@/lib/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  MessageSquare, AlertCircle, CheckCircle, RefreshCcw, TrendingUp, Loader2 
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface Feedback {
  ID: number;
  content: string;
  source: string;
  sentiment: string;
  category: string;
  summary: string;
  is_processed: boolean;
  CreatedAt?: string;
}

const SENTIMENT_COLORS = {
  positive: '#10b981', // emerald-500
  negative: '#ef4444', // red-500
  neutral: '#f59e0b',  // amber-500
};

const CATEGORY_COLORS = {
  praise: '#3b82f6', // blue-500
  bug: '#ef4444',    // red-500
  feature_request: '#8b5cf6', // violet-500
  uncategorized: '#64748b', // slate-500
};

export default function FeedbackDashboard() {
  const [data, setData] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await axios.get<Feedback[]>('/feedback');
      setData(res.data);
    } catch (err) {
      console.error("Error fetching feedback", err);
      setError("Failed to load feedback. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // --- Data Transformation for Charts ---
  const stats = {
    total: data.length,
    processed: data.filter(f => f.is_processed).length,
    pending: data.filter(f => !f.is_processed).length,
  };

  const categoryCounts = data.reduce((acc, curr) => {
    const cat = curr.category || 'uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({
    name: name.replace('_', ' '), // "feature_request" -> "feature request"
    value,
    originalKey: name
  }));

  const sentimentCounts = {
    positive: data.filter(f => f.sentiment === 'positive').length,
    negative: data.filter(f => f.sentiment === 'negative').length,
    neutral: data.filter(f => f.sentiment === 'neutral').length,
  };

  const sentimentData = [
    { name: 'Positive', value: sentimentCounts.positive, color: SENTIMENT_COLORS.positive },
    { name: 'Negative', value: sentimentCounts.negative, color: SENTIMENT_COLORS.negative },
    { name: 'Neutral', value: sentimentCounts.neutral, color: SENTIMENT_COLORS.neutral },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-500" size={48} />
          <p className="text-slate-400">Loading feedback data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-50 p-4">
        <div className="bg-slate-900 border border-red-900/50 p-8 rounded-2xl max-w-md w-full text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button 
            onClick={fetchData}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Feedback Funnel
          </h1>
          <p className="text-slate-400">AI-powered sentiment & category analysis</p>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 hover:border-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCcw size={18} className={clsx({ "animate-spin": refreshing })} /> 
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {/* --- Stats Row --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          icon={<MessageSquare className="text-blue-400" />} 
          label="Total Feedback" 
          value={stats.total} 
          color="blue"
        />
        <StatCard 
          icon={<CheckCircle className="text-emerald-400" />} 
          label="Processed" 
          value={stats.processed} 
          color="emerald"
        />
        <StatCard 
          icon={<AlertCircle className="text-amber-400" />} 
          label="Pending AI" 
          value={stats.pending} 
          color="amber"
          animate={stats.pending > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* --- Category Chart --- */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-400" /> Category Breakdown
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  className="capitalize"
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  cursor={{ fill: '#1e293b' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.originalKey as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.uncategorized} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- Sentiment Chart --- */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-4">Sentiment Distribution</h2>
          <div className="h-64 flex items-center justify-center">
            {sentimentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 flex flex-col items-center">
                <AlertCircle size={32} className="mb-2 opacity-50" />
                No sentiment data yet
              </div>
            )}
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-4 mt-4">
            {sentimentData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- Feedback Table --- */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-lg font-semibold">Recent Feedback</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-medium tracking-wider">
              <tr>
                <th className="p-4 w-24">Source</th>
                <th className="p-4">Content & Summary</th>
                <th className="p-4 w-32">Category</th>
                <th className="p-4 w-32">Sentiment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No feedback records found.
                  </td>
                </tr>
              ) : (
                data.map((fb) => (
                  <tr key={fb.ID} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4 align-top">
                      <span className="px-2 py-1 bg-slate-800 rounded text-xs font-mono text-slate-300 border border-slate-700">{fb.source}</span>
                    </td>
                    <td className="p-4 align-top">
                      <p className="font-medium text-slate-200 mb-1">
                        {fb.is_processed ? fb.summary : <span className="text-slate-500 italic flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Processing AI...</span>}
                      </p>
                      <p className="text-sm text-slate-500 line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
                        "{fb.content}"
                      </p>
                    </td>
                    <td className="p-4 align-top">
                      <CategoryBadge category={fb.category} />
                    </td>
                    <td className="p-4 align-top">
                       <SentimentBadge sentiment={fb.sentiment} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Subcomponents ---

function StatCard({ icon, label, value, color, animate = false }: { icon: React.ReactNode, label: string, value: number, color: string, animate?: boolean }) {
  const borderColors: Record<string, string> = {
    blue: 'group-hover:border-blue-500/30',
    emerald: 'group-hover:border-emerald-500/30',
    amber: 'group-hover:border-amber-500/30',
  };

  return (
    <div className={twMerge(
      "bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex items-center gap-4 transition-all duration-300 hover:bg-slate-800/50 group",
      borderColors[color]
    )}>
      <div className={twMerge(
        "p-4 rounded-xl transition-all duration-300", 
        color === 'blue' && "bg-blue-500/10 text-blue-500",
        color === 'emerald' && "bg-emerald-500/10 text-emerald-500",
        color === 'amber' && "bg-amber-500/10 text-amber-500",
      )}>
        {animate ? <div className="animate-pulse">{icon}</div> : icon}
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-slate-100">{value}</p>
      </div>
    </div>
  );
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const styles: Record<string, string> = {
    positive: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    negative: 'bg-red-500/10 text-red-500 border-red-500/20',
    neutral: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  };
  
  const normalizedSentiment = sentiment?.toLowerCase() || 'pending';

  if (!sentiment) return <span className="text-xs text-slate-600 font-mono">PENDING</span>;

  return (
    <span className={twMerge("px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider", styles[normalizedSentiment] || 'bg-slate-800 text-slate-500 border-slate-700')}>
      {sentiment}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    bug: 'text-red-400 bg-red-400/10 border-red-400/20',
    feature_request: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    praise: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  };

  const normalizedCategory = category?.toLowerCase();

  if (!category) return <span className="text-slate-600 text-sm">-</span>;

  return (
    <span className={twMerge("px-2 py-1 rounded-md border text-xs font-semibold capitalize whitespace-nowrap", styles[normalizedCategory] || 'text-slate-400 bg-slate-800 border-slate-700')}>
      {category.replace('_', ' ')}
    </span>
  );
}