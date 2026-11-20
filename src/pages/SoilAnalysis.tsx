import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import NavBar from '@/components/NavBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  Sprout,
  Upload,
} from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { Link } from 'react-router-dom';

type SoilStatus = 'looks_good' | 'needs_attention' | 'unclear';
type SoilRecommendation = { title: string; detail: string; priority: 'now' | 'soon' | 'testing' };
type SoilAssessment = {
  status: SoilStatus;
  summary: string;
  observations: string[];
  recommendations: SoilRecommendation[];
  tests_to_confirm: string[];
  source: 'mobilenetv2' | 'mobilenetv2_demo' | 'visual_demo';
  soil_type: 'sandy' | 'clay' | 'loamy' | 'silty' | 'black' | 'red' | 'alluvial';
  confidence: number;
  demo_mode: boolean;
  needs_clearer_photo: boolean;
  crops: string[];
  irrigation: string;
  fertilizer: string;
  disease_care_link: { title: string; detail: string; path: string };
  limitations: string;
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const statusLabels: Record<SoilStatus, string> = {
  looks_good: 'Looks good from visible clues',
  needs_attention: 'Visible issues to address',
  unclear: 'More information needed',
};

const priorityLabels = { now: 'Start here', soon: 'Next step', testing: 'Confirm with a test' };

const SoilAnalysis = () => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<SoilAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const chooseFile = (candidate?: File) => {
    setError(null);
    setAssessment(null);
    if (!candidate) return;
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      setFile(null);
      setError('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (candidate.size > MAX_IMAGE_SIZE) {
      setFile(null);
      setError('The image must be 10 MB or smaller.');
      return;
    }
    setFile(candidate);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => chooseFile(event.target.files?.[0]);

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  };

  const analyzePhoto = async () => {
    if (!file) return;
    setError(null);
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch('/api/soil-diagnose', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.detail || 'Could not analyze this photo. Please try another image.');
      setAssessment(data as SoilAssessment);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The soil analysis service is unavailable.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setAssessment(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const statusIcon = assessment?.status === 'looks_good'
    ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
    : <AlertTriangle className="h-5 w-5 text-amber-600" />;

  return (
    <div className="min-h-screen bg-background pb-16">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Sprout className="h-4 w-4" /> Soil care
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('soil.title')}</h1>
          <p className="mt-3 text-muted-foreground">
            Upload a clear photo of exposed soil for a visual screening and practical care suggestions.
          </p>
        </div>

        <Alert className="mb-6 border-amber-300/70 bg-amber-50/70 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
          <FlaskConical className="h-4 w-4" />
          <AlertTitle>A photo cannot measure soil chemistry</AlertTitle>
          <AlertDescription>
            pH, nutrients, salinity, and contamination need a soil test. Use the visual suggestions as a starting point, and test before adding fertilizer or other amendments.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
          <Card>
            <CardHeader>
              <CardTitle>{t('soil.upload')}</CardTitle>
              <CardDescription>For best results, photograph bare soil in natural light without filters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={onFileChange}
                aria-label="Choose a soil photo"
              />
              <label
                onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
              >
                {preview ? (
                  <img src={preview} alt="Selected soil sample" className="max-h-72 w-full rounded-lg object-contain" />
                ) : (
                  <>
                    <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <ImagePlus className="h-6 w-6" />
                    </span>
                    <span className="font-medium">Choose a photo or drop it here</span>
                    <span className="mt-1 text-sm text-muted-foreground">JPG, PNG, or WebP · up to 10 MB</span>
                  </>
                )}
              </label>

              {file && <p className="truncate text-sm text-muted-foreground">Selected: {file.name}</p>}
              {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}

              <div className="flex flex-wrap gap-3">
                <Button onClick={analyzePhoto} disabled={!file || isAnalyzing} className="gap-2">
                  {isAnalyzing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {isAnalyzing ? t('soil.checking') : t('soil.analyze')}
                </Button>
                {(file || assessment) && (
                  <Button variant="outline" onClick={reset} disabled={isAnalyzing} className="gap-2">
                    <RefreshCw className="h-4 w-4" /> New photo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="min-h-80">
            {!assessment ? (
              <CardContent className="flex h-full min-h-80 flex-col items-center justify-center px-8 text-center">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Sprout className="h-7 w-7" />
                </span>
                <h2 className="text-lg font-semibold">Your assessment will appear here</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  The check looks for visible surface clues and suggests safe next steps. It does not replace field inspection or a lab test.
                </p>
              </CardContent>
            ) : (
              <>
                <CardHeader>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 font-semibold">{statusIcon}{statusLabels[assessment.status]}</span>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {assessment.demo_mode ? 'DEMO MODE — not accurate' : 'MobileNetV2 screening'}
                    </span>
                  </div>
                  <div className="mb-3 rounded-lg bg-muted/60 p-3 text-sm">
                    <strong>Suggested soil type:</strong> {assessment.soil_type} · {assessment.confidence}% confidence
                    {assessment.needs_clearer_photo && <p className="mt-1 text-amber-700 dark:text-amber-300">Confidence is low. Upload a clear, close-up photo of bare soil in natural light.</p>}
                  </div>
                  <CardDescription>{assessment.summary}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {assessment.observations.length > 0 && (
                    <section>
                      <h3 className="mb-2 text-sm font-semibold">Visible clues</h3>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {assessment.observations.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                      </ul>
                    </section>
                  )}
                  <section>
                    <h3 className="mb-3 text-sm font-semibold">Suggested next steps</h3>
                    <div className="space-y-3">
                      {assessment.recommendations.map((item, index) => (
                        <div key={`${item.title}-${index}`} className="rounded-lg border p-3">
                          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                            <h4 className="font-medium">{item.title}</h4>
                            <span className="text-xs text-muted-foreground">{priorityLabels[item.priority]}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.detail}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <h3 className="text-sm font-semibold">{assessment.disease_care_link.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{assessment.disease_care_link.detail}</p>
                    <Button asChild variant="link" className="mt-2 h-auto p-0">
                      <Link to={assessment.disease_care_link.path}>Open plant disease diagnosis</Link>
                    </Button>
                  </section>
                  {assessment.tests_to_confirm.length > 0 && (
                    <section className="rounded-lg bg-muted/60 p-4">
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><FlaskConical className="h-4 w-4" /> To confirm soil health</h3>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {assessment.tests_to_confirm.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                      </ul>
                    </section>
                  )}
                  <p className="border-t pt-4 text-xs text-muted-foreground">{assessment.limitations}</p>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SoilAnalysis;
