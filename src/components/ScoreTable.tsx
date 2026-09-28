import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Printer,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { RoomData, StudentSubmission } from '../types';
import { saveRoom } from '../utils/storage';
import { sound } from '../utils/audio';
import * as XLSX from 'xlsx';

interface ScoreTableProps {
  room: RoomData;
  onUpdateRoom: (room: RoomData) => void;
  onSelectSubmissionForCertificate?: (sub: StudentSubmission) => void;
}

export const ScoreTable: React.FC<ScoreTableProps> = ({
  room,
  onUpdateRoom,
  onSelectSubmissionForCertificate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed'>('all');
  const [inspectSubmission, setInspectSubmission] = useState<StudentSubmission | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} វិ`;
    return `${mins} នាទី ${secs} វិ`;
  };

  const handleClearAll = () => {
    if (window.confirm('តើអ្នកពិតជាចង់កំណត់លទ្ធផលប្រឡងទាំងអស់ឡើងវិញ (Clear All)?')) {
      sound.playClick();
      const updated = {
        ...room,
        submissions: [],
      };
      saveRoom(updated);
      onUpdateRoom(updated);
    }
  };

  const handleExportCSV = () => {
    if (room.submissions.length === 0) {
      alert('មិនទាន់មានលទ្ធផលដើម្បី Export ទេ!');
      return;
    }

    const headers = [
      'ចំណាត់ថ្នាក់',
      'ឈ្មោះសិក្ខាកាម',
      'អត្តលេខ',
      'ពិន្ទុ (%)',
      'ពិន្ទុជាក់ស្តែង',
      'រយៈពេល (វិនាទី)',
      'ស្ថានភាព',
    ];
    const rows = room.submissions.map((s, idx) => [
      s.rank || idx + 1,
      `"${s.studentName.replace(/"/g, '""')}"`,
      `"${s.studentId || ''}"`,
      `${s.percentage}%`,
      `${s.score}/${s.maxScore}`,
      s.durationSeconds,
      s.isPassed ? 'ជាប់' : 'ធ្លាក់',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Scores_${room.config.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (room.submissions.length === 0) {
      alert('មិនទាន់មានទិន្នន័យដើម្បី Export ទេ!');
      return;
    }

    const data = room.submissions.map((s, idx) => ({
      'ចំណាត់ថ្នាក់': s.rank || idx + 1,
      'ឈ្មោះសិក្ខាកាម': s.studentName,
      'អត្តលេខ': s.studentId || '-',
      'ពិន្ទុ (%)': `${s.percentage}%`,
      'ពិន្ទុជាក់ស្តែង': `${s.score}/${s.maxScore}`,
      'រយៈពេលធ្វើ': formatDuration(s.durationSeconds),
      'ស្ថានភាព': s.isPassed ? 'ជាប់' : 'ធ្លាក់',
      'កាលបរិច្ឆេទ': new Date(s.submittedAt).toLocaleString('km-KH'),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'តារាងពិន្ទុ');
    XLSX.writeFile(wb, `Score_Report_${room.config.code}.xlsx`);
  };

  const filtered = room.submissions.filter((sub) => {
    const matchesSearch =
      sub.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.studentId && sub.studentId.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    if (filterStatus === 'passed') return sub.isPassed;
    if (filterStatus === 'failed') return !sub.isPassed;
    return true;
  });

  const passedCount = room.submissions.filter((s) => s.isPassed).length;
  const failedCount = room.submissions.filter((s) => !s.isPassed).length;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">តារាងពិន្ទុ & លទ្ធផលប្រឡង</h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {room.submissions.length} លទ្ធផល
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              ពិនិត្យមើលពិន្ទុជាក់ស្តែង ភាគរយ ពេលវេលា និងចម្លើយលម្អិតរបស់សិក្ខាកាមម្នាក់ៗ
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>ទាញយក Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>CSV</span>
          </button>

          {room.submissions.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/20 transition cursor-pointer"
              title="កំណត់លទ្ធផលឡើងវិញ"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>សម្អាតទាំងអស់</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 my-5">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ស្វែងរកតាមឈ្មោះ ឬអត្តលេខ..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-emerald-400 text-xs text-white placeholder-slate-500 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              filterStatus === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            ទាំងអស់ ({room.submissions.length})
          </button>
          <button
            onClick={() => setFilterStatus('passed')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              filterStatus === 'passed' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            ជាប់ ({passedCount})
          </button>
          <button
            onClick={() => setFilterStatus('failed')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              filterStatus === 'failed' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            ធ្លាក់ ({failedCount})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
            <tr>
              <th className="py-3 px-3">ចំណាត់ថ្នាក់</th>
              <th className="py-3 px-3">ឈ្មោះសិក្ខាកាម</th>
              <th className="py-3 px-3">អត្តលេខ</th>
              <th className="py-3 px-3">ភាគរយ</th>
              <th className="py-3 px-3">ពិន្ទុជាក់ស្តែង</th>
              <th className="py-3 px-3">រយៈពេល</th>
              <th className="py-3 px-3">លទ្ធផល</th>
              <th className="py-3 px-3 text-right">សកម្មភាព</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-500">
                  មិនទាន់មានលទ្ធផលប្រឡងដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ
                </td>
              </tr>
            ) : (
              filtered.map((sub, idx) => {
                const rank = sub.rank || idx + 1;
                return (
                  <tr key={sub.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3">
                      <span
                        className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center ${
                          rank === 1
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                            : rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : rank === 3
                            ? 'bg-amber-700 text-white'
                            : rank <= 5
                            ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {rank}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs sm:text-sm">
                          {sub.studentName}
                        </span>
                        {rank <= 5 && (
                          <Trophy className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                      {sub.studentId || '-'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-black text-sm sm:text-base ${
                          sub.isPassed ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {sub.percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-medium">
                      {sub.score} / {sub.maxScore}
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
                        <button
                          onClick={() => setInspectSubmission(sub)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                          title="ពិនិត្យមើលចម្លើយលម្អិត"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>លម្អិត</span>
                        </button>
                        {onSelectSubmissionForCertificate && (
                          <button
                            onClick={() => onSelectSubmissionForCertificate(sub)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 transition"
                            title="មើលវិញ្ញាបនបត្រ"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Answer Inspection Modal */}
      {inspectSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="font-black text-white text-base">
                  លទ្ធផលប្រឡង៖ {inspectSubmission.studentName}
                </h3>
                <p className="text-xs text-slate-400">
                  ពិន្ទុ៖ {inspectSubmission.percentage}% • រយៈពេល៖{' '}
                  {formatDuration(inspectSubmission.durationSeconds)} • ចំណាត់ថ្នាក់៖ លេខ #
                  {inspectSubmission.rank}
                </p>
              </div>
              <button
                onClick={() => setInspectSubmission(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {inspectSubmission.details?.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border ${
                    item.isCorrect
                      ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200'
                      : 'bg-rose-950/20 border-rose-900/40 text-rose-200'
                  }`}
                >
                  <p className="font-bold text-white mb-1">
                    {idx + 1}. {item.prompt}
                  </p>
                  <p className="text-slate-300">
                    ចម្លើយសិស្ស៖ <b>{item.selectedOptionText || '(មិនបានឆ្លើយ)'}</b>
                  </p>
                  {!item.isCorrect && (
                    <p className="text-emerald-400 font-semibold mt-0.5">
                      ចម្លើយត្រូវ៖ {item.correctOptionText}
                    </p>
                  )}
                  {item.explanation && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      💡 {item.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectSubmission(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
              >
                បិទផ្ទាំងនេះ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
