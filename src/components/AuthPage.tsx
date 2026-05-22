import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Chrome, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

const AuthPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { signUp, login, signIn, resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isReset) {
        await resetPassword(email);
        setSuccess('Password reset link sent to your email!');
        setTimeout(() => setIsReset(false), 3000);
      } else if (isLogin) {
        await login(email, password);
        onClose();
      } else {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await signUp(email, password, name);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signIn();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-black/5"
      >
        <div className="p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-zinc-900 mb-2">
              {isReset ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-zinc-500 font-medium">
              {isReset 
                ? 'Enter your email to receive a reset link' 
                : isLogin 
                  ? 'Sign in to your account to continue' 
                  : 'Join our community of tech enthusiasts'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && !isReset && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:border-zinc-900 transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:border-zinc-900 transition-all"
                />
              </div>
            </div>

            {!isReset && (
              <div className="space-y-1">
                <div className="flex justify-between items-center px-4">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Password</label>
                  {isLogin && (
                    <button 
                      type="button"
                      onClick={() => setIsReset(true)}
                      className="text-[10px] font-black text-zinc-900 uppercase tracking-widest hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:border-zinc-900 transition-all"
                  />
                </div>
              </div>
            )}

            {!isLogin && !isReset && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:border-zinc-900 transition-all"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 text-red-500 bg-red-50 p-4 rounded-2xl text-xs font-bold">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 text-emerald-500 bg-emerald-50 p-4 rounded-2xl text-xs font-bold">
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-2 hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : isReset ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          {!isReset && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-zinc-400 font-black tracking-widest">Or continue with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white border border-zinc-200 text-zinc-900 py-4 rounded-2xl font-black flex items-center justify-center space-x-3 hover:bg-zinc-50 transition-all shadow-sm disabled:opacity-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Google Account</span>
              </button>
            </>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                if (isReset) setIsReset(false);
                else setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }}
              className="text-xs font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-900 transition-colors"
            >
              {isReset 
                ? 'Back to Login' 
                : isLogin 
                  ? "Don't have an account? Sign Up" 
                  : "Already have an account? Login"}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          <X size={24} />
        </button>
      </motion.div>
    </div>
  );
};

const X: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export default AuthPage;
