import { RoomData, ExamSessionConfig, StudentSubmission, Question, ExamModule, RegisteredStudent } from '../types';
import { DEFAULT_EXAM_PRESETS, DEFAULT_MODULES } from '../data/defaultQuestions';

const ROOMS_KEY = 'khmerquiz_rooms';
const ACTIVE_ROOM_KEY = 'khmerquiz_active_room_id';

export const DEFAULT_ROOM_ID = 'room_main';
export const DEFAULT_ROOM_CODE = '430-657';

// BroadcastChannel for instant multi-tab sync on same device
let channel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel('khmerquiz_sync_channel');
  }
} catch {
  channel = null;
}

// Server-Sent Events source for real-time cross-device sync (PC <-> Mobile)
let sseSource: EventSource | null = null;

export function subscribeToSync(
  callback: (event: { type: string; payload?: unknown }) => void,
  roomId: string = DEFAULT_ROOM_ID
): () => void {
  // 1. Same-device BroadcastChannel
  const channelHandler = (e: MessageEvent) => {
    if (e.data) callback(e.data);
  };
  channel?.addEventListener('message', channelHandler);

  // 2. Cross-device Real-Time Server-Sent Events (SSE)
  if (typeof window !== 'undefined' && 'EventSource' in window) {
    try {
      if (sseSource) {
        sseSource.close();
      }
      sseSource = new EventSource(`/api/rooms/${roomId}/events`);
      sseSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.type) {
            callback({ type: parsed.type, payload: parsed.payload });
          }
        } catch {
          // Heartbeat or comment
        }
      };
      sseSource.onerror = () => {
        // SSE reconnects automatically
      };
    } catch {
      // Ignore SSE failure
    }
  }

  return () => {
    channel?.removeEventListener('message', channelHandler);
    if (sseSource) {
      sseSource.close();
      sseSource = null;
    }
  };
}

export function broadcastEvent(type: string, payload?: unknown) {
  try {
    channel?.postMessage({ type, payload });
  } catch {
    // Ignore postMessage failure
  }
}

export function generateRoomCode(): string {
  return DEFAULT_ROOM_CODE;
}

export function getAllRooms(): Record<string, RoomData> {
  try {
    const raw = localStorage.getItem(ROOMS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveAllRooms(rooms: Record<string, RoomData>) {
  try {
    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
    broadcastEvent('rooms_updated');
  } catch (err) {
    console.error('Failed to save rooms to storage', err);
  }
}

export function getRoomById(roomId: string): RoomData | null {
  const rooms = getAllRooms();
  if (rooms[roomId]) return rooms[roomId];
  // Also try looking up by code or clean code
  const cleanCode = roomId.replace(/\D/g, '');
  for (const r of Object.values(rooms)) {
    if (
      r.config.id === roomId ||
      r.config.code === roomId ||
      (cleanCode && r.config.code.replace(/\D/g, '') === cleanCode)
    ) {
      return r;
    }
  }
  return null;
}

export function saveRoom(room: RoomData) {
  const rooms = getAllRooms();
  rooms[room.config.id] = room;
  saveAllRooms(rooms);

  // Synchronize to backend server so all remote clients (students on mobile) have access
  fetch(`/api/rooms/${room.config.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(room),
  }).catch(() => {
    // Offline fallback is fine
  });
}

export function getActiveRoomId(): string {
  return localStorage.getItem(ACTIVE_ROOM_KEY) || DEFAULT_ROOM_ID;
}

export function setActiveRoomId(id: string) {
  localStorage.setItem(ACTIVE_ROOM_KEY, id);
}

export function createNewRoom(
  title: string,
  durationMinutes: number = 10,
  questions: Question[],
  options?: Partial<ExamSessionConfig>,
  modules?: ExamModule[]
): RoomData {
  const roomId = DEFAULT_ROOM_ID;
  const code = DEFAULT_ROOM_CODE;

  const config: ExamSessionConfig = {
    id: roomId,
    code,
    title,
    description: 'តេស្តសមត្ថភាព និងចំណេះដឹងតាមប្រព័ន្ធស្វ័យប្រវត្តិ',
    durationMinutes,
    passPercentage: 60,
    shuffleQuestions: true,
    shuffleOptions: true,
    allowReview: true,
    showScoreImmediately: true,
    status: 'active',
    createdAt: Date.now(),
    selectedModuleId: 'all',
    ...options,
  };

  const newRoom: RoomData = {
    config,
    modules: modules && modules.length > 0 ? modules : [...DEFAULT_MODULES],
    questions,
    submissions: [],
    registeredStudents: [],
  };

  saveRoom(newRoom);
  setActiveRoomId(roomId);
  return newRoom;
}

export function initializeDefaultRoom(): RoomData {
  const rooms = getAllRooms();
  const existingActive = getActiveRoomId();

  if (existingActive && rooms[existingActive]) {
    const existing = rooms[existingActive];
    if (!existing.modules || existing.modules.length === 0) {
      existing.modules = [...DEFAULT_MODULES];
    }
    // Always sync existing room to the server to ensure teacher and students match
    saveRoom(existing);
    return existing;
  }

  const firstPreset = DEFAULT_EXAM_PRESETS[0];
  const room = createNewRoom(
    firstPreset.title,
    10,
    firstPreset.questions,
    { description: firstPreset.description },
    firstPreset.modules || DEFAULT_MODULES
  );

  saveRoom(room);
  return room;
}

export function addSubmissionToRoom(roomId: string, submission: StudentSubmission): RoomData | null {
  const room = getRoomById(roomId) || initializeDefaultRoom();

  // Filter out any prior submission from this student name or ID
  const existingIdx = room.submissions.findIndex(
    (s) => s.studentName.trim().toLowerCase() === submission.studentName.trim().toLowerCase()
  );

  if (existingIdx >= 0) {
    room.submissions[existingIdx] = submission;
  } else {
    room.submissions.push(submission);
  }

  // Recalculate ranks: sorted by score desc, then durationSeconds asc
  room.submissions.sort((a, b) => {
    if (b.percentage !== a.percentage) {
      return b.percentage - a.percentage;
    }
    return a.durationSeconds - b.durationSeconds;
  });

  room.submissions.forEach((sub, idx) => {
    sub.rank = idx + 1;
  });

  saveRoom(room);
  broadcastEvent('new_submission', { roomId, submission });

  // Post to backend server immediately
  fetch(`/api/rooms/${roomId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission),
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && data.room) {
        saveRoom(data.room);
      }
    })
    .catch(() => {});

  return room;
}

/**
 * Demo Simulation: Adds 5 Cambodian trainees with varying scores and speeds
 * to immediately showcase the Top 1 to 5 leaderboard & podium!
 */
export function simulateDemoTrainees(roomId: string): RoomData | null {
  const room = getRoomById(roomId) || initializeDefaultRoom();

  const mockStudents = [
    { name: 'សេង ពិសិដ្ឋ (Piseth)', scorePercent: 100, durationSec: 135 },
    { name: 'ជា លក្ខិណា (Leakhena)', scorePercent: 90, durationSec: 160 },
    { name: 'វ៉ាន់ ចាន់ថុល (Chanthol)', scorePercent: 80, durationSec: 185 },
    { name: 'ហេង សុខា (Sokha)', scorePercent: 80, durationSec: 210 },
    { name: 'កែវ វីរៈ (Virak)', scorePercent: 70, durationSec: 230 },
  ];

  const totalPoints = room.questions.reduce((sum, q) => sum + (q.points ?? 10), 0) || 100;

  mockStudents.forEach((mock) => {
    const rawScore = Math.round((mock.scorePercent / 100) * totalPoints);
    const sub: StudentSubmission = {
      id: 'sub_demo_' + Math.random().toString(36).substring(2, 9),
      roomId: room.config.id,
      studentName: mock.name,
      studentId: 'STU-' + Math.floor(1000 + Math.random() * 9000),
      startedAt: Date.now() - mock.durationSec * 1000,
      submittedAt: Date.now(),
      durationSeconds: mock.durationSec,
      answers: {},
      score: rawScore,
      maxScore: totalPoints,
      percentage: mock.scorePercent,
      isPassed: mock.scorePercent >= room.config.passPercentage,
    };
    addSubmissionToRoom(roomId, sub);
  });

  return getRoomById(roomId);
}

/**
 * Register a student who has joined or registered via QR code
 */
export function registerStudentToRoom(
  roomId: string,
  student: { name: string; studentId?: string; moduleId?: string }
): RoomData | null {
  const room = getRoomById(roomId) || initializeDefaultRoom();

  if (!room.registeredStudents) {
    room.registeredStudents = [];
  }

  const existingIdx = room.registeredStudents.findIndex(
    (s) => s.name.trim().toLowerCase() === student.name.trim().toLowerCase()
  );

  const regStudent: RegisteredStudent = {
    id: 'reg_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    name: student.name.trim(),
    studentId: student.studentId?.trim(),
    joinedAt: Date.now(),
    status: 'waiting',
    moduleId: student.moduleId || room.config.selectedModuleId || 'all',
  };

  if (existingIdx >= 0) {
    room.registeredStudents[existingIdx].joinedAt = Date.now();
    if (student.moduleId) room.registeredStudents[existingIdx].moduleId = student.moduleId;
  } else {
    room.registeredStudents.push(regStudent);
  }

  saveRoom(room);
  broadcastEvent('student_registered', { roomId, student: regStudent });

  // Post to backend server immediately
  fetch(`/api/rooms/${roomId}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regStudent),
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && data.room) {
        saveRoom(data.room);
      }
    })
    .catch(() => {});

  return room;
}

/**
 * Simulate 5-6 sample registered students for teacher demo
 */
export function simulateDemoRegistrations(roomId: string): RoomData | null {
  const room = getRoomById(roomId) || initializeDefaultRoom();

  const mockNames = [
    'សេង ពិសិដ្ឋ',
    'ជា លក្ខិណា',
    'វ៉ាន់ ចាន់ថុល',
    'ហេង សុខា',
    'កែវ វីរៈ',
    'សុខ ស្រីលីន',
    'រ័ត្ន បញ្ញា',
  ];

  if (!room.registeredStudents) room.registeredStudents = [];

  mockNames.forEach((name, idx) => {
    const exists = room.registeredStudents?.some((s) => s.name === name);
    if (!exists) {
      room.registeredStudents?.push({
        id: 'reg_demo_' + idx + '_' + Math.random().toString(36).substring(2, 6),
        name,
        studentId: 'STU-' + (1000 + idx * 12),
        joinedAt: Date.now() - (mockNames.length - idx) * 15000,
        status: 'waiting',
        moduleId: room.config.selectedModuleId || 'all',
      });
    }
  });

  saveRoom(room);
  broadcastEvent('student_registered', { roomId });
  return room;
}

/**
 * Clear registered students list for a fresh exam batch
 */
export function clearRegisteredStudents(roomId: string): RoomData | null {
  const room = getRoomById(roomId);
  if (!room) return null;
  room.registeredStudents = [];
  saveRoom(room);
  broadcastEvent('rooms_updated');
  return room;
}
