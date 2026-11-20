import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckCircle, Trash2, Calendar, ClipboardList, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { requireSupabase } from '@/lib/supabase';

interface FarmTask {
  id: string;
  user_id: string;
  title: string;
  category: string;
  due_date: string;
  completed: boolean;
}

export const TaskTracker = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newDueDate, setNewDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadTasks = useCallback(async () => {
    if (!user) return;
    const { data, error: queryError } = await requireSupabase()
      .from('farm_tasks')
      .select('id, user_id, title, category, due_date, completed')
      .eq('user_id', user.id)
      .order('completed', { ascending: true })
      .order('due_date', { ascending: true });
    if (queryError) throw queryError;
    setTasks((data ?? []) as FarmTask[]);
  }, [user]);

  useEffect(() => {
    let active = true;
    void loadTasks().catch((caught) => {
      if (active) setError(caught instanceof Error ? caught.message : 'Your tasks could not be loaded.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [loadTasks]);

  const addTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!user || !title) {
      setError('Enter a task title.');
      return;
    }
    if (title.length > 200) {
      setError('Task titles must be 200 characters or fewer.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { error: insertError } = await requireSupabase().from('farm_tasks').insert({
        user_id: user.id,
        title,
        category: newCategory,
        due_date: newDueDate,
      });
      if (insertError) throw insertError;
      await loadTasks();
      setNewTitle('');
      toast.success('Task saved to your account.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The task could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (task: FarmTask) => {
    if (!user) return;
    setBusyId(task.id);
    setError('');
    try {
      const { error: updateError } = await requireSupabase()
        .from('farm_tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id)
        .eq('user_id', user.id);
      if (updateError) throw updateError;
      await loadTasks();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Task status could not be updated.');
    } finally {
      setBusyId(null);
    }
  };

  const deleteTask = async (task: FarmTask) => {
    if (!user || !window.confirm(`Delete “${task.title}”?`)) return;
    setBusyId(task.id);
    setError('');
    try {
      const { error: deleteError } = await requireSupabase()
        .from('farm_tasks')
        .delete()
        .eq('id', task.id)
        .eq('user_id', user.id);
      if (deleteError) throw deleteError;
      await loadTasks();
      toast.success('Task deleted.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The task could not be deleted.');
    } finally {
      setBusyId(null);
    }
  };

  const completedCount = useMemo(() => tasks.filter((task) => task.completed).length, [tasks]);
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-16">
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Farm task tracker</h1>
          <p className="mt-2 text-muted-foreground">Add reminders for your farm. Tasks are private to your signed-in account.</p>
        </div>

        {error && <p className="mb-5 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{error}</p>}

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <Card className="bg-primary/5 md:col-span-1">
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg"><ClipboardList className="h-5 w-5 text-primary" />Your progress</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-2 flex items-center justify-between gap-2"><span className="text-2xl font-bold">{completedCount} / {tasks.length} done</span><span className="text-sm font-semibold text-primary">{progressPercent}%</span></div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Completed task progress" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} /></div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-lg">Add a task</CardTitle><CardDescription>These are reminders you enter, not automatically generated treatment instructions.</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={addTask} className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="task-title">Task title</Label><Input id="task-title" type="text" placeholder="For example, inspect irrigation lines" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} maxLength={200} required /></div>
                <div className="space-y-2"><Label htmlFor="task-category">Category</Label><select id="task-category" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"><option>General</option><option>Crop care</option><option>Disease monitoring</option><option>Irrigation</option><option>Harvesting</option><option>Maintenance</option></select></div>
                <div className="space-y-2"><Label htmlFor="task-date">Due date</Label><Input id="task-date" type="date" value={newDueDate} onChange={(event) => setNewDueDate(event.target.value)} required /></div>
                <Button type="submit" className="gap-2 sm:col-span-2" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{saving ? 'Saving…' : 'Add task'}</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Tasks</CardTitle><CardDescription>Changes are saved to your account and persist after you sign out.</CardDescription></CardHeader>
          <CardContent>
            {loading ? <div className="flex min-h-32 items-center justify-center gap-2 text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" />Loading your tasks…</div> : tasks.length === 0 ? (
              <div className="flex min-h-36 flex-col items-center justify-center gap-2 text-center"><ClipboardList className="h-8 w-8 text-muted-foreground" /><p className="font-medium">No tasks yet</p><p className="text-sm text-muted-foreground">Add a reminder above to start your list.</p></div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className={`flex items-center justify-between gap-3 rounded-lg border p-4 ${task.completed ? 'bg-muted/30 opacity-75' : 'bg-card'}`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <Button type="button" variant="ghost" size="icon" disabled={busyId === task.id} onClick={() => void toggleTask(task)} aria-label={task.completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`} className={`h-9 w-9 shrink-0 rounded-full ${task.completed ? 'text-primary' : 'text-muted-foreground'}`}><CheckCircle className={`h-6 w-6 ${task.completed ? 'fill-primary text-background' : ''}`} /></Button>
                      <div className="min-w-0"><span className={`block break-words text-sm font-medium sm:text-base ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span><div className="mt-1 flex flex-wrap items-center gap-2"><Badge variant="secondary">{task.category}</Badge><span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />Due {task.due_date}</span></div></div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" disabled={busyId === task.id} onClick={() => void deleteTask(task)} aria-label={`Delete ${task.title}`} className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TaskTracker;
