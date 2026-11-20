import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import ImageUploader from '@/components/ImageUploader';
import DiagnosisResults from '@/components/DiagnosisResults';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DiagnosisResult } from '@/components/DiagnosisResults';
import { useTranslation } from '@/i18n/useTranslation';
import { useAuth } from '@/contexts/AuthContext';

export interface HistoryEntry {
  id: number;
  analyzedAt: string;
  imageUrl: string | null;
  results: DiagnosisResult;
}

export const Diagnosis = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const historyKey = `agriwise-diagnosis-history:${user?.id ?? 'guest'}`;
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState<DiagnosisResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Check if we navigated to this page with an analysis already performed
  useEffect(() => {
    if (location.state && location.state.imageUrl) {
      setImageUrl(location.state.imageUrl);
      if (location.state.results) {
        setResults(location.state.results);
      }
    }
  }, [location.state]);

  useEffect(() => {
    setHistory([]);
    try {
      let saved = localStorage.getItem(historyKey);
      if (!user && !saved) {
        saved = localStorage.getItem('agriwise-diagnosis-history');
        if (saved) localStorage.setItem(historyKey, saved);
        localStorage.removeItem('agriwise-diagnosis-history');
      }
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) setHistory(parsed.slice(0, 5) as HistoryEntry[]);
      }
    } catch {
      setHistory([]);
    }
  }, [historyKey, user]);

  const saveHistory = (data: DiagnosisResult, imgUrl: string | null) => {
    const entry = {
      id: Date.now(),
      analyzedAt: new Date().toISOString(),
      imageUrl: imgUrl,
      results: data,
    };

    const next = [entry, ...history].slice(0, 5);
    setHistory(next);
    try {
      localStorage.setItem(historyKey, JSON.stringify(next));
    } catch {
      // The screening still works when browser storage is disabled or full.
    }
  };

  const loadHistoryItem = (entry: HistoryEntry) => {
    setResults(entry.results);
    setImageUrl(entry.imageUrl);
  };

  const handleAnalysisComplete = (data: DiagnosisResult, imgUrl: string) => {
    setResults(data);
    setImageUrl(imgUrl);
    saveHistory(data, imgUrl);
  };

  const resetAnalysis = () => {
    setResults(null);
    setImageUrl(null);
    navigate(location.pathname, { replace: true, state: {} });
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <NavBar />
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('diagnosis.title')}</h1>
            <p className="text-muted-foreground">
              {t('diagnosis.subtitle')}
            </p>
          </div>
          {results && (
            <Button onClick={resetAnalysis} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              New Scan
            </Button>
          )}
        </div>

        <div className="space-y-8">
          <Card className="border-amber-300/70 bg-amber-50/70 dark:bg-amber-950/20"><CardContent className="flex gap-3 p-4 text-sm leading-relaxed text-amber-950 dark:text-amber-100"><Leaf className="mt-0.5 h-5 w-5 shrink-0" /><p>This project uses synthetic demo models. A result is not a verified diagnosis, and this page does not include validated crop-variety risk ratings. Confirm plant health with a qualified local adviser.</p></CardContent></Card>

          {history.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-semibold">Recent screening history</h2><p className="text-sm text-muted-foreground">Stored in this browser for this account. Photos and history are not uploaded as records.</p></div><Button variant="outline" size="sm" onClick={() => { setHistory([]); localStorage.removeItem(historyKey); }}><Trash2 className="mr-2 h-4 w-4" />Clear history</Button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.map((entry) => (
                  <Card key={entry.id} className="glass-panel">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(entry.analyzedAt).toLocaleString()}
                          </p>
                          <p className="font-semibold text-base mt-2">
                            {entry.results.healthy ? 'Healthy plant' : entry.results.diseaseName}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Confidence {entry.results.confidence}% · {entry.results.diseaseRisk ? entry.results.diseaseRisk.toUpperCase() : 'LOW RISK'}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => loadHistoryItem(entry)}>
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!results ? (
            <div className="max-w-3xl mx-auto">
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Leaf className="h-6 w-6 text-primary" />
                    {t('diagnosis.uploadTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ImageUploader onAnalysisComplete={handleAnalysisComplete} />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="animate-fade-in">
              <DiagnosisResults imageUrl={imageUrl} results={results} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Diagnosis;
