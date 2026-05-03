import { DataRow } from '../types';

export interface CleaningOptions {
  removeDuplicates: boolean;
  removeNoise: boolean;
  trimWhitespace: boolean;
  removeIncomplete?: boolean;
  sortBy?: {
    column: string;
    direction: 'asc' | 'desc';
  };
}

export const cleanData = (rows: DataRow[], options: CleaningOptions): DataRow[] => {
  console.log('[Cleaner] Starting clean operation', { inputRows: rows.length, options });
  let cleaned = [...rows];

  // 1. Trim whitespace & Remove Noise (Standardization)
  if (options.removeNoise || options.trimWhitespace || options.removeIncomplete) {
    cleaned = cleaned.map(row => {
      const newRow: DataRow = { ...row };
      Object.keys(newRow).forEach(key => {
        let val = newRow[key];
        
        // Trim whitespace
        if (options.trimWhitespace && typeof val === 'string') {
          val = val.trim();
        }

        // Noise removal (replace empty strings, 'null', 'undefined', etc with null)
        if (options.removeNoise || options.removeIncomplete) {
          const noiseValues = ['', 'null', 'NULL', 'nan', 'NaN', 'undefined', 'undefined'];
          if (val === null || val === undefined || noiseValues.includes(String(val).toLowerCase().trim())) {
            val = null as any;
          }
        }
        
        newRow[key] = val;
      });
      return newRow;
    });
  }

  // 2. Remove Duplicates (Now that data is standardized)
  if (options.removeDuplicates) {
    const seen = new Set();
    const beforeCount = cleaned.length;
    cleaned = cleaned.filter(row => {
      const serialized = JSON.stringify(row);
      if (seen.has(serialized)) return false;
      seen.add(serialized);
      return true;
    });
    console.log(`[Cleaner] Deduplication removed ${beforeCount - cleaned.length} rows`);
  }

  // 3. Filtering logic
  if (options.removeIncomplete) {
    const beforeCount = cleaned.length;
    cleaned = cleaned.filter(row => 
      Object.values(row).every(val => val !== null && val !== undefined && val !== '')
    );
    console.log(`[Cleaner] Drop incomplete removed ${beforeCount - cleaned.length} rows`);
  } else if (options.removeNoise) {
    // Filter out rows that are ENTIRELY empty
    const beforeCount = cleaned.length;
    cleaned = cleaned.filter(row => 
      Object.values(row).some(val => val !== null && val !== undefined && val !== '')
    );
    console.log(`[Cleaner] Noise purge removed ${beforeCount - cleaned.length} rows`);
  }

  // 4. Sorting
  if (options.sortBy) {
    const { column, direction } = options.sortBy;
    cleaned.sort((a, b) => {
      const valA = a[column];
      const valB = b[column];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      const factor = direction === 'asc' ? 1 : -1;
      
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * factor;
      }
      
      return String(valA).localeCompare(String(valB)) * factor;
    });
  }

  return cleaned;
};
