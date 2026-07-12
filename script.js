const STORAGE_KEYS = {
    assets: 'assetflow_assets',
    employees: 'assetflow_employees',
    activities: 'assetflow_activities',
    dashboardStats: 'assetflow_dashboard_stats',
};

const SAMPLE_ASSETS = [
    {
        id: 'AST-1201',
        name: 'Dell Latitude 5430',
        category: 'Laptop',
        serial: 'DL5430-2981',
        purchaseDate: '2023-09-12',
        location: 'Head Office - 4th Floor',
        condition: 'Excellent',
        status: 'Available',
        assignedTo: null,
    },
    {
        id: 'AST-1202',
        name: 'HP LaserJet Pro M428fdw',
        category: 'Printer',
        serial: 'HP-M428-5502',
        purchaseDate: '2024-02-18',
        location: 'Marketing Team',
        condition: 'Good',
        status: 'Assigned',
        assignedTo: 'EMP-1002',
    },
    {
        id: 'AST-1203',
        name: 'Apple iPad Air',
        category: 'Tablet',
        serial: 'IPAD-23-77A',
        purchaseDate: '2024-01-22',
        location: 'Sales Team',
        condition: 'Excellent',
        status: 'Available',
        assignedTo: null,
    },
    {
        id: 'AST-1204',
        name: 'Lenovo ThinkVision T27i',
        category: 'Monitor',
        serial: 'TNV-27T-994',
        purchaseDate: '2023-11-08',
        location: 'Admin Desk',
        condition: 'Good',
        status: 'In Repair',
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

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const showToast = (message, type = 'info') => {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
};

const showLoading = () => {
    document.getElementById('loadingOverlay')?.classList.remove('hidden');
};

const hideLoading = () => {
    document.getElementById('loadingOverlay')?.classList.add('hidden');
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
};

const seedAssignedAssets = () => {
    const assets = getStorage(STORAGE_KEYS.assets, []);
    const employees = getStorage(STORAGE_KEYS.employees, []);
    employees.forEach((employee) => {
        employee.assignedAssets = assets.filter((asset) => asset.assignedTo === employee.id).map((item) => item.id);
    });
    setStorage(STORAGE_KEYS.employees, employees);
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
    };

    setStorage(STORAGE_KEYS.dashboardStats, stats);
    updateDashboardStats(stats);

    renderActivityFeed(activities);
    updateNotificationCount(activities.length);
    attachDashboardEvents();
};

window.addEventListener('storage', ({ key }) => {
    if ([STORAGE_KEYS.assets, STORAGE_KEYS.employees, STORAGE_KEYS.activities].includes(key)) {
        renderDashboard();
    }
});

window.addEventListener('focus', renderDashboard);

const updateDashboardStats = ({ total, available, assigned, employees, categories, pending }) => {
    const statMap = {
        totalAssets: total,
        availableAssets: available,
        assignedAssets: assigned,
        employeesCount: employees,
        categoryCount: categories,
        activeAssignments: assigned,
        pendingReviews: pending,
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
        li.textContent = activity;
        activityList.appendChild(li);
    });
};

const updateNotificationCount = (count) => {
    const badge = document.querySelector('.top-actions .badge');
    if (!badge) return;
    badge.textContent = count;
};

const saveActivity = (message) => {
    const activities = getStorage(STORAGE_KEYS.activities, []);
    const nextActivities = [message, ...activities].slice(0, 12);
    setStorage(STORAGE_KEYS.activities, nextActivities);
    renderActivityFeed(nextActivities);
    updateNotificationCount(nextActivities.length);
};

const addActivity = (message) => {
    const activities = getStorage(STORAGE_KEYS.activities, []);
    activities.unshift(message);
    setStorage(STORAGE_KEYS.activities, activities.slice(0, 12));
    renderActivityFeed(activities);
    updateNotificationCount(activities.length);
};

const attachDashboardEvents = () => {
    const searchInput = document.getElementById('dashboardSearch');
    const notificationBtn = document.querySelector('.top-actions .icon-btn');

    if (searchInput && !searchInput.dataset.initialized) {
        searchInput.dataset.initialized = 'true';
        searchInput.addEventListener('input', handleDashboardSearch);
    }

    if (notificationBtn && !notificationBtn.dataset.initialized) {
        notificationBtn.dataset.initialized = 'true';
        notificationBtn.addEventListener('click', () => showNotifications(getStorage(STORAGE_KEYS.activities, [])));
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

const showNotifications = (activities) => {
    const notificationPanel = document.getElementById('notificationPanel');
    if (!notificationPanel) return;

    notificationPanel.innerHTML = `
        <div class="notification-header">
            <strong>Recent notifications</strong>
            <button class="icon-btn" aria-label="Close notifications"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <ul class="notification-list">
            ${activities.slice(0, 6).map((activity) => `<li>${activity}</li>`).join('')}
        </ul>
    `;
    notificationPanel.classList.toggle('visible');
    notificationPanel.querySelector('.icon-btn')?.addEventListener('click', () => notificationPanel.classList.remove('visible'));
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
            emptyRow.innerHTML = '<td colspan="6">No matching assets found.</td>';
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
                            <button class="secondary-btn" data-action="edit" data-id="${asset.id}">Edit</button>
                            <button class="secondary-btn" data-action="delete" data-id="${asset.id}">Delete</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        tableWrap.appendChild(table);

        filtered.forEach((asset) => {
            const card = document.createElement('article');
            card.className = 'asset-card';
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
                </div>
                <div class="action-buttons">
                    <button class="secondary-btn" data-action="view" data-id="${asset.id}">View</button>
                    <button class="secondary-btn" data-action="edit" data-id="${asset.id}">Edit</button>
                    <button class="secondary-btn" data-action="delete" data-id="${asset.id}">Delete</button>
                </div>
            `;
            cardsWrap.appendChild(card);
        });
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
        } else if (mode === 'edit') {
            modalTitle.textContent = 'Edit Asset';
            submitButton.textContent = 'Update Asset';
            populateAssetForm(asset);
            inputs.forEach((field) => field.removeAttribute('disabled'));
        } else if (mode === 'view') {
            modalTitle.textContent = 'Asset Details';
            submitButton.textContent = 'Close';
            populateAssetForm(asset);
            inputs.forEach((field) => field.setAttribute('disabled', 'disabled'));
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
            location: asset.location,
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
            location: formData.get('location').trim(),
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
            assets.unshift({ ...assetData, assignedTo: null });
            saveActivity(`Asset Added: ${assetData.name}`);
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
                };
                assets[index] = updatedAsset;

                if (existing.status === 'Assigned' && updatedAsset.status !== 'Assigned') {
                    removeAssetFromEmployees(existing.id);
                }

                saveActivity(`Asset Updated: ${assetData.name}`);
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
            emptyState.className = 'glass-card';
            emptyState.innerHTML = '<p>No employees found. Try adjusting search or filters.</p>';
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
        saveActivity(`Assigned ${asset.name} to ${employee.name}.`);
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
    let statusChart = null;
    let categoryChart = null;

    const populateReportFilters = () => {
        const categories = Array.from(new Set(getStorage(STORAGE_KEYS.assets, []).map((asset) => asset.category))).sort();
        reportCategoryFilter.innerHTML = '<option value="all">All Categories</option>' + categories.map((category) => `<option value="${category}">${category}</option>`).join('');
    };

    const getReportData = () => {
        const query = (reportSearch?.value || '').trim().toLowerCase();
        const category = reportCategoryFilter?.value || 'all';
        return getStorage(STORAGE_KEYS.assets, []).filter((asset) => {
            const matchesQuery = [asset.name, asset.id, asset.category, asset.location, asset.condition, asset.status]
                .some((value) => value.toLowerCase().includes(query));
            return matchesQuery && (category === 'all' || asset.category === category);
        });
    };

    const renderReportCards = () => {
        const assets = getReportData();
        document.getElementById('reportAssetTotal').textContent = assets.length;
        document.getElementById('reportAssetAvailable').textContent = assets.filter((asset) => asset.status === 'Available').length;
        document.getElementById('reportAssetAssigned').textContent = assets.filter((asset) => asset.status === 'Assigned').length;
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

        const pieCanvas = document.getElementById('statusPieChart');
        const barCanvas = document.getElementById('categoryBarChart');

        if (statusChart) statusChart.destroy();
        if (categoryChart) categoryChart.destroy();

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
                plugins: {
                    legend: { position: 'bottom' },
                },
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
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(148,163,184,0.16)' },
                    },
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

        const statusSummaryList = document.getElementById('statusSummaryList');
        const categorySummaryList = document.getElementById('categorySummaryList');

        statusSummaryList.innerHTML = Object.entries(statusCounts)
            .map(([status, count]) => `<li><span>${status}</span><strong>${count}</strong></li>`)
            .join('') || '<li><span>No status summary available</span></li>';

        categorySummaryList.innerHTML = Object.entries(categoryCounts)
            .map(([category, count]) => `<li><span>${category}</span><strong>${count}</strong></li>`)
            .join('') || '<li><span>No category summary available</span></li>';
    };

    const renderReports = () => {
        renderReportCards();
        renderReportCharts();
        renderReportSummaries();
    };

    populateReportFilters();
    renderReports();

    reportSearch?.addEventListener('input', renderReports);
    reportCategoryFilter?.addEventListener('change', renderReports);
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

const initApp = () => {
    initLocalStorage();
    seedAssignedAssets();
    initNavigationToggle();

    const page = document.body.dataset.page;
    if (page === 'dashboard') {
        renderDashboard();
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
};

window.addEventListener('DOMContentLoaded', initApp);
