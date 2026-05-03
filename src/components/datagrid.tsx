// v1.0.2 - Enhanced null highlighting
import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal, FilterX, Copy, Check, BarChart3, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DataRow } from '@/types';
import { StatSummaryCard } from './StatSummaryCard';
import { motion, AnimatePresence } from 'motion/react';

interface DataTableProps {
  data: DataRow[];
}

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];
    
    if (searchTerm) {
      result = result.filter(item => 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(item => 
          String(item[key]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    if (sortConfig !== null) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();

        if (aStr < bStr) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aStr > bStr) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return result;
  }, [data, sortConfig, searchTerm, columnFilters]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (key: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setColumnFilters({});
    setSearchTerm('');
  };

  const copyToClipboard = async () => {
    if (filteredAndSortedData.length === 0) return;
    
    const headerRow = columns.join('\t');
    const rows = filteredAndSortedData.map(row => 
      columns.map(col => String(row[col] ?? '')).join('\t')
    ).join('\n');
    
    const content = `${headerRow}\n${rows}`;
    
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="flex h-full bg-white relative overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 pr-4">
        {/* Control Bar */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search all attributes..."
              className="pl-10 h-10 border-zinc-200 rounded-xl focus-visible:ring-zinc-950"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className={cn(
                "rounded-xl px-4 font-bold uppercase tracking-widest text-[10px] h-10 border-zinc-200 transition-all",
                isCopied && "bg-emerald-50 border-emerald-200 text-emerald-600"
              )}
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 mr-2" />
              ) : (
                <Copy className="w-3.5 h-3.5 mr-2" />
              )}
              {isCopied ? "Copied" : "Copy Table"}
            </Button>

            <Button 
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-xl px-4 font-bold uppercase tracking-widest text-[10px] h-10 border-zinc-200"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-2" />
              Filters
            </Button>
            
            {(searchTerm || Object.values(columnFilters).some(v => v)) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="text-zinc-400 hover:text-red-600 font-bold uppercase tracking-widest text-[10px] h-10"
              >
                <FilterX className="w-3.5 h-3.5 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </div>
        
        {/* Dynamic Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6 p-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
            {columns.map(col => (
              <div key={col} className="space-y-1.5">
                <label className="col-header block">{col}</label>
                <Input
                  placeholder={`Search...`}
                  className="h-8 text-xs bg-white border-zinc-200 rounded-lg"
                  value={columnFilters[col] || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange(col, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Grid Surface */}
        <div className="flex-1 overflow-hidden border border-zinc-200 rounded-[2rem] bg-[#fcfcfc]">
          <ScrollArea className="h-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-zinc-200 z-10 transition-colors">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-6 py-4"
                    >
                      <div className="flex items-center justify-between group/header">
                        <button 
                          className="flex items-center gap-2 group transition-colors"
                          onClick={() => requestSort(col)}
                        >
                          <span className="col-header group-hover:opacity-100 group-hover:text-zinc-950 transition-all">{col}</span>
                          <div className="flex flex-col opacity-0 group-hover:opacity-50 transition-opacity">
                            <ChevronUp className={cn("w-2.5 h-2.5 -mb-1", sortConfig?.key === col && sortConfig.direction === 'asc' && "opacity-100 text-zinc-950")} />
                            <ChevronDown className={cn("w-2.5 h-2.5", sortConfig?.key === col && sortConfig.direction === 'desc' && "opacity-100 text-zinc-950")} />
                          </div>
                        </button>
                        
                        {/* Science trigger */}
                        <button 
                          onClick={() => setSelectedColumn(col)}
                          className={cn(
                            "w-6 h-6 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover/header:opacity-100 hover:bg-zinc-950 hover:text-white",
                            selectedColumn === col ? "opacity-100 bg-zinc-950 text-white" : "text-zinc-400"
                          )}
                        >
                          <BarChart3 className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredAndSortedData.map((row, i) => {
                  const hasNulls = Object.values(row).some(val => val === null || val === undefined || val === '');
                  const isEntirelyNull = Object.values(row).every(val => val === null || val === undefined || val === '');

                  return (
                    <tr 
                      key={i} 
                      className={cn(
                        "group transition-all duration-200",
                        hasNulls ? "bg-zinc-50/80 hover:bg-zinc-950" : "hover:bg-zinc-950"
                      )}
                    >
                      {columns.map((col) => (
                        <td 
                          key={col} 
                          className={cn(
                            "px-6 py-4 text-xs font-mono tracking-tight transition-colors group-hover:text-white",
                            (row[col] === null || row[col] === undefined || row[col] === '') 
                              ? "text-zinc-300 group-hover:text-zinc-500" 
                              : typeof row[col] === 'number' 
                                ? "text-emerald-600 group-hover:text-emerald-400" 
                                : "text-zinc-600"
                          )}
                        >
                          {row[col] === null || row[col] === undefined || row[col] === '' ? 'NULL' : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredAndSortedData.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <Search className="w-12 h-12 text-zinc-200" />
                <p className="text-sm font-medium text-zinc-400 italic-serif">No matching records detected in registry.</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Side Panel Analysis */}
      <AnimatePresence>
        {selectedColumn && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-[450px] border-l border-zinc-100 bg-zinc-50/50 backdrop-blur-xl h-full p-8 z-20 shadow-[-20px_0_40px_rgba(0,0,0,0.05)] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold italic-serif">Scientific Analysis</h3>
                <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">Experimental Inference</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedColumn(null)}
                className="rounded-full hover:bg-zinc-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <StatSummaryCard columnName={selectedColumn} data={data} />
            
            <div className="mt-8 space-y-6">
              <div className="p-6 bg-white border border-zinc-100 rounded-[2rem] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-950 flex items-center gap-2">
                  <Badge variant="outline" className="h-5 px-1.5 border-emerald-500/20 text-emerald-600">ALPHA</Badge>
                  Science Notes
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                  "This inference engine calculates central tendency and dispersion variables in real-time. 
                  Future iterations will support automated p-value calculation and ANOVA grouping based on secondary categorical selection."
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <Button className="w-full bg-zinc-950 text-white rounded-2xl h-12 font-bold text-[10px] uppercase tracking-widest">
                  Export LaTeX
                 </Button>
                 <Button variant="outline" className="w-full border-zinc-200 rounded-2xl h-12 font-bold text-[10px] uppercase tracking-widest">
                  View Raw Stats
                 </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DataTable;
