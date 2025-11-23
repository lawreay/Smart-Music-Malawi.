
import React, { useState } from 'react';
import { backend } from '../services/backend';
import { User } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let user;
      if (isLogin) {
        user = await backend.login(email, password);
      } else {
        user = await backend.signup(username, email, password);
      }
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-[var(--text-base)]">
      <div className="bg-[var(--bg-modal)] w-full max-w-md p-8 rounded-2xl shadow-2xl border border-[var(--border-color)] animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-base)] transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Username</label>
              <input 
                type="text" 
                required 
                className="w-full bg-[var(--bg-input)] border border-gray-700 rounded-lg p-3 text-[var(--text-base)] focus:border-blue-500 focus:outline-none transition-colors"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Email</label>
            <input 
              type="email" 
              required 
              className="w-full bg-[var(--bg-input)] border border-gray-700 rounded-lg p-3 text-[var(--text-base)] focus:border-blue-500 focus:outline-none transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Password</label>
            <input 
              type="password" 
              required 
              className="w-full bg-[var(--bg-input)] border border-gray-700 rounded-lg p-3 text-[var(--text-base)] focus:border-blue-500 focus:outline-none transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all transform active:scale-95 shadow-lg shadow-blue-600/20 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <i className="fas fa-circle-notch fa-spin"></i> : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-blue-400 hover:text-blue-300 font-semibold ml-1"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
