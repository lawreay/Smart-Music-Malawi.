
import React, { useState, useEffect } from 'react';
import { User, Song } from '../types';
import { backend } from '../services/backend';

interface AdminDashboardProps {
  currentUser: User;
  songs: Song[];
  onSongUpdate: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, songs, onSongUpdate }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'music'>('users');
  const [users, setUsers] = useState<User[]>([]);
  
  const [editingSong, setEditingSong] = useState<Partial<Song> | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artFile, setArtFile] = useState<File | null>(null);
  const [msgInput, setMsgInput] = useState<{ userId: string, text: string } | null>(null);

  useEffect(() => { loadUsers(); }, []);
  const loadUsers = () => { setUsers(backend.getAllUsers()); };

  const handleBlockUser = async (uid: string) => { await backend.toggleUserBlock(uid); loadUsers(); };
  const handleRoleChange = async (uid: string, r: string) => { await backend.updateUserRole(uid, r); loadUsers(); };
  
  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSong && editingSong.title) {
        const songToSave: Song = {
            id: editingSong.id || -1,
            title: editingSong.title,
            artist: editingSong.artist || 'Unknown',
            file: editingSong.file || '', 
            art: editingSong.art || ''
        };
        // Pass file objects for offline storage
        await backend.saveSong(songToSave, currentUser.id, audioFile || undefined, artFile || undefined);
        setEditingSong(null);
        setAudioFile(null);
        setArtFile(null);
        onSongUpdate();
    }
  };

  const handleDeleteSong = async (id: number) => {
    if (confirm("Delete this song?")) { await backend.deleteSong(id); onSongUpdate(); }
  };

  const handleAddFakeLike = async (id: number) => {
      const countStr = prompt("How many fake likes?", "1");
      if(countStr) {
          const c = parseInt(countStr);
          for(let i=0; i<c; i++) await backend.addFakeLike(id);
          onSongUpdate();
      }
  };

  return (
    <div className="p-6 md:p-10 text-[var(--text-base)] min-h-full pb-32">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <i className="fas fa-shield-alt text-red-500"></i> Admin Dashboard
      </h1>

      <div className="flex gap-4 mb-8 border-b border-[var(--border-color)] pb-1">
        <button onClick={() => setActiveTab('users')} className={`pb-2 px-4 font-medium ${activeTab === 'users' ? 'text-red-400 border-b-2 border-red-400' : 'text-[var(--text-muted)]'}`}>Users</button>
        <button onClick={() => setActiveTab('music')} className={`pb-2 px-4 font-medium ${activeTab === 'music' ? 'text-red-400 border-b-2 border-red-400' : 'text-[var(--text-muted)]'}`}>Music</button>
      </div>

      {activeTab === 'users' && (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-card-hover)] text-[var(--text-muted)]">
              <tr><th className="p-4">User</th><th className="p-4">Role</th><th className="p-4">Actions</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="hover:bg-[var(--bg-card-hover)] border-t border-[var(--border-color)]">
                  <td className="p-4 font-bold">{u.username} <div className="text-xs font-normal opacity-50">{u.email}</div></td>
                  <td className="p-4">
                    {u.id === currentUser.id ? <span className="text-red-400">ADMIN</span> : (
                        <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} className="bg-[var(--bg-input)] rounded border border-gray-600 px-2 py-1">
                            <option value="user">User</option><option value="premium">Premium</option><option value="admin">Admin</option>
                        </select>
                    )}
                  </td>
                  <td className="p-4 flex gap-2">
                    {u.id !== currentUser.id && (
                        <button onClick={() => handleBlockUser(u.id)} className={`p-2 rounded ${u.isBlocked ? 'text-green-400' : 'text-red-400'}`}><i className={`fas ${u.isBlocked ? 'fa-unlock' : 'fa-ban'}`}></i></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'music' && (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Offline Library ({songs.length})</h3>
                <button onClick={() => { setEditingSong({}); setAudioFile(null); setArtFile(null); }} className="bg-green-600 px-4 py-2 rounded text-white font-bold"><i className="fas fa-plus"></i> Import Song</button>
            </div>
            <div className="grid gap-4">
                {songs.map(song => (
                    <div key={song.id} className="bg-[var(--bg-card)] p-3 rounded-lg flex justify-between items-center border border-[var(--border-color)]">
                        <div>
                            <div className="font-bold">{song.title}</div>
                            <div className="text-xs text-[var(--text-muted)]">{song.artist}</div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleAddFakeLike(song.id)} className="p-2 text-pink-500 rounded"><i className="fas fa-heart"></i>+</button>
                            <button onClick={() => handleDeleteSong(song.id)} className="p-2 text-red-400 hover:bg-[var(--bg-card-hover)] rounded"><i className="fas fa-trash"></i></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {editingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[var(--bg-modal)] p-6 rounded-xl w-full max-w-lg border border-[var(--border-color)]">
                <h3 className="text-lg font-bold mb-4">{editingSong.id ? 'Edit Song' : 'Import New Song'}</h3>
                <form onSubmit={handleSaveSong} className="space-y-4">
                    <input className="w-full bg-[var(--bg-input)] border border-gray-700 rounded p-2" placeholder="Title" value={editingSong.title || ''} onChange={e => setEditingSong({...editingSong, title: e.target.value})} required />
                    <input className="w-full bg-[var(--bg-input)] border border-gray-700 rounded p-2" placeholder="Artist" value={editingSong.artist || ''} onChange={e => setEditingSong({...editingSong, artist: e.target.value})} required />
                    
                    <div>
                        <label className="block text-xs text-[var(--text-muted)] mb-1">Audio File (MP3/WAV)</label>
                        <input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} className="w-full text-sm text-[var(--text-muted)]" required={!editingSong.id} />
                    </div>
                    <div>
                        <label className="block text-xs text-[var(--text-muted)] mb-1">Cover Art (Image)</label>
                        <input type="file" accept="image/*" onChange={e => setArtFile(e.target.files?.[0] || null)} className="w-full text-sm text-[var(--text-muted)]" />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setEditingSong(null)} className="text-[var(--text-muted)]">Cancel</button>
                        <button type="submit" className="bg-green-600 px-6 py-2 rounded text-white font-bold">Save to Library</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
export default AdminDashboard;
