import React, { useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  Trophy,
  Clock,
  Printer,
  RotateCcw,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { StudentSubmission, ExamSessionConfig } from '../types';

interface ResultScreenProps {
  submission: StudentSubmission;
  config: ExamSessionConfig;
  onRetake?: () => void;
  onViewLeaderboard?: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  submission,
  config,
  onRetake,
  onViewLeaderboard,
}) => {
  const certificateRef = useRef<HTMLDivElement | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} វិនាទី`;
    return `${mins} នាទី ${secs} វិនាទី`;
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const isTop5 = submission.rank !== undefined && submission.rank <= 5;

  return (
    <div className="w-full max-w-3xl mx-auto py-6 px-4 animate-in fade-in duration-300">
      {/* Top Banner Status */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>ការប្រឡងបានបញ្ចប់ដោយជោគជ័យ</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">លទ្ធផលតេស្តសមត្ថភាពភ្លាមៗ</h1>
        <p className="text-sm text-slate-400 mt-1">{config.title}</p>
      </div>

      {/* Main Score Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        {/* Glow */}
        <div
          className={`absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
            submission.isPassed ? 'bg-emerald-500/15' : 'bg-rose-500/15'
          }`}
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Avatar / Icon */}
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl border-4 ${
              submission.isPassed
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
            }`}
          >
            {submission.isPassed ? (
              <CheckCircle2 className="w-10 h-10" />
            ) : (
              <XCircle className="w-10 h-10" />
            )}
          </div>

          {/* Student Name */}
          <h2 className="mt-4 text-xl sm:text-2xl font-black text-white">{submission.studentName}</h2>
          {submission.studentId && (
            <p className="text-xs text-slate-400">អត្តលេខ៖ {submission.studentId}</p>
          )}

          {/* Large Percentage */}
          <div className="mt-4 flex items-baseline justify-center gap-1">
            <span
              className={`text-5xl sm:text-6xl font-black tracking-tight ${
                submission.isPassed ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {submission.percentage}%
            </span>
          </div>

          {/* Result Status Badge */}
          <div className="mt-2">
            <span
              className={`inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-bold ${
                submission.isPassed
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {submission.isPassed
                ? 'ជាប់ស្ថាពរ (PASSED) 🎉'
                : `មិនទាន់ជាប់ (ត្រូវការ ${config.passPercentage}%)`}
            </span>
          </div>

          {/* If Made it to Top 5 */}
          {isTop5 && (
            <div className="mt-5 w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center gap-3 animate-pulse">
              <Trophy className="w-6 h-6 text-amber-400 fill-amber-400" />
              <div className="text-left">
                <p className="text-xs uppercase font-extrabold tracking-wider text-amber-300">
                  អបអរសាទរ! អ្នកជាប់ចំណាត់ថ្នាក់
                </p>
                <p className="text-base font-black text-white">
                  TOP {submission.rank} ក្នុងចំណោមសិក្ខាកាមទាំងអស់ 🏆
                </p>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="mt-6 w-full grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-[11px] text-slate-400 font-medium">ពិន្ទុជាក់ស្តែង</span>
              <p className="text-lg font-black text-white mt-0.5">
                {submission.score} / {submission.maxScore}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> រយៈពេលធ្វើ
              </span>
              <p className="text-lg font-black text-white mt-0.5">
                {formatDuration(submission.durationSeconds)}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" /> ចំណាត់ថ្នាក់
              </span>
              <p className="text-lg font-black text-amber-300 mt-0.5">
                {submission.rank ? `លេខ #${submission.rank}` : '--'}
              </p>
            </div>
          </div>

          {/* Module / Topic Performance Breakdown */}
          {submission.moduleScores && submission.moduleScores.length > 0 && (
            <div className="mt-5 w-full text-left">
              <span className="text-xs font-bold text-slate-300 block mb-2">
                📊 លទ្ធផលតាមវគ្គ / ប្រធានបទនីមួយៗ (Competency by Module)៖
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {submission.moduleScores.map((ms) => (
                  <div
                    key={ms.moduleId}
                    className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between"
                  >
                    <div className="truncate mr-2">
                      <p className="font-bold text-white text-xs truncate">
                        {ms.moduleName}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        ពិន្ទុ៖ {ms.earned} / {ms.total}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-black flex-shrink-0 ${
                        ms.percentage >= (config.passPercentage || 60)
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {ms.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 w-full flex flex-col sm:flex-row items-center gap-3">
            {onViewLeaderboard && (
              <button
                onClick={onViewLeaderboard}
                className="w-full flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition"
              >
                <Trophy className="w-4 h-4 fill-slate-950" />
                <span>មើលតារាងកិត្តិយស TOP 1 - 5</span>
              </button>
            )}

            <button
              onClick={handlePrintCertificate}
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition"
            >
              <Printer className="w-4 h-4" />
              <span>បោះពុម្ពវិញ្ញាបនបត្រ</span>
            </button>

            {onRetake && (
              <button
                onClick={onRetake}
                className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold border border-slate-700 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>ប្រឡងឡើងវិញ</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Trainee Certificate (Printable Component) */}
      <div
        ref={certificateRef}
        className="mt-8 bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden print:m-0 print:border-black print:text-black print:bg-white"
      >
        {/* Certificate inner decorative border */}
        <div className="border border-amber-500/30 rounded-2xl p-6 sm:p-8 text-center relative">
          <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest mb-1">
            <Sparkles className="w-4 h-4" /> វិញ្ញាបនបត្របញ្ជាក់សមត្ថភាព (CERTIFICATE OF ASSESSMENT) <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
            ប្រព័ន្ធវាយតម្លៃ និងតេស្តសមត្ថភាពសិក្ខាកាម
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Khmer Competency Assessment System</p>

          <p className="mt-6 text-xs text-slate-300">បញ្ជាក់ថា សិក្ខាកាមឈ្មោះ</p>
          <h4 className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">
            {submission.studentName}
          </h4>

          <p className="mt-3 text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
            បានឆ្លងកាត់ការធ្វើតេស្តសាកល្បងសមត្ថភាពលើវិញ្ញាសា{' '}
            <span className="text-white font-bold">«{config.title}»</span> ដោយទទួលបានលទ្ធផលពិន្ទុ{' '}
            <span className="text-emerald-400 font-black">{submission.percentage}%</span> (
            {submission.isPassed ? 'ជាប់ស្ថាពរ' : 'បញ្ចប់ការតេស្ត'}) ក្នុងចំណាត់ថ្នាក់{' '}
            <span className="text-amber-300 font-black">
              {submission.rank ? `លេខ #${submission.rank}` : 'កម្រិតល្អ'}
            </span>
            ។
          </p>

          <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-left text-xs text-slate-400">
            <div>
              <p className="text-[10px] uppercase text-slate-500">កាលបរិច្ឆេទ</p>
              <p className="font-semibold text-slate-300">
                {new Date(submission.submittedAt).toLocaleDateString('km-KH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase text-slate-500">លេខកូដផ្ទៀងផ្ទាត់</p>
              <p className="font-mono text-slate-300 font-semibold">{submission.id.slice(0, 10).toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Answer Review Section */}
      {submission.details && submission.details.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">ត្រួតពិនិត្យចម្លើយលម្អិត និងការពន្យល់</h3>
          </div>

          <div className="space-y-4">
            {submission.details.map((detail, idx) => (
              <div
                key={detail.questionId || idx}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  detail.isCorrect
                    ? 'bg-emerald-950/20 border-emerald-900/60'
                    : 'bg-rose-950/20 border-rose-900/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center border border-slate-700">
                      {idx + 1}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        detail.isCorrect
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {detail.isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> ត្រឹមត្រូវ
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> មិនត្រឹមត្រូវ
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <p className="font-bold text-white text-sm sm:text-base mt-2.5">
                  {detail.prompt}
                </p>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block mb-0.5 font-medium">
                      ចម្លើយដែលអ្នកបានជ្រើសរើស៖
                    </span>
                    <span
                      className={`font-semibold ${
                        detail.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {detail.selectedOptionText || '(មិនបានឆ្លើយ)'}
                    </span>
                  </div>

                  {!detail.isCorrect && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
                      <span className="text-emerald-400/80 block mb-0.5 font-medium">
                        ចម្លើយត្រឹមត្រូវគឺ៖
                      </span>
                      <span className="font-semibold text-emerald-300">
                        {detail.correctOptionText}
                      </span>
                    </div>
                  )}
                </div>

                {detail.explanation && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                    <span className="font-semibold text-amber-400">💡 ការពន្យល់៖ </span>
                    {detail.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
