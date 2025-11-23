
export interface Song {
  id: number;
  file: string;
  title: string;
  artist: string;
  art: string;
  album?: string;
  uploadedBy?: string; // ID of the user who uploaded it
}

export enum PlayMode {
  NORMAL = 'NORMAL',
  SHUFFLE = 'SHUFFLE',
  LOOP = 'LOOP',
  LOOP_ONE = 'LOOP_ONE'
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'premium';
  isBlocked?: boolean;
  avatar?: string;
  bio?: string;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  songs: number[]; // Array of song IDs
  createdAt: number;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  content: string;
  read: boolean;
  timestamp: number;
}

export type ViewState = 
  | { type: 'library' }
  | { type: 'liked' }
  | { type: 'playlist'; playlistId: string }
  | { type: 'admin' }
  | { type: 'profile' };
