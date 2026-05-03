import React, { useState, useEffect, useCallback } from 'react';
import { processFile } from '@/lib/dataProcessor';
import { generateDataInsights } from '@/services/geminiService';
import { Dashboard } from '@/components/Dashboard';
import { DataRow, DataInsight, ProcessedData } from '@/types';
import { 
  LayoutDashboard, 
  Database, 
  BarChart3, 
  Upload, 
  Settings, 
  LogOut,
  Zap,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  Download,
  ChevronDown,
  Activity,
  Sparkles,
  Command,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

import { DataTable as DataGrid } from '@/components/datagrid';

const App: React.FC = () => {
  const [fileData, setFileData] = useState<ProcessedData | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insights, setInsights] = useState<DataInsight | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [pdfOptions, setPdfOptions] = useState({
    includeTimestamp: true,
    includePageNumbers: true,
    highContrast: false,
    fontSize: 8
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const processed = await processFile(file);
      setFileData(processed);
      showNotification(`Successfully ingested ${processed.summary.rowCount} records`, 'success');
      
      // Auto-generate insights
      setIsGeneratingInsights(true);
      const newInsights = await generateDataInsights(processed.rows);
      setInsights(newInsights);
      setIsGeneratingInsights(false);
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to process file', 'error');
      setIsGeneratingInsights(false);
    }
  };

  const exportData = async (type: 'csv' | 'xlsx' | 'pdf') => {
    if (!fileData) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    // Simulate initial latency for "preparing payload"
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, 80));
      setExportProgress(i * (80 / steps)); // Go to 80% with simulation
    }

    try {
      if (type === 'csv') {
        const worksheet = XLSX.utils.json_to_sheet(fileData.rows);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'datalyse_export.csv');
      } else if (type === 'xlsx') {
        const worksheet = XLSX.utils.json_to_sheet(fileData.rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        XLSX.writeFile(workbook, 'datalyse_export.xlsx');
      } else if (type === 'pdf') {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Datalyse Intelligent Report', 14, 22);
        
        if (pdfOptions.includeTimestamp) {
          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 30);
        }
        
        const body = fileData.rows.map((row: DataRow) => 
          fileData.headers.map((h: string) => {
            const val = row[h];
            return val === null || val === undefined ? '' : String(val);
          })
        );

        (doc as any).autoTable({
          head: [fileData.headers],
          body: body,
          startY: pdfOptions.includeTimestamp ? 40 : 30,
          styles: { fontSize: pdfOptions.fontSize },
          headStyles: { fillColor: pdfOptions.highContrast ? [0, 0, 0] : [20, 20, 20] },
          didDrawPage: (data: any) => {
            if (pdfOptions.includePageNumbers) {
              const str = "Page " + data.pageCount;
              doc.setFontSize(8);
              const pageSize = doc.internal.pageSize;
              const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
              doc.text(str, (data.settings.margin.left), pageHeight - 10);
            }
          }
        });
        doc.save('datalyse_report.pdf');
      }
      
      setExportProgress(100);
      showNotification(`Successfully exported as ${type.toUpperCase()}`, 'success');
    } catch (err) {
      showNotification(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Monitor', icon: LayoutDashboard },
    { id: 'explorer', label: 'Explorer', icon: Database },
    { id: 'analytics', label: 'Compute', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 shadow-2xl"
          >
            <div className={cn(
              "flex items-center gap-3 px-6 py-3 rounded-2xl border text-sm font-medium",
              notification.type === 'success' ? "bg-zinc-900 border-zinc-800 text-white" : 
              notification.type === 'error' ? "bg-red-50 border-red-100 text-red-600" :
              "bg-white border-zinc-200 text-zinc-900"
            )}>
              {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4" />}
              {notification.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-zinc-900 text-white transition-all duration-300 z-40 overflow-hidden",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
              <span className="text-zinc-900 font-black text-xl italic-serif text-center pt-1 pr-1">D</span>
            </div>
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-xl font-bold tracking-tight italic-serif whitespace-nowrap"
                >
                  datalyse.
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <nav className="flex-1 space-y-2">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-4 mb-4">Operations</p>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative",
                  activeTab === item.id ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", activeTab === item.id ? "text-white" : "text-zinc-500")} />
                {isSidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-bold tracking-tight whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-white/5">
            <div className="bg-zinc-800/50 p-4 rounded-3xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                {isSidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest leading-none">Status</p>
                    <p className="text-xs font-bold text-emerald-400 truncate mt-1">AI Engine Live</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Surface */}
      <main className={cn(
        "transition-all duration-300 min-h-screen",
        isSidebarOpen ? "pl-64" : "pl-20"
      )}>
        {!fileData ? (
          <div className="h-screen flex items-center justify-center p-8 bg-[#fcfcfc]">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-2xl w-full text-center space-y-12"
            >
              <div className="space-y-4">
                <Badge variant="outline" className="text-zinc-400 border-zinc-200 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] mb-4">
                  Insights Engine v3.1
                </Badge>
                <h1 className="text-7xl font-bold tracking-tighter text-zinc-950 italic-serif">
                  <span className="text-zinc-400 underline decoration-zinc-200">Clarify</span>.
                </h1>
                <p className="text-zinc-500 text-lg max-w-lg mx-auto leading-relaxed">
                  Advanced ingestion engine for technical datasets. 
                  Upload your CSV or Excel assets to begin.
                </p>
              </div>

              <div className="relative group mx-auto w-fit">
                <label className="cursor-pointer group flex flex-col items-center justify-center p-12 w-96 h-64 border-2 border-dashed border-zinc-200 rounded-[3rem] bg-white hover:border-zinc-950 transition-all duration-500 hover:bg-zinc-50 shadow-sm">
                  <div className="w-16 h-16 bg-zinc-950 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-sm font-bold text-zinc-950 uppercase tracking-widest mb-1">Ingest Payload</span>
                  <span className="text-xs text-zinc-400 font-mono">CSV, XLSX supported</span>
                  <input
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => handleFileUpload(e)}
            />
                </label>
                <div className="absolute -inset-4 bg-zinc-950/5 rounded-[4rem] -z-10 group-hover:inset-0 transition-all opacity-0 group-hover:opacity-100 blur-xl" />
              </div>

              <div className="flex items-center justify-center gap-8 pt-12 border-t border-zinc-100 opacity-50 grayscale hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                  <Command className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest font-mono">Cloud Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest font-mono">AI Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest font-mono">Real-time Visualization</span>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="p-12 space-y-12 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-zinc-100">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-zinc-950 text-white rounded-lg hover:bg-zinc-900 border-none px-4">
                    ACTIVE_FEED
                  </Badge>
                  <span className="text-zinc-300 font-mono text-[10px]">/</span>
                  <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-widest">Workspace</span>
                </div>
                <h1 className="text-5xl font-bold tracking-tighter italic-serif">
                  {activeTab === 'dashboard' ? 'Visual Engine' : activeTab === 'explorer' ? 'Registry Explorer' : 'Computation Terminal'}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <Dialog>
                  <DialogTrigger 
                    render={
                      <Button variant="outline" className="border-zinc-200 rounded-xl px-6 py-6 h-auto text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 group">
                        <Download className="w-4 h-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
                        Dispatch Data
                      </Button>
                    }
                  />
                  <DialogContent className="sm:max-w-xl rounded-[2.5rem] border-zinc-200 p-0 overflow-hidden">
                    <div className="flex">
                      {/* Left Side: Actions */}
                      <div className="flex-1 p-8 border-r border-zinc-100">
                        <DialogHeader className="mb-8">
                          <DialogTitle className="italic-serif text-3xl font-bold tracking-tight">Dispatch</DialogTitle>
                          <DialogDescription className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-widest">
                            Output formats for technical analysis
                          </DialogDescription>
                        </DialogHeader>

                        {isExporting ? (
                          <div className="py-12 space-y-6">
                            <div className="flex flex-col items-center justify-center space-y-4">
                              <div className="relative w-20 h-20 flex items-center justify-center">
                                <motion.div 
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                  className="absolute inset-0 border-2 border-dashed border-zinc-200 rounded-full"
                                />
                                <Database className="w-8 h-8 text-zinc-950 animate-pulse" />
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-950">Marshalling Data...</p>
                                <p className="text-[10px] font-mono text-zinc-400 mt-1">{Math.floor(exportProgress)}% COMPLETE</p>
                              </div>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${exportProgress}%` }}
                                className="h-full bg-zinc-950"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            <button 
                              onClick={() => exportData('csv')}
                              className="group flex flex-col p-6 rounded-3xl border border-zinc-100 hover:border-zinc-950 hover:bg-zinc-50 transition-all text-left relative overflow-hidden"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 group-hover:text-zinc-950 transition-colors">Comma Separated</span>
                                <FileSpreadsheet className="w-5 h-5 text-zinc-200 group-hover:text-zinc-950 transition-colors" />
                              </div>
                              <p className="text-lg font-bold italic-serif">Legacy CSV</p>
                              <div className="absolute bottom-0 left-0 h-1 bg-zinc-950 w-0 group-hover:w-full transition-all duration-500" />
                            </button>

                            <button 
                              onClick={() => exportData('xlsx')}
                              className="group flex flex-col p-6 rounded-3xl border border-zinc-100 hover:border-zinc-950 hover:bg-zinc-50 transition-all text-left relative overflow-hidden"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 group-hover:text-zinc-950 transition-colors">Spreadsheet Binary</span>
                                <Database className="w-5 h-5 text-zinc-200 group-hover:text-zinc-950 transition-colors" />
                              </div>
                              <p className="text-lg font-bold italic-serif">Excel Workbook</p>
                              <div className="absolute bottom-0 left-0 h-1 bg-zinc-950 w-0 group-hover:w-full transition-all duration-500" />
                            </button>

                            <button 
                              onClick={() => exportData('pdf')}
                              className="group flex flex-col p-6 rounded-3xl border-zinc-950 bg-zinc-950 text-white transition-all text-left relative overflow-hidden shadow-xl"
                            >
                              <div className="flex items-center justify-between mb-2 text-zinc-400">
                                <span className="text-xs font-bold uppercase tracking-[0.2em]">Portable Document</span>
                                <FileText className="w-5 h-5 text-white" />
                              </div>
                              <p className="text-lg font-bold italic-serif">Scientific Report</p>
                              <Zap className="absolute -right-4 -bottom-4 w-16 h-16 opacity-10" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right Side: PDF Tuning */}
                      <div className="w-56 bg-zinc-50 p-8 flex flex-col">
                        <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-6 px-1 border-l-2 border-zinc-900 leading-none">PDF Refinement</p>
                        
                        <div className="space-y-6 flex-1">
                          {[
                            { id: 'includeTimestamp', label: 'Timeline Markup', icon: Activity },
                            { id: 'includePageNumbers', label: 'Index Labels', icon: Hash },
                            { id: 'highContrast', label: 'Monochrome', icon: Sparkles },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              disabled={isExporting}
                              onClick={() => setPdfOptions(prev => ({ ...prev, [opt.id]: !prev[opt.id as keyof typeof prev] }))}
                              className={cn(
                                "w-full flex flex-col items-start gap-2 group transition-all text-left",
                                isExporting && "opacity-50 grayscale pointer-events-none"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                {(pdfOptions as any)[opt.id] ? (
                                  <div className="w-5 h-5 rounded-md bg-zinc-950 flex items-center justify-center">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-md border border-zinc-200 bg-white" />
                                )}
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 group-hover:text-zinc-950 transition-colors">
                                  {opt.label}
                                </span>
                              </div>
                            </button>
                          ))}
                          
                          <div className="pt-4 border-t border-zinc-200">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-3">Font Scale</label>
                            <div className="flex items-center gap-2">
                              {[6, 8, 10].map(size => (
                                <button 
                                  key={size}
                                  disabled={isExporting}
                                  onClick={() => setPdfOptions(prev => ({ ...prev, fontSize: size }))}
                                  className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-mono transition-all",
                                    pdfOptions.fontSize === size ? "bg-zinc-950 text-white" : "bg-white border border-zinc-100 text-zinc-400 hover:border-zinc-950"
                                  )}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-[9px] font-mono text-zinc-400 mt-auto leading-relaxed">
                          PRO_MODE ACTIVE<br/>
                          v3.2_BUILD_619
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="bg-zinc-950 text-white rounded-xl px-6 py-6 h-auto text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 hidden lg:flex"
                >
                  {isSidebarOpen ? 'Collapse' : 'Expand'}
                </Button>
                
                <div className="w-px h-10 bg-zinc-100 mx-2" />
                
                <Button 
                  variant="ghost"
                  onClick={() => {
                    setFileData(null);
                    setInsights(null);
                  }}
                  className="text-zinc-400 hover:text-zinc-950 text-[10px] uppercase font-bold tracking-widest"
                >
                  Kill Session
                </Button>
              </div>
            </header>

            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Dashboard 
                    data={fileData.rows} 
                    insights={insights} 
                    isGeneratingInsights={isGeneratingInsights} 
                  />
                </motion.div>
              )}

              {activeTab === 'explorer' && (
                <motion.div
                  key="explorer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden p-8 h-[800px] flex flex-col">
                    <div className="mb-8 flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold italic-serif">Data Registry</h2>
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mt-1">Raw record inspection mode</p>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px]">{fileData.summary.rowCount} RECORDS LOADED</Badge>
                    </div>
                    <div className="flex-1 overflow-hidden rounded-2xl border border-zinc-100">
                      <DataGrid data={fileData.rows} />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                   <div className="bg-zinc-950 text-white rounded-[2rem] p-12 min-h-[600px] flex flex-col items-center justify-center text-center space-y-6">
                    <Activity className="w-12 h-12 text-zinc-800 animate-pulse" />
                    <h2 className="text-3xl font-bold italic-serif">Computation Engine</h2>
                    <p className="text-zinc-500 max-w-sm font-medium">Advanced statistical modelling and custom calculation pipelines are currently in beta testing.</p>
                    <Badge variant="outline" className="border-white/10 text-zinc-500 font-mono text-[10px]">COMING SOON_</Badge>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
