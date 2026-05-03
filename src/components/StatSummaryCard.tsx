import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sigma, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertCircle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Target
} from 'lucide-react';
import { motion } from 'motion/react';
import * as ss from 'simple-statistics';

interface StatSummaryCardProps {
  columnName: string;
  data: any[];
}

export const StatSummaryCard: React.FC<StatSummaryCardProps> = ({ columnName, data }) => {
  const stats = useMemo(() => {
    const values = data
      .map(d => Number(d[columnName]))
      .filter(v => !isNaN(v));

    if (values.length < 2) return null;

    try {
      const mean = ss.mean(values);
      const median = ss.median(values);
      const standardDeviation = ss.standardDeviation(values);
      const min = ss.min(values);
      const max = ss.max(values);
      const skewness = values.length > 2 ? ss.sampleSkewness(values) : 0;
      
      // Basic Normality Suggestion (very simplified)
      const isNormallyDistributed = Math.abs(skewness) < 0.5;

      return {
        mean,
        median,
        stdDev: standardDeviation,
        min,
        max,
        range: max - min,
        count: values.length,
        skewness,
        isNormallyDistributed,
        sample: values.slice(0, 5)
      };
    } catch (e) {
      console.error("Math error:", e);
      return null;
    }
  }, [columnName, data]);

  if (!stats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="bg-zinc-950 border-zinc-800 text-white overflow-hidden rounded-[2rem] shadow-2xl">
        <CardHeader className="border-b border-white/5 space-y-1 p-8">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono text-[10px]">
              COLUMN_INFERENCE_v1.0
            </Badge>
            <div className="flex gap-2">
              {stats.isNormallyDistributed ? (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] font-bold">
                  GAUSSIAN_APPROX
                </Badge>
              ) : (
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] font-bold">
                  SKEWED_DISTRIBUTION
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight italic-serif pt-2">
            {columnName}
          </CardTitle>
          <CardDescription className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
            Statistical Universe: n = {stats.count}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Primary Metrics */}
            <div className="space-y-2">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                <Sigma className="w-3 h-3" /> Mean
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tighter tabular-nums">
                  {stats.mean.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                <Target className="w-3 h-3" /> Median
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tighter tabular-nums">
                  {stats.median.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-3 h-3" /> Std Deviation
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tighter tabular-nums text-zinc-300">
                  {stats.stdDev.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 className="w-3 h-3" /> Skewness
              </p>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold tracking-tighter tabular-nums ${Math.abs(stats.skewness) > 1 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {stats.skewness.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
              <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> Range Analysis
              </h4>
              <div className="flex justify-between items-end gap-4 h-16">
                 <div className="text-center space-y-1">
                    <div className="text-xs text-zinc-600 font-mono">MIN</div>
                    <div className="font-bold text-lg tabular-nums">{stats.min.toLocaleString()}</div>
                 </div>
                 <div className="flex-1 h-1 bg-zinc-800 relative mb-3 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-1/4 right-1/4 bg-white/20 blur-sm" />
                    <div className="absolute inset-y-0 left-1/3 right-1/3 bg-white/40" />
                 </div>
                 <div className="text-center space-y-1">
                    <div className="text-xs text-zinc-600 font-mono">MAX</div>
                    <div className="font-bold text-lg tabular-nums">{stats.max.toLocaleString()}</div>
                 </div>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Sigma className="w-3 h-3" /> Disparity Metrics
                </h4>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  The data points exhibit a {stats.stdDev > stats.mean ? 'high' : 'controlled'} variance relative to the central tendency. 
                  {stats.skewness > 0 ? ' Positive skew suggests a right-tail clustering.' : ' Negative skew suggests a left-tail clustering.'}
                </p>
              </div>
              <div className="pt-4 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {stats.sample.map((s, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-950 flex items-center justify-center text-[8px] font-bold">
                      {s}
                    </div>
                  ))}
                </div>
                <Badge variant="secondary" className="bg-zinc-800 text-[10px] h-6">SAMPLE_SET</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
