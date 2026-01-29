import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Verify from "./pages/Verify";
import DirectTest from "./pages/DirectTest";
import MrtPartnerTest from "./pages/MrtPartnerTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/direct-test" element={<DirectTest />} />
          <Route path="/mrt-partner-test" element={<MrtPartnerTest />} />
          {/* 파트너 경로: 예약된 경로가 아닌 모든 경로는 Index 컴포넌트로 처리 */}
          {/* Index 컴포넌트 내에서 extractPartnerIdFromPath()로 파트너 ID 추출 */}
          <Route path="*" element={<Index />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
