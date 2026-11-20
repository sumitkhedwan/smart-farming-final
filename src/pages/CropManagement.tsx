import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, Loader2, Plus, Sprout, Trash2 } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { requireSupabase } from '@/lib/supabase';

type CropStatus = 'planned' | 'growing' | 'harvested';
interface CropRecord {
  id: string;
  user_id: string;
  crop_name: string;
  variety: string | null;
  planted_on: string | null;
  planned_harvest_on: string | null;
  area_acres: number | null;
  status: CropStatus;
  notes: string;
  created_at: string;
}

const statusLabels: Record<CropStatus, string> = { planned: 'Planned', growing: 'Growing', harvested: 'Harvested' };

export default function CropManagement() {
  const { user } = useAuth();
  const [crops, setCrops] = useState<CropRecord[]>([]);
  const [cropName, setCropName] = useState('');
  const [variety, setVariety] = useState('');
  const [plantedOn, setPlantedOn] = useState('');
  const [harvestOn, setHarvestOn] = useState('');
  const [areaAcres, setAreaAcres] = useState('');
  const [status, setStatus] = useState<CropStatus>('planned');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCrops = useCallback(async () => {
    if (!user) return;
    setError('');
    const { data, error: queryError } = await requireSupabase()
      .from('crops')
      .select('id, user_id, crop_name, variety, planted_on, planned_harvest_on, area_acres, status, notes, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (queryError) throw queryError;
    setCrops((data ?? []) as CropRecord[]);
  }, [user]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        await loadCrops();
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : 'Your crops could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [loadCrops]);

  const groups = useMemo(() => ({
    growing: crops.filter((crop) => crop.status === 'growing'),
    planned: crops.filter((crop) => crop.status === 'planned'),
    history: crops.filter((crop) => crop.status === 'harvested'),
  }), [crops]);

  const addCrop = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const area = areaAcres.trim() ? Number(areaAcres) : null;
    if (area !== null && (!Number.isFinite(area) || area < 0 || area > 1_000_000)) {
      setError('Enter an area from 0 to 1,000,000 acres.');
      return;
    }
    if (plantedOn && harvestOn && harvestOn < plantedOn) {
      setError('Planned harvest date must be on or after the planting date.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { error: insertError } = await requireSupabase().from('crops').insert({
        user_id: user.id,
        crop_name: cropName.trim(),
        variety: variety.trim() || null,
        planted_on: plantedOn || null,
        planned_harvest_on: harvestOn || null,
        area_acres: area,
        status,
        notes: notes.trim(),
      });
      if (insertError) throw insertError;
      await loadCrops();
      setCropName(''); setVariety(''); setPlantedOn(''); setHarvestOn(''); setAreaAcres(''); setStatus('planned'); setNotes('');
      setSuccess('Crop added to your farm tracker.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The crop could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (crop: CropRecord, nextStatus: CropStatus) => {
    setBusyId(crop.id);
    setError('');
    try {
      const { error: updateError } = await requireSupabase().from('crops').update({ status: nextStatus }).eq('id', crop.id).eq('user_id', user?.id);
      if (updateError) throw updateError;
      await loadCrops();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Crop status could not be updated.');
    } finally {
      setBusyId(null);
    }
  };

  const deleteCrop = async (crop: CropRecord) => {
    if (!window.confirm(`Delete ${crop.crop_name} from your crop tracker?`)) return;
    setBusyId(crop.id);
    setError('');
    try {
      const { error: deleteError } = await requireSupabase().from('crops').delete().eq('id', crop.id).eq('user_id', user?.id);
      if (deleteError) throw deleteError;
      await loadCrops();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Crop could not be deleted.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8"><h1 className="text-3xl font-bold">Crop management</h1><p className="mt-2 text-muted-foreground">Record your own crop schedule. Dates and crop health are entered by you; AgriWise does not estimate growth progress.</p></div>

        <Card className="mb-8">
          <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" />Add a crop</CardTitle><CardDescription>These records are private to your account.</CardDescription></CardHeader>
          <CardContent>
            {error && <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{error}</p>}
            {success && <p className="mb-4 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900" role="status">{success}</p>}
            <form className="space-y-5" onSubmit={addCrop}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2"><Label htmlFor="crop-name">Crop name</Label><Input id="crop-name" value={cropName} onChange={(event) => setCropName(event.target.value)} maxLength={100} required /></div>
                <div className="space-y-2"><Label htmlFor="crop-variety">Variety</Label><Input id="crop-variety" value={variety} onChange={(event) => setVariety(event.target.value)} maxLength={100} /></div>
                <div className="space-y-2"><Label htmlFor="crop-status">Status</Label><Select value={status} onValueChange={(value) => setStatus(value as CropStatus)}><SelectTrigger id="crop-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="planned">Planned</SelectItem><SelectItem value="growing">Growing</SelectItem><SelectItem value="harvested">Harvested</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="crop-planted">Planting date</Label><Input id="crop-planted" type="date" value={plantedOn} onChange={(event) => setPlantedOn(event.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="crop-harvest">Planned harvest date</Label><Input id="crop-harvest" type="date" value={harvestOn} onChange={(event) => setHarvestOn(event.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="crop-area">Area (acres)</Label><Input id="crop-area" type="number" min="0" max="1000000" step="0.01" value={areaAcres} onChange={(event) => setAreaAcres(event.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="crop-notes">Notes</Label><Textarea id="crop-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} rows={3} /></div>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{saving ? 'Saving…' : 'Add crop'}</Button>
            </form>
          </CardContent>
        </Card>

        <Tabs defaultValue="growing">
          <TabsList className="mb-5 grid h-auto w-full grid-cols-3">
            <TabsTrigger value="growing">Growing ({groups.growing.length})</TabsTrigger>
            <TabsTrigger value="planned">Planned ({groups.planned.length})</TabsTrigger>
            <TabsTrigger value="history">Harvested ({groups.history.length})</TabsTrigger>
          </TabsList>
          {(['growing', 'planned', 'history'] as const).map((key) => {
            const list = groups[key];
            return (
              <TabsContent key={key} value={key}>
                {loading ? <div className="flex min-h-40 items-center justify-center gap-2 text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" />Loading crops…</div> : list.length === 0 ? (
                  <Card><CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center"><Sprout className="h-8 w-8 text-muted-foreground" /><h2 className="text-lg font-semibold">No {key === 'history' ? 'harvested crops' : `${key} crops`} recorded</h2><p className="max-w-md text-sm text-muted-foreground">Add a crop above to keep your own planting and harvest details in this account.</p></CardContent></Card>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {list.map((crop) => (
                      <Card key={crop.id}>
                        <CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><Sprout className="h-5 w-5 text-primary" />{crop.crop_name}</CardTitle>{crop.variety && <CardDescription className="mt-1">{crop.variety}</CardDescription>}</div><Badge variant={crop.status === 'harvested' ? 'secondary' : 'outline'}>{statusLabels[crop.status]}</Badge></div></CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><p className="text-muted-foreground">Planted</p><p className="mt-1 flex items-center gap-1.5 font-medium"><CalendarDays className="h-4 w-4" />{crop.planted_on || 'Not recorded'}</p></div>
                            <div><p className="text-muted-foreground">Planned harvest</p><p className="mt-1 flex items-center gap-1.5 font-medium"><CalendarDays className="h-4 w-4" />{crop.planned_harvest_on || 'Not recorded'}</p></div>
                          </div>
                          <p className="text-sm text-muted-foreground">Area: {crop.area_acres === null ? 'Not recorded' : `${crop.area_acres} acres`}</p>
                          {crop.notes && <p className="whitespace-pre-wrap border-t pt-3 text-sm">{crop.notes}</p>}
                          <div className="flex flex-wrap gap-2 border-t pt-3">
                            {crop.status !== 'harvested' && <Button size="sm" variant="outline" disabled={busyId === crop.id} onClick={() => updateStatus(crop, crop.status === 'planned' ? 'growing' : 'harvested')}>{crop.status === 'planned' ? 'Mark growing' : 'Mark harvested'}</Button>}
                            {crop.status === 'harvested' && <Button size="sm" variant="outline" disabled={busyId === crop.id} onClick={() => updateStatus(crop, 'growing')}>Reopen crop</Button>}
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busyId === crop.id} onClick={() => deleteCrop(crop)}><Trash2 className="mr-1.5 h-4 w-4" />Delete</Button>
                            {busyId === crop.id && <Loader2 className="h-4 w-4 animate-spin self-center" aria-label="Saving crop status" />}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </main>
    </div>
  );
}
