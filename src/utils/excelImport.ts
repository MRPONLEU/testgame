import * as XLSX from 'xlsx';
import { Question } from '../types';

export interface ParsedQuestionRow {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  points?: number;
}

/**
 * Downloads a pre-formatted Excel template for teachers to fill in.
 */
export function downloadExcelTemplate() {
  const sampleData = [
    {
      'វគ្គ/ប្រធានបទ (Module/Topic)': 'MOD-01',
      'សំណួរ (Question)': 'តើប្រាសាទអង្គរវត្តស្ថិតនៅក្នុងខេត្តណា?',
      'ជម្រើស ក (Option A)': 'ខេត្តសៀមរាប',
      'ជម្រើស ខ (Option B)': 'ខេត្តបាត់ដំបង',
      'ជម្រើស គ (Option C)': 'ខេត្តកំពង់ធំ',
      'ជម្រើស ឃ (Option D)': 'ខេត្តព្រះវិហារ',
      'ចម្លើយត្រូវ (Correct: A/B/C/D ឬ ក/ខ/គ/ឃ)': 'A',
      'ការពន្យល់ (Explanation)': 'ប្រាសាទអង្គរវត្តស្ថិតនៅក្នុងក្រុងសៀមរាប ខេត្តសៀមរាប។',
      'ពិន្ទុ (Points)': 10,
    },
    {
      'វគ្គ/ប្រធានបទ (Module/Topic)': 'MOD-02',
      'សំណួរ (Question)': 'តើ RAM ក្នុងកុំព្យូទ័រជាប្រភេទអង្គចងចាំបែបណា?',
      'ជម្រើស ក (Option A)': 'អង្គចងចាំអចិន្ត្រៃយ៍',
      'ជម្រើស ខ (Option B)': 'អង្គចងចាំបណ្តោះអាសន្ន (បាត់បង់ទិន្នន័យពេលបិទភ្លើង)',
      'ជម្រើស គ (Option C)': 'ឧបករណ៍ផ្ទុកឯកសារខាងក្រៅ',
      'ជម្រើស ឃ (Option D)': 'ប្រព័ន្ធសុវត្ថិភាព',
      'ចម្លើយត្រូវ (Correct: A/B/C/D ឬ ក/ខ/គ/ឃ)': 'B',
      'ការពន្យល់ (Explanation)': 'RAM (Random Access Memory) ផ្ទុកទិន្នន័យបណ្តោះអាសន្នខណៈពេលកំពុងដំណើរការ។',
      'ពិន្ទុ (Points)': 10,
    },
    {
      'វគ្គ/ប្រធានបទ (Module/Topic)': 'MOD-03',
      'សំណួរ (Question)': 'តើ Shortcut មួយណាប្រើសម្រាប់ Save ឯកសាររហ័ស?',
      'ជម្រើស ក (Option A)': 'Ctrl + P',
      'ជម្រើស ខ (Option B)': 'Ctrl + Z',
      'ជម្រើស គ (Option C)': 'Ctrl + S',
      'ជម្រើស ឃ (Option D)': 'Ctrl + N',
      'ចម្លើយត្រូវ (Correct: A/B/C/D ឬ ក/ខ/គ/ឃ)': 'C',
      'ការពន្យល់ (Explanation)': 'Ctrl + S ប្រើសម្រាប់ Save ឯកសារក្នុងកម្មវិធីទូទៅ។',
      'ពិន្ទុ (Points)': 10,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  // Set column widths
  worksheet['!cols'] = [
    { wch: 22 }, // Module
    { wch: 38 }, // Question
    { wch: 25 }, // A
    { wch: 25 }, // B
    { wch: 25 }, // C
    { wch: 25 }, // D
    { wch: 20 }, // Correct
    { wch: 35 }, // Explanation
    { wch: 12 }, // Points
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'គំរូសំណួរ');
  XLSX.writeFile(workbook, 'KhmerQuiz_Question_Template.xlsx');
}

/**
 * Exports current questions to Excel .xlsx file.
 */
export function exportQuestionsToExcel(questions: Question[], examTitle: string) {
  const data = questions.map((q) => {
    const optA = q.options[0]?.text || '';
    const optB = q.options[1]?.text || '';
    const optC = q.options[2]?.text || '';
    const optD = q.options[3]?.text || '';

    // Find correct label (A, B, C, D)
    const correctIdx = q.options.findIndex((o) => o.id === q.correctOptionId);
    const correctLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
    const correctLetter = correctIdx >= 0 ? correctLabels[correctIdx] : 'A';

    return {
      'សំណួរ (Question)': q.prompt,
      'ជម្រើស ក (Option A)': optA,
      'ជម្រើស ខ (Option B)': optB,
      'ជម្រើស គ (Option C)': optC,
      'ជម្រើស ឃ (Option D)': optD,
      'ចម្លើយត្រូវ (Correct)': correctLetter,
      'ការពន្យល់ (Explanation)': q.explanation || '',
      'ពិន្ទុ (Points)': q.points ?? 10,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 40 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 15 },
    { wch: 35 },
    { wch: 12 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'សំណួរ');
  const safeName = examTitle.replace(/[^a-zA-Z0-9_\u1780-\u17FF]/g, '_').slice(0, 30);
  XLSX.writeFile(workbook, `Questions_${safeName}.xlsx`);
}

/**
 * Normalizes user answer input to index (0-based)
 */
function parseCorrectIndex(val: unknown): number {
  if (val === undefined || val === null) return 0;
  const str = String(val).trim().toUpperCase();

  // Khmer letters
  if (str.startsWith('ក')) return 0;
  if (str.startsWith('ខ')) return 1;
  if (str.startsWith('គ')) return 2;
  if (str.startsWith('ឃ')) return 3;
  if (str.startsWith('ង')) return 4;

  // English letters
  if (str.startsWith('A')) return 0;
  if (str.startsWith('B')) return 1;
  if (str.startsWith('C')) return 2;
  if (str.startsWith('D')) return 3;
  if (str.startsWith('E')) return 4;

  // Numbers 1, 2, 3, 4
  const num = parseInt(str, 10);
  if (!isNaN(num) && num >= 1 && num <= 6) {
    return num - 1;
  }

  return 0;
}

/**
 * Parses an ArrayBuffer (from File or drag-and-drop) into an array of Questions.
 */
export function parseExcelQuestions(fileBuffer: ArrayBuffer): Question[] {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('ឯកសារ Excel គ្មាន Sheet ទេ');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  // Parse rows as raw JSON array of objects
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('ឯកសារគ្មានទិន្នន័យសំណួរឡើយ!');
  }

  const questions: Question[] = [];

  rawRows.forEach((row, rowIdx) => {
    // Look up question prompt across common headers
    let prompt = '';
    let optA = '';
    let optB = '';
    let optC = '';
    let optD = '';
    let correctRaw: unknown = '';
    let explanation = '';
    let points = 10;
    let moduleTag = '';

    for (const [key, rawVal] of Object.entries(row)) {
      const k = key.trim().toLowerCase();
      const v = String(rawVal).trim();

      // Check module / topic
      if (k.includes('វគ្គ') || k.includes('ប្រធានបទ') || k.includes('module') || k.includes('topic')) {
        moduleTag = v;
      }
      // Check prompt
      else if (k.includes('សំណួរ') || k.includes('question') || k.includes('prompt')) {
        prompt = v;
      }
      // Check options
      else if (k.includes('ជម្រើស ក') || k.includes('option a') || k.includes('choice a') || k === 'a') {
        optA = v;
      } else if (k.includes('ជម្រើស ខ') || k.includes('option b') || k.includes('choice b') || k === 'b') {
        optB = v;
      } else if (k.includes('ជម្រើស គ') || k.includes('option c') || k.includes('choice c') || k === 'c') {
        optC = v;
      } else if (k.includes('ជម្រើស ឃ') || k.includes('option d') || k.includes('choice d') || k === 'd') {
        optD = v;
      }
      // Check correct answer
      else if (k.includes('ចម្លើយ') || k.includes('correct') || k.includes('answer') || k.includes('key')) {
        correctRaw = rawVal;
      }
      // Check explanation
      else if (k.includes('ពន្យល់') || k.includes('explanation') || k.includes('reason')) {
        explanation = v;
      }
      // Check points
      else if (k.includes('ពិន្ទុ') || k.includes('points') || k.includes('score')) {
        const p = parseInt(v, 10);
        if (!isNaN(p) && p > 0) points = p;
      }
    }

    // Fallback if headers were different: try column indices if object keys are unknown
    if (!prompt) {
      const values = Object.values(row).map((v) => String(v).trim());
      if (values.length >= 3 && values[0]) {
        prompt = values[0];
        optA = values[1] || '';
        optB = values[2] || '';
        optC = values[3] || '';
        optD = values[4] || '';
        correctRaw = values[5] || 'A';
        explanation = values[6] || '';
      }
    }

    // Skip empty rows
    if (!prompt || (!optA && !optB)) {
      return;
    }

    const optionsList: { id: string; text: string }[] = [];
    if (optA) optionsList.push({ id: `opt_${rowIdx}_1`, text: optA });
    if (optB) optionsList.push({ id: `opt_${rowIdx}_2`, text: optB });
    if (optC) optionsList.push({ id: `opt_${rowIdx}_3`, text: optC });
    if (optD) optionsList.push({ id: `opt_${rowIdx}_4`, text: optD });

    const correctIdx = parseCorrectIndex(correctRaw);
    const safeCorrectIdx = Math.min(correctIdx, optionsList.length - 1);
    const correctOptionId = optionsList[safeCorrectIdx]?.id || optionsList[0]?.id;

    questions.push({
      id: `q_excel_${Date.now()}_${rowIdx}_` + Math.random().toString(36).substring(2, 6),
      prompt,
      options: optionsList,
      correctOptionId,
      explanation: explanation || undefined,
      points,
      category: moduleTag || undefined,
      moduleId: moduleTag ? ('mod_' + moduleTag.toLowerCase().replace(/[^a-z0-9]/g, '_')) : undefined,
    });
  });

  if (questions.length === 0) {
    throw new Error('មិនអាចស្វែងរកសំណួរដែលត្រឹមត្រូវក្នុងឯកសារបានទេ។ សូមពិនិត្យទម្រង់តាមគំរូ Excel!');
  }

  return questions;
}
