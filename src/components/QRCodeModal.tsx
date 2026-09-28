import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Maximize2,
  Minimize2,
  X,
  Smartphone,
  Users,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { ExamSessionConfig, ExamModule, Question } from '../types';
import { sound } from '../utils/audio';

interface QRCodeModalProps {
  config: ExamSessionConfig;
  modules?: ExamModule[];
  questions?: Question[];
  activeCount?: number;
  isOpen: boolean;
  initialModuleId?: string;
  onClose: () => void;
  onSelectModule?: (moduleId: string) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  config,
  modules = [],
  questions = [],
  activeCount = 0,
  isOpen,
  initialModuleId,
  onClose,
  onSelectModule,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    initialModuleId || config.selectedModuleId || 'all'
  );

  // Sync selectedModuleId if initialModuleId changes
  useEffect(() => {
    if (initialModuleId) {
      setSelectedModuleId(initialModuleId);
    } else if (config.selectedModuleId) {
      setSelectedModuleId(config.selectedModuleId);
    }
  }, [initialModuleId, config.selectedModuleId]);

  // Construct URL for students to join with specific module parameter
  const roomCleanCode = config.code.replace(/\D/g, '');
  const isSpecificModule = selectedModuleId && selectedModuleId !== 'all';

  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?room=${roomCleanCode}${
          isSpecificModule ? `&module=${encodeURIComponent(selectedModuleId)}` : ''
        }`
      : `https://quiz.khmer/?room=${roomCleanCode}${
          isSpecificModule ? `&module=${encodeURIComponent(selectedModuleId)}` : ''
        }`;

  // Find active module details
  const activeModule = modules.find((m) => m.id === selectedModuleId);
  const filteredQuestions = isSpecificModule
    ? questions.filter((q) => q.moduleId === selectedModuleId)
    : questions;

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        joinUrl,
        {
          width: isFullScreen ? 340 : 250,
          margin: 2,
          color: {
            dark: isSpecificModule ? '#0f172a' : '#090d16',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        },
        (error) => {
          if (error) console.error('QR code generation error:', error);
        }
      );
    }
  }, [isOpen, joinUrl, isFullScreen, isSpecificModule]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    sound.playSelect();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenStudentTab = () => {
    window.open(joinUrl, '_blank');
  };

  const handleModuleChange = (modId: string) => {
    sound.playSelect();
    setSelectedModuleId(modId);
    if (onSelectModule) {
      onSelectModule(modId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className={`bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl transition-all duration-300 flex flex-col overflow-hidden ${
          isFullScreen ? 'w-full max-w-4xl h-[95vh]' : 'w-full max-w-lg max-h-[92vh]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-800/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base md:text-lg">
                ស្កេន QR Code ចូលប្រឡងតាមវគ្គ
              </h3>
              <p className="text-xs text-slate-400">
                QR ផ្លាស់ប្តូរស្វ័យប្រវត្តិតាមវគ្គដែលគ្រូជ្រើសរើស
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={isFullScreen ? 'បង្រួមតូច' : 'បញ្ចាំងពេញអេក្រង់'}
            >
              {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-start p-5 sm:p-6 text-center overflow-y-auto">
          {/* Module Selector Bar (Key Requirement) */}
          {modules.length > 0 && (
            <div className="w-full mb-4 p-2.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 text-left">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ជ្រើសរើសវគ្គដែលត្រូវឱ្យសិស្សឆ្លើយ (Select Target Module)៖</span>
                </span>
                <span className="text-[10px] text-amber-400 font-semibold">
                  {isSpecificModule ? activeModule?.code : 'គ្រប់វគ្គ'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => handleModuleChange('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                    !isSpecificModule
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700'
                  }`}
                >
                  គ្រប់វគ្គទាំងអស់ ({questions.length} សំណួរ)
                </button>

                {modules.map((mod) => {
                  const isCur = selectedModuleId === mod.id;
                  const qCount = questions.filter((q) => q.moduleId === mod.id).length;
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => handleModuleChange(mod.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                        isCur
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                          : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      {mod.code} ({qCount} សំណួរ)
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Target Banner */}
          <div className="mb-4 w-full max-w-md">
            {isSpecificModule && activeModule ? (
              <div className="p-2.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/50 flex items-center justify-between gap-2 text-left">
                <div className="truncate">
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 inline-block mb-0.5">
                    {activeModule.code}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    {activeModule.name}
                  </h4>
                  <p className="text-[10px] text-cyan-300">
                    សិស្សស្កេន QR នេះ នឹងចូលឆ្លើយតែសំណួរក្នុងវគ្គនេះ ({filteredQuestions.length} សំណួរ)
                  </p>
                </div>
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                  {filteredQuestions.length}Q
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700 text-left flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 inline-block mb-0.5">
                    វិញ្ញាសាចម្រុះ
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    {config.title}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    ប្រឡងរួមគ្រប់វគ្គទាំងអស់ ({questions.length} សំណួរ)
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">
                  {config.durationMinutes} នាទី
                </span>
              </div>
            )}
          </div>

          {/* QR Container */}
          <div
            className={`relative p-4 bg-white rounded-3xl shadow-xl transition-all duration-300 border-4 ${
              isSpecificModule ? 'border-cyan-400 shadow-cyan-500/15' : 'border-amber-400 shadow-amber-500/15'
            }`}
          >
            <canvas ref={canvasRef} className="rounded-xl block" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className={`w-11 h-11 rounded-2xl text-slate-950 font-black text-xs flex items-center justify-center shadow-lg border-2 border-white ${
                  isSpecificModule ? 'bg-cyan-400' : 'bg-amber-400'
                }`}
              >
                {isSpecificModule && activeModule ? activeModule.code.slice(0, 4) : 'KQ'}
              </div>
            </div>
          </div>

          {/* Room PIN Code and Module Badge */}
          <div className="mt-4 w-full max-w-xs">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">
              លេខកូដបន្ទប់ (ROOM PIN)
            </p>
            <div className="flex items-center justify-center gap-2 bg-slate-800/90 border border-slate-700 rounded-2xl py-2 px-4">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-wider text-amber-400">
                {config.code}
              </span>
              {isSpecificModule && activeModule && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {activeModule.code}
                </span>
              )}
            </div>
          </div>

          {/* Active Students Indicator */}
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <Users className="w-3.5 h-3.5" />
            <span>មានសិក្ខាកាមកំពុងចូលរួម: {activeCount} នាក់</span>
          </div>

          {/* Link Actions */}
          <div className="mt-4 w-full max-w-md flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={handleCopy}
              className="w-full flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600/70 transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="truncate">
                {copied ? 'បានចម្លងរួចរាល់!' : isSpecificModule ? `ចម្លង Link (${activeModule?.code})` : 'ចម្លងតំណភ្ជាប់ (Copy Link)'}
              </span>
            </button>
            <button
              onClick={handleOpenStudentTab}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs shadow-md transition cursor-pointer ${
                isSpecificModule
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              <span>សាកល្បង Tab ថ្មី</span>
            </button>
          </div>
        </div>

        {/* Footer instructions */}
        <div className="px-6 py-2.5 bg-slate-950/80 border-t border-slate-800 text-center text-[11px] text-slate-400 flex-shrink-0">
          💡 ណែនាំ៖ សិស្សគ្រាន់តែបើកកាមេរ៉ាទូរស័ព្ទស្កេន QR ខាងលើ នោះប្រព័ន្ធនឹងនាំចូលទៅកាន់{' '}
          <b className="text-white">
            {isSpecificModule && activeModule ? activeModule.name : 'វិញ្ញាសាដែលគ្រូបានកំណត់'}
          </b>{' '}
          ដោយស្វ័យប្រវត្តិ។
        </div>
      </div>
    </div>
  );
};
