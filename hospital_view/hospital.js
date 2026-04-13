/* Hospital View Logic */

const API_DEPLOY = 'https://bloodbankmanager-production.up.railway.app';
const API_BASE = API_DEPLOY;
let hospitalProfile = null;

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
        localStorage.clear();
        window.location.href = '../login.html';
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
    'DA_NHAN': { label: 'Đã nhận', cls: 'bg-success-light', icon: 'ph-check-circle' }
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
                        <button class="btn btn-primary btn-sm" onclick="confirmReceived(${req.requestId}, this)" style="background-color: var(--success-color);">
                            <i class="ph-bold ph-check"></i> Đã nhận
                        </button>`;
                } else if (req.status === 'DA_NHAN') {
                    actionHtml = '<span class="text-secondary"><i class="ph-bold ph-check-circle"></i> Hoàn tất</span>';
                }

                const deadline = req.deadlineDate ? new Date(req.deadlineDate.split('-').reverse().join('-')).toLocaleDateString('vi-VN') : '--';

                return `
                    <tr>
                        <td><span class="text-mono">REQ-${req.requestId}</span></td>
                        <td>${summary}</td>
                        <td><span class="badge ${req.priority === 'Khẩn cấp' ? 'bg-danger-solid' : 'bg-success-light'}">${req.priority}</span></td>
                        <td>${deadline}</td>
                        <td class="status-cell">
                            <span class="badge ${status.cls}">
                                <i class="ph-bold ${status.icon}"></i> ${status.label}
                            </span>
                        </td>
                        <td>${actionHtml}</td>
                    </tr>
                `;
            }).reverse().join('');
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">Lỗi kết nối máy chủ</td></tr>';
    }
};

// Auto-load history if on history page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('requestHistoryBody')) {
        loadMyRequests();
    }
});

async function confirmReceived(id, btn) {
    if (confirm('Xác nhận đã nhận đủ số lượng máu cho phiếu REQ-' + id + '?')) {
        try {
            const res = await fetch(`${API_BASE}/api/hospital/blood-request/track-order/${id}`, {
                method: 'PATCH',
                headers: getHeaders()
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
                            <span class="stat-chip ${data.priority === 'Khẩn cấp' ? 'bg-danger-solid' : 'bg-success-light'}">
                                <i class="ph-bold ${data.priority === 'Khẩn cấp' ? 'ph-warning-octagon' : 'ph-check-circle'}"></i>
                                ${data.priority}
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
        if (data.exportedBags && data.exportedBags.length > 0) {
            const exportDateStr = data.exportDate ? new Date(data.exportDate).toLocaleString('vi-VN') : '--';
            html += `
                <div class="detail-section">
                    <div class="detail-section-title">
                        <i class="ph-bold ph-package"></i>
                        Thông tin xuất kho & Vận chuyển
                    </div>
                    <div class="alert alert-success py-2 px-3 mb-3" style="font-size: 0.85rem; display: flex; align-items: center; justify-content: space-between;">
                        <span><i class="ph-fill ph-check-circle"></i> Đã đóng gói và bàn giao vận chuyển</span>
                        <span class="text-muted small">${exportDateStr} | Nhân viên: ${data.exportedBy || 'N/A'}</span>
                    </div>
                    <table class="premium-table">
                        <thead>
                            <tr>
                                <th>Mã túi</th>
                                <th>Chế phẩm</th>
                                <th>Hạn dùng</th>
                                <th>Vị trí lưu trữ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.exportedBags.map(bag => `
                                <tr>
                                    <td><span class="text-mono fw-bold text-primary">BAG-${bag.bloodBagId}</span></td>
                                    <td style="font-size: 0.8rem;">
                                        <div class="fw-bold text-danger">${bag.bloodType}${bag.rhFactor}</div>
                                        <div>${PRODUCT_TYPE_LABELS_H[bag.productType] || bag.productType} (${bag.volume}ml)</div>
                                    </td>
                                    <td class="${new Date(bag.expiredAt) < new Date() ? 'text-danger fw-bold' : ''}">
                                        ${new Date(bag.expiredAt).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td><span class="text-muted small"><i class="ph-bold ph-map-pin"></i> ${bag.storageLocation}</span></td>
                                </tr>
                            `).join('')}
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
