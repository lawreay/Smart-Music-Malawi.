
import React, { useState, useEffect, useRef } from 'react';
import { Song, PlayMode, PlayerState, User, Playlist, ViewState } from './types';
import { backend } from './services/backend';
import Sidebar from './components/Sidebar';
import PlayerBar from './components/PlayerBar';
import AuthModal from './components/AuthModal';
import PlaylistModal from './components/PlaylistModal';
import AddToPlaylistModal from './components/AddToPlaylistModal';
import AdminDashboard from './components/AdminDashboard';
import UserProfile from './components/UserProfile';
import SocialLikesModal from './components/SocialLikesModal';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

const App: React.FC = () => {
  // Data
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [displayedSongs, setDisplayedSongs] = useState<Song[]>([]);
  const [resolvedImages, setResolvedImages] = useState<Record<number, string>>({});
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  // User & Persistence
  const [user, setUser] = useState<User | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [likedSongIds, setLikedSongIds] = useState<number[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [playMode, setPlayMode] = useState<PlayMode>(PlayMode.NORMAL);
  const [viewState, setViewState] = useState<ViewState>({ type: 'library' });
  const [headerInfo, setHeaderInfo] = useState({ title: "Local Library", desc: "Offline Music" });
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showMsgPopup, setShowMsgPopup] = useState(false);
  
  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState<{ isOpen: boolean, songId: number | null }>({ isOpen: false, songId: null });
  const [showSocialLikes, setShowSocialLikes] = useState<Song | null>(null);

  // Player State
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const isMobile = useIsMobile();
  const currentSong = queue[currentIndex] || null;
  const [currentArtUrl, setCurrentArtUrl] = useState('');

  // --- INITIALIZATION ---
  const refreshSongs = async () => {
    const dbSongs = backend.getAllSongs();
    setAllSongs(dbSongs);
    if (viewState.type === 'library') {
        setDisplayedSongs(dbSongs);
    }
    // Resolve images asynchronously
    const imgMap: Record<number, string> = {};
    for (const s of dbSongs) {
        if (s.art && s.art.startsWith('local:')) {
            imgMap[s.id] = await backend.getMediaUrl(s.art);
        } else {
            imgMap[s.id] = s.art || 'https://via.placeholder.com/150';
        }
    }
    setResolvedImages(imgMap);
  };

  useEffect(() => {
    refreshSongs();
    document.body.classList.remove('light-mode');
  }, []);

  useEffect(() => {
    if (theme === 'light') document.body.classList.add('light-mode');
    else document.body.classList.remove('light-mode');
  }, [theme]);

  // Message Polling
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
        const count = backend.getUnreadCount(user.id);
        if (count > unreadCount) {
            setShowMsgPopup(true);
            setTimeout(() => setShowMsgPopup(false), 3000);
        }
        setUnreadCount(count);
    }, 5000);
    return () => clearInterval(interval);
  }, [user, unreadCount]);

  // --- VIEW LOGIC ---
  useEffect(() => {
    let filtered = allSongs;

    if (viewState.type === 'admin') {
        setHeaderInfo({ title: "Admin Dashboard", desc: "System Management" });
        return;
    }
    if (viewState.type === 'profile') {
        setHeaderInfo({ title: "Profile", desc: "Account & Messages" });
        return;
    }

    if (viewState.type === 'liked') {
      filtered = allSongs.filter(s => likedSongIds.includes(s.id));
      setHeaderInfo({ title: "Liked Songs", desc: `${filtered.length} songs` });
    } else if (viewState.type === 'playlist' && viewState.playlistId) {
      const playlist = userPlaylists.find(p => p.id === viewState.playlistId);
      if (playlist) {
        filtered = allSongs.filter(s => playlist.songs.includes(s.id));
        setHeaderInfo({ title: playlist.name, desc: `Custom Playlist • ${filtered.length} songs` });
      } else {
        setViewState({ type: 'library' });
      }
    } else {
      setHeaderInfo({ title: "Local Library", desc: "All Offline Tracks" });
    }

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
          s.title.toLowerCase().includes(lower) || 
          s.artist.toLowerCase().includes(lower)
      );
    }
    setDisplayedSongs(filtered);
  }, [viewState, searchQuery, allSongs, likedSongIds, userPlaylists]);

  // Update current art when song changes
  useEffect(() => {
    const updateArt = async () => {
        if(currentSong) {
            const url = await backend.getMediaUrl(currentSong.art);
            setCurrentArtUrl(url || 'https://via.placeholder.com/150');
        }
    };
    updateArt();
  }, [currentSong]);


  // --- PLAYER HANDLERS ---
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setPlayerState(prev => ({
        ...prev,
        currentTime: audioRef.current?.currentTime || 0,
        duration: audioRef.current?.duration || 0
      }));
    }
  };

  const handleEnded = () => {
    if (playMode === PlayMode.LOOP_ONE) {
      audioRef.current?.play();
    } else {
      playNext();
    }
  };

  const loadAndPlay = async (index: number, newQueue?: Song[]) => {
    const targetQueue = newQueue || queue;
    if (index < 0 || index >= targetQueue.length) return;

    setCurrentIndex(index);
    if(newQueue) setQueue(newQueue);

    const song = targetQueue[index];
    if (audioRef.current) {
      // Resolve URL if local
      const src = await backend.getMediaUrl(song.file);
      audioRef.current.src = src;
      audioRef.current.load();
      try {
        await audioRef.current.play();
        setPlayerState(prev => ({ ...prev, isPlaying: true }));
      } catch (err) {
        console.error("Playback failed", err);
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
      }
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (playerState.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const playNext = () => {
    let nextIndex = currentIndex + 1;
    if (playMode === PlayMode.SHUFFLE) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      if (playMode === PlayMode.LOOP) nextIndex = 0;
      else return; 
    }
    loadAndPlay(nextIndex);
  };

  const playPrev = () => {
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = queue.length - 1;
    loadAndPlay(prevIndex);
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setPlayerState(prev => ({ ...prev, currentTime: time }));
    }
  };

  // --- USER ACTIONS ---
  const handleLogin = (u: User) => {
    setUser(u);
    setLikedSongIds(backend.getLikedSongIds(u.id));
    setUserPlaylists(backend.getUserPlaylists(u.id));
    setUnreadCount(backend.getUnreadCount(u.id));
    if (u.role === 'admin') setViewState({ type: 'admin' });
  };

  const handleLogout = () => {
    setUser(null);
    setLikedSongIds([]);
    setUserPlaylists([]);
    setUnreadCount(0);
    setViewState({ type: 'library' });
  };

  const handleToggleLike = async (songId?: number) => {
    const targetId = songId !== undefined ? songId : currentSong?.id;
    if (targetId === undefined || !user) {
      if (!user) setShowAuthModal(true);
      return;
    }
    const isLiked = await backend.toggleLike(user.id, targetId);
    if (isLiked) setLikedSongIds(prev => [...prev, targetId]);
    else setLikedSongIds(prev => prev.filter(id => id !== targetId));
  };

  const handleCreatePlaylist = async (name: string) => {
    if (!user) return;
    const newPlaylist = await backend.createPlaylist(user.id, name);
    setUserPlaylists(prev => [...prev, newPlaylist]);
    if (showAddToPlaylist.isOpen && showAddToPlaylist.songId !== null) {
       await backend.addToPlaylist(newPlaylist.id, showAddToPlaylist.songId);
       setShowAddToPlaylist({ isOpen: false, songId: null });
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!user || showAddToPlaylist.songId === null) return;
    await backend.addToPlaylist(playlistId, showAddToPlaylist.songId);
    setUserPlaylists(prev => prev.map(p => {
        if (p.id === playlistId && showAddToPlaylist.songId !== null) {
            return { ...p, songs: [...p.songs, showAddToPlaylist.songId] };
        }
        return p;
    }));
    setShowAddToPlaylist({ isOpen: false, songId: null });
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    refreshSongs();
  };

  return (
    <div className="flex h-screen w-full bg-[var(--bg-app)] text-[var(--text-base)] font-sans theme-transition">
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        user={user}
        onLoginClick={() => setShowAuthModal(true)}
        onLogoutClick={handleLogout}
        playlists={userPlaylists}
        currentView={viewState}
        onChangeView={(v) => { setViewState(v); setSidebarOpen(false); }}
        onCreatePlaylist={() => setShowCreatePlaylist(true)}
        unreadCount={unreadCount}
      />
      
      {sidebarOpen && isMobile && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-br from-[var(--bg-app)] to-[var(--bg-app)]">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between px-6 py-4 bg-[var(--bg-header)] backdrop-blur-md border-b border-[var(--border-color)]">
          <div className="flex items-center gap-4 flex-grow max-w-2xl">
             <button onClick={() => setSidebarOpen(true)} className="md:hidden text-[var(--text-muted)]">
                <i className="fas fa-bars text-xl"></i>
             </button>
             {viewState.type !== 'admin' && viewState.type !== 'profile' && (
                 <div className="relative group w-full md:w-80">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-blue-400"></i>
                    <input 
                        type="text" 
                        placeholder="Search local tracks..." 
                        className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-full py-2 pl-10 pr-4 text-sm text-[var(--text-base)] focus:outline-none focus:border-blue-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>
             )}
          </div>

          <div className="flex items-center gap-4 ml-4">
             <div className="hidden md:flex items-center gap-3 bg-[var(--bg-card)] px-3 py-1.5 rounded-full border border-[var(--border-color)]">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">L</div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase leading-none">Developer</span>
                    <a href="https://lawreay.github.io/portfolio/" target="_blank" rel="noreferrer" className="text-xs font-bold hover:text-blue-500 leading-none">Lawrence P. Chikapa</a>
                </div>
             </div>
             <button 
                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                className="w-10 h-10 rounded-full bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] flex items-center justify-center transition-colors text-yellow-500"
             >
                <i className={`fas ${theme === 'dark' ? 'fa-moon' : 'fa-sun'}`}></i>
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-32">
            {viewState.type === 'admin' && user?.role === 'admin' ? (
                <AdminDashboard 
                    currentUser={user} 
                    songs={allSongs} 
                    onSongUpdate={refreshSongs} 
                />
            ) : viewState.type === 'profile' && user ? (
                <UserProfile user={user} onUpdateUser={handleUpdateUser} />
            ) : (
                <>
                <div className="px-6 md:px-10 mt-4 mb-8">
                    <div className={`w-full h-48 md:h-56 rounded-2xl relative shadow-2xl flex items-end p-6 md:p-10 overflow-hidden group transition-all duration-500
                        ${viewState.type === 'liked' ? 'bg-gradient-to-r from-pink-900 to-purple-900' : 'bg-gradient-to-r from-indigo-900 to-blue-900'}
                    `}>
                        <div className="relative z-10">
                            <span className="text-xs font-bold tracking-widest uppercase text-white/70 mb-2 block">{headerInfo.desc}</span>
                            <h1 className="text-3xl md:text-5xl font-extrabold mb-2 text-white drop-shadow-lg">{headerInfo.title}</h1>
                            <p className="text-white/60 text-sm font-medium">
                               {user ? `User: ${user.username}` : 'Offline Mode Active'} 
                            </p>
                        </div>
                        <div className="absolute right-0 bottom-0 p-10 opacity-20 transform translate-x-10 translate-y-10">
                            <i className={`fas ${viewState.type === 'liked' ? 'fa-heart' : 'fa-music'} text-9xl text-white`}></i>
                        </div>
                    </div>
                </div>

                <div className="px-6 md:px-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {displayedSongs.map((song) => {
                        const isCurrent = currentSong?.id === song.id;
                        const isLiked = likedSongIds.includes(song.id);
                        return (
                            <div 
                                key={song.id} 
                                className={`
                                    group bg-[var(--bg-card)] p-4 rounded-xl relative transition-all duration-300 hover:-translate-y-2 hover:bg-[var(--bg-card-hover)] hover:shadow-xl border border-[var(--border-color)]
                                    ${isCurrent ? 'ring-2 ring-blue-500' : ''}
                                `}
                            >
                                <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleToggleLike(song.id); }}
                                        className="w-8 h-8 rounded-full bg-black/50 hover:bg-pink-600 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                                    >
                                        <i className={`${isLiked ? 'fas text-pink-500 hover:text-white' : 'far'} fa-heart text-sm`}></i>
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); if(!user) setShowAuthModal(true); else setShowAddToPlaylist({ isOpen: true, songId: song.id }); }}
                                        className="w-8 h-8 rounded-full bg-black/50 hover:bg-blue-600 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                                    >
                                        <i className="fas fa-plus text-sm"></i>
                                    </button>
                                </div>

                                <div onClick={() => loadAndPlay(displayedSongs.indexOf(song), displayedSongs)} className="cursor-pointer">
                                    <div className="relative aspect-square rounded-lg overflow-hidden mb-4 shadow-lg bg-gray-800">
                                        <img 
                                            src={resolvedImages[song.id] || 'https://via.placeholder.com/150'} 
                                            alt={song.title} 
                                            className="w-full h-full object-cover" 
                                            loading="lazy" 
                                        />
                                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                                <i className={`fas ${isCurrent && playerState.isPlaying ? 'fa-chart-bar' : 'fa-play pl-1'}`}></i>
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-bold text-[var(--text-base)] truncate mb-1">{song.title}</h3>
                                    <p className="text-xs text-[var(--text-muted)] truncate">{song.artist}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {displayedSongs.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-[var(--text-muted)]">
                        <i className="fas fa-music text-3xl mb-3 opacity-50"></i>
                        <p>No songs found. Use Admin/Creator tools to upload.</p>
                    </div>
                )}
                </>
            )}
        </div>

        <audio 
            ref={audioRef} 
            preload="none"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
        />
      </main>

      <PlayerBar 
        currentSong={currentSong ? { ...currentSong, art: currentArtUrl } : null}
        onNext={playNext}
        onPrev={playPrev}
        onPlayPause={togglePlayPause}
        playMode={playMode}
        toggleMode={() => setPlayMode(m => m === PlayMode.NORMAL ? PlayMode.SHUFFLE : m === PlayMode.SHUFFLE ? PlayMode.LOOP : PlayMode.NORMAL)}
        playerState={playerState}
        onSeek={handleSeek}
        onVolumeChange={(v) => { if(audioRef.current) audioRef.current.volume = v; setPlayerState(p => ({...p, volume: v})); }}
        isLiked={currentSong ? likedSongIds.includes(currentSong.id) : false}
        onToggleLike={() => handleToggleLike(currentSong?.id)}
        user={user}
        onShowLikes={() => currentSong && setShowSocialLikes(currentSong)}
      />

      {showMsgPopup && (
         <div className="fixed top-20 right-5 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-2xl z-50 animate-bounce flex items-center gap-3 cursor-pointer" onClick={() => { setViewState({ type: 'profile' }); setShowMsgPopup(false); }}>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><i className="fas fa-envelope"></i></div>
            <div>
                <p className="font-bold text-sm">New Message</p>
                <p className="text-xs opacity-90">You have unread messages.</p>
            </div>
         </div>
      )}

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onSuccess={handleLogin} 
        />
      )}

      {showCreatePlaylist && (
        <PlaylistModal 
          onClose={() => setShowCreatePlaylist(false)}
          onCreate={handleCreatePlaylist}
        />
      )}

      {showAddToPlaylist.isOpen && (
        <AddToPlaylistModal
            playlists={userPlaylists}
            onClose={() => setShowAddToPlaylist({ isOpen: false, songId: null })}
            onSelect={handleAddToPlaylist}
            onCreateNew={() => {
                setShowCreatePlaylist(true);
            }}
        />
      )}

      {showSocialLikes && (
        <SocialLikesModal 
            song={showSocialLikes}
            currentUser={user}
            onClose={() => setShowSocialLikes(null)}
            onMessageUser={(target) => { alert(`Go to Profile > Messages to chat with ${target.username}`); }}
        />
      )}
    </div>
  );
};

export default App;
