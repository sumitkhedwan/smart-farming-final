import { useEffect, useState, type FormEvent } from 'react';
import { BellRing, Loader2, Lock, LogOut, Tractor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import NavBar from '@/components/NavBar';
import ProfileEditor from '@/components/ProfileEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { defaultNotificationPreferences, emptyFarmSettings, type FarmSettings, type NotificationPreferences, type Profile } from '@/lib/profile';
import { requireSupabase } from '@/lib/supabase';

const notificationLabels: Array<{ key: keyof NotificationPreferences; title: string; description: string }> = [
  { key: 'weather', title: 'Weather alerts', description: 'Forecasts that could affect your crops.' },
  { key: 'market', title: 'Market updates', description: 'Price changes from a connected market data source.' },
  { key: 'disease', title: 'Disease guidance', description: 'Updates related to plant health.' },
  { key: 'harvest', title: 'Harvest reminders', description: 'Reminders for dates you record in AgriWise.' },
  { key: 'email', title: 'Email delivery', description: 'Email delivery is not configured yet.' },
  { key: 'sms', title: 'SMS delivery', description: 'SMS delivery is not configured yet.' },
];

function FarmSettingsForm() {
  const { user } = useAuth();
  const [farm, setFarm] = useState<FarmSettings | null>(null);
  const [areaAcres, setAreaAcres] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    async function loadFarm() {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error: queryError } = await requireSupabase()
          .from('farm_settings')
          .select('id, farm_name, area_acres, location, soil_type, farming_type, irrigation_method')
          .eq('id', user.id)
          .maybeSingle();
        if (queryError) throw queryError;
        const loaded = (data as FarmSettings | null) ?? emptyFarmSettings(user.id);
        if (!active) return;
        setFarm(loaded);
        setAreaAcres(loaded.area_acres === null ? '' : String(loaded.area_acres));
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : 'Farm settings could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadFarm();
    return () => { active = false; };
  }, [user]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!farm || !user) return;
    setSaving(true);
    setError('');
    setSuccess('');
    const parsedArea = areaAcres.trim() === '' ? null : Number(areaAcres);
    if (parsedArea !== null && (!Number.isFinite(parsedArea) || parsedArea < 0 || parsedArea > 1_000_000)) {
      setSaving(false);
      setError('Enter a valid farm size from 0 to 1,000,000 acres.');
      return;
    }
    try {
      const { data, error: saveError } = await requireSupabase()
        .from('farm_settings')
        .upsert({ ...farm, area_acres: parsedArea }, { onConflict: 'id' })
        .select('id, farm_name, area_acres, location, soil_type, farming_type, irrigation_method')
        .single();
      if (saveError) throw saveError;
      setFarm(data as FarmSettings);
      setSuccess('Farm details have been saved.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Farm details could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof Omit<FarmSettings, 'id' | 'area_acres'>, value: string) => {
    setFarm((current) => current ? { ...current, [key]: value } : current);
  };

  if (loading) return <div className="flex min-h-48 items-center justify-center gap-2 text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" />Loading farm settings…</div>;
  if (!farm) return <p className="text-sm text-destructive" role="alert">{error || 'Farm settings could not be loaded.'}</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Tractor className="h-5 w-5 text-primary" />Farm details</CardTitle>
        <CardDescription>These details are private to your account and can be updated at any time.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{error}</p>}
        {success && <p className="mb-4 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900" role="status">{success}</p>}
        <form className="space-y-5" onSubmit={save}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="farm-name">Farm name</Label><Input id="farm-name" maxLength={120} value={farm.farm_name} onChange={(event) => update('farm_name', event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="farm-area">Farm size (acres)</Label><Input id="farm-area" type="number" min="0" max="1000000" step="0.01" value={areaAcres} onChange={(event) => setAreaAcres(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="farm-location">Location</Label><Input id="farm-location" maxLength={160} value={farm.location} onChange={(event) => update('location', event.target.value)} placeholder="City or region" /></div>
            <div className="space-y-2"><Label htmlFor="farm-soil">Primary soil type</Label><Input id="farm-soil" maxLength={60} value={farm.soil_type} onChange={(event) => update('soil_type', event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="farm-type">Farming type</Label><Input id="farm-type" maxLength={80} value={farm.farming_type} onChange={(event) => update('farming_type', event.target.value)} placeholder="For example, mixed or organic" /></div>
            <div className="space-y-2"><Label htmlFor="farm-irrigation">Irrigation method</Label><Input id="farm-irrigation" maxLength={80} value={farm.irrigation_method} onChange={(event) => update('irrigation_method', event.target.value)} /></div>
          </div>
          <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{saving ? 'Saving…' : 'Save farm details'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function NotificationSettings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultNotificationPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    async function loadPreferences() {
      if (!user) return;
      try {
        const { data, error: queryError } = await requireSupabase()
          .from('profiles')
          .select('notification_preferences')
          .eq('id', user.id)
          .single();
        if (queryError) throw queryError;
        if (active) setPreferences({ ...defaultNotificationPreferences, ...(data as Pick<Profile, 'notification_preferences'>).notification_preferences });
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : 'Notification preferences could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadPreferences();
    return () => { active = false; };
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { error: updateError } = await requireSupabase()
        .from('profiles')
        .update({ notification_preferences: preferences })
        .eq('id', user.id);
      if (updateError) throw updateError;
      setSuccess('Notification preferences have been saved.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Notification preferences could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BellRing className="h-5 w-5 text-primary" />Notification preferences</CardTitle>
        <CardDescription>Save the kinds of alerts you want. Email and SMS delivery need a provider before messages can be sent.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><Loader2 className="h-4 w-4 animate-spin" />Loading preferences…</div> : (
          <>
            {error && <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{error}</p>}
            {success && <p className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900" role="status">{success}</p>}
            <div className="divide-y rounded-md border px-4">
              {notificationLabels.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4 py-4">
                  <div><Label htmlFor={`preference-${item.key}`}>{item.title}</Label><p className="mt-1 text-sm text-muted-foreground">{item.description}</p></div>
                  <Switch id={`preference-${item.key}`} checked={preferences[item.key]} onCheckedChange={(checked) => setPreferences((current) => ({ ...current, [item.key]: checked }))} />
                </div>
              ))}
            </div>
            <Button onClick={save} disabled={saving || loading}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{saving ? 'Saving…' : 'Save preferences'}</Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SecuritySettings() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (password.length < 12) return setError('Use a password with at least 12 characters.');
    if (password !== confirmation) return setError('The passwords do not match.');
    setSaving(true);
    try {
      const { error: updateError } = await requireSupabase().auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword('');
      setConfirmation('');
      setSuccess('Your password has been updated.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Your password could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    try {
      await signOut();
      navigate('/signin', { replace: true });
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'You could not be signed out. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" />Change password</CardTitle><CardDescription>Use a unique password with at least 12 characters.</CardDescription></CardHeader>
        <CardContent>
          {error && <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{error}</p>}
          {success && <p className="mb-4 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900" role="status">{success}</p>}
          <form className="max-w-xl space-y-4" onSubmit={updatePassword}>
            <div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="confirm-new-password">Confirm new password</Label><Input id="confirm-new-password" type="password" autoComplete="new-password" minLength={12} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></div>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{saving ? 'Updating…' : 'Update password'}</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Sign out</CardTitle><CardDescription>End your current session on this device.</CardDescription></CardHeader>
        <CardContent><Button variant="outline" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Sign out</Button></CardContent>
      </Card>
    </div>
  );
}

export function Settings() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8"><h1 className="text-3xl font-bold">Account settings</h1><p className="mt-2 text-muted-foreground">Manage your profile, farm details, alerts, and password.</p></div>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-8 grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="farm">Farm details</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          <TabsContent value="profile"><ProfileEditor /></TabsContent>
          <TabsContent value="farm"><FarmSettingsForm /></TabsContent>
          <TabsContent value="notifications"><NotificationSettings /></TabsContent>
          <TabsContent value="security"><SecuritySettings /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default Settings;
