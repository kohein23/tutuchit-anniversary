import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Lock, Mail, Eye, EyeOff, ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react';

export default function CmsLogin() {
  const [email, setEmail] = useState('admin@fast.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'admin@fast.com') {
        navigate('/cms');
      } else {
        setCheckingAuth(false);
      }
    });
    return unsub;
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (email.trim() !== 'admin@fast.com') {
        throw new Error('ဤအီးမေးလ်ဖြင့် Admin အဖြစ် ဝင်ရောက်ခွင့်မရှိပါ (admin@fast.com သာ အသုံးပြုနိုင်ပါသည်)');
      }
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate('/cms');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('စကားဝှက် (Password) မှားယွင်းနေပါသည်');
      } else if (err.code === 'auth/user-not-found') {
        setError('အကောင့်မရှိသေးပါ သို့မဟုတ် အီးမေးလ် မှားယွင်းနေပါသည်');
      } else {
        setError(err.message || 'ဝင်ရောက်ရာတွင် အဆင်မပြေဖြစ်သွားပါသည်');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#FDFBFB] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#881337] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5F7] via-[#FDFBFB] to-[#F5F0F2] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#881337] to-rose-500 text-white shadow-lg shadow-rose-900/20 mb-4 ring-4 ring-rose-100">
            <Heart size={32} fill="currentColor" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Tutuchit CMS
          </h1>
          <p className="text-sm text-gray-600 mt-1.5 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck size={16} className="text-[#881337]" />
            စုံတွဲဝက်ဘ်ဆိုက်များ စီမံခန့်ခွဲရေးစနစ်
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-rose-100 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Admin Login
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            ဝက်ဘ်ဆိုက်အသစ်များ ထည့်သွင်း/ပြင်ဆင်ရန် Admin အကောင့်ဖြင့် ဝင်ရောက်ပါ
          </p>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-2xl flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail size={16} />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#881337]/30 focus:border-[#881337] transition-all"
                  placeholder="admin@fast.com"
                  required 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#881337]/30 focus:border-[#881337] transition-all"
                  placeholder="••••••••"
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-2 bg-[#881337] hover:bg-[#70102d] text-white font-semibold rounded-xl py-3 px-4 shadow-md shadow-rose-950/15 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Login ဝင်ရောက်မည်</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick link to preview demo public couple site */}
        <div className="text-center mt-6">
          <Link
            to="/demo"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-800 hover:text-rose-950 bg-rose-50/80 hover:bg-rose-100 border border-rose-200/60 px-4 py-2 rounded-full transition-colors"
          >
            <span>စုံတွဲ Demo ဝက်ဘ်ဆိုက်အား ကြည့်ရှုမည်</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
