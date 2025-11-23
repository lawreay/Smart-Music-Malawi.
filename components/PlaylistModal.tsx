
import React, { useState } from 'react';

interface PlaylistModalProps {
  onClose: () => void;
  onCreate: (name: string) => void;
}

const PlaylistModal: React.FC<PlaylistModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-[var(--text-base)]">
      <div className="bg-[var(--bg-modal)] w-full max-w-sm p-6 rounded-2xl shadow-2xl border border-[var(--border-color)]">
        <h3 className="text-xl font-bold mb-4">Create Playlist</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Playlist Name"
            className="w-full bg-[var(--bg-input)] border border-gray-700 rounded-lg p-3 text-[var(--text-base)] focus:border-blue-500 focus:outline-none mb-4"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-base)] transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
              disabled={!name.trim()}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaylistModal;
