import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal, FilterX, Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { DataRow } from '../types';

interface DataTableProps {
  data: DataRow[];
}

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

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
    <div className="flex flex-col h-full bg-white">
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
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredAndSortedData.map((row, i) => (
                <tr 
                  key={i} 
                  className="group hover:bg-zinc-950 transition-all duration-200"
                >
                  {columns.map((col) => (
                    <td 
                      key={col} 
                      className={cn(
                        "px-6 py-4 text-xs font-mono tracking-tight transition-colors group-hover:text-white",
                        typeof row[col] === 'number' ? "text-emerald-600 group-hover:text-emerald-400" : "text-zinc-600"
                      )}
                    >
                      {String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
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
  );
};

export default DataTable;
