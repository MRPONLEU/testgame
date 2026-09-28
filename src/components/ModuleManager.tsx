import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit3,
  Trash2,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Play,
  X,
  Sparkles,
  ArrowRight,
  QrCode,
} from 'lucide-react';
import { RoomData, ExamModule, Question } from '../types';
import { saveRoom } from '../utils/storage';
import { sound } from '../utils/audio';

interface ModuleManagerProps {
  room: RoomData;
  onUpdateRoom: (room: RoomData) => void;
  onNavigateToQuestions?: (moduleId?: string) => void;
  onStartExamWithModule?: (moduleId: string) => void;
  onOpenModuleQR?: (moduleId: string) => void;
}

export const ModuleManager: React.FC<ModuleManagerProps> = ({
  room,
  onUpdateRoom,
  onNavigateToQuestions,
  onStartExamWithModule,
  onOpenModuleQR,
}) => {
  const [modules, setModules] = useState<ExamModule[]>(room.modules || []);
  const [editingModule, setEditingModule] = useState<ExamModule | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('blue');
  const [formError, setFormError] = useState('');

  const colors = [
    { id: 'blue', label: 'ខៀវ (Blue)', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    { id: 'emerald', label: 'បៃតង (Emerald)', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    { id: 'amber', label: 'លឿងទុំ (Amber)', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    { id: 'purple', label: 'ស្វាយ (Purple)', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    { id: 'rose', label: 'ផ្កាឈូក (Rose)', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
    { id: 'cyan', label: 'ផ្ទៃមេឃ (Cyan)', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  ];

  const getColorClass = (colorId?: string) => {
    const found = colors.find((c) => c.id === colorId);
    return found ? found.bg : colors[0].bg;
  };

  const handleOpenCreate = () => {
    sound.playClick();
    const nextIdx = (modules.length + 1).toString().padStart(2, '0');
    setFormName('');
    setFormCode(`MOD-${nextIdx}`);
    setFormDescription('');
    setFormColor(colors[modules.length % colors.length].id);
    setFormError('');
    setEditingModule(null);
    setIsCreatingNew(true);
  };

  const handleOpenEdit = (mod: ExamModule) => {
    sound.playClick();
    setEditingModule(mod);
    setFormName(mod.name);
    setFormCode(mod.code);
    setFormDescription(mod.description || '');
    setFormColor(mod.color || 'blue');
    setFormError('');
    setIsCreatingNew(false);
  };

  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('សូមបញ្ចូលឈ្មោះវគ្គ ឬប្រធានបទ!');
      return;
    }

    sound.playSuccess();

    if (isCreatingNew) {
      const newMod: ExamModule = {
        id: 'mod_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        name: formName.trim(),
        code: formCode.trim() || `MOD-${modules.length + 1}`,
        description: formDescription.trim() || undefined,
        color: formColor,
        createdAt: Date.now(),
      };
      const updatedModules = [...modules, newMod];
      setModules(updatedModules);
      const updatedRoom: RoomData = { ...room, modules: updatedModules };
      saveRoom(updatedRoom);
      onUpdateRoom(updatedRoom);
      setIsCreatingNew(false);
    } else if (editingModule) {
      const updatedModules = modules.map((m) => {
        if (m.id === editingModule.id) {
          return {
            ...m,
            name: formName.trim(),
            code: formCode.trim() || m.code,
            description: formDescription.trim() || undefined,
            color: formColor,
          };
        }
        return m;
      });
      setModules(updatedModules);
      const updatedRoom: RoomData = { ...room, modules: updatedModules };
      saveRoom(updatedRoom);
      onUpdateRoom(updatedRoom);
      setEditingModule(null);
    }
  };

  const handleDeleteModule = (modId: string, modName: string) => {
    if (modules.length <= 1) {
      alert('ត្រូវមានយ៉ាងតិច ១ វគ្គ ឬប្រធានបទក្នុងប្រព័ន្ធ!');
      return;
    }
    if (
      window.confirm(
        `តើអ្នកពិតជាចង់លុប «${modName}» មែនទេ?\n(សំណួរដែលស្ថិតក្នុងវគ្គនេះនឹងត្រូវដកចេញពីវគ្គនេះ ប៉ុន្តែមិនត្រូវបានលុបឡើយ)`
      )
    ) {
      sound.playClick();
      const updatedModules = modules.filter((m) => m.id !== modId);
      // Clean up question associations
      const updatedQuestions = room.questions.map((q) => {
        if (q.moduleId === modId) {
          return { ...q, moduleId: undefined };
        }
        return q;
      });

      setModules(updatedModules);
      const updatedRoom: RoomData = {
        ...room,
        modules: updatedModules,
        questions: updatedQuestions,
        config: {
          ...room.config,
          selectedModuleId:
            room.config.selectedModuleId === modId ? 'all' : room.config.selectedModuleId,
        },
      };
      saveRoom(updatedRoom);
      onUpdateRoom(updatedRoom);
    }
  };

  // Set active exam target: All modules or specific module
  const handleSelectExamTarget = (targetModuleId: string) => {
    sound.playSelect();
    const updatedRoom: RoomData = {
      ...room,
      config: {
        ...room.config,
        selectedModuleId: targetModuleId,
      },
    };
    saveRoom(updatedRoom);
    onUpdateRoom(updatedRoom);
  };

  const selectedTarget = room.config.selectedModuleId || 'all';

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white flex items-center justify-center font-black shadow-lg shadow-cyan-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                គ្រប់គ្រងវគ្គ & ប្រធានបទ
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {modules.length} វគ្គ
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              រៀបចំសំណួរតាមវគ្គសិក្សា ប្រធានបទ ឬមេរៀននីមួយៗ និងជ្រើសរើសវគ្គសម្រាប់ប្រឡង
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>បង្កើតវគ្គ/ប្រធានបទថ្មី</span>
          </button>
        </div>
      </div>

      {/* Target Module for Live Exam */}
      <div className="my-5 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" /> វិសាលភាពនៃការប្រឡងបច្ចុប្បន្ន (Active Exam Scope)
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            អ្នកអាចជ្រើសរើសឱ្យសិស្សប្រឡងគ្រប់វគ្គទាំងអស់ ឬប្រឡងតែវគ្គជាក់លាក់ណាមួយ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSelectExamTarget('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedTarget === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {selectedTarget === 'all' && <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>ប្រឡងគ្រប់វគ្គទាំងអស់ ({room.questions.length} សំណួរ)</span>
          </button>

          {modules.map((m) => {
            const count = room.questions.filter((q) => q.moduleId === m.id).length;
            const isSelected = selectedTarget === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleSelectExamTarget(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>
                  {m.code} ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modules Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod, idx) => {
          const modQuestions = room.questions.filter((q) => q.moduleId === mod.id);
          const totalPoints = modQuestions.reduce((sum, q) => sum + (q.points ?? 10), 0);
          const isExamTarget = selectedTarget === mod.id;

          return (
            <div
              key={mod.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between group relative ${
                isExamTarget
                  ? 'bg-cyan-950/20 border-cyan-500/60 ring-2 ring-cyan-500/20'
                  : 'bg-slate-850/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${getColorClass(
                        mod.color
                      )}`}
                    >
                      {mod.code}
                    </span>
                    {isExamTarget && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950">
                        កំពុងបើកប្រឡង
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(mod)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="កែប្រែវគ្គ"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteModule(mod.id, mod.name)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition"
                      title="លុបវគ្គ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-bold text-white text-base leading-snug mb-1.5">{mod.name}</h3>

                {/* Description */}
                {mod.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {mod.description}
                  </p>
                )}
              </div>

              {/* Footer Stats & Actions */}
              <div className="pt-4 border-t border-slate-800/80 mt-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    <b className="text-white">{modQuestions.length}</b> សំណួរ
                  </span>
                  <span>
                    ពិន្ទុសរុប៖ <b className="text-amber-400">{totalPoints}</b>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      if (onOpenModuleQR) onOpenModuleQR(mod.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold border border-amber-500/30 transition cursor-pointer"
                    title="បើក QR Code សម្រាប់តែវគ្គនេះ"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR វគ្គនេះ</span>
                  </button>

                  {onNavigateToQuestions && (
                    <button
                      onClick={() => onNavigateToQuestions(mod.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                      title="មើលសំណួរក្នុងវគ្គនេះ"
                    >
                      <span>សំណួរ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleSelectExamTarget(mod.id)}
                    className={`flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isExamTarget
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                        : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}
                    title="ជ្រើសរើសវគ្គនេះសម្រាប់ប្រឡង"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isExamTarget ? 'សកម្ម' : 'ជ្រើសរើស'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create or Edit Module */}
      {(isCreatingNew || editingModule) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {isCreatingNew ? 'បង្កើតវគ្គ/ប្រធានបទថ្មី' : 'កែប្រែវគ្គ/ប្រធានបទ'}
                  </h3>
                  <p className="text-xs text-slate-400">កំណត់ឈ្មោះ កូដសម្គាល់ និងការពិពណ៌នា</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreatingNew(false);
                  setEditingModule(null);
                }}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="space-y-4">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    កូដវគ្គ <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="MOD-01"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs outline-none focus:border-cyan-400 uppercase"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ពណ៌សម្គាល់ (Badge Color)
                  </label>
                  <select
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none"
                  >
                    {colors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ឈ្មោះវគ្គ ឬប្រធានបទ <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ឧ. វគ្គទី ១: មូលដ្ឋានគ្រឹះកុំព្យូទ័រ & AI"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ការពិពណ៌នាសង្ខេប (Optional)
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="ពិពណ៌នាអំពីខ្លឹមសារ ឬគោលបំណងនៃវគ្គនេះ..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditingModule(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20"
                >
                  {isCreatingNew ? 'បង្កើតវគ្គ' : 'ធ្វើបច្ចុប្បន្នភាព'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
