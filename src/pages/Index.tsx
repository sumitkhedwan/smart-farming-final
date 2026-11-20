import React, { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CloudSun, Leaf, ShieldAlert, Sprout, Tractor } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import NavBar from '@/components/NavBar';
const Hero3D = lazy(() => import('@/components/Hero3D'));
import ImageUploader from '@/components/ImageUploader';
import DiagnosisResults, { type DiagnosisResult } from '@/components/DiagnosisResults';
import WeatherWidget from '@/components/WeatherWidget';
import NotificationPanel from '@/components/NotificationPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants: Variants = { hidden: { y: 12, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.35 } } };

const Index = () => {
  const [analysisResults, setAnalysisResults] = React.useState<DiagnosisResult | null>(null);
  const [analysisImageUrl, setAnalysisImageUrl] = React.useState<string | null>(null);

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-background via-background to-muted/40">
      <NavBar />
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[520px] opacity-80"><Suspense fallback={null}><Hero3D /></Suspense></div>

      <motion.main initial="hidden" animate="visible" variants={containerVariants} className="mx-auto max-w-7xl space-y-12 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <motion.section variants={itemVariants} className="grid min-h-[360px] items-center gap-8 md:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 px-3 py-1 text-primary"><Leaf className="mr-2 h-4 w-4" />Practical tools for growers</Badge>
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">Grow smarter with <span className="text-primary">AgriWise</span></h1>
              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">Screen plant and soil photos, keep your farm details in one place, and use guidance that explains its limits.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="gap-2" onClick={() => document.getElementById('plant-screening')?.scrollIntoView({ behavior: 'smooth' })}>Screen a plant <ArrowRight className="h-4 w-4" /></Button>
              <Button asChild size="lg" variant="outline" className="gap-2"><Link to="/soil-analysis"><Sprout className="h-5 w-5" />Screen soil</Link></Button>
            </div>
          </div>
          <Card className="border-amber-300/70 bg-amber-50/90 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg"><ShieldAlert className="h-5 w-5" />Photo screening demo</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm leading-relaxed">
              <p>Plant and soil predictions currently use synthetic demo models. Results are examples, not measured diagnoses, laboratory tests, or treatment instructions.</p>
              <p>Confirm plant disease with a qualified local agronomist and test soil before applying fertilizer or amendments.</p>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section variants={itemVariants} id="plant-screening" className="scroll-mt-24">
          <Card className="overflow-hidden border-2 border-primary/20 bg-background/90 shadow-xl">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-3 text-2xl"><Leaf className="h-7 w-7 text-primary" />Plant photo screening</CardTitle>
              <CardDescription>Upload a clear JPEG, PNG, or WebP image to see the demo model output and reviewed general care notes.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-8">
              {!analysisResults ? (
                <ImageUploader onAnalysisComplete={(results, imageUrl) => { setAnalysisResults(results); setAnalysisImageUrl(imageUrl); }} />
              ) : (
                <div className="space-y-4">
                  <DiagnosisResults imageUrl={analysisImageUrl} results={analysisResults} />
                  <Button variant="outline" onClick={() => { setAnalysisResults(null); setAnalysisImageUrl(null); }}>Start another screening</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>

        <motion.section variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
          <WeatherWidget />
          <NotificationPanel />
        </motion.section>

        <motion.section variants={containerVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Farm workspace', detail: 'Set up your private profile and farm information.', icon: Tractor, href: '/profile', action: 'Open profile' },
            { title: 'Crop tracking', detail: 'Keep your planting and harvest details together.', icon: Sprout, href: '/crop-management', action: 'Manage crops' },
            { title: 'Market data', detail: 'Market prices are not connected to a verified provider yet.', icon: CloudSun, href: '/market-trends', action: 'View status' },
            { title: 'Agronomy assistant', detail: 'Ask about the guidance included with this app.', icon: Leaf, href: '/chatbot', action: 'Ask a question' },
          ].map((item) => (
            <motion.div key={item.title} variants={itemVariants}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader><item.icon className="mb-2 h-6 w-6 text-primary" /><CardTitle className="text-lg">{item.title}</CardTitle><CardDescription>{item.detail}</CardDescription></CardHeader>
                <CardContent><Button asChild variant="outline" size="sm" className="gap-2"><Link to={item.href}>{item.action}<ArrowRight className="h-4 w-4" /></Link></Button></CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.section>
      </motion.main>
    </div>
  );
};

export default Index;
