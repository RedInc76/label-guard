import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PermissionsOnboarding } from "./components/PermissionsOnboarding";
import { Home } from "./pages/Home";
import { Scanner } from "./pages/Scanner";
import { Profile } from "./pages/Profile";
import { Results } from "./pages/Results";
import { Auth } from "./pages/Auth";
import { EmailConfirmed } from "./pages/EmailConfirmed";
import { PhotoAnalysis } from "./pages/PhotoAnalysis";
import { History } from "./pages/History";
import { Favorites } from "./pages/Favorites";
import { Terms } from "./pages/Terms";
import { Permissions } from "./pages/Permissions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PermissionsOnboarding />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/scanner" element={<Scanner />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/results" element={<Results />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/email-confirmed" element={<EmailConfirmed />} />
              <Route path="/photo-analysis" element={<ProtectedRoute><PhotoAnalysis /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
              <Route path="/permissions" element={<Permissions />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
