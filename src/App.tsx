import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from './components/Layout';
import { LanguageProvider } from './i18n/LanguageProvider';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const Index = lazy(() => import("./pages/Index"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const Chatbot = lazy(() => import("./pages/Chatbot"));
const CropManagement = lazy(() => import("./pages/CropManagement"));
const MarketTrends = lazy(() => import("./pages/MarketTrends"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SignInForm = lazy(() => import("./pages/SignInForm").then((module) => ({ default: module.SignInForm })));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const Diagnosis = lazy(() => import("./pages/Diagnosis"));
const SoilAnalysis = lazy(() => import("./pages/SoilAnalysis"));
const SupplyChain = lazy(() => import("./pages/SupplyChain"));
const GardeningTips = lazy(() => import("./pages/GardeningTips"));
const TaskTracker = lazy(() => import("./pages/TaskTracker"));
const ResearchTools = lazy(() => import("./pages/ResearchTools").then((module) => ({ default: module.ResearchTools })));

const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
  <LanguageProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center" role="status">Loading page…</div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/market-trends" element={<MarketTrends />} />
              <Route path="/signin" element={<SignInForm />} />
              <Route path="/reset-password" element={<SignInForm />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/diagnosis" element={<Diagnosis />} />
              <Route path="/soil-analysis" element={<SoilAnalysis />} />
              <Route path="/supply-chain" element={<SupplyChain />} />
              <Route path="/gardening-tips" element={<GardeningTips />} />
              <Route path="/researcher/tools" element={<ResearchTools />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/crop-management" element={<CropManagement />} />
                <Route path="/researcher/plants" element={<CropManagement />} />
                <Route path="/gardener/tasks" element={<TaskTracker />} />
              </Route>

              {/* Dashboard Redirects */}
              <Route path="/farmer/market" element={<MarketTrends />} />
              <Route path="/farmer/prices" element={<MarketTrends />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </LanguageProvider>
  </AuthProvider>
);

export default App;
