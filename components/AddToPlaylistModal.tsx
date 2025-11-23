
import React from 'react';
import { Playlist } from '../types';

interface AddToPlaylistModalProps {
  playlists: Playlist[];
  onClose: () => void;
  onSelect: (playlistId: string) => void;
  onCreateNew: () => void;
}

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ playlists, onClose, onSelect, onCreateNew }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-[var(--text-base)]">
      <div className="bg-[var(--bg-modal)] w-full max-w-sm rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center">
          <h3 className="text-lg font-bold">Add to Playlist</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-base)]"><i className="fas fa-times"></i></button>
        </div>
        
        <div className="max-h-60 overflow-y-auto p-2">
            <button 
                onClick={onCreateNew}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-[var(--bg-card-hover)] text-blue-400 hover:text-blue-300 font-medium transition-colors flex items-center gap-3"
            >
                <div className="w-10 h-10 bg-blue-500/10 rounded flex items-center justify-center"><i className="fas fa-plus"></i></div>
                New Playlist
            </button>
            
            {playlists.map(p => (
                <button 
                    key={p.id}
                    onClick={() => onSelect(p.id)}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-base)] transition-colors flex items-center gap-3"
                >
                    <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center"><i className="fas fa-music text-gray-400"></i></div>
                    {p.name}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AddToPlaylistModal;
