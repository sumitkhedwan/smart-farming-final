import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, Leaf, Sprout } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const tools = [
  { title: 'Plant photo screening', description: 'Synthetic demo model only; the output is not a verified diagnosis.', href: '/diagnosis', icon: Leaf, status: 'Demo' },
  { title: 'Soil photo screening', description: 'Visual category example only; it does not measure pH or nutrients.', href: '/soil-analysis', icon: Sprout, status: 'Demo' },
  { title: 'Private farm tasks', description: 'Record and manage your own farm reminders after signing in.', href: '/gardener/tasks', icon: ClipboardList, status: 'Account required' },
];

export function ResearchTools() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-6xl space-y-6 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold">Research and farm tools</h1>
          <p className="text-muted-foreground">Open the tools currently included in AgriWise and review their data limits.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {tools.map((tool) => (
            <Card key={tool.href}>
              <CardHeader>
                <tool.icon className="mb-2 h-6 w-6 text-primary" />
                <div className="flex items-center justify-between gap-3"><CardTitle>{tool.title}</CardTitle><Badge variant="outline">{tool.status}</Badge></div>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent><Button asChild variant="outline" className="gap-2"><Link to={tool.href}>Open tool<ArrowRight className="h-4 w-4" /></Link></Button></CardContent>
            </Card>
          ))}
          <Card>
            <CardHeader><CardTitle>Research data</CardTitle><CardDescription>AgriWise does not include a connected climate archive, research paper catalogue, or instrument feed. No recent activity is recorded on this page.</CardDescription></CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
