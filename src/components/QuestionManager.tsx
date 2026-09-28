import React, { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  BookOpen,
  Sparkles,
  HelpCircle,
  Layers,
  QrCode,
} from 'lucide-react';
import { Question, QuestionOption, ExamModule } from '../types';
import {
  parseExcelQuestions,
  downloadExcelTemplate,
  exportQuestionsToExcel,
} from '../utils/excelImport';
import { sound } from '../utils/audio';

interface QuestionManagerProps {
  questions: Question[];
  modules?: ExamModule[];
  initialModuleFilter?: string;
  examTitle: string;
  onUpdateQuestions: (newQuestions: Question[]) => void;
  onOpenModuleQR?: (moduleId: string) => void;
  onClose?: () => void;
}

export const QuestionManager: React.FC<QuestionManagerProps> = ({
  questions,
  modules = [],
  initialModuleFilter = 'all',
  examTitle,
  onUpdateQuestions,
  onOpenModuleQR,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>(initialModuleFilter || 'all');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreviewQuestions, setImportPreviewQuestions] = useState<Question[] | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State for Add / Edit
  const [formPrompt, setFormPrompt] = useState('');
  const [formModuleId, setFormModuleId] = useState('');
  const [formOptions, setFormOptions] = useState<QuestionOption[]>([
    { id: 'opt_1', text: '' },
    { id: 'opt_2', text: '' },
    { id: 'opt_3', text: '' },
    { id: 'opt_4', text: '' },
  ]);
  const [formCorrectId, setFormCorrectId] = useState('opt_1');
  const [formExplanation, setFormExplanation] = useState('');
  const [formPoints, setFormPoints] = useState(10);
  const [formError, setFormError] = useState('');

  // Start adding a new question
  const handleOpenCreate = () => {
    sound.playClick();
    setFormPrompt('');
    setFormModuleId(selectedModuleFilter !== 'all' && selectedModuleFilter !== 'none' ? selectedModuleFilter : (modules[0]?.id || ''));
    setFormOptions([
      { id: 'opt_1', text: '' },
      { id: 'opt_2', text: '' },
      { id: 'opt_3', text: '' },
      { id: 'opt_4', text: '' },
    ]);
    setFormCorrectId('opt_1');
    setFormExplanation('');
    setFormPoints(10);
    setFormError('');
    setEditingQuestion(null);
    setIsCreatingNew(true);
  };

  // Start editing existing question
  const handleOpenEdit = (q: Question) => {
    sound.playClick();
    setEditingQuestion(q);
    setFormPrompt(q.prompt);
    setFormModuleId(q.moduleId || '');
    // clone options
    const clonedOpts = q.options.map((o) => ({ ...o }));
    setFormOptions(clonedOpts);
    setFormCorrectId(q.correctOptionId);
    setFormExplanation(q.explanation || '');
    setFormPoints(q.points ?? 10);
    setFormError('');
    setIsCreatingNew(false);
  };

  // Duplicate question
  const handleDuplicate = (q: Question) => {
    sound.playClick();
    const duplicated: Question = {
      ...q,
      id: 'q_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      prompt: `${q.prompt} (ចម្លង)`,
      options: q.options.map((opt) => ({
        ...opt,
        id: 'opt_' + Math.random().toString(36).substring(2, 7),
      })),
    };
    // Ensure correctOptionId points to the duplicated option id
    const oldCorrectIdx = q.options.findIndex((o) => o.id === q.correctOptionId);
    if (oldCorrectIdx >= 0 && duplicated.options[oldCorrectIdx]) {
      duplicated.correctOptionId = duplicated.options[oldCorrectIdx].id;
    }
    const updated = [...questions, duplicated];
    onUpdateQuestions(updated);
  };

  // Delete question
  const handleDelete = (id: string) => {
    if (questions.length <= 1) {
      alert('ត្រូវមានសំណួរយ៉ាងតិច ១ ក្នុងវិញ្ញាសា!');
      return;
    }
    if (window.confirm('តើអ្នកពិតជាចង់លុបសំណួរនេះមែនទេ?')) {
      sound.playClick();
      const updated = questions.filter((q) => q.id !== id);
      onUpdateQuestions(updated);
      if (editingQuestion?.id === id) {
        setEditingQuestion(null);
      }
    }
  };

  // Delete all questions
  const handleClearAll = () => {
    if (window.confirm('តើអ្នកពិតជាចង់លុបសំណួរទាំងអស់ចេញពីវិញ្ញាសាមែនទេ?')) {
      onUpdateQuestions([]);
    }
  };

  // Handle Option field change in form
  const handleOptionTextChange = (idx: number, newText: string) => {
    setFormOptions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], text: newText };
      return copy;
    });
  };

  const handleAddOptionField = () => {
    if (formOptions.length >= 6) return;
    const newId = 'opt_' + Date.now() + Math.random().toString(36).substring(2, 5);
    setFormOptions((prev) => [...prev, { id: newId, text: '' }]);
  };

  const handleRemoveOptionField = (idx: number) => {
    if (formOptions.length <= 2) {
      alert('ត្រូវមានជម្រើសយ៉ាងតិច ២!');
      return;
    }
    const removedId = formOptions[idx].id;
    const nextOptions = formOptions.filter((_, i) => i !== idx);
    setFormOptions(nextOptions);
    if (formCorrectId === removedId) {
      setFormCorrectId(nextOptions[0].id);
    }
  };

  // Save Add / Edit Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPrompt.trim()) {
      setFormError('សូមបញ្ចូលខ្លឹមសារសំណួរ!');
      return;
    }

    const validOptions = formOptions.filter((o) => o.text.trim().length > 0);
    if (validOptions.length < 2) {
      setFormError('សូមបញ្ចូលជម្រើសចម្លើយយ៉ាងតិច ២!');
      return;
    }

    // Ensure correctOptionId points to an active valid option
    let finalCorrectId = formCorrectId;
    if (!validOptions.some((o) => o.id === finalCorrectId)) {
      finalCorrectId = validOptions[0].id;
    }

    if (isCreatingNew) {
      // Add new question
      const newQ: Question = {
        id: 'q_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        prompt: formPrompt.trim(),
        options: validOptions,
        correctOptionId: finalCorrectId,
        explanation: formExplanation.trim() || undefined,
        points: formPoints > 0 ? formPoints : 10,
        moduleId: formModuleId || undefined,
      };
      onUpdateQuestions([...questions, newQ]);
      sound.playSuccess();
      setIsCreatingNew(false);
    } else if (editingQuestion) {
      // Update existing question
      const updatedList = questions.map((q) => {
        if (q.id === editingQuestion.id) {
          return {
            ...q,
            prompt: formPrompt.trim(),
            options: validOptions,
            correctOptionId: finalCorrectId,
            explanation: formExplanation.trim() || undefined,
            points: formPoints > 0 ? formPoints : 10,
            moduleId: formModuleId || undefined,
          };
        }
        return q;
      });
      onUpdateQuestions(updatedList);
      sound.playSelect();
      setEditingQuestion(null);
    }
  };

  // Excel File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseExcelQuestions(buffer);
      setImportPreviewQuestions(parsed);
      sound.playSelect();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'មិនអាចអានឯកសារ Excel បានទេ!';
      setImportError(msg);
      setImportPreviewQuestions(null);
    }
  };

  // Confirm Excel Import
  const handleConfirmImport = () => {
    if (!importPreviewQuestions || importPreviewQuestions.length === 0) return;
    sound.playSuccess();
    if (importMode === 'replace') {
      onUpdateQuestions(importPreviewQuestions);
    } else {
      onUpdateQuestions([...questions, ...importPreviewQuestions]);
    }
    setShowImportModal(false);
    setImportPreviewQuestions(null);
    setImportError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filtered questions: by search keyword AND by selected module filter
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.prompt.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedModuleFilter === 'all') return true;
    if (selectedModuleFilter === 'none') return !q.moduleId;
    return q.moduleId === selectedModuleFilter;
  });

  const totalPoints = questions.reduce((sum, q) => sum + (q.points ?? 10), 0);
  const KHMER_LABELS = ['ក', 'ខ', 'គ', 'ឃ', 'ង', 'ច'];

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">គ្រប់គ្រងសំណួរប្រឡង</h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {questions.length} សំណួរ
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              បន្ថែម លុប កែប្រែ និងបញ្ចូលសំណួរពីឯកសារ Excel (.xlsx, .csv) • ពិន្ទុសរុប៖{' '}
              <b className="text-white">{totalPoints} ពិន្ទុ</b>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Question Button */}
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>បន្ថែមសំណួរថ្មី</span>
          </button>

          {/* Import from Excel Button */}
          <button
            onClick={() => {
              sound.playClick();
              setShowImportModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>បញ្ចូលពី Excel</span>
          </button>

          {/* Export to Excel */}
          {questions.length > 0 && (
            <button
              onClick={() => exportQuestionsToExcel(questions, examTitle)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="ទាញយកសំណួរទាំងអស់ជា Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ទាញយក Excel</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
              title="បិទផ្ទាំង"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Bar & Stats */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ស្វែងរកតាមខ្លឹមសារសំណួរ..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-amber-400 text-xs text-white placeholder-slate-500 outline-none transition"
          />
        </div>

        {questions.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>
              បង្ហាញ {filteredQuestions.length} នៃ {questions.length} សំណួរ
            </span>
            <span>•</span>
            <button
              onClick={handleClearAll}
              className="text-rose-400 hover:text-rose-300 font-semibold"
            >
              លុបទាំងអស់
            </button>
          </div>
        )}
      </div>

      {/* Module Filter Pills */}
      {modules && modules.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          <span className="text-xs text-slate-400 font-semibold flex-shrink-0 flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> ចម្រាញ់តាមវគ្គ៖
          </span>
          <button
            onClick={() => setSelectedModuleFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
              selectedModuleFilter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            ទាំងអស់ ({questions.length})
          </button>
          {modules.map((m) => {
            const count = questions.filter((q) => q.moduleId === m.id).length;
            const isSelected = selectedModuleFilter === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedModuleFilter(m.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow font-black'
                    : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                {m.code} ({count})
              </button>
            );
          })}
          <button
            onClick={() => setSelectedModuleFilter('none')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
              selectedModuleFilter === 'none'
                ? 'bg-slate-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            ទូទៅ ({questions.filter((q) => !q.moduleId).length})
          </button>

          {onOpenModuleQR && (
            <button
              onClick={() => onOpenModuleQR(selectedModuleFilter)}
              className="ml-auto flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition flex-shrink-0 cursor-pointer"
              title="បើក QR Code ស្កេនសម្រាប់វគ្គនេះ"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {selectedModuleFilter === 'all'
                  ? 'QR គ្រប់វគ្គ'
                  : selectedModuleFilter === 'none'
                  ? 'QR សំណួរទូទៅ'
                  : `QR វគ្គ ${modules.find((m) => m.id === selectedModuleFilter)?.code || ''}`}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Questions List */}
      <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-850/50 border border-dashed border-slate-800">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-300">
              {searchTerm ? 'រកមិនឃើញសំណួរដែលត្រូវនឹងពាក្យស្វែងរកទេ' : 'មិនទាន់មានសំណួរនៅឡើយ'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              ចុចប៊ូតុងខាងក្រោមដើម្បីបង្កើតសំណួរថ្មី ឬបញ្ចូលពី Excel
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black"
              >
                + បន្ថែមសំណួរ
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                បញ្ចូលពី Excel
              </button>
            </div>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const correctOpt = q.options.find((o) => o.id === q.correctOptionId);
            return (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 hover:border-slate-600 transition group flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                {/* Left: Prompt & Choices */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-extrabold text-xs flex items-center justify-center border border-amber-500/30">
                      {idx + 1}
                    </span>
                    {q.moduleId && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {modules.find((m) => m.id === q.moduleId)?.code || 'MOD'}
                      </span>
                    )}
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                      {q.points ?? 10} ពិន្ទុ
                    </span>
                    {q.explanation && (
                      <span className="text-[10px] font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        មានការពន្យល់
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-white text-sm sm:text-base leading-relaxed mb-3">
                    {q.prompt}
                  </h3>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = opt.id === q.correctOptionId;
                      const label = KHMER_LABELS[optIdx] || String(optIdx + 1);
                      return (
                        <div
                          key={opt.id}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                            isCorrect
                              ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-semibold'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center ${
                              isCorrect
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {label}
                          </span>
                          <span className="truncate flex-1">{opt.text}</span>
                          {isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <p className="mt-2.5 text-[11px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800">
                      <b className="text-amber-400 font-medium">💡 ការពន្យល់៖</b> {q.explanation}
                    </p>
                  )}
                </div>

                {/* Right: Actions (Edit, Duplicate, Delete) */}
                <div className="flex md:flex-col items-center justify-end gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <button
                    onClick={() => handleOpenEdit(q)}
                    className="flex-1 md:flex-none flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold border border-blue-500/30 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>កែប្រែ</span>
                  </button>

                  <button
                    onClick={() => handleDuplicate(q)}
                    className="flex-1 md:flex-none flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-600 transition cursor-pointer"
                    title="ចម្លងសំណួរនេះ"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>ចម្លង</span>
                  </button>

                  <button
                    onClick={() => handleDelete(q.id)}
                    className="flex-1 md:flex-none flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/20 transition cursor-pointer"
                    title="លុបសំណួរ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>លុប</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add or Edit Question */}
      {(isCreatingNew || editingQuestion) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  {isCreatingNew ? <Plus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {isCreatingNew ? 'បន្ថែមសំណួរថ្មី' : 'កែប្រែសំណួរ'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    បញ្ចូលខ្លឹមសារសំណួរ ជម្រើសចម្លើយ និងជ្រើសរើសចម្លើយត្រឹមត្រូវ
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreatingNew(false);
                  setEditingQuestion(null);
                }}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto space-y-4 pr-1">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Module / Topic Selector */}
              {modules && modules.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ចាត់ចូលវគ្គ / ប្រធានបទ (Assign to Module / Topic)</span>
                  </label>
                  <select
                    value={formModuleId}
                    onChange={(e) => setFormModuleId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-amber-400"
                  >
                    <option value="">(សំណួរទូទៅ - មិនទាន់ចាត់វគ្គ)</option>
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.code} - {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Prompt */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ខ្លឹមសារសំណួរ (Question Prompt) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  placeholder="ឧ. តើភាសាសរសេរកូដមួយណាដែលប្រើប្រាស់យ៉ាងទូលំទូលាយបំផុតសម្រាប់បង្កើត Website?"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:border-amber-400 text-white text-xs sm:text-sm outline-none resize-none"
                  required
                />
              </div>

              {/* Choices / Options */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-300">
                    ជម្រើសចម្លើយ (សូមចុចជ្រើសរើសចម្លើយណាដែលត្រឹមត្រូវ) <span className="text-rose-400">*</span>
                  </label>
                  {formOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddOptionField}
                      className="text-xs text-amber-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      + បន្ថែមជម្រើស
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {formOptions.map((opt, idx) => {
                    const isCorrect = formCorrectId === opt.id;
                    const label = KHMER_LABELS[idx] || String(idx + 1);
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-2 p-2 rounded-2xl border transition ${
                          isCorrect
                            ? 'bg-emerald-950/20 border-emerald-500/50'
                            : 'bg-slate-800/60 border-slate-700'
                        }`}
                      >
                        {/* Radio for Correct Answer */}
                        <label className="flex items-center gap-2 cursor-pointer pl-1">
                          <input
                            type="radio"
                            name="correct_option"
                            checked={isCorrect}
                            onChange={() => setFormCorrectId(opt.id)}
                            className="w-4 h-4 text-emerald-500 accent-emerald-500 cursor-pointer"
                          />
                          <span
                            className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                              isCorrect
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {label}
                          </span>
                        </label>

                        {/* Option Input */}
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                          placeholder={`បញ្ចូលចម្លើយជម្រើស ${label}...`}
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white outline-none focus:border-amber-400"
                          required
                        />

                        {/* Remove Option Button */}
                        {formOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionField(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg"
                            title="លុបជម្រើសនេះ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Points & Explanation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ពិន្ទុ (Points)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formPoints}
                    onChange={(e) => setFormPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ការពន្យល់ចម្លើយត្រឹមត្រូវ (Explanation)
                  </label>
                  <input
                    type="text"
                    value={formExplanation}
                    onChange={(e) => setFormExplanation(e.target.value)}
                    placeholder="បង្ហាញការពន្យល់ពេលសិស្សប្រឡងចប់..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditingQuestion(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20"
                >
                  {isCreatingNew ? 'រក្សាទុកសំណួរ' : 'ធ្វើបច្ចុប្បន្នភាព'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import from Excel */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">បញ្ចូលសំណួរពីឯកសារ Excel</h3>
                  <p className="text-xs text-slate-400">គាំទ្រឯកសារ .xlsx, .xls ឬ .csv</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportPreviewQuestions(null);
                  setImportError(null);
                }}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Template Download Banner */}
              <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-white text-xs">មិនទាន់មានទម្រង់ Excel មែនទេ?</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ទាញយកគំរូ Excel ដែលមានទម្រង់ត្រឹមត្រូវដើម្បីងាយស្រួលរៀបចំសំណួរ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadExcelTemplate}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold border border-emerald-500/30 transition flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ទាញយកគំរូ (.xlsx)</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-3xl p-6 text-center cursor-pointer bg-slate-800/30 hover:bg-slate-800/50 transition group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <Upload className="w-10 h-10 text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition" />
                <p className="font-bold text-white text-xs sm:text-sm">
                  ចុចទីនេះដើម្បីជ្រើសរើសឯកសារ Excel ឬ CSV
                </p>
                <p className="text-[11px] text-slate-400 mt-1">គាំទ្រ (.xlsx, .xls, .csv)</p>
              </div>

              {importError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Preview Section */}
              {importPreviewQuestions && (
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                      <Sparkles className="w-4 h-4" />
                      <span>បានរកឃើញសំណួរត្រឹមត្រូវ៖ {importPreviewQuestions.length} សំណួរ</span>
                    </div>
                  </div>

                  {/* Mode: Replace or Append */}
                  <div className="pt-2 border-t border-emerald-900/40">
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1.5">
                      វិធីសាស្ត្របញ្ចូលសំណួរ៖
                    </label>
                    <div className="flex gap-2">
                      <label className="flex-1 flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          className="text-emerald-500 accent-emerald-500"
                        />
                        <span className="text-[11px] text-slate-200">
                          បន្ថែមពីលើសំណួរចាស់ (+ {questions.length})
                        </span>
                      </label>
                      <label className="flex-1 flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="text-rose-500 accent-rose-500"
                        />
                        <span className="text-[11px] text-slate-200">ជំនួសសំណួរទាំងអស់</span>
                      </label>
                    </div>
                  </div>

                  {/* Sample Preview List */}
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pt-1">
                    {importPreviewQuestions.slice(0, 3).map((pq, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-900/80 text-[11px] text-slate-300 truncate">
                        <b className="text-white">#{idx + 1}</b> {pq.prompt} ({pq.options.length} ជម្រើស)
                      </div>
                    ))}
                    {importPreviewQuestions.length > 3 && (
                      <p className="text-[10px] text-slate-400 text-center">
                        ... និង {importPreviewQuestions.length - 3} សំណួរផ្សេងទៀត
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportPreviewQuestions(null);
                  setImportError(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                បោះបង់
              </button>
              <button
                type="button"
                disabled={!importPreviewQuestions || importPreviewQuestions.length === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black shadow-lg shadow-emerald-600/20"
              >
                បញ្ជាក់ការបញ្ចូល ({importPreviewQuestions?.length || 0} សំណួរ)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
