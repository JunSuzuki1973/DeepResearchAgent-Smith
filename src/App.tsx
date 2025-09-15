import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/ui/Toast';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Agents from './pages/Agents';
import Tasks from './pages/Tasks';
import Files from './pages/Files';
import Tools from './pages/Tools';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/files" element={<Files />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
      <ToastContainer />
    </Router>
  );
}

export default App;
