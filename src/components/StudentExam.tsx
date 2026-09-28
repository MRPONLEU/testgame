import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  HelpCircle,
  Volume2,
  VolumeX,
  Shuffle,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { RoomData, ShuffledQuestion, StudentSubmission } from '../types';
import { prepareStudentQuestions, KHMER_LABELS } from '../utils/shuffle';
import { sound } from '../utils/audio';
import { addSubmissionToRoom, registerStudentToRoom } from '../utils/storage';
import { ResultScreen } from './ResultScreen';

interface StudentExamProps {
  room: RoomData;
  initialStudentName?: string;
  onViewLeaderboard?: () => void;
  onExit?: () => void;
}

export const StudentExam: React.FC<StudentExamProps> = ({
  room,
  initialStudentName = '',
  onViewLeaderboard,
  onExit,
}) => {
  const [studentName, setStudentName] = useState(initialStudentName);
  const [studentId, setStudentId] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // question originalId -> selectedOptionId
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(room.config.durationMinutes * 60);
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [submissionResult, setSubmissionResult] = useState<StudentSubmission | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [nameError, setNameError] = useState('');

  const startTimeRef = useRef<number>(Date.now());
  const totalDurationSeconds = room.config.durationMinutes * 60;

  // Find active module by matching ID or Code
  const activeModule = useMemo(() => {
    const selectedMod = room.config.selectedModuleId;
    if (!selectedMod || selectedMod === 'all') return null;
    return (
      room.modules?.find(
        (m) =>
          m.id.toLowerCase() === selectedMod.toLowerCase() ||
          m.code.toLowerCase() === selectedMod.toLowerCase()
      ) || null
    );
  }, [room.modules, room.config.selectedModuleId]);

  // Filter questions strictly if a specific module is selected
  const activeQuestions = useMemo(() => {
    if (!activeModule) return room.questions;
    const modIdLower = activeModule.id.toLowerCase();
    const modCodeLower = activeModule.code.toLowerCase();

    const matched = room.questions.filter((q) => {
      const qMod = q.moduleId?.toLowerCase();
      if (qMod === modIdLower || qMod === modCodeLower) return true;
      if (
        modCodeLower === 'mod-03' &&
        (qMod === 'mod_it_3' || qMod === 'mod-03' || qMod === 'mod_3' || qMod === '3')
      )
        return true;
      if (
        modCodeLower === 'mod-02' &&
        (qMod === 'mod_it_2' || qMod === 'mod-02' || qMod === 'mod_2' || qMod === '2')
      )
        return true;
      if (
        modCodeLower === 'mod-01' &&
        (qMod === 'mod_it_1' || qMod === 'mod-01' || qMod === 'mod_1' || qMod === '1')
      )
        return true;
      if (q.category) {
        const cat = q.category.toLowerCase();
        if (cat.includes(activeModule.name.toLowerCase()) || activeModule.name.toLowerCase().includes(cat))
          return true;
      }
      return false;
    });

    return matched.length > 0 ? matched : room.questions;
  }, [room.questions, activeModule]);

  // Prepare shuffled questions once when starting the exam
  const shuffledQuestions: ShuffledQuestion[] = useMemo(() => {
    return prepareStudentQuestions(
      activeQuestions,
      room.config.shuffleQuestions,
      room.config.shuffleOptions
    );
  }, [activeQuestions, room.config.shuffleQuestions, room.config.shuffleOptions]);

  // Countdown timer logic
  useEffect(() => {
    if (!hasStarted || submissionResult) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        if (prev === 60 || prev === 30 || prev === 10) {
          sound.playWarning();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, submissionResult]);

  const handleStartExam = () => {
    if (!studentName.trim()) {
      setNameError('សូមបញ្ចូលឈ្មោះរបស់អ្នកដើម្បីចាប់ផ្តើម');
      return;
    }
    sound.playSelect();
    registerStudentToRoom(room.config.id, {
      name: studentName,
      studentId,
      moduleId: activeModule?.id,
    });
    startTimeRef.current = Date.now();
    setTimeLeftSeconds(room.config.durationMinutes * 60);
    setHasStarted(true);
  };

  const handleSelectOption = (optionId: string) => {
    const currentQ = shuffledQuestions[currentIndex];
    sound.playSelect();
    setAnswers((prev) => ({
      ...prev,
      [currentQ.originalId]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentIndex < shuffledQuestions.length - 1) {
      sound.playClick();
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      sound.playClick();
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const calculateEvaluation = () => {
    const elapsedSeconds = Math.max(
      1,
      Math.min(
        totalDurationSeconds,
        Math.round((Date.now() - startTimeRef.current) / 1000)
      )
    );

    let totalPoints = 0;
    let earnedPoints = 0;

    const details = shuffledQuestions.map((sq) => {
      totalPoints += sq.points;
      const selectedId = answers[sq.originalId];
      const isCorrect = selectedId === sq.originalCorrectOptionId;
      if (isCorrect) earnedPoints += sq.points;

      const selectedOpt = sq.options.find((o) => o.id === selectedId);
      const correctOpt = sq.options.find((o) => o.id === sq.originalCorrectOptionId);

      return {
        questionId: sq.originalId,
        prompt: sq.prompt,
        selectedOptionText: selectedOpt ? selectedOpt.text : '',
        correctOptionText: correctOpt ? correctOpt.text : '',
        isCorrect,
        explanation: sq.explanation,
        moduleId: sq.moduleId,
      };
    });

    // Calculate module scores breakdown
    const moduleMap: Record<string, { earned: number; total: number }> = {};
    shuffledQuestions.forEach((sq) => {
      const mId = sq.moduleId || 'general';
      if (!moduleMap[mId]) moduleMap[mId] = { earned: 0, total: 0 };
      moduleMap[mId].total += sq.points;
      if (answers[sq.originalId] === sq.originalCorrectOptionId) {
        moduleMap[mId].earned += sq.points;
      }
    });

    const moduleScores = Object.entries(moduleMap).map(([mId, data]) => {
      const matchedMod = room.modules?.find((m) => m.id === mId);
      const name = matchedMod ? `${matchedMod.code}: ${matchedMod.name}` : 'សំណួរទូទៅ';
      return {
        moduleId: mId,
        moduleName: name,
        earned: data.earned,
        total: data.total,
        percentage: data.total > 0 ? Math.round((data.earned / data.total) * 100) : 0,
      };
    });

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const isPassed = percentage >= room.config.passPercentage;

    const submission: StudentSubmission = {
      id: 'sub_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      roomId: room.config.id,
      studentName: studentName.trim(),
      studentId: studentId.trim() || undefined,
      startedAt: startTimeRef.current,
      submittedAt: Date.now(),
      durationSeconds: elapsedSeconds,
      answers,
      score: earnedPoints,
      maxScore: totalPoints,
      percentage,
      isPassed,
      moduleScores,
      details,
    };

    // Save and rank
    const updatedRoom = addSubmissionToRoom(room.config.id, submission);
    const updatedSub = updatedRoom?.submissions.find((s) => s.id === submission.id);

    if (percentage >= 70) {
      sound.playSuccess();
    } else {
      sound.playSubmit();
    }

    setSubmissionResult(updatedSub || submission);
  };

  const handleAutoSubmit = () => {
    sound.playWarning();
    calculateEvaluation();
  };

  const handleManualSubmit = () => {
    setShowConfirmModal(false);
    calculateEvaluation();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = shuffledQuestions.length;
  const isTimeCritical = timeLeftSeconds <= 60;

  // If exam already completed, show immediate results screen
  if (submissionResult) {
    return (
      <ResultScreen
        submission={submissionResult}
        config={room.config}
        onRetake={() => {
          setSubmissionResult(null);
          setAnswers({});
          setCurrentIndex(0);
          setHasStarted(false);
        }}
        onViewLeaderboard={onViewLeaderboard}
      />
    );
  }

  // Step 1: Pre-Exam Registration / Instant Join
  if (!hasStarted) {
    return (
      <div className="w-full max-w-lg mx-auto py-8 px-4 animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20 mb-3">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">ចូលរួមប្រឡងតេស្តសមត្ថភាព</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">{room.config.title}</p>
          </div>

          {/* Specific Module Alert Banner */}
          {activeModule && (
            <div className="mb-5 p-3.5 rounded-2xl bg-cyan-950/40 border-2 border-cyan-500/50 flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center flex-shrink-0 shadow">
                {activeModule.code}
              </div>
              <div className="truncate">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block">
                  🎯 វគ្គដែលត្រូវប្រឡង (Active Module)
                </span>
                <h3 className="font-bold text-white text-xs sm:text-sm truncate">
                  {activeModule.name}
                </h3>
                <p className="text-[11px] text-cyan-200 mt-0.5">
                  អ្នកនឹងឆ្លើយសំណួរជាក់លាក់សម្រាប់វគ្គនេះ ({totalQuestions} សំណួរ)
                </p>
              </div>
            </div>
          )}

          {/* Exam Details Badges */}
          <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 mb-6 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>
                រយៈពេល៖ <b>{room.config.durationMinutes} នាទី</b>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>
                ចំនួនសំណួរ៖ <b>{totalQuestions} សំណួរ</b>
              </span>
            </div>
            <div className="flex items-center gap-2 col-span-2 text-[11px] text-emerald-400 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
              <Shuffle className="w-4 h-4 flex-shrink-0" />
              <span>ប្រព័ន្ធសាប់សំណួរ និងជម្រើសចម្លើយដោយស្វ័យប្រវត្តិដើម្បីធានាតម្លាភាព</span>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                គោត្តនាម និងនាម (ឈ្មោះពេញ) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  if (nameError) setNameError('');
                }}
                placeholder="ឧ. សេង ពិសិដ្ឋ"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white placeholder-slate-500 text-sm outline-none transition"
              />
              {nameError && (
                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {nameError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                អត្តលេខសិស្ស ឬថ្នាក់រៀន (ជាជម្រើស)
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="ឧ. IT-01 ឬ STU-2026"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 text-white placeholder-slate-500 text-sm outline-none transition"
              />
            </div>

            {totalQuestions === 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center">
                ⚠️ វគ្គនេះមិនទាន់មានសំណួរនៅឡើយទេ។ សូមទំនាក់ទំនងលោកគ្រូ/អ្នកគ្រូដើម្បីបន្ថែមសំណួរ!
              </div>
            ) : (
              <button
                onClick={handleStartExam}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-base shadow-xl shadow-amber-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <span>ចាប់ផ្តើមប្រឡងភ្លាមៗ</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {onExit && (
              <button
                onClick={onExit}
                className="w-full py-2.5 text-center text-xs text-slate-400 hover:text-slate-200 transition"
              >
                ត្រឡប់ទៅទំព័រដើមវិញ
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Live Active Exam
  const currentQuestion = shuffledQuestions[currentIndex];
  const currentSelectedId = currentQuestion ? answers[currentQuestion.originalId] : undefined;

  return (
    <div className="w-full max-w-3xl mx-auto py-4 px-3 sm:px-4">
      {/* Top Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Trainee Info & Question Counter */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/30">
            {currentIndex + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              {activeModule && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {activeModule.code}
                </span>
              )}
              <span className="text-xs font-semibold text-slate-400">សំណួរ</span>
              <span className="text-sm font-black text-white">
                {currentIndex + 1} / {totalQuestions}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                ឆ្លើយបាន {answeredCount}/{totalQuestions}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium truncate max-w-xs">{studentName}</p>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-black text-sm sm:text-base tracking-wider transition-colors ${
              isTimeCritical
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-amber-400'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-400' : 'text-amber-400'}`} />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const muted = sound.toggleMute();
              setIsMuted(muted);
            }}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
            title={isMuted ? 'បើកសំឡេង' : 'បិទសំឡេង'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-5">
        <div
          className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative">
          {/* Question Tag */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              ពិន្ទុ {currentQuestion.points}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Shuffle className="w-3 h-3 text-slate-500" /> ចម្លើយសាប់ដោយស្វ័យប្រវត្តិ
            </span>
          </div>

          {/* Prompt */}
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white leading-relaxed mb-6">
            {currentQuestion.prompt}
          </h2>

          {/* Shuffled Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, optIdx) => {
              const isSelected = currentSelectedId === option.id;
              const label = KHMER_LABELS[optIdx] || String(optIdx + 1);

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 group cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-slate-800/70 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600 text-slate-200'
                  }`}
                >
                  <span
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 shadow'
                        : 'bg-slate-700 text-slate-300 group-hover:bg-slate-600'
                    }`}
                  >
                    {label}
                  </span>
                  <span className="text-xs sm:text-sm md:text-base font-medium flex-1 pt-0.5 leading-relaxed">
                    {option.text}
                  </span>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 self-center" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Navigation */}
          <div className="mt-8 pt-5 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                currentIndex === 0
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>ថយក្រោយ</span>
            </button>

            {currentIndex === totalQuestions - 1 ? (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition"
              >
                <Send className="w-4 h-4" />
                <span>បញ្ជូនចម្លើយឥឡូវ</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition"
              >
                <span>បន្ទាប់</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Jump Grid */}
      <div className="mt-5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <p className="text-xs text-slate-400 mb-2 font-medium">ផ្លោះទៅសំណួរ៖</p>
        <div className="flex flex-wrap gap-2">
          {shuffledQuestions.map((q, idx) => {
            const isAnswered = Boolean(answers[q.originalId]);
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.originalId}
                onClick={() => {
                  sound.playClick();
                  setCurrentIndex(idx);
                }}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                  isCurrent
                    ? 'ring-2 ring-amber-400 bg-amber-400 text-slate-950 font-black'
                    : isAnswered
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700/60 hover:text-white'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">តើអ្នកពិតជាចង់បញ្ជូនចម្លើយមែនទេ?</h3>
            <p className="text-xs text-slate-400 mt-2">
              អ្នកបានឆ្លើយចំនួន <b className="text-white">{answeredCount}</b> ក្នុងចំណោម{' '}
              <b className="text-white">{totalQuestions}</b> សំណួរ។
              {answeredCount < totalQuestions && (
                <span className="block text-rose-400 mt-1 font-semibold">
                  (នៅសល់ {totalQuestions - answeredCount} សំណួរមិនទាន់ឆ្លើយ)
                </span>
              )}
            </p>

            <div className="mt-6 flex items-center gap-2.5">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
              >
                បន្តធ្វើទៀត
              </button>
              <button
                onClick={handleManualSubmit}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition"
              >
                បញ្ជូនចម្លើយ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
