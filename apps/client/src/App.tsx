import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/login/LoginPage';
import RegisterPage from './pages/login/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AppListPage from './pages/apps/AppListPage';
import AppDetailPage from './pages/apps/AppDetailPage';
import AppSettingsPage from './pages/apps/AppSettingsPage';
import DataModelPage from './pages/data-model/DataModelPage';
import EntityDesignerPage from './pages/data-model/EntityDesignerPage';
import DataBrowserPage from './pages/data-model/DataBrowserPage';
import PageDesignerPage from './pages/page-designer/PageDesignerPage';
import WorkflowPage from './pages/workflow-editor/WorkflowPage';
import WorkflowEditorPage from './pages/workflow-editor/WorkflowEditorPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="apps" element={<AppListPage />} />
        <Route path="apps/:appId" element={<AppDetailPage />} />
        <Route path="apps/:appId/settings" element={<AppSettingsPage />} />
        <Route path="apps/:appId/models" element={<DataModelPage />} />
        <Route path="apps/:appId/models/:entityId" element={<EntityDesignerPage />} />
        <Route path="apps/:appId/data/:entityId" element={<DataBrowserPage />} />
        <Route path="apps/:appId/pages/:pageId/design" element={<PageDesignerPage />} />
        <Route path="apps/:appId/workflows" element={<WorkflowPage />} />
        <Route path="apps/:appId/workflows/:workflowId" element={<WorkflowEditorPage />} />
      </Route>
    </Routes>
  );
}
