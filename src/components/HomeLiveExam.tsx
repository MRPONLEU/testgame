import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  Play,
  RotateCcw,
  Users,
  QrCode,
  Sparkles,
  Layers,
  ChevronDown,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  ExternalLink,
  Flame,
  Pause,
  Trophy,
  CheckCircle2,
  Hourglass,
  Plus,
} from 'lucide-react';
import { RoomData, ExamModule, Question } from '../types';
import {
  saveRoom,
  simulateDemoRegistrations,
  clearRegisteredStudents,
  simulateDemoTrainees,
} from '../utils/storage';
import { sound } from '../utils/audio';
import { HonorRollModal } from './HonorRollModal';

interface HomeLiveExamProps {
  room: RoomData;
  onUpdateRoom: (room: RoomData) => void;
  onOpenStudentView: () => void;
  onOpenQRModal: (moduleId?: string) => void;
  onViewAllScores: () => void;
  onViewLeaderboardTab: () => void;
  onExamRunningChange?: (running: boolean) => void;
}

export const HomeLiveExam: React.FC<HomeLiveExamProps> = ({
  room,
  onUpdateRoom,
  onOpenStudentView,
  onViewAllScores,
  onExamRunningChange,
}) => {
  // Dropdown topic selection
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    room.config.selectedModuleId || 'all'
  );

  // Full Screen Mode state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live Exam Status: 'setup' (Pre-exam QR & register) | 'running' (ផ្ទាំងទទេ មាននាទីរាប់ថយក្រោយ) | 'ended'
  const [examStatus, setExamStatus] = useState<'setup' | 'running' | 'ended'>('setup');
  const [isPaused, setIsPaused] = useState(false);

  // Duration & Countdown (in seconds)
  const initialDurationMinutes = room.config.durationMinutes || 10;
  const [totalSeconds, setTotalSeconds] = useState(initialDurationMinutes * 60);
  const [secondsLeft, setSecondsLeft] = useState(initialDurationMinutes * 60);

  // Pop-up form state for Honor Roll
  const [showHonorRollModal, setShowHonorRollModal] = useState(false);

  // QR Code data URL
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync fullscreen state with native browser fullscreen API
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleFullscreen = () => {
    sound.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Find active module based on selectedTopicId
  const activeModule: ExamModule | null = useMemo(() => {
    if (!selectedTopicId || selectedTopicId === 'all') return null;
    return (
      room.modules?.find(
        (m) =>
          m.id.toLowerCase() === selectedTopicId.toLowerCase() ||
          m.code.toLowerCase() === selectedTopicId.toLowerCase()
      ) || null
    );
  }, [room.modules, selectedTopicId]);

  // Robust questions matching for selected topic (maps MOD-01, MOD-02, MOD-03, mod_it_1/2/3, categories)
  const topicQuestions: Question[] = useMemo(() => {
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
        if (
          modCodeLower === 'mod-03' &&
          (cat.includes('ការិយាល័យ') || cat.includes('cloud') || cat.includes('excel') || cat.includes('office') || cat.includes('drive'))
        )
          return true;
        if (
          modCodeLower === 'mod-02' &&
          (cat.includes('សន្តិសុខ') || cat.includes('cyber') || cat.includes('security'))
        )
          return true;
        if (
          modCodeLower === 'mod-01' &&
          (cat.includes('ai') || cat.includes('it') || cat.includes('បញ្ញាសិប្បនិម្មិត'))
        )
          return true;
      }
      return false;
    });

    return matched.length > 0 ? matched : room.questions;
  }, [room.questions, activeModule]);

  // Registered students matching this room/topic
  const registeredStudents = useMemo(() => {
    return room.registeredStudents || [];
  }, [room.registeredStudents]);

  // Submissions submitted for this module / room
  const moduleSubmissions = useMemo(() => {
    if (!activeModule) return room.submissions;
    return room.submissions.filter((s) => {
      if (!s.moduleScores || s.moduleScores.length === 0) return true;
      return s.moduleScores.some((ms) => ms.moduleId === activeModule.id);
    });
  }, [room.submissions, activeModule]);

  // Construct dynamic QR code URL
  const currentOrigin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://khmerquiz-pro.local';

  const joinUrl = useMemo(() => {
    const modParam =
      selectedTopicId && selectedTopicId !== 'all'
        ? `&module=${encodeURIComponent(selectedTopicId)}`
        : '';
    return `${currentOrigin}/?room=${room.config.id}${modParam}`;
  }, [currentOrigin, room.config.id, selectedTopicId]);

  // Generate QR Code dynamically whenever joinUrl changes
  useEffect(() => {
    QRCode.toDataURL(joinUrl, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [joinUrl]);

  // Update room config when selected topic changes
  const handleSelectTopic = (topicId: string) => {
    setSelectedTopicId(topicId);
    const updated = {
      ...room,
      config: {
        ...room.config,
        selectedModuleId: topicId,
      },
    };
    saveRoom(updated);
    onUpdateRoom(updated);
    sound.playSelect();
  };

  // Quick adjust duration
  const handleSetDuration = (minutes: number) => {
    const updated = {
      ...room,
      config: {
        ...room.config,
        durationMinutes: minutes,
      },
    };
    saveRoom(updated);
    onUpdateRoom(updated);
    setTotalSeconds(minutes * 60);
    setSecondsLeft(minutes * 60);
    sound.playClick();
  };

  // Start Exam (ចុចចាប់ផ្ដើម)
  const handleStartExam = () => {
    sound.playSelect();
    const duration = (room.config.durationMinutes || 10) * 60;
    setTotalSeconds(duration);
    setSecondsLeft(duration);
    setIsPaused(false);
    setExamStatus('running');
    onExamRunningChange?.(true);
  };

  // Add 1 minute to running timer
  const handleAddMinute = () => {
    sound.playClick();
    setSecondsLeft((prev) => prev + 60);
    setTotalSeconds((prev) => prev + 60);
  };

  // Pause / Resume
  const handleTogglePause = () => {
    sound.playClick();
    setIsPaused((prev) => !prev);
  };

  // End Exam Early
  const handleEndExamEarly = () => {
    sound.playGong();
    setExamStatus('ended');
    setSecondsLeft(0);
    setShowHonorRollModal(true);
  };

  // Reset / Start New Session
  const handleResetSession = () => {
    sound.playClick();
    setExamStatus('setup');
    const dur = (room.config.durationMinutes || 10) * 60;
    setSecondsLeft(dur);
    setTotalSeconds(dur);
    setIsPaused(false);
    setShowHonorRollModal(false);
    onExamRunningChange?.(false);
  };

  // Countdown timer effect
  useEffect(() => {
    if (examStatus !== 'running' || isPaused) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        // Tension tick on last 10 seconds
        if (prev <= 10 && prev > 0) {
          sound.playTick();
        }

        // When time expires (អស់នាទី)
        if (prev <= 1) {
          clearInterval(interval);
          setExamStatus('ended');
          setShowHonorRollModal(true); // បង្ហាញ តារាងកិត្តយសតែម្ដងជា Pop up form
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [examStatus, isPaused]);

  // Copy Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    sound.playSelect();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Simulate registrations for live demo
  const handleSimulateStudents = () => {
    sound.playSuccess();
    const updated = simulateDemoRegistrations(room.config.id);
    if (updated) onUpdateRoom(updated);
  };

  // Simulate exam submissions during live test
  const handleSimulateSubmissions = () => {
    sound.playSuccess();
    const updated = simulateDemoTrainees(room.config.id);
    if (updated) onUpdateRoom(updated);
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  // Circular progress calculation
  const progressPercent =
    totalSeconds > 0 ? Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100)) : 0;
  const strokeDashoffset = 440 - (440 * progressPercent) / 100;

  // Active module display title
  const displayTopicTitle = activeModule
    ? `${activeModule.code}: ${activeModule.name}`
    : 'គ្រប់ប្រធានបទទាំងអស់ (All Questions)';

  // =========================================================================
  // VIEW MODE 2: ផ្ទាំងទទេ បង្ហាញតែនាទីរាប់ថយក្រោយ (Pure Fullscreen Countdown Timer Stage)
  // =========================================================================
  if (examStatus === 'running' || examStatus === 'ended') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 w-screen h-screen flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden font-['Kantumruy_Pro',sans-serif]">
        {/* Subtle Ambient Background Lighting */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Top Header: Discreet back & fullscreen buttons */}
        <div className="w-full flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            {activeModule && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-900/90 text-slate-400 border border-slate-800 backdrop-blur-md">
                {activeModule.code}: {activeModule.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFullscreen}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
              title="ពេញអេក្រង់"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleResetSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-semibold border border-slate-800 transition cursor-pointer"
              title="ត្រឡប់ទៅទំព័រដើម"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ត្រឡប់វិញ</span>
            </button>
          </div>
        </div>

        {/* Central Display: PURE COUNTDOWN TIMER ONLY (បង្ហាញតែនាទី) */}
        <div className="relative z-10 flex flex-col items-center justify-center my-auto">
          {/* Giant Circular Clock */}
          <div className="relative flex items-center justify-center">
            <svg className="w-80 h-80 sm:w-96 sm:h-96 lg:w-[420px] lg:h-[420px] -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="70"
                className="stroke-slate-900/90"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                className={`transition-all duration-1000 ease-linear ${
                  secondsLeft <= 30
                    ? 'stroke-rose-500 drop-shadow-[0_0_25px_rgba(244,63,94,0.7)]'
                    : secondsLeft <= 60
                    ? 'stroke-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]'
                    : 'stroke-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                }`}
                strokeWidth="7"
                strokeDasharray="440"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Central Giant Digits */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={`text-7xl sm:text-8xl lg:text-9xl font-black font-mono tracking-tight transition-colors ${
                  secondsLeft <= 30
                    ? 'text-rose-400 animate-pulse drop-shadow-[0_0_20px_rgba(244,63,94,0.8)]'
                    : secondsLeft <= 60
                    ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                    : 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                }`}
              >
                {formatTime(secondsLeft)}
              </span>
              <span className="text-sm font-semibold text-slate-400 mt-2 tracking-widest uppercase">
                {secondsLeft === 0 ? 'អស់ម៉ោង' : 'នាទី : វិនាទី'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Minimal Controls Bar */}
        <div className="z-20 w-full flex items-center justify-center gap-3 py-2">
          {examStatus === 'running' && (
            <>
              <button
                onClick={handleTogglePause}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-800 shadow transition cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                <span>{isPaused ? 'បន្ត (Resume)' : 'ផ្អាក (Pause)'}</span>
              </button>

              <button
                onClick={handleAddMinute}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-800 shadow transition cursor-pointer"
                title="បន្ថែម ១ នាទី"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>+1 នាទី</span>
              </button>

              <button
                onClick={handleEndExamEarly}
                className="flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-rose-600/30 hover:bg-rose-600/40 text-rose-300 hover:text-white text-xs font-bold border border-rose-500/40 shadow transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>បញ្ចប់ភ្លាមៗ</span>
              </button>
            </>
          )}

          {examStatus === 'ended' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHonorRollModal(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition cursor-pointer"
              >
                <Trophy className="w-5 h-5 fill-slate-950" />
                <span>បើកមើលតារាងកិត្តិយស TOP 1-5</span>
              </button>

              <button
                onClick={handleResetSession}
                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>ត្រឡប់ទៅទំព័រដើម</span>
              </button>
            </div>
          )}
        </div>

        {/* Celebratory Pop-up Form for Honor Roll */}
        <HonorRollModal
          isOpen={showHonorRollModal}
          onClose={() => setShowHonorRollModal(false)}
          submissions={moduleSubmissions}
          activeModule={activeModule}
          examTitle={room.config.title}
          onRestartExam={handleResetSession}
          onViewAllScores={onViewAllScores}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 1: ទំព័រដើម (Setup Stage: Clean, Full Screen View - Exact layout requested!)
  // =========================================================================
  return (
    <div
      className={`font-['Kantumruy_Pro',sans-serif] ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 p-4 sm:p-6 lg:p-8 flex flex-col justify-between overflow-y-auto lg:overflow-hidden min-h-screen'
          : 'space-y-4'
      }`}
    >
      {/* Sleek Compact Top Bar: Topic Dropdown, PIN, Duration, & Fullscreen Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800/90 px-4 py-2.5 rounded-2xl shadow-lg backdrop-blur-md">
        {/* Left: Dropdown Box សម្រាប់ជ្រើសរើសប្រធានបទ */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-bold text-slate-300 hidden sm:inline whitespace-nowrap">
              ប្រធានបទ៖
            </span>
            <div className="relative flex-1 max-w-md">
              <select
                value={selectedTopicId}
                onChange={(e) => handleSelectTopic(e.target.value)}
                className="w-full appearance-none px-3.5 py-1.5 pr-8 rounded-xl bg-slate-800 border border-slate-700 hover:border-amber-400 focus:border-amber-400 text-white font-bold text-xs sm:text-sm outline-none transition cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">
                  🌐 គ្រប់ប្រធានបទទាំងអស់ ({room.questions.length} សំណួរ)
                </option>
                {room.modules &&
                  room.modules.map((mod) => {
                    const count = room.questions.filter((q) => {
                      const qm = q.moduleId?.toLowerCase();
                      const mid = mod.id.toLowerCase();
                      const mcode = mod.code.toLowerCase();
                      return (
                        qm === mid ||
                        qm === mcode ||
                        (mcode === 'mod-03' && (qm === 'mod_it_3' || qm === '3')) ||
                        (mcode === 'mod-02' && (qm === 'mod_it_2' || qm === '2')) ||
                        (mcode === 'mod-01' && (qm === 'mod_it_1' || qm === '1'))
                      );
                    }).length;
                    return (
                      <option key={mod.id} value={mod.id} className="bg-slate-900 text-white">
                        🎯 {mod.code}: {mod.name} ({count > 0 ? count : 3} សំណួរ)
                      </option>
                    );
                  })}
              </select>
              <ChevronDown className="w-4 h-4 text-amber-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Right: Quick Duration Presets & Full Screen Button */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Duration Selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700/80 text-xs">
            <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">ម៉ោង៖</span>
            {[3, 5, 10, 15].map((m) => (
              <button
                key={m}
                onClick={() => handleSetDuration(m)}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  room.config.durationMinutes === m
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m}ន
              </button>
            ))}
          </div>

          {/* Full Screen Toggle Button (Requested by User) */}
          <button
            onClick={handleToggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs border border-amber-500/40 shadow-sm transition active:scale-95 cursor-pointer"
            title="ពង្រីកពេញអេក្រង់សម្រាប់បញ្ចាំង Projector ឬទូរទស្សន៍"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>ចាកចេញពីពេញអេក្រង់ (Exit)</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>ពេញអេក្រង់ (Full Screen)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Left QR Code Card & Right Column (Exact Image Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-stretch">
        {/* Left Column (5 cols): Dynamic QR Code Card */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col items-center justify-between text-center relative overflow-hidden backdrop-blur-xl">
          {/* Header */}
          <div className="w-full flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white">
              <QrCode className="w-4 h-4 text-amber-400" /> QR Code សម្រាប់សិស្សស្កេន
            </span>
            {activeModule && (
              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {activeModule.code}
              </span>
            )}
          </div>

          {/* QR Image Frame */}
          <div className="p-3.5 bg-white rounded-3xl shadow-2xl shadow-black/70 my-auto">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="w-56 h-56 sm:w-64 sm:h-64 lg:w-68 lg:h-68 object-contain rounded-xl"
              />
            ) : (
              <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center text-slate-400">
                កំពុងបង្កើត QR Code...
              </div>
            )}
          </div>

          {/* Room PIN Code */}
          <div className="mt-3.5 w-full max-w-xs p-2 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center gap-2">
            <span className="text-xs text-slate-400">បន្ទប់ប្រឡង PIN៖</span>
            <span className="font-mono text-base font-black text-amber-400 tracking-wider">
              {room.config.code}
            </span>
          </div>

          {/* Action Link & Buttons */}
          <div className="w-full mt-3.5 flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">បានចម្លង Link!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>ចម្លង Link ចូលរួម</span>
                </>
              )}
            </button>

            <button
              onClick={handleToggleFullscreen}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
              title="ពង្រីកពេញអេក្រង់សម្រាប់បញ្ចាំង Projector"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Projector</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 mt-2.5">
            សិស្សប្រើកាមេរ៉ាទូរស័ព្ទស្កេន QR នេះ នឹងទទួលបានសំណួរតាមប្រធានបទនេះដោយស្វ័យប្រវត្តិ
          </p>
        </div>

        {/* Right Column (7 cols): Registered Students Lobby & Ready to Start Card */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-5">
          {/* Top Card: Registered Students Lobby */}
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl flex-1 flex flex-col backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    បញ្ជីសិស្សបានចុះឈ្មោះតាម QR Code
                  </h2>
                  <p className="text-xs text-slate-400">
                    សិស្សដែលបានស្កេន QR និងវាយបញ្ចូលឈ្មោះរួចរាល់
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-extrabold">
                  👥 {registeredStudents.length} នាក់
                </span>

                <button
                  onClick={handleSimulateStudents}
                  className="flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold border border-indigo-500/30 transition cursor-pointer"
                  title="សាកល្បងចុះឈ្មោះសិស្សគំរូ ៥ នាក់ភ្លាមៗ"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>សាកល្បង ៥ នាក់</span>
                </button>
              </div>
            </div>

            {/* List of Registered Student Chips */}
            <div className="flex-1 py-4 min-h-[160px] max-h-[260px] overflow-y-auto">
              {registeredStudents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {registeredStudents.map((st, idx) => (
                    <div
                      key={st.id || idx}
                      className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between animate-in fade-in duration-200"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                          {st.name.slice(0, 2)}
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-bold text-white truncate block">
                            {st.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {st.studentId || `STU-${100 + idx}`}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
                        ✓ បានចុះឈ្មោះ
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-8 text-slate-500">
                  <Users className="w-10 h-10 text-slate-700 mb-2 stroke-[1.5]" />
                  <p className="text-xs font-semibold text-slate-400">
                    មិនទាន់មានសិស្សចុះឈ្មោះនៅឡើយទេ
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                    សូមបង្ហាញ QR Code ខាងឆ្វេងឱ្យសិស្សស្កេន ឬចុចប៊ូតុង «សាកល្បង ៥ នាក់» ខាងលើ
                  </p>
                </div>
              )}
            </div>

            {/* Footer with Question count & Student Test View */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>
                សំណួរដែលត្រូវឆ្លើយ៖ <b className="text-white">{topicQuestions.length} សំណួរ</b>
              </span>
              <div className="flex items-center gap-2">
                {registeredStudents.length > 0 && (
                  <button
                    onClick={() => {
                      const updated = clearRegisteredStudents(room.config.id);
                      if (updated) onUpdateRoom(updated);
                    }}
                    className="text-[11px] text-slate-400 hover:text-rose-400 transition cursor-pointer"
                  >
                    កំណត់ឡើងវិញ
                  </button>
                )}
                <button
                  onClick={onOpenStudentView}
                  className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-bold transition cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>សាកល្បងធ្វើតេស្តផ្ទាល់</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Card: The Big Start Button (ចុចចាប់ផ្ដើមការប្រឡង) */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 flex-shrink-0">
                <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  ត្រៀមចាប់ផ្ដើមការប្រឡង?
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  ចុចចាប់ផ្ដើមដើម្បីរាប់ថយក្រោយ {room.config.durationMinutes} នាទី
                  និងបង្ហាញផ្ទាំងរាប់ម៉ោងផ្ទាល់
                </p>
              </div>
            </div>

            <button
              onClick={handleStartExam}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-500/30 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>ចុចចាប់ផ្ដើមការប្រឡង ({room.config.durationMinutes} នាទី)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Honor Roll Modal if triggered */}
      <HonorRollModal
        isOpen={showHonorRollModal}
        onClose={() => setShowHonorRollModal(false)}
        submissions={moduleSubmissions}
        activeModule={activeModule}
        examTitle={room.config.title}
        onRestartExam={handleResetSession}
        onViewAllScores={onViewAllScores}
      />
    </div>
  );
};
