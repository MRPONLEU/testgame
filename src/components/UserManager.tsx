import React, { useState, useRef } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  FileSpreadsheet,
  Download,
  Upload,
  Trophy,
} from 'lucide-react';
import { RoomData, StudentSubmission } from '../types';
import { simulateDemoTrainees, addSubmissionToRoom, saveRoom } from '../utils/storage';
import { sound } from '../utils/audio';
import * as XLSX from 'xlsx';

interface UserManagerProps {
  room: RoomData;
  onUpdateRoom: (room: RoomData) => void;
  onViewStudentResult?: (sub: StudentSubmission) => void;
}

export const UserManager: React.FC<UserManagerProps> = ({
  room,
  onUpdateRoom,
  onViewStudentResult,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [batchNamesText, setBatchNamesText] = useState('');
  const batchFileRef = useRef<HTMLInputElement | null>(null);

  // Statistics
  const totalSubmissions = room.submissions.length;
  const passedCount = room.submissions.filter((s) => s.isPassed).length;
  const failedCount = room.submissions.filter((s) => !s.isPassed).length;
  const passRate = totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0;

  const avgScore =
    totalSubmissions > 0
      ? Math.round(
          room.submissions.reduce((acc, s) => acc + s.percentage, 0) / totalSubmissions
        )
      : 0;

  const avgDurationSeconds =
    totalSubmissions > 0
      ? Math.round(
          room.submissions.reduce((acc, s) => acc + s.durationSeconds, 0) / totalSubmissions
        )
      : 0;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} វិ`;
    return `${mins} នាទី ${secs} វិ`;
  };

  // Filter trainees
  const filteredSubmissions = room.submissions.filter((sub) => {
    const matchesSearch =
      sub.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.studentId && sub.studentId.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'passed') return sub.isPassed;
    if (statusFilter === 'failed') return !sub.isPassed;
    return true;
  });

  const handleSimulate = () => {
    sound.playSuccess();
    const updated = simulateDemoTrainees(room.config.id);
    if (updated) onUpdateRoom(updated);
  };

  const handleDeleteUser = (subId: string, name: string) => {
    if (window.confirm(`តើអ្នកពិតជាចង់លុបទិន្នន័យសិក្ខាកាម «${name}» មែនទេ?`)) {
      sound.playClick();
      const updated = {
        ...room,
        submissions: room.submissions.filter((s) => s.id !== subId),
      };
      saveRoom(updated);
      onUpdateRoom(updated);
    }
  };

  const handleAddManualUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    sound.playSelect();
    const totalPoints = room.questions.reduce((sum, q) => sum + (q.points ?? 10), 0) || 100;
    // Add default initial record
    const sub: StudentSubmission = {
      id: 'sub_manual_' + Date.now().toString(36),
      roomId: room.config.id,
      studentName: newStudentName.trim(),
      studentId: newStudentId.trim() || undefined,
      startedAt: Date.now(),
      submittedAt: Date.now(),
      durationSeconds: 0,
      answers: {},
      score: 0,
      maxScore: totalPoints,
      percentage: 0,
      isPassed: false,
    };

    const updated = addSubmissionToRoom(room.config.id, sub);
    if (updated) onUpdateRoom(updated);

    setNewStudentName('');
    setNewStudentId('');
    setShowAddModal(false);
  };

  const handleBatchImportText = () => {
    const lines = batchNamesText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    sound.playSuccess();
    const totalPoints = room.questions.reduce((sum, q) => sum + (q.points ?? 10), 0) || 100;

    lines.forEach((name, idx) => {
      const sub: StudentSubmission = {
        id: 'sub_batch_' + Date.now().toString(36) + idx,
        roomId: room.config.id,
        studentName: name,
        startedAt: Date.now(),
        submittedAt: Date.now(),
        durationSeconds: 0,
        answers: {},
        score: 0,
        maxScore: totalPoints,
        percentage: 0,
        isPassed: false,
      };
      addSubmissionToRoom(room.config.id, sub);
    });

    const fresh = { ...room };
    onUpdateRoom(fresh);
    setBatchNamesText('');
    setShowBatchModal(false);
  };

  const handleBatchExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

      const totalPoints = room.questions.reduce((sum, q) => sum + (q.points ?? 10), 0) || 100;

      rows.forEach((row, idx) => {
        let name = '';
        let sid = '';
        for (const [k, v] of Object.entries(row)) {
          const key = k.toLowerCase();
          const val = String(v).trim();
          if (key.includes('ឈ្មោះ') || key.includes('name') || key.includes('student')) {
            name = val;
          } else if (key.includes('id') || key.includes('អត្តលេខ') || key.includes('code')) {
            sid = val;
          }
        }

        if (name) {
          const sub: StudentSubmission = {
            id: 'sub_excel_' + Date.now().toString(36) + idx,
            roomId: room.config.id,
            studentName: name,
            studentId: sid || undefined,
            startedAt: Date.now(),
            submittedAt: Date.now(),
            durationSeconds: 0,
            answers: {},
            score: 0,
            maxScore: totalPoints,
            percentage: 0,
            isPassed: false,
          };
          addSubmissionToRoom(room.config.id, sub);
        }
      });

      sound.playSuccess();
      const fresh = { ...room };
      onUpdateRoom(fresh);
      setShowBatchModal(false);
    } catch {
      alert('មិនអាចអានឯកសារ Excel បានទេ!');
    }
  };

  const handleExportUsersExcel = () => {
    if (room.submissions.length === 0) {
      alert('មិនទាន់មានទិន្នន័យសិក្ខាកាមទេ!');
      return;
    }

    const data = room.submissions.map((s, idx) => ({
      'ចំណាត់ថ្នាក់ (Rank)': s.rank || idx + 1,
      'ឈ្មោះសិក្ខាកាម (Name)': s.studentName,
      'អត្តលេខ (Student ID)': s.studentId || '',
      'ពិន្ទុ (%)': `${s.percentage}%`,
      'ពិន្ទុជាក់ស្តែង': `${s.score}/${s.maxScore}`,
      'រយៈពេលធ្វើ': formatDuration(s.durationSeconds),
      'ស្ថានភាព': s.isPassed ? 'ជាប់' : 'ធ្លាក់',
      'កាលបរិច្ឆេទ': new Date(s.submittedAt).toLocaleString('km-KH'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'បញ្ជីសិក្ខាកាម');
    XLSX.writeFile(workbook, `Trainees_${room.config.code}.xlsx`);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">គ្រប់គ្រងអ្នកប្រើប្រាស់</h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {totalSubmissions} នាក់
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              គ្រប់គ្រងបញ្ជីសិក្ខាកាម ស្ថានភាពប្រឡង វត្តមាន និងលទ្ធផលតេស្តសមត្ថភាព
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>បន្ថែមសិក្ខាកាម</span>
          </button>

          <button
            onClick={() => setShowBatchModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>បញ្ចូលជាក្រុម (Excel)</span>
          </button>

          <button
            onClick={handleSimulate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>សាកល្បង ៥ នាក់</span>
          </button>

          {totalSubmissions > 0 && (
            <button
              onClick={handleExportUsersExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
              title="ទាញយកបញ្ជីសិក្ខាកាមជា Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ទាញយក Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-5">
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
          <span className="text-[11px] text-slate-400 font-medium">សិក្ខាកាមសរុប</span>
          <p className="text-2xl font-black text-white mt-1">{totalSubmissions} នាក់</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">បានចូលរួមធ្វើតេស្ត</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
          <span className="text-[11px] text-slate-400 font-medium">អត្រាប្រឡងជាប់</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{passRate}%</p>
          <span className="text-[10px] text-emerald-500/80 mt-0.5 block">
            {passedCount} ជាប់ / {failedCount} ធ្លាក់
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
          <span className="text-[11px] text-slate-400 font-medium">ពិន្ទុមធ្យម</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{avgScore}%</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">កម្រិតស្តង់ដាររួម</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
          <span className="text-[11px] text-slate-400 font-medium">រយៈពេលមធ្យម</span>
          <p className="text-2xl font-black text-blue-400 mt-1">
            {formatDuration(avgDurationSeconds)}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">ល្បឿនបញ្ចប់វិញ្ញាសា</span>
        </div>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ស្វែងរកតាមឈ្មោះ ឬអត្តលេខ..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-indigo-400 text-xs text-white placeholder-slate-500 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            ទាំងអស់ ({totalSubmissions})
          </button>
          <button
            onClick={() => setStatusFilter('passed')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              statusFilter === 'passed'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ជាប់ ({passedCount})
          </button>
          <button
            onClick={() => setStatusFilter('failed')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              statusFilter === 'failed' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            ធ្លាក់ ({failedCount})
          </button>
        </div>
      </div>

      {/* Trainees List Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
            <tr>
              <th className="py-3 px-3">ល.រ</th>
              <th className="py-3 px-3">ឈ្មោះសិក្ខាកាម</th>
              <th className="py-3 px-3">អត្តលេខ</th>
              <th className="py-3 px-3">ពិន្ទុ</th>
              <th className="py-3 px-3">រយៈពេល</th>
              <th className="py-3 px-3">ស្ថានភាព</th>
              <th className="py-3 px-3 text-right">សកម្មភាព</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/60">
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-500">
                  មិនទាន់មានទិន្នន័យសិក្ខាកាមដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ
                </td>
              </tr>
            ) : (
              filteredSubmissions.map((sub, idx) => {
                const rank = sub.rank || idx + 1;
                return (
                  <tr key={sub.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3">
                      <span
                        className={`w-6 h-6 rounded-lg font-black text-[11px] flex items-center justify-center ${
                          rank === 1
                            ? 'bg-amber-400 text-slate-950'
                            : rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {rank}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-white text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <span>{sub.studentName}</span>
                        {rank <= 5 && (
                          <Trophy className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                      {sub.studentId || '-'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-extrabold text-sm text-white">{sub.percentage}%</span>
                      <span className="text-[10px] text-slate-500 block">
                        {sub.score}/{sub.maxScore} ពិន្ទុ
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{formatDuration(sub.durationSeconds)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          sub.isPassed
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {sub.isPassed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> ជាប់
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> ធ្លាក់
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onViewStudentResult && (
                          <button
                            onClick={() => onViewStudentResult(sub)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition"
                          >
                            មើលលទ្ធផល
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(sub.id, sub.studentName)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition"
                          title="លុបសិក្ខាកាម"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add Trainee Manually */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">បន្ថែមសិក្ខាកាមថ្មី</h3>
            <p className="text-xs text-slate-400 mb-4">
              បញ្ចូលឈ្មោះសិក្ខាកាមទៅក្នុងបញ្ជីប្រឡងនៃបន្ទប់នេះ
            </p>

            <form onSubmit={handleAddManualUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  គោត្តនាម និងនាម <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="ឧ. សេង ពិសិដ្ឋ"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-indigo-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  អត្តលេខ ឬថ្នាក់រៀន
                </label>
                <input
                  type="text"
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  placeholder="ឧ. IT-001"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-indigo-400"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow"
                >
                  រក្សាទុក
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Batch Import Trainees */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">បញ្ចូលសិក្ខាកាមជាក្រុម (Batch)</h3>
            <p className="text-xs text-slate-400 mb-4">
              អ្នកអាចផ្ទុកឯកសារ Excel ឬចម្លងបញ្ជីឈ្មោះដាក់ក្នុងប្រអប់ខាងក្រោម
            </p>

            {/* Option A: Excel File */}
            <div
              onClick={() => batchFileRef.current?.click()}
              className="p-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/40 text-center cursor-pointer mb-4 transition"
            >
              <input
                type="file"
                ref={batchFileRef}
                onChange={handleBatchExcelUpload}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
              <FileSpreadsheet className="w-8 h-8 text-indigo-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-white">ចុចដើម្បីជ្រើសរើសឯកសារ Excel (.xlsx)</p>
              <p className="text-[10px] text-slate-400 mt-0.5">ជួរឈរ: ឈ្មោះ, អត្តលេខ</p>
            </div>

            {/* Option B: Text Paste */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ឬចម្លងបញ្ជីឈ្មោះបិទភ្ជាប់ (ម្នាក់មួយបន្ទាត់)៖
              </label>
              <textarea
                value={batchNamesText}
                onChange={(e) => setBatchNamesText(e.target.value)}
                placeholder={'សុខា ចាន់ថុល\nកែវ វីរៈ\nជា លក្ខិណា\nសេង ពិសិដ្ឋ'}
                rows={5}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-indigo-400"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleBatchImportText}
                disabled={!batchNamesText.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black shadow"
              >
                បញ្ចូលឈ្មោះ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
