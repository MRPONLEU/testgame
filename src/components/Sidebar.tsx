import React from 'react';
import {
  Home,
  Trophy,
  BookOpen,
  FileSpreadsheet,
  Users,
  Settings,
  QrCode,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Check,
  Copy,
  Layers,
} from 'lucide-react';
import { SidebarMenuTab, RoomData } from '../types';
import { sound } from '../utils/audio';

interface SidebarProps {
  room: RoomData;
  activeTab: SidebarMenuTab;
  onSelectTab: (tab: SidebarMenuTab) => void;
  onOpenStudentView: () => void;
  onOpenQRModal: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsedDesktop: boolean;
  onToggleCollapseDesktop: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  room,
  activeTab,
  onSelectTab,
  onOpenStudentView,
  onOpenQRModal,
  isOpenMobile,
  onCloseMobile,
  isCollapsedDesktop,
  onToggleCollapseDesktop,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(sound.getMuted());

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.config.code);
    setCopied(true);
    sound.playSelect();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const menuItems = [
    {
      id: 'home' as SidebarMenuTab,
      label: 'ទំព័រដើម',
      sublabel: 'បន្ទប់ប្រឡង & រាប់ម៉ោង',
      icon: Home,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      activeColor: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-amber-500/20 shadow-lg',
    },
    {
      id: 'leaderboard' as SidebarMenuTab,
      label: 'តារាងកិត្តិយស',
      sublabel: 'TOP 1 ដល់ TOP 5',
      icon: Trophy,
      badge: 'TOP 5',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      activeColor: 'bg-amber-500 text-slate-950 shadow-amber-500/20 shadow-lg',
    },
    {
      id: 'modules' as SidebarMenuTab,
      label: 'វគ្គ & ប្រធានបទ',
      sublabel: 'ចាត់ចែងសំណួរតាមវគ្គ',
      icon: Layers,
      badge: `${room.modules?.length || 0}`,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      activeColor: 'bg-cyan-600 text-white shadow-cyan-500/20 shadow-lg',
    },
    {
      id: 'questions' as SidebarMenuTab,
      label: 'គ្រប់គ្រងសំណួរ',
      sublabel: 'បន្ថែម លុប កែប្រែ Excel',
      icon: BookOpen,
      badge: `${room.questions.length}`,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      activeColor: 'bg-blue-600 text-white shadow-blue-500/20 shadow-lg',
    },
    {
      id: 'scores' as SidebarMenuTab,
      label: 'តារាងពិន្ទុ',
      sublabel: 'លទ្ធផល & វិញ្ញាបនបត្រ',
      icon: FileSpreadsheet,
      badge: `${room.submissions.length}`,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      activeColor: 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-lg',
    },
    {
      id: 'users' as SidebarMenuTab,
      label: 'គ្រប់គ្រងអ្នកប្រើប្រាស់',
      sublabel: 'បញ្ជីសិក្ខាកាម & វត្តមាន',
      icon: Users,
      badge: `${room.submissions.length}`,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      activeColor: 'bg-indigo-600 text-white shadow-indigo-500/20 shadow-lg',
    },
    {
      id: 'settings' as SidebarMenuTab,
      label: 'កំណត់វិញ្ញាសា',
      sublabel: 'កំណត់ម៉ោង & សាប់ចម្លើយ',
      icon: Settings,
      badge: `${room.config.durationMinutes}នាទី`,
      badgeColor: 'bg-slate-700 text-slate-300 border-slate-600',
      activeColor: 'bg-slate-800 text-white border border-slate-600 shadow-lg',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Main Slide Bar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out shadow-2xl ${
          // Mobile state
          isOpenMobile ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop collapsed vs expanded
          isCollapsedDesktop ? 'lg:w-20' : 'lg:w-72'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black text-base flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
              KQ
            </div>
            {(!isCollapsedDesktop || isOpenMobile) && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-white text-base tracking-tight truncate">
                    KhmerQuiz
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">ប្រព័ន្ធគ្រប់គ្រងការប្រឡង</p>
              </div>
            )}
          </div>

          {/* Close button for Mobile / Collapse for Desktop */}
          <div className="flex items-center gap-1">
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={onToggleCollapseDesktop}
              className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={isCollapsedDesktop ? 'ពង្រីក Menu' : 'បង្រួម Menu'}
            >
              {isCollapsedDesktop ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* PIN Code Box (Compact vs Full) */}
        {(!isCollapsedDesktop || isOpenMobile) ? (
          <div className="mx-3 my-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                ROOM PIN
              </span>
              <p className="font-mono text-base font-black text-amber-400 leading-tight">
                {room.config.code}
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="ចម្លងលេខកូដបន្ទប់"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <div className="my-3 text-center">
            <button
              onClick={handleCopyCode}
              className="p-2.5 mx-auto rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition"
              title={`Room PIN: ${room.config.code} (ចុចដើម្បីចម្លង)`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* Quick Big QR Code Action */}
        <div className="px-3 mb-2">
          <button
            onClick={() => {
              sound.playClick();
              onOpenQRModal();
            }}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer ${
              isCollapsedDesktop && !isOpenMobile ? 'px-2' : 'px-3 text-xs sm:text-sm'
            }`}
            title="បើក QR Code ឱ្យសិស្សស្កេន"
          >
            <QrCode className="w-4 h-4 flex-shrink-0" />
            {(!isCollapsedDesktop || isOpenMobile) && (
              <span className="truncate">បើក QR Code ស្កេន</span>
            )}
          </button>
        </div>

        {/* Active Session Indicator */}
        {(!isCollapsedDesktop || isOpenMobile) && (
          <div className="mx-3 mb-2.5 px-2.5 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] flex items-center justify-between">
            <span className="text-slate-400 truncate flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              <span className="truncate font-semibold text-slate-300">
                {room.config.selectedModuleId === 'all' || !room.config.selectedModuleId
                  ? 'គ្រប់វគ្គទាំងអស់'
                  : room.modules?.find((m) => m.id === room.config.selectedModuleId)?.code || 'វគ្គជាក់លាក់'}
              </span>
            </span>
            <span className="text-[10px] text-amber-400 font-bold flex-shrink-0 ml-1">
              {room.config.selectedModuleId === 'all' || !room.config.selectedModuleId
                ? `${room.questions.length} សំណួរ`
                : `${room.questions.filter((q) => q.moduleId === room.config.selectedModuleId).length} សំណួរ`}
            </span>
          </div>
        )}

        {/* Navigation Menu Items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {(!isCollapsedDesktop || isOpenMobile) && (
            <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              ម៉ឺនុយមេ (Main Menu)
            </div>
          )}

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sound.playClick();
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition group relative cursor-pointer ${
                  isActive
                    ? item.activeColor
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                } ${isCollapsedDesktop && !isOpenMobile ? 'justify-center' : 'justify-between'}`}
                title={item.label}
              >
                <div className="flex items-center gap-3 truncate">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
                      isActive
                        ? 'bg-black/20 text-current'
                        : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {(!isCollapsedDesktop || isOpenMobile) && (
                    <div className="text-left truncate">
                      <p className="font-bold text-xs sm:text-sm leading-tight truncate">
                        {item.label}
                      </p>
                      <p
                        className={`text-[10px] leading-tight truncate ${
                          isActive ? 'text-current/80' : 'text-slate-400'
                        }`}
                      >
                        {item.sublabel}
                      </p>
                    </div>
                  )}
                </div>

                {/* Badge */}
                {(!isCollapsedDesktop || isOpenMobile) && item.badge && (
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      isActive ? 'bg-black/20 border-white/30 text-current' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Student Exam Link (External/Preview) */}
          <div className="pt-3 mt-3 border-t border-slate-800">
            {(!isCollapsedDesktop || isOpenMobile) && (
              <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                តំណភ្ជាប់សិស្ស (Student Mode)
              </div>
            )}
            <button
              onClick={() => {
                sound.playClick();
                onOpenStudentView();
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition cursor-pointer ${
                isCollapsedDesktop && !isOpenMobile ? 'justify-center' : ''
              }`}
              title="សាកល្បងបន្ទប់ប្រឡងសិស្ស"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                <ExternalLink className="w-4 h-4" />
              </div>
              {(!isCollapsedDesktop || isOpenMobile) && (
                <div className="text-left truncate">
                  <p className="font-bold text-xs sm:text-sm text-blue-300 leading-tight">
                    បន្ទប់ប្រឡងសិស្ស
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight">សាកល្បងធ្វើតេស្ត</p>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-2">
          {(!isCollapsedDesktop || isOpenMobile) ? (
            <>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="truncate">បន្ទប់កំពុងដំណើរការ</span>
              </div>
              <button
                onClick={handleToggleSound}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
                title={isMuted ? 'បើកសំឡេង' : 'បិទសំឡេង'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </>
          ) : (
            <button
              onClick={handleToggleSound}
              className="p-2 mx-auto rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
              title={isMuted ? 'បើកសំឡេង' : 'បិទសំឡេង'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
