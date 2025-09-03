import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import api from '../../services/api';
import './EmployeeManagement.css';

const EmployeeManagement = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'manager'
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/admin/employees');
      
      if (response.data.success) {
        setEmployees(response.data.employees);
      } else {
        throw new Error('Failed to fetch employees');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load employees'
      });
    } finally {
      setLoading(false);
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
      const response = await api.post('/admin/employees', formData);

      if (response.data.success) {
        setEmployees(prev => [...prev, response.data.employee]);
        setFormData({ name: '', email: '', mobile: '', role: 'manager' });
        setShowCreateForm(false);
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Employee created successfully'
        });
      } else {
        throw new Error(response.data.message || 'Failed to create employee');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || error.message || 'Failed to create employee'
      });
    }
  };

  const toggleEmployeeStatus = async (employeeId, currentStatus) => {
    try {
      const response = await api.patch(`/admin/employees/${employeeId}/toggle-status`);

      if (response.data.success) {
        setEmployees(prev => prev.map(emp => 
          emp._id === employeeId 
            ? { ...emp, isActive: !currentStatus }
            : emp
        ));
        addNotification({
          type: 'success',
          title: 'Success',
          message: `Employee ${!currentStatus ? 'activated' : 'deactivated'} successfully`
        });
      } else {
        throw new Error('Failed to update employee status');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || error.message || 'Failed to update employee status'
      });
    }
  };

  if (loading) {
    return (
      <div className="employee-management">
        <div className="loading-spinner">Loading employees...</div>
      </div>
    );
  }

  return (
    <div className="employee-management">
      <div className="employee-header">
        <h2>Employee Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          Create Employee
        </button>
      </div>

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Employee</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="employee-form">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="mobile">Mobile *</label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  required
                  pattern="[6-9][0-9]{9}"
                  title="Please enter a valid 10-digit mobile number starting with 6-9"
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role *</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="manager">Manager</option>
                  <option value="accountant">Accountant</option>
                </select>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="employees-list">
        {employees.length === 0 ? (
          <div className="empty-state">
            <p>No employees found. Create your first employee to get started.</p>
          </div>
        ) : (
          <div className="employees-table">
            <div className="table-header">
              <div className="table-row">
                <div className="table-cell">Name</div>
                <div className="table-cell">Email</div>
                <div className="table-cell">Mobile</div>
                <div className="table-cell">Role</div>
                <div className="table-cell">Status</div>
                <div className="table-cell">Created</div>
                <div className="table-cell">Actions</div>
              </div>
            </div>
            
            <div className="table-body">
              {employees.map(employee => (
                <div key={employee._id} className="table-row">
                  <div className="table-cell">
                    <div className="employee-name">{employee.name}</div>
                  </div>
                  <div className="table-cell">{employee.email}</div>
                  <div className="table-cell">{employee.mobile}</div>
                  <div className="table-cell">
                    <span className={`role-badge role-${employee.role}`}>
                      {employee.role}
                    </span>
                  </div>
                  <div className="table-cell">
                    <span className={`status-badge ${employee.isActive ? 'active' : 'inactive'}`}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="table-cell">
                    {new Date(employee.createdAt).toLocaleDateString()}
                  </div>
                  <div className="table-cell">
                    <button
                      className={`btn btn-sm ${employee.isActive ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => toggleEmployeeStatus(employee._id, employee.isActive)}
                    >
                      {employee.isActive ? 'Deactivate' : 'Activate'}
                    </button>
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

export default EmployeeManagement;