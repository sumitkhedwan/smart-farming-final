import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Leaf, Settings2, Sprout, UserRound } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const actions = [
  { title: 'Plant photo screening', description: 'Try the synthetic demonstration model with a clear plant photo.', href: '/diagnosis', icon: Leaf },
  { title: 'Soil photo screening', description: 'See a demo soil category and general care notes.', href: '/soil-analysis', icon: Sprout },
  { title: 'Market trends', description: 'Check whether a verified price provider is connected.', href: '/market-trends', icon: BarChart3 },
  { title: 'Account settings', description: 'Update your profile, farm details, and preferences.', href: '/settings', icon: Settings2 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const name = typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '';
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-medium text-primary">AgriWise workspace</p><h1 className="mt-1 text-3xl font-bold">Welcome{ name ? `, ${name}` : ''}</h1><p className="mt-2 text-muted-foreground">Choose a tool or update your account details.</p></div>
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <Avatar><AvatarImage src={typeof user?.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : undefined} alt="" /><AvatarFallback>{initials}</AvatarFallback></Avatar>
            <div className="min-w-0"><p className="truncate text-sm font-medium">{name || 'Your account'}</p><p className="max-w-[230px] truncate text-xs text-muted-foreground">{user?.email}</p></div>
            <Button variant="ghost" size="icon" asChild aria-label="View profile"><Link to="/profile"><UserRound className="h-4 w-4" /></Link></Button>
          </div>
        </div>

        <Card className="mb-8 border-amber-300/70 bg-amber-50/70 dark:bg-amber-950/20">
          <CardContent className="flex gap-3 p-4 text-sm leading-relaxed text-amber-950 dark:text-amber-100">
            <Leaf className="mt-0.5 h-5 w-5 shrink-0" /><p>Photo screening uses synthetic demo models. The app has no verified market feed or alert delivery provider connected yet. You will see a clear status instead of estimates.</p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {actions.map((action) => (
            <Card key={action.href} className="h-full transition-shadow hover:shadow-md">
              <CardHeader><action.icon className="mb-2 h-6 w-6 text-primary" /><CardTitle>{action.title}</CardTitle><CardDescription>{action.description}</CardDescription></CardHeader>
              <CardContent><Button asChild variant="outline" className="gap-2"><Link to={action.href}>Open tool <ArrowRight className="h-4 w-4" /></Link></Button></CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
