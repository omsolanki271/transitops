import apiClient, { isMockMode } from './client';
import { mockDb } from './mockDb';

export const getDashboardSummary = async (filters = {}) => {
  if (isMockMode()) {
    const summary = mockDb.getDashboardSummary(filters);
    return {
      success: true,
      data: summary
    };
  }
  return apiClient.get('/dashboard/summary/', { params: filters });
};

export const getReportsExportUrl = (reportType) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1/';
  return `${baseUrl}reports/export/?format=csv&report=${reportType}`;
};

// Safety Officer Reports API endpoints
export const getSafetyReportData = async () => {
  if (isMockMode()) {
    // Dynamically calculate safety metrics from mock database drivers
    const drivers = mockDb.getDrivers();
    const totalDrivers = drivers.length;
    const suspendedCount = drivers.filter(d => d.status === 'suspended').length;
    
    const today = new Date();
    const expiredCount = drivers.filter(d => d.license_expiry_date && new Date(d.license_expiry_date) < today).length;
    
    // Compliant drivers (not suspended and license not expired)
    const compliantCount = drivers.filter(d => d.status !== 'suspended' && (!d.license_expiry_date || new Date(d.license_expiry_date) >= today)).length;
    
    // Average safety score
    const totalScore = drivers.reduce((sum, d) => sum + parseFloat(d.safety_score || 0), 0);
    const avgScore = totalDrivers > 0 ? parseFloat((totalScore / totalDrivers).toFixed(2)) : 0.0;
    
    const safetyScoresData = drivers.map(d => ({
      id: d.id,
      name: d.name,
      safety_score: parseFloat(d.safety_score || 0),
      status: d.status
    }));
    
    const licenseExpiryData = drivers.map(d => {
      const days = d.license_expiry_date ? Math.ceil((new Date(d.license_expiry_date) - today) / (1000 * 60 * 60 * 24)) : 0;
      return {
        id: d.id,
        name: d.name,
        license_number: d.license_number,
        license_expiry_date: d.license_expiry_date,
        days_to_expiry: days,
        status: d.status
      };
    });
    
    const suspendedDriversData = drivers.filter(d => d.status === 'suspended').map(d => ({
      id: d.id,
      name: d.name,
      license_number: d.license_number,
      safety_score: parseFloat(d.safety_score || 0),
      contact_number: d.contact_number
    }));
    
    const trendData = [
      { month: 'Jan', score: 85.5 },
      { month: 'Feb', score: 86.2 },
      { month: 'Mar', score: 87.0 },
      { month: 'Apr', score: 88.3 },
      { month: 'May', score: 89.1 },
      { month: 'Jun', score: avgScore > 0 ? avgScore : 90.0 }
    ];
    
    return {
      success: true,
      data: {
        drivers_safety_scores: safetyScoresData,
        license_expiry_report: licenseExpiryData,
        suspended_drivers: suspendedDriversData,
        compliance_stats: {
          total_drivers: totalDrivers,
          compliant_drivers: compliantCount,
          suspended_drivers: suspendedCount,
          expired_licenses: expiredCount,
          average_safety_score: avgScore
        },
        safety_trend: trendData
      }
    };
  }
  return apiClient.get('/reports/safety/');
};

// Direct authorized blob downloads to pass JWT authentication header
export const downloadSafetyCSV = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = `Safety_Report_${dateStr}.csv`;

  if (isMockMode()) {
    // Generate a quick client-side CSV download in mock mode
    const drivers = mockDb.getDrivers();
    let csvContent = 'Driver Name,License Number,License Category,License Expiry,Safety Score,Operational Status\n';
    drivers.forEach(d => {
      csvContent += `"${d.name}","${d.license_number}","${d.license_category}","${d.license_expiry_date}",${d.safety_score},"${d.status}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }
  
  await downloadBlobFile('/reports/export/csv/', filename);
};

export const downloadSafetyPDF = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = `Safety_Report_${dateStr}.pdf`;

  if (isMockMode()) {
    // Mock PDF download fallback (simple text file representing PDF metadata)
    const drivers = mockDb.getDrivers();
    let txt = `%PDF-1.4\n% MOCK PDF EXPORT FOR TRANSITOPS\nSafety Report\nGenerated Date: ${new Date().toLocaleDateString()}\n\n`;
    drivers.forEach(d => {
      txt += `Driver: ${d.name} | Score: ${d.safety_score}/100 | License Expiry: ${d.license_expiry_date} | Status: ${d.status}\n`;
    });
    const blob = new Blob([txt], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  await downloadBlobFile('/reports/export/pdf/', filename);
};

const downloadBlobFile = async (url, filename) => {
  try {
    const data = await apiClient.get(url, { responseType: 'blob' });
    const blob = new Blob([data], { type: data.type || 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Blob download failed:', err);
    alert('Failed to download report.');
  }
};
