import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Layout } from './components/Layout';
import { ErrorBoundary, ProtectedRoute } from './components/common';
import Home from './pages/Home';
import Create from './pages/Create';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PostDetail from './pages/PostDetail';
import AdminDashboard from './pages/AdminDashboard';
import Discover from './pages/Discover';
import Search from './pages/Search';
import './App.css';
import './components/common/GlobalStyles.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <SocketProvider>
              <Router>
                <div className="App">
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={<Navigate to="/feed" replace />} />
                    <Route path="/feed" element={
                      <ProtectedRoute>
                        <Layout>
                          <Home />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/create" element={
                      <ProtectedRoute>
                        <Layout>
                          <Create />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/post/:id" element={
                      <ProtectedRoute>
                        <Layout>
                          <PostDetail />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/profile/:username?" element={
                      <ProtectedRoute>
                        <Layout>
                          <Profile />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/explore" element={
                      <ProtectedRoute>
                        <Layout>
                          <Discover />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/search" element={
                      <ProtectedRoute>
                        <Layout>
                          <Search />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/*" element={
                      <ProtectedRoute adminOnly>
                        <Layout>
                          <AdminDashboard />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/unauthorized" element={
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '100vh',
                        flexDirection: 'column',
                        gap: '16px'
                      }}>
                        <h1>Unauthorized Access</h1>
                        <p>You don't have permission to access this page.</p>
                        <Link to="/" style={{ color: 'var(--primary-color)' }}>Go to Home</Link>
                      </div>
                    } />
                  </Routes>
                </div>
              </Router>
            </SocketProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;