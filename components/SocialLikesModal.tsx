
import React, { useEffect, useState } from 'react';
import { User, Song } from '../types';
import { backend } from '../services/backend';

interface SocialLikesModalProps {
  song: Song;
  onClose: () => void;
  onMessageUser: (user: User) => void;
  currentUser: User | null;
}

const SocialLikesModal: React.FC<SocialLikesModalProps> = ({ song, onClose, onMessageUser, currentUser }) => {
  const [likers, setLikers] = useState<User[]>([]);

  useEffect(() => {
    setLikers(backend.getSongLikers(song.id));
  }, [song.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in text-[var(--text-base)]">
      <div className="bg-[var(--bg-modal)] w-full max-w-sm rounded-xl border border-[var(--border-color)] shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-gradient-to-r from-pink-900/50 to-purple-900/50">
          <div>
            <h3 className="font-bold text-white">Liked By</h3>
            <p className="text-xs text-pink-200">{song.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-white"><i className="fas fa-times"></i></button>
        </div>
        
        <div className="max-h-60 overflow-y-auto p-2">
            {likers.length === 0 ? (
                <p className="text-center text-[var(--text-muted)] py-6 text-sm">Be the first to like this song!</p>
            ) : (
                likers.map(u => (
                    <div key={u.id} className="p-3 flex items-center justify-between rounded hover:bg-[var(--bg-card-hover)] group">
                        <div className="flex items-center gap-3">
                            <img src={u.avatar} className="w-8 h-8 rounded-full" alt="" />
                            <span className="text-sm font-medium">{u.username}</span>
                        </div>
                        {currentUser && currentUser.id !== u.id && (
                             <button 
                                onClick={() => { onMessageUser(u); onClose(); }}
                                className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:underline"
                            >
                                Message
                            </button>
                        )}
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default SocialLikesModal;
