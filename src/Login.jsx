import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider.jsx';

const Login = () => {
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-black text-slate-900 mb-3">Welcome back</h1>
        <p className="text-slate-500 mb-8">Sign in quickly with your Google account to track your orders.</p>

        {error && (
          <div className="mb-4 rounded-3xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-700 font-semibold shadow-sm hover:bg-slate-50 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Connecting to Google…' : 'Continue with Google'}
        </button>

        <p className="mt-6 text-center text-sm text-slate-500">
          New here?{' '}
          <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
