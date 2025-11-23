
import React, { useState, useEffect } from 'react';
import { User, Message, Song } from '../types';
import { backend } from '../services/backend';

interface UserProfileProps {
  user: User;
  onUpdateUser: (u: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'inbox' | 'studio'>('settings');
  const [formData, setFormData] = useState({ username: user.username, bio: user.bio || '', avatar: user.avatar || '' });
  
  // Messaging
  const [conversations, setConversations] = useState<User[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Studio
  const [mySongs, setMySongs] = useState<Song[]>([]);
  const [editingSong, setEditingSong] = useState<Partial<Song> | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artFile, setArtFile] = useState<File | null>(null);

  useEffect(() => {
    if (activeTab === 'inbox') setConversations(backend.getUserConversations(user.id));
    if (activeTab === 'studio') setMySongs(backend.getSongsUploadedByUser(user.id));
  }, [activeTab]);

  useEffect(() => {
      if(activeChatUser) {
          backend.markMessagesAsRead(user.id, activeChatUser.id);
          setChatHistory(backend.getChatHistory(user.id, activeChatUser.id));
      }
  }, [activeChatUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await backend.updateProfile(user.id, formData);
    onUpdateUser(updated);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatUser || !newMessage.trim()) return;
    await backend.sendMessage(user.id, activeChatUser.id, newMessage);
    setNewMessage('');
    setChatHistory(backend.getChatHistory(user.id, activeChatUser.id));
  };

  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSong && editingSong.title) {
        const songToSave: Song = {
            id: editingSong.id || -1,
            title: editingSong.title,
            artist: editingSong.artist || user.username,
            file: '', art: ''
        };
        await backend.saveSong(songToSave, user.id, audioFile || undefined, artFile || undefined);
        setEditingSong(null);
        setAudioFile(null);
        setArtFile(null);
        setMySongs(backend.getSongsUploadedByUser(user.id));
        alert("Upload successful!");
    }
  };

  return (
    <div className="p-6 md:p-10 text-[var(--text-base)] pb-32 max-w-5xl mx-auto min-h-full">
        <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-2xl font-bold">{user.username[0]}</div>
            <div>
                <h1 className="text-3xl font-bold">{user.username}</h1>
                <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">{user.role} Member</span>
            </div>
        </div>

        <div className="flex border-b border-[var(--border-color)] mb-6">
            <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 font-medium ${activeTab === 'settings' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-[var(--text-muted)]'}`}>Settings</button>
            <button onClick={() => setActiveTab('inbox')} className={`px-6 py-3 font-medium ${activeTab === 'inbox' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-[var(--text-muted)]'}`}>Messages</button>
            {(user.role === 'premium' || user.role === 'admin') && <button onClick={() => setActiveTab('studio')} className={`px-6 py-3 font-medium ${activeTab === 'studio' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-[var(--text-muted)]'}`}>Studio</button>}
        </div>

        {activeTab === 'settings' && (
            <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] max-w-xl">
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <input className="w-full bg-[var(--bg-input)] border border-gray-700 rounded p-3" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="Username" />
                    <textarea className="w-full bg-[var(--bg-input)] border border-gray-700 rounded p-3 h-24" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Bio" />
                    <button className="bg-blue-600 px-6 py-2 rounded text-white font-bold">Update Profile</button>
                </form>
            </div>
        )}

        {activeTab === 'inbox' && (
            <div className="bg-[var(--bg-card)] rounded-2xl h-[500px] flex border border-[var(--border-color)]">
                <div className="w-1/3 border-r border-[var(--border-color)] overflow-y-auto">
                    {conversations.map(c => (
                        <div key={c.id} onClick={() => setActiveChatUser(c)} className={`p-4 hover:bg-[var(--bg-card-hover)] cursor-pointer ${activeChatUser?.id === c.id ? 'bg-blue-900/30' : ''}`}>
                            <div className="font-bold">{c.username}</div>
                        </div>
                    ))}
                    {conversations.length === 0 && <p className="p-4 text-[var(--text-muted)]">No conversations.</p>}
                </div>
                <div className="flex-1 flex flex-col">
                    {activeChatUser ? (
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col-reverse">
                                {[...chatHistory].reverse().map(m => (
                                    <div key={m.id} className={`p-2 rounded max-w-[80%] ${m.fromId === user.id ? 'bg-blue-600 self-end text-white' : 'bg-gray-700 self-start'}`}>{m.content}</div>
                                ))}
                            </div>
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--border-color)] flex gap-2">
                                <input className="flex-1 bg-[var(--bg-input)] border border-gray-600 rounded px-3 py-2" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Message..." />
                                <button className="bg-blue-600 px-4 rounded text-white"><i className="fas fa-paper-plane"></i></button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">Select a chat</div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'studio' && (
            <div>
                <button onClick={() => { setEditingSong({}); setAudioFile(null); setArtFile(null); }} className="bg-purple-600 px-4 py-2 rounded text-white font-bold mb-4"><i className="fas fa-upload mr-2"></i> Upload Song</button>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mySongs.map(s => (
                        <div key={s.id} className="bg-[var(--bg-card)] p-4 rounded border border-[var(--border-color)]">
                            <div className="font-bold">{s.title}</div>
                            <div className="text-xs text-[var(--text-muted)]">{s.artist}</div>
                        </div>
                    ))}
                </div>
                {editingSong && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <div className="bg-[var(--bg-modal)] p-6 rounded-xl w-full max-w-lg border border-[var(--border-color)]">
                            <h3 className="font-bold mb-4">Upload</h3>
                            <form onSubmit={handleSaveSong} className="space-y-4">
                                <input className="w-full bg-[var(--bg-input)] border border-gray-700 rounded p-2" placeholder="Title" value={editingSong.title || ''} onChange={e => setEditingSong({...editingSong, title: e.target.value})} required />
                                <input className="w-full bg-[var(--bg-input)] border border-gray-700 rounded p-2" placeholder="Artist" value={editingSong.artist || ''} onChange={e => setEditingSong({...editingSong, artist: e.target.value})} />
                                <div><label className="text-xs text-[var(--text-muted)]">Audio File</label><input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} required /></div>
                                <div><label className="text-xs text-[var(--text-muted)]">Cover Art</label><input type="file" accept="image/*" onChange={e => setArtFile(e.target.files?.[0] || null)} /></div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => setEditingSong(null)} className="text-[var(--text-muted)]">Cancel</button>
                                    <button className="bg-purple-600 px-4 py-2 rounded text-white font-bold">Upload</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};
export default UserProfile;
