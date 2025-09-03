import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { LoadingSpinner } from '../common';
import './PricingManagement.css';

const PricingManagement = () => {
  const { api, user } = useAuth();
  const { addNotification } = useNotifications();
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPricing, setEditingPricing] = useState(null);
  const [formData, setFormData] = useState({
    city: '',
    pricePerView: '',
    pricePerLike: ''
  });
  const [stats, setStats] = useState(null);

  const cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
    'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri',
    'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
    'Faridabad', 'Meerut', 'Rajkot', 'Kalyan', 'Vasai', 'Varanasi',
    'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai',
    'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur'
  ];

  useEffect(() => {
    fetchPricing();
    fetchStats();
  }, []);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/pricing');
      setPricing(response.data.data.pricing);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load pricing configurations'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/pricing/stats');
      setStats(response.data.data.stats);
    } catch (error) {
      console.error('Failed to fetch pricing stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const endpoint = editingPricing 
        ? `/admin/pricing/${editingPricing._id}`
        : '/admin/pricing';
      
      const method = editingPricing ? 'PUT' : 'POST';
      
      const response = await api.request({
        method,
        url: endpoint,
        data: formData
      });

      if (editingPricing) {
        setPricing(prev => prev.map(p => 
          p._id === editingPricing._id ? response.data.data.pricing : p
        ));
      } else {
        setPricing(prev => [...prev, response.data.data.pricing]);
      }

      setFormData({ city: '', pricePerView: '', pricePerLike: '' });
      setShowCreateForm(false);
      setEditingPricing(null);
      fetchStats();

      addNotification({
        type: 'success',
        title: 'Success',
        message: response.data.message
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error?.message || 'Failed to save pricing'
      });
    }
  };

  const handleEdit = (pricingItem) => {
    setEditingPricing(pricingItem);
    setFormData({
      city: pricingItem.city,
      pricePerView: pricingItem.pricePerView.toString(),
      pricePerLike: pricingItem.pricePerLike.toString()
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (pricingId, cityName) => {
    if (!window.confirm(`Are you sure you want to delete pricing for ${cityName}?`)) {
      return;
    }

    try {
      await api.delete(`/admin/pricing/${pricingId}`);
      setPricing(prev => prev.filter(p => p._id !== pricingId));
      fetchStats();
      addNotification({
        type: 'success',
        title: 'Success',
        message: `Pricing for ${cityName} deleted successfully`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error?.message || 'Failed to delete pricing'
      });
    }
  };

  const handleInitializeDefault = async () => {
    try {
      await api.post('/admin/pricing/initialize');
      fetchPricing();
      fetchStats();
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Default pricing initialized for all cities'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to initialize default pricing'
      });
    }
  };

  const resetForm = () => {
    setFormData({ city: '', pricePerView: '', pricePerLike: '' });
    setShowCreateForm(false);
    setEditingPricing(null);
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'tier1': return '#ff6b6b';
      case 'tier2': return '#4ecdc4';
      case 'tier3': return '#45b7d1';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="pricing-management">
        <div className="loading-container">
          <LoadingSpinner />
          <span>Loading pricing configurations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pricing-management">
      <div className="pricing-header">
        <h2>Revenue Sharing Master</h2>
        <div className="header-actions">
          {pricing.length === 0 && (
            <button 
              className="btn btn-secondary"
              onClick={handleInitializeDefault}
            >
              Initialize Default Pricing
            </button>
          )}
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            {editingPricing ? 'Update Pricing' : 'Add City Pricing'}
          </button>
        </div>
      </div>

      {stats && (
        <div className="pricing-stats">
          <div className="stat-card">
            <h3>Total Cities</h3>
            <span className="stat-value">{stats.totalCities}</span>
          </div>
          <div className="stat-card">
            <h3>Active Pricing</h3>
            <span className="stat-value">{stats.activePricing}</span>
          </div>
          <div className="stat-card">
            <h3>Tier 1 Cities</h3>
            <span className="stat-value">{stats.byTier.tier1}</span>
          </div>
          <div className="stat-card">
            <h3>Tier 2 Cities</h3>
            <span className="stat-value">{stats.byTier.tier2}</span>
          </div>
          <div className="stat-card">
            <h3>Tier 3 Cities</h3>
            <span className="stat-value">{stats.byTier.tier3}</span>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingPricing ? 'Update Pricing' : 'Add City Pricing'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="pricing-form">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  disabled={editingPricing}
                >
                  <option value="">Select a city</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="pricePerView">Price per View (₹) *</label>
                <input
                  type="number"
                  id="pricePerView"
                  name="pricePerView"
                  value={formData.pricePerView}
                  onChange={handleInputChange}
                  required
                  min="0.01"
                  max="100"
                  step="0.01"
                  placeholder="0.10"
                />
              </div>

              <div className="form-group">
                <label htmlFor="pricePerLike">Price per Like (₹) *</label>
                <input
                  type="number"
                  id="pricePerLike"
                  name="pricePerLike"
                  value={formData.pricePerLike}
                  onChange={handleInputChange}
                  required
                  min="0.01"
                  max="100"
                  step="0.01"
                  placeholder="0.25"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPricing ? 'Update Pricing' : 'Create Pricing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="pricing-list">
        {pricing.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <h3>No Pricing Configurations</h3>
            <p>Initialize default pricing for all cities or add custom pricing for specific cities.</p>
            <button className="btn btn-primary" onClick={handleInitializeDefault}>
              Initialize Default Pricing
            </button>
          </div>
        ) : (
          <div className="pricing-table">
            <div className="table-header">
              <div className="table-row">
                <div className="table-cell">City</div>
                <div className="table-cell">Tier</div>
                <div className="table-cell">Price/View</div>
                <div className="table-cell">Price/Like</div>
                <div className="table-cell">Effective Price/View</div>
                <div className="table-cell">Effective Price/Like</div>
                <div className="table-cell">Multiplier</div>
                <div className="table-cell">Updated</div>
                <div className="table-cell">Actions</div>
              </div>
            </div>
            
            <div className="table-body">
              {pricing.map(item => (
                <div key={item._id} className="table-row">
                  <div className="table-cell">
                    <div className="city-name">{item.city}</div>
                  </div>
                  <div className="table-cell">
                    <span 
                      className="tier-badge" 
                      style={{ backgroundColor: getTierColor(item.tier) }}
                    >
                      {item.tier.toUpperCase()}
                    </span>
                  </div>
                  <div className="table-cell">₹{item.pricePerView.toFixed(2)}</div>
                  <div className="table-cell">₹{item.pricePerLike.toFixed(2)}</div>
                  <div className="table-cell">₹{item.effectivePricePerView}</div>
                  <div className="table-cell">₹{item.effectivePricePerLike}</div>
                  <div className="table-cell">{item.multiplier}x</div>
                  <div className="table-cell">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="table-cell">
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(item._id, item.city)}
                        title={`Delete pricing for ${item.city}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingManagement;
