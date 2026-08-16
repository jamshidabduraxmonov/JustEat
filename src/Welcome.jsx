import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider.jsx';

export default function Welcome(){
    const { user, signinWithGoogle } = useAuth();
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setIsSubmitting(true);
      await signinWithGoogle();
      navigate('/', { replace: true });
    } catch (authError) {
      setError(authError.message || 'Google sign in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-emerald-600 to-slate-900 flex items-center justify-center px-6 py-10">

    <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl grid md:grid-cols-2">

      {/* Left Side */}
      <div className="relative flex flex-col justify-center p-10 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">

        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-black/10 blur-3xl"></div>

        <p className="tracking-[0.35em] text-emerald-100 text-sm font-bold">
          QuickOrdr
        </p>

        <h1 className="mt-4 text-5xl font-black leading-tight">
          Fresh food,<br />
          delivered fast.
        </h1>

        <p className="mt-6 max-w-sm text-emerald-50 text-lg leading-7">
          Welcome! Sign in with Google to start ordering and track every delivery live.
        </p>

        <div className="mt-10 flex gap-4 flex-wrap">
          <div className="rounded-full bg-white/15 px-4 py-2 backdrop-blur">
            🍔 Fresh Sandwiches
          </div>

          <div className="rounded-full bg-white/15 px-4 py-2 backdrop-blur">
            ☕ Starbucks Coffee
          </div>

          <div className="rounded-full bg-white/15 px-4 py-2 backdrop-blur">
            📍 Live Tracking
          </div>
        </div>

      </div>

      {/* Right Side */}

      <div className="flex items-center justify-center p-10 bg-slate-50">

        <div className="w-full max-w-sm">

          <div className="mb-8 text-center">

            <div className="text-7xl mb-5">
              🥪
            </div>

            <h2 className="text-3xl font-black text-slate-800">
              Welcome
            </h2>

            <p className="mt-3 text-slate-500">
              Continue with Google to access QuickOrdr.
            </p>

          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

    <button
      onClick={handleGoogleLogin}
      disabled={isSubmitting}
      className="w-full rounded-2xl bg-white border border-emerald-500 py-4 text-lg font-bold text-gray-700 shadow-md flex items-center justify-center gap-3 transition duration-200 hover:bg-gray-50 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50"

    >
      {isSubmitting ? (
        "Connecting..."
      ) : (
        <>
          {/* Official Google "G" Logo SVG */}
          <svg className="w-6 h-6 hover:rotate-[360deg] transition-transform duration-500" viewBox="0 0 24 24" fill="none" xmlns="http://w3.org">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Continue with Google</span>
        </>
      )}
    </button>


        </div>

      </div>

    </div>

  </div>
);

}