export interface User {
  id: string;
  name: string;
  color: string;
}

export type ElementType = 'path' | 'text' | 'image';

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  color?: string;
  brushSize?: number;
  content?: string; // For text content or image base64
  points?: {x: number, y: number}[]; // For brush paths
  width?: number;
  height?: number;
  authorId: string;
}

export interface Resolution {
  id: string;
  text: string;
  note?: string; 
  authorId: string;
  isFree?: boolean;
  gridIndex?: number; 
}

export type GamePhase = 'HOME' | 'CREATE' | 'EDIT' | 'PLAY';

export interface GameSession {
  id: string;
  name: string;
  totalUsers: number;
  gridSize: number; 
  users: User[];
  resolutions: Resolution[]; 
  checks: Record<string, string[]>; 
  phase: GamePhase;
  createdAt: number;
  backgroundElements: CanvasElement[];
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}