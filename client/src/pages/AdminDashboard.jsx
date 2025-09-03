import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EmployeeManagement from '../components/Admin/EmployeeManagement';
import PricingManagement from '../components/Admin/PricingManagement';
import PostManagement from '../components/Admin/PostManagement';
import PaymentDashboard from '../components/Admin/PaymentDashboard';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'employees':
        return <EmployeeManagement />;
      case 'revenue':
        return <PricingManagement />;
      case 'posts':
        return <PostManagement />;
      case 'payments':
        return <PaymentDashboard />;
      default:
        return (
          <div className="dashboard-overview">
            <div className="welcome-section">
              <h2>Welcome back, {user?.fullName}!</h2>
              <p>Manage your social media platform from this admin dashboard.</p>
            </div>
            
            <div className="dashboard-grid">
              <div className="dashboard-card" onClick={() => setActiveTab('employees')}>
                <div className="card-icon">👥</div>
                <h3>Employee Management</h3>
                <p>Create and manage employees with role-based access</p>
                <div className="card-action">Manage Employees →</div>
              </div>
              
              <div className="dashboard-card" onClick={() => setActiveTab('revenue')}>
                <div className="card-icon">💰</div>
                <h3>Revenue Master</h3>
                <p>Set city-wise pricing for views and likes</p>
                <div className="card-action">Configure Pricing →</div>
              </div>
              
              <div className="dashboard-card" onClick={() => setActiveTab('posts')}>
                <div className="card-icon">📝</div>
                <h3>Post Management</h3>
                <p>Review and approve user posts</p>
                <div className="card-action">Review Posts →</div>
              </div>
              
              <div className="dashboard-card" onClick={() => setActiveTab('payments')}>
                <div className="card-icon">💳</div>
                <h3>Payment Dashboard</h3>
                <p>Process payments for approved posts</p>
                <div className="card-action">Process Payments →</div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="user-info">
          <span>{user?.fullName}</span>
          <span className="role-badge">{user?.role}</span>
        </div>
      </div>
      
      <div className="dashboard-nav">
        <button 
          className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`nav-btn ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          Employees
        </button>
        <button 
          className={`nav-btn ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          Revenue
        </button>
        <button 
          className={`nav-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </button>
        <button 
          className={`nav-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Payments
        </button>
      </div>
      
      <div className="dashboard-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;