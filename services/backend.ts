
import { User, Playlist, Song, Message } from '../types';
import { processInitialSongs } from './musicData';
import { saveFile, deleteFile, getFile } from './localMedia';

const STORAGE_KEY = 'smart_music_db_offline_v2';

interface DBSchema {
  users: (User & { password: string })[];
  playlists: Playlist[];
  likes: { userId: string; songId: number }[];
  songs: Song[];
  messages: Message[];
}

const getDB = (): DBSchema => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const adminUser = {
      id: 'admin_001',
      username: 'Lawrence (Admin)',
      email: 'lawreay1@gmail.com',
      password: 'lastBorn33.',
      role: 'admin' as const,
      avatar: '', 
      bio: 'Lead Developer & Admin of Smart Music'
    };

    const initial: DBSchema = { 
      users: [adminUser], 
      playlists: [], 
      likes: [],
      songs: [], // Start empty
      messages: []
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(stored);
};

const saveDB = (db: DBSchema) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

export const backend = {
  // --- AUTH ---
  signup: async (username: string, email: string, password: string): Promise<User> => {
    await new Promise(r => setTimeout(r, 200));
    const db = getDB();
    if (db.users.find(u => u.email === email)) {
      throw new Error("User already exists");
    }
    const newUser = { 
      id: Date.now().toString(), 
      username, 
      email, 
      password, 
      role: 'user' as const,
      avatar: '', 
      bio: 'Music lover'
    };
    db.users.push(newUser);
    saveDB(db);
    const { password: _, ...safeUser } = newUser;
    return safeUser;
  },

  login: async (email: string, password: string): Promise<User> => {
    await new Promise(r => setTimeout(r, 200));
    const db = getDB();
    const user = db.users.find(u => u.email === email && u.password === password);
    
    if (!user) throw new Error("Invalid credentials");
    if (user.isBlocked) throw new Error("Account blocked.");

    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  updateProfile: async (userId: string, updates: Partial<User>) => {
    const db = getDB();
    const idx = db.users.findIndex(u => u.id === userId);
    if (idx > -1) {
      db.users[idx] = { ...db.users[idx], ...updates };
      saveDB(db);
      const { password: _, ...safeUser } = db.users[idx];
      return safeUser;
    }
    throw new Error("User not found");
  },

  getUserById: (userId: string) => {
     const db = getDB();
     const user = db.users.find(u => u.id === userId);
     if(user) { const {password:_, ...u} = user; return u; }
     return undefined;
  },

  getAllUsers: () => getDB().users.map(({password, ...u}) => u),
  
  updateUserRole: async (id: string, role: any) => {
      const db = getDB();
      const u = db.users.find(x => x.id === id);
      if(u) { u.role = role; saveDB(db); }
  },

  toggleUserBlock: async (id: string) => {
      const db = getDB();
      const u = db.users.find(x => x.id === id);
      if(u && u.role !== 'admin') { u.isBlocked = !u.isBlocked; saveDB(db); }
  },

  adminResetPassword: async (id: string, pass: string) => {
      const db = getDB();
      const u = db.users.find(x => x.id === id);
      if(u) { u.password = pass; saveDB(db); }
  },

  addFakeLike: async (songId: number) => {
      const db = getDB();
      const fakeId = `fake_${Date.now()}`;
      db.likes.push({ userId: fakeId, songId });
      saveDB(db);
  },

  // --- OFFLINE SONGS ---
  getAllSongs: (): Song[] => {
    return getDB().songs;
  },

  // Resolve Blob URL for a "local:ID" string
  getMediaUrl: async (uri: string): Promise<string> => {
      if (!uri) return '';
      if (uri.startsWith('local:')) {
          const id = uri.split(':')[1];
          try {
            const blob = await getFile(id);
            if (blob) {
                return URL.createObjectURL(blob);
            }
          } catch(e) { console.error(e); }
          return '';
      }
      return uri;
  },

  saveSong: async (songData: Song, uploadedBy?: string, audioFile?: File, artFile?: File) => {
    const db = getDB();
    let songId = songData.id;
    
    // Generate ID if new (-1)
    if (songId === -1) {
        songId = Date.now();
    }

    let fileUri = songData.file;
    let artUri = songData.art;

    // Save Audio to IDB
    if (audioFile) {
        const audioId = `audio_${songId}`;
        await saveFile(audioId, audioFile);
        fileUri = `local:${audioId}`;
    }

    // Save Art to IDB
    if (artFile) {
        const artId = `art_${songId}`;
        await saveFile(artId, artFile);
        artUri = `local:${artId}`;
    }

    const newSong: Song = {
        ...songData,
        id: songId,
        file: fileUri,
        art: artUri,
        uploadedBy: uploadedBy || songData.uploadedBy
    };

    const idx = db.songs.findIndex(s => s.id === songId);
    if (idx > -1) {
        db.songs[idx] = newSong;
    } else {
        db.songs.push(newSong);
    }
    saveDB(db);
    return newSong;
  },

  deleteSong: async (songId: number) => {
    const db = getDB();
    const song = db.songs.find(s => s.id === songId);
    
    // Cleanup IDB
    if (song) {
        if (song.file.startsWith('local:')) await deleteFile(song.file.split(':')[1]);
        if (song.art.startsWith('local:')) await deleteFile(song.art.split(':')[1]);
    }

    db.songs = db.songs.filter(s => s.id !== songId);
    db.likes = db.likes.filter(l => l.songId !== songId);
    db.playlists.forEach(p => { p.songs = p.songs.filter(id => id !== songId); });
    saveDB(db);
  },

  getSongsUploadedByUser: (userId: string) => getDB().songs.filter(s => s.uploadedBy === userId),

  // --- PLAYLISTS ---
  createPlaylist: async (userId: string, name: string) => {
    const db = getDB();
    const p: Playlist = { id: Date.now().toString(), userId, name, songs: [], createdAt: Date.now() };
    db.playlists.push(p);
    saveDB(db);
    return p;
  },
  getUserPlaylists: (uid: string) => getDB().playlists.filter(p => p.userId === uid),
  addToPlaylist: async (pid: string, sid: number) => {
      const db = getDB();
      const p = db.playlists.find(x => x.id === pid);
      if(p && !p.songs.includes(sid)) { p.songs.push(sid); saveDB(db); }
  },
  
  // --- LIKES ---
  toggleLike: async (uid: string, sid: number) => {
      const db = getDB();
      const idx = db.likes.findIndex(l => l.userId === uid && l.songId === sid);
      let res = false;
      if (idx > -1) { db.likes.splice(idx, 1); } 
      else { db.likes.push({ userId: uid, songId: sid }); res = true; }
      saveDB(db);
      return res;
  },
  getLikedSongIds: (uid: string) => getDB().likes.filter(l => l.userId === uid).map(l => l.songId),
  getSongLikers: (sid: number) => {
      const db = getDB();
      const uids = db.likes.filter(l => l.songId === sid).map(l => l.userId);
      return db.users.filter(u => uids.includes(u.id)).map(({password, ...u}) => u);
  },

  // --- MESSAGES ---
  sendMessage: async (from: string, to: string, content: string) => {
      const db = getDB();
      db.messages.push({ id: Date.now().toString(), fromId: from, toId: to, content, read: false, timestamp: Date.now() });
      saveDB(db);
  },
  getUnreadCount: (uid: string) => getDB().messages.filter(m => m.toId === uid && !m.read).length,
  markMessagesAsRead: (uid: string, withUid: string) => {
      const db = getDB();
      let chg = false;
      db.messages.forEach(m => { if(m.toId === uid && m.fromId === withUid && !m.read) { m.read=true; chg=true; }});
      if(chg) saveDB(db);
  },
  getUserConversations: (uid: string) => {
      const db = getDB();
      const ids = new Set<string>();
      db.messages.filter(m => m.fromId === uid || m.toId === uid).forEach(m => ids.add(m.fromId === uid ? m.toId : m.fromId));
      return db.users.filter(u => ids.has(u.id)).map(({password, ...u}) => u);
  },
  getChatHistory: (uid1: string, uid2: string) => {
      const db = getDB();
      return db.messages.filter(m => (m.fromId === uid1 && m.toId === uid2) || (m.fromId === uid2 && m.toId === uid1)).sort((a,b)=>a.timestamp-b.timestamp);
  }
};
