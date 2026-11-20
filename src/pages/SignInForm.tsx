import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Leaf, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { requireSupabase } from '@/lib/supabase';

type FormMode = 'signin' | 'signup' | 'forgot' | 'reset';

function safeReturnPath(state: unknown) {
  const from = (state as { from?: { pathname?: unknown } } | null)?.from?.pathname;
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/dashboard';
}

export function SignInForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { configured, user, loading: authLoading, session } = useAuth();
  const isResetRoute = location.pathname === '/reset-password';
  const [mode, setMode] = useState<FormMode>(isResetRoute ? 'reset' : 'signin');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [occupation, setOccupation] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!isResetRoute && user) navigate(safeReturnPath(location.state), { replace: true });
  }, [isResetRoute, location.state, user, navigate]);

  const changeMode = (nextMode: FormMode) => {
    setError('');
    setNotice('');
    setMode(nextMode);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!configured) {
      setError('Account services are not configured. Add the Supabase URL and publishable key to the deployment environment.');
      return;
    }
    if (mode === 'reset' && (authLoading || !session)) {
      setError('Open a valid password reset link from your email before choosing a new password.');
      return;
    }

    if ((mode === 'signup' || mode === 'reset') && password.length < 12) {
      setError('Use a password with at least 12 characters.');
      return;
    }
    if ((mode === 'signup' || mode === 'reset') && password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      setError('Enter your full name.');
      return;
    }

    setBusy(true);
    try {
      const client = requireSupabase();
      if (mode === 'signup') {
        const normalizedUsername = username.trim().toLowerCase();
        if (normalizedUsername && !/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) {
          throw new Error('Username must be 3–30 characters and use lowercase letters, numbers, or underscores.');
        }
        const { data, error: authError } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: fullName.trim(),
              username: normalizedUsername || null,
              occupation: occupation || null,
            },
          },
        });
        if (authError) throw authError;
        if (data.session) {
          navigate('/dashboard', { replace: true });
        } else {
          setNotice('Your account is created. Check your email to verify your address before signing in.');
          setMode('signin');
        }
      } else if (mode === 'signin') {
        const { error: authError } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        navigate(safeReturnPath(location.state), { replace: true });
      } else if (mode === 'forgot') {
        const { error: authError } = await client.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (authError) throw authError;
        setNotice('If an account uses that email, a password reset link will arrive shortly.');
      } else {
        const { error: authError } = await client.auth.updateUser({ password });
        if (authError) throw authError;
        setNotice('Your password has been updated.');
        setPassword('');
        setConfirmation('');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The request could not be completed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const isSignup = mode === 'signup';
  const isPasswordMode = mode === 'signup' || mode === 'reset';
  const title = mode === 'signup' ? 'Create your account'
    : mode === 'forgot' ? 'Reset your password'
      : mode === 'reset' ? 'Choose a new password' : 'Welcome back';
  const description = mode === 'signup' ? 'Save your AgriWise profile and farm settings.'
    : mode === 'forgot' ? 'We’ll send a reset link if an account exists for this email.'
      : mode === 'reset' ? 'Choose a strong password with at least 12 characters.'
        : 'Sign in to manage your profile and farm settings.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-emerald-100 px-4 py-24 sm:py-28">
      <Card className="mx-auto w-full max-w-lg border-green-100 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <Link to="/" className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-label="AgriWise home">
            <Leaf className="h-6 w-6" />
          </Link>
          <div className="space-y-1">
            <CardTitle className="text-2xl text-green-950">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!configured && (
            <div className="mb-5 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="status">
              Account setup is required before registration or sign-in can work.
            </div>
          )}
          {isResetRoute && configured && authLoading && (
            <div className="mb-5 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950" role="status">
              Verifying the password reset link…
            </div>
          )}
          {isResetRoute && configured && !authLoading && !session && (
            <div className="mb-5 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert">
              This reset link is invalid or expired. Request a new link from the sign-in page.
            </div>
          )}
          {error && <div className="mb-5 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{error}</div>}
          {notice && <div className="mb-5 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900" role="status">{notice}</div>}

          <form className="space-y-4" onSubmit={submit}>
            {isSignup && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full name</Label>
                  <Input id="full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} maxLength={100} autoComplete="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username <span className="font-normal text-muted-foreground">(optional)</span></Label>
                  <Input id="username" value={username} onChange={(event) => setUsername(event.target.value)} maxLength={30} autoComplete="username" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupation">I work as <span className="font-normal text-muted-foreground">(optional)</span></Label>
                  <Select value={occupation} onValueChange={setOccupation}>
                    <SelectTrigger id="occupation"><SelectValue placeholder="Choose an occupation" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Farmer">Farmer</SelectItem>
                      <SelectItem value="Researcher">Researcher</SelectItem>
                      <SelectItem value="Gardener">Gardener</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {mode !== 'reset' && (
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={254} required disabled={busy} />
              </div>
            )}

            {mode === 'signin' || isPasswordMode ? (
              <div className="space-y-2">
                <Label htmlFor="password">{mode === 'reset' ? 'New password' : 'Password'}</Label>
                <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={isPasswordMode ? 12 : undefined} required disabled={busy} />
              </div>
            ) : null}

            {isPasswordMode && (
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input id="confirm-password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength={12} required disabled={busy} />
              </div>
            )}

            <Button className="w-full" type="submit" disabled={busy || !configured || (isResetRoute && (authLoading || !session))}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : mode === 'reset' ? 'Update password' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-5 flex flex-col items-center gap-3 text-sm">
            {mode === 'signin' && (
              <>
                <button className="text-primary underline-offset-4 hover:underline" type="button" onClick={() => changeMode('forgot')}>Forgot password?</button>
                <p className="text-muted-foreground">New to AgriWise? <button className="font-medium text-primary underline-offset-4 hover:underline" type="button" onClick={() => changeMode('signup')}>Create an account</button></p>
              </>
            )}
            {mode === 'signup' && <p className="text-muted-foreground">Already have an account? <button className="font-medium text-primary underline-offset-4 hover:underline" type="button" onClick={() => changeMode('signin')}>Sign in</button></p>}
            {mode === 'forgot' && <button className="text-primary underline-offset-4 hover:underline" type="button" onClick={() => changeMode('signin')}>Back to sign in</button>}
            {mode === 'reset' && !notice && <p className="text-muted-foreground">Open the password reset link from your email to continue.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
