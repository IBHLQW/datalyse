import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  Users, 
  AlertCircle, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  Database,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Sparkles,
  Calculator
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { DataRow, DataInsight } from '../types';

interface DashboardProps {
  data: DataRow[];
  insights: DataInsight | null;
  isGeneratingInsights: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, insights, isGeneratingInsights }) => {
  // Extract simple stats
  const rowCount = data.length;
  const colCount = data.length > 0 ? Object.keys(data[0]).length : 0;
  
  // Try to find a numeric column for trend
  const numericKeys = React.useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter(key => {
      const val = data[0][key];
      return typeof val === 'number' || 
             (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val)));
    });
  }, [data]);
  
  const primaryMetric = numericKeys[0] || '';
  
  const chartData = data.slice(0, 20).map((row, i) => ({
    name: i.toString(),
    value: primaryMetric ? Number(row[primaryMetric]) : 0,
  }));

  // Statistical calculations
  const stats = React.useMemo(() => {
    if (!primaryMetric || data.length === 0) return null;
    
    const values = data
      .map(row => Number(row[primaryMetric]))
      .filter(v => !isNaN(v)) as number[];
    
    if (values.length === 0) return null;

    // Average
    const sum = values.reduce((a, b) => a + b, 0);
    const average = sum / values.length;

    // Median
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    // Mode
    const counts: Record<number, number> = {};
    let maxCount = 0;
    let mode: number[] = [];
    
    values.forEach(v => {
      counts[v] = (counts[v] || 0) + 1;
      if (counts[v] > maxCount) {
        maxCount = counts[v];
      }
    });

    for (const key in counts) {
      if (counts[key] === maxCount) {
        mode.push(Number(key));
      }
    }

    return {
      average: average.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      median: median.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      mode: mode.length > 3 ? 'Diverse' : mode.join(', ')
    };
  }, [data, primaryMetric]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Bento Grid Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
          <Card className="bento-card border-none bg-zinc-900 text-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-400">Payload Volume</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tighter">{rowCount.toLocaleString()}</span>
                <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">Rows</Badge>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 font-mono italic">Primary dataset ingestion completed</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bento-card">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-500">Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tighter">{colCount}</span>
                <span className="text-[10px] font-mono text-zinc-400">Attributes</span>
              </div>
              <div className="mt-3 flex gap-1 flex-wrap">
                {colCount > 0 && Object.keys(data[0]).slice(0, 3).map(header => (
                  <Badge key={header} variant="secondary" className="text-[9px] px-1.5 py-0">
                    {header}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bento-card">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-500">Processing latency</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tighter">0.42</span>
                <span className="text-[10px] font-mono text-zinc-400">ms/row</span>
              </div>
              <div className="mt-4 h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '65%' }}
                  className="h-full bg-zinc-900"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bento-card overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4">
              <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500" />
            </div>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-500">System Health</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tighter">99.9</span>
                <span className="text-[10px] font-mono text-zinc-400">%</span>
              </div>
              <p className="text-[10px] text-emerald-600 mt-2 font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Optimal
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Statistics Layer */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div variants={itemVariants}>
             <Card className="rounded-2xl border border-zinc-100 bg-white shadow-sm flex items-center p-5">
                <div className="w-12 h-12 rounded-xl bg-zinc-50 flex items-center justify-center mr-4 shrink-0">
                  <Calculator className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Average (Mean)</p>
                  <p className="text-2xl font-bold tracking-tight text-zinc-950">{stats.average}</p>
                </div>
             </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
             <Card className="rounded-2xl border border-zinc-100 bg-white shadow-sm flex items-center p-5">
                <div className="w-12 h-12 rounded-xl bg-zinc-50 flex items-center justify-center mr-4 shrink-0">
                  <Activity className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Median Value</p>
                  <p className="text-2xl font-bold tracking-tight text-zinc-950">{stats.median}</p>
                </div>
             </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
             <Card className="rounded-2xl border border-zinc-100 bg-white shadow-sm flex items-center p-5">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mr-4 shrink-0 overflow-hidden relative">
                  <Sparkles className="w-5 h-5 text-emerald-600 relative z-10" />
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="absolute inset-0 bg-emerald-100/50"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Mode (Recurring)</p>
                  <p className="text-2xl font-bold tracking-tight text-zinc-950 truncate max-w-[150px]">{stats.mode}</p>
                </div>
             </Card>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Main Chart Area */}
        <motion.div variants={itemVariants} className="lg:col-span-8">
          <Card className="rounded-2xl border border-zinc-200">
            <CardHeader className="flex flex-row items-center justify-between pb-8">
              <div className="space-y-1">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Primary Distribution
                </CardTitle>
                <CardDescription className="text-xs italic-serif">Visualizing trend variance for {primaryMetric || 'Data'}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#18181b" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      hide 
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-zinc-900 text-white p-2 rounded-lg text-[10px] font-mono border border-zinc-800 shadow-xl">
                              <p className="opacity-50 uppercase tracking-widest mb-1">Row {payload[0].payload.name}</p>
                              <p className="text-sm font-bold">{payload[0].value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#18181b" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Insight Sidebar */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <Card className="h-full rounded-2xl border border-zinc-200 overflow-hidden bg-zinc-50/50">
            <CardHeader className="bg-white border-b border-zinc-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="border-zinc-900/10 text-zinc-900 bg-white shadow-sm font-mono text-[9px] uppercase tracking-widest px-2">
                  AI ENGINE v2.5
                </Badge>
                <motion.div 
                  animate={isGeneratingInsights ? { rotate: 360 } : {}}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                  <BarChart3 className="w-4 h-4 text-zinc-300" />
                </motion.div>
              </div>
              <CardTitle className="text-lg font-bold italic-serif">Executive Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isGeneratingInsights ? (
                <div className="space-y-4">
                  <div className="h-4 w-3/4 bg-zinc-200 rounded animate-pulse" />
                  <div className="h-20 w-full bg-zinc-100 rounded animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-zinc-100 rounded animate-pulse" />
                    <div className="h-3 w-5/6 bg-zinc-100 rounded animate-pulse" />
                    <div className="h-3 w-4/6 bg-zinc-100 rounded animate-pulse" />
                  </div>
                </div>
              ) : insights ? (
                <div className="space-y-6">
                  <div>
                    <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Overview</h5>
                    <p className="text-sm text-zinc-600 leading-relaxed">{insights.summary}</p>
                  </div>
                  
                  <Separator className="bg-zinc-200/50" />
                  
                  <div>
                    <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Key Findings</h5>
                    <ul className="space-y-3">
                      {insights.keyFindings.map((finding, i) => (
                        <li key={i} className="flex gap-3 text-sm group">
                          <span className="text-[10px] font-mono text-zinc-400 mt-1">0{i+1}</span>
                          <span className="text-zinc-700 leading-tight group-hover:text-zinc-900 transition-colors">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4">
                    <button className="w-full py-3 bg-zinc-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2">
                      Full Intelligent Report
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-zinc-400 italic">No insights generated yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};
