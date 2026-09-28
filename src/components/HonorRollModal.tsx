import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Medal,
  Award,
  Clock,
  Sparkles,
  X,
  RotateCcw,
  FileSpreadsheet,
  CheckCircle2,
  Users,
  Percent,
} from 'lucide-react';
import { StudentSubmission, ExamModule } from '../types';
import { sound } from '../utils/audio';

interface HonorRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: StudentSubmission[];
  activeModule?: ExamModule | null;
  examTitle: string;
  onRestartExam?: () => void;
  onViewAllScores?: () => void;
}

export const HonorRollModal: React.FC<HonorRollModalProps> = ({
  isOpen,
  onClose,
  submissions,
  activeModule,
  examTitle,
  onRestartExam,
  onViewAllScores,
}) => {
  // Sort submissions: score desc, duration asc
  const sorted = [...submissions].sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    return a.durationSeconds - b.durationSeconds;
  });

  const top1 = sorted[0];
  const top2 = sorted[1];
  const top3 = sorted[2];
  const top4 = sorted[3];
  const top5 = sorted[4];

  // Trigger fanfare and confetti when modal opens
  useEffect(() => {
    if (isOpen) {
      sound.playFanfare();
      fireCelebrationConfetti();
    }
  }, [isOpen]);

  const fireCelebrationConfetti = () => {
    try {
      // First burst
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#eab308'],
      });
      // Side bursts
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.7 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.7 },
        });
      }, 250);
    } catch {
      // Ignore if canvas-confetti unsupported
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} វិ`;
    return `${mins} នាទី ${secs} វិ`;
  };

  if (!isOpen) return null;

  // Stats calculation
  const totalCount = sorted.length;
  const passCount = sorted.filter((s) => s.isPassed).length;
  const passRate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;
  const avgScore =
    totalCount > 0
      ? Math.round(sorted.reduce((sum, s) => sum + s.percentage, 0) / totalCount)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl my-6 bg-slate-900 border-2 border-amber-500/40 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col font-['Kantumruy_Pro',sans-serif]">
        {/* Glow lights */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -left-20 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 px-5 sm:px-8 pt-6 pb-4 border-b border-slate-800 bg-gradient-to-b from-amber-500/10 to-transparent flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/30 flex-shrink-0 animate-bounce">
              <Trophy className="w-7 h-7 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> លទ្ធផលប្រឡងផ្លូវការ (Official Leaderboard)
                </span>
                {activeModule && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {activeModule.code}: {activeModule.name}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-wide mt-1">
                តារាងកិត្តិយស TOP 1 ដល់ TOP 5
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {examTitle} • អបអរសាទរសិក្ខាកាមឆ្នើមដែលទទួលបានជ័យលាភីកំពូល!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
            title="បិទផ្ទាំង"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 px-4 sm:px-8 py-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                <Users className="w-3.5 h-3.5 text-blue-400" /> បេក្ខជនសរុប
              </div>
              <div className="text-xl font-black text-white">{totalCount} នាក់</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> អត្រាជាប់
              </div>
              <div className="text-xl font-black text-emerald-400">{passRate}%</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                <Percent className="w-3.5 h-3.5 text-amber-400" /> ពិន្ទុមធ្យម
              </div>
              <div className="text-xl font-black text-amber-400">{avgScore}%</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                <Clock className="w-3.5 h-3.5 text-purple-400" /> ល្បឿនលឿនបំផុត
              </div>
              <div className="text-xl font-black text-purple-400">
                {top1 ? formatDuration(top1.durationSeconds) : '--'}
              </div>
            </div>
          </div>

          {/* Podium Top 1-3 */}
          {sorted.length > 0 ? (
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 items-end pt-6 pb-2 max-w-2xl mx-auto">
              {/* TOP 2 - Silver (Left) */}
              <div className="flex flex-col items-center">
                <div className="w-full flex flex-col items-center mb-2">
                  <div className="relative">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-slate-200 to-slate-400 text-slate-900 font-black text-base sm:text-lg flex items-center justify-center shadow-lg border-2 border-white/50">
                      {top2 ? top2.studentName.slice(0, 2) : '2'}
                    </div>
                    <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-slate-300 text-slate-900 text-xs font-black flex items-center justify-center border border-white shadow">
                      2
                    </div>
                  </div>
                  <span className="mt-3 text-xs sm:text-sm font-bold text-slate-200 text-center truncate max-w-[110px]">
                    {top2 ? top2.studentName : 'រង់ចាំ'}
                  </span>
                  <span className="text-[11px] font-extrabold text-slate-300 mt-0.5">
                    {top2 ? `${top2.percentage}% (${top2.score}ពិន្ទុ)` : '--'}
                  </span>
                  {top2 && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                      <Clock className="w-2.5 h-2.5" /> {formatDuration(top2.durationSeconds)}
                    </span>
                  )}
                </div>
                <div className="w-full h-24 sm:h-28 rounded-t-2xl bg-gradient-to-b from-slate-400/40 via-slate-600/30 to-slate-800/40 border-t-2 border-x-2 border-slate-300/40 p-2 flex flex-col items-center justify-center">
                  <Medal className="w-6 h-6 sm:w-7 sm:h-7 text-slate-200 mb-1" />
                  <span className="text-xs font-black text-slate-200 tracking-wider">TOP 2</span>
                  <span className="text-[10px] text-slate-300">មេដាយប្រាក់</span>
                </div>
              </div>

              {/* TOP 1 - Gold Champion (Center) */}
              <div className="flex flex-col items-center">
                <div className="w-full flex flex-col items-center mb-2">
                  <div className="relative animate-pulse">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-black text-lg sm:text-xl flex items-center justify-center shadow-xl shadow-amber-500/40 border-2 border-amber-200">
                      {top1 ? top1.studentName.slice(0, 2) : '1'}
                    </div>
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 p-1 rounded-full shadow-lg border border-amber-200">
                      <Trophy className="w-4 h-4 fill-slate-950" />
                    </div>
                    <div className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 text-xs font-black flex items-center justify-center border-2 border-slate-900 shadow">
                      1
                    </div>
                  </div>
                  <span className="mt-3 text-xs sm:text-sm font-black text-amber-300 text-center truncate max-w-[130px]">
                    {top1 ? top1.studentName : 'រង់ចាំ'}
                  </span>
                  <span className="text-xs font-black text-amber-400 mt-0.5">
                    {top1 ? `${top1.percentage}% (${top1.score}ពិន្ទុ)` : '--'}
                  </span>
                  {top1 && (
                    <span className="text-[10px] text-amber-200/80 flex items-center gap-0.5 mt-0.5 font-mono">
                      <Clock className="w-2.5 h-2.5" /> {formatDuration(top1.durationSeconds)}
                    </span>
                  )}
                </div>
                <div className="w-full h-32 sm:h-36 rounded-t-2xl bg-gradient-to-b from-amber-500/50 via-amber-600/30 to-amber-900/40 border-t-2 border-x-2 border-amber-400/60 p-2 flex flex-col items-center justify-center shadow-lg shadow-amber-500/20">
                  <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300 mb-1 fill-amber-300/30" />
                  <span className="text-xs sm:text-sm font-black text-amber-300 tracking-wider">TOP 1</span>
                  <span className="text-[10px] font-bold text-amber-200">ជើងឯកមាស 🥇</span>
                </div>
              </div>

              {/* TOP 3 - Bronze (Right) */}
              <div className="flex flex-col items-center">
                <div className="w-full flex flex-col items-center mb-2">
                  <div className="relative">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-amber-700 to-amber-900 text-amber-100 font-black text-base sm:text-lg flex items-center justify-center shadow-lg border-2 border-amber-600/50">
                      {top3 ? top3.studentName.slice(0, 2) : '3'}
                    </div>
                    <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-amber-700 text-amber-100 text-xs font-black flex items-center justify-center border border-amber-500 shadow">
                      3
                    </div>
                  </div>
                  <span className="mt-3 text-xs sm:text-sm font-bold text-slate-200 text-center truncate max-w-[110px]">
                    {top3 ? top3.studentName : 'រង់ចាំ'}
                  </span>
                  <span className="text-[11px] font-extrabold text-amber-500 mt-0.5">
                    {top3 ? `${top3.percentage}% (${top3.score}ពិន្ទុ)` : '--'}
                  </span>
                  {top3 && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                      <Clock className="w-2.5 h-2.5" /> {formatDuration(top3.durationSeconds)}
                    </span>
                  )}
                </div>
                <div className="w-full h-20 sm:h-24 rounded-t-2xl bg-gradient-to-b from-amber-800/40 via-amber-950/30 to-slate-900/40 border-t-2 border-x-2 border-amber-700/50 p-2 flex flex-col items-center justify-center">
                  <Award className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600 mb-1" />
                  <span className="text-xs font-black text-amber-400 tracking-wider">TOP 3</span>
                  <span className="text-[10px] text-amber-300">មេដាយសំរឹទ្ធ</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">មិនទាន់មានលទ្ធផលប្រឡងនៅឡើយទេ</p>
              <p className="text-xs text-slate-500 mt-0.5">
                សូមឱ្យសិស្សស្កេន QR Code ដើម្បីចូលឆ្លើយសំណួរ
              </p>
            </div>
          )}

          {/* Top 4 & Top 5 Table */}
          {(top4 || top5) && (
            <div className="space-y-2 max-w-xl mx-auto">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                ចំណាត់ថ្នាក់កិត្តិយសបន្ថែម (TOP 4 & TOP 5)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {top4 && (
                  <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-700 text-slate-200 font-black text-xs flex items-center justify-center">
                        4
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white truncate max-w-[130px]">
                          {top4.studentName}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {formatDuration(top4.durationSeconds)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-blue-400">{top4.percentage}%</div>
                      <div className="text-[10px] text-slate-400">{top4.score} ពិន្ទុ</div>
                    </div>
                  </div>
                )}

                {top5 && (
                  <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-700 text-slate-200 font-black text-xs flex items-center justify-center">
                        5
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white truncate max-w-[130px]">
                          {top5.studentName}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {formatDuration(top5.durationSeconds)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-blue-400">{top5.percentage}%</div>
                      <div className="text-[10px] text-slate-400">{top5.score} ពិន្ទុ</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="relative z-10 px-5 sm:px-8 py-4 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={fireCelebrationConfetti}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold border border-amber-500/30 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> បាញ់កាំជ្រួចម្ដងទៀត (Confetti)
          </button>

          <div className="w-full sm:w-auto flex items-center justify-end gap-2.5">
            {onViewAllScores && (
              <button
                onClick={() => {
                  onClose();
                  onViewAllScores();
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>មើលតារាងពិន្ទុពេញលេញ</span>
              </button>
            )}

            {onRestartExam && (
              <button
                onClick={() => {
                  onClose();
                  onRestartExam();
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ប្រឡងវគ្គថ្មី / ចាប់ផ្ដើមឡើងវិញ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
