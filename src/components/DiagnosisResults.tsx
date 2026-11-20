
import React from 'react';
import { CheckCircle, AlertTriangle, Info, Bug, Droplet, Leaf, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface DiagnosisResult {
  healthy: boolean;
  confidence: number;
  diseaseName: string | null;
  diseaseRisk: 'low' | 'medium' | 'high' | 'unknown' | null;
  severity?: 'unknown_demo' | 'not_assessed' | 'low' | 'medium' | 'high';
  demo_mode?: boolean;
  model_source?: string;
  needs_clearer_photo?: boolean;
  message?: string;
  remedy?: {
    organic: string[];
    chemical: string[];
    dosage: string;
    prevention: string[];
  };
  symptoms: string[];
  recommendations: {
    immediate: string[];
    preventive: string[];
  };
  similarCases: number;
}

interface DiagnosisResultsProps {
  imageUrl: string | null;
  results: DiagnosisResult;
  isLoading?: boolean;
}

export const DiagnosisResults = ({ 
  imageUrl, 
  results,
  isLoading = false 
}: DiagnosisResultsProps) => {
  const diagnosisResults = results;
  
  const getRiskColor = (risk: 'low' | 'medium' | 'high' | 'unknown' | null) => {
    switch (risk) {
      case 'low': return 'bg-nature-500';
      case 'medium': return 'bg-amber-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-sky-500';
    }
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-nature-600';
    if (confidence >= 60) return 'text-sky-600';
    if (confidence >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getDiseaseDescription = (diseaseName: string | null) => {
    if (!diseaseName) {
      return 'The model returned a healthy category. This synthetic demo cannot confirm that the plant is free of disease.';
    }

    return {
      'Apple Scab': 'A common fungal disease that causes olive-brown lesions on leaves. It can reduce photosynthesis and lead to early leaf drop if untreated.',
      'Cedar Apple Rust': 'A fungal infection that forms bright orange spots and cankers, often spreading between apple trees and nearby junipers.',
      'Black Rot': 'A serious disease that causes dark, sunken lesions on fruit and branches, potentially leading to significant crop loss if left untreated.'
    }[diseaseName] ?? 'The model returned a possible category. It has not confirmed a plant disease.';
  };

  const downloadReport = () => {
    const report = {
      analyzedAt: new Date().toISOString(),
      healthy: diagnosisResults.healthy,
      confidence: diagnosisResults.confidence,
      diseaseName: diagnosisResults.diseaseName,
      diseaseRisk: diagnosisResults.diseaseRisk,
      symptoms: diagnosisResults.symptoms,
      recommendations: diagnosisResults.recommendations,
      similarCases: diagnosisResults.similarCases,
      severity: diagnosisResults.severity,
      remedy: diagnosisResults.remedy,
      demo_mode: diagnosisResults.demo_mode,
      model_source: diagnosisResults.model_source,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagnosis-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const learnMoreUrl = diagnosisResults.diseaseName
    ? `https://en.wikipedia.org/wiki/${encodeURIComponent(diagnosisResults.diseaseName.replace(/\s+/g, '_'))}`
    : 'https://en.wikipedia.org/wiki/Plant_disease';

  if (isLoading) {
    return (
      <Card className="w-full animate-pulse glass-panel">
        <CardHeader>
          <div className="h-7 w-1/3 bg-muted rounded-md" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-32 bg-muted rounded-md" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded-md" />
            <div className="h-4 w-4/5 bg-muted rounded-md" />
            <div className="h-4 w-3/5 bg-muted rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full glass-panel overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-xl">
          {diagnosisResults.healthy ? (
            <>
              <CheckCircle className="mr-2 h-5 w-5 text-nature-600" />
              Screening label: healthy
            </>
          ) : (
            <>
              <AlertTriangle className="mr-2 h-5 w-5 text-amber-600" />
              Possible screening category: {diagnosisResults.diseaseName}
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {diagnosisResults.demo_mode && (
          <div role="alert" className="rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm font-medium text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
            DEMO MODE — this synthetic result is not an accurate diagnosis. Do not apply treatment based on it.
          </div>
        )}
        {diagnosisResults.needs_clearer_photo && (
          <div role="status" className="rounded-xl border border-sky-300 bg-sky-50 p-4 text-sm text-sky-950 dark:bg-sky-950/30 dark:text-sky-100">
            Confidence is low. Upload a sharper close-up of one leaf in natural light, then confirm with a local agronomist.
          </div>
        )}
        <div className="rounded-2xl border border-muted/70 bg-muted/80 p-4 text-sm text-muted-foreground">
          {getDiseaseDescription(diagnosisResults.diseaseName)}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Severity</div>
            <div className="text-sm">Severity cannot be determined from this image classification.</div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-sm font-medium text-foreground shadow-sm">
              <span className={`h-2.5 w-2.5 rounded-full ${getRiskColor(diagnosisResults.diseaseRisk)}`} />
              {diagnosisResults.severity === 'unknown_demo' || diagnosisResults.severity === 'not_assessed' ? 'SEVERITY NOT ASSESSED' : diagnosisResults.diseaseRisk ? diagnosisResults.diseaseRisk.toUpperCase() : 'HEALTHY'}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-5">
          <div className="md:w-1/2">
            {imageUrl && (
              <div className="rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 border">
                <img 
                  src={imageUrl} 
                  alt="Analyzed plant" 
                  className="w-full h-[300px] object-contain" 
                />
              </div>
            )}
          </div>
          
          <div className="md:w-1/2 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-medium text-sm">Model score (not calibrated)</h4>
                <span className={cn("font-medium", getConfidenceColor(diagnosisResults.confidence))}>
                  {diagnosisResults.confidence}%
                </span>
              </div>
              <Progress 
                value={diagnosisResults.confidence} 
                className="h-2" 
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Less confident</span>
                <span>More confident</span>
              </div>
            </div>
            
            {!diagnosisResults.healthy && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <h4 className="font-medium text-sm">Reference category</h4>
                  <Badge 
                    variant={
                      diagnosisResults.diseaseRisk === 'high' ? 'destructive' :
                      diagnosisResults.diseaseRisk === 'medium' ? 'default' :
                      'secondary'
                    }
                  >
                    {diagnosisResults.diseaseRisk?.toUpperCase()}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2">Reference symptoms (not detected)</h4>
                  <ul className="space-y-1">
                    {diagnosisResults.symptoms.map((symptom, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <Bug className="h-4 w-4 mr-2 mt-0.5 text-amber-500" />
                        {symptom}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            <div className="text-sm flex items-center text-muted-foreground">
              <Info className="h-4 w-4 mr-2" />
                  <span>{diagnosisResults.model_source ? `Model: ${diagnosisResults.model_source.replace(/_/g, ' ')}` : 'Image screening result'}</span>
            </div>
          </div>
        </div>
        
        {!diagnosisResults.healthy && (
          <div className="pt-2">
            <h3 className="font-medium text-lg mb-3">General reference notes</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-primary/5 p-4 rounded-lg space-y-3">
                <h4 className="flex items-center font-medium">
                  <Droplet className="h-4 w-4 mr-2 text-primary" />
                  Organic and non-chemical options
                </h4>
                <ul className="space-y-2">
                  {diagnosisResults.recommendations.immediate.map((rec, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <div className="h-5 w-5 bg-primary/10 rounded-full flex items-center justify-center mr-2 mt-0.5">
                        <span className="text-xs font-medium">{index + 1}</span>
                      </div>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-secondary/30 p-4 rounded-lg space-y-3">
                <h4 className="flex items-center font-medium">
                  <Leaf className="h-4 w-4 mr-2 text-nature-600" />
                  Preventive Measures
                </h4>
                <ul className="space-y-2">
                  {diagnosisResults.recommendations.preventive.map((rec, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <div className="h-5 w-5 bg-nature-100 dark:bg-nature-900/30 rounded-full flex items-center justify-center mr-2 mt-0.5">
                        <span className="text-xs font-medium">{index + 1}</span>
                      </div>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {diagnosisResults.remedy && (
              <div className="mt-4 rounded-lg border p-4">
                <h4 className="font-medium">Chemical option and dosage guidance</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {diagnosisResults.remedy.chemical.map((item, index) => <li key={`chemical-${index}`}>{item}</li>)}
                </ul>
                <p className="mt-3 text-sm text-muted-foreground"><strong>Dosage:</strong> {diagnosisResults.remedy.dosage}</p>
                <p className="mt-2 text-xs text-muted-foreground">Use only products registered for the crop in your region and follow the label, protective equipment, and harvest interval.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <Separator />
      <CardFooter className="flex justify-between pt-4">
        <Button variant="outline" onClick={downloadReport}>
          Save Report
        </Button>
        <Button asChild>
          <a href={learnMoreUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Learn More
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DiagnosisResults;
