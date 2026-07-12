export const ROLES = {
  FLEET_MANAGER: 'fleet_manager',
  DISPATCHER: 'dispatcher',
  SAFETY_OFFICER: 'safety_officer',
  FINANCIAL_ANALYST: 'financial_analyst'
};

export const ROLE_LABELS = {
  [ROLES.FLEET_MANAGER]: 'Fleet Manager',
  [ROLES.DISPATCHER]: 'Dispatcher',
  [ROLES.SAFETY_OFFICER]: 'Safety Officer',
  [ROLES.FINANCIAL_ANALYST]: 'Financial Analyst'
};

export const DEMO_ACCOUNTS = {
  [ROLES.FLEET_MANAGER]: {
    email: 'fleet@transitops.com',
    name: 'Ashish Kalsara (Fleet Manager)'
  },
  [ROLES.DISPATCHER]: {
    email: 'dispatcher@transitops.com',
    name: 'John Doe (Dispatcher)'
  },
  [ROLES.SAFETY_OFFICER]: {
    email: 'safety@transitops.com',
    name: 'Jane Smith (Safety Officer)'
  },
  [ROLES.FINANCIAL_ANALYST]: {
    email: 'finance@transitops.com',
    name: 'Bob Johnson (Financial Analyst)'
  }
};

export const SIDEBAR_ITEMS = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    roles: Object.values(ROLES)
  },
  {
    name: 'Vehicles',
    path: '/vehicles',
    roles: [ROLES.FLEET_MANAGER, ROLES.DISPATCHER, ROLES.FINANCIAL_ANALYST]
  },
  {
    name: 'Drivers',
    path: '/drivers',
    roles: [ROLES.FLEET_MANAGER, ROLES.DISPATCHER, ROLES.SAFETY_OFFICER]
  },
  {
    name: 'Trips',
    path: '/trips',
    roles: [ROLES.FLEET_MANAGER, ROLES.DISPATCHER, ROLES.FINANCIAL_ANALYST]
  },
  {
    name: 'Maintenance',
    path: '/maintenance',
    roles: [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST, ROLES.SAFETY_OFFICER]
  },
  {
    name: 'Fuel & Expenses',
    path: '/expenses',
    roles: [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST]
  },
  {
    name: 'Reports & Analytics',
    path: '/reports',
    roles: [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER, ROLES.FINANCIAL_ANALYST]
  }
];

export const ROUTE_ACCESS = {
  dashboard: Object.values(ROLES),
  vehicles: [ROLES.FLEET_MANAGER, ROLES.DISPATCHER, ROLES.FINANCIAL_ANALYST],
  drivers: [ROLES.FLEET_MANAGER, ROLES.DISPATCHER, ROLES.SAFETY_OFFICER],
  trips: [ROLES.FLEET_MANAGER, ROLES.DISPATCHER, ROLES.FINANCIAL_ANALYST],
  maintenance: [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST, ROLES.SAFETY_OFFICER],
  expenses: [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST],
  reports: [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER, ROLES.FINANCIAL_ANALYST]
};

export const ACTION_PERMISSIONS = {
  vehicles: {
    create: [ROLES.FLEET_MANAGER],
    update: [ROLES.FLEET_MANAGER],
    delete: [ROLES.FLEET_MANAGER]
  },
  drivers: {
    create: [ROLES.FLEET_MANAGER],
    update: [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER],
    delete: [ROLES.FLEET_MANAGER]
  },
  trips: {
    create: [ROLES.FLEET_MANAGER, ROLES.DISPATCHER],
    dispatch: [ROLES.FLEET_MANAGER, ROLES.DISPATCHER],
    complete: [ROLES.FLEET_MANAGER, ROLES.DISPATCHER],
    cancel: [ROLES.FLEET_MANAGER, ROLES.DISPATCHER]
  },
  maintenance: {
    create: [ROLES.FLEET_MANAGER],
    close: [ROLES.FLEET_MANAGER]
  },
  fuel_expenses: {
    createFuel: [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST],
    createExpense: [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST],
    updateOwn: [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST],
    deleteOwn: [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST]
  },
  reports: {
    view: [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER, ROLES.FINANCIAL_ANALYST],
    exportCsv: [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST, ROLES.SAFETY_OFFICER],
    exportPdf: [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER, ROLES.FINANCIAL_ANALYST]
  }
};

export const normalizeRole = (role) => {
  if (role === 'driver') return ROLES.DISPATCHER;
  return role;
};

export const getRoleLabel = (role) => ROLE_LABELS[normalizeRole(role)] || role;

export const getDemoAccountByEmail = (email) => {
  const normalizedEmail = (email || '').toLowerCase();
  return Object.values(DEMO_ACCOUNTS).find((account) => account.email === normalizedEmail);
};

export const isRoleAllowed = (role, allowedRoles = []) => {
  const normalizedRole = normalizeRole(role);
  return allowedRoles.includes(normalizedRole);
};

export const getVisibleNavItems = (role) => {
  const normalizedRole = normalizeRole(role);
  return SIDEBAR_ITEMS.filter((item) => item.roles.includes(normalizedRole));
};

export const canAccessRoute = (role, routeKey) => {
  const normalizedRole = normalizeRole(role);
  const allowedRoles = ROUTE_ACCESS[routeKey] || [];
  return allowedRoles.includes(normalizedRole);
};

export const canPerformAction = (role, moduleName, actionName) => {
  const normalizedRole = normalizeRole(role);
  const modulePermissions = ACTION_PERMISSIONS[moduleName] || {};
  const allowedRoles = modulePermissions[actionName] || [];
  return allowedRoles.includes(normalizedRole);
};

export const isDriverLicenseExpired = (expiryDate) => {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
};

export const getAvailableTripVehicles = (vehicles = []) =>
  vehicles.filter((vehicle) => vehicle.status === 'available');

export const getAvailableTripDrivers = (drivers = []) =>
  drivers.filter((driver) => driver.status === 'available' && !isDriverLicenseExpired(driver.license_expiry_date));
