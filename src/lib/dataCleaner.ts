import { DataRow } from '../types';

export interface CleaningOptions {
  removeDuplicates: boolean;
  removeNoise: boolean;
  trimWhitespace: boolean;
  sortBy?: {
    column: string;
    direction: 'asc' | 'desc';
  };
}

export const cleanData = (rows: DataRow[], options: CleaningOptions): DataRow[] => {
  let cleaned = [...rows];

  // 1. Remove Duplicates
  if (options.removeDuplicates) {
    const seen = new Set();
    cleaned = cleaned.filter(row => {
      const serialized = JSON.stringify(row);
      if (seen.has(serialized)) return false;
      seen.add(serialized);
      return true;
    });
  }

  // 2. Remove Noise & Trim
  if (options.removeNoise || options.trimWhitespace) {
    cleaned = cleaned.map(row => {
      const newRow: DataRow = { ...row };
      Object.keys(newRow).forEach(key => {
        let val = newRow[key];
        
        // Trim whitespace
        if (options.trimWhitespace && typeof val === 'string') {
          val = val.trim();
        }

        // Noise removal (replace empty strings, 'null', 'undefined', etc with null)
        if (options.removeNoise) {
          const noiseValues = ['', 'null', 'NULL', 'nan', 'NaN', 'undefined', 'undefined'];
          if (val === null || val === undefined || noiseValues.includes(String(val).toLowerCase().trim())) {
            val = null as any;
          }
        }
        
        newRow[key] = val;
      });
      return newRow;
    });

    // If removing noise, we might want to filter out rows that are entirely empty
    if (options.removeNoise) {
      cleaned = cleaned.filter(row => 
        Object.values(row).some(val => val !== null && val !== undefined && val !== '')
      );
    }
  }

  // 3. Sorting
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
