import { BarChart3, CircleAlert, ExternalLink } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MarketTrends() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8"><h1 className="text-3xl font-bold">Market trends</h1><p className="mt-2 text-muted-foreground">Review verified crop prices and market changes when a trusted feed is connected.</p></div>
        <Card className="border-amber-300/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CircleAlert className="h-5 w-5 text-amber-600" />No market feed connected</CardTitle>
            <CardDescription>AgriWise is not connected to an official market price source.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">Prices, trading volumes, and trend percentages are not displayed until a trusted provider is configured. Check your local market or an official agricultural market portal for current prices.</p>
            <Button asChild variant="outline" className="gap-2"><a href="https://agmarknet.gov.in/" target="_blank" rel="noreferrer"><BarChart3 className="h-4 w-4" />Visit AGMARKNET<ExternalLink className="h-3.5 w-3.5" /></a></Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
