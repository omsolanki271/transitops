// Client-side Mock Database to manage state persistent in localStorage.

const INITIAL_VEHICLES = [
  { id: 1, registration_number: 'MH-12-QE-1002', name_model: 'Tata Prima 4925.S', vehicle_type: 'heavy_duty_truck', max_load_capacity: 40000, odometer: 12500, acquisition_cost: 4500000, status: 'available', region: 'west' },
  { id: 2, registration_number: 'DL-01-AB-3421', name_model: 'Ashok Leyland Ecomet', vehicle_type: 'medium_duty_truck', max_load_capacity: 15000, odometer: 42100, acquisition_cost: 2500000, status: 'on_trip', region: 'north' },
  { id: 3, registration_number: 'KA-03-XY-9876', name_model: 'Mahindra Bolero Maxi', vehicle_type: 'pickup', max_load_capacity: 3000, odometer: 87400, acquisition_cost: 950000, status: 'in_shop', region: 'south' },
  { id: 4, registration_number: 'MH-02-ZZ-5544', name_model: 'BharatBenz 2823C', vehicle_type: 'dumper', max_load_capacity: 28000, odometer: 3100, acquisition_cost: 3800000, status: 'available', region: 'west' },
  { id: 5, registration_number: 'WB-04-GH-1212', name_model: 'Tata Ace Gold', vehicle_type: 'mini_truck', max_load_capacity: 1000, odometer: 110200, acquisition_cost: 600000, status: 'retired', region: 'east' },
  { id: 6, registration_number: 'KA-05-MM-2233', name_model: 'Tata Prima 4925.S', vehicle_type: 'heavy_duty_truck', max_load_capacity: 40000, odometer: 25000, acquisition_cost: 4600000, status: 'available', region: 'south' }
];

const INITIAL_DRIVERS = [
  { id: 1, name: 'Ashok Kumar', license_number: 'DL1234567890123', license_category: 'HMV', license_expiry_date: '2028-11-20', contact_number: '+91 98765 43210', safety_score: 94, status: 'available' },
  { id: 2, name: 'Sanjay Singh', license_number: 'MH5432109876543', license_category: 'HMV', license_expiry_date: '2027-05-15', contact_number: '+91 91234 56789', safety_score: 88, status: 'on_trip' },
  { id: 3, name: 'Ramesh Patel', license_number: 'KA9876543210987', license_category: 'LMV', license_expiry_date: '2026-04-10', contact_number: '+91 88888 77777', safety_score: 91, status: 'available' },
  { id: 4, name: 'Vikram Aditya', license_number: 'UP1122334455667', license_category: 'HMV', license_expiry_date: '2023-12-05', contact_number: '+91 77777 66666', safety_score: 65, status: 'suspended' }, // Expired license
  { id: 5, name: 'Rahul Verma', license_number: 'DL9988776655443', license_category: 'LMV', license_expiry_date: '2029-08-30', contact_number: '+91 99999 88888', safety_score: 82, status: 'off_duty' }
];

const INITIAL_TRIPS = [
  { id: 1, source: 'Mumbai (MH)', destination: 'Pune (MH)', vehicle_id: 2, driver_id: 2, cargo_weight: 12000, planned_distance: 150, actual_distance: null, final_odometer: null, fuel_consumed: null, status: 'dispatched', dispatched_at: '2026-07-12T05:00:00Z', completed_at: null, cancelled_at: null, revenue: 45000, created_by: 1 },
  { id: 2, source: 'Delhi (DL)', destination: 'Jaipur (RJ)', vehicle_id: 1, driver_id: 1, cargo_weight: 35000, planned_distance: 280, actual_distance: 275, final_odometer: 12775, fuel_consumed: 95, status: 'completed', dispatched_at: '2026-07-11T08:00:00Z', completed_at: '2026-07-11T16:00:00Z', cancelled_at: null, revenue: 85000, created_by: 1 },
  { id: 3, source: 'Bangalore (KA)', destination: 'Chennai (TN)', vehicle_id: 4, driver_id: 3, cargo_weight: 22000, planned_distance: 350, actual_distance: null, final_odometer: null, fuel_consumed: null, status: 'draft', dispatched_at: null, completed_at: null, cancelled_at: null, revenue: 65000, created_by: 2 }
];

const INITIAL_MAINTENANCE = [
  { id: 1, vehicle_id: 3, maintenance_type: 'Engine Overhaul', description: 'Complete engine diagnostics and cylinder replacement.', cost: 45000, status: 'open', started_at: '2026-07-10T10:00:00Z', closed_at: null, created_by: 1 },
  { id: 2, vehicle_id: 2, maintenance_type: 'Brake Replacement', description: 'Front and rear brake pads replacement and rotor machining.', cost: 12500, status: 'closed', started_at: '2026-07-05T09:00:00Z', closed_at: '2026-07-05T17:00:00Z', created_by: 1 }
];

const INITIAL_FUEL = [
  { id: 1, vehicle_id: 2, trip_id: 1, liters: 45, cost: 4200, log_date: '2026-07-12', created_by: 4 },
  { id: 2, vehicle_id: 1, trip_id: 2, liters: 95, cost: 8900, log_date: '2026-07-11', created_by: 4 }
];

const INITIAL_EXPENSES = [
  { id: 1, vehicle_id: 2, trip_id: 1, expense_type: 'toll', amount: 800, expense_date: '2026-07-12', description: 'Mumbai-Pune Expressway Toll', created_by: 4 },
  { id: 2, vehicle_id: 1, trip_id: 2, expense_type: 'other', amount: 1500, expense_date: '2026-07-11', description: 'Driver overnight allowance', created_by: 4 }
];

// Helper to initialize local storage
const initLocalStorage = () => {
  if (!localStorage.getItem('transitops_mock_vehicles')) {
    localStorage.setItem('transitops_mock_vehicles', JSON.stringify(INITIAL_VEHICLES));
  }
  if (!localStorage.getItem('transitops_mock_drivers')) {
    localStorage.setItem('transitops_mock_drivers', JSON.stringify(INITIAL_DRIVERS));
  }
  if (!localStorage.getItem('transitops_mock_trips')) {
    localStorage.setItem('transitops_mock_trips', JSON.stringify(INITIAL_TRIPS));
  }
  if (!localStorage.getItem('transitops_mock_maintenance')) {
    localStorage.setItem('transitops_mock_maintenance', JSON.stringify(INITIAL_MAINTENANCE));
  }
  if (!localStorage.getItem('transitops_mock_fuel')) {
    localStorage.setItem('transitops_mock_fuel', JSON.stringify(INITIAL_FUEL));
  }
  if (!localStorage.getItem('transitops_mock_expenses')) {
    localStorage.setItem('transitops_mock_expenses', JSON.stringify(INITIAL_EXPENSES));
  }
};

initLocalStorage();

// Generic helpers
const getData = (key) => JSON.parse(localStorage.getItem(key));
const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('transitops_user'));
  } catch {
    return null;
  }
};

export const mockDb = {
  // VEHICLES CRUD
  getVehicles: () => getData('transitops_mock_vehicles'),
  getVehicle: (id) => getData('transitops_mock_vehicles').find(v => v.id === parseInt(id)),
  createVehicle: (vehicleData) => {
    const vehicles = getData('transitops_mock_vehicles');
    // Validation
    const exists = vehicles.some(v => v.registration_number.toLowerCase() === vehicleData.registration_number.toLowerCase());
    if (exists) {
      throw { success: false, error: { code: 'VALIDATION_ERROR', message: 'Registration number must be unique', fields: { registration_number: ['Vehicle with this number already exists'] } } };
    }
    const newVehicle = {
      ...vehicleData,
      id: vehicles.length > 0 ? Math.max(...vehicles.map(v => v.id)) + 1 : 1,
      odometer: parseFloat(vehicleData.odometer) || 0,
      max_load_capacity: parseFloat(vehicleData.max_load_capacity) || 0,
      acquisition_cost: parseFloat(vehicleData.acquisition_cost) || 0,
      status: vehicleData.status || 'available'
    };
    vehicles.push(newVehicle);
    setData('transitops_mock_vehicles', vehicles);
    return newVehicle;
  },
  updateVehicle: (id, vehicleData) => {
    const vehicles = getData('transitops_mock_vehicles');
    const idx = vehicles.findIndex(v => v.id === parseInt(id));
    if (idx === -1) throw new Error('Vehicle not found');

    // Unique Reg validation
    if (vehicleData.registration_number) {
      const exists = vehicles.some((v, index) => index !== idx && v.registration_number.toLowerCase() === vehicleData.registration_number.toLowerCase());
      if (exists) {
        throw { success: false, error: { code: 'VALIDATION_ERROR', message: 'Registration number must be unique', fields: { registration_number: ['Vehicle with this number already exists'] } } };
      }
    }

    const updated = {
      ...vehicles[idx],
      ...vehicleData,
      odometer: vehicleData.odometer !== undefined ? parseFloat(vehicleData.odometer) : vehicles[idx].odometer,
      max_load_capacity: vehicleData.max_load_capacity !== undefined ? parseFloat(vehicleData.max_load_capacity) : vehicles[idx].max_load_capacity,
      acquisition_cost: vehicleData.acquisition_cost !== undefined ? parseFloat(vehicleData.acquisition_cost) : vehicles[idx].acquisition_cost,
    };
    vehicles[idx] = updated;
    setData('transitops_mock_vehicles', vehicles);
    return updated;
  },
  deleteVehicle: (id) => {
    const vehicles = getData('transitops_mock_vehicles');
    // Instead of deleting, we retired
    const updated = vehicles.map(v => v.id === parseInt(id) ? { ...v, status: 'retired' } : v);
    setData('transitops_mock_vehicles', updated);
    return true;
  },

  // DRIVERS CRUD
  getDrivers: () => getData('transitops_mock_drivers'),
  getDriver: (id) => getData('transitops_mock_drivers').find(d => d.id === parseInt(id)),
  createDriver: (driverData) => {
    const drivers = getData('transitops_mock_drivers');
    const exists = drivers.some(d => d.license_number.toLowerCase() === driverData.license_number.toLowerCase());
    if (exists) {
      throw { success: false, error: { code: 'VALIDATION_ERROR', message: 'License number must be unique', fields: { license_number: ['Driver with this license already exists'] } } };
    }
    const newDriver = {
      ...driverData,
      id: drivers.length > 0 ? Math.max(...drivers.map(d => d.id)) + 1 : 1,
      safety_score: parseInt(driverData.safety_score) || 90,
      status: driverData.status || 'available'
    };
    drivers.push(newDriver);
    setData('transitops_mock_drivers', drivers);
    return newDriver;
  },
  updateDriver: (id, driverData) => {
    const drivers = getData('transitops_mock_drivers');
    const idx = drivers.findIndex(d => d.id === parseInt(id));
    if (idx === -1) throw new Error('Driver not found');

    if (driverData.license_number) {
      const exists = drivers.some((d, index) => index !== idx && d.license_number.toLowerCase() === driverData.license_number.toLowerCase());
      if (exists) {
        throw { success: false, error: { code: 'VALIDATION_ERROR', message: 'License number must be unique', fields: { license_number: ['Driver with this license already exists'] } } };
      }
    }

    const updated = {
      ...drivers[idx],
      ...driverData,
      safety_score: driverData.safety_score !== undefined ? parseInt(driverData.safety_score) : drivers[idx].safety_score
    };
    drivers[idx] = updated;
    setData('transitops_mock_drivers', drivers);
    return updated;
  },

  // TRIPS CRUD & TRANSITIONS
  getTrips: () => {
    const trips = getData('transitops_mock_trips');
    const vehicles = getData('transitops_mock_vehicles');
    const drivers = getData('transitops_mock_drivers');
    
    // Embed objects for lists
    return trips.map(t => ({
      ...t,
      vehicle_detail: vehicles.find(v => v.id === t.vehicle_id),
      driver_detail: drivers.find(d => d.id === t.driver_id)
    }));
  },
  getTrip: (id) => {
    const trip = getData('transitops_mock_trips').find(t => t.id === parseInt(id));
    if (!trip) return null;
    const vehicle = getData('transitops_mock_vehicles').find(v => v.id === trip.vehicle_id);
    const driver = getData('transitops_mock_drivers').find(d => d.id === trip.driver_id);
    return {
      ...trip,
      vehicle_detail: vehicle,
      driver_detail: driver
    };
  },
  createTrip: (tripData) => {
    const trips = getData('transitops_mock_trips');
    const vehicles = getData('transitops_mock_vehicles');
    const drivers = getData('transitops_mock_drivers');

    const vehicle = vehicles.find(v => v.id === parseInt(tripData.vehicle_id));
    const driver = drivers.find(d => d.id === parseInt(tripData.driver_id));

    // Validations
    if (!vehicle || vehicle.status === 'retired' || vehicle.status === 'in_shop') {
      throw { success: false, error: { code: 'VALIDATION_ERROR', message: 'Selected vehicle is unavailable', fields: { vehicle_id: ['Vehicle must be available'] } } };
    }
    if (!driver || driver.status === 'suspended') {
      throw { success: false, error: { code: 'VALIDATION_ERROR', message: 'Selected driver is suspended/unavailable', fields: { driver_id: ['Driver must be available'] } } };
    }
    if (parseFloat(tripData.cargo_weight) > vehicle.max_load_capacity) {
      throw { success: false, error: { code: 'VALIDATION_ERROR', message: 'Cargo weight exceeds vehicle capacity', fields: { cargo_weight: [`Weight exceeds capacity (${vehicle.max_load_capacity} kg)`] } } };
    }

    const newTrip = {
      id: trips.length > 0 ? Math.max(...trips.map(t => t.id)) + 1 : 1,
      source: tripData.source,
      destination: tripData.destination,
      vehicle_id: parseInt(tripData.vehicle_id),
      driver_id: parseInt(tripData.driver_id),
      cargo_weight: parseFloat(tripData.cargo_weight),
      planned_distance: parseFloat(tripData.planned_distance),
      actual_distance: null,
      final_odometer: null,
      fuel_consumed: null,
      status: 'draft',
      dispatched_at: null,
      completed_at: null,
      cancelled_at: null,
      revenue: parseFloat(tripData.revenue) || 0,
      created_by: getCurrentUser()?.id || null
    };
    
    trips.push(newTrip);
    setData('transitops_mock_trips', trips);
    return newTrip;
  },

  dispatchTrip: (id) => {
    const trips = getData('transitops_mock_trips');
    const idx = trips.findIndex(t => t.id === parseInt(id));
    if (idx === -1) throw new Error('Trip not found');

    if (trips[idx].status !== 'draft') {
      throw { success: false, error: { code: 'CONFLICT', message: 'Trip already dispatched/completed' } };
    }

    // Mark vehicle and driver as on_trip
    const vehicles = getData('transitops_mock_vehicles');
    const drivers = getData('transitops_mock_drivers');

    const vIdx = vehicles.findIndex(v => v.id === trips[idx].vehicle_id);
    const dIdx = drivers.findIndex(d => d.id === trips[idx].driver_id);

    if (vIdx !== -1) vehicles[vIdx].status = 'on_trip';
    if (dIdx !== -1) drivers[dIdx].status = 'on_trip';

    trips[idx].status = 'dispatched';
    trips[idx].dispatched_at = new Date().toISOString();

    setData('transitops_mock_vehicles', vehicles);
    setData('transitops_mock_drivers', drivers);
    setData('transitops_mock_trips', trips);

    return trips[idx];
  },

  completeTrip: (id, completionData) => {
    const trips = getData('transitops_mock_trips');
    const idx = trips.findIndex(t => t.id === parseInt(id));
    if (idx === -1) throw new Error('Trip not found');

    if (trips[idx].status !== 'dispatched') {
      throw { success: false, error: { code: 'CONFLICT', message: 'Trip must be in dispatched state to complete' } };
    }

    const { final_odometer, fuel_consumed, actual_distance } = completionData;
    
    // Update vehicle and driver to available
    const vehicles = getData('transitops_mock_vehicles');
    const drivers = getData('transitops_mock_drivers');

    const vIdx = vehicles.findIndex(v => v.id === trips[idx].vehicle_id);
    const dIdx = drivers.findIndex(d => d.id === trips[idx].driver_id);

    if (vIdx !== -1) {
      vehicles[vIdx].status = 'available';
      if (parseFloat(final_odometer) > vehicles[vIdx].odometer) {
        vehicles[vIdx].odometer = parseFloat(final_odometer);
      }
    }
    if (dIdx !== -1) drivers[dIdx].status = 'available';

    trips[idx].status = 'completed';
    trips[idx].completed_at = new Date().toISOString();
    trips[idx].actual_distance = parseFloat(actual_distance);
    trips[idx].final_odometer = parseFloat(final_odometer);
    trips[idx].fuel_consumed = parseFloat(fuel_consumed);

    // Also automatically log fuel in fuel_logs
    if (parseFloat(fuel_consumed) > 0) {
      const fuelLogs = getData('transitops_mock_fuel');
      fuelLogs.push({
        id: fuelLogs.length > 0 ? Math.max(...fuelLogs.map(f => f.id)) + 1 : 1,
        vehicle_id: trips[idx].vehicle_id,
        trip_id: trips[idx].id,
        liters: parseFloat(fuel_consumed),
        cost: parseFloat(fuel_consumed) * 95, // Assuming mock price per liter = 95
        log_date: new Date().toISOString().split('T')[0]
      });
      setData('transitops_mock_fuel', fuelLogs);
    }

    setData('transitops_mock_vehicles', vehicles);
    setData('transitops_mock_drivers', drivers);
    setData('transitops_mock_trips', trips);

    return trips[idx];
  },

  cancelTrip: (id) => {
    const trips = getData('transitops_mock_trips');
    const idx = trips.findIndex(t => t.id === parseInt(id));
    if (idx === -1) throw new Error('Trip not found');

    const prevStatus = trips[idx].status;

    // Reset vehicle and driver statuses back to available if they were dispatched
    if (prevStatus === 'dispatched') {
      const vehicles = getData('transitops_mock_vehicles');
      const drivers = getData('transitops_mock_drivers');

      const vIdx = vehicles.findIndex(v => v.id === trips[idx].vehicle_id);
      const dIdx = drivers.findIndex(d => d.id === trips[idx].driver_id);

      if (vIdx !== -1) vehicles[vIdx].status = 'available';
      if (dIdx !== -1) drivers[dIdx].status = 'available';

      setData('transitops_mock_vehicles', vehicles);
      setData('transitops_mock_drivers', drivers);
    }

    trips[idx].status = 'cancelled';
    trips[idx].cancelled_at = new Date().toISOString();
    setData('transitops_mock_trips', trips);

    return trips[idx];
  },

  // MAINTENANCE LOGS
  getMaintenanceLogs: () => {
    const logs = getData('transitops_mock_maintenance');
    const vehicles = getData('transitops_mock_vehicles');
    return logs.map(l => ({
      ...l,
      vehicle_detail: vehicles.find(v => v.id === l.vehicle_id)
    }));
  },
  createMaintenanceLog: (logData) => {
    const logs = getData('transitops_mock_maintenance');
    const vehicles = getData('transitops_mock_vehicles');
    const vIdx = vehicles.findIndex(v => v.id === parseInt(logData.vehicle_id));

    if (vIdx === -1) throw new Error('Vehicle not found');
    
    // Set vehicle status to in_shop
    vehicles[vIdx].status = 'in_shop';
    setData('transitops_mock_vehicles', vehicles);

    const newLog = {
      id: logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1,
      vehicle_id: parseInt(logData.vehicle_id),
      maintenance_type: logData.maintenance_type,
      description: logData.description,
      cost: parseFloat(logData.cost) || 0,
      status: 'open',
      started_at: new Date().toISOString(),
      closed_at: null,
      created_by: getCurrentUser()?.id || null
    };

    // Also automatically log in general expenses
    const expenses = getData('transitops_mock_expenses');
    expenses.push({
      id: expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1,
      vehicle_id: parseInt(logData.vehicle_id),
      expense_type: 'maintenance',
      amount: parseFloat(logData.cost) || 0,
      expense_date: new Date().toISOString().split('T')[0],
      description: `Maintenance: ${logData.maintenance_type}`
    });
    setData('transitops_mock_expenses', expenses);

    logs.push(newLog);
    setData('transitops_mock_maintenance', logs);
    return newLog;
  },
  closeMaintenanceLog: (id) => {
    const logs = getData('transitops_mock_maintenance');
    const idx = logs.findIndex(l => l.id === parseInt(id));
    if (idx === -1) throw new Error('Maintenance log not found');

    logs[idx].status = 'closed';
    logs[idx].closed_at = new Date().toISOString();

    // Check if vehicle has other active logs, if not set back to available
    const hasOtherOpen = logs.some(l => l.id !== parseInt(id) && l.vehicle_id === logs[idx].vehicle_id && l.status === 'open');
    if (!hasOtherOpen) {
      const vehicles = getData('transitops_mock_vehicles');
      const vIdx = vehicles.findIndex(v => v.id === logs[idx].vehicle_id);
      if (vIdx !== -1 && vehicles[vIdx].status === 'in_shop') {
        vehicles[vIdx].status = 'available';
        setData('transitops_mock_vehicles', vehicles);
      }
    }

    setData('transitops_mock_maintenance', logs);
    return logs[idx];
  },

  // FUEL LOGS
  getFuelLogs: () => {
    const logs = getData('transitops_mock_fuel');
    const vehicles = getData('transitops_mock_vehicles');
    return logs.map(l => ({
      ...l,
      vehicle_detail: vehicles.find(v => v.id === l.vehicle_id)
    }));
  },
  createFuelLog: (fuelData) => {
    const logs = getData('transitops_mock_fuel');
    const newLog = {
      id: logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1,
      vehicle_id: parseInt(fuelData.vehicle_id),
      trip_id: fuelData.trip_id ? parseInt(fuelData.trip_id) : null,
      liters: parseFloat(fuelData.liters),
      cost: parseFloat(fuelData.cost),
      log_date: fuelData.log_date || new Date().toISOString().split('T')[0],
      created_by: getCurrentUser()?.id || null
    };
    logs.push(newLog);
    setData('transitops_mock_fuel', logs);

    // Also automatically log in general expenses as "other" or fuel
    const expenses = getData('transitops_mock_expenses');
    expenses.push({
      id: expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1,
      vehicle_id: parseInt(fuelData.vehicle_id),
      trip_id: fuelData.trip_id ? parseInt(fuelData.trip_id) : null,
      expense_type: 'other',
      amount: parseFloat(fuelData.cost),
      expense_date: fuelData.log_date || new Date().toISOString().split('T')[0],
      description: `Fuel refueling: ${fuelData.liters} liters`
    });
    setData('transitops_mock_expenses', expenses);

    return newLog;
  },

  // EXPENSES CRUD
  getExpenses: () => {
    const expenses = getData('transitops_mock_expenses');
    const vehicles = getData('transitops_mock_vehicles');
    return expenses.map(e => ({
      ...e,
      vehicle_detail: vehicles.find(v => v.id === e.vehicle_id)
    }));
  },
  createExpense: (expenseData) => {
    const expenses = getData('transitops_mock_expenses');
    const newExpense = {
      id: expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1,
      vehicle_id: parseInt(expenseData.vehicle_id),
      trip_id: expenseData.trip_id ? parseInt(expenseData.trip_id) : null,
      expense_type: expenseData.expense_type,
      amount: parseFloat(expenseData.amount),
      expense_date: expenseData.expense_date || new Date().toISOString().split('T')[0],
      description: expenseData.description || '',
      created_by: getCurrentUser()?.id || null
    };
    expenses.push(newExpense);
    setData('transitops_mock_expenses', expenses);
    return newExpense;
  },

  updateFuelLog: (id, fuelData) => {
    const logs = getData('transitops_mock_fuel');
    const idx = logs.findIndex(l => l.id === parseInt(id));
    if (idx === -1) throw new Error('Fuel log not found');
    logs[idx] = { ...logs[idx], ...fuelData };
    setData('transitops_mock_fuel', logs);
    return logs[idx];
  },

  deleteFuelLog: (id) => {
    const logs = getData('transitops_mock_fuel').filter(l => l.id !== parseInt(id));
    setData('transitops_mock_fuel', logs);
    return true;
  },

  updateExpense: (id, expenseData) => {
    const expenses = getData('transitops_mock_expenses');
    const idx = expenses.findIndex(e => e.id === parseInt(id));
    if (idx === -1) throw new Error('Expense not found');
    expenses[idx] = { ...expenses[idx], ...expenseData };
    setData('transitops_mock_expenses', expenses);
    return expenses[idx];
  },

  deleteExpense: (id) => {
    const expenses = getData('transitops_mock_expenses').filter(e => e.id !== parseInt(id));
    setData('transitops_mock_expenses', expenses);
    return true;
  },

  // REPORTS & DASHBOARD METRICS CALCULATOR
  getDashboardSummary: (filters = {}) => {
    const vehicles = getData('transitops_mock_vehicles');
    const drivers = getData('transitops_mock_drivers');
    const trips = getData('transitops_mock_trips');
    const maintenance = getData('transitops_mock_maintenance');
    const fuel = getData('transitops_mock_fuel');
    const expenses = getData('transitops_mock_expenses');

    // Filter vehicles first
    let filteredVehicles = [...vehicles];
    if (filters.vehicle_type) {
      filteredVehicles = filteredVehicles.filter(v => v.vehicle_type === filters.vehicle_type);
    }
    if (filters.status) {
      filteredVehicles = filteredVehicles.filter(v => v.status === filters.status);
    }
    if (filters.region) {
      filteredVehicles = filteredVehicles.filter(v => v.region === filters.region);
    }

    const filteredVehicleIds = filteredVehicles.map(v => v.id);

    // Filter other tables based on vehicle filters
    const filteredTrips = trips.filter(t => filteredVehicleIds.includes(t.vehicle_id));
    const filteredMaintenance = maintenance.filter(m => filteredVehicleIds.includes(m.vehicle_id));
    const filteredFuel = fuel.filter(f => filteredVehicleIds.includes(f.vehicle_id));
    const filteredExpenses = expenses.filter(e => filteredVehicleIds.includes(e.vehicle_id));

    // Totals
    const totalVehicles = filteredVehicles.length;
    const activeVehicles = filteredVehicles.filter(v => v.status === 'on_trip').length;
    const availableVehicles = filteredVehicles.filter(v => v.status === 'available').length;
    const vehiclesInShop = filteredVehicles.filter(v => v.status === 'in_shop').length;
    const retiredVehicles = filteredVehicles.filter(v => v.status === 'retired').length;

    const driversOnDuty = drivers.filter(d => d.status === 'on_trip' || d.status === 'available').length;
    const activeTrips = filteredTrips.filter(t => t.status === 'dispatched').length;
    const pendingTrips = filteredTrips.filter(t => t.status === 'draft').length;
    const completedTrips = filteredTrips.filter(t => t.status === 'completed').length;

    // Calculations
    const fleetUtilization = totalVehicles > 0 
      ? Math.round((activeVehicles / (totalVehicles - retiredVehicles)) * 100) 
      : 0;

    const fuelCost = filteredFuel.reduce((sum, f) => sum + f.cost, 0);
    const maintenanceCost = filteredMaintenance.reduce((sum, m) => sum + m.cost, 0);
    const otherCost = filteredExpenses.filter(e => e.expense_type !== 'maintenance').reduce((sum, e) => sum + e.amount, 0);
    const operationalCost = fuelCost + maintenanceCost + otherCost;

    const revenue = filteredTrips.filter(t => t.status === 'completed' || t.status === 'dispatched').reduce((sum, t) => sum + (t.revenue || 0), 0);
    
    // ROI: (Revenue - (Maintenance + Fuel)) / Acquisition Cost
    const totalAcquisition = filteredVehicles.filter(v => v.status !== 'retired').reduce((sum, v) => sum + v.acquisition_cost, 0);
    const roi = totalAcquisition > 0 
      ? parseFloat(((revenue - (maintenanceCost + fuelCost)) / totalAcquisition * 100).toFixed(2)) 
      : 0;

    return {
      total_vehicles: totalVehicles,
      active_vehicles: activeVehicles,
      available_vehicles: availableVehicles,
      vehicles_in_shop: vehiclesInShop,
      drivers_on_duty: driversOnDuty,
      active_trips: activeTrips,
      pending_trips: pendingTrips,
      completed_trips: completedTrips,
      fleet_utilization: fleetUtilization || 0,
      fuel_cost: fuelCost,
      maintenance_cost: maintenanceCost,
      revenue: revenue,
      operational_cost: operationalCost,
      roi: roi
    };
  }
};
