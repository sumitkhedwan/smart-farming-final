import NavBar from '@/components/NavBar';
import { AlertTriangle, BookOpen, Calendar, ClipboardList, Droplet, Sprout } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const seasons = [
  { name: 'Spring', reminders: ['Check your region’s planting calendar before sowing or transplanting.', 'Inspect tools, irrigation lines, and stored seed before the busy season.', 'Record new plant growth and any visible changes for later review.'] },
  { name: 'Summer', reminders: ['Check soil moisture and crop stage before deciding when to irrigate.', 'Record pest and weather observations; ask a local adviser if symptoms spread.', 'Follow local water-use rules and product labels for any treatment.'] },
  { name: 'Autumn', reminders: ['Record harvest dates and crop observations in your farm tracker.', 'Use local guidance for handling diseased plant debris and crop residues.', 'Consider a laboratory soil test before planning amendments for next season.'] },
  { name: 'Winter', reminders: ['Review your farm notes and plan around local planting guidance.', 'Maintain and safely store farm tools and irrigation equipment.', 'Check with a local extension service about region-specific disease monitoring.'] },
];

export const GardeningTips = () => (
  <div className="min-h-screen bg-background pb-16">
    <NavBar />
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Seasonal crop care planning</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">A general planning checklist. Season timing and crop care vary by region, variety, and field conditions.</p>
      </div>
      <Card className="mb-6 border-amber-300/70 bg-amber-50/70 dark:bg-amber-950/20">
        <CardContent className="flex gap-3 p-4 text-sm leading-relaxed text-amber-950 dark:text-amber-100"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><p>This page does not give region-specific pesticide, fertilizer, or watering rates. Confirm diagnoses and treatment decisions with a qualified local adviser and follow local product labels.</p></CardContent>
      </Card>
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card><CardHeader><Droplet className="mb-2 h-6 w-6 text-primary" /><CardTitle>Water decisions</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Check field moisture, crop stage, and local water guidance. AgriWise does not calculate irrigation schedules.</CardContent></Card>
        <Card><CardHeader><Sprout className="mb-2 h-6 w-6 text-primary" /><CardTitle>Soil decisions</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Use representative laboratory results before choosing soil amendments. A soil photo cannot measure nutrients or pH.</CardContent></Card>
        <Card><CardHeader><BookOpen className="mb-2 h-6 w-6 text-primary" /><CardTitle>Disease observations</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Visible symptoms can overlap across causes. Take clear notes and seek field confirmation before treatment.</CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Seasonal planning checklist</CardTitle><CardDescription>Use these as prompts for your own records, not as a calendar for a specific crop or location.</CardDescription></CardHeader>
        <CardContent>
          <Tabs defaultValue="Spring">
            <TabsList className="mb-6 grid h-auto w-full grid-cols-2 sm:grid-cols-4">{seasons.map((season) => <TabsTrigger key={season.name} value={season.name}>{season.name}</TabsTrigger>)}</TabsList>
            {seasons.map((season) => <TabsContent key={season.name} value={season.name} className="space-y-3">{season.reminders.map((reminder) => <div key={reminder} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4"><ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><p className="text-sm">{reminder}</p></div>)}</TabsContent>)}
          </Tabs>
        </CardContent>
      </Card>
    </main>
  </div>
);

export default GardeningTips;
