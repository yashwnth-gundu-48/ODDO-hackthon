const STORAGE_KEYS = {
    assets: 'assetflow_assets',
    employees: 'assetflow_employees',
    activities: 'assetflow_activities',
    notifications: 'assetflow_notifications',
    dashboardStats: 'assetflow_dashboard_stats',
};

const SAMPLE_ASSETS = [
    {
        id: 'AST-1201',
        name: 'Dell Latitude 5430',
        category: 'Laptop',
        serial: 'DL5430-2981',
        purchaseDate: '2023-09-12',
        warrantyStart: '2023-09-12',
        warrantyEnd: '2025-09-12',
        location: 'Head Office - 4th Floor',
        condition: 'Excellent',
        status: 'Available',
        maintenanceCount: 1,
        assignedTo: null,
    },
    {
        id: 'AST-1202',
        name: 'HP LaserJet Pro M428fdw',
        category: 'Printer',
        serial: 'HP-M428-5502',
        purchaseDate: '2024-02-18',
        warrantyStart: '2024-02-18',
        warrantyEnd: '2025-02-18',
        location: 'Marketing Team',
        condition: 'Good',
        status: 'Assigned',
        maintenanceCount: 2,
        assignedTo: 'EMP-1002',
    },
    {
        id: 'AST-1203',
        name: 'Apple iPad Air',
        category: 'Tablet',
        serial: 'IPAD-23-77A',
        purchaseDate: '2024-01-22',
        warrantyStart: '2024-01-22',
        warrantyEnd: '2025-01-22',
        location: 'Sales Team',
        condition: 'Excellent',
        status: 'Available',
        maintenanceCount: 0,
        assignedTo: null,
    },
    {
        id: 'AST-1204',
        name: 'Lenovo ThinkVision T27i',
        category: 'Monitor',
        serial: 'TNV-27T-994',
        purchaseDate: '2023-11-08',
        warrantyStart: '2023-11-08',
        warrantyEnd: '2024-11-08',
        location: 'Admin Desk',
        condition: 'Good',
        status: 'In Repair',
        maintenanceCount: 3,
        assignedTo: null,
    },
];

const SAMPLE_EMPLOYEES = [
    {
        id: 'EMP-1001',
        name: 'Neha Sharma',
        role: 'Operations Manager',
        department: 'Operations',
        email: 'neha.sharma@assetflow.com',
        phone: '+91 98765 43210',
        location: 'Head Office',
        assignedAssets: [],
    },
    {
        id: 'EMP-1002',
        name: 'Rohan Patel',
        role: 'Network Engineer',
        department: 'Technology',
        email: 'rohan.patel@assetflow.com',
        phone: '+91 91234 56789',
        location: 'IT Lab',
        assignedAssets: ['AST-1202'],
    },
];

const SAMPLE_ACTIVITIES = [
    'HP LaserJet Pro assigned to Rohan Patel.',
    'New Dell Latitude added to inventory.',
    'Lenovo monitor moved to repair queue.',
    'Payroll tablet audited by IT.',
];

const getStorage = (key, fallback) => {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
};

const setStorage = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value ?? []));
};

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
    if (score >= 85) return { label: 'Excellent', css: 'excellent', icon: '🟢' };
    if (score >= 65) return { label: 'Good', css: 'good', icon: '🟡' };
    if (score >= 45) return { label: 'Warning', css: 'warning', icon: '🟠' };
    return { label: 'Critical', css: 'critical', icon: '🔴' };
};

const getWarrantyStatus = (asset) => {
    const today = new Date();
    const end = asset.warrantyEnd ? new Date(asset.warrantyEnd) : null;
    if (!end || Number.isNaN(end.getTime()) || today > end) {
        return { label: 'Expired', css: 'critical', icon: '🔴' };
    }
    const diffDays = Math.ceil((end - today) / 86400000);
    if (diffDays <= 30) {
        return { label: 'Expiring Soon', css: 'warning', icon: '🟡' };
    }
    return { label: 'Active', css: 'excellent', icon: '🟢' };
};

const getWarrantyRemaining = (asset) => {
    const today = new Date();
    const end = asset.warrantyEnd ? new Date(asset.warrantyEnd) : null;
    if (!end || Number.isNaN(end.getTime())) return 'Expired';
    if (today > end) return 'Expired';
    const diffDays = Math.ceil((end - today) / 86400000);
    return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
};

const normalizeAssetStorage = () => {
    const assets = getStorage(STORAGE_KEYS.assets, []).map((asset) => ({
        ...asset,
        maintenanceCount: Number(asset.maintenanceCount || 0),
        healthScore: calculateAssetHealth(asset),
    }));
    setStorage(STORAGE_KEYS.assets, assets);
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const TOAST_ICONS = {
    success: '✔',
    error: '✖',
    warning: '⚠',
    info: 'ℹ',
};

const showToast = (message, type = 'info') => {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `
        <span class="toast-icon" aria-hidden="true">${TOAST_ICONS[type] || TOAST_ICONS.info}</span>
        <span class="toast-message">${message}</span>
        <button type="button" class="toast-close" aria-label="Dismiss notification">×</button>
    `;
    container.appendChild(toast);

    const timeoutId = window.setTimeout(() => toast.remove(), 4200);
    toast.querySelector('.toast-close')?.addEventListener('click', () => {
        window.clearTimeout(timeoutId);
        toast.remove();
    });
};

const showLoading = () => {
    const overlay = document.getElementById('loadingOverlay');
    overlay?.classList.remove('hidden');
};

const hideLoading = () => {
    const overlay = document.getElementById('loadingOverlay');
    overlay?.classList.add('hidden');
};

const findById = (items, id) => items.find((item) => item.id === id);
const removeById = (items, id) => items.filter((item) => item.id !== id);

const initLocalStorage = () => {
    if (!localStorage.getItem(STORAGE_KEYS.assets)) {
        setStorage(STORAGE_KEYS.assets, SAMPLE_ASSETS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.employees)) {
        setStorage(STORAGE_KEYS.employees, SAMPLE_EMPLOYEES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.activities)) {
        setStorage(STORAGE_KEYS.activities, SAMPLE_ACTIVITIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.notifications)) {
        setStorage(STORAGE_KEYS.notifications, []);
    }
    normalizeAssetStorage();
    normalizeActivityStorage();
    normalizeNotificationStorage();
};

const normalizeActivityStorage = () => {
    const activities = getStorage(STORAGE_KEYS.activities, []);
    const normalized = activities.map((entry, index) => {
        if (typeof entry === 'string') {
            return {
                message: entry,
                timestamp: new Date(Date.now() - index * 60000).toISOString(),
            };
        }
        return entry;
    });
    setStorage(STORAGE_KEYS.activities, normalized);
};

const normalizeNotificationStorage = () => {
    const notifications = getStorage(STORAGE_KEYS.notifications, []);
    const normalized = notifications.map((entry, index) => {
        if (typeof entry === 'string') {
            return {
                id: `notif-${Date.now()}-${index}`,
                type: 'info',
                message: entry,
                timestamp: new Date(Date.now() - index * 60000).toISOString(),
                unread: true,
            };
        }
        return {
            unread: true,
            id: entry.id || `notif-${Date.now()}-${index}`,
            type: entry.type || 'info',
            message: entry.message || '',
            timestamp: entry.timestamp || new Date().toISOString(),
        };
    });
    setStorage(STORAGE_KEYS.notifications, normalized);
};

const getActivityMessage = (activity) => (typeof activity === 'string' ? activity : activity.message || '');
const getActivityTimestamp = (activity) => (typeof activity === 'string' ? null : activity.timestamp || null);
const getActivityAssetId = (activity) => (typeof activity === 'string' ? null : activity.assetId || null);

const getNotificationLabel = (type) => {
    switch (type) {
        case 'assigned': return 'Asset Assigned';
        case 'maintenance': return 'Maintenance';
        case 'warranty': return 'Warranty Expiry';
        case 'returned': return 'Asset Returned';
        case 'employee': return 'Employee Added';
        default: return 'Update';
    }
};

const createNotification = ({ type, message, assetId = null, employeeId = null }) => {
    const notifications = getStorage(STORAGE_KEYS.notifications, []);
    const newNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        message,
        assetId,
        employeeId,
        timestamp: new Date().toISOString(),
        unread: true,
    };
    const nextNotifications = [newNotification, ...notifications].slice(0, 24);
    setStorage(STORAGE_KEYS.notifications, nextNotifications);
    updateNotificationCount(nextNotifications.filter((note) => note.unread).length);
    return newNotification;
};

const markAllNotificationsRead = () => {
    const notifications = getStorage(STORAGE_KEYS.notifications, []).map((note) => ({ ...note, unread: false }));
    setStorage(STORAGE_KEYS.notifications, notifications);
    updateNotificationCount(0);
    renderNotificationCenter();
};

const clearNotifications = () => {
    setStorage(STORAGE_KEYS.notifications, []);
    updateNotificationCount(0);
    renderNotificationCenter();
};

const ensureWarrantyExpiryNotifications = () => {
    const assets = getStorage(STORAGE_KEYS.assets, []);
    const notifications = getStorage(STORAGE_KEYS.notifications, []);
    const existingWarrantyAssetIds = notifications
        .filter((note) => note.type === 'warranty' && note.assetId)
        .map((note) => note.assetId);

    assets.forEach((asset) => {
        const warranty = getWarrantyStatus(asset);
        if (['Expiring Soon', 'Expired'].includes(warranty.label) && asset.id && !existingWarrantyAssetIds.includes(asset.id)) {
            createNotification({
                type: 'warranty',
                message: `Warranty ${warranty.label.toLowerCase()} for ${asset.name}.`,
                assetId: asset.id,
            });
        }
    });
};

const renderNotificationCenter = () => {
    const notificationPanel = document.getElementById('notificationPanel');
    if (!notificationPanel) return;

    const notifications = getStorage(STORAGE_KEYS.notifications, []);
    const unreadCount = notifications.filter((note) => note.unread).length;

    notificationPanel.innerHTML = `
        <div class="notification-header">
            <div>
                <strong>Notification Center</strong>
                <p>${unreadCount} unread</p>
            </div>
            <button class="icon-btn" aria-label="Close notifications"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="notification-toolbar">
            <button class="text-btn" id="markAllReadBtn">Mark all read</button>
            <button class="text-btn" id="clearNotificationsBtn">Clear notifications</button>
        </div>
        <ul class="notification-list">
            ${notifications.length === 0 ? '<li class="notification-empty">No notifications yet.</li>' : notifications.map((note) => `
                <li class="notification-item ${note.unread ? 'unread' : ''}">
                    <div class="notification-top">
                        <span class="notification-type">${getNotificationLabel(note.type)}</span>
                        <span class="notification-time">${new Date(note.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p>${note.message}</p>
                </li>
            `).join('')}
        </ul>
    `;

    notificationPanel.classList.add('visible');
    notificationPanel.querySelector('.icon-btn')?.addEventListener('click', () => notificationPanel.classList.remove('visible'));
    document.getElementById('markAllReadBtn')?.addEventListener('click', markAllNotificationsRead);
    document.getElementById('clearNotificationsBtn')?.addEventListener('click', clearNotifications);
};

const initNotificationButton = () => {
    const notificationBtn = document.querySelector('.top-actions .icon-btn[aria-label="Notifications"]');
    if (!notificationBtn || notificationBtn.dataset.initialized === 'true') return;
    notificationBtn.dataset.initialized = 'true';
    notificationBtn.addEventListener('click', showNotificationCenter);
};

const showNotificationCenter = () => {
    renderNotificationCenter();
    updateNotificationCount(getStorage(STORAGE_KEYS.notifications, []).filter((note) => note.unread).length);
};

const parseTimelineEventType = (message) => {
    const lower = message.toLowerCase();
    if (lower.includes('asset added') || lower.includes('purchased')) return 'Purchased';
    if (lower.includes('assigned') && !lower.includes('assigned again')) return 'Assigned';
    if (lower.includes('returned')) return 'Returned';
    if (lower.includes('maintenance')) return 'Maintenance';
    return 'Update';
};

const getAssetTimeline = (asset) => {
    const activities = getStorage(STORAGE_KEYS.activities, []);
    const matches = activities
        .filter((activity) => {
            const message = getActivityMessage(activity).toLowerCase();
            return (
                getActivityAssetId(activity) === asset.id ||
                message.includes(asset.id.toLowerCase()) ||
                message.includes(asset.name.toLowerCase())
            );
        })
        .map((activity) => ({
            timestamp: getActivityTimestamp(activity),
            message: getActivityMessage(activity),
            type: parseTimelineEventType(getActivityMessage(activity)),
        }))
        .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
    return matches;
};

const renderAssetTimeline = (asset) => {
    const timelineSection = document.getElementById('assetTimelineSection');
    const timelineList = document.getElementById('assetTimelineList');
    if (!timelineSection || !timelineList) return;

    const timeline = getAssetTimeline(asset);
    timelineSection.classList.remove('hidden');

    if (!timeline.length) {
        timelineList.innerHTML = '<li class="timeline-item empty">No timeline events found for this asset yet.</li>';
        return;
    }

    timelineList.innerHTML = timeline
        .map((entry) => `
            <li class="timeline-item">
                <span class="timeline-title">${entry.type}</span>
                <span>${entry.message}</span>
                ${entry.timestamp ? `<span class="timeline-meta">${formatDate(entry.timestamp)}</span>` : ''}
            </li>
        `)
        .join('');
};

const seedAssignedAssets = () => {
    const assets = getStorage(STORAGE_KEYS.assets, []);
    const employees = getStorage(STORAGE_KEYS.employees, []);
    employees.forEach((employee) => {
        employee.assignedAssets = assets.filter((asset) => asset.assignedTo === employee.id).map((item) => item.id);
    });
    setStorage(STORAGE_KEYS.employees, employees);
};

const getAverageHealth = (assets) => {
    if (!assets.length) return 0;
    const scores = assets.map((asset) => asset.healthScore ?? calculateAssetHealth(asset));
    const average = scores.reduce((sum, value) => sum + Number(value || 0), 0) / scores.length;
    return Math.round(average);
};

const renderDashboard = () => {
    const assets = getStorage(STORAGE_KEYS.assets, []);
    const employees = getStorage(STORAGE_KEYS.employees, []);
    const activities = getStorage(STORAGE_KEYS.activities, []);

    const stats = {
        total: assets.length,
        available: assets.filter((asset) => asset.status === 'Available').length,
        assigned: assets.filter((asset) => asset.status === 'Assigned').length,
        pending: assets.filter((asset) => asset.status === 'In Repair').length,
        employees: employees.length,
        categories: new Set(assets.map((asset) => asset.category)).size,
        averageHealth: `${getAverageHealth(assets)}%`,
        warrantyExpiringSoon: assets.filter((asset) => getWarrantyStatus(asset).label === 'Expiring Soon').length,
    };

    setStorage(STORAGE_KEYS.dashboardStats, stats);
    updateDashboardStats(stats);

    renderActivityFeed(activities);
    updateNotificationCount(getStorage(STORAGE_KEYS.notifications, []).filter((note) => note.unread).length);
    attachDashboardEvents();
};

window.addEventListener('focus', renderDashboard);

const updateDashboardStats = ({ total, available, assigned, employees, categories, pending, averageHealth, warrantyExpiringSoon }) => {
    const statMap = {
        totalAssets: total,
        availableAssets: available,
        assignedAssets: assigned,
        employeesCount: employees,
        categoryCount: categories,
        activeAssignments: assigned,
        pendingReviews: pending,
        averageHealth,
        warrantyExpiringSoon,
    };

    Object.entries(statMap).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
};

const renderActivityFeed = (activities) => {
    const activityList = document.getElementById('recentActivity');
    if (!activityList) return;

    activityList.innerHTML = '';
    activities.slice(0, 6).forEach((activity) => {
        const li = document.createElement('li');
        li.className = 'activity-item';
        li.textContent = getActivityMessage(activity);
        activityList.appendChild(li);
    });
};

const updateNotificationCount = (count) => {
    const badge = document.querySelector('.top-actions .badge');
    if (!badge) return;
    if (count <= 0) {
        badge.style.display = 'none';
        badge.textContent = '0';
    } else {
        badge.style.display = 'grid';
        badge.textContent = count;
    }
};

const saveActivity = (message, assetId = null) => {
    const activities = getStorage(STORAGE_KEYS.activities, []);
    const activityEntry = {
        message: typeof message === 'string' ? message : message.message,
        timestamp: typeof message === 'object' && message.timestamp ? message.timestamp : new Date().toISOString(),
        assetId: assetId || (typeof message === 'object' ? message.assetId : null),
    };
    const nextActivities = [activityEntry, ...activities].slice(0, 12);
    setStorage(STORAGE_KEYS.activities, nextActivities);
    renderActivityFeed(nextActivities);
    updateNotificationCount(getStorage(STORAGE_KEYS.notifications, []).filter((note) => note.unread).length);
};

const addActivity = (message, assetId = null) => {
    const activities = getStorage(STORAGE_KEYS.activities, []);
    const activityEntry = {
        message: typeof message === 'string' ? message : message.message,
        timestamp: typeof message === 'object' && message.timestamp ? message.timestamp : new Date().toISOString(),
        assetId: assetId || (typeof message === 'object' ? message.assetId : null),
    };
    const nextActivities = [activityEntry, ...activities].slice(0, 12);
    setStorage(STORAGE_KEYS.activities, nextActivities);
    renderActivityFeed(nextActivities);
    updateNotificationCount(getStorage(STORAGE_KEYS.notifications, []).filter((note) => note.unread).length);
};

const attachDashboardEvents = () => {
    const searchInput = document.getElementById('dashboardSearch');
    const notificationBtn = document.querySelector('.top-actions .icon-btn[aria-label="Notifications"]');

    if (searchInput && !searchInput.dataset.initialized) {
        searchInput.dataset.initialized = 'true';
        searchInput.addEventListener('input', handleDashboardSearch);
    }

    if (notificationBtn && !notificationBtn.dataset.initialized) {
        notificationBtn.dataset.initialized = 'true';
        notificationBtn.addEventListener('click', showNotificationCenter);
    }
};

const handleDashboardSearch = (event) => {
    const query = event.target.value.trim().toLowerCase();
    if (!query) {
        document.querySelectorAll('.activity-item.highlight').forEach((item) => item.classList.remove('highlight'));
        return;
    }
    const assets = getStorage(STORAGE_KEYS.assets, []);
    const employees = getStorage(STORAGE_KEYS.employees, []);

    const assetMatch = assets.find((asset) => [asset.name, asset.id, asset.category, asset.location, asset.serial].some((value) => value.toLowerCase().includes(query)));
    const employeeMatch = employees.find((employee) => [employee.name, employee.id, employee.role, employee.department, employee.email, employee.location].some((value) => value.toLowerCase().includes(query)));
    const reportMatch = assets.find((asset) => [asset.name, asset.id, asset.category, asset.location, asset.status].some((value) => value.toLowerCase().includes(query)));

    if (assetMatch) {
        highlightSearchResult(assetMatch.name || assetMatch.id);
        return;
    }
    if (employeeMatch) {
        window.location.href = 'employees.html';
        return;
    }
    if (reportMatch) {
        window.location.href = 'reports.html';
        return;
    }
};

const highlightSearchResult = (text) => {
    const searchInput = document.getElementById('dashboardSearch');
    const activityItems = document.querySelectorAll('.activity-item');
    activityItems.forEach((item) => {
        if (item.textContent.toLowerCase().includes(text.toLowerCase())) {
            item.classList.add('highlight');
        } else {
            item.classList.remove('highlight');
        }
    });
    if (searchInput) {
        searchInput.classList.add('search-result-highlight');
        setTimeout(() => searchInput.classList.remove('search-result-highlight'), 1200);
    }
};

const createStatElement = (id, value) => {
    const element = document.createElement('h3');
    element.id = id;
    element.textContent = value;
    return element;
};

const initializeAssetPage = () => {
    const assets = getStorage(STORAGE_KEYS.assets, []);
    const employees = getStorage(STORAGE_KEYS.employees, []);
    const tableWrap = document.getElementById('assetTableWrap');
    const cardsWrap = document.getElementById('assetCardsWrap');
    const openModalBtn = document.getElementById('openAssetModalBtn');
    const assetModalOverlay = document.getElementById('assetModalOverlay');
    const assetForm = document.getElementById('assetForm');
    const assetSearch = document.getElementById('assetSearch');
    const assetCategoryFilter = document.getElementById('assetCategoryFilter');
    const assetStatusFilter = document.getElementById('assetStatusFilter');
    const toggleViewBtn = document.getElementById('toggleAssetViewBtn');
    let showCards = false;
    let currentMode = 'create';
    let editingAssetId = null;
    const qrSection = document.getElementById('assetQrSection');
    const qrCanvas = document.getElementById('assetQrCanvas');
    const downloadQrBtn = document.getElementById('downloadQrBtn');
    const printQrBtn = document.getElementById('printQrBtn');

    const getAssignedEmployeeName = (asset) => {
        if (!asset?.assignedTo) return 'Unassigned';
        const employees = getStorage(STORAGE_KEYS.employees, []);
        const employee = findById(employees, asset.assignedTo);
        return employee?.name || 'Unassigned';
    };

    const getAssetQrText = (asset) => {
        const employeeName = getAssignedEmployeeName(asset);
        return [
            `Asset ID: ${asset.id}`,
            `Asset Name: ${asset.name}`,
            `Status: ${asset.status}`,
            `Location: ${asset.location}`,
            `Employee: ${employeeName}`,
        ].join('\n');
    };

    const renderAssetQr = (asset) => {
        if (!asset || !qrCanvas) return;
        const qr = new QRious({
            element: qrCanvas,
            value: getAssetQrText(asset),
            size: 260,
            background: '#ffffff',
            foreground: '#111827',
            level: 'H',
        });
        return qr;
    };

    const downloadAssetQr = () => {
        if (!qrCanvas) return;
        const link = document.createElement('a');
        link.href = qrCanvas.toDataURL('image/png');
        link.download = `asset-${editingAssetId || 'qr'}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const printAssetQr = () => {
        if (!qrCanvas) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`<!doctype html><html><head><title>Print Asset QR</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;height:100vh;}img{max-width:100%;max-height:100vh;}</style></head><body><img src="${qrCanvas.toDataURL('image/png')}" alt="Asset QR Code"></body></html>`);
        printWindow.document.close();
        printWindow.focus();
        printWindow.onload = () => printWindow.print();
    };

    const updateFilters = () => {
        assetCategoryFilter.innerHTML = '<option value="all">All Categories</option>';
        const categories = Array.from(new Set(getStorage(STORAGE_KEYS.assets, []).map((item) => item.category))).sort();
        categories.forEach((category) => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            assetCategoryFilter.appendChild(option);
        });
    };

    const getFilteredAssets = () => {
        const query = assetSearch?.value.trim().toLowerCase() || '';
        const category = assetCategoryFilter?.value || 'all';
        const status = assetStatusFilter?.value || 'all';

        return getStorage(STORAGE_KEYS.assets, []).filter((asset) => {
            const matchesQuery = [asset.name, asset.id, asset.category, asset.location].some((value) =>
                value.toLowerCase().includes(query)
            );
            const matchesCategory = category === 'all' || asset.category === category;
            const matchesStatus = status === 'all' || asset.status === status;
            return matchesQuery && matchesCategory && matchesStatus;
        });
    };

    const renderAssets = () => {
        const filtered = getFilteredAssets();
        const assetTotalCount = document.getElementById('assetTotalCount');
        const assetAvailableCount = document.getElementById('assetAvailableCount');
        const assetAssignedCount = document.getElementById('assetAssignedCount');
        assetTotalCount.textContent = getStorage(STORAGE_KEYS.assets, []).length;
        assetAvailableCount.textContent = getStorage(STORAGE_KEYS.assets, []).filter((asset) => asset.status === 'Available').length;
        assetAssignedCount.textContent = getStorage(STORAGE_KEYS.assets, []).filter((asset) => asset.status === 'Assigned').length;

        tableWrap.innerHTML = '';
        cardsWrap.innerHTML = '';

        const table = document.createElement('table');
        table.className = 'asset-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Asset Name</th>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');
        if (filtered.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="6">
                    <div class="empty-state-row">
                        <p><strong>No assets found</strong></p>
                        <p>Try adjusting the search, filters, or add a new asset.</p>
                    </div>
                </td>
            `;
            tbody.appendChild(emptyRow);
        } else {
            filtered.forEach((asset) => {
                const tr = document.createElement('tr');
                const statusClass = asset.status === 'Assigned' ? 'assigned' : asset.status === 'In Repair' ? 'repair' : '';
                tr.innerHTML = `
                    <td>${asset.name}</td>
                    <td>${asset.id}</td>
                    <td>${asset.category}</td>
                    <td><span class="status-pill ${statusClass}">${asset.status}</span></td>
                    <td>${asset.location}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="secondary-btn" data-action="view" data-id="${asset.id}">View</button>
                            <button class="secondary-btn" data-action="qr" data-id="${asset.id}">QR</button>
                            <button class="secondary-btn" data-action="edit" data-id="${asset.id}">Edit</button>
                            <button class="secondary-btn" data-action="delete" data-id="${asset.id}">Delete</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        tableWrap.appendChild(table);

        if (filtered.length === 0) {
            const emptyCard = document.createElement('article');
            emptyCard.className = 'asset-card empty-card';
            emptyCard.innerHTML = `
                <div>
                    <h4>No assets to display</h4>
                    <p>Switch to table view or add a new asset to populate the catalog.</p>
                </div>
            `;
            cardsWrap.appendChild(emptyCard);
        } else {
            filtered.forEach((asset) => {
                const card = document.createElement('article');
                card.className = 'asset-card';
            const statusClass = asset.status === 'Assigned' ? 'assigned' : asset.status === 'In Repair' ? 'repair' : '';
            const health = getHealthStatus(asset.healthScore || calculateAssetHealth(asset));
            const warranty = getWarrantyStatus(asset);
            card.innerHTML = `
                <div>
                    <h4>${asset.name}</h4>
                    <p class="eyebrow">${asset.category}</p>
                </div>
                <div>
                    <p><strong>ID:</strong> ${asset.id}</p>
                    <p><strong>Serial:</strong> ${asset.serial}</p>
                    <p><strong>Status:</strong> <span class="status-pill ${statusClass}">${asset.status}</span></p>
                    <p><strong>Location:</strong> ${asset.location}</p>
                    <p><strong>Warranty:</strong> <span class="health-pill ${warranty.css}">${warranty.icon} ${warranty.label} (${getWarrantyRemaining(asset)})</span></p>
                    <p><strong>Health:</strong> <span class="health-pill ${health.css}">${health.icon} ${health.label} (${asset.healthScore || calculateAssetHealth(asset)}%)</span></p>
                </div>
                <div class="action-buttons">
                    <button class="secondary-btn" data-action="view" data-id="${asset.id}">View</button>
                    <button class="secondary-btn" data-action="qr" data-id="${asset.id}">QR</button>
                    <button class="secondary-btn" data-action="edit" data-id="${asset.id}">Edit</button>
                    <button class="secondary-btn" data-action="delete" data-id="${asset.id}">Delete</button>
                </div>
            `;
            cardsWrap.appendChild(card);
            });
        }
    };

    const openModal = (mode, asset = null) => {
        currentMode = mode;
        editingAssetId = asset?.id || null;
        const modalTitle = document.getElementById('assetModalTitle');
        const submitButton = assetForm.querySelector('button[type="submit"]');
        const inputs = assetForm.querySelectorAll('input, select');

        if (mode === 'create') {
            modalTitle.textContent = 'Add New Asset';
            submitButton.textContent = 'Save Asset';
            assetForm.reset();
            inputs.forEach((field) => field.removeAttribute('disabled'));
            qrSection?.classList.add('hidden');
        } else if (mode === 'edit') {
            modalTitle.textContent = 'Edit Asset';
            submitButton.textContent = 'Update Asset';
            populateAssetForm(asset);
            inputs.forEach((field) => field.removeAttribute('disabled'));
            qrSection?.classList.add('hidden');
        } else if (mode === 'view') {
            modalTitle.textContent = 'Asset Details';
            submitButton.textContent = 'Close';
            populateAssetForm(asset);
            inputs.forEach((field) => field.setAttribute('disabled', 'disabled'));
            qrSection?.classList.remove('hidden');
            renderAssetQr(asset);
            renderAssetTimeline(asset);
        }

        assetModalOverlay.classList.remove('hidden');
    };

    const closeModal = () => {
        assetModalOverlay.classList.add('hidden');
    };

    const populateAssetForm = (asset) => {
        if (!asset) return;
        const values = {
            name: asset.name,
            id: asset.id,
            category: asset.category,
            serial: asset.serial,
            purchaseDate: asset.purchaseDate,
            warrantyStart: asset.warrantyStart || '',
            warrantyEnd: asset.warrantyEnd || '',
            location: asset.location,
            maintenanceCount: asset.maintenanceCount || 0,
            warrantyRemaining: `${getWarrantyRemaining(asset)}`,
            healthScore: `${asset.healthScore || 0}%`,
            condition: asset.condition,
            status: asset.status,
        };
        Object.entries(values).forEach(([key, value]) => {
            const input = assetForm.querySelector(`[name="${key}"]`);
            if (input) input.value = value;
        });
    };

    const saveAsset = (event) => {
        event.preventDefault();
        if (currentMode === 'view') {
            return closeModal();
        }

        const formData = new FormData(assetForm);
        const assetData = {
            id: formData.get('id').trim(),
            name: formData.get('name').trim(),
            category: formData.get('category').trim(),
            serial: formData.get('serial').trim(),
            purchaseDate: formData.get('purchaseDate'),
            warrantyStart: formData.get('warrantyStart'),
            warrantyEnd: formData.get('warrantyEnd'),
            location: formData.get('location').trim(),
            maintenanceCount: Number(formData.get('maintenanceCount') || 0),
            condition: formData.get('condition'),
            status: formData.get('status'),
        };

        if (!assetData.id || !assetData.name || !assetData.category || !assetData.serial || !assetData.purchaseDate || !assetData.location) {
            return showToast('Please complete all fields.');
        }

        const assets = getStorage(STORAGE_KEYS.assets, []);
        if (currentMode === 'create') {
            const exists = findById(assets, assetData.id);
            if (exists) {
                return showToast('Asset ID already exists.');
            }
            assets.unshift({ ...assetData, assignedTo: null, healthScore: calculateAssetHealth(assetData) });
            saveActivity(`Asset Added: ${assetData.name}`, assetData.id);
            showToast('Asset added successfully.', 'success');
        } else if (currentMode === 'edit') {
            const index = assets.findIndex((item) => item.id === editingAssetId);
            if (index >= 0) {
                const existing = assets[index];
                const duplicate = assets.find((item) => item.id === assetData.id && item.id !== editingAssetId);
                if (duplicate) {
                    return showToast('Another asset already uses that ID.');
                }

                const updatedAsset = {
                    ...existing,
                    ...assetData,
                    assignedTo: assetData.status === 'Assigned' ? existing.assignedTo : null,
                    healthScore: calculateAssetHealth(assetData),
                };
                assets[index] = updatedAsset;

                if (existing.status === 'Assigned' && updatedAsset.status !== 'Assigned') {
                    removeAssetFromEmployees(existing.id);
                    createNotification({
                        type: 'returned',
                        message: `${assetData.name} marked as returned.`,
                        assetId: assetData.id,
                    });
                }

                if (existing.status !== 'In Repair' && assetData.status === 'In Repair') {
                    saveActivity(`Maintenance started for ${assetData.name}.`, assetData.id);
                    createNotification({
                        type: 'maintenance',
                        message: `Maintenance started for ${assetData.name}.`,
                        assetId: assetData.id,
                    });
                } else if (assetData.maintenanceCount > existing.maintenanceCount) {
                    saveActivity(`Maintenance logged for ${assetData.name}.`, assetData.id);
                    createNotification({
                        type: 'maintenance',
                        message: `Maintenance logged for ${assetData.name}.`,
                        assetId: assetData.id,
                    });
                }

                saveActivity(`Asset Updated: ${assetData.name}`, assetData.id);
                showToast('Asset updated successfully.', 'success');
            }
        }

        setStorage(STORAGE_KEYS.assets, assets);
        renderAssets();
        updateFilters();
        closeModal();
    };

    const handleActionClick = (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.dataset.action;
        const assetId = button.dataset.id;
        const assets = getStorage(STORAGE_KEYS.assets, []);
        const asset = findById(assets, assetId);
        if (!asset) return;

        if (action === 'view') {
            openModal('view', asset);
        }
        if (action === 'qr') {
            openModal('view', asset);
        }
        if (action === 'edit') {
            openModal('edit', asset);
        }
        if (action === 'delete') {
            const confirmed = confirm('Delete this asset? This action cannot be undone.');
            if (!confirmed) return;
            const updated = removeById(assets, assetId);
            setStorage(STORAGE_KEYS.assets, updated);
            removeAssetFromEmployees(assetId);
            saveActivity(`Asset Deleted: ${asset.name}`);
            showToast('Asset deleted successfully.', 'success');
            renderAssets();
            updateFilters();
        }
    };

    const removeAssetFromEmployees = (assetId) => {
        const employees = getStorage(STORAGE_KEYS.employees, []);
        const updatedEmployees = employees.map((employee) => ({
            ...employee,
            assignedAssets: employee.assignedAssets.filter((id) => id !== assetId),
        }));
        setStorage(STORAGE_KEYS.employees, updatedEmployees);
    };

    updateFilters();
    renderAssets();

    openModalBtn?.addEventListener('click', () => openModal('create'));
    toggleViewBtn?.addEventListener('click', () => {
        showCards = !showCards;
        tableWrap.classList.toggle('hidden', showCards);
        cardsWrap.classList.toggle('hidden', !showCards);
    });

    assetSearch?.addEventListener('input', renderAssets);
    assetCategoryFilter?.addEventListener('change', renderAssets);
    assetStatusFilter?.addEventListener('change', renderAssets);

    assetModalOverlay?.addEventListener('click', (event) => {
        if (event.target === assetModalOverlay) closeModal();
    });

    assetModalOverlay?.querySelectorAll('.close-modal').forEach((button) => button.addEventListener('click', closeModal));
    downloadQrBtn?.addEventListener('click', downloadAssetQr);
    printQrBtn?.addEventListener('click', printAssetQr);

    assetForm?.addEventListener('submit', saveAsset);
    tableWrap?.addEventListener('click', handleActionClick);
    cardsWrap?.addEventListener('click', handleActionClick);
};

const initializeEmployeePage = () => {
    const employeeContent = document.getElementById('employeeContent');
    const employeeSearch = document.getElementById('employeeSearch');
    const departmentFilter = document.getElementById('employeeDepartmentFilter');
    const assetFilter = document.getElementById('employeeAssetFilter');
    const openEmployeeModalBtn = document.getElementById('openEmployeeModalBtn');
    const openAssignAssetModalBtn = document.getElementById('openAssignAssetModalBtn');
    const employeeModalOverlay = document.getElementById('employeeModalOverlay');
    const employeeForm = document.getElementById('employeeForm');
    const assignModalOverlay = document.getElementById('assignModalOverlay');
    const assignForm = document.getElementById('assignForm');
    let editingEmployeeId = null;
    let assignmentMode = 'assign';

    const refreshEmployeeData = () => {
        seedAssignedAssets();
        renderEmployees();
    };

    const getFilteredEmployees = () => {
        const query = employeeSearch?.value.trim().toLowerCase() || '';
        const department = departmentFilter?.value || 'all';
        const assetStatus = assetFilter?.value || 'all';
        const employees = getStorage(STORAGE_KEYS.employees, []);

        return employees.filter((employee) => {
            const matchesQuery = [employee.name, employee.id, employee.role, employee.department, employee.location]
                .some((value) => value.toLowerCase().includes(query));
            const matchesDepartment = department === 'all' || employee.department === department;
            const hasAssets = employee.assignedAssets.length > 0;
            const matchesAssetStatus =
                assetStatus === 'all' ||
                (assetStatus === 'hasAssets' && hasAssets) ||
                (assetStatus === 'noAssets' && !hasAssets);
            return matchesQuery && matchesDepartment && matchesAssetStatus;
        });
    };

    const updateEmployeeFilters = () => {
        departmentFilter.innerHTML = `
            <option value="all">All Departments</option>
            <option value="Technology">Technology</option>
            <option value="Operations">Operations</option>
            <option value="Finance">Finance</option>
        `;
    };

    const renderEmployees = () => {
        const employees = getFilteredEmployees();
        const stats = getStorage(STORAGE_KEYS.employees, []);
        const assets = getStorage(STORAGE_KEYS.assets, []);

        document.getElementById('employeeCount').textContent = stats.length;
        document.getElementById('employeeAssignedCount').textContent = assets.filter((asset) => asset.status === 'Assigned').length;
        document.getElementById('employeeAvailableCount').textContent = assets.filter((asset) => asset.status === 'Available').length;

        employeeContent.innerHTML = '';
        if (employees.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'glass-card empty-state-card';
            emptyState.innerHTML = `
                <h3>No employees found</h3>
                <p>Use the Add Employee button to create profiles and assign assets.</p>
            `;
            employeeContent.appendChild(emptyState);
            return;
        }

        employees.forEach((employee) => {
            const card = document.createElement('article');
            card.className = 'employee-card';
            const assignedLabel = employee.assignedAssets.length ? `${employee.assignedAssets.length} assets assigned` : 'No assets assigned';
            card.innerHTML = `
                <div class="panel-header">
                    <div>
                        <h4>${employee.name}</h4>
                        <p>${employee.role} • ${employee.department}</p>
                    </div>
                    <span class="status-pill ${employee.assignedAssets.length ? '' : 'repair'}">${assignedLabel}</span>
                </div>
                <div>
                    <p><strong>ID:</strong> ${employee.id}</p>
                    <p><strong>Email:</strong> ${employee.email}</p>
                    <p><strong>Phone:</strong> ${employee.phone}</p>
                    <p><strong>Location:</strong> ${employee.location}</p>
                </div>
                <div class="action-buttons">
                    <button class="secondary-btn" data-action="view" data-id="${employee.id}">View</button>
                    <button class="secondary-btn" data-action="edit" data-id="${employee.id}">Edit</button>
                    <button class="secondary-btn" data-action="delete" data-id="${employee.id}">Delete</button>
                    ${employee.assignedAssets.length ? `<button class="secondary-btn" data-action="return" data-id="${employee.id}">Return Asset</button>` : ''}
                </div>
            `;
            employeeContent.appendChild(card);
        });
    };

    const openEmployeeModal = (employee = null, mode = 'create') => {
        const title = document.getElementById('employeeModalTitle');
        const submitBtn = employeeForm.querySelector('button[type="submit"]');
        editingEmployeeId = employee?.id || null;

        if (mode === 'create') {
            title.textContent = 'Add Employee';
            submitBtn.textContent = 'Save Employee';
            employeeForm.reset();
            employeeForm.querySelectorAll('input, select').forEach((field) => field.removeAttribute('disabled'));
        } else if (mode === 'edit') {
            title.textContent = 'Edit Employee';
            submitBtn.textContent = 'Update Employee';
            fillEmployeeForm(employee);
            employeeForm.querySelectorAll('input, select').forEach((field) => field.removeAttribute('disabled'));
        } else {
            title.textContent = 'Employee Details';
            submitBtn.textContent = 'Close';
            fillEmployeeForm(employee);
            employeeForm.querySelectorAll('input, select').forEach((field) => field.setAttribute('disabled', 'disabled'));
        }

        employeeModalOverlay.classList.remove('hidden');
    };

    const fillEmployeeForm = (employee) => {
        const fields = ['name', 'id', 'role', 'department', 'email', 'phone', 'location'];
        fields.forEach((field) => {
            const input = employeeForm.querySelector(`[name="${field}"]`);
            if (input) input.value = employee[field] || '';
        });
    };

    const closeEmployeeModal = () => employeeModalOverlay.classList.add('hidden');
    const closeAssignModal = () => assignModalOverlay.classList.add('hidden');

    const saveEmployee = (event) => {
        event.preventDefault();
        if (employeeForm.querySelector('button[type="submit"]').textContent === 'Close') {
            return closeEmployeeModal();
        }

        const formData = new FormData(employeeForm);
        const employeeData = {
            id: formData.get('id').trim(),
            name: formData.get('name').trim(),
            role: formData.get('role').trim(),
            department: formData.get('department').trim(),
            email: formData.get('email').trim(),
            phone: formData.get('phone').trim(),
            location: formData.get('location').trim(),
            assignedAssets: [],
        };

        if (!employeeData.id || !employeeData.name || !employeeData.role || !employeeData.department || !employeeData.email || !employeeData.phone || !employeeData.location) {
            return showToast('Please complete all employee fields.', 'error');
        }

        const employees = getStorage(STORAGE_KEYS.employees, []);
        if (editingEmployeeId) {
            const index = employees.findIndex((item) => item.id === editingEmployeeId);
            if (index >= 0) {
                const existing = employees[index];
                const duplicate = employees.find((item) => item.id === employeeData.id && item.id !== editingEmployeeId);
                if (duplicate) {
                    return showToast('Employee ID already exists.', 'error');
                }
                employees[index] = { ...existing, ...employeeData, assignedAssets: existing.assignedAssets };

                if (employeeData.id !== editingEmployeeId) {
                    const assets = getStorage(STORAGE_KEYS.assets, []).map((asset) =>
                        asset.assignedTo === editingEmployeeId ? { ...asset, assignedTo: employeeData.id } : asset
                    );
                    setStorage(STORAGE_KEYS.assets, assets);
                }

                showToast('Employee updated successfully.', 'success');
                saveActivity(`Employee Updated: ${employeeData.name}`);
            }
        } else {
            const exists = findById(employees, employeeData.id);
            if (exists) {
                return showToast('Employee ID already exists.', 'error');
            }
            employees.unshift(employeeData);
            showToast('Employee added successfully.', 'success');
            saveActivity(`Employee Added: ${employeeData.name}`);
            createNotification({
                type: 'employee',
                message: `New employee added: ${employeeData.name}.`,
                employeeId: employeeData.id,
            });
        }
        setStorage(STORAGE_KEYS.employees, employees);
        refreshEmployeeData();
        closeEmployeeModal();
    };

    const handleEmployeeAction = (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.dataset.action;
        const employeeId = button.dataset.id;
        const employees = getStorage(STORAGE_KEYS.employees, []);
        const employee = findById(employees, employeeId);
        if (!employee) return;

        if (action === 'view') {
            openEmployeeModal(employee, 'view');
        }
        if (action === 'edit') {
            openEmployeeModal(employee, 'edit');
        }
        if (action === 'delete') {
            const confirmed = confirm('Delete this employee and release assigned assets?');
            if (!confirmed) return;
            const updatedEmployees = removeById(employees, employeeId);
            const assets = getStorage(STORAGE_KEYS.assets, []).map((asset) =>
                employee.assignedAssets.includes(asset.id)
                    ? { ...asset, status: 'Available', assignedTo: null }
                    : asset
            );
            setStorage(STORAGE_KEYS.employees, updatedEmployees);
            setStorage(STORAGE_KEYS.assets, assets);
            showToast('Employee deleted successfully.', 'success');
            saveActivity(`Employee Deleted: ${employee.name}`);
            refreshEmployeeData();
        }
        if (action === 'return') {
            const assets = getStorage(STORAGE_KEYS.assets, []);
            const updatedAssets = assets.map((asset) =>
                employee.assignedAssets.includes(asset.id) ? { ...asset, status: 'Available', assignedTo: null } : asset
            );
            const updatedEmployees = employees.map((item) =>
                item.id === employeeId ? { ...item, assignedAssets: [] } : item
            );
            setStorage(STORAGE_KEYS.assets, updatedAssets);
            setStorage(STORAGE_KEYS.employees, updatedEmployees);
            showToast('All assigned assets returned.');
            saveActivity(`Returned assets from ${employee.name}.`);
            createNotification({
                type: 'returned',
                message: `Returned assets from ${employee.name}.`,
                employeeId: employee.id,
            });
            refreshEmployeeData();
        }
    };

    const openAssignModal = () => {
        const availableAssets = getStorage(STORAGE_KEYS.assets, []).filter((asset) => asset.status === 'Available');
        const employees = getStorage(STORAGE_KEYS.employees, []);
        const employeeSelect = assignForm.querySelector('[name="employeeId"]');
        const assetSelect = assignForm.querySelector('[name="assetId"]');

        if (!employees.length) {
            showToast('Add an employee before assigning assets.', 'error');
            return;
        }
        if (!availableAssets.length) {
            showToast('No available assets to assign.', 'error');
            return;
        }

        employeeSelect.innerHTML = '<option value="">Select employee</option>' + employees.map((employee) => `<option value="${employee.id}">${employee.name} (${employee.role})</option>`).join('');
        assetSelect.innerHTML = '<option value="">Select available asset</option>' + availableAssets.map((asset) => `<option value="${asset.id}">${asset.name} (${asset.category})</option>`).join('');
        assignModalOverlay.classList.remove('hidden');
    };

    const assignAsset = (event) => {
        event.preventDefault();
        const formData = new FormData(assignForm);
        const employeeId = formData.get('employeeId');
        const assetId = formData.get('assetId');

        if (!employeeId || !assetId) {
            return showToast('Select both employee and asset.', 'error');
        }

        const employees = getStorage(STORAGE_KEYS.employees, []);
        const assets = getStorage(STORAGE_KEYS.assets, []);
        const employee = findById(employees, employeeId);
        const asset = findById(assets, assetId);
        if (!employee || !asset) return;

        const updatedAssets = assets.map((item) =>
            item.id === assetId ? { ...item, status: 'Assigned', assignedTo: employee.id } : item
        );
        const updatedEmployees = employees.map((item) =>
            item.id === employee.id
                ? { ...item, assignedAssets: Array.from(new Set([...item.assignedAssets, asset.id])) }
                : item
        );

        setStorage(STORAGE_KEYS.assets, updatedAssets);
        setStorage(STORAGE_KEYS.employees, updatedEmployees);
        showToast('Asset successfully assigned.');
        saveActivity(`Assigned ${asset.name} to ${employee.name}.`, asset.id);
        createNotification({
            type: 'assigned',
            message: `${asset.name} assigned to ${employee.name}.`,
            assetId: asset.id,
            employeeId: employee.id,
        });
        refreshEmployeeData();
        closeAssignModal();
    };

    updateEmployeeFilters();
    renderEmployees();

    openEmployeeModalBtn?.addEventListener('click', () => openEmployeeModal());
    openAssignAssetModalBtn?.addEventListener('click', openAssignModal);
    employeeSearch?.addEventListener('input', renderEmployees);
    departmentFilter?.addEventListener('change', renderEmployees);
    assetFilter?.addEventListener('change', renderEmployees);

    employeeModalOverlay?.addEventListener('click', (event) => {
        if (event.target === employeeModalOverlay) closeEmployeeModal();
    });
    assignModalOverlay?.addEventListener('click', (event) => {
        if (event.target === assignModalOverlay) closeAssignModal();
    });

    employeeModalOverlay?.querySelectorAll('.close-modal').forEach((button) => button.addEventListener('click', closeEmployeeModal));
    assignModalOverlay?.querySelectorAll('.close-modal').forEach((button) => button.addEventListener('click', closeAssignModal));
    employeeForm?.addEventListener('submit', saveEmployee);
    assignForm?.addEventListener('submit', assignAsset);
    employeeContent?.addEventListener('click', handleEmployeeAction);
};

const initializeReportsPage = () => {
    const reportSearch = document.getElementById('reportSearch');
    const reportFilterSearch = document.getElementById('reportFilterSearch');
    const reportCategoryFilter = document.getElementById('reportCategoryFilter');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    let statusChart = null;
    let categoryChart = null;
    let monthlyChart = null;
    let departmentChart = null;

    const populateReportFilters = () => {
        const categories = Array.from(new Set(getStorage(STORAGE_KEYS.assets, []).map((asset) => asset.category))).sort();
        reportCategoryFilter.innerHTML = '<option value="all">All Categories</option>' + categories.map((category) => `<option value="${category}">${category}</option>`).join('');
    };

    const getReportData = () => {
        const query = `${(reportSearch?.value || '').trim()} ${(reportFilterSearch?.value || '').trim()}`.trim().toLowerCase();
        const category = reportCategoryFilter?.value || 'all';
        return getStorage(STORAGE_KEYS.assets, []).filter((asset) => {
            const matchesQuery = [asset.name, asset.id, asset.category, asset.location, asset.condition, asset.status]
                .some((value) => value.toLowerCase().includes(query));
            return matchesQuery && (category === 'all' || asset.category === category);
        });
    };

    const getMonthlyActivityData = () => {
        const assets = getReportData();
        const counts = {};
        assets.forEach((asset) => {
            if (!asset.purchaseDate) return;
            const month = new Date(asset.purchaseDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
            counts[month] = (counts[month] || 0) + 1;
        });
        return Object.entries(counts)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .reduce((acc, [month, count]) => {
                acc.labels.push(month);
                acc.values.push(count);
                return acc;
            }, { labels: [], values: [] });
    };

    const getDepartmentAssetData = () => {
        const employees = getStorage(STORAGE_KEYS.employees, []);
        const counts = employees.reduce((acc, employee) => {
            const department = employee.department || 'Unknown';
            acc[department] = (acc[department] || 0) + (employee.assignedAssets?.length || 0);
            return acc;
        }, {});
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .reduce((acc, [department, count]) => {
                acc.labels.push(department);
                acc.values.push(count);
                return acc;
            }, { labels: [], values: [] });
    };

    const getWarrantyStatus = (asset) => {
        const today = new Date();
        const start = asset.warrantyStart ? new Date(asset.warrantyStart) : null;
        const end = asset.warrantyEnd ? new Date(asset.warrantyEnd) : null;
        if (!end || Number.isNaN(end.getTime()) || today > end) {
            return { label: 'Expired', css: 'critical', icon: '🔴' };
        }
        const diffDays = Math.ceil((end - today) / 86400000);
        if (diffDays <= 30) {
            return { label: 'Expiring Soon', css: 'warning', icon: '🟡' };
        }
        return { label: 'Active', css: 'excellent', icon: '🟢' };
    };

    const getWarrantyRemaining = (asset) => {
        const today = new Date();
        const end = asset.warrantyEnd ? new Date(asset.warrantyEnd) : null;
        if (!end || Number.isNaN(end.getTime())) return 'Expired';
        if (today > end) return 'Expired';
        const diffDays = Math.ceil((end - today) / 86400000);
        return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
    };

    const renderReportCards = () => {
        const assets = getReportData();
        document.getElementById('reportAssetTotal').textContent = assets.length;
        document.getElementById('reportAssetAvailable').textContent = assets.filter((asset) => asset.status === 'Available').length;
        document.getElementById('reportAssetAssigned').textContent = assets.filter((asset) => asset.status === 'Assigned').length;
        document.getElementById('reportWarrantyExpiringSoon').textContent = assets.filter((asset) => getWarrantyStatus(asset).label === 'Expiring Soon').length;
        document.getElementById('reportAverageHealth').textContent = `${getAverageHealth(assets)}%`;
        document.getElementById('reportEmployeeTotal').textContent = getStorage(STORAGE_KEYS.employees, []).length;
    };

    const renderReportCharts = () => {
        const assets = getReportData();
        const statusCounts = assets.reduce((acc, asset) => {
            acc[asset.status] = (acc[asset.status] || 0) + 1;
            return acc;
        }, {});
        const categoryCounts = assets.reduce((acc, asset) => {
            acc[asset.category] = (acc[asset.category] || 0) + 1;
            return acc;
        }, {});

        const statusLabels = Object.keys(statusCounts);
        const statusValues = Object.values(statusCounts);
        const categoryLabels = Object.keys(categoryCounts);
        const categoryValues = Object.values(categoryCounts);
        const monthlyData = getMonthlyActivityData();
        const departmentData = getDepartmentAssetData();

        const pieCanvas = document.getElementById('statusPieChart');
        const barCanvas = document.getElementById('categoryBarChart');
        const lineCanvas = document.getElementById('monthlyActivityChart');
        const departmentCanvas = document.getElementById('departmentAssetChart');

        if (statusChart) statusChart.destroy();
        if (categoryChart) categoryChart.destroy();
        if (monthlyChart) monthlyChart.destroy();
        if (departmentChart) departmentChart.destroy();

        statusChart = new Chart(pieCanvas, {
            type: 'doughnut',
            data: {
                labels: statusLabels,
                datasets: [{
                    data: statusValues,
                    backgroundColor: ['#2563EB', '#10B981', '#F59E0B', '#EF4444'],
                }],
            },
            options: {
                plugins: { legend: { position: 'bottom' } },
                maintainAspectRatio: false,
            },
        });

        categoryChart = new Chart(barCanvas, {
            type: 'bar',
            data: {
                labels: categoryLabels,
                datasets: [{
                    label: 'Assets',
                    data: categoryValues,
                    backgroundColor: categoryLabels.map((_, index) => `rgba(37, 99, 235, ${0.7 - index * 0.08})`),
                    borderRadius: 12,
                }],
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.16)' } },
                    x: { grid: { display: false } },
                },
                maintainAspectRatio: false,
            },
        });

        monthlyChart = new Chart(lineCanvas, {
            type: 'line',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'New Assets',
                    data: monthlyData.values,
                    borderColor: '#2563EB',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 5,
                }],
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.16)' } },
                    x: { grid: { display: false } },
                },
                maintainAspectRatio: false,
            },
        });

        departmentChart = new Chart(departmentCanvas, {
            type: 'bar',
            data: {
                labels: departmentData.labels,
                datasets: [{
                    label: 'Assigned Assets',
                    data: departmentData.values,
                    backgroundColor: departmentData.labels.map((_, index) => `rgba(16, 185, 129, ${0.7 - index * 0.06})`),
                    borderRadius: 12,
                }],
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.16)' } },
                    x: { grid: { display: false } },
                },
                maintainAspectRatio: false,
            },
        });
    };

    const renderReportSummaries = () => {
        const assets = getReportData();
        const statusCounts = assets.reduce((acc, asset) => {
            acc[asset.status] = (acc[asset.status] || 0) + 1;
            return acc;
        }, {});
        const categoryCounts = assets.reduce((acc, asset) => {
            acc[asset.category] = (acc[asset.category] || 0) + 1;
            return acc;
        }, {});
        const warrantyCounts = assets.reduce((acc, asset) => {
            const label = getWarrantyStatus(asset).label;
            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {});

        const statusSummaryList = document.getElementById('statusSummaryList');
        const categorySummaryList = document.getElementById('categorySummaryList');
        const warrantySummaryList = document.getElementById('warrantySummaryList');

        statusSummaryList.innerHTML = Object.entries(statusCounts)
            .map(([status, count]) => `<li><span>${status}</span><strong>${count}</strong></li>`)
            .join('') || '<li><span>No status summary available</span></li>';

        categorySummaryList.innerHTML = Object.entries(categoryCounts)
            .map(([category, count]) => `<li><span>${category}</span><strong>${count}</strong></li>`)
            .join('') || '<li><span>No category summary available</span></li>';

        warrantySummaryList.innerHTML = Object.entries(warrantyCounts)
            .map(([status, count]) => `<li><span>${status}</span><strong>${count}</strong></li>`)
            .join('') || '<li><span>No warranty data available</span></li>';
    };

    const buildSimplePdf = (textLines) => {
        const escapePdfString = (value) => String(value || '')
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)');

        const bodyCommands = textLines.map((line) => `(${escapePdfString(line)}) Tj T*`).join(' ');
        const stream = `BT /F1 12 Tf 40 760 Td ${bodyCommands} ET`;
        const content = `stream\n${stream}\nendstream\n`;
        const objects = [
            '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
            '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
            '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
            `4 0 obj\n<< /Length ${stream.length} >>\n${content}endobj\n`,
            '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
        ];

        let offset = 0;
        const xrefEntries = ['0000000000 65535 f \n'];
        objects.forEach((obj) => {
            const entry = offset.toString().padStart(10, '0') + ' 00000 n \n';
            xrefEntries.push(entry);
            offset += obj.length;
        });

        const header = '%PDF-1.1\n';
        const xref = `xref\n0 ${objects.length + 1}\n${xrefEntries.join('')}`;
        const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`;
        return new Blob([header, ...objects, xref, trailer], { type: 'application/pdf' });
    };

    const downloadBlob = (data, mimeType, filename) => {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const exportReportCsv = () => {
        const assets = getReportData();
        const employees = getStorage(STORAGE_KEYS.employees, []);
        const assignedMap = employees.reduce((acc, employee) => {
            (employee.assignedAssets || []).forEach((assetId) => {
                acc[assetId] = employee.name;
            });
            return acc;
        }, {});

        const rows = [
            ['Asset ID', 'Name', 'Category', 'Status', 'Assigned To', 'Location', 'Purchase Date', 'Condition'],
            ...assets.map((asset) => [
                asset.id,
                asset.name,
                asset.category,
                asset.status,
                assignedMap[asset.id] || '',
                asset.location,
                asset.purchaseDate,
                asset.condition,
            ]),
        ];

        const csv = rows.map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
        downloadBlob(csv, 'text/csv;charset=utf-8;', 'assetflow-reports.csv');
        showToast('CSV export completed.', 'success');
    };

    const exportReportPdf = () => {
        const assets = getReportData();
        const available = assets.filter((asset) => asset.status === 'Available').length;
        const assigned = assets.filter((asset) => asset.status === 'Assigned').length;
        const employees = getStorage(STORAGE_KEYS.employees, []).length;

        const lines = [
            'AssetFlow Report',
            `Date: ${new Date().toLocaleDateString('en-IN')}`,
            '',
            `Total Assets: ${assets.length}`,
            `Available: ${available}`,
            `Assigned: ${assigned}`,
            `Employees: ${employees}`,
            '',
            `Filter: ${reportCategoryFilter?.value || 'all'}`,
            `Search: ${(reportSearch?.value || reportFilterSearch?.value || '-').trim()}`,
            '',
            'Status Summary:',
            ...Object.entries(assets.reduce((acc, asset) => {
                acc[asset.status] = (acc[asset.status] || 0) + 1;
                return acc;
            }, {})).map(([status, value]) => `${status}: ${value}`),
            '',
            'Category Summary:',
            ...Object.entries(assets.reduce((acc, asset) => {
                acc[asset.category] = (acc[asset.category] || 0) + 1;
                return acc;
            }, {})).map(([category, value]) => `${category}: ${value}`),
        ];
        const pdfBlob = buildSimplePdf(lines);
        downloadBlob(pdfBlob, 'application/pdf', 'assetflow-report.pdf');
        showToast('PDF export completed.', 'success');
    };

    const renderReports = () => {
        renderReportCards();
        renderReportCharts();
        renderReportSummaries();
    };

    populateReportFilters();
    renderReports();

    reportSearch?.addEventListener('input', renderReports);
    reportFilterSearch?.addEventListener('input', renderReports);
    reportCategoryFilter?.addEventListener('change', renderReports);
    exportCsvBtn?.addEventListener('click', exportReportCsv);
    exportPdfBtn?.addEventListener('click', exportReportPdf);

    window.addEventListener('storage', ({ key }) => {
        if ([STORAGE_KEYS.assets, STORAGE_KEYS.employees].includes(key)) {
            renderReports();
        }
    });
    window.addEventListener('focus', renderReports);
};

const initNavigationToggle = () => {
    const menuBtn = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const collapseBtn = document.getElementById('sidebarCollapseBtn');
    if (!menuBtn || !sidebar) return;

    menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    collapseBtn?.addEventListener('click', () => sidebar.classList.toggle('collapsed'));

    document.addEventListener('click', (event) => {
        if (!sidebar.contains(event.target) && !menuBtn.contains(event.target)) {
            sidebar.classList.remove('open');
        }
    });
};

const initKeyboardShortcuts = () => {
    document.addEventListener('keydown', (event) => {
        const active = document.activeElement;
        const isFormInput = active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName);
        if (event.key === 'Escape') {
            const modal = document.querySelector('.modal-overlay:not(.hidden)');
            const closeBtn = modal?.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.click();
                event.preventDefault();
            }
            return;
        }
        if (isFormInput) return;

        const page = document.body.dataset.page;
        if (event.key === '/') {
            const searchInput = document.querySelector('.top-search input, #assetSearch, #employeeSearch, #reportSearch');
            searchInput?.focus();
            event.preventDefault();
            return;
        }
        if (event.key.toLowerCase() === 'n') {
            if (page === 'assets') {
                document.getElementById('openAssetModalBtn')?.click();
            } else if (page === 'employees') {
                document.getElementById('openEmployeeModalBtn')?.click();
            } else {
                showToast('Press N on Assets or Employees to create new items.', 'info');
            }
            return;
        }
        if (event.key === '?') {
            showToast('Shortcuts: / to search, N to add, Esc to close modal.', 'info');
        }
    });
};

const initApp = () => {
    // Basic auth guard: redirect to login if not authenticated
    const _userRaw = localStorage.getItem('assetflow_user');
    if (!_userRaw && document.body.dataset.page !== 'login') {
        window.location.href = 'login.html';
        return;
    }
    if (_userRaw && document.body.dataset.page === 'login') {
        window.location.href = 'index.html';
        return;
    }

    showLoading();
    initLocalStorage();
    seedAssignedAssets();
    initNavigationToggle();
    initNotificationButton();
    ensureWarrantyExpiryNotifications();
    initKeyboardShortcuts();

    const page = document.body.dataset.page;
    if (page === 'dashboard') {
        renderDashboard();
        setInterval(renderDashboard, 86400000);
    }
    if (page === 'assets') {
        initializeAssetPage();
    }
    if (page === 'employees') {
        initializeEmployeePage();
    }
    if (page === 'reports') {
        initializeReportsPage();
    }

    requestAnimationFrame(() => setTimeout(hideLoading, 140));
};

window.addEventListener('DOMContentLoaded', initApp);

/* Authentication helpers and login handlers */
const AUTH_KEY = 'assetflow_user';

const DEMO_USERS = [
    { name: 'Administrator', email: 'admin@assetflow.com', password: 'admin123', role: 'Admin' },
    { name: 'Employee User', email: 'employee@assetflow.com', password: 'employee123', role: 'Employee' },
];

const getSessionUser = () => {
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const setSessionUser = (user) => {
    try {
        const payload = JSON.stringify(user);
        localStorage.setItem(AUTH_KEY, payload);
    } catch (err) {
        console.error('setSessionUser error', err);
    }
};

const clearSessionUser = () => {
    localStorage.removeItem(AUTH_KEY);
};

const updateUIForUser = () => {
    const user = getSessionUser();
    if (!user) return;
    document.querySelectorAll('.sidebar-user').forEach((el) => {
        const nameEl = el.querySelector('div p');
        const roleEl = el.querySelector('div span');
        const avatarEl = el.querySelector('.sidebar-avatar');
        if (nameEl) nameEl.textContent = user.name || user.email.split('@')[0];
        if (roleEl) roleEl.textContent = user.role || '';
        if (avatarEl) avatarEl.textContent = (user.name || 'AF').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();
    });
    document.querySelectorAll('.profile-btn').forEach((btn) => {
        const nameSpan = btn.querySelector('div span');
        if (nameSpan) nameSpan.textContent = user.name || user.email.split('@')[0];
    });
};

const attachLogoutHandlers = () => {
    document.querySelectorAll('.sidebar-logout').forEach((btn) => {
        btn.addEventListener('click', () => {
            clearSessionUser();
            window.location.href = 'login.html';
        });
    });
};

const validateEmail = (value) => {
    if (!value) return 'Email is required.';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(value)) return 'Enter a valid email.';
    return '';
};

const validatePassword = (value) => {
    if (!value) return 'Password is required.';
    if (value.length < 6) return 'Minimum 6 characters.';
    return '';
};

const initLoginPage = () => {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const rememberInput = document.getElementById('rememberMe');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const loginError = document.getElementById('loginError');
    const togglePassword = document.getElementById('togglePassword');

    togglePassword?.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            togglePassword.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
        } else {
            passwordInput.type = 'password';
            togglePassword.innerHTML = '<i class="fa-solid fa-eye"></i>';
        }
    });

    const showLoginError = (msg) => {
        loginError.textContent = msg;
        loginError.classList.add('show');
        setTimeout(() => loginError.classList.remove('show'), 3000);
    };

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            emailError.textContent = '';
            passwordError.textContent = '';
            loginError.textContent = '';

            if (!emailInput || !passwordInput) {
                console.error('Login inputs not found in DOM.');
                return;
            }

            const email = (emailInput.value || '').trim();
            const password = passwordInput.value || '';
            const remember = Boolean(rememberInput.checked);
            console.debug('Attempting login', { email, remember });

        const emailErr = validateEmail(email);
        const passErr = validatePassword(password);
        if (emailErr) emailError.textContent = emailErr;
        if (passErr) passwordError.textContent = passErr;
        if (emailErr || passErr) return;

            showLoading();
            setTimeout(() => {
                hideLoading();
                const user = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
                if (!user) {
                    showLoginError('Invalid credentials — please try again.');
                    return;
                }
                const payload = { name: user.name, email: user.email, role: user.role };
                setSessionUser(payload);
                updateUIForUser();
                showToast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
                setTimeout(() => { window.location.href = 'index.html'; }, 700);
            }, 400);
        } catch (err) {
            console.error('Login handler error', err);
            showLoginError('An unexpected error occurred. Check console.');
        }
    });
};

/* Initialize auth UI and handlers on all pages */
window.addEventListener('DOMContentLoaded', () => {
    attachLogoutHandlers();
    updateUIForUser();
    initLoginPage();
});

// Expose a safe attach function for the login page to call immediately
window.attachLoginHandler = () => {
    try {
        initLoginPage();
    } catch (err) {
        console.error('attachLoginHandler error', err);
    }
};
