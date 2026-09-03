import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClaimProvider } from './context/ClaimContext';
import { MainLayout } from './layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { ClaimsList } from './pages/ClaimsList';
import { ClaimDetail } from './pages/ClaimDetail';
import { Eligibility } from './pages/Eligibility';
import { Recovery } from './pages/Recovery';
import { Analytics } from './pages/Analytics';
import { PriorAuthorization } from './pages/PriorAuthorization';
import { DRGGrouper } from './pages/DRGGrouper';
import { RemittanceReconciliation } from './pages/RemittanceReconciliation';
import { ContractAuditing } from './pages/ContractAuditing';
import { CDICopilot } from './pages/CDICopilot';
import { GoodFaithEstimate } from './pages/GoodFaithEstimate';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ClaimProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="claims" element={<ClaimsList />} />
              <Route path="claims/:id" element={<ClaimDetail />} />
              <Route path="eligibility" element={<Eligibility />} />
              <Route path="recovery" element={<Recovery />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="prior-auth" element={<PriorAuthorization />} />
              <Route path="drg-grouper" element={<DRGGrouper />} />
              <Route path="remittance" element={<RemittanceReconciliation />} />
              <Route path="contract-auditing" element={<ContractAuditing />} />
              <Route path="cdi-copilot" element={<CDICopilot />} />
              <Route path="good-faith-estimate" element={<GoodFaithEstimate />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ClaimProvider>
    </QueryClientProvider>
  );
};

export default App;
