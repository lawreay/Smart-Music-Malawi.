
import React from 'react';
import { User, Playlist, ViewState } from '../types';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  user: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  playlists: Playlist[];
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onCreatePlaylist: () => void;
  unreadCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  toggleSidebar, 
  user, 
  onLoginClick, 
  onLogoutClick,
  playlists,
  currentView,
  onChangeView,
  onCreatePlaylist,
  unreadCount
}) => {
  
  const isLibraryActive = currentView.type === 'library';
  const isLikedActive = currentView.type === 'liked';
  const isAdminActive = currentView.type === 'admin';
  const isProfileActive = currentView.type === 'profile';

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-40 w-64 border-r 
        bg-[var(--bg-sidebar)] border-[var(--border-color)] text-[var(--text-base)]
        transform transition-transform duration-300 ease-in-out theme-transition
        md:relative md:translate-x-0 flex flex-col p-5
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <i className="fas fa-music text-white text-lg"></i>
        </div>
        <h2 className="text-sm font-bold tracking-wide">SMART MUSIC MALAWI</h2>
        <button onClick={toggleSidebar} className="md:hidden ml-auto text-[var(--text-muted)]">
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* User Section */}
      <div className="mb-6 pb-6 border-b border-[var(--border-color)]">
        {user ? (
          <div className="flex flex-col gap-3">
            <div 
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors ${isProfileActive ? 'bg-[var(--bg-card)]' : ''}`}
              onClick={() => onChangeView({ type: 'profile' })}
            >
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border border-gray-600 object-cover"
              />
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">{user.username}</p>
                <p className="text-[10px] text-green-500 capitalize">{user.role === 'admin' ? 'Administrator' : 'Premium Member'}</p>
              </div>
            </div>
            
            <button onClick={onLogoutClick} className="text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors flex items-center gap-2 px-2">
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        ) : (
          <button 
            onClick={onLoginClick}
            className="w-full py-2 bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 border border-[var(--border-color)]"
          >
            <i className="fas fa-user-circle"></i> Sign In / Sign Up
          </button>
        )}
      </div>

      <nav className="space-y-2 flex-grow">
        <div 
          onClick={() => onChangeView({ type: 'library' })}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${isLibraryActive ? 'bg-[var(--bg-card)] border-l-4 border-blue-500' : 'text-[var(--text-muted)] hover:text-[var(--text-base)] hover:bg-[var(--bg-card-hover)]'}`}
        >
          <i className="fas fa-compact-disc w-5 text-center"></i>
          <span className="text-sm font-medium">Library</span>
        </div>
        
        <div 
          onClick={() => user ? onChangeView({ type: 'liked' }) : onLoginClick()}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${isLikedActive ? 'bg-[var(--bg-card)] border-l-4 border-pink-500' : 'text-[var(--text-muted)] hover:text-[var(--text-base)] hover:bg-[var(--bg-card-hover)]'}`}
        >
          <i className={`fas fa-heart w-5 text-center ${isLikedActive ? 'text-pink-500' : ''}`}></i>
          <span className="text-sm font-medium">Liked Songs</span>
        </div>
        
        {user && (
             <div 
             onClick={() => onChangeView({ type: 'profile' })}
             className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${isProfileActive && !isAdminActive ? 'bg-[var(--bg-card)] border-l-4 border-purple-500' : 'text-[var(--text-muted)] hover:text-[var(--text-base)] hover:bg-[var(--bg-card-hover)]'}`}
           >
             <div className="relative w-5 text-center">
                <i className="fas fa-envelope"></i>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
             </div>
             <span className="text-sm font-medium">Messages</span>
           </div>
        )}

        {user?.role === 'admin' && (
           <div 
           onClick={() => onChangeView({ type: 'admin' })}
           className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${isAdminActive ? 'bg-red-900/10 text-red-500 border-l-4 border-red-500' : 'text-red-400 hover:text-red-500 hover:bg-[var(--bg-card-hover)]'}`}
         >
           <i className="fas fa-shield-alt w-5 text-center"></i>
           <span className="text-sm font-medium">Admin Dashboard</span>
         </div>
        )}

        {/* Playlist Section */}
        <div className="mt-6">
            <div className="flex items-center justify-between mb-2 px-3">
            <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">Playlists</h3>
            <button 
                onClick={() => user ? onCreatePlaylist() : onLoginClick()}
                className="text-[var(--text-muted)] hover:text-[var(--text-base)] transition-colors"
                title="Create Playlist"
            >
                <i className="fas fa-plus-circle"></i>
            </button>
            </div>
            
            <div className="space-y-1 max-h-40 overflow-y-auto">
            {user ? (
                playlists.length > 0 ? (
                playlists.map(playlist => {
                    const isActive = currentView.type === 'playlist' && currentView.playlistId === playlist.id;
                    return (
                    <div 
                        key={playlist.id}
                        onClick={() => onChangeView({ type: 'playlist', playlistId: playlist.id })}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all group ${isActive ? 'bg-[var(--bg-card)]' : 'text-[var(--text-muted)] hover:text-[var(--text-base)] hover:bg-[var(--bg-card-hover)]'}`}
                    >
                        <i className={`fas fa-list-ul w-5 text-center text-xs group-hover:text-blue-400 ${isActive ? 'text-blue-500' : ''}`}></i>
                        <span className="text-sm truncate">{playlist.name}</span>
                    </div>
                    );
                })
                ) : (
                <p className="text-xs text-[var(--text-muted)] px-3 italic">No playlists yet.</p>
                )
            ) : (
                <p className="text-xs text-[var(--text-muted)] px-3 italic">Login to see playlists.</p>
            )}
            </div>
        </div>
      </nav>

      <div className="mt-auto pt-6 border-t border-[var(--border-color)]">
        <a 
            href="https://lawreay.github.io/portfolio/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center gap-3 p-3 bg-[var(--bg-card)] rounded-xl hover:shadow-lg transition-all border border-[var(--border-color)]"
        >
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                L
            </div>
            <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Developed By</p>
                <p className="text-xs font-bold group-hover:text-blue-500 transition-colors">Lawrence</p>
            </div>
            <i className="fas fa-external-link-alt text-[var(--text-muted)] text-xs ml-auto"></i>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
