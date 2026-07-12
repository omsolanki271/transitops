import React from 'react';

export const StatusBadge = ({ status }) => {
  if (!status) return null;

  // Clean status formatting
  const formattedStatus = status.toLowerCase().replace(/_/g, ' ');

  // Mapping configurations
  const config = {
    // Vehicle status
    available: {
      label: 'Available',
      style: 'bg-green-500/10 text-green-700 border-green-500/20',
    },
    on_trip: {
      label: 'On Trip',
      style: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    },
    in_shop: {
      label: 'In Shop',
      style: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    },
    retired: {
      label: 'Retired',
      style: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
    },

    // Driver status
    off_duty: {
      label: 'Off Duty',
      style: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
    },
    suspended: {
      label: 'Suspended',
      style: 'bg-red-500/10 text-red-700 border-red-500/20',
    },

    // Trip status
    draft: {
      label: 'Draft',
      style: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
    },
    dispatched: {
      label: 'Dispatched',
      style: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    },
    completed: {
      label: 'Completed',
      style: 'bg-green-500/10 text-green-700 border-green-500/20',
    },
    cancelled: {
      label: 'Cancelled',
      style: 'bg-red-500/10 text-red-700 border-red-500/20',
    },

    // Maintenance status
    active: {
      label: 'Active',
      style: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    },
    open: {
      label: 'Active',
      style: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    },
    closed: {
      label: 'Closed',
      style: 'bg-green-500/10 text-green-700 border-green-500/20',
    },
  };

  const currentConfig = config[status.toLowerCase()] || {
    label: formattedStatus.charAt(0).toUpperCase() + formattedStatus.slice(1),
    style: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentConfig.style}`}>
      {currentConfig.label}
    </span>
  );
};
export default StatusBadge;
