import { Bell, PlugZap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotificationPanel() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg"><Bell className="h-5 w-5 text-primary" />Alerts</CardTitle>
        <CardDescription>Alerts appear here when a verified data source is connected.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-5 text-center">
          <PlugZap className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
          <p className="max-w-sm text-sm text-muted-foreground">Weather warnings, market updates, and pest alerts are not connected yet. No alerts are being generated or sent.</p>
        </div>
      </CardContent>
    </Card>
  );
}
