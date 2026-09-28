import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RoomStoreItem {
  config: {
    id: string;
    code: string;
    title: string;
    durationMinutes: number;
    passPercentage: number;
    [key: string]: unknown;
  };
  questions?: unknown[];
  registeredStudents?: Array<{
    id: string;
    name: string;
    studentId?: string;
    joinedAt: number;
    status?: string;
    moduleId?: string;
    [key: string]: unknown;
  }>;
  submissions: Array<{
    id: string;
    studentName: string;
    percentage: number;
    durationSeconds: number;
    rank?: number;
    [key: string]: unknown;
  }>;
}

const rooms: Record<string, RoomStoreItem> = {};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // Get all rooms
  app.get('/api/rooms', (_req: Request, res: Response) => {
    res.json(Object.values(rooms));
  });

  // Get specific room
  app.get('/api/rooms/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    const room =
      rooms[id] ||
      Object.values(rooms).find(
        (r) => r.config.code.replace(/\D/g, '') === id.replace(/\D/g, '') || r.config.id === id
      );
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    return res.json(room);
  });

  // Create or update room
  app.put('/api/rooms/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    rooms[id] = req.body;
    return res.json({ success: true, room: rooms[id] });
  });

  // Register student joining via QR code
  app.post('/api/rooms/:id/register', (req: Request, res: Response) => {
    const id = req.params.id;
    let room =
      rooms[id] ||
      Object.values(rooms).find(
        (r) => r.config.code.replace(/\D/g, '') === id.replace(/\D/g, '') || r.config.id === id
      );

    const student = req.body;
    if (!student || !student.name) {
      return res.status(400).json({ error: 'Missing student name' });
    }

    if (!room) {
      room = {
        config: {
          id,
          code: id,
          title: 'Quiz Room',
          durationMinutes: 5,
          passPercentage: 60,
        },
        submissions: [],
        registeredStudents: [],
      };
      rooms[id] = room;
    }

    if (!room.registeredStudents) {
      room.registeredStudents = [];
    }

    const existingIdx = room.registeredStudents.findIndex(
      (s) => s.name.trim().toLowerCase() === student.name.trim().toLowerCase()
    );

    if (existingIdx >= 0) {
      room.registeredStudents[existingIdx] = {
        ...room.registeredStudents[existingIdx],
        ...student,
        joinedAt: Date.now(),
      };
    } else {
      room.registeredStudents.push({
        id: student.id || 'reg_' + Date.now(),
        name: student.name.trim(),
        studentId: student.studentId?.trim(),
        joinedAt: Date.now(),
        status: student.status || 'waiting',
        moduleId: student.moduleId || 'all',
      });
    }

    return res.json({ success: true, registeredStudents: room.registeredStudents });
  });

  // Submit test answers
  app.post('/api/rooms/:id/submit', (req: Request, res: Response) => {
    const id = req.params.id;
    let room =
      rooms[id] ||
      Object.values(rooms).find(
        (r) => r.config.code.replace(/\D/g, '') === id.replace(/\D/g, '') || r.config.id === id
      );

    const sub = req.body;
    if (!sub || !sub.studentName) {
      return res.status(400).json({ error: 'Missing student data' });
    }

    if (!room) {
      room = {
        config: {
          id,
          code: id,
          title: 'Quiz Room',
          durationMinutes: 5,
          passPercentage: 60,
        },
        submissions: [],
      };
      rooms[id] = room;
    }

    const existingIdx = room.submissions.findIndex(
      (s) => s.studentName.trim().toLowerCase() === sub.studentName.trim().toLowerCase()
    );

    if (existingIdx >= 0) {
      room.submissions[existingIdx] = sub;
    } else {
      room.submissions.push(sub);
    }

    // Sort submissions for leaderboard: score desc, duration asc
    room.submissions.sort((a, b) => {
      if (b.percentage !== a.percentage) {
        return b.percentage - a.percentage;
      }
      return a.durationSeconds - b.durationSeconds;
    });

    room.submissions.forEach((item, index) => {
      item.rank = index + 1;
    });

    return res.json({ success: true, submissions: room.submissions });
  });

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
