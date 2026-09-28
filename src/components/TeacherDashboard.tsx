import React, { useState } from 'react';
import {
  QrCode,
  Users,
  Clock,
  Shuffle,
  Trophy,
  Download,
  Trash2,
  Sparkles,
  BookOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Settings,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { RoomData, Question, StudentSubmission } from '../types';
import { DEFAULT_EXAM_PRESETS } from '../data/defaultQuestions';
import { TopPodium } from './TopPodium';
import { QRCodeModal } from './QRCodeModal';
import { QuestionManager } from './QuestionManager';
import { saveRoom, simulateDemoTrainees, createNewRoom } from '../utils/storage';
import { sound } from '../utils/audio';

interface TeacherDashboardProps {
  room: RoomData;
  onUpdateRoom: (room: RoomData) => void;
  onOpenStudentView: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  room,
  onUpdateRoom,
  onOpenStudentView,
}) => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQuestionManager, setShowQuestionManager] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);

  // Config modifications
  const handleDurationChange = (minutes: number) => {
    const updated = {
      ...room,
      config: { ...room.config, durationMinutes: minutes },
    };
    saveRoom(updated);
    onUpdateRoom(updated);
  };

  const handleToggleShuffleQuestions = () => {
    const updated = {
      ...room,
      config: { ...room.config, shuffleQuestions: !room.config.shuffleQuestions },
    };
    saveRoom(updated);
    onUpdateRoom(updated);
  };

  const handleToggleShuffleOptions = () => {
    const updated = {
      ...room,
      config: { ...room.config, shuffleOptions: !room.config.shuffleOptions },
    };
    saveRoom(updated);
    onUpdateRoom(updated);
  };

  const handleSimulateStudents = () => {
    sound.playSuccess();
    const updated = simulateDemoTrainees(room.config.id);
    if (updated) {
      onUpdateRoom(updated);
    }
  };

  const handleClearSubmissions = () => {
    if (window.confirm('តើអ្នកពិតជាចង់កំណត់លទ្ធផលប្រឡងទាំងអស់ឡើងវិញ (Clear All)?')) {
      const updated = {
        ...room,
        submissions: [],
      };
      saveRoom(updated);
      onUpdateRoom(updated);
    }
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = DEFAULT_EXAM_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const newR = createNewRoom(preset.title, preset.durationMinutes, preset.questions, {
      description: preset.description,
    });
    onUpdateRoom(newR);
    sound.playSelect();
  };

  const handleUpdateQuestions = (newQuestions: Question[]) => {
    const updated = {
      ...room,
      questions: newQuestions,
    };
    saveRoom(updated);
    onUpdateRoom(updated);
  };

  const handleExportCSV = () => {
    if (room.submissions.length === 0) {
      alert('មិនទាន់មានលទ្ធផលដើម្បី Export ទេ!');
      return;
    }

    const headers = ['ចំណាត់ថ្នាក់', 'ឈ្មោះសិក្ខាកាម', 'អត្តលេខ', 'ពិន្ទុ (%)', 'ពិន្ទុជាក់ស្តែង', 'រយៈពេល (វិនាទី)', 'ស្ថានភាព'];
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
    link.setAttribute('download', `KhmerQuiz_Results_${room.config.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} វិ`;
    return `${mins} នាទី ${secs} វិ`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Room Title & Code */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-lg border border-amber-500/30 flex-shrink-0">
              KQ
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  ផ្ទាំងគ្រប់គ្រងគ្រូបង្រៀន
                </span>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                  PIN: {room.config.code}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                {room.config.title}
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                <span>សំណួរ៖ {room.questions.length}</span>
                <span>•</span>
                <span>កំណត់ម៉ោង៖ {room.config.durationMinutes} នាទី</span>
                <span>•</span>
                <span>សិក្ខាកាមប្រឡង៖ {room.submissions.length} នាក់</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* BIG QR CODE BUTTON */}
            <button
              onClick={() => setShowQRModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition cursor-pointer"
            >
              <QrCode className="w-5 h-5" />
              <span>បើក QR Code ឱ្យសិស្សស្កេន</span>
            </button>

            {/* Open Question Manager & Excel button in top banner */}
            <button
              onClick={() => {
                sound.playClick();
                setShowQuestionManager(!showQuestionManager);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                showQuestionManager
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="បន្ថែម លុប កែប្រែ និងបញ្ចូលសំណួរពី Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>គ្រប់គ្រងសំណួរ ({room.questions.length})</span>
            </button>

            {/* Test as Student Button */}
            <button
              onClick={onOpenStudentView}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="សាកល្បងធ្វើតេស្តក្នុងនាមជាសិស្ស"
            >
              <ExternalLink className="w-4 h-4 text-blue-400" />
              <span>សាកល្បងធ្វើតេស្ត</span>
            </button>

            {/* Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                showSettings
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="ការកំណត់វិញ្ញាសា"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Session Settings */}
        {showSettings && (
          <div className="mt-6 pt-5 border-t border-slate-800 animate-in fade-in duration-200">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-400" /> កំណត់ពេលវេលា & ប្រព័ន្ធសាប់សំណួរ
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Duration Setting */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> កំណត់ម៉ោងប្រឡង (Duration)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[2, 5, 10, 15, 20].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => handleDurationChange(mins)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        room.config.durationMinutes === mins
                          ? 'bg-amber-400 text-slate-950 shadow'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {mins} នាទី
                    </button>
                  ))}
                </div>
              </div>

              {/* Shuffle Questions Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                <div>
                  <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5 mb-1">
                    <Shuffle className="w-3.5 h-3.5 text-blue-400" /> សាប់លំដាប់សំណួរ (Shuffle Qs)
                  </label>
                  <p className="text-[11px] text-slate-400">
                    សិស្សម្នាក់ៗទទួលបានលំដាប់សំណួរខុសៗគ្នា
                  </p>
                </div>
                <button
                  onClick={handleToggleShuffleQuestions}
                  className={`mt-2 py-1.5 px-3 rounded-xl text-xs font-bold transition ${
                    room.config.shuffleQuestions
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {room.config.shuffleQuestions ? '✓ បើកដំណើរការ (Active)' : '✕ បិទ'}
                </button>
              </div>

              {/* Shuffle Choices Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                <div>
                  <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5 mb-1">
                    <Shuffle className="w-3.5 h-3.5 text-indigo-400" /> សាប់ជម្រើសចម្លើយ (Shuffle Options)
                  </label>
                  <p className="text-[11px] text-slate-400">
                    ជម្រើស ក, ខ, គ, ឃ ត្រូវបានសាប់ចៃដន្យ
                  </p>
                </div>
                <button
                  onClick={handleToggleShuffleOptions}
                  className={`mt-2 py-1.5 px-3 rounded-xl text-xs font-bold transition ${
                    room.config.shuffleOptions
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {room.config.shuffleOptions ? '✓ បើកដំណើរការ (Active)' : '✕ បិទ'}
                </button>
              </div>
            </div>

            {/* Presets Row */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-400 block mb-2">
                ប្តូរទៅវិញ្ញាសាគំរូផ្សេងទៀត (Exam Presets)៖
              </span>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_EXAM_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleLoadPreset(p.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TOP 1 to 5 PODIUM (The main highlight requested by user) */}
      <TopPodium submissions={room.submissions} />

      {/* Action Row: Demo simulation, Export, Question Manager */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Simulate 5 Students Button */}
          <button
            onClick={handleSimulateStudents}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold border border-indigo-500/30 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>បន្ថែមសិក្ខាកាមសាកល្បង ៥ នាក់</span>
          </button>

          {/* Question Manager Toggle */}
          <button
            onClick={() => setShowQuestionManager(!showQuestionManager)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>គ្រប់គ្រងសំណួរ ({room.questions.length})</span>
            {showQuestionManager ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ទាញយក CSV</span>
          </button>

          {room.submissions.length > 0 && (
            <button
              onClick={handleClearSubmissions}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/20 transition"
              title="កំណត់លទ្ធផលឡើងវិញ"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>កំណត់ឡើងវិញ</span>
            </button>
          )}
        </div>
      </div>

      {/* Question Manager Section with Add, Edit, Delete, Excel Import/Export */}
      {showQuestionManager && (
        <QuestionManager
          questions={room.questions}
          examTitle={room.config.title}
          onUpdateQuestions={handleUpdateQuestions}
          onClose={() => setShowQuestionManager(false)}
        />
      )}

      {/* Full Submissions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              លទ្ធផលសិក្ខាកាមទាំងអស់ ({room.submissions.length} នាក់)
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            ជាប់៖ {room.submissions.filter((s) => s.isPassed).length} | ធ្លាក់៖{' '}
            {room.submissions.filter((s) => !s.isPassed).length}
          </span>
        </div>

        {room.submissions.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-800/30 border border-dashed border-slate-700">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">មិនទាន់មានសិក្ខាកាមបញ្ជូនចម្លើយនៅឡើយ</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              សូមបើក QR Code ឱ្យសិស្សស្កេន ឬចុចប៊ូតុងខាងក្រោមដើម្បីបង្កើតទិន្នន័យសិក្ខាកាមសាកល្បង
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              <button
                onClick={() => setShowQRModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow transition"
              >
                បើក QR Code ឥឡូវ
              </button>
              <button
                onClick={handleSimulateStudents}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition"
              >
                បន្ថែមសិក្ខាកាមសាកល្បង ៥ នាក់
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-3 px-3">ល.រ</th>
                  <th className="py-3 px-3">ឈ្មោះសិក្ខាកាម</th>
                  <th className="py-3 px-3">ពិន្ទុ</th>
                  <th className="py-3 px-3">រយៈពេល</th>
                  <th className="py-3 px-3">លទ្ធផល</th>
                  <th className="py-3 px-3 text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {room.submissions.map((sub, idx) => {
                  const rank = sub.rank || idx + 1;
                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      <td className="py-3.5 px-3">
                        <span
                          className={`w-6 h-6 rounded-lg font-black text-[11px] flex items-center justify-center ${
                            rank === 1
                              ? 'bg-amber-400 text-slate-950'
                              : rank === 2
                              ? 'bg-slate-300 text-slate-950'
                              : rank === 3
                              ? 'bg-amber-700 text-white'
                              : rank <= 5
                              ? 'bg-blue-600/30 text-blue-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {rank}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white text-xs sm:text-sm">
                          {sub.studentName}
                        </div>
                        {sub.studentId && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            {sub.studentId}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-extrabold text-sm text-white">
                          {sub.percentage}%
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {sub.score}/{sub.maxScore} ពិន្ទុ
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 font-medium">
                        {formatDuration(sub.durationSeconds)}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            sub.isPassed
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {sub.isPassed ? 'ជាប់' : 'ធ្លាក់'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedSubmission(sub)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>លម្អិត</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trainee Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="font-black text-white text-base">
                  លទ្ធផលប្រឡង៖ {selectedSubmission.studentName}
                </h3>
                <p className="text-xs text-slate-400">
                  ពិន្ទុ៖ {selectedSubmission.percentage}% • រយៈពេល៖{' '}
                  {formatDuration(selectedSubmission.durationSeconds)} • ចំណាត់ថ្នាក់៖ លេខ #
                  {selectedSubmission.rank}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {selectedSubmission.details?.map((item, idx) => (
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
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
              >
                បិទផ្ទាំងនេះ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        config={room.config}
        activeCount={room.submissions.length}
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </div>
  );
};
