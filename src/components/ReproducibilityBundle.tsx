import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Package, FileCode, FileSpreadsheet, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { DataRow } from '../types';
import Papa from 'papaparse';

interface ReproducibilityBundleProps {
  data: DataRow[];
  manuscriptContent: string;
}

export const ReproducibilityBundle: React.FC<ReproducibilityBundleProps> = ({ data, manuscriptContent }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [complete, setComplete] = useState(false);

  const generateBundle = async () => {
    setIsGenerating(true);
    const zip = new JSZip();

    try {
      // 1. Cleaned Data
      const csv = Papa.unparse(data);
      zip.file("data/cleaned_dataset.csv", csv);

      // 2. Python Replication Script
      const pythonScript = `
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Datalyse Reproducibility Script
# Generated for: One-Click Science v3.2

def run_analysis():
    # Load the cleaned data
    df = pd.read_csv('data/cleaned_dataset.csv')
    
    print("--- Dataset Statistics ---")
    print(df.describe())
    
    # Example visualization (Correlation Heatmap)
    numeric_df = df.select_dtypes(include=[np.number])
    if not numeric_df.empty:
        plt.figure(figsize=(10, 8))
        sns.heatmap(numeric_df.corr(), annot=True, cmap='coolwarm')
        plt.title('Replicated Correlation Matrix')
        plt.savefig('replicated_patterns.png')
        print("Analysis complete. Check 'replicated_patterns.png'")

if __name__ == "__main__":
    run_analysis()
`;
      zip.file("scripts/reproduce_analysis.py", pythonScript);

      // 3. Manuscript Draft
      zip.file("manuscript/draft_v1.md", manuscriptContent);

      // 4. Metadata
      const metadata = {
        platform: "Datalyse",
        version: "3.2.0-alpha",
        timestamp: new Date().toISOString(),
        rowCount: data.length,
        hash: Math.random().toString(36).substring(7)
      };
      zip.file("BUNDLE_INFO.json", JSON.stringify(metadata, null, 2));

      // Generate the zip
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "datalyse_reproducibility_bundle.zip");
      
      setComplete(true);
      setTimeout(() => setComplete(false), 3000);
    } catch (error) {
      console.error("Bundle generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-emerald-400" />
             </div>
             <h3 className="text-2xl font-bold tracking-tight italic-serif">Reproducibility Bundle</h3>
          </div>
          <p className="text-zinc-500 text-sm max-w-md">
            Export a publication-ready package containing cleaned source data, 
            Python replication scripts, and your manuscript draft.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
           <div className="flex flex-col items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
              <FileSpreadsheet className="w-4 h-4" />
              <span className="text-[8px] font-mono">CSV</span>
           </div>
           <div className="flex flex-col items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
              <FileCode className="w-4 h-4" />
              <span className="text-[8px] font-mono">PY</span>
           </div>
           <div className="flex flex-col items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
              <FileText className="w-4 h-4" />
              <span className="text-[8px] font-mono">TXT</span>
           </div>
        </div>

        <Button 
          onClick={generateBundle}
          disabled={isGenerating}
          className="bg-white text-zinc-950 hover:bg-zinc-200 rounded-2xl h-14 px-8 font-bold uppercase tracking-widest text-xs transition-all active:scale-95"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-3 animate-spin" />
              Compiling...
            </>
          ) : complete ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-3 text-emerald-600" />
              Bundle Ready
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-3" />
              One-Click Bundle
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
