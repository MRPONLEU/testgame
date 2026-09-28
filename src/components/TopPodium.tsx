import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Medal, Award, Clock, Star, Flame, Sparkles } from 'lucide-react';
import { StudentSubmission } from '../types';

interface TopPodiumProps {
  submissions: StudentSubmission[];
  onTriggerConfetti?: () => void;
}

export const TopPodium: React.FC<TopPodiumProps> = ({ submissions }) => {
  // Sort submissions: score desc, time asc
  const sorted = [...submissions].sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    return a.durationSeconds - b.durationSeconds;
  });

  const top1 = sorted[0];
  const top2 = sorted[1];
  const top3 = sorted[2];
  const top4 = sorted[3];
  const top5 = sorted[4];

  // Fire celebratory confetti when top 1 exists
  useEffect(() => {
    if (top1 && top1.percentage >= 70) {
      try {
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'],
        });
      } catch {
        // Ignore confetti if not supported
      }
    }
  }, [top1?.id, top1?.percentage]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}វិ`;
    return `${mins}នាទី ${secs}វិ`;
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-7 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 relative z-10 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Trophy className="w-6 h-6 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-wide">
                តារាងកិត្តិយស TOP 1 ដល់ TOP 5
              </h2>
              <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Flame className="w-3 h-3 fill-amber-400" /> ពិន្ទុ & ល្បឿន
              </span>
            </div>
            <p className="text-xs text-slate-400">
              ចំណាត់ថ្នាក់សិក្ខាកាមឆ្នើមដែលមានពិន្ទុខ្ពស់ជាងគេ និងបញ្ចប់លឿនជាងគេ
            </p>
          </div>
        </div>

        {top1 && (
          <button
            onClick={() => {
              confetti({
                particleCount: 80,
                spread: 100,
                origin: { y: 0.6 },
              });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" /> អបអរសាទរ (Confetti)
          </button>
        )}
      </div>

      {/* Main Top 1 - 3 Podium Section */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 items-end pt-4 pb-2 max-w-2xl mx-auto relative z-10">
        {/* Top 2: Silver (Left) */}
        <div className="flex flex-col items-center">
          <div className="w-full flex flex-col items-center mb-2">
            <div className="relative">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-slate-200 to-slate-400 text-slate-900 font-black text-base sm:text-lg flex items-center justify-center shadow-lg border-2 border-white/40">
                {top2 ? top2.studentName.slice(0, 2) : '2'}
              </div>
              <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-slate-300 text-slate-900 text-xs font-extrabold flex items-center justify-center border border-white shadow">
                2
              </div>
            </div>
            <div className="mt-2 text-center w-full px-1">
              <p className="font-bold text-xs sm:text-sm text-slate-200 truncate max-w-full">
                {top2 ? top2.studentName : 'រង់ចាំ...'}
              </p>
              {top2 ? (
                <div className="mt-0.5">
                  <span className="text-xs sm:text-sm font-black text-slate-300">
                    {top2.percentage}%
                  </span>
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                    <Clock className="w-2.5 h-2.5" /> {formatDuration(top2.durationSeconds)}
                  </div>
                </div>
              ) : (
                <span className="text-[10px] text-slate-600">-</span>
              )}
            </div>
          </div>
          {/* Podium Pillar */}
          <div className="w-full h-24 sm:h-28 rounded-t-2xl bg-gradient-to-t from-slate-800 to-slate-700/80 border-t-2 border-slate-400 flex flex-col items-center justify-center shadow-inner">
            <Medal className="w-6 h-6 text-slate-300 mb-1" />
            <span className="text-xs font-black tracking-widest text-slate-300">TOP 2</span>
          </div>
        </div>

        {/* Top 1: Gold Champion (Center - Tallest) */}
        <div className="flex flex-col items-center -mt-6">
          <div className="w-full flex flex-col items-center mb-2">
            <div className="relative">
              {/* Crown / Trophy icon */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-400 animate-bounce">
                👑
              </div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-black text-lg sm:text-xl flex items-center justify-center shadow-xl shadow-amber-500/30 border-4 border-amber-200">
                {top1 ? top1.studentName.slice(0, 2) : '1'}
              </div>
              <div className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center border-2 border-white shadow-md">
                1
              </div>
            </div>
            <div className="mt-2 text-center w-full px-1">
              <p className="font-extrabold text-sm sm:text-base text-amber-300 truncate max-w-full">
                {top1 ? top1.studentName : 'រង់ចាំ...'}
              </p>
              {top1 ? (
                <div className="mt-0.5">
                  <span className="text-sm sm:text-base font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                    {top1.percentage}%
                  </span>
                  <div className="flex items-center justify-center gap-1 text-[11px] text-amber-400/90 font-medium mt-1">
                    <Clock className="w-3 h-3" /> {formatDuration(top1.durationSeconds)}
                  </div>
                </div>
              ) : (
                <span className="text-[10px] text-slate-600">-</span>
              )}
            </div>
          </div>
          {/* Podium Pillar */}
          <div className="w-full h-32 sm:h-36 rounded-t-2xl bg-gradient-to-t from-amber-600/30 via-slate-800 to-slate-700 border-t-4 border-amber-400 flex flex-col items-center justify-center shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-amber-400/5 animate-pulse" />
            <Trophy className="w-8 h-8 text-amber-400 mb-1 relative z-10 fill-amber-400/30" />
            <span className="text-xs sm:text-sm font-black tracking-widest text-amber-400 relative z-10">
              ជើងឯក TOP 1
            </span>
          </div>
        </div>

        {/* Top 3: Bronze (Right) */}
        <div className="flex flex-col items-center">
          <div className="w-full flex flex-col items-center mb-2">
            <div className="relative">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-amber-600 to-amber-800 text-white font-black text-base sm:text-lg flex items-center justify-center shadow-lg border-2 border-amber-500/40">
                {top3 ? top3.studentName.slice(0, 2) : '3'}
              </div>
              <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white text-xs font-extrabold flex items-center justify-center border border-white shadow">
                3
              </div>
            </div>
            <div className="mt-2 text-center w-full px-1">
              <p className="font-bold text-xs sm:text-sm text-slate-200 truncate max-w-full">
                {top3 ? top3.studentName : 'រង់ចាំ...'}
              </p>
              {top3 ? (
                <div className="mt-0.5">
                  <span className="text-xs sm:text-sm font-black text-amber-500">
                    {top3.percentage}%
                  </span>
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                    <Clock className="w-2.5 h-2.5" /> {formatDuration(top3.durationSeconds)}
                  </div>
                </div>
              ) : (
                <span className="text-[10px] text-slate-600">-</span>
              )}
            </div>
          </div>
          {/* Podium Pillar */}
          <div className="w-full h-20 sm:h-24 rounded-t-2xl bg-gradient-to-t from-slate-800 to-slate-700/80 border-t-2 border-amber-600 flex flex-col items-center justify-center shadow-inner">
            <Award className="w-5 h-5 text-amber-600 mb-1" />
            <span className="text-xs font-black tracking-widest text-amber-500">TOP 3</span>
          </div>
        </div>
      </div>

      {/* Top 4 and Top 5 Row */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10 border-t border-slate-800 pt-4">
        {/* Top 4 */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/70 hover:border-slate-600 transition">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 font-extrabold text-sm flex items-center justify-center border border-blue-500/30">
              #4
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white">
                  {top4 ? top4.studentName : 'រង់ចាំសិក្ខាកាម...'}
                </span>
                <span className="text-[10px] font-semibold text-blue-400 px-1.5 py-0.2 rounded bg-blue-500/10">
                  TOP 4
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                {top4 ? formatDuration(top4.durationSeconds) : '--'}
              </p>
            </div>
          </div>
          <div className="text-right">
            {top4 ? (
              <span className="text-base font-black text-blue-300">{top4.percentage}%</span>
            ) : (
              <Star className="w-4 h-4 text-slate-600" />
            )}
          </div>
        </div>

        {/* Top 5 */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/70 hover:border-slate-600 transition">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 font-extrabold text-sm flex items-center justify-center border border-indigo-500/30">
              #5
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white">
                  {top5 ? top5.studentName : 'រង់ចាំសិក្ខាកាម...'}
                </span>
                <span className="text-[10px] font-semibold text-indigo-400 px-1.5 py-0.2 rounded bg-indigo-500/10">
                  TOP 5
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                {top5 ? formatDuration(top5.durationSeconds) : '--'}
              </p>
            </div>
          </div>
          <div className="text-right">
            {top5 ? (
              <span className="text-base font-black text-indigo-300">{top5.percentage}%</span>
            ) : (
              <Star className="w-4 h-4 text-slate-600" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
