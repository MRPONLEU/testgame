import { useState, useEffect } from 'react';
import {
  Home,
  Menu,
  QrCode,
  ExternalLink,
  Sparkles,
  Trophy,
  BookOpen,
  FileSpreadsheet,
  Users,
  Settings,
  X,
  Layers,
} from 'lucide-react';
import { RoomData, SidebarMenuTab, AppView, StudentSubmission } from './types';
import {
  initializeDefaultRoom,
  getRoomById,
  subscribeToSync,
  saveRoom,
  simulateDemoTrainees,
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { HomeLiveExam } from './components/HomeLiveExam';
import { TopPodium } from './components/TopPodium';
import { ModuleManager } from './components/ModuleManager';
import { QuestionManager } from './components/QuestionManager';
import { ScoreTable } from './components/ScoreTable';
import { UserManager } from './components/UserManager';
import { SettingsView } from './components/SettingsView';
import { StudentExam } from './components/StudentExam';
import { QRCodeModal } from './components/QRCodeModal';
import { ResultScreen } from './components/ResultScreen';
import { sound } from './utils/audio';

export default function App() {
  const [room, setRoom] = useState<RoomData>(() => initializeDefaultRoom());
  const [currentView, setCurrentView] = useState<AppView>('admin');
  const [activeTab, setActiveTab] = useState<SidebarMenuTab>('home');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsedDesktop, setIsCollapsedDesktop] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrModalModuleId, setQrModalModuleId] = useState<string>('all');
  const [filterModuleForQuestions, setFilterModuleForQuestions] = useState<string>('all');
  const [certificateSubmission, setCertificateSubmission] = useState<StudentSubmission | null>(null);
  const [isLiveExamRunning, setIsLiveExamRunning] = useState(false);

  // Check URL parameters for direct student join (?room=123-456 or ?code=123456&module=mod_1)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const queryRoom = params.get('room') || params.get('join') || params.get('code');
      const queryModule = params.get('module') || params.get('mod');

      if (queryRoom) {
        // Student joining room from QR code: Fetch directly from server first
        fetch(`/api/rooms/${queryRoom}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && data.config) {
              if (queryModule) {
                data.config.selectedModuleId = queryModule;
              }
              setRoom(data);
              saveRoom(data);
            } else {
              const matched = getRoomById(queryRoom);
              if (matched) {
                if (queryModule) matched.config.selectedModuleId = queryModule;
                setRoom(matched);
              }
            }
          })
          .catch(() => {
            const matched = getRoomById(queryRoom);
            if (matched) {
              if (queryModule) matched.config.selectedModuleId = queryModule;
              setRoom(matched);
            }
          });
        setCurrentView('student');
      } else {
        // Teacher mode: Fetch active room from server to ensure perfect sync
        fetch('/api/rooms/active')
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && data.config) {
              setRoom(data);
              saveRoom(data);
            }
          })
          .catch(() => {});
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  // Real-time synchronization (SSE & Polling fallback)
  useEffect(() => {
    const unsubscribe = subscribeToSync((event) => {
      if (
        event.type === 'new_submission' ||
        event.type === 'rooms_updated' ||
        event.type === 'student_registered' ||
        event.type === 'room_updated'
      ) {
        fetch(`/api/rooms/${room.config.id}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((fresh) => {
            if (fresh && fresh.config) {
              setRoom(fresh);
            }
          })
          .catch(() => {
            const fresh = getRoomById(room.config.id);
            if (fresh) setRoom(fresh);
          });
      }
    }, room.config.id);

    const pollInterval = setInterval(() => {
      fetch(`/api/rooms/${room.config.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((remoteData) => {
          if (remoteData && remoteData.config) {
            setRoom((prev) => {
              const subChanged =
                (remoteData.submissions?.length || 0) !== (prev.submissions?.length || 0);
              const regChanged =
                (remoteData.registeredStudents?.length || 0) !==
                (prev.registeredStudents?.length || 0);
              const modChanged =
                remoteData.config.selectedModuleId !== prev.config.selectedModuleId;
              if (subChanged || regChanged || modChanged) {
                return remoteData;
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, 1500);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [room.config.id]);

  const handleUpdateRoom = (updated: RoomData) => {
    setRoom(updated);
    saveRoom(updated);
  };

  const handleSimulate = () => {
    sound.playSuccess();
    const updated = simulateDemoTrainees(room.config.id);
    if (updated) handleUpdateRoom(updated);
  };

  // If student mode is active, display the full-screen student exam interface
  if (currentView === 'student') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Kantumruy_Pro',sans-serif]">
        <header className="h-14 bg-slate-900/80 border-b border-slate-800 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
              KQ
            </div>
            <span className="font-bold text-white text-sm">KhmerQuiz Pro - បន្ទប់ប្រឡងសិស្ស</span>
          </div>
          <button
            onClick={() => setCurrentView('admin')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រងគ្រូ
          </button>
        </header>

        <main className="flex-1 p-4 flex flex-col justify-center">
          <StudentExam
            room={room}
            onViewLeaderboard={() => {
              setCurrentView('admin');
              setActiveTab('leaderboard');
            }}
            onExit={() => setCurrentView('admin')}
          />
        </main>
      </div>
    );
  }

  // Active Tab Title and Icon
  const getTabHeader = () => {
    switch (activeTab) {
      case 'home':
        return {
          title: 'ទំព័រដើម • បន្ទប់ប្រឡងផ្ទាល់',
          subtitle: 'ជ្រើសរើសប្រធានបទ ឱ្យសិស្សស្កេន QR Code ចុះឈ្មោះ និងរាប់ថយក្រោយបង្ហាញតារាងកិត្តិយស',
          icon: Home,
          color: 'text-amber-400',
        };
      case 'leaderboard':
        return {
          title: 'តារាងកិត្តិយស TOP 1 ដល់ TOP 5',
          subtitle: 'ចំណាត់ថ្នាក់សិក្ខាកាមឆ្នើមដែលមានពិន្ទុខ្ពស់ និងល្បឿនបញ្ចប់លឿនជាងគេ',
          icon: Trophy,
          color: 'text-amber-400',
        };
      case 'modules':
        return {
          title: 'គ្រប់គ្រងវគ្គ & ប្រធានបទ',
          subtitle: 'ចាត់ចែងសំណួរតាមវគ្គសិក្សា ប្រធានបទ ឬមេរៀននីមួយៗ និងជ្រើសរើសវគ្គប្រឡង',
          icon: Layers,
          color: 'text-cyan-400',
        };
      case 'questions':
        return {
          title: 'គ្រប់គ្រងសំណួរ',
          subtitle: 'បន្ថែម លុប កែប្រែ និងបញ្ចូលសំណួរពីឯកសារ Excel (.xlsx, .csv)',
          icon: BookOpen,
          color: 'text-blue-400',
        };
      case 'scores':
        return {
          title: 'តារាងពិន្ទុ & លទ្ធផលប្រឡង',
          subtitle: 'ពិនិត្យមើលពិន្ទុជាក់ស្តែង ភាគរយ ពេលវេលា និងចម្លើយលម្អិតរបស់សិក្ខាកាម',
          icon: FileSpreadsheet,
          color: 'text-emerald-400',
        };
      case 'users':
        return {
          title: 'គ្រប់គ្រងអ្នកប្រើប្រាស់',
          subtitle: 'គ្រប់គ្រងបញ្ជីសិក្ខាកាម ស្ថានភាពប្រឡង វត្តមាន និងបន្ថែមសិស្សជាមុន',
          icon: Users,
          color: 'text-indigo-400',
        };
      case 'settings':
        return {
          title: 'កំណត់វិញ្ញាសា & ប្រព័ន្ធប្រឡង',
          subtitle: 'កំណត់ម៉ោងប្រឡង លក្ខខណ្ឌសាប់សំណួរ ពិន្ទុជាប់ និងព័ត៌មានទូទៅ',
          icon: Settings,
          color: 'text-slate-300',
        };
      default:
        return {
          title: 'ផ្ទាំងគ្រប់គ្រងគ្រូបង្រៀន',
          subtitle: 'ប្រព័ន្ធគ្រប់គ្រងការប្រឡងតេស្តសមត្ថភាពតាម QR Code',
          icon: Trophy,
          color: 'text-amber-400',
        };
    }
  };

  const tabInfo = getTabHeader();
  const HeaderIcon = tabInfo.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-['Kantumruy_Pro',sans-serif]">
      {/* 1. Slide Bar (Sidebar Menu) - Hidden when Exam is playing */}
      {!isLiveExamRunning && (
        <Sidebar
          room={room}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenStudentView={() => setCurrentView('student')}
          onOpenQRModal={() => {
            setQrModalModuleId(room.config.selectedModuleId || 'all');
            setShowQRModal(true);
          }}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isCollapsedDesktop={isCollapsedDesktop}
          onToggleCollapseDesktop={() => setIsCollapsedDesktop(!isCollapsedDesktop)}
        />
      )}

      {/* 2. Main Content Wrapper */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isLiveExamRunning ? 'pl-0' : isCollapsedDesktop ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Top Navbar - Hidden when Exam is playing */}
        {!isLiveExamRunning && (
          <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3">
            {/* Left: Mobile hamburger & Active section title */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Hamburger Button for Mobile */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80 lg:hidden cursor-pointer"
                title="បើក Menu Slide Bar"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 truncate">
                <div
                  className={`w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center ${tabInfo.color} flex-shrink-0`}
                >
                  <HeaderIcon className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <h1 className="text-sm sm:text-base font-black text-white leading-tight truncate">
                    {tabInfo.title}
                  </h1>
                  <p className="text-[11px] text-slate-400 leading-none truncate hidden sm:block">
                    {room.config.title} • PIN: <b className="text-amber-400 font-mono">{room.config.code}</b>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Big Prominent QR Code Launcher */}
              <button
                onClick={() => {
                  sound.playClick();
                  setQrModalModuleId(room.config.selectedModuleId || 'all');
                  setShowQRModal(true);
                }}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">បើក QR Code ស្កេន</span>
                <span className="sm:hidden">QR</span>
              </button>

              {/* Test as Student Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  setCurrentView('student');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                title="សាកល្បងធ្វើតេស្តក្នុងនាមជាសិស្ស"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">សាកល្បងធ្វើតេស្ត</span>
              </button>
            </div>
          </header>
        )}

        {/* Main Body */}
        <main
          className={`flex-1 ${
            isLiveExamRunning
              ? 'p-0 max-w-none w-full h-full min-h-screen'
              : 'p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto'
          }`}
        >
          {/* TAB 0: Home Page - Live Exam Hall, Topic Dropdown, QR Code, Countdown, & Honor Roll Popup */}
          {activeTab === 'home' && (
            <HomeLiveExam
              room={room}
              onUpdateRoom={handleUpdateRoom}
              onOpenStudentView={() => setCurrentView('student')}
              onOpenQRModal={(modId) => {
                setQrModalModuleId(modId || room.config.selectedModuleId || 'all');
                setShowQRModal(true);
              }}
              onViewAllScores={() => setActiveTab('scores')}
              onViewLeaderboardTab={() => setActiveTab('leaderboard')}
              onExamRunningChange={setIsLiveExamRunning}
            />
          )}

          {/* TAB 1: Hall of Fame (Top 1 to 5) */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Sparkles className="w-3 h-3" /> Live Podium
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      វេទិកាជ័យលាភី TOP 1 ដល់ TOP 5
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    បង្ហាញឈ្មោះ ពិន្ទុ និងរយៈពេលនៃបេក្ខជន ៥ នាក់ដែលឈានមុខគេ
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSimulate}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold border border-indigo-500/30 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>សាកល្បង ៥ នាក់</span>
                  </button>
                  <button
                    onClick={() => setShowQRModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow transition"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>បើក QR Code</span>
                  </button>
                </div>
              </div>

              {/* The Top 1-5 Podium */}
              <TopPodium submissions={room.submissions} />
            </div>
          )}

          {/* TAB 2: Module & Topic Management */}
          {activeTab === 'modules' && (
            <ModuleManager
              room={room}
              onUpdateRoom={handleUpdateRoom}
              onNavigateToQuestions={(modId) => {
                setFilterModuleForQuestions(modId || 'all');
                setActiveTab('questions');
              }}
              onStartExamWithModule={(modId) => {
                handleUpdateRoom({
                  ...room,
                  config: { ...room.config, selectedModuleId: modId },
                });
                setCurrentView('student');
              }}
              onOpenModuleQR={(modId) => {
                setQrModalModuleId(modId);
                setShowQRModal(true);
              }}
            />
          )}

          {/* TAB 3: Question Management */}
          {activeTab === 'questions' && (
            <QuestionManager
              questions={room.questions}
              modules={room.modules}
              initialModuleFilter={filterModuleForQuestions}
              examTitle={room.config.title}
              onUpdateQuestions={(newQuestions) => {
                handleUpdateRoom({
                  ...room,
                  questions: newQuestions,
                });
              }}
              onOpenModuleQR={(modId) => {
                setQrModalModuleId(modId);
                handleUpdateRoom({
                  ...room,
                  config: {
                    ...room.config,
                    selectedModuleId: modId,
                  },
                });
                setShowQRModal(true);
              }}
            />
          )}

          {/* TAB 3: Score Table */}
          {activeTab === 'scores' && (
            <ScoreTable
              room={room}
              onUpdateRoom={handleUpdateRoom}
              onSelectSubmissionForCertificate={(sub) => setCertificateSubmission(sub)}
            />
          )}

          {/* TAB 4: User Management */}
          {activeTab === 'users' && (
            <UserManager
              room={room}
              onUpdateRoom={handleUpdateRoom}
              onViewStudentResult={(sub) => setCertificateSubmission(sub)}
            />
          )}

          {/* TAB 5: Exam Settings & Timer */}
          {activeTab === 'settings' && (
            <SettingsView room={room} onUpdateRoom={handleUpdateRoom} />
          )}
        </main>

        {/* Footer */}
        {!isLiveExamRunning && (
          <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
              <p>© 2026 KhmerQuiz Pro - ប្រព័ន្ធប្រឡងតេស្តសមត្ថភាពស្វ័យប្រវត្តិ</p>
              <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                <span>✓ គ្រប់គ្រងអ្នកប្រើប្រាស់</span>
                <span>•</span>
                <span>✓ គ្រប់គ្រងសំណួរ</span>
                <span>•</span>
                <span>✓ តារាងពិន្ទុ</span>
                <span>•</span>
                <span>✓ តារាងកិត្តិយស TOP 1-5</span>
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* Global QR Code Modal */}
      <QRCodeModal
        config={room.config}
        modules={room.modules}
        questions={room.questions}
        activeCount={room.submissions.length}
        isOpen={showQRModal}
        initialModuleId={qrModalModuleId}
        onClose={() => setShowQRModal(false)}
        onSelectModule={(modId) => {
          setQrModalModuleId(modId);
          handleUpdateRoom({
            ...room,
            config: {
              ...room.config,
              selectedModuleId: modId,
            },
          });
        }}
      />

      {/* Certificate Viewer Modal if requested */}
      {certificateSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl my-8">
            <button
              onClick={() => setCertificateSubmission(null)}
              className="absolute -top-3 -right-3 z-10 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700 border border-slate-600 shadow-xl"
            >
              <X className="w-5 h-5" />
            </button>
            <ResultScreen
              submission={certificateSubmission}
              config={room.config}
              onViewLeaderboard={() => {
                setCertificateSubmission(null);
                setActiveTab('leaderboard');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
