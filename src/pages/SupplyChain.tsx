import NavBar from '@/components/NavBar';
import { AlertCircle, Route, ThermometerSnowflake, Truck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const connections = [
  { title: 'Shipments', detail: 'No transport or shipment tracking provider is connected.', icon: Truck },
  { title: 'Cold storage sensors', detail: 'No temperature, humidity, or inventory sensors are connected.', icon: ThermometerSnowflake },
  { title: 'Delivery routes', detail: 'No route planning or live vehicle location data is available.', icon: Route },
];

export const SupplyChain = () => (
  <div className="min-h-screen bg-background pb-16">
    <NavBar />
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Supply chain and logistics</h1>
        <p className="mt-2 text-muted-foreground">Connect a verified logistics or sensor provider to show operational data here.</p>
      </div>
      <Card className="mb-6 border-amber-300/70">
        <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-amber-600" />No live data connected</CardTitle><CardDescription>Shipment, storage, driver, and sensor information is not available in this project.</CardDescription></CardHeader>
        <CardContent><p className="text-sm leading-relaxed text-muted-foreground">The sample shipment details and sensor readings from the starter project were not connected to a real provider, so they have been removed. No live tracking or storage alerts are currently generated.</p></CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-3">
        {connections.map((connection) => <Card key={connection.title}><CardHeader><connection.icon className="mb-2 h-6 w-6 text-muted-foreground" /><CardTitle>{connection.title}</CardTitle><CardDescription>{connection.detail}</CardDescription></CardHeader></Card>)}
      </div>
    </main>
  </div>
);

export default SupplyChain;
