import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DEFAULT_MODULES, DEFAULT_EXAM_PRESETS } from './src/data/defaultQuestions';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, 'rooms-data.json');

interface RegisteredStudent {
  id: string;
  name: string;
  studentId?: string;
  joinedAt: number;
  status?: string;
  moduleId?: string;
  [key: string]: unknown;
}

interface StudentSubmission {
  id: string;
  studentName: string;
  percentage: number;
  durationSeconds: number;
  rank?: number;
  score?: number;
  maxScore?: number;
  isPassed?: boolean;
  [key: string]: unknown;
}

interface RoomStoreItem {
  config: {
    id: string;
    code: string;
    title: string;
    description?: string;
    durationMinutes: number;
    passPercentage: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    allowReview?: boolean;
    showScoreImmediately?: boolean;
    status?: string;
    createdAt?: number;
    selectedModuleId?: string;
    [key: string]: unknown;
  };
  modules?: unknown[];
  questions?: unknown[];
  registeredStudents: RegisteredStudent[];
  submissions: StudentSubmission[];
}

// In-memory room store initialized from persistent disk file
let rooms: Record<string, RoomStoreItem> = {};

function getDefaultRoom(): RoomStoreItem {
  const defaultPreset = DEFAULT_EXAM_PRESETS[0];
  return {
    config: {
      id: 'room_main',
      code: '430-657',
      title: defaultPreset.title,
      description: defaultPreset.description,
      durationMinutes: 10,
      passPercentage: 60,
      shuffleQuestions: true,
      shuffleOptions: true,
      allowReview: true,
      showScoreImmediately: true,
      status: 'active',
      createdAt: Date.now(),
      selectedModuleId: 'all',
    },
    modules: DEFAULT_MODULES,
    questions: defaultPreset.questions,
    registeredStudents: [],
    submissions: [],
  };
}

function loadRoomsFromDisk(): Record<string, RoomStoreItem> {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        // Ensure default room has questions and modules populated
        for (const r of Object.values(parsed) as RoomStoreItem[]) {
          if (!r.modules || r.modules.length === 0) {
            r.modules = DEFAULT_MODULES;
          }
          if (!r.questions || r.questions.length === 0) {
            r.questions = DEFAULT_EXAM_PRESETS[0].questions;
          }
          if (!r.registeredStudents) r.registeredStudents = [];
          if (!r.submissions) r.submissions = [];
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read rooms-data.json, initializing fresh store', err);
  }

  const defaultRoom = getDefaultRoom();
  const initial = { room_main: defaultRoom };
  saveRoomsToDisk(initial);
  return initial;
}

function saveRoomsToDisk(data: Record<string, RoomStoreItem>) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write rooms-data.json', err);
  }
}

// Server-Sent Events clients for real-time cross-device sync
const sseClients: Array<{ res: Response; roomId: string }> = [];

function broadcastToClients(roomId: string, eventType: string, payload: unknown) {
  const data = JSON.stringify({ type: eventType, payload, timestamp: Date.now() });
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    if (client.roomId === roomId || client.roomId === 'all') {
      try {
        client.res.write(`data: ${data}\n\n`);
      } catch {
        sseClients.splice(i, 1);
      }
    }
  }
}

// Initialize store
rooms = loadRoomsFromDisk();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: Date.now(), roomCount: Object.keys(rooms).length });
  });

  // Get active room (for primary connection)
  app.get('/api/rooms/active', (_req: Request, res: Response) => {
    const active = rooms['room_main'] || Object.values(rooms)[0] || getDefaultRoom();
    return res.json(active);
  });

  // Get all rooms
  app.get('/api/rooms', (_req: Request, res: Response) => {
    res.json(Object.values(rooms));
  });

  // Real-time Server-Sent Events stream
  app.get('/api/rooms/:id/events', (req: Request, res: Response) => {
    const roomId = req.params.id;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });
    res.write(': connected\n\n');

    const client = { res, roomId };
    sseClients.push(client);

    req.on('close', () => {
      const idx = sseClients.indexOf(client);
      if (idx >= 0) sseClients.splice(idx, 1);
    });
  });

  // Get specific room by ID or PIN code
  app.get('/api/rooms/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    const cleanId = id.replace(/\D/g, '');

    let found =
      rooms[id] ||
      Object.values(rooms).find(
        (r) =>
          r.config.id === id ||
          r.config.code === id ||
          (cleanId && r.config.code.replace(/\D/g, '') === cleanId)
      );

    // If not found, fallback to primary room so students NEVER get 404
    if (!found) {
      found = rooms['room_main'] || Object.values(rooms)[0];
    }

    if (!found) {
      found = getDefaultRoom();
      rooms['room_main'] = found;
      saveRoomsToDisk(rooms);
    }

    return res.json(found);
  });

  // Create or update room
  app.put('/api/rooms/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    const incoming = req.body;

    if (!incoming || !incoming.config) {
      return res.status(400).json({ error: 'Invalid room payload' });
    }

    // Preserve existing submissions & registered students if not supplied
    const existing = rooms[id];
    if (existing) {
      if (!incoming.submissions || incoming.submissions.length === 0) {
        incoming.submissions = existing.submissions || [];
      }
      if (!incoming.registeredStudents || incoming.registeredStudents.length === 0) {
        incoming.registeredStudents = existing.registeredStudents || [];
      }
    }

    rooms[id] = incoming;
    saveRoomsToDisk(rooms);
    broadcastToClients(id, 'room_updated', incoming);
    return res.json({ success: true, room: rooms[id] });
  });

  // Register student joining via QR code
  app.post('/api/rooms/:id/register', (req: Request, res: Response) => {
    const id = req.params.id;
    let room =
      rooms[id] ||
      Object.values(rooms).find(
        (r) => r.config.id === id || r.config.code.replace(/\D/g, '') === id.replace(/\D/g, '')
      );

    const student = req.body;
    if (!student || !student.name) {
      return res.status(400).json({ error: 'Missing student name' });
    }

    if (!room) {
      room = getDefaultRoom();
      room.config.id = id;
      rooms[id] = room;
    }

    if (!room.registeredStudents) {
      room.registeredStudents = [];
    }

    const existingIdx = room.registeredStudents.findIndex(
      (s) => s.name.trim().toLowerCase() === student.name.trim().toLowerCase()
    );

    const registeredItem: RegisteredStudent = {
      id: student.id || 'reg_' + Date.now().toString(36),
      name: student.name.trim(),
      studentId: student.studentId?.trim(),
      joinedAt: Date.now(),
      status: student.status || 'waiting',
      moduleId: student.moduleId || (room.config.selectedModuleId as string) || 'all',
    };

    if (existingIdx >= 0) {
      room.registeredStudents[existingIdx] = {
        ...room.registeredStudents[existingIdx],
        ...registeredItem,
      };
    } else {
      room.registeredStudents.push(registeredItem);
    }

    saveRoomsToDisk(rooms);
    broadcastToClients(room.config.id, 'student_registered', {
      student: registeredItem,
      registeredStudents: room.registeredStudents,
    });

    return res.json({
      success: true,
      registeredStudents: room.registeredStudents,
      room,
    });
  });

  // Submit test answers
  app.post('/api/rooms/:id/submit', (req: Request, res: Response) => {
    const id = req.params.id;
    let room =
      rooms[id] ||
      Object.values(rooms).find(
        (r) => r.config.id === id || r.config.code.replace(/\D/g, '') === id.replace(/\D/g, '')
      );

    const sub = req.body;
    if (!sub || !sub.studentName) {
      return res.status(400).json({ error: 'Missing student data' });
    }

    if (!room) {
      room = getDefaultRoom();
      room.config.id = id;
      rooms[id] = room;
    }

    if (!room.submissions) room.submissions = [];
    if (!room.registeredStudents) room.registeredStudents = [];

    // Filter out previous submission from this student
    const existingIdx = room.submissions.findIndex(
      (s) => s.studentName.trim().toLowerCase() === sub.studentName.trim().toLowerCase()
    );

    if (existingIdx >= 0) {
      room.submissions[existingIdx] = sub;
    } else {
      room.submissions.push(sub);
    }

    // Update status in registeredStudents
    const regIdx = room.registeredStudents.findIndex(
      (s) => s.name.trim().toLowerCase() === sub.studentName.trim().toLowerCase()
    );
    if (regIdx >= 0) {
      room.registeredStudents[regIdx].status = 'submitted';
    }

    // Sort submissions: score desc, duration asc
    room.submissions.sort((a, b) => {
      if (b.percentage !== a.percentage) {
        return b.percentage - a.percentage;
      }
      return a.durationSeconds - b.durationSeconds;
    });

    room.submissions.forEach((item, index) => {
      item.rank = index + 1;
    });

    saveRoomsToDisk(rooms);
    broadcastToClients(room.config.id, 'new_submission', {
      submission: sub,
      submissions: room.submissions,
      registeredStudents: room.registeredStudents,
    });

    return res.json({ success: true, submissions: room.submissions, room });
  });

  // Reset room registrations / submissions
  app.post('/api/rooms/:id/reset', (req: Request, res: Response) => {
    const id = req.params.id;
    const room = rooms[id];
    if (room) {
      room.submissions = [];
      room.registeredStudents = [];
      saveRoomsToDisk(rooms);
      broadcastToClients(id, 'room_updated', room);
    }
    return res.json({ success: true });
  });

  // Keep-alive heartbeat for SSE connections
  setInterval(() => {
    for (let i = sseClients.length - 1; i >= 0; i--) {
      try {
        sseClients[i].res.write(': heartbeat\n\n');
      } catch {
        sseClients.splice(i, 1);
      }
    }
  }, 20000);

  // Serve static files in production or mount Vite in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
