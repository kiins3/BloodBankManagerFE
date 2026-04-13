

/**
 * admin.js - Quản lý logic cho giao diện Admin
 * Xử lý nạp dữ liệu động cho Người hiến, Nhân viên, Bệnh viện, Kho máu và Thiết bị.
 */

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }

    // Xác định trang hiện tại và nạp dữ liệu tương ứng
    const path = window.location.pathname;
    if (path.includes('donors.html')) {
        initDonorPage();
    } else if (path.includes('inventory.html')) {
        initInventoryPage();
    }
});

// --- USER MANAGEMENT (donors.html) ---

function initDonorPage() {
    // Chuyển đổi giữa các View (Hồ sơ người hiến, Nhân viên, Bệnh viện)
    const navDonor = document.getElementById('navDonorList');
    const navStaff = document.getElementById('navStaffList');
    const navHospital = document.getElementById('navHospitalList');

    const views = {
        donor: document.getElementById('donorListView'),
        staff: document.getElementById('staffListView'),
        hospital: document.getElementById('hospitalListView')
    };

    function switchView(target) {
        Object.keys(views).forEach(k => {
            if (views[k]) views[k].style.display = (k === target) ? 'block' : 'none';
        });
        [navDonor, navStaff, navHospital].forEach(el => {
            if (el) el.classList.remove('active');
        });
    }

    if (navDonor) {
        navDonor.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('donor');
            navDonor.classList.add('active');
            loadDonors();
        });
    }

    if (navStaff) {
        navStaff.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('staff');
            navStaff.classList.add('active');
            loadStaff();
        });
    }

    if (navHospital) {
        navHospital.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('hospital');
            navHospital.classList.add('active');
            loadHospitals();
        });
    }

    // Mặc định nạp Người hiến
    loadDonors();
}

async function loadDonors() {
    const tbody = document.getElementById('donorTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">Đang tải...</td></tr>';

    try {
        const res = await fetch(`${API_BASE}/donor/get-list-donor`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        if (res.ok) {
            const data = await res.json();
            renderDonors(data);
        } else {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>';
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Lỗi kết nối server</td></tr>';
    }
}

function renderDonors(list) {
    const tbody = document.getElementById('donorTableBody');
    tbody.innerHTML = '';
    list.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><div style="font-weight: 600;">${item.fullName}</div><div style="font-size: 0.75rem; color: #6b7280;">ID: #${item.donorId}</div></td>
            <td>${item.email || '--'}</td>
            <td>${item.phone || '--'}</td>
            <td class="text-center">
                <span style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-weight: 500;">
                    ${item.bloodType || '?'}${item.rhFactor || ''}
                </span>
            </td>
            <td class="text-center">${item.totalDonations || 0}</td>
            <td>${item.lastDonationDate ? new Date(item.lastDonationDate).toLocaleDateString('vi-VN') : 'Chưa hiến'}</td>
            <td><span class="badge ${item.userStatus === 'ACTIVE' ? 'bg-success-light' : 'bg-danger-light'}">${item.userStatus}</span></td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="action-btn"><i class="ph ph-eye"></i></button>
                    <button class="action-btn"><i class="ph ph-pencil-simple"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function loadStaff() {
    const tbody = document.getElementById('staffTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Đang tải...</td></tr>';

    try {
        const res = await fetch(`${API_BASE}/api/admin/staff/get-list-staff`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        if (res.ok) {
            const data = await res.json();
            renderStaff(data);
        }
    } catch (e) { console.error(e); }
}

function renderStaff(list) {
    const tbody = document.getElementById('staffTableBody');
    tbody.innerHTML = '';
    list.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 500;">STF${index+1}</td>
            <td>
                <div style="font-weight: 600;">${item.fullName}</div>
                <div style="font-size: 0.75rem; color: #6b7280;">${item.email}</div>
            </td>
            <td>${item.position || 'Nhân viên'}</td>
            <td><span class="badge ${item.status === 'ACTIVE' || !item.status ? 'bg-success-light' : 'bg-danger-light'}">Hoạt động</span></td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="action-btn"><i class="ph ph-pencil-simple"></i></button>
                    <button class="action-btn"><i class="ph ph-lock"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function loadHospitals() {
    const tbody = document.getElementById('hospitalTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Đang tải...</td></tr>';

    try {
        const res = await fetch(`${API_BASE}/api/admin/hospital/get-list-hospital`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        if (res.ok) {
            const data = await res.json();
            renderHospitals(data);
        }
    } catch (e) { console.error(e); }
}

function renderHospitals(list) {
    const tbody = document.getElementById('hospitalTableBody');
    tbody.innerHTML = '';
    list.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 500;">HSP${index+1}</td>
            <td>
                <div style="font-weight: 600;">${item.hospitalName}</div>
                <div style="font-size: 0.75rem; color: #6b7280;">${item.address} | HL: ${item.hotline}</div>
            </td>
            <td><span class="badge bg-success-light">Đang hợp tác</span></td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="action-btn" title="Xem chi tiết"><i class="ph ph-eye"></i></button>
                    <button class="action-btn" title="Cập nhật" onclick='openHospitalModal(${JSON.stringify(item)})'><i class="ph ph-pencil-simple"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- HOSPITAL EDIT LOGIC ---
window.openHospitalModal = function(data = null) {
    const modal = document.getElementById('hospitalModal');
    const form = document.getElementById('hospitalForm');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('hospitalModalTitle').textContent = data ? 'Cập nhật thông tin bệnh viện' : 'Thêm bệnh viện mới';
    
    if (data) {
        document.getElementById('hospitalName').value = data.hospitalName || '';
        document.getElementById('hospitalAddress').value = data.address || '';
        document.getElementById('hospitalPhone').value = data.hotline || '';
        document.getElementById('hospitalEmail').value = data.email || '';
        document.getElementById('hospitalEmail').readOnly = true;
    } else {
        document.getElementById('hospitalEmail').readOnly = false;
    }

    modal.classList.add('active');
};

// Lưu thông tin bệnh viện (Sử dụng API PUT /hospital/update-hospital)
async function saveHospital(e) {
    e.preventDefault();
    const btn = document.getElementById('saveHospitalBtn');
    const oldText = btn.innerHTML;

    const payload = {
        hospitalName: document.getElementById('hospitalName').value,
        address: document.getElementById('hospitalAddress').value,
        hotline: document.getElementById('hospitalPhone').value
    };

    const token = localStorage.getItem('access_token');
    btn.innerHTML = 'Đang lưu...';
    btn.disabled = true;

    try {
        // Lưu ý: API này hiện đang dùng email từ SecurityContext (Hồ sơ người đang đăng nhập)
        const res = await fetch(`${API_BASE}/api/hospital/update-hospital`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('Cập nhật hồ sơ bệnh viện thành công!');
            document.getElementById('hospitalModal').classList.remove('active');
            loadHospitals();
        } else {
            const err = await res.text();
            alert('Lỗi: ' + err);
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối server!');
    } finally {
        btn.innerHTML = oldText;
        btn.disabled = false;
    }
}

// --- INVENTORY MANAGEMENT (inventory.html) ---

function initInventoryPage() {
    const navBlood = document.getElementById('navBloodList');
    const navEquipment = document.getElementById('navEquipmentManager');

    const views = {
        blood: document.getElementById('bloodListView'),
        equipment: document.getElementById('equipmentManagerView')
    };

    function switchView(target) {
        Object.keys(views).forEach(k => {
            if (views[k]) views[k].style.display = (k === target) ? 'block' : 'none';
        });
        [navBlood, navEquipment].forEach(el => {
            if (el) el.classList.remove('active');
        });
    }

    if (navBlood) {
        navBlood.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('blood');
            navBlood.classList.add('active');
            loadInventory();
        });
    }

    if (navEquipment) {
        navEquipment.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('equipment');
            navEquipment.classList.add('active');
            loadEquipment();
        });
    }

    // Gắn sự kiện cho form thiết bị
    const eqForm = document.getElementById('equipmentForm');
    if (eqForm) {
        eqForm.addEventListener('submit', saveEquipment);
    }
    
    // Gắn sự kiện cho form bệnh viện (ở trang donors.html nếu có load)
    const hosForm = document.getElementById('hospitalForm');
    if (hosForm) {
        hosForm.addEventListener('submit', saveHospital);
    }

    // Tự động điền tiêu chuẩn nhiệt độ dựa trên loại chế phẩm
    const eqTypeSelect = document.getElementById('eqProductType');
    const eqStandardInput = document.getElementById('eqStandard');
    const TEMP_STANDARDS = {
        'TUI_HONG_CAU': '2 - 6 độ C',
        'TUI_TIEU_CAU': '22 độ C',
        'TUI_HUYET_TUONG': '-25 độ C',
        'MAU_TOAN_PHAN': '2 - 6 độ C'
    };

    if (eqTypeSelect && eqStandardInput) {
        eqTypeSelect.addEventListener('change', function() {
            if (TEMP_STANDARDS[this.value]) {
                eqStandardInput.value = TEMP_STANDARDS[this.value];
            }
        });
    }

    loadInventory();
}

async function loadInventory() {
    const tbody = document.getElementById('bloodTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="10" class="text-center">Đang tải...</td></tr>';

    try {
        const res = await fetch(`${API_BASE}/api/staff/bloodbag/get-list-blood-bag`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        if (res.ok) {
            const data = await res.json();
            renderInventory(data);
        }
    } catch (e) { console.error(e); }
}

function renderInventory(list) {
    const tbody = document.getElementById('bloodTableBody');
    tbody.innerHTML = '';
    list.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 500;">BB${item.bloodBagId}</td>
            <td><span style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-weight: 500;">
                ${item.bloodType || '?'}${item.rhFactor || ''}</span></td>
            <td>${item.productType}</td>
            <td>--</td>
            <td>--</td>
            <td>${item.collectedAt ? new Date(item.collectedAt).toLocaleDateString('vi-VN') : '--'}</td>
            <td>--</td>
            <td>${item.storageLocation || 'Chưa vào kho'}</td>
            <td><span class="badge ${getStatusBadgeClass(item.status)}">${item.status}</span></td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="action-btn"><i class="ph ph-eye"></i></button>
                    <button class="action-btn"><i class="ph ph-pencil-simple"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'SAN_SANG': return 'bg-success-light';
        case 'TRONG_KHO': return 'bg-blue-light';
        case 'CHO_XET_NGHIEM': return 'bg-warning-light';
        case 'DA_HUY': return 'bg-danger-light';
        default: return 'bg-blue-light';
    }
}

async function loadEquipment() {
    const tbody = document.getElementById('equipmentTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">Đang tải...</td></tr>';

    try {
        const res = await fetch(`${API_BASE}/api/shared/storage-equipment/list-equipment`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        if (res.ok) {
            const data = await res.json();
            renderEquipment(data);
        }
    } catch (e) { console.error(e); }
}

function renderEquipment(list) {
    const tbody = document.getElementById('equipmentTableBody');
    tbody.innerHTML = '';
    list.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 500;">EQ${item.equipmentId}</td>
            <td>${item.name}</td>
            <td><span style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-weight: 500;">${item.productType}</span></td>
            <td>Chuẩn: ${item.standard || '--'}</td>
            <td>${item.maxCapacity} túi</td>
            <td><span style="color: ${item.currentLoad >= item.maxCapacity * 0.9 ? 'var(--danger-color)' : 'var(--success-color)'}; font-weight: 500;">
                ${item.currentLoad || 0}</span> túi</td>
            <td><span class="badge ${item.status === 'ACTIVE' || !item.status ? 'bg-success-light' : 'bg-warning-light'}">${item.status || 'Hoạt động'}</span></td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="action-btn" title="Sửa" onclick='openEquipmentModal(${JSON.stringify(item)})'><i class="ph ph-pencil-simple"></i></button>
                    <button class="action-btn" title="Vô hiệu hóa" onclick="deactivateEquipment(${item.equipmentId}, ${item.maxCapacity})"><i class="ph ph-prohibit" style="color: #ef4444;"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- EQUIPMENT CRUD LOGIC ---

window.openEquipmentModal = function(data = null) {
    const modal = document.getElementById('equipmentModal');
    const form = document.getElementById('equipmentForm');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('equipmentId').value = data ? data.equipmentId : '';
    document.getElementById('equipmentModalTitle').textContent = data ? 'Cập nhật thiết bị' : 'Thêm thiết bị mới';
    document.getElementById('eqStatusContainer').style.display = data ? 'block' : 'none';

    if (data) {
        document.getElementById('eqName').value = data.name;
        document.getElementById('eqProductType').value = data.productType;
        document.getElementById('eqMaxCapacity').value = data.maxCapacity;
        document.getElementById('eqStandard').value = data.standard || '';
        document.getElementById('eqStatus').value = data.status || 'ACTIVE';
        // Khi cập nhật, không cho đổi loại chế phẩm để tránh lỗi logic kho
        document.getElementById('eqProductType').disabled = true;
    } else {
        document.getElementById('eqProductType').disabled = false;
        // Mặc định nhiệt đạo cho loại đầu tiên (Máu toàn phần)
        document.getElementById('eqStandard').value = '2 - 6 độ C';
    }

    modal.classList.add('active');
};

async function saveEquipment(e) {
    e.preventDefault();
    const id = document.getElementById('equipmentId').value;
    const btn = document.getElementById('saveEquipmentBtn');
    const oldText = btn.innerHTML;

    const token = localStorage.getItem('access_token');
    btn.innerHTML = 'Đang xử lý...';
    btn.disabled = true;

    try {
        let res;
        if (id) {
            // Cập nhật (PATCH)
            const payload = {
                maxCapacity: parseInt(document.getElementById('eqMaxCapacity').value),
                status: document.getElementById('eqStatus').value
            };
            res = await fetch(`${API_BASE}/api/admin/storage-equipment/update-equipment/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        } else {
            // Thêm mới (POST)
            const payload = {
                name: document.getElementById('eqName').value,
                productType: document.getElementById('eqProductType').value,
                maxCapacity: parseInt(document.getElementById('eqMaxCapacity').value),
                standard: document.getElementById('eqStandard').value
            };
            res = await fetch(`${API_BASE}/api/admin/storage-equipment/create-equipment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        }

        if (res.ok) {
            alert(id ? 'Cập nhật thiết bị thành công!' : 'Thêm thiết bị mới thành công!');
            document.getElementById('equipmentModal').classList.remove('active');
            loadEquipment();
        } else {
            const err = await res.text();
            alert('Lỗi: ' + err);
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối server!');
    } finally {
        btn.innerHTML = oldText;
        btn.disabled = false;
    }
}

// Hàm nhanh để vô hiệu hóa tủ
window.deactivateEquipment = async function(id, currentCap) {
    if (!confirm('Bạn có chắc chắn muốn ngừng hoạt động thiết bị này?')) return;
    
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE}/storage-equipment/update-equipment/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                maxCapacity: currentCap,
                status: 'UNACTIVE'
            })
        });

        if (res.ok) {
            alert('Đã ngừng hoạt động thiết bị.');
            loadEquipment();
        } else {
            alert('Lỗi: ' + await res.text());
        }
    } catch (e) { console.error(e); }
};


