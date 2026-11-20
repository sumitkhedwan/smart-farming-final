import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallbackPage() {
  const { user, loading, configured } = useAuth();
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setTimedOut(true), 8000);
    return () => window.clearTimeout(timeout);
  }, []);

  if (loading || (!timedOut && configured)) {
    return <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center" role="status"><Loader2 className="h-7 w-7 animate-spin text-primary" />Verifying your email…</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Verification could not be completed</h1>
      <p className="max-w-md text-muted-foreground">The link may have expired or already been used. Sign in or request a new verification email.</p>
      <Button asChild><Link to="/signin">Go to sign in</Link></Button>
    </div>
  );
}
