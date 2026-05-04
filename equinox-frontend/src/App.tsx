import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { store } from './store';
import type { AppDispatch } from './store';
import { PageLoader } from './components/ui/LoadingSpinner';
import { fetchMeAsync } from './store/slices/authSlice';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// ─── MARKETPLACE PAGES ────────────────────────────────────────────────────────
import HomePage from './pages/marketplace/HomePage';
import ProvidersPage from './pages/marketplace/ProvidersPage';
import ProviderProfilePage from './pages/marketplace/ProviderProfilePage';
import BrowsePage from './pages/marketplace/BrowsePage';
import ContactPage from './pages/marketplace/ContactPage';
import GetStartedPage from './pages/marketplace/GetStartedPage';
import AboutPage from './pages/marketplace/AboutPage';
import PricingPage from './pages/marketplace/PricingPage';
import LoginPage from './pages/marketplace/LoginPage';
import SignupPage from './pages/marketplace/SignupPage';

// ─── SOLUTIONS PAGES ─────────────────────────────────────────────────────────
import EnterprisesPage from './pages/solutions/EnterprisesPage';
import SMBsPage from './pages/solutions/SMBsPage';
import FreelancersPage from './pages/solutions/FreelancersPage';
import IntegrationsPage from './pages/solutions/IntegrationsPage';

// ─── LEGAL PAGES ─────────────────────────────────────────────────────────────
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage';
import TermsPage from './pages/legal/TermsPage';
import CookiePolicyPage from './pages/legal/CookiePolicyPage';

// ─── PROVIDER PORTAL ─────────────────────────────────────────────────────────
import ProviderDashboard from './pages/provider/ProviderDashboard';
import TasksPage from './pages/provider/TasksPage';
import ContractsPage from './pages/provider/ContractsPage';
import PLReportPage from './pages/provider/PLReportPage';
import InvoicesProviderPage from './pages/provider/InvoicesProviderPage';

// ─── BUYER PORTAL ─────────────────────────────────────────────────────────────
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import WalletPage from './pages/buyer/WalletPage';
import ComplaintsPage from './pages/buyer/ComplaintsPage';
import AIInsightsPage from './pages/buyer/AIInsightsPage';
import BuyerOrdersPage from './pages/buyer/BuyerOrdersPage';
import BuyerOrderDetailPage from './pages/buyer/BuyerOrderDetailPage';
import BuyerAnalyticsPage from './pages/buyer/BuyerAnalyticsPage';
import BuyerIntegrationsPage from './pages/buyer/BuyerIntegrationsPage';
import BuyerReviewsPage from './pages/buyer/BuyerReviewsPage';
import BuyerMarketplacePage from './pages/buyer/BuyerMarketplacePage';
import BuyerProvidersPage from './pages/buyer/BuyerProvidersPage';
import BuyerTasksPage from './pages/buyer/BuyerTasksPage';
import BuyerMeetingsPage from './pages/buyer/BuyerMeetingsPage';

// ─── EMPLOYEE PORTAL ──────────────────────────────────────────────────────────
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import KPIPage from './pages/employee/KPIPage';
import LeavePage from './pages/employee/LeavePage';
import LearningPage from './pages/employee/LearningPage';
import TeamPage from './pages/employee/TeamPage';
import AttendancePage from './pages/employee/AttendancePage';
import EmployeeMeetingsPage from './pages/employee/EmployeeMeetingsPage';
import PerformancePage from './pages/employee/PerformancePage';
import EmployeeTaskBoardPage from './pages/employee/EmployeeTaskBoardPage';
import EmployeeProfilePage from './pages/employee/EmployeeProfilePage';

// ─── PROVIDER PORTAL (additional) ────────────────────────────────────────────
import MeetingsPage from './pages/provider/MeetingsPage';
import ProviderClientsPage from './pages/provider/ProviderClientsPage';
import ProviderTeamPage from './pages/provider/ProviderTeamPage';
import ProviderSalesPage from './pages/provider/ProviderSalesPage';
import ProviderReviewsPage from './pages/provider/ProviderReviewsPage';
import ProviderTrainingPage from './pages/provider/ProviderTrainingPage';
import ProviderVerificationPage from './pages/provider/ProviderVerificationPage';
import ProviderFeaturedPage from './pages/provider/ProviderFeaturedPage';

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersPage from './pages/admin/UsersPage';
import AdminProvidersPage from './pages/admin/AdminProvidersPage';
import AdminProviderDetailPage from './pages/admin/AdminProviderDetailPage';
import AdminInvoicesPage from './pages/admin/AdminInvoicesPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminComplaintsPage from './pages/admin/AdminComplaintsPage';
import AdminAssetsPage from './pages/admin/AdminAssetsPage';
import AdminBuyersPage from './pages/admin/AdminBuyersPage';
import AdminEmployeesPage from './pages/admin/AdminEmployeesPage';
import AdminFinancePage from './pages/admin/AdminFinancePage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminTrainingPage from './pages/admin/AdminTrainingPage';
import AdminMarketplaceControlPage from './pages/admin/AdminMarketplaceControlPage';
import AdminSecurityPage from './pages/admin/AdminSecurityPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';

// ─── SHARED ───────────────────────────────────────────────────────────────────
import SettingsPage from './pages/shared/SettingsPage';
import NotFoundPage from './pages/shared/NotFoundPage';

/** Placeholder for pages under construction */
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="text-5xl mb-4">🚧</div>
      <p className="text-xl font-bold text-surface-800">{title}</p>
      <p className="text-surface-500 text-sm mt-1">This page is coming soon.</p>
    </div>
  </div>
);

// Restores session from localStorage on app boot
function SessionRestorer() {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (localStorage.getItem('equinox_access')) {
      dispatch(fetchMeAsync());
    }
  }, [dispatch]);
  return null;
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <SessionRestorer />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public / Marketplace ── */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/providers" element={<ProvidersPage />} />
              <Route path="/providers/:id" element={<ProviderProfilePage />} />
              <Route path="/marketplace/browse" element={<BrowsePage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/services" element={<ProvidersPage />} />
              {/* Solutions */}
              <Route path="/solutions/enterprises" element={<EnterprisesPage />} />
              <Route path="/solutions/smbs" element={<SMBsPage />} />
              <Route path="/solutions/freelancers" element={<FreelancersPage />} />
              <Route path="/integrations" element={<IntegrationsPage />} />
              {/* Legal */}
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/cookies" element={<CookiePolicyPage />} />
            </Route>

            {/* ── Onboarding (no nav shell) ── */}
            <Route path="/get-started" element={<GetStartedPage />} />

            {/* ── Auth ── */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>

            {/* ── Provider Portal ── */}
            <Route path="/provider" element={<DashboardLayout />}>
              <Route index element={<ProviderDashboard />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="contracts" element={<ContractsPage />} />
              <Route path="clients" element={<ProviderClientsPage />} />
              <Route path="meetings" element={<MeetingsPage />} />
              <Route path="team" element={<ProviderTeamPage />} />
              <Route path="sales" element={<ProviderSalesPage />} />
              <Route path="pl" element={<PLReportPage />} />
              <Route path="invoices" element={<InvoicesProviderPage />} />
              <Route path="reviews" element={<ProviderReviewsPage />} />
              <Route path="training"      element={<ProviderTrainingPage />} />
              <Route path="verification" element={<ProviderVerificationPage />} />
              <Route path="featured"      element={<ProviderFeaturedPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="settings"     element={<SettingsPage />} />
            </Route>

            {/* ── Buyer Portal ── */}
            <Route path="/buyer" element={<DashboardLayout />}>
              <Route index element={<BuyerDashboard />} />
              <Route path="marketplace" element={<BuyerMarketplacePage />} />
              <Route path="providers" element={<BuyerProvidersPage />} />
              <Route path="services" element={<ProvidersPage />} />
              <Route path="orders" element={<BuyerOrdersPage />} />
              <Route path="orders/:id" element={<BuyerOrderDetailPage />} />
              <Route path="tasks" element={<BuyerTasksPage />} />
              <Route path="meetings" element={<BuyerMeetingsPage />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="analytics"    element={<BuyerAnalyticsPage />} />
              <Route path="integrations" element={<BuyerIntegrationsPage />} />
              <Route path="complaints" element={<ComplaintsPage />} />
              <Route path="reviews" element={<BuyerReviewsPage />} />
              <Route path="ai" element={<AIInsightsPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* ── Employee Portal ── */}
            <Route path="/employee" element={<DashboardLayout />}>
              <Route index element={<EmployeeDashboard />} />
              <Route path="tasks" element={<EmployeeTaskBoardPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="leave" element={<LeavePage />} />
              <Route path="meetings" element={<EmployeeMeetingsPage />} />
              <Route path="performance" element={<PerformancePage />} />
              <Route path="kpi" element={<KPIPage />} />
              <Route path="learning" element={<LearningPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="profile" element={<EmployeeProfilePage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* ── Admin Panel ── */}
            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="providers" element={<AdminProvidersPage />} />
              <Route path="providers/:id" element={<AdminProviderDetailPage />} />
              <Route path="invoices" element={<AdminInvoicesPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="complaints" element={<AdminComplaintsPage />} />
              <Route path="assets" element={<AdminAssetsPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="buyers" element={<AdminBuyersPage />} />
              <Route path="employees" element={<AdminEmployeesPage />} />
              <Route path="finance" element={<AdminFinancePage />} />
              <Route path="reviews" element={<AdminReviewsPage />} />
              <Route path="training" element={<AdminTrainingPage />} />
              <Route path="marketplace-control" element={<AdminMarketplaceControlPage />} />
              <Route path="security" element={<AdminSecurityPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* ── 404 ── */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
