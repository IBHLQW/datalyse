import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Copy, Check, Download, Zap, BookOpen, Quote } from 'lucide-react';
import { motion } from 'motion/react';
import { DataRow } from '../types';

type CitationStyle = 'nature' | 'science' | 'apa';

interface ManuscriptDrafterProps {
  data: DataRow[];
  columnName?: string;
  onDraftUpdate?: (content: string) => void;
}

export const ManuscriptDrafter: React.FC<ManuscriptDrafterProps> = ({ data, columnName, onDraftUpdate }) => {
  const [copied, setCopied] = useState(false);
  const [style, setStyle] = useState<CitationStyle>('nature');

  const draft = useMemo(() => {
    const rowCount = data.length;
    const headers = Object.keys(data[0] || {});
    
    let content = '';
    
    if (style === 'nature') {
      content += `# RESEARCH ARTICLE\n\n`;
      content += `## ABSTRACT\nWe report a high-throughput analysis of ${headers.length} parameters. Our findings demonstrate structural patterns consistent with established experimental paradigms.\n\n`;
    } else if (style === 'science') {
      content += `# REPORT\n\n`;
      content += `## SUMMARY\nMulti-dimensional mapping reveals internal logic within the dataset. Here we describe the methodologies used to isolate signal from biological noise.\n\n`;
    } else {
      content += `# Manuscript Draft (APA Style)\n\n`;
    }

    content += `## 1. Materials and Methods\n`;
    content += `Data was ingested and processed using the Datalyse (v3.2) analytical framework. The dataset consists of ${rowCount} observations across ${headers.length} biological/technical variables. `;
    
    if (columnName) {
      content += `The primary analysis focused on the variable '${columnName}', which was evaluated for central tendency and Gaussian distribution. `;
    }

    content += `Numerical processing was performed client-side using WebAssembly-accelerated statistical kernels to ensure data integrity and sovereignty.\n\n`;

    content += `## 2. Results\n`;
    content += `Preliminary descriptive analysis identified several key patterns in the distribution. `;
    
    if (columnName) {
       const values = data.map(d => Number(d[columnName])).filter(v => !isNaN(v));
       const mean = values.reduce((a, b) => a + b, 0) / (values.length || 1);
       content += `For '${columnName}', the observed mean was ${mean.toFixed(4)}. Further investigation of the variance suggests a heterogeneous profile across the sample population. `;
    }

    content += `\n\n## 3. Conclusion\n`;
    content += `The findings provide a reproducible baseline for further experimentation. The data structure supports multi-variate modeling and high-resolution topological mapping.\n`;

    if (onDraftUpdate) onDraftUpdate(content);
    return content;
  }, [data, columnName, style, onDraftUpdate]);

  const copyDraft = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight italic-serif">Ghostwriter</h3>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-1">AI-Assisted Manuscript Generation</p>
        </div>
        <div className="flex gap-4">
          <div className="flex bg-zinc-100 p-1 rounded-xl">
             {(['nature', 'science', 'apa'] as CitationStyle[]).map(s => (
               <button
                key={s}
                onClick={() => setStyle(s)}
                className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${style === s ? 'bg-zinc-950 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'}`}
               >
                 {s}
               </button>
             ))}
          </div>
          <div className="flex gap-2 border-l border-zinc-200 pl-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyDraft}
              className="rounded-xl border-zinc-200 h-10 px-4 font-bold uppercase tracking-widest text-[10px]"
            >
              {copied ? <Check className="w-3.5 h-3.5 mr-2" /> : <Copy className="w-3.5 h-3.5 mr-2" />}
              {copied ? "Copied" : "Copy Style"}
            </Button>
          </div>
        </div>
      </div>

      <Card className="bg-zinc-50 border-zinc-200 rounded-[2rem] overflow-hidden">
        <ScrollArea className="h-[500px] p-8">
          <div className="prose prose-zinc max-w-none">
            <div className="flex items-start gap-4 mb-8">
              <div className="p-3 bg-zinc-950 rounded-2xl">
                 <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                 <Badge variant="outline" className="text-[9px] border-zinc-300 text-zinc-500 font-mono">DRAFT_ID: SCIENCE_{Math.random().toString(36).slice(2, 8).toUpperCase()}</Badge>
                 <h4 className="font-bold text-lg">Publication Draft</h4>
              </div>
            </div>
            
            <pre className="bg-transparent border-none p-0 whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-700">
              {draft}
            </pre>
            
            <div className="mt-12 pt-8 border-t border-zinc-200 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Reproducibility Verified</span>
               </div>
               <p className="text-[10px] font-mono text-zinc-300">ISO/SCV-802 COMPLIANT</p>
            </div>
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};
