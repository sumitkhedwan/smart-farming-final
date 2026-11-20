import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile } from '@/lib/profile';
import { requireSupabase } from '@/lib/supabase';

export default function ProfileEditor() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [occupation, setOccupation] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        const { data, error: queryError } = await requireSupabase()
          .from('profiles')
          .select('id, full_name, username, bio, avatar_url, occupation, notification_preferences, created_at, updated_at')
          .eq('id', user.id)
          .maybeSingle();
        if (queryError) throw queryError;
        if (!data) throw new Error('Your profile could not be found. Confirm that the database migration has been applied.');
        if (!active) return;
        const loaded = data as Profile;
        setProfile(loaded);
        setFullName(loaded.full_name);
        setUsername(loaded.username ?? '');
        setBio(loaded.bio);
        setAvatarUrl(loaded.avatar_url ?? '');
        setOccupation(loaded.occupation ?? '');
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : 'Your profile could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadProfile();
    return () => { active = false; };
  }, [user]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!user) return;

    const normalizedUsername = username.trim().toLowerCase();
    if (normalizedUsername && !/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) {
      setError('Username must be 3–30 characters and use lowercase letters, numbers, or underscores.');
      return;
    }
    const normalizedAvatar = avatarUrl.trim();
    if (normalizedAvatar) {
      try {
        const url = new URL(normalizedAvatar);
        if (url.protocol !== 'https:') throw new Error();
      } catch {
        setError('Avatar URL must be a valid HTTPS link.');
        return;
      }
    }

    setSaving(true);
    try {
      const { data, error: updateError } = await requireSupabase()
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          username: normalizedUsername || null,
          bio: bio.trim(),
          avatar_url: normalizedAvatar || null,
          occupation: occupation || null,
        })
        .eq('id', user.id)
        .select('id, full_name, username, bio, avatar_url, occupation, notification_preferences, created_at, updated_at')
        .single();
      if (updateError) throw updateError;
      setProfile(data as Profile);
      setSuccess('Your profile has been saved.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Your profile could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const initials = fullName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'U';

  if (loading) return <div className="flex min-h-48 items-center justify-center gap-2 text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" />Loading profile…</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt={`${fullName || 'Your'} profile picture`} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold">{fullName || 'Your profile'}</h2>
            <p className="break-all text-sm text-muted-foreground">{user?.email}</p>
            {profile && <p className="mt-1 text-xs text-muted-foreground">Member since {new Date(profile.created_at).toLocaleDateString()}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile information</CardTitle>
          <CardDescription>Only you can view and update these profile details.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{error}</p>}
          {success && <p className="mb-4 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900" role="status">{success}</p>}
          <form className="space-y-5" onSubmit={saveProfile}>
            <div className="space-y-2">
              <Label htmlFor="profile-name">Full name</Label>
              <Input id="profile-name" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" maxLength={100} required />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-username">Username</Label>
                <Input id="profile-username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" maxLength={30} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email address</Label>
                <Input id="profile-email" type="email" value={user?.email ?? ''} readOnly aria-describedby="email-help" />
                <p id="email-help" className="text-xs text-muted-foreground">Email is managed by your verified sign-in account.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-avatar">Avatar image URL</Label>
              <Input id="profile-avatar" type="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} maxLength={2048} placeholder="https://example.com/photo.jpg" />
              <p className="text-xs text-muted-foreground">Use an HTTPS image URL. Leave empty to show your initials.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-occupation">Occupation</Label>
              <Select value={occupation} onValueChange={setOccupation}>
                <SelectTrigger id="profile-occupation"><SelectValue placeholder="Choose an occupation" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Farmer">Farmer</SelectItem>
                  <SelectItem value="Researcher">Researcher</SelectItem>
                  <SelectItem value="Gardener">Gardener</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3"><Label htmlFor="profile-bio">Short biography</Label><span className="text-xs text-muted-foreground">{bio.length}/280</span></div>
              <Textarea id="profile-bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={280} rows={4} placeholder="Tell us a little about your work or farm." />
            </div>
            <Button type="submit" disabled={saving || !profile}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? 'Saving…' : 'Save profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
