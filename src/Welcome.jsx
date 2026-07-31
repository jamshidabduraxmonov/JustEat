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

        <p className="uppercase tracking-[0.35em] text-emerald-100 text-sm font-bold">
          JustEat
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
              Continue with Google to access JustEat.
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
            className="w-full rounded-2xl bg-emerald-500 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-400/30 transition hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting
              ? "Connecting..."
              : "Continue with Google"}
          </button>

        </div>

      </div>

    </div>

  </div>
);

}