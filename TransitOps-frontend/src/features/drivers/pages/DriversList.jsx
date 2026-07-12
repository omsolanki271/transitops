import React, { useState, useEffect } from 'react';
import { getDrivers, createDriver, updateDriver } from '../../../api/drivers';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Search, Plus, Edit, X, AlertCircle, Calendar, ShieldCheck as SafetyIcon } from 'lucide-react';

export const DriversList = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [licenseCat, setLicenseCat] = useState('HMV');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [safetyScore, setSafetyScore] = useState('90');
  const [status, setStatus] = useState('available');

  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await getDrivers({
        search,
        status: filterStatus
      });
      setDrivers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [search, filterStatus]);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    setName('');
    setLicenseNo('');
    setLicenseCat('HMV');
    setLicenseExpiry('');
    setContactNo('');
    setSafetyScore('90');
    setStatus('available');
    setFormErrors({});
    setGeneralError('');
    setShowModal(true);
  };

  const openEditModal = (driver) => {
    setIsEditing(true);
    setSelectedId(driver.id);
    setName(driver.name);
    setLicenseNo(driver.license_number);
    setLicenseCat(driver.license_category);
    setLicenseExpiry(driver.license_expiry_date);
    setContactNo(driver.contact_number);
    setSafetyScore(driver.safety_score);
    setStatus(driver.status);
    setFormErrors({});
    setGeneralError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setGeneralError('');

    // Client-side validations
    const errors = {};
    if (!name) errors.name = ['Driver name is required'];
    if (!licenseNo) errors.license_number = ['License number is required'];
    if (!licenseExpiry) errors.license_expiry_date = ['License expiry date is required'];
    if (!contactNo) errors.contact_number = ['Contact number is required'];
    
    const score = parseInt(safetyScore);
    if (isNaN(score) || score < 0 || score > 100) {
      errors.safety_score = ['Safety score must be between 0 and 100'];
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      name,
      license_number: licenseNo,
      license_category: licenseCat,
      license_expiry_date: licenseExpiry,
      contact_number: contactNo,
      safety_score: score,
      status
    };

    try {
      if (isEditing) {
        await updateDriver(selectedId, payload);
      } else {
        await createDriver(payload);
      }
      setShowModal(false);
      fetchDrivers();
    } catch (err) {
      if (err.error?.fields) {
        setFormErrors(err.error.fields);
      } else {
        setGeneralError(err.error?.message || 'An error occurred while saving.');
      }
    }
  };

  const isLicenseExpired = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface m-0 leading-none">Driver Rosters</h2>
          <p className="text-xs text-on-surface-variant font-medium mt-1.5 font-sans">Manage vehicle drivers and license compliance checks</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Driver Profile</span>
        </button>
      </div>

      {/* Filters Search Row */}
      <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-variant">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search drivers by name or license no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium transition-colors"
          />
        </div>

        {/* Status Dropdowns */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="on_trip">On Trip</option>
            <option value="off_duty">Off Duty</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Driver Listing Table */}
      <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-sm font-semibold text-on-surface-variant">Loading driver logs...</div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="h-10 w-10 text-outline mx-auto mb-3" />
            <h4 className="font-bold text-on-surface text-base">No drivers listed</h4>
            <p className="text-xs text-on-surface-variant mt-1.5">Try clearing filters or add a new driver.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-150">
              <thead className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-6 py-4">Driver Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">License Details</th>
                  <th className="px-6 py-4">License Expiry</th>
                  <th className="px-6 py-4 text-center">Safety Score</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-sm font-medium text-on-surface">
                {drivers.map((d) => {
                  const expired = isLicenseExpired(d.license_expiry_date);
                  return (
                    <tr key={d.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-on-surface">{d.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-on-surface-variant">{d.contact_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono text-xs font-bold">{d.license_number}</div>
                        <div className="text-[11px] text-on-surface-variant font-semibold mt-0.5">Category: {d.license_category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-on-surface-variant" />
                          <span className={expired ? 'text-error font-bold' : 'text-on-surface'}>
                            {d.license_expiry_date}
                          </span>
                          {expired && (
                            <span className="bg-red-500/10 text-red-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-red-500/20">
                              EXPIRED
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 font-bold">
                          <SafetyIcon className={`h-4 w-4 ${d.safety_score >= 85 ? 'text-green-600' : d.safety_score >= 70 ? 'text-amber-500' : 'text-red-500'}`} />
                          <span className={d.safety_score >= 85 ? 'text-green-700' : d.safety_score >= 70 ? 'text-amber-700' : 'text-red-700'}>
                            {d.safety_score}/100
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(d)}
                          className="p-1.5 rounded-lg text-primary hover:bg-primary/10 cursor-pointer transition-colors"
                          title="Edit Details"
                        >
                          <Edit className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Overlay Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-dark-gray/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-150 max-w-lg w-full overflow-hidden transform transition-all">
            {/* Header */}
            <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-150">
              <h3 className="text-base font-bold text-on-surface m-0">
                {isEditing ? 'Modify Driver Record' : 'Register New Driver'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {generalError && (
                <div className="bg-error-container border border-error/20 text-on-error-container text-xs rounded-xl p-3 font-medium">
                  {generalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Driver Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Driver Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="Sanjay Kumar"
                  />
                  {formErrors.name && (
                    <p className="text-xs text-error mt-1">{formErrors.name[0]}</p>
                  )}
                </div>

                {/* Contact Number */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    required
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="+91 98765 43210"
                  />
                  {formErrors.contact_number && (
                    <p className="text-xs text-error mt-1">{formErrors.contact_number[0]}</p>
                  )}
                </div>

                {/* License Number */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    License Number
                  </label>
                  <input
                    type="text"
                    required
                    value={licenseNo}
                    onChange={(e) => setLicenseNo(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="MH1234567890123"
                  />
                  {formErrors.license_number && (
                    <p className="text-xs text-error mt-1">{formErrors.license_number[0]}</p>
                  )}
                </div>

                {/* License Category */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    License Category
                  </label>
                  <select
                    value={licenseCat}
                    onChange={(e) => setLicenseCat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium cursor-pointer"
                  >
                    <option value="HMV">HMV (Heavy Motor Vehicle)</option>
                    <option value="LMV">LMV (Light Motor Vehicle)</option>
                  </select>
                </div>

                {/* License Expiry Date */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    License Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                  />
                  {formErrors.license_expiry_date && (
                    <p className="text-xs text-error mt-1">{formErrors.license_expiry_date[0]}</p>
                  )}
                </div>

                {/* Safety Score */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Safety Score (0-100)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={safetyScore}
                    onChange={(e) => setSafetyScore(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="90"
                  />
                  {formErrors.safety_score && (
                    <p className="text-xs text-error mt-1">{formErrors.safety_score[0]}</p>
                  )}
                </div>

                {/* Operational Status */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Operational Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium cursor-pointer"
                  >
                    <option value="available">Available</option>
                    <option value="on_trip">On Trip</option>
                    <option value="off_duty">Off Duty</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-gray-200 text-on-surface hover:bg-gray-50 text-sm font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition-colors cursor-pointer"
                >
                  {isEditing ? 'Save Details' : 'Register Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriversList;
