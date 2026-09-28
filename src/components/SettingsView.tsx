import React, { useState } from 'react';
import {
  Settings,
  Clock,
  Shuffle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { RoomData } from '../types';
import { DEFAULT_EXAM_PRESETS } from '../data/defaultQuestions';
import { saveRoom, generateRoomCode, createNewRoom } from '../utils/storage';
import { sound } from '../utils/audio';

interface SettingsViewProps {
  room: RoomData;
  onUpdateRoom: (room: RoomData) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ room, onUpdateRoom }) => {
  const [title, setTitle] = useState(room.config.title);
  const [description, setDescription] = useState(room.config.description || '');
  const [duration, setDuration] = useState(room.config.durationMinutes);
  const [passPercentage, setPassPercentage] = useState(room.config.passPercentage);
  const [shuffleQuestions, setShuffleQuestions] = useState(room.config.shuffleQuestions);
  const [shuffleOptions, setShuffleOptions] = useState(room.config.shuffleOptions);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSuccess();
    const updated: RoomData = {
      ...room,
      config: {
        ...room.config,
        title: title.trim() || room.config.title,
        description: description.trim(),
        durationMinutes: duration > 0 ? duration : 5,
        passPercentage,
        shuffleQuestions,
        shuffleOptions,
      },
    };
    saveRoom(updated);
    onUpdateRoom(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleRegenerateCode = () => {
    if (window.confirm('តើអ្នកពិតជាចង់ប្តូរលេខកូដបន្ទប់ PIN ថ្មីមែនទេ?')) {
      const newCode = generateRoomCode();
      const updated: RoomData = {
        ...room,
        config: { ...room.config, code: newCode },
      };
      saveRoom(updated);
      onUpdateRoom(updated);
      sound.playSelect();
    }
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = DEFAULT_EXAM_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    sound.playSelect();
    const newRoom = createNewRoom(preset.title, preset.durationMinutes, preset.questions, {
      description: preset.description,
    });
    onUpdateRoom(newRoom);
    setTitle(newRoom.config.title);
    setDescription(newRoom.config.description);
    setDuration(newRoom.config.durationMinutes);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-600 text-white flex items-center justify-center font-black shadow-lg">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">កំណត់វិញ្ញាសា & ប្រព័ន្ធប្រឡង</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            កំណត់ម៉ោងប្រឡង លក្ខខណ្ឌសាប់សំណួរ ពិន្ទុជាប់ និងព័ត៌មានទូទៅ
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6 mt-6">
        {/* Title & Description */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              ចំណងជើងវិញ្ញាសា (Exam Title)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm outline-none focus:border-amber-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              ការពិពណ៌នាវិញ្ញាសា (Description)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Duration & Pass Percentage Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Duration */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5 mb-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>កំណត់ម៉ោងប្រឡង (នាទី)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {[2, 5, 10, 15, 20, 30].map((mins) => (
                <button
                  type="button"
                  key={mins}
                  onClick={() => setDuration(mins)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    duration === mins
                      ? 'bg-amber-400 text-slate-950 shadow'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {mins} នាទី
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              max={180}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
            />
          </div>

          {/* Pass Percentage */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>លក្ខខណ្ឌពិន្ទុជាប់ (%)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {[50, 60, 70, 80].map((pct) => (
                <button
                  type="button"
                  key={pct}
                  onClick={() => setPassPercentage(pct)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    passPercentage === pct
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
            <input
              type="number"
              min={10}
              max={100}
              value={passPercentage}
              onChange={(e) => setPassPercentage(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
            />
          </div>
        </div>

        {/* Shuffling Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Shuffle className="w-4 h-4 text-blue-400" /> សាប់លំដាប់សំណួរ (Shuffle Qs)
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                សិស្សម្នាក់ៗទទួលបានលំដាប់សំណួរខុសៗគ្នា
              </p>
            </div>
            <input
              type="checkbox"
              checked={shuffleQuestions}
              onChange={(e) => setShuffleQuestions(e.target.checked)}
              className="w-5 h-5 accent-amber-400 cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Shuffle className="w-4 h-4 text-indigo-400" /> សាប់ជម្រើសចម្លើយ (Shuffle Options)
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ជម្រើស ក, ខ, គ, ឃ ត្រូវបានសាប់ចៃដន្យ
              </p>
            </div>
            <input
              type="checkbox"
              checked={shuffleOptions}
              onChange={(e) => setShuffleOptions(e.target.checked)}
              className="w-5 h-5 accent-amber-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Room Code Regeneration */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-white">លេខកូដបន្ទប់ (Room PIN Code)</span>
            <p className="font-mono text-lg font-black text-amber-400 mt-0.5">{room.config.code}</p>
          </div>
          <button
            type="button"
            onClick={handleRegenerateCode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>បង្កើតលេខកូដថ្មី</span>
          </button>
        </div>

        {/* Preset Switcher */}
        <div className="pt-2">
          <span className="text-xs font-bold text-slate-400 block mb-2">
            ជ្រើសរើសវិញ្ញាសាគំរូដែលរៀបចំស្រាប់ (Presets)៖
          </span>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_EXAM_PRESETS.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => handleApplyPreset(p.id)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> បានរក្សាទុកការកំណត់ដោយជោគជ័យ!
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              រក្សាទុកការកំណត់
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
