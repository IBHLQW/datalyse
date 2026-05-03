import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DataRow, ProcessedData } from '../types';

export const processFile = async (file: File): Promise<ProcessedData> => {
  return new Promise((resolve, reject) => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          resolve(formatResults(results.data as DataRow[]));
        },
        error: (error) => reject(error),
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as DataRow[];
        resolve(formatResults(rows));
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    } else {
      reject(new Error('Unsupported file format'));
    }
  });
};

const formatResults = (rows: DataRow[]): ProcessedData => {
  if (rows.length === 0) {
    return { headers: [], rows: [], summary: { rowCount: 0, colCount: 0, types: {} } };
  }

  const headers = Object.keys(rows[0]);
  const types: Record<string, string> = {};

  headers.forEach((header) => {
    const val = rows[0][header];
    types[header] = typeof val;
  });

  return {
    headers,
    rows,
    summary: {
      rowCount: rows.length,
      colCount: headers.length,
      types,
    },
  };
};
