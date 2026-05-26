window.API_BASE = window.API_BASE || 'http://localhost:8080';
window.API_DEPLOY = window.API_DEPLOY || 'http://localhost:8080';

document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '../home/login.html';
        return;
    }

    // Kết nối WebSocket nhận cảnh báo sự cố từ nhân viên
    connectAdminWebSocket();

    if (window.location.pathname.includes('donors.html')) initDonorPage();
    else if (window.location.pathname.includes('inventory.html')) initInventoryPage();
    else if (window.location.pathname.includes('logs.html')) initLogsPage();
    else initDashboard();
});

function initInventoryPage() {
    document.getElementById('filterBagBloodType')?.addEventListener('change', loadBloodBags);
    document.getElementById('filterBagRh')?.addEventListener('change', loadBloodBags);
    document.getElementById('filterBagProduct')?.addEventListener('change', loadBloodBags);
    document.getElementById('filterBagStatus')?.addEventListener('change', loadBloodBags);

    document.getElementById('searchBagId')?.addEventListener('input', () => {
        clearTimeout(window.searchBagTimeout);
        window.searchBagTimeout = setTimeout(loadBloodBags, 500);
    });

    document.getElementById('navBloodList')?.addEventListener('click', (e) => {
        e.preventDefault();
        switchInventoryView('blood');
    });
    document.getElementById('navEquipmentManager')?.addEventListener('click', (e) => {
        e.preventDefault();
        switchInventoryView('equipment');
    });

    loadBloodInventoryStats();
    loadBloodBags();
}

function switchInventoryView(view) {
    const bloodView = document.getElementById('bloodListView');
    const equipmentView = document.getElementById('equipmentManagerView');
    const navBloodList = document.getElementById('navBloodList');
    const navEquipmentManager = document.getElementById('navEquipmentManager');
    
    if (view === 'blood') {
        if (bloodView) bloodView.style.display = 'block';
        if (equipmentView) equipmentView.style.display = 'none';
        navBloodList?.classList.add('active');
        navEquipmentManager?.classList.remove('active');
    } else {
        if (bloodView) bloodView.style.display = 'none';
        if (equipmentView) equipmentView.style.display = 'block';
        navBloodList?.classList.remove('active');
        navEquipmentManager?.classList.add('active');
        loadEquipment();
        loadEquipmentStats();
    }
}

async function loadBloodBags() {
    const tbody = document.getElementById('inventoryTableBody'); // Cập nhật ID này vào thẻ <tbody> của bạn
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 1rem;">Đang tải dữ liệu...</td></tr>';

    // Lấy giá trị từ các ô input/select
    const bloodBagId = document.getElementById('searchBagId')?.value || '';
    const bloodType = document.getElementById('filterBagBloodType')?.value || '';
    const rhFactor = document.getElementById('filterBagRh')?.value || '';
    const productType = document.getElementById('filterBagProduct')?.value || '';
    const status = document.getElementById('filterBagStatus')?.value || '';

    // Build Query Params (Khớp với Postman của bạn)
    const params = new URLSearchParams();
    if (bloodBagId) params.append('bloodBagId', bloodBagId);
    if (bloodType) params.append('bloodType', bloodType);
    if (rhFactor) params.append('rhFactor', rhFactor); // Lưu ý: trên FE cứ gửi +, hàm encode URL tự đổi thành %2B cho BE
    if (productType) params.append('productType', productType);
    if (status) params.append('status', status);

    try {
        const res = await fetch(`${API_BASE}/api/staff/bloodbag/get-list-blood-bag?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });

        if (res.ok) {
            // BE trả về List trực tiếp nên ta gán luôn vào biến list
            const list = await res.json(); 
            
            if (!list || list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 1rem;">Không tìm thấy túi máu nào</td></tr>';
            } else {
                renderBloodBags(list);
            }
            
            // Nếu bạn có API đếm số lượng tổng (Tổng đơn vị, Sắp hết hạn...) thì gọi thêm ở đây để update 4 cái thẻ Card bên trên.
        } else {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: red;">Lỗi tải dữ liệu kho máu</td></tr>';
        }
    } catch (e) {
        console.error("Lỗi fetch kho máu:", e);
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: red;">Mất kết nối máy chủ</td></tr>';
    }
}

function renderBloodBags(list) {
    const tbody = document.getElementById('inventoryTableBody');
    tbody.innerHTML = list.map(item => {
        // Xử lý hiển thị nhóm máu (nếu BE trả về rỗng thì hiện --)
        const bloodDisplayName = (item.bloodType && item.rhFactor) 
            ? `${item.bloodType}${item.rhFactor}` 
            : '--';
            
        // Render từng dòng
        return `
            <tr>
                <td style="font-weight: 500;">#${item.bloodBagId}</td>
                <td style="text-align: center;">
                    <span class="badge bg-blue-light" style="padding: 2px 8px; border-radius: 4px; font-weight: bold; background: #e0f2fe; color: #0369a1;">
                        ${bloodDisplayName}
                    </span>
                </td>
                <td>${formatProductType(item.productType)}</td>
                <td>--</td>
                <td>--</td>
                <td>${item.collectedAt ? new Date(item.collectedAt).toLocaleDateString('vi-VN') : '--'}</td>
                <td>--</td>
                <td>${item.storageLocation || 'Chưa xếp kho'}</td>
                <td>${formatBagStatus(item.status)}</td>
                <td><button class="action-btn"><i class="ph ph-pencil"></i></button></td>
            </tr>
        `;
    }).join('');
}

function formatProductType(type) {
    if (!type) return '--';
    const map = {
        'MAU_TOAN_PHAN': 'Máu toàn phần',
        'TUI_HONG_CAU': 'Hồng cầu',
        'TUI_TIEU_CAU': 'Tiểu cầu',
        'HUYET_TUONG': 'Huyết tương'
    };
    return map[type] || type;
}

function formatBagStatus(status) {
    if (!status) return '--';
    const map = {
        'CHO_TACH_CHIET': '<span style="color: #d97706; font-weight: 500;">Chờ tách chiết</span>',
        'CHO_XET_NGHIEM': '<span style="color: #2563eb; font-weight: 500;">Chờ xét nghiệm</span>',
        'AVAILABLE': '<span style="color: #16a34a; font-weight: 500;">Lưu kho</span>',
        'QUARANTINE': '<span style="color: #dc2626; font-weight: 500;">Cách ly</span>',
        'DISCARDED': '<span style="color: #9ca3af; font-weight: 500;">Đã hủy</span>'
    };
    return map[status] || status;
}

async function loadBloodInventoryStats() {
    try {
        const res = await adminFetch('/api/admin/blood-inventory-stat');
        if (res.ok) {
            const data = await res.json();
            const stats = data.data || data;
            
            // 1. Tổng đơn vị máu
            if (document.getElementById('totalBloodBag')) 
                document.getElementById('totalBloodBag').innerText = stats.totalBloodBag || 0;
            
            // 2. Sắp hết hạn
            if (document.getElementById('expiringSoon')) 
                document.getElementById('expiringSoon').innerText = stats.expiringBloodBag || 0;
            
            // 3. Đã đặt trước (hoặc Chờ xét nghiệm)
            // LƯU Ý: BE trả về 'pendingTestBloodBag', bạn map biến này vào thẻ reservedBlood
            if (document.getElementById('reservedBlood')) 
                document.getElementById('reservedBlood').innerText = stats.pendingTestBloodBag || 0;
            
            // 4. Đã hủy/Hết hạn
            // SỬA Ở ĐÂY: BE trả về chữ 'expiredBloodBag' chứ không phải 'discarded'
            if (document.getElementById('discardedBlood')) 
                document.getElementById('discardedBlood').innerText = stats.expiredBloodBag || 0;
                
        } else {
            console.error('Lỗi load thống kê kho máu:', res.status);
        }
    } catch (e) {
        console.error('Lỗi kết nối API thống kê kho máu:', e);
    }
}
let currentDonorPage = 0;
let currentStaffPage = 0;

function initDonorPage() {
    const userNavHeader = document.getElementById('userNavHeader');
    const userNavContent = document.getElementById('userNavContent');
    if (userNavHeader && userNavContent) {
        userNavHeader.addEventListener('click', () => {
            userNavContent.classList.toggle('active');
            userNavHeader.classList.toggle('active');
        });
    }

    // Gán sự kiện click cho các tab
    document.getElementById('navDonorList')?.addEventListener('click', (e) => { e.preventDefault(); switchView('donor'); });
    document.getElementById('navStaffList')?.addEventListener('click', (e) => { e.preventDefault(); switchView('staff'); });
    document.getElementById('navHospitalList')?.addEventListener('click', (e) => { e.preventDefault(); switchView('hospital'); });

    // Gán sự kiện cho các bộ lọc của Donor
    document.getElementById('searchKeyword').addEventListener('input', () => {
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => {
            currentDonorPage = 0;
            loadDonors();
        }, 500);
    });

    document.getElementById('filterBloodType').addEventListener('change', () => {
        currentDonorPage = 0;
        loadDonors();
    });    
    
    document.getElementById('filterStatus').addEventListener('change', () => {
        currentDonorPage = 0;
        loadDonors();
    });

    // Gán sự kiện cho các bộ lọc của Staff
    document.getElementById('searchStaffKeyword')?.addEventListener('input', () => {
        clearTimeout(window.searchStaffTimeout);
        window.searchStaffTimeout = setTimeout(() => {
            currentStaffPage = 0;
            loadStaff();
        }, 500);
    });

    document.getElementById('filterStaffPosition')?.addEventListener('change', () => {
        currentStaffPage = 0;
        loadStaff();
    });    
    
    document.getElementById('filterStaffStatus')?.addEventListener('change', () => {
        currentStaffPage = 0;
        loadStaff();
    });

    // Mặc định load tab đầu tiên
    switchView('donor');
}

function switchView(target) {
    const views = { donor: 'donorListView', staff: 'staffListView', hospital: 'hospitalListView' };
    const navs = { donor: 'navDonorList', staff: 'navStaffList', hospital: 'navHospitalList' };
    
    Object.keys(views).forEach(k => {
        const v = document.getElementById(views[k]);
        if (v) v.style.display = (k === target) ? 'block' : 'none';
        document.getElementById(navs[k])?.classList.toggle('active', k === target);
    });

    if (target === 'donor') { loadDonors(); loadStats('/api/admin/donor-stat', ['statTotalDonor', 'statActiveDonor', 'statDonatedThisMonth']); }
    else if (target === 'staff') { loadStaff(); loadStats('/api/admin/staff-stat', ['statTotalStaff', 'statTechStaff', 'statInventoryStaff', 'statActiveStaff']); }
    else if (target === 'hospital') { loadHospitals(); }
}

async function adminFetch(endpoint, options = {}) {
    const token = localStorage.getItem('access_token');
    const defaultHeaders = { 'Authorization': `Bearer ${token}` };
    if (options.body) {
        defaultHeaders['Content-Type'] = 'application/json';
    }
    return fetch(`${window.API_BASE}${endpoint}`, {
        ...options,
        headers: { ...defaultHeaders, ...(options.headers || {}) }
    });
}

function getListFromData(result) {
    if (Array.isArray(result)) return result;
    if (result.data) {
        if (Array.isArray(result.data)) return result.data;
        if (result.data.content && Array.isArray(result.data.content)) return result.data.content;
    }
    if (result.content && Array.isArray(result.content)) return result.content;
    return [];
}

// Thêm biến global để theo dõi trang hiện tại

async function loadDonors() {
    const tbody = document.getElementById('donorTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 1rem;">Đang tải...</td></tr>';

    // --- LOGIC TÌM KIẾM VÀ LỌC ---
    const keyword = document.getElementById('searchKeyword')?.value || '';
    const bloodFull = document.getElementById('filterBloodType')?.value || ''; // Ví dụ: "A+"
    const status = document.getElementById('filterStatus')?.value || '';

    let bloodType = '';
    let rhFactor = '';
    if (bloodFull) {
        bloodType = bloodFull.replace(/[+-]/g, '');
        rhFactor = bloodFull.includes('+') ? '+' : '-';
    }

    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (bloodType) params.append('bloodType', bloodType);
    if (rhFactor) params.append('rhFactor', rhFactor);
    if (status) params.append('status', status);
    
    // THÊM: Đính kèm số trang vào API
    params.append('page', currentDonorPage);
    params.append('size', 10);

    try {
        const res = await adminFetch(`/api/staff/donor/get-list-donor?${params.toString()}`);
        if (res.ok) {
            // Tách riêng rawData để lấy thông tin phân trang (totalPages), và list để render
            const rawData = await res.json(); 
            const list = getListFromData(rawData); 
            
            if (list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 1rem;">Không có dữ liệu</td></tr>';
            } else {
                tbody.innerHTML = list.map(item => {
                    const bloodDisplay = (item.bloodType) ? `${item.bloodType}${item.rhFactor || ''}` : '--';
                    let statusBadge = '';
                    if (item.userStatus === 'ACTIVE') {
                        statusBadge = '<span class="badge bg-success-light">ACTIVE</span>';
                    } else if (item.userStatus === 'INACTIVE') {
                        statusBadge = '<span class="badge bg-danger-light">INACTIVE</span>';
                    } else if (item.userStatus === 'KHACH_VANG_LAI') {
                        statusBadge = '<span class="badge" style="background-color: #e0f2fe; color: #0369a1;">KHACH_VANG_LAI</span>';
                    } else {
                        statusBadge = `<span class="badge" style="background-color: #f3f4f6; color: #374151;">${item.userStatus || '--'}</span>`;
                    }
                    return `
                    <tr>
                        <td>
                            <div style="font-weight: 500;">${item.fullName}</div>
                            <div style="font-size: 0.75rem; color: #6b7280;">ID: #${item.donorId || ''}</div>
                        </td>
                        <td>${item.email || '--'}</td>
                        <td>${item.phone || '--'}</td>
                        <td><span class="badge bg-blue-light">${bloodDisplay}</span></td>
                        <td>${item.totalDonations || 0}</td>
                        <td>${item.lastDonationDate ? new Date(item.lastDonationDate).toLocaleDateString('vi-VN') : '--'}</td>
                        <td>${statusBadge}</td>
                        <td><button class="action-btn" onclick="openDonorDetailModal('${item.donorId}')"><i class="ph ph-pencil"></i></button></td>
                    </tr>
                `;}).join('');
            }

            // THÊM: Đọc số liệu tổng để cập nhật Thống kê và vẽ Nút phân trang
            // Tuỳ vào response BE của bạn bọc data thế nào, thường là rawData.data.totalPages hoặc rawData.totalPages
            const totalPages = rawData.data?.totalPages ?? rawData.totalPages;
            const totalElements = rawData.data?.totalElements ?? rawData.totalElements;

            // Update số tổng lên giao diện
            if (totalElements !== undefined && document.getElementById('statTotalDonor')) {
                document.getElementById('statTotalDonor').innerText = totalElements;
            }

            // Vẽ nút
            if (totalPages !== undefined) {
                renderPagination(totalPages, currentDonorPage);
            }
        }
    } catch (e) { 
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: red;">Lỗi tải dữ liệu</td></tr>';
    }
}

function renderPagination(totalPages, currentPage) {
    const container = document.getElementById('paginationControls'); // Đảm bảo HTML có thẻ div id này nhé
    if (!container) return;
    container.innerHTML = '';
    if (totalPages <= 1) return; // 1 trang thì khỏi vẽ nút

    const btnStyle = "padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer; transition: 0.2s;";
    const activeStyle = "background: var(--primary-color, #3b82f6); color: white; border-color: var(--primary-color, #3b82f6);";
    const disabledStyle = "background: #f3f4f6; color: #9ca3af; cursor: not-allowed;";

    // Nút Prev
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="ph ph-caret-left"></i>';
    prevBtn.style.cssText = btnStyle + (currentPage === 0 ? disabledStyle : "");
    prevBtn.disabled = currentPage === 0;
    prevBtn.onclick = () => { currentDonorPage--; loadDonors(); };
    container.appendChild(prevBtn);

    // Các nút Số
    for (let i = 0; i < totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.innerText = i + 1;
        pageBtn.style.cssText = btnStyle + (i === currentPage ? activeStyle : "");
        pageBtn.onclick = () => { currentDonorPage = i; loadDonors(); };
        container.appendChild(pageBtn);
    }

    // Nút Next
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="ph ph-caret-right"></i>';
    nextBtn.style.cssText = btnStyle + (currentPage === totalPages - 1 ? disabledStyle : "");
    nextBtn.disabled = currentPage === totalPages - 1;
    nextBtn.onclick = () => { currentDonorPage++; loadDonors(); };
    container.appendChild(nextBtn);
}

function renderStaffPagination(totalPages, currentPage) {
    const container = document.getElementById('staffPaginationControls');
    if (!container) return;
    container.innerHTML = '';
    if (totalPages <= 1) return;

    const btnStyle = "padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer; transition: 0.2s;";
    const activeStyle = "background: var(--primary-color, #3b82f6); color: white; border-color: var(--primary-color, #3b82f6);";
    const disabledStyle = "background: #f3f4f6; color: #9ca3af; cursor: not-allowed;";

    // Nút Prev
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="ph ph-caret-left"></i>';
    prevBtn.style.cssText = btnStyle + (currentPage === 0 ? disabledStyle : "");
    prevBtn.disabled = currentPage === 0;
    prevBtn.onclick = () => { currentStaffPage--; loadStaff(); };
    container.appendChild(prevBtn);

    // Các nút Số
    for (let i = 0; i < totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.innerText = i + 1;
        pageBtn.style.cssText = btnStyle + (i === currentPage ? activeStyle : "");
        pageBtn.onclick = () => { currentStaffPage = i; loadStaff(); };
        container.appendChild(pageBtn);
    }

    // Nút Next
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="ph ph-caret-right"></i>';
    nextBtn.style.cssText = btnStyle + (currentPage === totalPages - 1 ? disabledStyle : "");
    nextBtn.disabled = currentPage === totalPages - 1;
    nextBtn.onclick = () => { currentStaffPage++; loadStaff(); };
    container.appendChild(nextBtn);
}

async function loadStaff() {
    const tbody = document.getElementById('staffTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 1rem;">Đang tải...</td></tr>';
    
    const keyword = document.getElementById('searchStaffKeyword')?.value || '';
    const position = document.getElementById('filterStaffPosition')?.value || '';
    const status = document.getElementById('filterStaffStatus')?.value || '';

    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (position) params.append('position', position);
    if (status) params.append('status', status);
    
    params.append('page', currentStaffPage);
    params.append('size', 10);

    try {
        const res = await adminFetch(`/api/admin/staff/get-list-staff?${params.toString()}`);
        if (res.ok) {
            const rawData = await res.json();
            const list = getListFromData(rawData);
            
            if (!list || list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 1rem; color: var(--text-secondary);">Không có nhân viên nào</td></tr>';
                const paginationContainer = document.getElementById('staffPaginationControls');
                if (paginationContainer) paginationContainer.innerHTML = '';
                return;
            }
            tbody.innerHTML = list.map(item => {
                const positionMap = {
                    'BAC_SI': 'Bác sĩ',
                    'Y_TA': 'Y tá',
                    'KY_THUAT': 'Kỹ thuật viên',
                    'QUAN_LY_KHO': 'Quản lý kho',
                    'ADMIN': 'Admin'
                };
                const id = item.staffId || item.id;
                const positionLabel = positionMap[item.position] || item.position || '--';
                
                let statusBadge = '';
                if (item.status === 'ACTIVE') {
                    statusBadge = '<span class="badge bg-success-light">Hoạt động</span>';
                } else if (item.status === 'INACTIVE') {
                    statusBadge = '<span class="badge bg-danger-light">Tạm khóa</span>';
                } else {
                    statusBadge = `<span class="badge bg-secondary-light">${item.status || '--'}</span>`;
                }

                return `
                <tr>
                    <td>NV${String(id || '').padStart(3, '0')}</td>
                    <td>
                        <div style="font-weight: 500;">${item.fullName || item.name || '--'}</div>
                    </td>
                    <td>${positionLabel}</td>
                    <td>${statusBadge}</td>
                    <td><button class="action-btn" onclick="openStaffDetailModal('${id}')"><i class="ph ph-pencil"></i></button></td>
                </tr>
            `;}).join('');

            const totalPages = rawData.data?.totalPages ?? rawData.totalPages;
            const totalElements = rawData.data?.totalElements ?? rawData.totalElements;

            if (totalElements !== undefined && document.getElementById('statTotalStaff')) {
                document.getElementById('statTotalStaff').innerText = totalElements;
            }

            if (totalPages !== undefined) {
                renderStaffPagination(totalPages, currentStaffPage);
            }
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red; padding: 1rem;">Lỗi tải dữ liệu (${res.status})</td></tr>`;
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red; padding: 1rem;">Mất kết nối máy chủ</td></tr>';
    }
}

// Removed duplicate loadHospitals function

async function loadStats(url, elementIds) {
    try {
        const res = await adminFetch(url);
        if (res.ok) {
            const result = await res.json();
            const d = result.data || result;
            const keys = Object.keys(d);
            elementIds.forEach((id, idx) => {
                const el = document.getElementById(id);
                if (el) el.innerText = d[keys[idx]] || 0;
            });
        }
    } catch (e) { console.error(e); }
}

async function initDashboard() {
    try {
        const r1 = await adminFetch('/api/admin/general-stat');
        if (r1.ok) {
            // SỬA Ở ĐÂY: Bỏ .data đi vì API trả về object trực tiếp
            const s = await r1.json() || {}; 
            
            if(document.getElementById('totalBloodBags')) document.getElementById('totalBloodBags').innerText = s.totalBloodBag || 0;
            if(document.getElementById('upcomingEvents')) document.getElementById('upcomingEvents').innerText = s.totalEvent || 0;
            if(document.getElementById('pendingRequests')) document.getElementById('pendingRequests').innerText = s.totalRequest || 0;
            if(document.getElementById('expiringSoon')) document.getElementById('expiringSoon').innerText = s.totalExpiringBloodBag || 0;
        } else {
            console.error("Lỗi khi lấy thống kê, status:", r1.status);
        }

        await loadBloodChart();
        await loadEventChart();

    } catch (error) {
        console.error("Lỗi kết nối API Dashboard:", error);
    }
}

// Khai báo biến toàn cục để lưu instance của biểu đồ (giúp tránh lỗi "Canvas is already in use")
let bloodChartInstance = null;
let eventChartInstance = null;

// Hàm vẽ biểu đồ Kho máu (Dạng tròn - Doughnut)
// Hàm vẽ biểu đồ Kho máu
// Hàm vẽ biểu đồ Kho máu (Theo id="inventoryChart")
async function loadBloodChart() {
    try {
        const res = await adminFetch('/api/admin/blood-stat');
        if (res.ok) {
            const rawData = await res.json(); 
            const bloodData = getListFromData(rawData);

            if (!Array.isArray(bloodData) || bloodData.length === 0) return;

            const labels = bloodData.map(item => (item.bloodType || '') + (item.rhFactor || '')); 
            const dataValues = bloodData.map(item => item.total || 0);

            // SỬA Ở ĐÂY: Đổi tên id khớp với HTML
            const ctx = document.getElementById('inventoryChart');
            if (!ctx) return; 

            if (bloodChartInstance) bloodChartInstance.destroy();
            bloodChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Số lượng (túi)',
                        data: dataValues,
                        backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
            });
        }
    } catch (error) { console.error("Lỗi khi tải dữ liệu sơ đồ máu:", error); }
}

// Hàm vẽ biểu đồ Hiệu quả chiến dịch (Theo id="campaignChart")
// Bạn nhớ phải có dòng khai báo này ở đầu file hoặc bên ngoài hàm nhé:

async function loadEventChart() {
    try {
        const res = await adminFetch('/api/admin/event-stat');
        if (res.ok) {
            const rawData = await res.json();
            
            // SỬA CHÍNH Ở ĐÂY: Lấy thẳng mảng từ thuộc tính 'events' của API
            const eventData = rawData.events || [];

            // Đề phòng dữ liệu rỗng
            if (!Array.isArray(eventData) || eventData.length === 0) return;

            const labels = eventData.map(item => item.eventName || 'Sự kiện');
            const registeredData = eventData.map(item => item.registeredCount || 0);
            const actualData = eventData.map(item => item.actualCount || 0);

            const ctx = document.getElementById('campaignChart');
            if (!ctx) return; 

            if (eventChartInstance) eventChartInstance.destroy();
            eventChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Đăng ký Online', data: registeredData, backgroundColor: '#93c5fd', borderRadius: 4 },
                        { label: 'Thực tế tham gia', data: actualData, backgroundColor: '#3b82f6', borderRadius: 4 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
        }
    } catch (error) { 
        console.error("Lỗi khi tải dữ liệu sự kiện:", error); 
    }
}

// --- DONOR DETAIL MODAL LOGIC ---
let currentDetailDonorId = null;

window.openDonorDetailModal = function(donorId) {
    currentDetailDonorId = donorId;
    currentDonorHistoryPage = 0;
    const modal = document.getElementById('donorDetailModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Default to info tab
    switchDonorTab('info');
};

window.closeDonorDetailModal = function() {
    const modal = document.getElementById('donorDetailModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

window.switchDonorTab = function(tab) {
    const infoBtn = document.getElementById('tabInfoBtn');
    const historyBtn = document.getElementById('tabHistoryBtn');
    const infoContent = document.getElementById('tabInfoContent');
    const historyContent = document.getElementById('tabHistoryContent');
    
    if (tab === 'info') {
        infoBtn.classList.add('active');
        infoBtn.style.borderBottomColor = 'var(--primary-color)';
        infoBtn.style.color = 'var(--primary-color)';
        
        historyBtn.classList.remove('active');
        historyBtn.style.borderBottomColor = 'transparent';
        historyBtn.style.color = 'var(--text-secondary)';
        
        infoContent.style.display = 'block';
        historyContent.style.display = 'none';
        
        loadDonorDetailInfo(currentDetailDonorId);
    } else {
        historyBtn.classList.add('active');
        historyBtn.style.borderBottomColor = 'var(--primary-color)';
        historyBtn.style.color = 'var(--primary-color)';
        
        infoBtn.classList.remove('active');
        infoBtn.style.borderBottomColor = 'transparent';
        infoBtn.style.color = 'var(--text-secondary)';
        
        historyContent.style.display = 'block';
        infoContent.style.display = 'none';
        
        loadDonorDetailHistory(currentDetailDonorId);
    }
};

async function loadDonorDetailInfo(donorId) {
    const container = document.getElementById('donorDetailInfoContent');
    if (!container) return;
    container.innerHTML = '<div style="text-align: center; padding: 2rem;">Đang tải thông tin...</div>';
    
    try {
        const res = await adminFetch(`/api/staff/donor/donor-detail/${donorId}`);
        if (res.ok) {
            const result = await res.json();
            const data = result.data || result;
            
            container.innerHTML = `
                <form id="donorUpdateForm" onsubmit="handleDonorUpdate(event, ${donorId})">
                <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Họ và tên</p>
                        <input type="text" id="updateDonorName" class="form-control" value="${data.fullName || ''}" required>
                    </div>
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">CCCD/CMND</p>
                        <input type="text" id="updateDonorCCCD" class="form-control" value="${data.cccd || ''}">
                    </div>
                </div>
                <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Ngày sinh</p>
                        <input type="date" id="updateDonorDob" class="form-control" value="${data.dob ? data.dob.split('T')[0] : ''}">
                    </div>
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Giới tính</p>
                        <select id="updateDonorGender" class="form-control">
                            <option value="Nam" ${data.gender === 'Nam' ? 'selected' : ''}>Nam</option>
                            <option value="Nữ" ${data.gender === 'Nữ' ? 'selected' : ''}>Nữ</option>
                        </select>
                    </div>
                </div>
                <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Email</p>
                        <input type="email" id="updateDonorEmail" class="form-control" value="${data.email || ''}" required>
                    </div>
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Số điện thoại</p>
                        <input type="text" id="updateDonorPhone" class="form-control" value="${data.phone || ''}">
                    </div>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Địa chỉ</p>
                    <input type="text" id="updateDonorAddress" class="form-control" value="${data.address || ''}">
                </div>
                <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Nhóm máu</p>
                        <p style="font-weight: 500;"><span class="badge bg-blue-light" style="padding: 6px 12px; font-size: 1rem;">${(data.bloodType || '') + (data.rhFactor || '') || '--'}</span></p>
                    </div>
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Trạng thái</p>
                        <p style="font-weight: 500;">
                            <span class="badge ${
                                (data.displayStatus === 'Đủ điều kiện') ? 'bg-success-light' : 
                                (data.displayStatus === 'Tạm khóa') ? 'bg-warning-light' : 'bg-danger-light'
                            }" style="padding: 6px 12px; font-size: 1rem;">
                                ${data.displayStatus || 'Không đủ điều kiện'}
                            </span>
                        </p>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end;">
                    <button type="submit" class="btn btn-primary" id="btnUpdateDonor">Lưu cập nhật</button>
                </div>
                </form>
            `;
        } else {
            container.innerHTML = '<div style="text-align: center; color: red; padding: 2rem;">Lỗi tải thông tin chi tiết</div>';
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div style="text-align: center; color: red; padding: 2rem;">Mất kết nối máy chủ</div>';
    }
}

let currentDonorHistoryPage = 0;

async function loadDonorDetailHistory(donorId) {
    const tbody = document.getElementById('donorDetailHistoryContent');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 1rem;">Đang tải...</td></tr>';
    
    try {
        const res = await adminFetch(`/api/staff/donor/history-donate/${donorId}?page=${currentDonorHistoryPage}&size=10`);
        if (res.ok) {
            const rawData = await res.json();
            const list = rawData.content || (rawData.data && rawData.data.content) || rawData.data || rawData || [];
            
            if (!list || list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 1rem;">Chưa có lịch sử hiến máu</td></tr>';
                const paginationEl = document.getElementById('donorHistoryPagination');
                if (paginationEl) paginationEl.innerHTML = '';
                return;
            }
            
            tbody.innerHTML = list.map(item => `
                <tr>
                    <td style="font-weight: 500;">${item.eventName || '--'}</td>
                    <td>${item.donationDate ? new Date(item.donationDate).toLocaleDateString('vi-VN') : '--'}</td>
                    <td>${item.volumeMl || item.bloodAmount || item.amount ? (item.volumeMl || item.bloodAmount || item.amount) + ' ml' : '--'}</td>
                    <td><span class="badge bg-success-light">${item.status || 'Thành công'}</span></td>
                </tr>
            `).join('');
            
            const totalPages = rawData.page?.totalPages || rawData.data?.totalPages || rawData.totalPages;
            if (totalPages !== undefined) {
                renderModalPagination(totalPages, currentDonorHistoryPage, 'donorHistoryPagination', (newPage) => {
                    currentDonorHistoryPage = newPage;
                    loadDonorDetailHistory(donorId);
                });
            }
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Lỗi tải dữ liệu lịch sử</td></tr>';
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Mất kết nối máy chủ</td></tr>';
    }
}

// --- STAFF DETAIL MODAL LOGIC ---
let currentDetailStaffId = null;

window.openStaffDetailModal = function(staffId) {
    currentDetailStaffId = staffId;
    currentStaffHistoryPage = 0;
    const modal = document.getElementById('staffDetailModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    switchStaffTab('info');
};

window.closeStaffDetailModal = function() {
    const modal = document.getElementById('staffDetailModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

window.switchStaffTab = function(tab) {
    const infoBtn = document.getElementById('staffTabInfoBtn');
    const historyBtn = document.getElementById('staffTabHistoryBtn');
    const infoContent = document.getElementById('staffTabInfoContent');
    const historyContent = document.getElementById('staffTabHistoryContent');
    
    if (tab === 'info') {
        infoBtn.classList.add('active');
        infoBtn.style.borderBottomColor = 'var(--primary-color)';
        infoBtn.style.color = 'var(--primary-color)';
        
        historyBtn.classList.remove('active');
        historyBtn.style.borderBottomColor = 'transparent';
        historyBtn.style.color = 'var(--text-secondary)';
        
        infoContent.style.display = 'block';
        historyContent.style.display = 'none';
        
        loadStaffDetailInfo(currentDetailStaffId);
    } else {
        historyBtn.classList.add('active');
        historyBtn.style.borderBottomColor = 'var(--primary-color)';
        historyBtn.style.color = 'var(--primary-color)';
        
        infoBtn.classList.remove('active');
        infoBtn.style.borderBottomColor = 'transparent';
        infoBtn.style.color = 'var(--text-secondary)';
        
        historyContent.style.display = 'block';
        infoContent.style.display = 'none';
        
        loadStaffDetailHistory(currentDetailStaffId);
    }
};

async function loadStaffDetailInfo(staffId) {
    const container = document.getElementById('staffDetailInfoContent');
    if (!container) return;
    container.innerHTML = '<div style="text-align: center; padding: 2rem;">Đang tải thông tin...</div>';
    
    try {
        const res = await adminFetch(`/api/admin/staff/get-staff-detail/${staffId}`);
        if (res.ok) {
            const result = await res.json();
            const data = result.data || result;
            
            container.innerHTML = `
                <form id="staffUpdateForm" onsubmit="handleStaffUpdate(event, ${staffId})">
                <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Họ và tên</p>
                        <input type="text" id="updateStaffName" class="form-control" value="${data.fullName || data.name || ''}" required>
                    </div>
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Email</p>
                        <input type="email" id="updateStaffEmail" class="form-control" value="${data.email || ''}" required>
                    </div>
                </div>
                <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Ngày sinh</p>
                        <input type="date" id="updateStaffDob" class="form-control" value="${data.dob ? data.dob.split('T')[0] : ''}">
                    </div>
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Giới tính</p>
                        <select id="updateStaffGender" class="form-control">
                            <option value="Nam" ${data.gender === 'Nam' ? 'selected' : ''}>Nam</option>
                            <option value="Nữ" ${data.gender === 'Nữ' ? 'selected' : ''}>Nữ</option>
                        </select>
                    </div>
                </div>
                <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">CCCD/CMND</p>
                        <input type="text" id="updateStaffCCCD" class="form-control" value="${data.cccd || ''}">
                    </div>
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Số điện thoại</p>
                        <input type="text" id="updateStaffPhone" class="form-control" value="${data.phone || ''}">
                    </div>
                </div>
                <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Vai trò / Vị trí</p>
                        <select id="updateStaffPosition" class="form-control">
                            <option value="QUAN_LY_KHO" ${(data.position||data.role) === 'QUAN_LY_KHO' ? 'selected' : ''}>Quản lý kho</option>
                            <option value="KY_THUAT" ${(data.position||data.role) === 'KY_THUAT' ? 'selected' : ''}>Kỹ thuật viên</option>
                            <option value="Y_TA" ${(data.position||data.role) === 'Y_TA' ? 'selected' : ''}>Y tá</option>
                            <option value="BAC_SI" ${(data.position||data.role) === 'BAC_SI' ? 'selected' : ''}>Bác sĩ</option>
                            <option value="ADMIN" ${(data.position||data.role) === 'ADMIN' ? 'selected' : ''}>Admin</option>
                        </select>
                    </div>
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Trạng thái</p>
                        <select id="updateStaffStatus" class="form-control">
                            <option value="ACTIVE" ${data.status === 'ACTIVE' ? 'selected' : ''}>Đang hoạt động</option>
                            <option value="INACTIVE" ${data.status !== 'ACTIVE' ? 'selected' : ''}>Ngừng HĐ</option>
                        </select>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end;">
                    <button type="submit" class="btn btn-primary" id="btnUpdateStaff">Lưu cập nhật</button>
                </div>
                </form>
            `;
        } else {
            container.innerHTML = '<div style="text-align: center; color: red; padding: 2rem;">Lỗi tải thông tin chi tiết</div>';
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div style="text-align: center; color: red; padding: 2rem;">Mất kết nối máy chủ</div>';
    }
}

let currentStaffHistoryPage = 0;

async function loadStaffDetailHistory(staffId) {
    const tbody = document.getElementById('staffDetailHistoryContent');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 1rem;">Đang tải...</td></tr>';
    
    try {
        const res = await adminFetch(`/api/admin/staff/get-history-assignment/${staffId}?page=${currentStaffHistoryPage}&size=10`);
        if (res.ok) {
            const rawData = await res.json();
            const list = rawData.content || (rawData.data && rawData.data.content) || rawData.data || rawData || [];
            
            if (!list || list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 1rem;">Chưa có lịch sử phân công</td></tr>';
                const paginationEl = document.getElementById('staffHistoryPagination');
                if (paginationEl) paginationEl.innerHTML = '';
                return;
            }
            
            tbody.innerHTML = list.map(item => `
                <tr>
                    <td style="font-weight: 500;">${item.eventName || '--'}</td>
                    <td><span class="badge bg-blue-light">${item.role || item.position || '--'}</span></td>
                    <td>${item.startDate || item.assignmentDate || item.date ? new Date(item.startDate || item.assignmentDate || item.date).toLocaleDateString('vi-VN') : '--'}</td>
                </tr>
            `).join('');
            
            const totalPages = rawData.page?.totalPages || rawData.data?.totalPages || rawData.totalPages;
            if (totalPages !== undefined) {
                renderModalPagination(totalPages, currentStaffHistoryPage, 'staffHistoryPagination', (newPage) => {
                    currentStaffHistoryPage = newPage;
                    loadStaffDetailHistory(staffId);
                });
            }
        } else {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: red;">Lỗi tải dữ liệu lịch sử</td></tr>';
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: red;">Mất kết nối máy chủ</td></tr>';
    }
}

function renderModalPagination(totalPages, currentPage, containerId, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    if (totalPages <= 1) return;

    const btnStyle = "padding: 0.25rem 0.5rem; border: 1px solid #d1d5db; border-radius: 0.25rem; background: white; cursor: pointer; transition: 0.2s; font-size: 0.875rem;";
    const activeStyle = "background: var(--primary-color, #3b82f6); color: white; border-color: var(--primary-color, #3b82f6);";
    const disabledStyle = "background: #f3f4f6; color: #9ca3af; cursor: not-allowed;";

    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="ph ph-caret-left"></i>';
    prevBtn.style.cssText = btnStyle + (currentPage === 0 ? disabledStyle : "");
    prevBtn.disabled = currentPage === 0;
    prevBtn.onclick = () => callback(currentPage - 1);
    container.appendChild(prevBtn);

    for (let i = 0; i < totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.innerText = i + 1;
        pageBtn.style.cssText = btnStyle + (i === currentPage ? activeStyle : "");
        pageBtn.onclick = () => callback(i);
        container.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="ph ph-caret-right"></i>';
    nextBtn.style.cssText = btnStyle + (currentPage === totalPages - 1 ? disabledStyle : "");
    nextBtn.disabled = currentPage === totalPages - 1;
    nextBtn.onclick = () => callback(currentPage + 1);
    container.appendChild(nextBtn);
}

// --- HOSPITAL MANAGEMENT ---

let currentHospitalPage = 0;

function initHospitalPage() {
    // 1. Gắn sự kiện (nhớ dấu ? để tránh lỗi nếu không tìm thấy thẻ)
    document.getElementById('searchHospitalKeyword')?.addEventListener('input', () => {
        clearTimeout(window.searchHospitalTimeout);
        window.searchHospitalTimeout = setTimeout(() => {
            currentHospitalPage = 0;
            loadHospitals();
        }, 500);
    });

    document.getElementById('filterHospitalStatus')?.addEventListener('change', () => {
        currentHospitalPage = 0;
        loadHospitals();
    });

    // 2. Tải dữ liệu ban đầu
    loadHospitals();
    loadHospitalStats();
}

async function loadHospitals() {
    const tbody = document.getElementById('hospitalTableBody');
    if (!tbody) return;
    
    // Giao diện bảng 4 cột nên colspan=4
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 1rem;">Đang tải...</td></tr>';

    const keyword = document.getElementById('searchHospitalKeyword')?.value || '';
    const status = document.getElementById('filterHospitalStatus')?.value || '';

    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (status) params.append('status', status);
    params.append('page', currentHospitalPage);
    params.append('size', 10);

    try {
        const res = await adminFetch(`/api/admin/hospital/get-list-hospital?${params.toString()}`);
        if (res.ok) {
            const rawData = await res.json();
            const list = rawData.content || (rawData.data && rawData.data.content) || [];
            
            if (list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 1rem;">Không có dữ liệu</td></tr>';
            } else {
                tbody.innerHTML = list.map((item, index) => {
                    // Quét các tên biến ID phổ biến mà Spring Boot thường trả về
                    const realId = item.id || item.hospitalId || item.userId || '';
                    
                    const displayId = realId ? `BV${String(realId).padStart(3, '0')}` : `BV${String(index + 1).padStart(3, '0')}`;
                    const statusText = item.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng HĐ';
                    const statusClass = item.status === 'ACTIVE' ? 'bg-success-light' : 'bg-danger-light';

                    // Thêm dòng log này ra F12 để kiểm tra nếu nút vẫn chưa bấm được
                    if (!realId) console.warn("Dữ liệu Bệnh viện bị thiếu ID:", item);

                    return `
                        <tr>
                            <td style="font-weight: 500;">${displayId}</td>
                            <td>
                                <div style="font-weight: 600;">${item.hospitalName || '--'}</div>
                                <div style="font-size: 0.75rem; color: #6b7280;">
                                    <i class="ph ph-map-pin"></i> ${item.address || '--'}
                                </div>
                                <div style="font-size: 0.75rem; color: #6b7280; margin-top: 2px;">
                                    <i class="ph ph-envelope-simple"></i> ${item.email || '--'} | <i class="ph ph-phone"></i> ${item.hotline || '--'}
                                </div>
                            </td>
                            <td><span class="badge ${statusClass}">${statusText}</span></td>
                            <td>
                                <button class="action-btn" onclick="if('${realId}') openHospitalDetailModal('${realId}'); else alert('Lỗi: Backend không trả về ID cho dòng này!');" title="Chỉnh sửa">
                                    <i class="ph ph-pencil-simple"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }

            const totalPages = rawData.totalPages ?? rawData.data?.totalPages;
            if (totalPages !== undefined) {
                renderHospitalPagination(totalPages, currentHospitalPage);
            }
            loadHospitalStats();
        }
    } catch (e) { 
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Lỗi tải dữ liệu</td></tr>';
    }
}

async function loadHospitalStats() {
    try {
        const res = await adminFetch('/api/admin/hospital-stat');
        if (res.ok) {
            const rawData = await res.json();
            const stats = rawData.data || rawData;

            if (document.getElementById('statTotalHospital')) 
                document.getElementById('statTotalHospital').innerText = stats.totalHospital || 0;
            if (document.getElementById('statActiveHospital')) 
                document.getElementById('statActiveHospital').innerText = stats.activeHospital || 0;
            if (document.getElementById('statTotalRequest')) 
                document.getElementById('statTotalRequest').innerText = stats.totalRequest || 0;
            if (document.getElementById('statApprovedRequest')) 
                document.getElementById('statApprovedRequest').innerText = stats.approvedRequest || 0;
        }
    } catch (e) {
        console.error(e);
    }
}

function renderHospitalPagination(totalPages, currentPage) {
    const container = document.getElementById('hospitalPaginationControls');
    if (!container) return;
    container.innerHTML = '';
    if (totalPages <= 1) return;

    const btnStyle = "padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer; transition: 0.2s;";
    const activeStyle = "background: #3b82f6; color: white; border-color: #3b82f6;";
    const disabledStyle = "background: #f3f4f6; color: #9ca3af; cursor: not-allowed;";

    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="ph ph-caret-left"></i>';
    prevBtn.style.cssText = btnStyle + (currentPage === 0 ? disabledStyle : "");
    prevBtn.disabled = currentPage === 0;
    prevBtn.onclick = () => { currentHospitalPage--; loadHospitals(); };
    container.appendChild(prevBtn);

    for (let i = 0; i < totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.innerText = i + 1;
        pageBtn.style.cssText = btnStyle + (i === currentPage ? activeStyle : "");
        pageBtn.onclick = () => { currentHospitalPage = i; loadHospitals(); };
        container.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="ph ph-caret-right"></i>';
    nextBtn.style.cssText = btnStyle + (currentPage === totalPages - 1 ? disabledStyle : "");
    nextBtn.disabled = currentPage === totalPages - 1;
    nextBtn.onclick = () => { currentHospitalPage++; loadHospitals(); };
    container.appendChild(nextBtn);
}

async function loadEquipment() {
    const tbody = document.getElementById('equipmentTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 1rem;">Đang tải...</td></tr>';
    
    const productType = document.getElementById('filterEquipmentProduct')?.value || '';
    const params = new URLSearchParams();
    if (productType) params.append('productType', productType);

    try {
        const apiUrl = productType 
            ? `/api/staff/storage-equipment/list-equipment?${params.toString()}` 
            : `/api/staff/storage-equipment/list-equipment`;
        
        const res = await adminFetch(apiUrl);
        
        if (res.ok) {
            const rawData = await res.json();
            const list = rawData.content || (rawData.data && rawData.data.content) || rawData.data || rawData || [];
            
            if (list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 1rem;">Không có thiết bị nào</td></tr>';
            } else {
                tbody.innerHTML = list.map(item => {
                    const isOverloaded = item.currentLoad > item.maxCapacity;
                    const loadStyle = isOverloaded ? 'color: #dc2626; font-weight: bold;' : '';

                    return `
                    <tr>
                        <td style="font-weight: 500;">TB${String(item.equipmentId || '').padStart(3, '0')}</td>
                        <td style="font-weight: 600;">${item.name || '--'}</td>
                        <td>${formatProductType(item.productType)}</td>
                        <td>${item.standard || '--'}</td>
                        <td>${item.maxCapacity || 0}</td>
                        <td style="${loadStyle}">${item.currentLoad || 0}</td>
                        <td><span class="badge ${item.status === 'ACTIVE' ? 'bg-success-light' : (item.status === 'MAINTENANCE' ? 'bg-warning-light' : 'bg-danger-light')}">${item.status === 'ACTIVE' ? 'Hoạt động' : (item.status === 'MAINTENANCE' ? 'Bảo trì / Hỏng' : 'Ngừng')}</span></td>
                        <td>
                            <button class="action-btn" title="Chỉnh sửa" onclick="openEquipmentEditModal(${item.equipmentId})"><i class="ph ph-pencil-simple"></i></button>
                        </td>
                    </tr>
                `}).join('');
            }

            loadEquipmentStats();

        } else {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Lỗi tải dữ liệu (${res.status})</td></tr>`;
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: red;">Mất kết nối máy chủ</td></tr>';
    }
}

// Hàm tải thống kê thiết bị
async function loadEquipmentStats() {
    try {
        const res = await adminFetch('/api/admin/storage-equipment-stat');
        if (res.ok) {
            const data = await res.json();
            const stats = data.data || data; // Map đúng chuẩn JSON của bạn

            if (document.getElementById('statTotalEquipment')) 
                document.getElementById('statTotalEquipment').innerText = stats.totalEquipment || 0;
                
            if (document.getElementById('statActiveEquipment')) 
                document.getElementById('statActiveEquipment').innerText = stats.activeEquipment || 0;
                
            // Ánh xạ "Cảnh báo" vào biến nearlyFullEquipment
            if (document.getElementById('statWarningEquipment')) 
                document.getElementById('statWarningEquipment').innerText = stats.nearlyFullEquipment || 0;
                
            if (document.getElementById('statMaintenanceEquipment')) 
                document.getElementById('statMaintenanceEquipment').innerText = stats.maintenanceEquipment || 0;
        }
    } catch (e) {
        console.error("Lỗi fetch thống kê thiết bị:", e);
    }
}

// --- HOSPITAL DETAIL MODAL LOGIC ---
let currentDetailHospitalId = null;
let currentHospitalHistoryPage = 0;

window.openHospitalDetailModal = function(hospitalId) {
    currentDetailHospitalId = hospitalId;
    currentHospitalHistoryPage = 0;
    const modal = document.getElementById('hospitalDetailModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    switchHospitalTab('info');
};

window.closeHospitalDetailModal = function() {
    const modal = document.getElementById('hospitalDetailModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

window.switchHospitalTab = function(tab) {
    const infoBtn = document.getElementById('tabHospitalInfoBtn');
    const historyBtn = document.getElementById('tabHospitalHistoryBtn');
    const infoContent = document.getElementById('tabHospitalInfoContent');
    const historyContent = document.getElementById('tabHospitalHistoryContent');
    
    if (tab === 'info') {
        infoBtn.classList.add('active');
        infoBtn.style.borderBottomColor = 'var(--primary-color)';
        infoBtn.style.color = 'var(--primary-color)';
        
        historyBtn.classList.remove('active');
        historyBtn.style.borderBottomColor = 'transparent';
        historyBtn.style.color = 'var(--text-secondary)';
        
        infoContent.style.display = 'block';
        historyContent.style.display = 'none';
        
        loadHospitalDetailInfo(currentDetailHospitalId);
    } else {
        historyBtn.classList.add('active');
        historyBtn.style.borderBottomColor = 'var(--primary-color)';
        historyBtn.style.color = 'var(--primary-color)';
        
        infoBtn.classList.remove('active');
        infoBtn.style.borderBottomColor = 'transparent';
        infoBtn.style.color = 'var(--text-secondary)';
        
        historyContent.style.display = 'block';
        infoContent.style.display = 'none';
        
        loadHospitalDetailHistory(currentDetailHospitalId, currentHospitalHistoryPage);
    }
};

async function loadHospitalDetailInfo(hospitalId) {
    const container = document.getElementById('hospitalDetailInfoContent');
    if (!container) return;
    container.innerHTML = '<div style="text-align: center; padding: 2rem;">Đang tải thông tin...</div>';
    
    try {
        const res = await adminFetch(`/api/admin/hospital/get-hospital-detail/${hospitalId}`);
        if (res.ok) {
            const result = await res.json();
            const data = result.data || result;
            
            container.innerHTML = `
                <form id="hospitalUpdateForm" onsubmit="handleHospitalUpdate(event, ${hospitalId})">
                <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Tên bệnh viện</p>
                        <input type="text" id="updateHospitalName" class="form-control" value="${data.hospitalName || data.name || ''}" required>
                    </div>
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Email</p>
                        <input type="email" id="updateHospitalEmail" class="form-control" value="${data.email || ''}" required>
                    </div>
                </div>
                <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Số điện thoại</p>
                        <input type="text" id="updateHospitalPhone" class="form-control" value="${data.phone || data.hotline || ''}">
                    </div>
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Trạng thái</p>
                        <select id="updateHospitalStatus" class="form-control">
                            <option value="ACTIVE" ${data.status === 'ACTIVE' ? 'selected' : ''}>Đang hợp tác</option>
                            <option value="INACTIVE" ${data.status !== 'ACTIVE' ? 'selected' : ''}>Ngừng hợp tác</option>
                        </select>
                    </div>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Địa chỉ</p>
                    <input type="text" id="updateHospitalAddress" class="form-control" value="${data.address || ''}">
                </div>
                <div style="display: flex; justify-content: flex-end;">
                    <button type="submit" class="btn btn-primary" id="btnUpdateHospital">Lưu cập nhật</button>
                </div>
                </form>
            `;
        } else {
            container.innerHTML = '<div style="text-align: center; color: red; padding: 2rem;">Lỗi tải thông tin chi tiết</div>';
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div style="text-align: center; color: red; padding: 2rem;">Mất kết nối máy chủ</div>';
    }
}

async function loadHospitalDetailHistory(hospitalId, page = 0, size = 10) {
    const tbody = document.getElementById('hospitalDetailHistoryContent');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 1rem;">Đang tải...</td></tr>';
    
    try {
        const res = await adminFetch(`/api/admin/hospital/get-history-request/${hospitalId}?page=${page}&size=${size}`);
        if (res.ok) {
            const result = await res.json();
            const data = result.data || result;
            const content = data.content || data;
            
            if (content && content.length > 0) {
                tbody.innerHTML = content.map(item => {
                    const statusText = item.status === 'APPROVED' ? 'Đã duyệt' : (item.status === 'PENDING' ? 'Chờ duyệt' : (item.status === 'REJECTED' ? 'Từ chối' : (item.status || '--')));
                    const statusClass = item.status === 'APPROVED' ? 'bg-success-light' : (item.status === 'PENDING' ? 'bg-warning-light' : 'bg-danger-light');
                    const reqType = item.type || item.requestType || 'REQUEST';
                    const typeLabel = reqType === 'REQUEST' ? 'Yêu cầu máu' : 'Trả lại máu';
                    
                    return `
                        <tr>
                            <td style="font-weight: 500;">REQ${String(item.id || '').padStart(3, '0')}</td>
                            <td>${item.createdAt || item.requestDate ? new Date(item.createdAt || item.requestDate).toLocaleDateString('vi-VN') : '--'}</td>
                            <td>${item.quantity || item.volume || item.amount || '--'}</td>
                            <td><span class="badge ${statusClass}">${statusText}</span></td>
                        </tr>
                    `;
                }).join('');
                
                // Pagination
                const pagination = document.getElementById('hospitalHistoryPagination');
                if (pagination) {
                    const totalPages = data.totalPages || 1;
                    let pageHtml = '';
                    for (let i = 0; i < totalPages; i++) {
                        pageHtml += `<button onclick="loadHospitalDetailHistory(${hospitalId}, ${i}, ${size})" class="btn ${i === page ? 'btn-primary' : 'btn-secondary'}" style="padding: 0.25rem 0.5rem; min-width: 32px;">${i + 1}</button>`;
                    }
                    pagination.innerHTML = pageHtml;
                }
            } else {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 1rem; color: var(--text-secondary);">Không có lịch sử yêu cầu/trả máu</td></tr>';
                if (document.getElementById('hospitalHistoryPagination')) document.getElementById('hospitalHistoryPagination').innerHTML = '';
            }
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red; padding: 1rem;">Lỗi tải lịch sử</td></tr>';
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red; padding: 1rem;">Mất kết nối máy chủ</td></tr>';
    }
}

window.handleHospitalUpdate = async function(event, hospitalId) {
    event.preventDefault();
    const btn = document.getElementById('btnUpdateHospital');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang xử lý...';
    }

    const payload = {
        hospitalName: document.getElementById('updateHospitalName').value,
        email: document.getElementById('updateHospitalEmail').value,
        hotline: document.getElementById('updateHospitalPhone').value,
        phone: document.getElementById('updateHospitalPhone').value,
        address: document.getElementById('updateHospitalAddress').value,
        status: document.getElementById('updateHospitalStatus').value
    };

    try {
        let res = await adminFetch(`/api/admin/hospital/update-hospital/${hospitalId}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        if (res.status === 405) {
            res = await adminFetch(`/api/admin/hospital/update-hospital/${hospitalId}`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }
        
        if (res.ok) {
            alert('Cập nhật bệnh viện thành công!');
            loadHospitals();
        } else {
            const err = await res.text();
            alert('Lỗi cập nhật: ' + err);
        }
    } catch (e) {
        alert('Mất kết nối máy chủ!');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Lưu cập nhật';
        }
    }
};

window.logout = function () { localStorage.clear(); window.location.href = '../home/login.html'; }

// ==== UPDATE HANDLERS ====
window.handleDonorUpdate = async function(event, donorId) {
    event.preventDefault();
    const btn = document.getElementById('btnUpdateDonor');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang xử lý...';
    }

    const payload = {
        fullName: document.getElementById('updateDonorName').value,
        cccd: document.getElementById('updateDonorCCCD').value,
        dob: document.getElementById('updateDonorDob').value || null,
        gender: document.getElementById('updateDonorGender').value,
        email: document.getElementById('updateDonorEmail').value,
        phone: document.getElementById('updateDonorPhone').value,
        address: document.getElementById('updateDonorAddress').value
    };

    const token = localStorage.getItem('access_token');
    
    try {
        const res = await fetch(`${window.API_BASE}/api/staff/donor/update-donor/${donorId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            alert('Cập nhật người hiến thành công!');
            loadDonors();
            closeDonorDetailModal();
        } else {
            const err = await res.text();
            alert('Lỗi cập nhật: ' + err);
        }
    } catch (e) {
        alert('Mất kết nối máy chủ!');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Lưu cập nhật';
        }
    }
};

window.handleStaffUpdate = async function(event, staffId) {
    event.preventDefault();
    const btn = document.getElementById('btnUpdateStaff');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang xử lý...';
    }

    const position = document.getElementById('updateStaffPosition').value;
    let role = 'STAFF_TECH';
    if (position === 'QUAN_LY_KHO') {
        role = 'STAFF_INVENTORY';
    } else if (position === 'ADMIN') {
        role = 'ADMIN';
    }

    const payload = {
        fullName: document.getElementById('updateStaffName').value,
        email: document.getElementById('updateStaffEmail').value,
        dob: document.getElementById('updateStaffDob').value || null,
        gender: document.getElementById('updateStaffGender').value,
        cccd: document.getElementById('updateStaffCCCD').value,
        phone: document.getElementById('updateStaffPhone').value,
        position: position,
        role: role,
        status: document.getElementById('updateStaffStatus').value
    };

    try {
        let res = await adminFetch(`/api/admin/staff/update-staff/${staffId}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        if (res.status === 405) {
            res = await adminFetch(`/api/admin/staff/update-staff/${staffId}`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }
        
        if (res.ok) {
            alert('Cập nhật nhân viên thành công!');
            loadStaff();
        } else {
            const err = await res.text();
            alert('Lỗi cập nhật: ' + err);
        }
    } catch (e) {
        alert('Mất kết nối máy chủ!');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Lưu cập nhật';
        }
    }
};

// ==================== EQUIPMENT MODAL (TẠO / CHỈNH SỬA THIẾT BỊ) ====================

// Mở modal tạo thiết bị mới
window.openEquipmentModal = function() {
    const modal = document.getElementById('equipmentModal');
    if (!modal) return;

    // Reset form về chế độ TẠO MỚI
    document.getElementById('equipmentModalTitle').textContent = 'Thêm thiết bị mới';
    document.getElementById('equipmentId').value = '';
    document.getElementById('eqName').value = '';
    document.getElementById('eqMaxCapacity').value = '';

    // Set loại mặc định và auto-fill nhiệt độ tương ứng
    const eqProductType = document.getElementById('eqProductType');
    const eqStandard    = document.getElementById('eqStandard');
    if (eqProductType) eqProductType.value = 'MAU_TOAN_PHAN';
    if (eqStandard)    eqStandard.value    = '2 - 6 độ C';

    // Ẩn trường trạng thái (chỉ hiện khi chỉnh sửa)
    const statusContainer = document.getElementById('eqStatusContainer');
    if (statusContainer) statusContainer.style.display = 'none';

    // Reset nút submit
    const saveBtn = document.getElementById('saveEquipmentBtn');
    if (saveBtn) {
        saveBtn.textContent = 'Lưu thiết bị';
        saveBtn.disabled = false;
    }

    modal.classList.add('active');
};

// Mở modal chỉnh sửa thiết bị
window.openEquipmentEditModal = async function(equipmentId) {
    const modal = document.getElementById('equipmentModal');
    if (!modal) return;

    document.getElementById('equipmentModalTitle').textContent = 'Chỉnh sửa thiết bị';
    document.getElementById('equipmentId').value = equipmentId;
    document.getElementById('eqName').value = 'Đang tải...';
    document.getElementById('eqMaxCapacity').value = '';
    document.getElementById('eqStandard').value = '';

    // Hiện trường trạng thái khi chỉnh sửa
    const statusContainer = document.getElementById('eqStatusContainer');
    if (statusContainer) statusContainer.style.display = 'block';

    modal.classList.add('active');

    // Tải dữ liệu thiết bị từ API
    try {
        const res = await adminFetch(`/api/staff/storage-equipment/list-equipment`);
        if (res.ok) {
            const rawData = await res.json();
            const list = rawData.content || rawData.data || rawData || [];
            const item = list.find(e => e.equipmentId == equipmentId);
            if (item) {
                document.getElementById('eqName').value = item.name || '';
                document.getElementById('eqProductType').value = item.productType || 'MAU_TOAN_PHAN';
                document.getElementById('eqMaxCapacity').value = item.maxCapacity || '';
                document.getElementById('eqStandard').value = item.standard || '';
                const eqStatusEl = document.getElementById('eqStatus');
                if (eqStatusEl) eqStatusEl.value = item.status || 'ACTIVE';
            }
        }
    } catch (e) {
        console.error('Lỗi tải chi tiết thiết bị:', e);
        document.getElementById('eqName').value = '';
    }
};

// Xử lý submit form tạo/cập nhật thiết bị
document.addEventListener('DOMContentLoaded', function() {
    const equipmentForm = document.getElementById('equipmentForm');
    if (!equipmentForm) return;

    // === AUTO-FILL TIÊU CHUẨN NHIỆT ĐỘ theo loại chế phẩm ===
    const TEMP_STANDARD_MAP = {
        'MAU_TOAN_PHAN':   '2 - 6 độ C',
        'TUI_HONG_CAU':    '2 - 6 độ C',
        'TUI_HUYET_TUONG': '-18 đến -25 độ C',
        'TUI_TIEU_CAU':    '20 - 24 độ C (lắc liên tục)',
        'HONG_CAU':        '2 - 6 độ C',
        'HUYET_TUONG':     '-18 đến -25 độ C',
        'TIEU_CAU':        '20 - 24 độ C (lắc liên tục)',
    };

    const eqProductType = document.getElementById('eqProductType');
    const eqStandard    = document.getElementById('eqStandard');

    if (eqProductType && eqStandard) {
        eqProductType.addEventListener('change', function() {
            const standard = TEMP_STANDARD_MAP[this.value];
            if (standard) {
                eqStandard.value = standard;
                // Hiệu ứng flash nhẹ để báo đã tự điền
                eqStandard.style.transition = 'background 0.3s';
                eqStandard.style.background = '#fef9c3';
                setTimeout(() => { eqStandard.style.background = ''; }, 800);
            }
        });
    }

    equipmentForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const equipmentId = document.getElementById('equipmentId').value;
        const isEdit = !!equipmentId;

        const payload = {
            name:        document.getElementById('eqName').value.trim(),
            productType: document.getElementById('eqProductType').value,
            maxCapacity: parseInt(document.getElementById('eqMaxCapacity').value) || 0,
            standard:    document.getElementById('eqStandard').value.trim(),
        };
        if (isEdit) {
            payload.status = document.getElementById('eqStatus')?.value || 'ACTIVE';
        }

        const saveBtn = document.getElementById('saveEquipmentBtn');
        const oldText = saveBtn ? saveBtn.textContent : 'Lưu thiết bị';
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="ph-bold ph-spinner-gap"></i> Đang lưu...';
        }

        try {
            let res;
            if (isEdit) {
                // Cập nhật thiết bị
                res = await adminFetch(`/api/admin/storage-equipment/update-equipment/${equipmentId}`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload)
                });
                // Fallback nếu BE dùng POST
                if (res.status === 405) {
                    res = await adminFetch(`/api/admin/storage-equipment/update-equipment/${equipmentId}`, {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });
                }
            } else {
                // Tạo thiết bị mới
                res = await adminFetch('/api/admin/storage-equipment/create-equipment', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                const msg = isEdit ? 'Cập nhật thiết bị thành công!' : 'Tạo thiết bị mới thành công!';
                // Hiện toast nếu có, fallback alert
                if (typeof showToast === 'function') showToast(msg, 'success');
                else alert(msg);

                // Đóng modal và tải lại danh sách
                document.getElementById('equipmentModal').classList.remove('active');
                loadEquipment();
                loadEquipmentStats();
            } else {
                const errText = await res.text();
                alert('Lỗi: ' + errText);
            }
        } catch (err) {
            console.error(err);
            alert('Mất kết nối máy chủ!');
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = oldText;
            }
        }
    });
});

let currentLogsPage = 0;

window.initLogsPage = function() {
    // Add event listeners for filters
    document.getElementById('filterStaffId')?.addEventListener('input', () => {
        clearTimeout(window.searchLogsTimeout);
        window.searchLogsTimeout = setTimeout(() => {
            currentLogsPage = 0;
            loadLogs();
        }, 500);
    });

    document.getElementById('filterActionType')?.addEventListener('change', () => {
        currentLogsPage = 0;
        loadLogs();
    });

    document.getElementById('filterEntityName')?.addEventListener('change', () => {
        currentLogsPage = 0;
        loadLogs();
    });

    document.getElementById('filterPerformerRole')?.addEventListener('change', () => {
        currentLogsPage = 0;
        loadLogs();
    });

    loadLogs();
};

window.resetFilters = function() {
    const staffIdInput = document.getElementById('filterStaffId');
    if (staffIdInput) staffIdInput.value = '';

    const actionTypeSelect = document.getElementById('filterActionType');
    if (actionTypeSelect) actionTypeSelect.value = '';

    const entityNameSelect = document.getElementById('filterEntityName');
    if (entityNameSelect) entityNameSelect.value = '';

    const performerRoleSelect = document.getElementById('filterPerformerRole');
    if (performerRoleSelect) performerRoleSelect.value = '';

    currentLogsPage = 0;
    loadLogs();
};

async function loadLogs() {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-secondary);">Đang tải dữ liệu nhật ký...</td></tr>';

    const staffId = document.getElementById('filterStaffId')?.value || '';
    const actionType = document.getElementById('filterActionType')?.value || '';
    const entityName = document.getElementById('filterEntityName')?.value || '';
    const role = document.getElementById('filterPerformerRole')?.value || '';

    const params = new URLSearchParams();
    if (staffId) params.append('staffId', staffId);
    if (actionType) params.append('actionType', actionType);
    if (entityName) params.append('entityName', entityName);
    if (role) params.append('role', role);
    params.append('page', currentLogsPage);
    params.append('size', 10);

    try {
        const res = await adminFetch(`/api/staff/action-logs?${params.toString()}`);
        if (res.ok) {
            const rawData = await res.json();
            const list = getListFromData(rawData);
            const totalPages = rawData.totalPages ?? rawData.data?.totalPages;

            if (list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-secondary);">Không tìm thấy nhật ký hoạt động nào</td></tr>';
                const pagination = document.getElementById('logsPaginationControls');
                if (pagination) pagination.innerHTML = '';
            } else {
                renderLogs(list);
                if (totalPages !== undefined) {
                    renderLogsPagination(totalPages, currentLogsPage);
                }
            }
        } else {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: red; padding: 2rem;">Lỗi tải dữ liệu nhật ký</td></tr>';
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: red; padding: 2rem;">Mất kết nối máy chủ</td></tr>';
    }
}

function renderLogs(list) {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;

    tbody.innerHTML = list.map(item => {
        // Format time
        const timeDisplay = item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '--';

        // Performer Name / Display
        const performerDisplay = item.staffName || 'Admin / Hệ thống';

        // Role Badge Styling
        let roleClass = 'role-admin';
        let roleText = item.performedByRole || 'SYSTEM';
        if (item.performedByRole === 'STAFF_TECH') {
            roleClass = 'role-tech';
            roleText = 'KỸ THUẬT';
        } else if (item.performedByRole === 'STAFF_INVENTORY') {
            roleClass = 'role-inventory';
            roleText = 'KHO';
        } else if (item.performedByRole === 'ADMIN') {
            roleClass = 'role-admin';
            roleText = 'ADMIN';
        }
        const roleBadge = `<span class="badge-role ${roleClass}">${roleText}</span>`;

        // Action Type Badge Styling
        let actionClass = 'action-info';
        if (item.actionType.includes('UPDATE') || item.actionType.includes('EDIT') || item.actionType.includes('TRANSFER')) {
            actionClass = 'action-update';
        } else if (item.actionType.includes('CREATE') || item.actionType.includes('STORAGE') || item.actionType.includes('SEPARATE')) {
            actionClass = 'action-create';
        } else if (item.actionType.includes('DISCARD') || item.actionType.includes('CANCEL') || item.actionType.includes('FAILED')) {
            actionClass = 'action-danger';
        }
        const actionBadge = `<span class="badge-action ${actionClass}">${item.actionType}</span>`;

        // Note
        const noteDisplay = item.note || '<span style="color: var(--text-secondary); font-style: italic;">Không có</span>';

        // Change Data Button
        let inspectBtn = '--';
        if (item.oldData || item.newData) {
            // Escape oldData & newData for safe inline parameters
            const oldEscaped = item.oldData ? encodeURIComponent(item.oldData) : '';
            const newEscaped = item.newData ? encodeURIComponent(item.newData) : '';
            inspectBtn = `
                <button class="btn btn-secondary btn-sm" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="openDiffModal('${item.actionType}', '${item.entityName} #${item.entityId}', '${oldEscaped}', '${newEscaped}')">
                    <i class="ph ph-eye" style="font-size: 0.875rem;"></i> Xem chi tiết
                </button>
            `;
        }

        return `
            <tr>
                <td style="white-space: nowrap;">${timeDisplay}</td>
                <td style="font-weight: 500;">${performerDisplay}</td>
                <td>${roleBadge}</td>
                <td>${actionBadge}</td>
                <td><strong style="color: var(--text-secondary); font-size: 0.8rem;">${item.entityName}</strong></td>
                <td><span class="badge bg-blue-light" style="padding: 2px 8px; border-radius: 4px; font-weight: bold; background: #e0f2fe; color: #0369a1;">#${item.entityId}</span></td>
                <td>${noteDisplay}</td>
                <td>${inspectBtn}</td>
            </tr>
        `;
    }).join('');
}

function renderLogsPagination(totalPages, currentPage) {
    const container = document.getElementById('logsPaginationControls');
    if (!container) return;
    container.innerHTML = '';
    if (totalPages <= 1) return;

    const btnStyle = "padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer; transition: 0.2s;";
    const activeStyle = "background: var(--text-primary, #111827); color: white; border-color: var(--text-primary, #111827);";
    const disabledStyle = "background: #f3f4f6; color: #9ca3af; cursor: not-allowed;";

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="ph ph-caret-left"></i>';
    prevBtn.style.cssText = btnStyle + (currentPage === 0 ? disabledStyle : "");
    prevBtn.disabled = currentPage === 0;
    prevBtn.onclick = () => { currentLogsPage--; loadLogs(); };
    container.appendChild(prevBtn);

    // Page numbers
    for (let i = 0; i < totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.innerText = i + 1;
        pageBtn.style.cssText = btnStyle + (i === currentPage ? activeStyle : "");
        pageBtn.onclick = () => { currentLogsPage = i; loadLogs(); };
        container.appendChild(pageBtn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="ph ph-caret-right"></i>';
    nextBtn.style.cssText = btnStyle + (currentPage === totalPages - 1 ? disabledStyle : "");
    nextBtn.disabled = currentPage === totalPages - 1;
    nextBtn.onclick = () => { currentLogsPage++; loadLogs(); };
    container.appendChild(nextBtn);
}

window.openDiffModal = function(actionType, entityDisplay, oldEscaped, newEscaped) {
    const modal = document.getElementById('diffModal');
    if (!modal) return;

    document.getElementById('modalActionType').innerText = actionType;
    document.getElementById('modalEntityDisplay').innerText = entityDisplay;

    const oldDataRaw = oldEscaped ? decodeURIComponent(oldEscaped) : null;
    const newDataRaw = newEscaped ? decodeURIComponent(newEscaped) : null;

    const oldPre = document.getElementById('modalOldData');
    const newPre = document.getElementById('modalNewData');

    // Format JSON beautifully
    const formatJson = (raw) => {
        if (!raw) return '{\n    "message": "Không có dữ liệu"\n}';
        try {
            const parsed = JSON.parse(raw);
            return JSON.stringify(parsed, null, 4);
        } catch (e) {
            return raw;
        }
    };

    oldPre.innerHTML = highlightDiff(formatJson(oldDataRaw), formatJson(newDataRaw), 'old');
    newPre.innerHTML = highlightDiff(formatJson(newDataRaw), formatJson(oldDataRaw), 'new');

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeDiffModal = function() {
    const modal = document.getElementById('diffModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// Premium line-by-line diff highlighting!
function highlightDiff(sourceText, compareText, type) {
    const sourceLines = sourceText.split('\n');
    const compareLines = compareText.split('\n');
    
    return sourceLines.map(line => {
        const trimmed = line.trim();
        if (trimmed === '{' || trimmed === '}' || trimmed === '[],' || trimmed === '{}' || trimmed === '{},') {
            return escapeHtml(line);
        }
        
        // Simple comparison: check if the exact line exists in the other text
        const exists = compareLines.some(cLine => cLine.trim() === trimmed);
        if (!exists && trimmed.length > 2) {
            const highlightClass = type === 'new' ? 'diff-highlight-add' : 'diff-highlight-remove';
            const prefix = type === 'new' ? '+ ' : '- ';
            return `<span class="${highlightClass}">${prefix}${escapeHtml(line)}</span>`;
        }
        return `  ${escapeHtml(line)}`;
    }).join('\n');
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==========================================
// THÊM MỚI: WEBSOCKET & CẢNH BÁO SỰ CỐ
// ==========================================
function loadWebSocketLibraries(callback) {
    if (window.SockJS && window.Stomp) {
        callback();
        return;
    }

    const sockScript = document.createElement('script');
    sockScript.src = 'https://cdn.jsdelivr.net/npm/sockjs-client@1.5.1/dist/sockjs.min.js';
    sockScript.onload = () => {
        const stompScript = document.createElement('script');
        stompScript.src = 'https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js';
        stompScript.onload = () => {
            callback();
        };
        stompScript.onerror = () => console.error("Lỗi tải thư viện STOMP");
        document.head.appendChild(stompScript);
    };
    sockScript.onerror = () => console.error("Lỗi tải thư viện SockJS");
    document.head.appendChild(sockScript);
}

let stompClient = null;

function connectAdminWebSocket() {
    loadWebSocketLibraries(() => {
        const socket = new SockJS(`${API_BASE}/ws-bloodbank`);
        stompClient = Stomp.over(socket);
        stompClient.debug = null; // Tắt log debug STOMP trong console

        stompClient.connect({}, function (frame) {
            console.log('Connected to Admin WS: ' + frame);
            
            stompClient.subscribe('/topic/admin/alerts', function (message) {
                try {
                    const alertData = JSON.parse(message.body);
                    showAdminAlert(alertData);
                } catch (e) {
                    console.error("Lỗi parse thông tin cảnh báo:", e);
                }
            });
        }, function (error) {
            console.warn('Kết nối WS thất bại, đang thử lại sau 5s...', error);
            setTimeout(connectAdminWebSocket, 5000);
        });
    });
}

function playAlertSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const playBeep = (time, freq, duration) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, time);
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.3, time + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
            
            osc.start(time);
            osc.stop(time + duration);
        };

        const now = audioCtx.currentTime;
        playBeep(now, 880, 0.15); // Nốt A5
        playBeep(now + 0.2, 880, 0.15);
        playBeep(now + 0.4, 1200, 0.3); // Nốt cảnh báo cao độ
    } catch (e) {
        console.error("Không thể phát âm thanh cảnh báo:", e);
    }
}

function showAdminAlert(data) {
    playAlertSound();

    let alertContainer = document.getElementById('wsAlertContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'wsAlertContainer';
        alertContainer.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 16px;
            max-width: 420px;
            width: calc(100vw - 48px);
        `;
        document.body.appendChild(alertContainer);
    }

    const card = document.createElement('div');
    card.className = 'ws-alert-card';
    card.style.cssText = `
        background: rgba(254, 242, 242, 0.95);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-left: 6px solid #ef4444;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 10px 15px -3px rgba(220, 38, 38, 0.1), 0 4px 6px -4px rgba(220, 38, 38, 0.05);
        animation: ws-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        color: #1f2937;
        font-family: system-ui, -apple-system, sans-serif;
    `;

    if (!document.getElementById('wsAlertStyle')) {
        const style = document.createElement('style');
        style.id = 'wsAlertStyle';
        style.textContent = `
            @keyframes ws-slide-in {
                from { transform: translateX(120%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes ws-slide-out {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(120%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    const title = data.title || "CẢNH BÁO SỰ CỐ";
    const content = data.message || "Thiết bị bảo quản vừa được báo cáo hỏng.";
    const time = new Date().toLocaleTimeString('vi-VN');

    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; color: #ef4444; font-weight: 700; font-size: 0.95rem;">
                <i class="ph-bold ph-warning-octagon" style="font-size: 1.25rem;"></i>
                <span>${title}</span>
            </div>
            <button onclick="this.closest('.ws-alert-card').remove()" style="background: none; border: none; color: #9ca3af; cursor: pointer; padding: 0; font-size: 1.15rem; line-height: 1;">&times;</button>
        </div>
        <div style="font-size: 0.9rem; line-height: 1.5; color: #374151; margin-bottom: 8px; font-weight: 500;">
            ${content}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: #6b7280;">
            <span>Thời gian: ${time}</span>
            <span style="background: #fee2e2; color: #ef4444; padding: 2px 8px; border-radius: 9999px; font-weight: 600;">Khẩn cấp</span>
        </div>
    `;

    alertContainer.appendChild(card);

    setTimeout(() => {
        if (card.parentElement) {
            card.style.animation = 'ws-slide-out 0.4s forwards';
            setTimeout(() => card.remove(), 400);
        }
    }, 10000);

    // Tự động reload nếu đang ở tab thiết bị của kho
    if (window.location.pathname.includes('inventory.html')) {
        const equipmentView = document.getElementById('equipmentManagerView');
        if (equipmentView && equipmentView.style.display !== 'none') {
            if (typeof loadEquipment === 'function') loadEquipment();
            if (typeof loadEquipmentStats === 'function') loadEquipmentStats();
        }
    }
}

