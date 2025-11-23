
import React, { useState, useEffect } from 'react';
import { Song, PlayMode, PlayerState, User } from '../types';
import { backend } from '../services/backend';

interface PlayerBarProps {
  currentSong: Song | null;
  onNext: () => void;
  onPrev: () => void;
  onPlayPause: () => void;
  playMode: PlayMode;
  toggleMode: () => void;
  playerState: PlayerState;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  isLiked: boolean;
  onToggleLike: () => void;
  user: User | null;
  onShowLikes: () => void;
}

const formatTime = (time: number) => {
  if (isNaN(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const PlayerBar: React.FC<PlayerBarProps> = ({
  currentSong, onNext, onPrev, onPlayPause, playMode, toggleMode, playerState, onSeek, onVolumeChange, isLiked, onToggleLike, user, onShowLikes
}) => {
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if(currentSong) setLikeCount(backend.getSongLikers(currentSong.id).length);
  }, [currentSong?.id, isLiked]); 

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[90px] bg-[var(--bg-header)] backdrop-blur-md border-t border-[var(--border-color)] flex items-center justify-between px-4 md:px-8 z-50 text-[var(--text-base)] theme-transition">
      
      <div className="flex items-center w-1/4 min-w-[140px]">
        <img src={currentSong.art || 'https://via.placeholder.com/60'} alt="Art" className="w-14 h-14 rounded-md object-cover mr-4 bg-gray-800 shadow-md" />
        <div className="overflow-hidden mr-4">
          <h4 className="text-sm font-semibold truncate hover:text-blue-400 cursor-pointer">{currentSong.title}</h4>
          <p className="text-xs text-[var(--text-muted)] truncate">{currentSong.artist}</p>
        </div>
        <div className="flex flex-col items-center">
            <button onClick={onToggleLike} className={`text-lg transition-transform active:scale-90 ${isLiked ? 'text-pink-500' : 'text-[var(--text-muted)] hover:text-[var(--text-base)]'}`} title={user ? (isLiked ? "Remove Like" : "Like") : "Login to Like"}>
                <i className={`${isLiked ? 'fas' : 'far'} fa-heart`}></i>
            </button>
            <button onClick={onShowLikes} className="text-[10px] text-[var(--text-muted)] hover:text-blue-400 mt-[-2px]">{likeCount} likes</button>
        </div>
      </div>

      <div className="flex flex-col items-center w-2/4 max-w-xl">
        <div className="flex items-center gap-6 mb-1">
          <button onClick={toggleMode} className={`text-lg transition-colors ${playMode !== PlayMode.NORMAL ? 'text-blue-500' : 'text-[var(--text-muted)] hover:text-[var(--text-base)]'}`}>
            <i className={`fas ${playMode === PlayMode.SHUFFLE ? 'fa-random' : playMode === PlayMode.LOOP ? 'fa-redo' : 'fa-random'}`}></i>
          </button>
          <button onClick={onPrev} className="text-[var(--text-muted)] hover:text-[var(--text-base)] text-xl"><i className="fas fa-step-backward"></i></button>
          <button onClick={onPlayPause} className="w-10 h-10 rounded-full bg-[var(--text-base)] hover:opacity-90 text-[var(--bg-app)] flex items-center justify-center shadow-lg"><i className={`fas ${playerState.isPlaying ? 'fa-pause' : 'fa-play ml-1'}`}></i></button>
          <button onClick={onNext} className="text-[var(--text-muted)] hover:text-[var(--text-base)] text-xl"><i className="fas fa-step-forward"></i></button>
          <button className="text-[var(--text-muted)] hover:text-[var(--text-base)] text-lg"><i className="fas fa-redo text-xs opacity-50"></i></button>
        </div>
        <div className="w-full flex items-center gap-3 text-[10px] md:text-xs text-[var(--text-muted)] font-medium font-mono">
          <span className="w-8 text-right">{formatTime(playerState.currentTime)}</span>
          <div className="relative flex-grow h-1 bg-gray-600 rounded-full cursor-pointer">
             <div className="absolute h-full bg-blue-500 rounded-full" style={{ width: `${(playerState.currentTime / (playerState.duration || 1)) * 100}%` }}></div>
             <input type="range" min="0" max={playerState.duration || 100} value={playerState.currentTime} onChange={(e) => onSeek(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
          <span className="w-8">{formatTime(playerState.duration)}</span>
        </div>
      </div>

      <div className="w-1/4 flex items-center justify-end gap-3 md:gap-4">
        <div className="flex items-center gap-2 group w-24 md:w-32">
            <i className={`fas ${playerState.volume === 0 ? 'fa-volume-mute text-red-400' : 'fa-volume-up text-[var(--text-muted)]'}`}></i>
            <div className="relative flex-grow h-1 bg-gray-600 rounded-full">
                <div className="absolute h-full bg-gray-400 group-hover:bg-blue-500 rounded-full" style={{ width: `${playerState.volume * 100}%` }}></div>
                <input type="range" min="0" max="1" step="0.01" value={playerState.volume} onChange={(e) => onVolumeChange(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
        </div>
      </div>
    </div>
  );
};
export default PlayerBar;
