import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import ProductSelection from './pages/ProductSelection';
import Analysis from './pages/Analysis';
import ProjectHub from './pages/ProjectHub';
import DesignDetail from './pages/DesignDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product-selection" element={<ProductSelection />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/project/:projectId" element={<ProjectHub />} />
        <Route path="/project/:projectId/analysis" element={<Analysis />} />
        <Route path="/project/:projectId/design/:designId" element={<DesignDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
