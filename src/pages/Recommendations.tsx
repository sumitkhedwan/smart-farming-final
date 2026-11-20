import { Link } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { AlertTriangle, ArrowRight, ClipboardList, CloudSun, Leaf, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const guidance = [
  { title: 'Plant photo screening', text: 'The included image model uses synthetic demo data. It cannot confirm a disease or prescribe treatment.', icon: Leaf, href: '/diagnosis', action: 'View screening limits' },
  { title: 'Soil and fertilizer', text: 'A soil photograph cannot measure pH or nutrients. Use a laboratory soil test before choosing amendments.', icon: Sprout, href: '/soil-analysis', action: 'View soil screening' },
  { title: 'Local weather', text: 'A current forecast is available after you choose to share your location. No forecast-based farm advice is generated.', icon: CloudSun, href: '/', action: 'Open weather' },
  { title: 'Your farm plan', text: 'Keep your own planting dates and reminders in your private account. Tasks are not generated automatically.', icon: ClipboardList, href: '/gardener/tasks', action: 'Open task tracker' },
];

export default function Recommendations() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Recommendations and guidance</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">AgriWise does not currently calculate personalized farming recommendations. Use these tools with verified local agronomy guidance.</p>
        </div>
        <Card className="mb-6 border-amber-300/70 bg-amber-50/70 dark:bg-amber-950/20">
          <CardContent className="flex gap-3 p-4 text-sm leading-relaxed text-amber-950 dark:text-amber-100"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><p>There is no validated crop-specific recommendation engine, market feed, or alert provider connected. The demo model and general reference notes are not a substitute for field inspection, soil testing, or qualified local advice.</p></CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          {guidance.map((item) => (
            <Card key={item.title} className="h-full">
              <CardHeader><item.icon className="mb-2 h-6 w-6 text-primary" /><CardTitle>{item.title}</CardTitle><CardDescription>{item.text}</CardDescription></CardHeader>
              <CardContent><Button asChild variant="outline" className="gap-2"><Link to={item.href}>{item.action}<ArrowRight className="h-4 w-4" /></Link></Button></CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
