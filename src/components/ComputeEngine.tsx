import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Activity, 
  TrendingUp, 
  Share2, 
  Grid3X3, 
  Info, 
  MousePointer2,
  RefreshCcw,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DataRow } from '../types';
import * as d3 from 'd3';
import { ManuscriptDrafter } from './ManuscriptDrafter';

interface ComputeEngineProps {
  data: DataRow[];
}

export const ComputeEngine: React.FC<ComputeEngineProps> = ({ data }) => {
  const [activeSubTab, setActiveSubTab] = useState('scatter');
  
  // Data Analysis
  const numericHeaders = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter(key => {
      const val = data[0][key];
      // Robust number detection for both actual numbers and numeric strings
      return typeof val === 'number' || 
             (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val)));
    });
  }, [data]);

  const categoricalHeaders = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter(key => typeof data[0][key] === 'string');
  }, [data]);

  // Scatter Plot States
  const [scatterX, setScatterX] = useState(numericHeaders[0] || '');
  const [scatterY, setScatterY] = useState(numericHeaders[1] || numericHeaders[0] || '');

  // Heatmap States
  const correlationMatrix = useMemo(() => {
    if (numericHeaders.length < 2) return null;
    
    const matrix: { x: string; y: string; value: number }[] = [];
    
    numericHeaders.forEach(h1 => {
      numericHeaders.forEach(h2 => {
        // Simple Pearson correlation
        const x = data.map(d => Number(d[h1]));
        const y = data.map(d => Number(d[h2]));
        
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
        const sumX2 = x.reduce((a, b) => a + b * b, 0);
        const sumY2 = y.reduce((a, b) => a + b * b, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        const correlation = denominator === 0 ? 0 : numerator / denominator;
        matrix.push({ x: h1, y: h2, value: correlation });
      });
    });
    
    return matrix;
  }, [data, numericHeaders]);

  // Network Graph logic
  const networkRef = useRef<SVGSVGElement>(null);
  const [networkSource, setNetworkSource] = useState(categoricalHeaders[0] || '');
  const [networkTarget, setNetworkTarget] = useState(categoricalHeaders[1] || '');

  useEffect(() => {
    if (activeSubTab !== 'network' || !networkRef.current || !networkSource || !networkTarget) return;

    const svg = d3.select(networkRef.current);
    svg.selectAll("*").remove();

    const width = networkRef.current.clientWidth;
    const height = networkRef.current.clientHeight;

    // Process data for network
    const links: { source: string; target: string; value: number }[] = [];
    const nodeSet = new Set<string>();
    
    const relationCounts: Record<string, number> = {};
    
    data.slice(0, 100).forEach(d => {
      const s = String(d[networkSource]);
      const t = String(d[networkTarget]);
      if (s && t && s !== 'null' && t !== 'null') {
        const key = `${s}|||${t}`;
        relationCounts[key] = (relationCounts[key] || 0) + 1;
        nodeSet.add(s);
        nodeSet.add(t);
      }
    });

    Object.entries(relationCounts).forEach(([key, count]) => {
      const [s, t] = key.split('|||');
      links.push({ source: s, target: t, value: count });
    });

    const nodes = Array.from(nodeSet).map(id => ({ id }));

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "#e4e4e7")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value) + 1);

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 8)
      .attr("fill", "#18181b")
      .call(d3.drag<SVGCircleElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("title")
      .text(d => d.id);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [activeSubTab, data, networkSource, networkTarget]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
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
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight italic-serif text-white">Compute Engine</h2>
          <p className="text-zinc-500 text-sm mt-1">Experimental visualization and relational modeling</p>
        </div>
        
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-auto">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 h-12 rounded-xl">
            <TabsTrigger value="scatter" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-950 text-zinc-500 font-bold text-xs uppercase tracking-widest px-6 transition-all">
              <TrendingUp className="w-4 h-4 mr-2" />
              Scatter
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-950 text-zinc-500 font-bold text-xs uppercase tracking-widest px-6 transition-all">
              <Grid3X3 className="w-4 h-4 mr-2" />
              Heatmap
            </TabsTrigger>
            <TabsTrigger value="network" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-950 text-zinc-500 font-bold text-xs uppercase tracking-widest px-6 transition-all">
              <Share2 className="w-4 h-4 mr-2" />
              Network
            </TabsTrigger>
            <TabsTrigger value="manuscript" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-950 text-zinc-500 font-bold text-xs uppercase tracking-widest px-6 transition-all">
              <FileText className="w-4 h-4 mr-2" />
              Manuscript
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.4 }}
        >
          {activeSubTab === 'scatter' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-1 bg-zinc-900 border-zinc-800 text-white p-6 rounded-[2rem]">
                <div className="space-y-6">
                  <div>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 font-mono text-[9px] mb-4">CORRELATION_MODE</Badge>
                    <h3 className="text-xl font-bold italic-serif">Parameters</h3>
                  </div>
                  
                  <Separator className="bg-zinc-800" />
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">X-Axis Variable</label>
                      <select 
                        value={scatterX} 
                        onChange={(e) => setScatterX(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-white outline-none appearance-none"
                      >
                        {numericHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Y-Axis Variable</label>
                      <select 
                        value={scatterY} 
                        onChange={(e) => setScatterY(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-white outline-none appearance-none"
                      >
                        {numericHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="pt-6">
                    <div className="bg-zinc-950 rounded-2xl p-4 border border-white/5 flex items-start gap-3">
                      <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
                        Scatter distribution identifies variable clustering and outliers across the selected dimensions.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="lg:col-span-3 bg-white border-none rounded-[2rem] shadow-2xl overflow-hidden p-8 min-h-[600px] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-zinc-900" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{scatterX} vs {scatterY}</h3>
                      <p className="text-xs text-zinc-400 font-mono tracking-wider">SCATTER_DISTRIBUTION</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">{data.length} DATA_POINTS</Badge>
                </div>

                <div className="flex-1 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        type="number" 
                        dataKey="x" 
                        name={scatterX} 
                        unit="" 
                        stroke="#888888" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: scatterX, position: 'bottom', offset: 0, fontSize: 10, fontWeight: 'bold' }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="y" 
                        name={scatterY} 
                        unit="" 
                        stroke="#888888" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: scatterY, angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 'bold' }}
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-zinc-900 text-white p-3 rounded-2xl text-[10px] font-mono border border-zinc-800 shadow-2xl min-w-[200px]">
                                <p className="opacity-50 uppercase tracking-widest mb-2 pb-2 border-b border-white/10">Point Signature</p>
                                <div className="space-y-1">
                                  <p className="flex justify-between"><span>{scatterX}:</span> <span className="font-bold">{payload[0].value}</span></p>
                                  <p className="flex justify-between"><span>{scatterY}:</span> <span className="font-bold">{payload[1].value}</span></p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter 
                        name="Data" 
                        data={data.slice(0, 500).map(d => ({ 
                          x: Number(d[scatterX]), 
                          y: Number(d[scatterY]) 
                        }))} 
                        fill="#18181b" 
                        fillOpacity={0.6}
                      >
                         {data.slice(0, 500).map((entry, index) => (
                          <Cell key={`cell-${index}`} className="hover:fill-emerald-500 transition-colors duration-300" />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          {activeSubTab === 'heatmap' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-1 bg-zinc-900 border-zinc-800 text-white p-6 rounded-[2rem]">
                <div className="space-y-6">
                  <div>
                    <Badge variant="outline" className="border-orange-500/30 text-orange-400 font-mono text-[9px] mb-4">COVARIANCE_MATRIX</Badge>
                    <h3 className="text-xl font-bold italic-serif">Insight</h3>
                  </div>
                  
                  <Separator className="bg-zinc-800" />
                  
                  <div className="space-y-4">
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      This matrix visualizes Pearson correlation coefficients between all numeric dimensions. 
                    </p>
                    <ul className="space-y-3 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" /> 
                        Strong Positive (+1.0)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-zinc-800 border border-zinc-700" /> 
                        Neutral (0.0)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" /> 
                        Strong Negative (-1.0)
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-start gap-3">
                      <Activity className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
                        Red cells indicate inverse relationships, while green cells show direct relationships.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="lg:col-span-3 bg-white border-none rounded-[2rem] shadow-2xl overflow-hidden p-8 min-h-[600px] flex flex-col">
                <div className="flex items-center justify-between mb-12">
                   <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                      <Grid3X3 className="w-5 h-5 text-zinc-900" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Correlation Matrix</h3>
                      <p className="text-xs text-zinc-400 font-mono tracking-wider">INTER-VARIABLE_DYNAMICS</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center p-4">
                  {correlationMatrix ? (
                    <div className="relative" style={{ 
                      display: 'grid', 
                      gridTemplateColumns: `repeat(${numericHeaders.length}, 1fr)`,
                      width: '100%',
                      maxWidth: '600px',
                      aspectRatio: '1/1'
                    }}>
                      {/* Header labels */}
                      {numericHeaders.length > 0 && correlationMatrix.map((item, i) => {
                        const color = item.value > 0 
                          ? `rgba(16, 185, 129, ${item.value})` 
                          : `rgba(239, 68, 68, ${Math.abs(item.value)})`;
                        
                        return (
                          <motion.div
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.005 }}
                            className="relative group border border-white/10"
                            style={{ backgroundColor: color }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-zinc-950 text-white text-[9px] font-mono z-10 transition-opacity p-1 text-center pointer-events-none">
                              {item.x} : {item.y}<br/>
                              {item.value.toFixed(2)}
                            </div>
                          </motion.div>
                        );
                      })}
                      
                      {/* Axis Labels (Side) */}
                      <div className="absolute -left-12 top-0 bottom-0 flex flex-col justify-around py-4">
                        {numericHeaders.map(h => (
                           <span key={h} className="text-[9px] font-bold uppercase tracking-tighter text-zinc-400 whitespace-nowrap -rotate-90">
                            {h.slice(0, 8)}
                           </span>
                        ))}
                      </div>

                       {/* Axis Labels (Top) */}
                       <div className="absolute -top-12 left-0 right-0 flex justify-around px-4">
                        {numericHeaders.map(h => (
                           <span key={h} className="text-[9px] font-bold uppercase tracking-tighter text-zinc-400 whitespace-nowrap">
                            {h.slice(0, 8)}
                           </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <Info className="w-12 h-12 text-zinc-100 mx-auto" />
                      <p className="text-zinc-400 font-mono text-xs">Insufficient numeric dimensions for matrix generation.</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeSubTab === 'network' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* ... existing network card content ... */}
              <Card className="lg:col-span-1 bg-zinc-900 border-zinc-800 text-white p-6 rounded-[2rem]">
                <div className="space-y-6">
                  <div>
                    <Badge variant="outline" className="border-purple-500/30 text-purple-400 font-mono text-[9px] mb-4">RELATIONAL_TOPOLOGY</Badge>
                    <h3 className="text-xl font-bold italic-serif">Connections</h3>
                  </div>
                  
                  <Separator className="bg-zinc-800" />
                  
                  <div className="space-y-4">
                     <div className="space-y-2">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Source Node</label>
                      <select 
                        value={networkSource} 
                        onChange={(e) => setNetworkSource(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-white outline-none appearance-none"
                      >
                        {categoricalHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Target Node</label>
                      <select 
                        value={networkTarget} 
                        onChange={(e) => setNetworkTarget(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-white outline-none appearance-none"
                      >
                        {categoricalHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="pt-6 space-y-4">
                    <Button 
                      variant="outline" 
                      className="w-full border-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-800 px-4 py-6"
                      onClick={() => {
                        setNetworkSource(categoricalHeaders[Math.floor(Math.random() * categoricalHeaders.length)]);
                        setNetworkTarget(categoricalHeaders[Math.floor(Math.random() * categoricalHeaders.length)]);
                      }}
                    >
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      Shuffle Topology
                    </Button>
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
                      Nodes represent unique categorical values. Edges represent shared records between them.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="lg:col-span-3 bg-white border-none rounded-[2rem] shadow-2xl overflow-hidden min-h-[600px] flex flex-col relative group">
                <div className="absolute top-8 left-8 z-10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-zinc-900" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Entity Network</h3>
                    <p className="text-xs text-zinc-400 font-mono tracking-wider">{networkSource} ↔ {networkTarget}</p>
                  </div>
                </div>

                <div className="absolute top-8 right-8 z-10">
                  <div className="bg-zinc-100/80 backdrop-blur-sm p-3 rounded-2xl border border-zinc-200/50 flex items-center gap-2">
                    <MousePointer2 className="w-4 h-4 text-zinc-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Interactive Stage</span>
                  </div>
                </div>

                <div className="flex-1 w-full bg-[#f8f9fa] relative overflow-hidden">
                  <svg 
                    ref={networkRef} 
                    className="w-full h-full cursor-grab active:cursor-grabbing"
                  />
                  
                  {/* Subtle Grid Pattern */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#18181b_1px,transparent_1px)] [background-size:24px_24px]" />
                </div>
              </Card>
            </div>
          )}

          {activeSubTab === 'manuscript' && (
            <ManuscriptDrafter data={data} />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
