import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import Home from './pages/Home';
import ProductSelection from './pages/ProductSelection';
import ContextBuilder from './pages/ContextBuilder';
import ProjectHub from './pages/ProjectHub';
import DesignDetail from './pages/DesignDetail';

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product-selection" element={<ProductSelection />} />
          <Route path="/context-builder" element={<ContextBuilder />} />
          <Route path="/project/:projectId" element={<ProjectHub />} />
          <Route path="/project/:projectId/context-builder" element={<ContextBuilder />} />
          <Route path="/project/:projectId/design/:designId" element={<DesignDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
