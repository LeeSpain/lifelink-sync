export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface ClaraMessage {
  id: string;
  role: 'lee' | 'clara';
  content: string;
  timestamp: Date;
}
