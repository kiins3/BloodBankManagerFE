/* Hospital View Logic */

window.API_BASE = window.API_BASE || 'http://localhost:8080';
window.API_DEPLOY = window.API_DEPLOY || 'http://localhost:8080';
let hospitalProfile = null;
let activeExportedBags = [];

function groupExportedBags(exportedBags) {
    const groups = {};
    if (!exportedBags) return [];
    exportedBags.forEach(bag => {
        const key = `${bag.productType}_${bag.bloodType}_${bag.rhFactor}_${bag.volume}`;
        if (!groups[key]) {
            groups[key] = {
                productType: bag.productType,
                bloodType: bag.bloodType,
                rhFactor: bag.rhFactor,
                volume: bag.volume,
                bags: []
            };
        }
        groups[key].bags.push(bag);
    });
    return Object.values(groups);
}

// Helper to get headers
function getHeaders() {
    const token = localStorage.getItem('access_token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Fetch Profile on Load if needed
async function fetchHospitalProfile() {
    if (hospitalProfile) return hospitalProfile;
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.warn("No access token found");
        return null;
    }
    try {
        const res = await fetch(`${API_BASE}/api/shared/user/get-profile`, { headers: getHeaders() });
        if (res.ok) {
            const result = await res.json();
            hospitalProfile = result.data ? result.data : result;
            return hospitalProfile;
        }
    } catch (e) {
        console.error("Error fetching profile:", e);
    }
    return null;
}

// --- PROFILE & SECURITY LOGIC ---
window.initProfile = async function() {
    const profile = await fetchHospitalProfile();
    if (profile) {
        if (document.getElementById('profileEmail')) document.getElementById('profileEmail').value = profile.email || '';
        if (document.getElementById('profileName')) document.getElementById('profileName').value = profile.hospitalName || profile.fullName || profile.name || '';
        if (document.getElementById('profileHotline')) document.getElementById('profileHotline').value = profile.hotline || '';
        if (document.getElementById('profileAddress')) document.getElementById('profileAddress').value = profile.address || '';
    } else {
        // Clear placeholders if fetch failed or returned null
        ['profileEmail', 'profileName', 'profileHotline', 'profileAddress'].forEach(id => {
            const el = document.getElementById(id);
            if (el && el.value === '...') el.value = '';
        });
    }
}

window.updateProfile = async function(e) {
    if (e) e.preventDefault();
    const rq = {
        hospitalName: document.getElementById('profileName').value,
        hotline: document.getElementById('profileHotline').value,
        address: document.getElementById('profileAddress').value
    };

    try {
        const res = await fetch(`${API_BASE}/api/hospital/update-hospital`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(rq)
        });

        if (res.ok) {
            alert('Cập nhật thông tin thành công!');
            hospitalProfile = null; // Reset cache
            initProfile();
        } else {
            const err = await res.text();
            alert('Lỗi cập nhật: ' + err);
        }
    } catch (e) {
        alert('Lỗi kết nối máy chủ!');
    }
}

window.changePassword = async function(e) {
    if (e) e.preventDefault();
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        alert('Mật khẩu mới không trùng khớp!');
        return;
    }

    const rq = { oldPassword, newPassword, confirmPassword };

    try {
        const res = await fetch(`${API_BASE}/api/shared/user/change-password`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(rq)
        });

        if (res.ok) {
            alert('Đổi mật khẩu thành công!');
            e.target.reset();
        } else {
            const err = await res.text();
            alert('Lỗi: ' + err);
        }
    } catch (e) {
        alert('Lỗi kết nối máy chủ!');
    }
}

window.logout = function() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        window.location.href = '../home/login.html';
    }
}

function selectUrgency(level, element) {
    document.querySelectorAll('.urgency-option').forEach(el => {
        el.classList.remove('active');
    });
    element.classList.add('active');
    document.getElementById('selectedUrgency').value = level;
}

// --- REQUEST LOGIC ---
let requestItems = [];

const PRODUCT_TYPE_LABELS = {
    'MAU_TOAN_PHAN': 'Máu toàn phần',
    'TUI_HONG_CAU': 'Hồng cầu khối',
    'TUI_HUYET_TUONG': 'Huyết tương',
    'TUI_TIEU_CAU': 'Tiểu cầu'
};

function addItem() {
    const bloodType = document.getElementById('itemBloodType').value;
    const productType = document.getElementById('itemProductType').value;
    const volume = parseInt(document.getElementById('itemVolume').value);
    const quantity = parseInt(document.getElementById('itemQuantity').value);

    // Validation
    if (!bloodType) {
        alert('Vui lòng chọn nhóm máu!');
        return;
    }
    if (!quantity || quantity < 1) {
        alert('Số lượng phải lớn hơn 0!');
        return;
    }

    // Add to list
    const item = { bloodType, productType, volume, quantity };
    requestItems.push(item);
    renderRequestItems();

    // Reset inputs (keep product/volume as likely repeated)
    document.getElementById('itemBloodType').value = '';
    document.getElementById('itemQuantity').value = 1;
}

function removeItem(index) {
    if (confirm('Xóa chế phẩm này?')) {
        requestItems.splice(index, 1);
        renderRequestItems();
    }
}

function renderRequestItems() {
    const tbody = document.getElementById('requestItemsBody');
    if (!tbody) return;

    if (requestItems.length === 0) {
        tbody.innerHTML = `<tr id="emptyRow"><td colspan="5" class="text-center text-muted py-3">Chưa có chế phẩm nào được thêm</td></tr>`;
        return;
    }

    tbody.innerHTML = requestItems.map((item, index) => `
        <tr>
            <td class="fw-bold text-danger">${item.bloodType}</td>
            <td>${PRODUCT_TYPE_LABELS[item.productType] || item.productType}</td>
            <td>${item.volume} ml</td>
            <td>${item.quantity} Túi</td>
            <td class="text-end">
                <button type="button" class="btn btn-sm btn-light text-danger" onclick="removeItem(${index})">
                    <i class="ph-bold ph-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function submitRequest(event) {
    event.preventDefault();

    if (requestItems.length === 0) {
        alert('Vui lòng thêm ít nhất 1 chế phẩm!');
        return;
    }

    const profile = await fetchHospitalProfile();
    if (!profile || !profile.hospitalId) {
        alert('Không tìm thấy ID bệnh viện. Vui lòng đăng nhập lại.');
        return;
    }

    const deadlineRaw = document.getElementById('deadlineDate').value;
    if (!deadlineRaw) {
        alert('Vui lòng chọn thời gian cần (Deadline)!');
        return;
    }

    // Convert yyyy-mm-dd to dd-mm-yyyy for Backend
    const [y, m, d] = deadlineRaw.split('-');
    const deadlineDate = `${d}-${m}-${y}`;

    const priority = document.getElementById('selectedUrgency').value === 'urgent' ? 'KHAN_CAP' : 'BINH_THUONG';
    
    // Note/Reason (if field exists, though it's optional in DTO)
    // const notes = event.target.querySelector('textarea')?.value || '';

    const payload = {
        deadlineDate: deadlineDate,
        priority: priority,
        details: requestItems
    };

    const btn = event.target.querySelector('button[type="submit"]');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Đang gửi...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/api/hospital/blood-request/rq`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('Gửi yêu cầu thành công!');
            window.location.href = 'history.html';
        } else {
            const err = await res.text();
            alert('Lỗi: ' + err);
        }
    } catch (e) {
        console.error(e);
        alert('Không thể kết nối tới máy chủ!');
    } finally {
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
}

// --- HISTORY LOGIC ---

const REQUEST_STATUS_MAP = {
    'CHO_DUYET': { label: 'Chờ duyệt', cls: 'bg-secondary-light', icon: 'ph-hourglass' },
    'DA_DUYET_TOAN_BO': { label: 'Đã duyệt toàn bộ', cls: 'bg-success-light', icon: 'ph-check-circle' },
    'DA_DUYET_MOT_PHAN': { label: 'Duyệt một phần', cls: 'bg-info-light', icon: 'ph-check-square' },
    'DA_TU_CHOI': { label: 'Đã từ chối', cls: 'bg-danger-light', icon: 'ph-x-circle' },
    'DANG_VAN_CHUYEN': { label: 'Đang vận chuyển', cls: 'status-transit', icon: 'ph-truck' },
    'DA_NHAN': { label: 'Đã nhận', cls: 'bg-success-light', icon: 'ph-check-circle' },
    'DA_NHAN_MOT_PHAN': { label: 'Nhận một phần', cls: 'bg-info-light', icon: 'ph-check-square' },
    'HOAN_TRA_TOAN_BO': { label: 'Hoàn trả toàn bộ', cls: 'bg-danger-light', icon: 'ph-arrow-counter-clockwise' },
    'HOAN_TRA_MOT_PHAN': { label: 'Hoàn trả một phần', cls: 'bg-warning-light', icon: 'ph-arrow-counter-clockwise' }
};

const PRIORITY_MAP = {
    'KHAN_CAP': { label: 'Khẩn cấp', cls: 'bg-danger-solid', icon: 'ph-warning-octagon' },
    'BINH_THUONG': { label: 'Bình thường', cls: 'bg-success-light', icon: 'ph-check-circle' },
    'Khẩn cấp': { label: 'Khẩn cấp', cls: 'bg-danger-solid', icon: 'ph-warning-octagon' },
    'Bình thường': { label: 'Bình thường', cls: 'bg-success-light', icon: 'ph-check-circle' }
};

window.loadMyRequests = async function() {
    const tbody = document.getElementById('requestHistoryBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><i class="ph-bold ph-spinner ph-spin"></i> Đang tải...</td></tr>';

    try {
        const res = await fetch(`${API_BASE}/api/hospital/blood-request/my-list-request`, { headers: getHeaders() });
        if (res.ok) {
            const list = await res.json();
            if (list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Chưa có yêu cầu nào</td></tr>';
                return;
            }

            tbody.innerHTML = list.map(req => {
                const status = REQUEST_STATUS_MAP[req.status] || { label: req.status, cls: 'bg-light', icon: 'ph-info' };
                const summary = req.detailRequests.map(d => `<strong>${d.quantity}</strong> - ${d.bloodType} (${PRODUCT_TYPE_LABELS[d.productType] || d.productType})`).join('<br>');
                
                let actionHtml = `
                    <button class="btn btn-outline-primary btn-sm me-2" onclick="viewRequestDetail(${req.requestId})" title="Xem chi tiết">
                        <i class="ph-bold ph-eye"></i>
                    </button>`;
                
                if (req.status === 'DANG_VAN_CHUYEN') {
                    actionHtml += `
                        <button class="btn btn-primary btn-sm" onclick="viewRequestDetail(${req.requestId})" style="background-color: var(--success-color); color: white;" title="Kiểm nhận & Nhận hàng">
                            <i class="ph-bold ph-package"></i> Nhận hàng
                        </button>`;
                } else if (['DA_NHAN', 'DA_NHAN_MOT_PHAN', 'HOAN_TRA_TOAN_BO', 'HOAN_TRA_MOT_PHAN'].includes(req.status)) {
                    actionHtml = '<span class="text-secondary"><i class="ph-bold ph-check-circle"></i> Hoàn tất</span>';
                }

                const deadline = req.deadlineDate 
    ? new Date(req.deadlineDate).toLocaleDateString('vi-VN') 
    : '--';
                const prio = PRIORITY_MAP[req.priority] || { label: req.priority, cls: 'bg-success-light', icon: 'ph-check-circle' };

                return `
                    <tr>
                        <td><span class="text-mono">REQ-${req.requestId}</span></td>
                        <td>${summary}</td>
                        <td><span class="badge ${prio.cls}">${prio.label}</span></td>
                        <td>${deadline}</td>
                        <td class="status-cell">
                             <span class="badge ${status.cls}">
                                 <i class="ph-bold ${status.icon}"></i> ${status.label}
                             </span>
                        </td>
                        <td>${actionHtml}</td>
                    </tr>
                `;
}).join('');
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">Lỗi kết nối máy chủ</td></tr>';
    }
};

window.openEditRequestPage = function(data) {
    localStorage.setItem('edit_blood_request', JSON.stringify(data));
    window.location.href = 'create_request.html';
};

window.cancelBloodRequest = async function(requestId) {
    if (!confirm(`Bạn có chắc chắn muốn HỦY yêu cầu máu REQ-${requestId}?`)) return;

    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE}/api/hospital/blood-request/cancel/${requestId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            alert('Hủy yêu cầu thành công!');
            closeDetailModal();
            loadMyRequests(); // Reload history list
        } else {
            const err = await res.text();
            alert('Lỗi: ' + err);
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối máy chủ!');
    }
};

window.submitEditRequest = async function(event, requestId) {
    event.preventDefault();

    if (requestItems.length === 0) {
        alert('Vui lòng thêm ít nhất 1 chế phẩm!');
        return;
    }

    const deadlineRaw = document.getElementById('deadlineDate').value;
    if (!deadlineRaw) {
        alert('Vui lòng chọn thời gian cần (Deadline)!');
        return;
    }

    // Convert yyyy-mm-dd to dd-mm-yyyy for Backend
    const [y, m, d] = deadlineRaw.split('-');
    const deadlineDate = `${d}-${m}-${y}`;

    const priority = document.getElementById('selectedUrgency').value === 'urgent' ? 'KHAN_CAP' : 'BINH_THUONG';
    
    const payload = {
        deadlineDate: deadlineDate,
        priority: priority,
        details: requestItems
    };

    const btn = event.target.querySelector('button[type="submit"]');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Đang cập nhật...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/api/hospital/blood-request/update/${requestId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('Cập nhật yêu cầu thành công! (Thứ tự xếp hàng FIFO của bạn đã được thiết lập lại từ đầu)');
            localStorage.removeItem('edit_blood_request');
            window.location.href = 'history.html';
        } else {
            const err = await res.text();
            alert('Lỗi: ' + err);
        }
    } catch (e) {
        console.error(e);
        alert('Không thể kết nối tới máy chủ!');
    } finally {
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
};

// Auto-load history if on history page & handle edit initialization
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('requestHistoryBody')) {
        loadMyRequests();
    }

    // If on another page, clear edit request cache to prevent stuck states
    if (!document.getElementById('itemBloodType')) {
        localStorage.removeItem('edit_blood_request');
        return;
    }

    // Check if we are on create_request page and have an edit request cached
    const editReqData = localStorage.getItem('edit_blood_request');
    if (editReqData && document.getElementById('itemBloodType')) {
        try {
            const data = JSON.parse(editReqData);
            console.log("Đang nạp dữ liệu sửa yêu cầu:", data);
            
            // Update Page Headers
            const headerTitle = document.querySelector('.main-content .header h2');
            const headerDesc = document.querySelector('.main-content .header p');
            if (headerTitle) headerTitle.textContent = `Chỉnh sửa yêu cầu REQ-${data.requestId}`;
            if (headerDesc) headerDesc.textContent = "Cập nhật thông tin chi tiết và gửi phiếu yêu cầu (Sắp xếp hàng FIFO sẽ được thiết lập lại)";
            
            // Set priority
            const isUrgent = data.priority === 'KHAN_CAP' || data.priority === 'Khẩn cấp';
            const normalOpt = document.querySelector(".urgency-option:not(.emergency)");
            const urgentOpt = document.querySelector(".urgency-option.emergency");
            if (isUrgent) {
                if (normalOpt) normalOpt.classList.remove('active');
                if (urgentOpt) urgentOpt.classList.add('active');
                document.getElementById('selectedUrgency').value = 'urgent';
            } else {
                if (normalOpt) normalOpt.classList.add('active');
                if (urgentOpt) urgentOpt.classList.remove('active');
                document.getElementById('selectedUrgency').value = 'normal';
            }
            
            // Set deadline
            if (data.deadlineDate) {
                const datePart = data.deadlineDate.split('T')[0];
                document.getElementById('deadlineDate').value = datePart;
            }
            
            // Load items
            requestItems = (data.detailRequests || data.requestedItems || []).map(item => ({
                bloodType: item.bloodType,
                productType: item.productType,
                volume: item.volume,
                quantity: item.quantity
            }));
            
            renderRequestItems();
            
            // Update Submit button
            const submitBtn = document.querySelector('form button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="ph-bold ph-pencil-simple"></i> Cập nhật yêu cầu';
                submitBtn.style.backgroundColor = '#f59e0b';
                submitBtn.style.borderColor = '#f59e0b';
            }
            
            // Modify Form submission behavior
            const form = document.querySelector('form');
            if (form) {
                form.removeAttribute('onsubmit');
                form.addEventListener('submit', (e) => submitEditRequest(e, data.requestId));
            }
        } catch (e) {
            console.error("Lỗi khi nạp dữ liệu sửa đơn:", e);
        }
    }
});

async function confirmReceived(id, btn) {
    if (confirm('Xác nhận đã nhận đủ số lượng máu cho phiếu REQ-' + id + '?')) {
        try {
            const res = await fetch(`${API_BASE}/api/hospital/blood-request/track-order/${id}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ rejectedBags: [] })
            });
            if (res.ok) {
                alert('Đã cập nhật trạng thái đơn hàng!');
                loadMyRequests();
            } else {
                const err = await res.text();
                alert('Lỗi: ' + err);
            }
        } catch (e) {
            console.error(e);
            alert('Lỗi kết nối máy chủ!');
        }
    }
}

const PRODUCT_TYPE_LABELS_H = {
    'MAU_TOAN_PHAN': 'Máu toàn phần',
    'TUI_HONG_CAU':  'Hồng cầu khối',
    'TUI_HUYET_TUONG': 'Huyết tương',
    'TUI_TIEU_CAU':  'Tiểu cầu'
};

async function viewRequestDetail(id) {
    const modal = document.getElementById('requestDetailModal');
    const modalBody = document.getElementById('detailModalBody');

    document.getElementById('detailReqId').innerText = 'REQ-' + id;
    modalBody.innerHTML = `
        <div class="text-center py-5">
            <i class="ph-bold ph-spinner ph-spin" style="font-size:2.5rem; color: var(--primary-color);"></i>
            <p class="mt-3 text-muted fw-bold">Đang tải hồ sơ chi tiết...</p>
        </div>`;
    modal.classList.add('active');

    try {
        const res = await fetch(`${API_BASE}/api/shared/blood-request/detail/${id}`, { headers: getHeaders() });
        if (!res.ok) {
            const err = await res.text();
            modalBody.innerHTML = `<div class="alert alert-danger mx-3 mt-3">Lỗi: ${err}</div>`;
            return;
        }

        const data = await res.json();

        // Mapping constants
        const statusInfo = REQUEST_STATUS_MAP[data.status] || { label: data.status, cls: 'bg-light', icon: 'ph-info' };
        const deadline = data.deadlineDate ? new Date(data.deadlineDate).toLocaleDateString('vi-VN') : '--';
        const requestedAt = data.requestedDate ? new Date(data.requestedDate).toLocaleString('vi-VN') : '--';
        const prio = PRIORITY_MAP[data.priority] || { label: data.priority, cls: 'bg-success-light', icon: 'ph-check-circle' };

        let html = `
            <div class="detail-modal-body">
                <!-- Section 1: Header Info Card -->
                <div class="detail-header-card">
                    <div class="detail-info-item">
                        <div class="label">Bệnh viện yêu cầu</div>
                        <div class="value">
                            <i class="ph-bold ph-hospital text-primary"></i>
                            ${data.hospitalName}
                        </div>
                    </div>
                    <div class="detail-info-item">
                        <div class="label">Mức độ ưu tiên</div>
                        <div class="value">
                            <span class="stat-chip ${prio.cls}">
                                <i class="ph-bold ${prio.icon}"></i>
                                ${prio.label}
                            </span>
                        </div>
                    </div>
                    <div class="detail-info-item">
                        <div class="label">Trạng thái xử lý</div>
                        <div class="value">
                            <span class="stat-chip ${statusInfo.cls}">
                                <div class="status-pulse"></div>
                                ${statusInfo.label}
                            </span>
                        </div>
                    </div>
                    <div class="detail-info-item">
                        <div class="label">Thời gian gửi phiếu</div>
                        <div class="value">
                            <i class="ph-bold ph-calendar-blank text-muted"></i>
                            ${requestedAt}
                        </div>
                    </div>
                    <div class="detail-info-item" style="grid-column: span 2;">
                        <div class="label">Thời hạn cần máu (Deadline)</div>
                        <div class="value text-danger">
                            <i class="ph-bold ph-timer"></i>
                            ${deadline} 
                            <small class="fw-normal ms-2 text-muted">(Yêu cầu cung cấp trước thời gian này)</small>
                        </div>
                    </div>
                </div>

                <!-- Section 2: Items Table -->
                <div class="detail-section">
                    <div class="detail-section-title">
                        <i class="ph-bold ph-list-bullets"></i>
                        Danh mục chế phẩm yêu cầu
                    </div>
                    <table class="premium-table">
                        <thead>
                            <tr>
                                <th>Nhóm máu</th>
                                <th>Loại chế phẩm</th>
                                <th>Thể tích</th>
                                <th>Yêu cầu</th>
                                <th>Đã duyệt</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.requestedItems.map(item => `
                                <tr>
                                    <td><strong class="text-danger" style="font-size: 1.1rem;">${item.bloodType}</strong></td>
                                    <td>${PRODUCT_TYPE_LABELS_H[item.productType] || item.productType}</td>
                                    <td><span class="badge bg-light text-dark">${item.volume} ml</span></td>
                                    <td><span class="fw-bold">${item.quantity}</span> túi</td>
                                    <td>
                                        ${item.approvedQuantity != null
                                            ? `<strong class="text-primary">${item.approvedQuantity} túi</strong>`
                                            : '<span class="text-muted italic">Đang chờ...</span>'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
        `;

        // Section 3: Export Details if applicable
        const modalFooter = modal.querySelector('.modal-footer');
        const isDelivering = data.status === 'DANG_VAN_CHUYEN';

        data.exportedBags = data.exportedBags || [];
        activeExportedBags = data.exportedBags;

        if (data.exportedBags && data.exportedBags.length > 0) {
            const exportDateStr = data.exportDate ? new Date(data.exportDate).toLocaleString('vi-VN') : '--';
            
            // Group bags by type/blood/volume
            const bagGroups = groupExportedBags(data.exportedBags);
            
            html += `
                <div class="detail-section">
                    <div class="detail-section-title">
                        <i class="ph-bold ph-package"></i>
                        Thông tin kiểm nhận chế phẩm
                    </div>
                    <div class="alert alert-success py-2 px-3 mb-3" style="font-size: 0.85rem; display: flex; align-items: center; justify-content: space-between;">
                        <span><i class="ph-fill ph-check-circle"></i> Đã đóng gói và bàn giao vận chuyển</span>
                        <span class="text-muted small">${exportDateStr} | Nhân viên: ${data.exportedBy || 'N/A'}</span>
                    </div>
                    <table class="premium-table">
                        <thead>
                            <tr>
                                <th>Chế phẩm / Loại máu</th>
                                <th>Thể tích</th>
                                <th class="text-center">Số lượng giao</th>
                                <th class="text-center" style="width: 130px;">Số lượng nhận</th>
                                <th style="width: 250px;">Lý do hoàn trả (nếu từ chối)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bagGroups.map((group, index) => {
                                const bloodLabel = `${group.bloodType}${group.rhFactor}`;
                                const productLabel = PRODUCT_TYPE_LABELS_H[group.productType] || group.productType;
                                
                                if (isDelivering) {
                                    return `
                                    <tr class="bag-group-row" data-group-index="${index}">
                                        <td>
                                            <strong class="text-danger" style="font-size: 1rem;">${bloodLabel}</strong>
                                            <div class="text-muted small">${productLabel}</div>
                                        </td>
                                        <td><span class="badge bg-light text-dark">${group.volume} ml</span></td>
                                        <td class="text-center"><strong style="font-size: 1.1rem;">${group.bags.length}</strong> túi</td>
                                        <td class="text-center">
                                            <input type="number" class="form-control form-control-sm text-center received-qty-input" 
                                                   data-group-index="${index}" 
                                                   min="0" max="${group.bags.length}" 
                                                   value="${group.bags.length}" 
                                                   onchange="toggleGroupRejectReason(${index}, this)"
                                                   style="width: 80px; margin: 0 auto; font-weight: bold; border-color: var(--primary-color);">
                                        </td>
                                        <td>
                                            <div class="reject-reason-container" id="group-reject-container-${index}" style="display: none;">
                                                <select class="form-select form-select-sm group-reject-reason-select" 
                                                        style="padding: 4px 8px; font-size: 0.8rem; border-radius: 4px; border: 1px solid #d1d5db; width: 100%; -webkit-appearance: auto; appearance: auto; cursor: pointer;"
                                                        onchange="toggleGroupRejectReasonDetailField(${index}, this)">
                                                    <option value="Bao bì rách / Nứt vỡ">Bao bì rách / Nứt vỡ</option>
                                                    <option value="Quá hạn sử dụng / Hạn dùng ngắn">Quá hạn sử dụng / Hạn dùng ngắn</option>
                                                    <option value="Sai nhóm máu / Chế phẩm">Sai nhóm máu / Chế phẩm</option>
                                                    <option value="Thể tích thực tế không đạt">Thể tích thực tế không đạt</option>
                                                    <option value="Khác">Lý do khác...</option>
                                                </select>
                                                <input type="text" class="form-control form-control-sm mt-1 group-reject-reason-detail" 
                                                       id="group-reject-reason-detail-${index}" 
                                                       placeholder="Ghi chú chi tiết..." 
                                                       style="display: none; padding: 4px 8px; font-size: 0.8rem; border-radius: 4px; border: 1px solid #d1d5db; width: 100%;">
                                            </div>
                                            <span class="text-success small fw-bold" id="group-ok-label-${index}">✔ Nhận đầy đủ</span>
                                        </td>
                                    </tr>
                                    `;
                                } else {
                                    const acceptedBags = group.bags.filter(bag => bag.status !== 'CHO_KIEM_DINH' && !bag.returnReasonNote);
                                    const rejectedBags = group.bags.filter(bag => bag.status === 'CHO_KIEM_DINH' || bag.returnReasonNote);
                                    
                                    let statusHtml = '';
                                    if (rejectedBags.length > 0) {
                                        const reasons = Array.from(new Set(rejectedBags.map(b => b.returnReasonNote || 'Không đạt'))).join(', ');
                                        statusHtml = `<div class="text-danger small mt-1"><i class="ph-bold ph-warning"></i> Trả lại ${rejectedBags.length} túi (Lý do: ${reasons})</div>`;
                                    }
                                    
                                    return `
                                    <tr>
                                        <td>
                                            <strong class="text-danger" style="font-size: 1rem;">${bloodLabel}</strong>
                                            <div class="text-muted small">${productLabel}</div>
                                            ${statusHtml}
                                        </td>
                                        <td><span class="badge bg-light text-dark">${group.volume} ml</span></td>
                                        <td class="text-center">${group.bags.length} túi</td>
                                        <td class="text-center"><strong class="text-success" style="font-size: 1.1rem;">${acceptedBags.length}</strong> / ${group.bags.length}</td>
                                        <td>
                                            ${rejectedBags.length === 0 
                                                ? '<span class="badge bg-success-light text-success"><i class="ph-bold ph-check"></i> Đã nhận đủ</span>' 
                                                : (acceptedBags.length === 0 
                                                    ? '<span class="badge bg-danger-light text-danger"><i class="ph-bold ph-x"></i> Từ chối toàn bộ</span>'
                                                    : '<span class="badge bg-warning-light text-warning"><i class="ph-bold ph-check-square"></i> Nhận một phần</span>')}
                                        </td>
                                    </tr>
                                    `;
                                }
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="detail-section mt-3">
                    <div class="detail-section-title" style="font-size: 0.85rem; opacity: 0.8;">
                        <i class="ph-bold ph-barcode"></i>
                        Danh sách túi máu thực tế đi kèm (Tham khảo)
                    </div>
                    <table class="premium-table" style="font-size: 0.8rem; background-color: #fafafa; width: 100%;">
                        <thead>
                            <tr>
                                <th>Mã túi</th>
                                <th>Chế phẩm</th>
                                <th>Hạn dùng</th>
                                <th>Trạng thái kiểm nhận</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.exportedBags.map(bag => {
                                let statusInfoHtml = '';
                                if (isDelivering) {
                                    statusInfoHtml = `<span class="badge bg-primary-light text-primary">Sẵn sàng nhận</span>`;
                                } else {
                                    if (bag.status === 'CHO_KIEM_DINH' || bag.returnReasonNote) {
                                        statusInfoHtml = `<span class="badge bg-danger-light text-danger"><i class="ph-bold ph-arrow-counter-clockwise"></i> Trả lại</span>`;
                                    } else {
                                        statusInfoHtml = `<span class="badge bg-success-light text-success"><i class="ph-bold ph-check"></i> Đã nhận</span>`;
                                    }
                                }
                                return `
                                <tr>
                                    <td><span class="text-mono fw-bold">BAG-${bag.bloodBagId}</span></td>
                                    <td>${bag.bloodType}${bag.rhFactor} - ${PRODUCT_TYPE_LABELS_H[bag.productType] || bag.productType} (${bag.volume}ml)</td>
                                    <td>${new Date(bag.expiredAt).toLocaleDateString('vi-VN')}</td>
                                    <td>${statusInfoHtml}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            // Informational status messages
            let alertHtml = '';
            if (['DA_DUYET_TOAN_BO', 'DA_DUYET_MOT_PHAN'].includes(data.status)) {
                alertHtml = `
                    <div class="alert alert-info py-3 shadow-sm border-0">
                        <div class="d-flex align-items-center gap-3">
                            <i class="ph-fill ph-info" style="font-size: 1.5rem;"></i>
                            <div>
                                <div class="fw-bold">Yêu cầu đã được phê duyệt!</div>
                                <div class="small">Nhân viên kho đang chuẩn bị các túi máu phù hợp để bàn giao vận chuyển.</div>
                            </div>
                        </div>
                    </div>`;
            } else if (data.status === 'CHO_DUYET') {
                alertHtml = `
                    <div class="alert alert-secondary py-3 border-0" style="background-color: #f1f5f9;">
                        <div class="d-flex align-items-center gap-3">
                            <i class="ph-fill ph-hourglass" style="font-size: 1.5rem;"></i>
                            <div>
                                <div class="fw-bold">Đang chờ xét duyệt...</div>
                                <div class="small">Phiếu yêu cầu đã được gửi đến hệ thống điều phối trung tâm.</div>
                            </div>
                        </div>
                    </div>`;
            }
            if (alertHtml) html += `<div class="detail-section">${alertHtml}</div>`;
        }

        html += `</div>`; // Close detail-modal-body
        modalBody.innerHTML = html;

        // Dynamic footer updates
        if (modalFooter) {
            if (isDelivering) {
                modalFooter.innerHTML = `
                    <button class="btn btn-secondary" onclick="closeDetailModal()">Quay lại</button>
                    <button class="btn btn-primary" onclick="submitHospitalDeliveryResponse(${data.requestId})" style="background-color: var(--success-color); color: white; display: flex; align-items: center; gap: 6px;">
                        <i class="ph-bold ph-check"></i> Xác nhận kiểm nhận
                    </button>
                `;
            } else {
                let footerHtml = `<button class="btn btn-secondary" onclick="closeDetailModal()">Đóng</button>`;
                if (data.status === 'CHO_DUYET') {
                    // Always allow canceling pending requests
                    footerHtml += `
                        <button class="btn btn-danger text-white ms-2" onclick="cancelBloodRequest(${data.requestId})" style="background-color: #dc2626; border-color: #dc2626; color: white; margin-left: 10px; padding: 0.4rem 1rem; border-radius: 0.375rem; border: none; cursor: pointer; font-weight: 600; font-size: 0.875rem;">
                            <i class="ph-bold ph-x-circle"></i> Hủy yêu cầu
                        </button>
                    `;

                    if (data.priority === 'KHAN_CAP' || data.priority === 'Khẩn cấp') {
                        footerHtml += `<span class="text-muted small ms-2" style="font-size: 0.8rem; margin-left: 10px;"><i class="ph-bold ph-info"></i> Đơn khẩn cấp không cho phép chỉnh sửa</span>`;
                    } else if (data.isEdited) {
                        footerHtml += `<span class="text-muted small ms-2" style="font-size: 0.8rem; margin-left: 10px;"><i class="ph-bold ph-info"></i> Đơn đã chỉnh sửa 1 lần, không thể sửa tiếp</span>`;
                    } else {
                        footerHtml += `
                            <button class="btn btn-warning text-white ms-2" onclick="closeDetailModal(); openEditRequestPage(${JSON.stringify(data).replace(/"/g, '&quot;')})" style="background-color: #f59e0b; border-color: #f59e0b; color: white; margin-left: 10px; padding: 0.4rem 1rem; border-radius: 0.375rem; border: none; cursor: pointer; font-weight: 600; font-size: 0.875rem;">
                                <i class="ph-bold ph-pencil-simple"></i> Chỉnh sửa yêu cầu
                            </button>
                        `;
                    }
                }
                modalFooter.innerHTML = footerHtml;
            }
        }
        
    } catch (e) {
        console.error(e);
        modalBody.innerHTML = `
            <div class="text-center py-5 text-danger">
                <i class="ph-bold ph-warning-circle" style="font-size: 3rem;"></i>
                <p class="mt-2">Lỗi kết nối máy chủ hoặc dữ liệu không hợp lệ.</p>
            </div>`;
    }
}

function closeDetailModal() {
    const modal = document.getElementById('requestDetailModal');
    if (modal) modal.classList.remove('active');
}

window.loadDashboardStats = async function() {
    const pendingCountEl = document.getElementById('pendingCount');
    const transitCountEl = document.getElementById('transitCount');
    const recentOrdersBody = document.getElementById('recentOrdersBody');
    
    if (!pendingCountEl || !transitCountEl || !recentOrdersBody) return;
    
    try {
        const res = await fetch(`${API_BASE}/api/hospital/stats`, { headers: getHeaders() });
        if (res.ok) {
            const data = await res.json();
            
            // 1. Populate KPI Cards
            pendingCountEl.textContent = data.pendingApprovalCount || 0;
            transitCountEl.textContent = data.inTransitCount || 0;
            
            // 2. Populate Recent Orders Table
            const recentList = data.recentRequests || [];
            if (recentList.length === 0) {
                recentOrdersBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-3">Chưa có yêu cầu nào gần đây</td></tr>';
                return;
            }
            
            recentOrdersBody.innerHTML = recentList.map(req => {
                const status = REQUEST_STATUS_MAP[req.status] || { label: req.status, cls: 'bg-light', icon: 'ph-info' };
                const summary = req.detailRequests.map(d => `<strong>${d.quantity}</strong> Túi ${d.bloodType} (${PRODUCT_TYPE_LABELS[d.productType] || d.productType})`).join(', ');
                
                return `
                    <tr>
                        <td class="text-mono"><a href="history.html" style="color: var(--primary-color); text-decoration: none; font-weight: 600;">REQ-${req.requestId}</a></td>
                        <td>${summary}</td>
                        <td><span class="badge ${status.cls}">${status.label}</span></td>
                    </tr>
                `;
            }).join('');
        } else {
            recentOrdersBody.innerHTML = '<tr><td colspan="3" class="text-center text-danger py-3">Lỗi tải dữ liệu thống kê từ máy chủ</td></tr>';
        }
    } catch (e) {
        console.error(e);
        recentOrdersBody.innerHTML = '<tr><td colspan="3" class="text-center text-danger py-3">Lỗi kết nối máy chủ</td></tr>';
    }
};

window.toggleGroupRejectReason = function(groupIndex, inputEl) {
    const maxVal = parseInt(inputEl.getAttribute('max'));
    let val = parseInt(inputEl.value);
    if (isNaN(val) || val < 0) {
        val = 0;
        inputEl.value = 0;
    } else if (val > maxVal) {
        val = maxVal;
        inputEl.value = maxVal;
    }
    
    const container = document.getElementById(`group-reject-container-${groupIndex}`);
    const okLabel = document.getElementById(`group-ok-label-${groupIndex}`);
    
    if (val < maxVal) {
        if (container) container.style.display = 'block';
        if (okLabel) okLabel.style.display = 'none';
    } else {
        if (container) container.style.display = 'none';
        if (okLabel) okLabel.style.display = 'block';
    }
}

window.toggleGroupRejectReasonDetailField = function(groupIndex, selectEl) {
    const detailInput = document.getElementById(`group-reject-reason-detail-${groupIndex}`);
    if (detailInput) {
        detailInput.style.display = selectEl.value === 'Khác' ? 'block' : 'none';
    }
}

window.submitHospitalDeliveryResponse = async function(requestId) {
    const bagGroups = groupExportedBags(activeExportedBags);
    const rejectedBags = [];
    let hasValidationError = false;

    bagGroups.forEach((group, index) => {
        const qtyInput = document.querySelector(`.received-qty-input[data-group-index="${index}"]`);
        if (!qtyInput) return;

        const receivedQty = parseInt(qtyInput.value);
        const shippedQty = group.bags.length;

        if (isNaN(receivedQty) || receivedQty < 0 || receivedQty > shippedQty) {
            hasValidationError = true;
            return;
        }

        const rejectedQty = shippedQty - receivedQty;
        if (rejectedQty > 0) {
            // Pick the last rejectedQty bags to return
            const reasonSelect = document.querySelector(`#group-reject-container-${index} .group-reject-reason-select`);
            let reason = reasonSelect ? reasonSelect.value : 'Lý do khác';
            if (reason === 'Khác') {
                const detailInput = document.getElementById(`group-reject-reason-detail-${index}`);
                reason = (detailInput && detailInput.value.trim()) ? detailInput.value.trim() : 'Lý do khác';
            }

            for (let i = 0; i < rejectedQty; i++) {
                const bag = group.bags[group.bags.length - 1 - i];
                rejectedBags.push({
                    bloodBagId: bag.bloodBagId,
                    reason: reason
                });
            }
        }
    });

    if (hasValidationError) {
        alert('Vui lòng kiểm tra lại số lượng nhận hợp lệ!');
        return;
    }

    let confirmMsg = 'Xác nhận hoàn tất kiểm nhận đơn hàng?';
    if (rejectedBags.length === 0) {
        confirmMsg = 'Bạn xác nhận nhận ĐẦY ĐỦ các túi máu trong đơn hàng này?';
    } else {
        const totalBags = activeExportedBags.length;
        if (rejectedBags.length === totalBags) {
            confirmMsg = `Bạn xác nhận TỪ CHỐI/HOÀN TRẢ TOÀN BỘ (${rejectedBags.length}/${totalBags}) túi máu trong đơn hàng này?`;
        } else {
            confirmMsg = `Bạn xác nhận NHẬN MỘT PHẦN và hoàn trả ${rejectedBags.length} túi máu?`;
        }
    }

    if (!confirm(confirmMsg)) return;

    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE}/api/hospital/blood-request/track-order/${requestId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rejectedBags: rejectedBags })
        });

        if (res.ok) {
            alert('Đã cập nhật trạng thái kiểm nhận đơn hàng thành công!');
            closeDetailModal();
            loadMyRequests(); // Reload list
            if (document.getElementById('pendingCount')) {
                loadDashboardStats(); // Reload dashboard if applicable
            }
        } else {
            const err = await res.text();
            alert('Lỗi: ' + err);
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối máy chủ!');
    }
}
