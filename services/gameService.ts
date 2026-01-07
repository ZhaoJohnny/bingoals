import { GameSession, User, Resolution, ValidationResult, CanvasElement } from '../types';

// Constants
const STORAGE_KEY_PREFIX = 'bingo_session_';

// Helpers
export const generateId = () => Math.random().toString(36).substr(2, 9);

export const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// Logic
export const validateConfig = (totalUsers: number): ValidationResult => {
  if (!totalUsers || totalUsers < 1) {
    return { valid: false, message: "Need at least 1 user." };
  }
  return { valid: true };
};

export const createSession = (name: string, totalUsers: number, creatorName: string): GameSession => {
  let gridSize = 5;
  if (totalUsers > 5) {
    if (totalUsers % 2 === 0) {
      gridSize = totalUsers + 1;
    } else {
      gridSize = totalUsers + 2;
    }
  }
  
  const creator: User = {
    id: generateId(),
    name: creatorName,
    color: stringToColor(creatorName)
  };

  const session: GameSession = {
    id: generateId(),
    name,
    totalUsers,
    gridSize,
    users: [creator],
    resolutions: [],
    checks: { [creator.id]: [] },
    phase: 'EDIT',
    createdAt: Date.now(),
    backgroundElements: [],
  };

  saveSession(session);
  return session;
};

export const saveSession = (session: GameSession) => {
  localStorage.setItem(STORAGE_KEY_PREFIX + session.id, JSON.stringify(session));
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEY_PREFIX + session.id,
    newValue: JSON.stringify(session)
  }));
};

export const loadSession = (id: string): GameSession | null => {
  const data = localStorage.getItem(STORAGE_KEY_PREFIX + id);
  return data ? JSON.parse(data) : null;
};

export const joinSession = (session: GameSession, userName: string): GameSession => {
  const existing = session.users.find(u => u.name.toLowerCase() === userName.toLowerCase());
  if (existing) return session;

  const newUser: User = {
    id: generateId(),
    name: userName,
    color: stringToColor(userName)
  };

  const updated: GameSession = {
    ...session,
    users: [...session.users, newUser],
    checks: { ...session.checks, [newUser.id]: [] }
  };
  
  saveSession(updated);
  return updated;
};

export const addResolution = (session: GameSession, text: string, authorId: string, note?: string): GameSession => {
  const totalSquares = session.gridSize * session.gridSize;
  const centerIndex = Math.floor(totalSquares / 2);
  const maxResolutions = totalSquares - 1;

  if (session.resolutions.length >= maxResolutions) {
    return session;
  }

  const occupiedIndices = new Set(session.resolutions.map(r => r.gridIndex));
  const availableIndices = [];
  
  for (let i = 0; i < totalSquares; i++) {
    if (i !== centerIndex && !occupiedIndices.has(i)) {
      availableIndices.push(i);
    }
  }

  if (availableIndices.length === 0) return session;

  const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];

  const newRes: Resolution = {
    id: generateId(),
    text,
    note,
    authorId,
    gridIndex: randomIndex
  };

  const updated = {
    ...session,
    resolutions: [...session.resolutions, newRes]
  };
  saveSession(updated);
  return updated;
};

export const updateResolutionNote = (session: GameSession, resolutionId: string, newNote: string): GameSession => {
  const updatedResolutions = session.resolutions.map(r => 
    r.id === resolutionId ? { ...r, note: newNote } : r
  );
  
  const updated = {
    ...session,
    resolutions: updatedResolutions
  };
  saveSession(updated);
  return updated;
};

export const updateBackground = (session: GameSession, elements: CanvasElement[]): GameSession => {
  const updated = {
    ...session,
    backgroundElements: elements
  };
  saveSession(updated);
  return updated;
};

export const clearBackground = (session: GameSession): GameSession => {
  const updated = {
    ...session,
    backgroundElements: []
  };
  saveSession(updated);
  return updated;
};

export const toggleCheck = (session: GameSession, userId: string, resolutionId: string): GameSession => {
  const userChecks = session.checks[userId] || [];
  const isChecked = userChecks.includes(resolutionId);
  
  const newChecks = isChecked
    ? userChecks.filter(id => id !== resolutionId)
    : [...userChecks, resolutionId];

  const updated = {
    ...session,
    checks: { ...session.checks, [userId]: newChecks }
  };
  saveSession(updated);
  return updated;
};

export const finalizeBoard = (session: GameSession): GameSession => {
  let cleanResolutions = session.resolutions.filter(r => !r.isFree);
  cleanResolutions = cleanResolutions.sort(() => 0.5 - Math.random());
  
  const totalSquares = session.gridSize * session.gridSize;
  const centerIndex = Math.floor(totalSquares / 2);
  
  const finalizedResolutions: Resolution[] = [];
  let resIndex = 0;
  
  for (let i = 0; i < totalSquares; i++) {
    if (i === centerIndex) {
      finalizedResolutions.push({
        id: 'FREE',
        text: 'FREE',
        authorId: 'SYSTEM',
        isFree: true,
        gridIndex: i
      });
    } else {
      if (resIndex < cleanResolutions.length) {
        finalizedResolutions.push({
          ...cleanResolutions[resIndex],
          gridIndex: i
        });
        resIndex++;
      }
    }
  }

  const updated: GameSession = {
    ...session,
    resolutions: finalizedResolutions,
    phase: 'PLAY'
  };
  saveSession(updated);
  return updated;
};

export const revertToEdit = (session: GameSession): GameSession => {
  const editResolutions = session.resolutions.filter(r => !r.isFree);
  const updated: GameSession = {
    ...session,
    resolutions: editResolutions,
    phase: 'EDIT'
  };
  saveSession(updated);
  return updated;
};