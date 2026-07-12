/**
 * These mirror the exact calculations that used to live in the frontend's
 * script.js (calculateAssetHealth, getWarrantyStatus, getWarrantyRemaining),
 * so numbers shown in the UI don't change when swapping localStorage for the API.
 */

const calculateAssetHealth = (asset) => {
  if (!asset?.purchaseDate) return 0;
  const purchase = new Date(asset.purchaseDate);
  if (Number.isNaN(purchase.getTime())) return 0;

  const ageYears = Math.max(0, (Date.now() - purchase.getTime()) / 31536000000);
  const maintenanceCount = Number(asset.maintenanceCount || 0);
  const agePenalty = ageYears * 8;
  const maintenancePenalty = maintenanceCount * 6;
  return Math.round(Math.max(0, Math.min(100, 100 - agePenalty - maintenancePenalty)));
};

const getHealthStatus = (score) => {
  if (score >= 85) return { label: 'Excellent', css: 'excellent' };
  if (score >= 65) return { label: 'Good', css: 'good' };
  if (score >= 45) return { label: 'Warning', css: 'warning' };
  return { label: 'Critical', css: 'critical' };
};

const getWarrantyStatus = (asset) => {
  const today = new Date();
  const end = asset.warrantyEnd ? new Date(asset.warrantyEnd) : null;
  if (!end || Number.isNaN(end.getTime()) || today > end) {
    return { label: 'Expired', css: 'critical' };
  }
  const diffDays = Math.ceil((end - today) / 86400000);
  if (diffDays <= 30) {
    return { label: 'Expiring Soon', css: 'warning' };
  }
  return { label: 'Active', css: 'excellent' };
};

const getWarrantyRemaining = (asset) => {
  const today = new Date();
  const end = asset.warrantyEnd ? new Date(asset.warrantyEnd) : null;
  if (!end || Number.isNaN(end.getTime())) return 'Expired';
  if (today > end) return 'Expired';
  const diffDays = Math.ceil((end - today) / 86400000);
  return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
};

// Attach computed fields (healthScore, warranty info) to a raw asset row
const enrichAsset = (asset) => {
  if (!asset) return asset;
  const healthScore = calculateAssetHealth(asset);
  return {
    ...asset,
    maintenanceCount: Number(asset.maintenanceCount || 0),
    healthScore,
    healthStatus: getHealthStatus(healthScore),
    warrantyStatus: getWarrantyStatus(asset),
    warrantyRemaining: getWarrantyRemaining(asset),
  };
};

module.exports = {
  calculateAssetHealth,
  getHealthStatus,
  getWarrantyStatus,
  getWarrantyRemaining,
  enrichAsset,
};
