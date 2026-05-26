<<<<<<< Updated upstream

=======
window.API_BASE = window.API_BASE || 'http://localhost:8080';
window.API_DEPLOY = window.API_DEPLOY || 'http://localhost:8080';
>>>>>>> Stashed changes
/* Staff View Logic */

// --- Visitor Phones Set: lưu số điện thoại để nhận diện cực kỳ chính xác ---
function _loadVisitorPhones() {
    try { return new Set(JSON.parse(sessionStorage.getItem('visitorPhones') || '[]')); }
    catch(e) { return new Set(); }
}
function _saveVisitorPhones(set) {
    try { sessionStorage.setItem('visitorPhones', JSON.stringify([...set])); } catch(e) {}
}
const visitorPhones = _loadVisitorPhones();


// Map lưu kết quả khám sàng lọc đã nhập, key = regisId (không cần API GET)
const screeningCache = new Map();


// Keep simplified inline helpers if not moved
function fractionateBlood(id) {
    if (confirm('Xác nhận tách chiết túi máu ' + id + ' thành 3 chế phẩm?')) {
        alert('Đã tách chiết thành công!');
    }
}

// ==================== BLOOD BAG MANAGEMENT ====================

const BLOOD_STATUS_MAP = {
    // Trước xét nghiệm
    'CHO_XET_NGHIEM': { label: 'Chờ xét nghiệm', cls: 'background:#fef3c7;color:#d97706;' },
    'CHO_TACH_CHIET': { label: 'Chờ tách chiết', cls: 'background:#e0e7ff;color:#4338ca;' },
    // Kết quả XN
    'SACH':           { label: 'Sạch / An toàn', cls: 'background:#dcfce7;color:#16a34a;' },
    'NHIEM':          { label: 'Nhiễm bệnh', cls: 'background:#fee2e2;color:#dc2626;' },
    // Sau tách chiết
    'CHO_NHAP_KHO':   { label: 'Chờ nhập kho', cls: 'background:#f0fdf4;color:#15803d;' },
    'CHO_BAO_QUAN':   { label: 'Chờ bảo quản', cls: 'background:#fff7ed;color:#c2410c;' },
    'TRONG_KHO':      { label: 'Trong kho', cls: 'background:#f0f9ff;color:#0284c7;' },
    'SAN_SANG':       { label: 'Sẵn sàng', cls: 'background:#dcfce7;color:#15803d;' },
    // Cuối vòng đời
    'CHO_HUY':        { label: 'Chờ hủy', cls: 'background:#fce7f3;color:#be185d;' },
    'DA_HUY':         { label: 'Đã hủy', cls: 'background:#f3f4f6;color:#6b7280;' },
    'DA_SU_DUNG':     { label: 'Đã sử dụng', cls: 'background:#ede9fe;color:#6d28d9;' },
    'HET_HAN':        { label: 'Hết hạn', cls: 'background:#fff1f2;color:#9f1239;' },
};

const PRODUCT_TYPE_MAP = {
    // Máu toàn phần
    'MAU_TOAN_PHAN':  'Máu toàn phần',
    // Chế phẩm túi
    'TUI_HONG_CAU':   'Túi hồng cầu',
    'TUI_HUYET_TUONG':'Túi huyết tương',
    'TUI_TIEU_CAU':   'Túi tiểu cầu',
    // Chế phẩm không túi
    'HONG_CAU':       'Hồng cầu khối',
    'HUYET_TUONG':    'Huyết tương',
    'TIEU_CAU':       'Tiểu cầu',
};

let currentTestBagId = null; // ID túi máu đang nhập xét nghiệm

// Tải danh sách túi máu từ API
window.loadBloodBags = async function() {
    const tbody = document.getElementById('technicalTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><i class="ph-bold ph-spinner" style="animation: spin 1s linear infinite;"></i> Đang tải...</td></tr>';

    const bloodType = document.getElementById('filterBloodType')?.value || '';
    const rhFactor  = document.getElementById('filterRhFactor')?.value || '';
    const productType = document.getElementById('filterProductType')?.value || '';
    const status    = document.getElementById('filterStatus')?.value || '';

    const params = new URLSearchParams();
    if (bloodType)   params.append('bloodType', bloodType);
    if (rhFactor)    params.append('rhFactor', rhFactor);
    if (productType) params.append('productType', productType);
    if (status)      params.append('status', status);

    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE}/api/staff/bloodbag/get-list-blood-bag?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const err = await res.text();
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">Lỗi tải dữ liệu: ${err}</td></tr>`;
            return;
        }

        const bags = await res.json();

        if (!bags || bags.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Không có túi máu nào phù hợp</td></tr>';
            return;
        }

        let html = '';
        bags.forEach(bag => {
            const st = BLOOD_STATUS_MAP[bag.status] || { label: bag.status || '--', cls: 'background:#e5e7eb; color:#374151;' };
            const bloodLabel = bag.bloodType ? `${bag.bloodType}${bag.rhFactor || ''}` : '--';
            const productLabel = PRODUCT_TYPE_MAP[bag.productType] || bag.productType || '--';
            const collectedAt = bag.collectedAt ? new Date(bag.collectedAt).toLocaleString('vi-VN') : '--';
            const location = bag.storageLocation || 'Chưa vào kho';

            // Buttons dựa trên status
            let actionBtns = `
                <button class="btn btn-light border" style="padding:0.35rem;" title="Xem chi tiết"
                    onclick="openBagDetailsModal(${bag.bloodBagId})">
                    <i class="ph-bold ph-eye"></i>
                </button>`;

            // 1. Nhập/Sửa kết quả xét nghiệm (Chờ xét nghiệm, Chờ hủy, Chờ tách chiết)
            if (['CHO_XET_NGHIEM', 'CHO_HUY', 'CHO_TACH_CHIET'].includes(bag.status)) {
                actionBtns += `
                <button class="btn btn-secondary" style="padding:0.35rem;" title="Nhập KQ Xét nghiệm"
                    onclick="openTestModal(${bag.bloodBagId})">
                    <i class="ph-bold ph-test-tube"></i>
                </button>`;
            }

            // 2. Gửi mail (Chờ tách chiết)
            if (bag.status === 'CHO_TACH_CHIET') {
                actionBtns += `
                <button class="btn btn-light border" style="padding:0.35rem; color:#2563eb;" title="Gửi email kết quả XN"
                    onclick="sendEmailForBag(${bag.bloodBagId})">
                    <i class="ph-bold ph-envelope-simple"></i>
                </button>`;
            }

            // 3. Tách chiết chế phẩm (Chỉ cho Máu toàn phần chờ tách chiết)
            if (bag.status === 'CHO_TACH_CHIET' && bag.productType === 'MAU_TOAN_PHAN') {
                actionBtns += `
                <button class="btn btn-primary" style="padding:0.35rem;" title="Tách chiết chế phẩm"
                    onclick="openFractionationModal(${bag.bloodBagId})">
                    <i class="ph-bold ph-columns"></i>
                </button>`;
            }

            // 4. In nhãn túi máu (Chỉ cho chờ in nhãn)
            if (bag.status === 'CHO_IN_NHAN') {
                actionBtns += `
                <button class="btn btn-light border" style="padding:0.35rem; color:#7c3aed;" title="In nhãn túi máu"
                    onclick="printBloodBagLabel(${bag.bloodBagId})">
                    <i class="ph-bold ph-printer"></i>
                </button>`;
            }

            html += `
            <tr data-status="${bag.status}">
                <td style="text-align:center;">
                    <input type="checkbox" class="row-checkbox" value="${bag.bloodBagId}" onchange="checkBulkTechnicalBtnState()">
                </td>
                <td><span class="text-mono" style="font-weight:600;">#${bag.bloodBagId}</span></td>
                <td class="text-center" style="text-align:center;">
                    <span class="badge" style="font-size:0.85rem; font-weight:700; color:#dc2626; background:#fee2e2;">
                        ${bloodLabel}
                    </span>
                </td>
                <td>${productLabel}</td>
                <td>${collectedAt}</td>
                <td>${location}</td>
                <td><span class="badge" style="${st.cls} padding: 0.25rem 0.6rem; border-radius: 0.375rem;">${st.label}</span></td>
                <td>
                    <div class="technical-actions" style="display:flex; gap:0.25rem;">
                        ${actionBtns}
                    </div>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
        checkBulkTechnicalBtnState();

    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger py-4">Lỗi kết nối tới server</td></tr>';
    } finally {
        // Reset bulk dispose button state to ensure it's not stuck
        const disposeBtn = document.getElementById('bulkDisposeBtn');
        if (disposeBtn && (disposeBtn.innerHTML.includes('Đang') || disposeBtn.disabled)) {
            disposeBtn.innerHTML = '<i class="ph-bold ph-trash text-danger"></i> Hủy hàng loạt';
            disposeBtn.disabled = true; // Still disabled because selectAll was cleared
        }
    }
};

// Mở modal nhập xét nghiệm
window.openTestModal = function(bloodBagId) {
    currentTestBagId = bloodBagId;
    const modal = document.getElementById('testModal');
    const titleId = document.getElementById('testBagId');
    if (titleId) titleId.textContent = '#' + bloodBagId;

    // Reset physical error switch
    const physicalSwitch = document.getElementById('isPhysicalErrorSwitch');
    if (physicalSwitch) {
        physicalSwitch.checked = false;
        if (typeof togglePhysicalError === 'function') togglePhysicalError(physicalSwitch);
    }

    // Reset form
    document.querySelectorAll('input[name="aboType"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[name="rhType"]').forEach(r => r.checked = false);
    ['testHIV', 'testHBV', 'testHCV', 'testSyphilis', 'testMalaria'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.checked = false; updateTestConclusion(el); }
    });
    updateTestConclusion(null); // reset kết luận

    if (modal) modal.classList.add('active');
};

// Lưu kết quả xét nghiệm - gọi API (hỗ trợ forceUpdate)
window.saveTestResult = async function(forceUpdate = false) {
    if (!currentTestBagId) {
        alert('Không xác định được túi máu!');
        return;
    }

    const physicalSwitch = document.getElementById('isPhysicalErrorSwitch');
    const isPhysicalError = physicalSwitch && physicalSwitch.checked;

    let payload = {};

    if (isPhysicalError) {
        payload = {
            bloodType: null,
            rhFactor: null,
            hiv:      'CHUA_CO',
            hbv:      'CHUA_CO',
            hcv:      'CHUA_CO',
            syphilis: 'CHUA_CO',
            malaria:  'CHUA_CO',
            isPhysicalError: true
        };
    } else {
        const aboEl = document.querySelector('input[name="aboType"]:checked');
        const rhEl  = document.querySelector('input[name="rhType"]:checked');

        if (!aboEl || !rhEl) {
            alert('Vui lòng chọn đầy đủ Nhóm máu ABO và Rh!');
            return;
        }

        const getResult = (id) => {
            const el = document.getElementById(id);
            return el && el.checked ? 'DUONG_TINH' : 'AM_TINH';
        };

        payload = {
            bloodType: aboEl.value,
            rhFactor: rhEl.value,
            hiv:      getResult('testHIV'),
            hbv:      getResult('testHBV'),
            hcv:      getResult('testHCV'),
            syphilis: getResult('testSyphilis'),
            malaria:  getResult('testMalaria'),
            isPhysicalError: false
        };
    }

    const token = localStorage.getItem('access_token');
    const saveBtn = document.getElementById('saveTestBtn');
    const oldText = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) { saveBtn.innerHTML = 'Đang lưu...'; saveBtn.disabled = true; }

    try {
        const url = `${API_BASE}/api/staff/bloodbag/test-result/${currentTestBagId}?forceUpdate=${forceUpdate}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            document.getElementById('testModal').classList.remove('active');
            if (typeof showToast === 'function') showToast('Lưu kết quả xét nghiệm thành công!', 'success');
            loadBloodBags();
            // Nếu là cập nhật lại (forceUpdate) thì hỏi gửi email lại
            if (forceUpdate) {
                setTimeout(() => {
                    const doEmail = confirm('Kết quả xét nghiệm đã được cập nhật.\nBạn có muốn gửi email thông báo lại cho người hiến không?');
                    if (doEmail) sendEmailForBag(currentTestBagId, true);
                }, 300);
            }
        } else {
            const errText = await res.text();
            // Nếu BE trả về lỗi "Đã có kết quả" thì hỏi xác nhận
            if (errText.includes('đã có') || errText.includes('already') || errText.toLowerCase().includes('exist')) {
                const doForce = confirm('⚠️ Túi máu này đã có kết quả xét nghiệm.\nBạn có muốn cập nhật lại không?');
                if (doForce) {
                    if (saveBtn) { saveBtn.innerHTML = oldText; saveBtn.disabled = false; }
                    await window.saveTestResult(true); // gọi lại với forceUpdate=true
                    return;
                }
            } else {
                alert('Lỗi: ' + errText);
            }
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối server!');
    } finally {
        if (saveBtn) { saveBtn.innerHTML = oldText; saveBtn.disabled = false; }
    }
};

let currentFracBagId = null;
window.openFractionationModal = async function(id) {
    currentFracBagId = id;
    const modal = document.getElementById('fractionationModal');
    if (!modal) return;

    // Reset inputs
    document.getElementById('fracRedCell').value = '';
    document.getElementById('fracPlasma').value = '';
    document.getElementById('fracPlatelets').value = '';
    document.getElementById('fracBagId').textContent = '#' + id;
    document.getElementById('fracParentVolume').textContent = '...';

    modal.classList.add('active');

    // Fetch details to get volume
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE}/api/staff/bloodbag/get-blood-bag-detail/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            document.getElementById('fracParentVolume').textContent = data.actualVolume || '--';
        }
    } catch (e) {
        console.error(e);
    }
};

window.saveFractionation = async function(overrideReason = null) {
    if (!currentFracBagId) return;

    const redCell   = parseInt(document.getElementById('fracRedCell').value) || 0;
    const plasma    = parseInt(document.getElementById('fracPlasma').value) || 0;
    const platelets = parseInt(document.getElementById('fracPlatelets').value) || 0;

    const payload = {
        redCellVolume:   redCell,
        plasmaVolume:    plasma,
        plateletsVolume: platelets
    };
    if (overrideReason) {
        payload.overrideReason = overrideReason;
    }

    const token = localStorage.getItem('access_token');
    const saveBtn = document.getElementById('saveFracBtn');
    const oldText = saveBtn.innerHTML;

    saveBtn.innerHTML = '<i class="ph-bold ph-spinner-gap spin"></i> Đang lưu...';
    saveBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/api/staff/bloodbag/separate-blood/${currentFracBagId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            if (typeof showToast === 'function') showToast('Tách chiết chế phẩm thành công!', 'success');
            document.getElementById('fractionationModal').classList.remove('active');
            loadBloodBags();
        } else {
            const errText = await res.text();

            // Kiểm tra nếu BE báo lỗi dung tích thấp hơn mức quy định
            const isLowVolumeError = (
                res.status === 422 || res.status === 400 ||
                errText.toLowerCase().includes('dung tích') ||
                errText.toLowerCase().includes('volume') ||
                errText.toLowerCase().includes('thấp hơn') ||
                errText.toLowerCase().includes('below') ||
                errText.toLowerCase().includes('minimum') ||
                errText.toLowerCase().includes('tối thiểu') ||
                errText.toLowerCase().includes('override')
            );

            if (isLowVolumeError && !overrideReason) {
                // Đóng loading, mở modal nhập lý do
                saveBtn.innerHTML = oldText;
                saveBtn.disabled = false;
                openOverrideReasonModal(errText, redCell, plasma, platelets);
            } else {
                if (typeof showToast === 'function') showToast('Lỗi: ' + errText, 'error');
                else alert('Lỗi: ' + errText);
            }
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối server!');
    } finally {
        saveBtn.innerHTML = oldText;
        saveBtn.disabled = false;
    }
};

// Mở modal cảnh báo dung tích thấp và yêu cầu nhập lý do
function openOverrideReasonModal(serverMsg, redCell, plasma, platelets) {
    const modal = document.getElementById('overrideReasonModal');
    if (!modal) return;

    // Điền nội dung cảnh báo từ server (hoặc fallback)
    const msgEl = document.getElementById('overrideWarningMsg');
    if (msgEl) {
        msgEl.innerHTML = `
            <strong>⚠️ Phát hiện ngoại lệ dung tích:</strong><br>
            ${serverMsg || 'Một hoặc nhiều chế phẩm thu được có dung tích thấp hơn mức quy định tối thiểu.'}
            <br><br>
            <em>Nếu có lý do hợp lệ (ví dụ: người hiến có Hct thấp, thể trạng đặc biệt...), bạn có thể ghi nhận lý do để tiếp tục xử lý.</em>`;
    }

    // Hiển thị tóm tắt thể tích đã nhập
    const summaryEl = document.getElementById('overrideVolumeSummary');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <div style="font-weight:600; margin-bottom:0.4rem; color:#475569;">📋 Dung tích đã nhập:</div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.5rem; text-align:center;">
                <div style="background:#fee2e2; border-radius:0.4rem; padding:0.4rem;">
                    <div style="font-size:0.75rem; color:#dc2626;">🔴 Hồng cầu</div>
                    <div style="font-weight:700; color:#991b1b;">${redCell} ml</div>
                </div>
                <div style="background:#ede9fe; border-radius:0.4rem; padding:0.4rem;">
                    <div style="font-size:0.75rem; color:#7c3aed;">🟣 Huyết tương</div>
                    <div style="font-weight:700; color:#5b21b6;">${plasma} ml</div>
                </div>
                <div style="background:#fef9c3; border-radius:0.4rem; padding:0.4rem;">
                    <div style="font-size:0.75rem; color:#ca8a04;">🟡 Tiểu cầu</div>
                    <div style="font-weight:700; color:#854d0e;">${platelets} ml</div>
                </div>
            </div>`;
    }

    // Reset textarea
    const reasonInput = document.getElementById('overrideReasonInput');
    if (reasonInput) reasonInput.value = '';

    modal.classList.add('active');
}

// Xác nhận tách chiết với overrideReason
window.confirmFractionationWithOverride = async function() {
    const reasonInput = document.getElementById('overrideReasonInput');
    const reason = reasonInput ? reasonInput.value.trim() : '';

    if (!reason) {
        reasonInput.style.borderColor = '#dc2626';
        reasonInput.focus();
        if (typeof showToast === 'function') showToast('Vui lòng nhập lý do ngoại lệ!', 'warning');
        else alert('Vui lòng nhập lý do ngoại lệ!');
        return;
    }

    // Đổi màu border về bình thường
    if (reasonInput) reasonInput.style.borderColor = '#f59e0b';

    // Đóng modal override
    const overrideModal = document.getElementById('overrideReasonModal');
    if (overrideModal) overrideModal.classList.remove('active');

    // Gọi lại saveFractionation với overrideReason
    await window.saveFractionation(reason);
};

// Đóng modal override reason
window.closeOverrideModal = function() {
    const modal = document.getElementById('overrideReasonModal');
    if (modal) modal.classList.remove('active');
};


// Gửi email kết quả xét nghiệm - POST /bloodbag/send-mail/{bloodBagId}?forceResend=false
window.sendEmailForBag = async function(bloodBagId, forceResend = false) {
    if (!forceResend) {
        const confirmed = confirm(`Gửi email kết quả xét nghiệm cho túi máu #${bloodBagId}?`);
        if (!confirmed) return;
    }
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE}/api/staff/bloodbag/send-mail/${bloodBagId}?forceResend=${forceResend}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            if (typeof showToast === 'function') showToast('Đã gửi email kết quả xét nghiệm!', 'success');
        } else {
            const err = await res.text();
            alert('Lỗi gửi email: ' + err);
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối server!');
    }
};

// In nhãn túi máu - POST /api/staff/bloodbag/print-label/{bloodBagId}
window.printBloodBagLabel = async function(bloodBagId) {
    // Hỏi xác nhận trước khi gọi API (vì API sẽ đổi trạng thái túi máu)
    const confirmed = confirm(`Xác nhận in nhãn túi máu #${bloodBagId}?\n\nThao tác này sẽ cập nhật trạng thái của túi máu.`);
    if (!confirmed) return;

    const token = localStorage.getItem('access_token');
    try {
        if (typeof showToast === 'function') showToast(`Đang tải nhãn túi máu #${bloodBagId}...`, 'info');


        const res = await fetch(`${API_BASE}/api/staff/bloodbag/print-label/${bloodBagId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const err = await res.text();
            alert('Lỗi tải nhãn: ' + err);
            return;
        }

        // Đọc JSON thay vì blob
        const data = await res.json();

        // Ghép chuỗi Base64 barcode
        const barcodeBase64 = data.barCodeBag || data.barcode || data.barcodeBase64 || '';
        const bagCode      = data.bagCode || data.bloodBagCode || `#${bloodBagId}`;
        const bloodType    = (data.bloodType || '') + (data.rhFactor || '');
        const productType  = data.productType || data.product || '';
        const volume       = data.volume || data.actualVolume || '';
        const donorName    = data.donorName || data.DonorName || '';
        const collectedAt  = data.collectedAt  ? new Date(data.collectedAt).toLocaleDateString('vi-VN')  : '';
        const expiredAt    = data.expirationDate ? new Date(data.expirationDate).toLocaleDateString('vi-VN') : '';

        // HTML nhãn in
        const labelHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Nhãn túi máu ${bagCode}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Arial', sans-serif;
            background: #fff;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 16px;
        }
        .label {
            width: 90mm;
            border: 2px solid #c0392b;
            border-radius: 8px;
            overflow: hidden;
            page-break-inside: avoid;
        }
        .label-header {
            background: #c0392b;
            color: #fff;
            text-align: center;
            padding: 8px 12px;
        }
        .label-header h1 {
            font-size: 22pt;
            font-weight: 900;
            letter-spacing: 2px;
        }
        .label-header p {
            font-size: 9pt;
            opacity: 0.9;
            margin-top: 2px;
        }
        .label-body {
            padding: 10px 14px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 0;
            border-bottom: 1px solid #f0f0f0;
            font-size: 9pt;
        }
        .info-row:last-child { border-bottom: none; }
        .info-row .lbl { color: #666; }
        .info-row .val { font-weight: 700; color: #111; text-align: right; }
        .barcode-section {
            text-align: center;
            padding: 10px 0 8px;
            border-top: 1px dashed #ddd;
            margin-top: 8px;
        }
        .barcode-section img { max-width: 100%; height: 60px; }
        .barcode-section span { font-size: 8pt; color: #555; display: block; margin-top: 4px; }
        .label-footer {
            background: #fff8f8;
            text-align: center;
            padding: 5px;
            font-size: 7.5pt;
            color: #c0392b;
            border-top: 1px solid #f9d6d6;
        }
        @media print {
            body { padding: 0; }
            .label { border-radius: 0; }
        }
    </style>
</head>
<body>
<div class="label">
    <div class="label-header">
        <h1>${bloodType || '?'}</h1>
        <p>🩸 Nhãn túi máu &nbsp;|&nbsp; BloodBank</p>
    </div>
    <div class="label-body">
        <div class="info-row">
            <span class="lbl">Mã túi</span>
            <span class="val">${bagCode}</span>
        </div>
        ${productType ? `<div class="info-row">
            <span class="lbl">Chế phẩm</span>
            <span class="val">${productType}</span>
        </div>` : ''}
        ${volume ? `<div class="info-row">
            <span class="lbl">Thể tích</span>
            <span class="val">${volume} ml</span>
        </div>` : ''}
        ${donorName ? `<div class="info-row">
            <span class="lbl">Người hiến</span>
            <span class="val">${donorName}</span>
        </div>` : ''}
        ${collectedAt ? `<div class="info-row">
            <span class="lbl">Ngày lấy</span>
            <span class="val">${collectedAt}</span>
        </div>` : ''}
        ${expiredAt ? `<div class="info-row">
            <span class="lbl">Hạn sử dụng</span>
            <span class="val" style="color:#c0392b;">${expiredAt}</span>
        </div>` : ''}

        ${barcodeBase64 ? `
        <div class="barcode-section">
            <img src="data:image/png;base64,${barcodeBase64}" alt="Mã vạch túi máu" />
            <span>${bagCode}</span>
        </div>` : ''}
    </div>
    <div class="label-footer">
        ⚠️ Bảo quản đúng quy trình &nbsp;|&nbsp; Chỉ dùng 1 lần
    </div>
</div>
<script>
    window.onload = function() { window.print(); };
<\/script>
</body>
</html>`;

        // Mở popup và render nhãn
        const win = window.open('', '_blank', 'width=420,height=600,scrollbars=yes');
        if (win) {
            win.document.write(labelHtml);
            win.document.close();
            if (typeof showToast === 'function') showToast(`Đã mở nhãn túi máu ${bagCode} để in!`, 'success');
        } else {
            alert('Vui lòng cho phép popup trong trình duyệt để in nhãn!\n(Tìm biểu tượng chặn popup ở thanh địa chỉ)');
        }

    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối server khi in nhãn!');
    }
};


// Kiểm tra checkbox để bật/tắt nút Hủy/Lưu kho/Chuyển tủ/Khôi phục hàng loạt
window.checkBulkTechnicalBtnState = function() {
    const checked = document.querySelectorAll('#technicalTableBody .row-checkbox:checked');
    const disposeBtn = document.getElementById('bulkDisposeBtn');
    const storeBtn = document.getElementById('bulkStoreBtn');
    const transferBtn = document.getElementById('bulkTransferBtn');
    const undoDiscardBtn = document.getElementById('bulkUndoDiscardBtn');
    const dropdownBtn = document.getElementById('bulkDropdownBtn');
    
    const hasChecked = checked.length > 0;
    if (disposeBtn) disposeBtn.disabled = !hasChecked;
    if (storeBtn) storeBtn.disabled = !hasChecked;
    if (transferBtn) transferBtn.disabled = !hasChecked;
    if (undoDiscardBtn) undoDiscardBtn.disabled = !hasChecked;
    if (dropdownBtn) {
        dropdownBtn.disabled = !hasChecked;
        if (!hasChecked) {
            window.closeBulkDropdown();
        }
    }
};

// Dropdown toggle & close functions for bulk actions dropdown
window.toggleBulkDropdown = function(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('bulkDropdownMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
};

window.closeBulkDropdown = function() {
    const menu = document.getElementById('bulkDropdownMenu');
    if (menu) {
        menu.classList.remove('active');
    }
};

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('bulkDropdown');
    if (dropdown && !dropdown.contains(event.target)) {
        window.closeBulkDropdown();
    }
});

// Chọn tất cả checkbox kỹ thuật
window.toggleAllTechnicalCB = function(masterCb) {
    document.querySelectorAll('#technicalTableBody .row-checkbox').forEach(cb => cb.checked = masterCb.checked);
    checkBulkTechnicalBtnState();
};

// Mở xác nhận Hủy hàng loạt và gọi API
window.openBulkDisposalModal = function() {
    const checked = document.querySelectorAll('#technicalTableBody .row-checkbox:checked');
    if (checked.length === 0) {
        alert('Vui lòng chọn ít nhất 1 túi máu!');
        return;
    }
    const ids = Array.from(checked).map(cb => cb.value);
    const confirmed = confirm(
        `Bạn có chắc chắn muốn HỦY ${ids.length} túi máu?\n` +
        ids.map(id => `  - Túi #${id}`).join('\n') +
        '\n\nHành động này không thể hoàn tác!'
    );
    if (confirmed) bulkDiscardBloodBags(ids);
};

let currentStoreBagIds = [];

window.openBulkStoreModal = async function() {
    const checked = document.querySelectorAll('#technicalTableBody .row-checkbox:checked');
    if (checked.length === 0) {
        if (typeof showToast === 'function') showToast('Vui lòng chọn ít nhất 1 túi máu!', 'warning');
        return;
    }

    currentStoreBagIds = Array.from(checked).map(cb => parseInt(cb.value));
    
    // Update Modal UI
    const countEl = document.getElementById('storeBagCount');
    const idsEl = document.getElementById('storeBagIds');
    if (countEl) countEl.textContent = currentStoreBagIds.length;
    if (idsEl) idsEl.textContent = currentStoreBagIds.map(id => '#' + id).join(', ');
    
    const modal = document.getElementById('storeModal');
    if (modal) modal.classList.add('active');

    // Fetch storage equipment
    const select = document.getElementById('storageSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Đang tải... --</option>';
    
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE}/api/staff/storage-equipment/active`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const list = await res.json();
            let opts = '<option value="">-- Chọn tủ bảo quản --</option>';
            list.forEach(eq => {
                opts += `<option value="${eq.equipmentId}">${eq.name} (${eq.productType} - Còn trống: ${eq.maxCapacity - (eq.currentLoad || 0)})</option>`;
            });
            select.innerHTML = opts;
        } else {
            select.innerHTML = '<option value="">Lỗi tải danh sách thiết bị</option>';
        }
    } catch (e) {
        console.error(e);
        select.innerHTML = '<option value="">Lỗi kết nối server</option>';
    }
};

window.confirmBulkStore = async function() {
    const equipId = document.getElementById('storageSelect').value;
    if (!equipId) {
        alert('Vui lòng chọn tủ bảo quản!');
        return;
    }

    const token = localStorage.getItem('access_token');
    const btn = document.getElementById('confirmStoreBtn');
    const oldText = btn ? btn.innerHTML : '';

    if (btn) {
        btn.innerHTML = '<i class="ph-bold ph-spinner-gap spin"></i> Đang xử lý...';
        btn.disabled = true;
    }

    try {
        const res = await fetch(`${API_BASE}/api/staff/bloodbag/store-blood/${equipId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentStoreBagIds)
        });

        if (res.ok) {
            const msg = await res.text();
            if (typeof showToast === 'function') showToast(msg || 'Lưu kho thành công!', 'success');
            document.getElementById('storeModal').classList.remove('active');
            
            // Uncheck all
            const masterCb = document.getElementById('selectAllTechnical');
            if (masterCb) masterCb.checked = false;
            
            loadBloodBags();
        } else {
            const err = await res.text();
            alert('Lỗi lưu kho: ' + err);
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối server!');
    } finally {
        if (btn) {
            btn.innerHTML = oldText;
            btn.disabled = false;
        }
    }
};

// Thực hiện Hủy hàng loạt - PATCH /bloodbag/discard-blood với body [id1, id2,...]
async function bulkDiscardBloodBags(idArray) {
    const token = localStorage.getItem('access_token');
    const disposeBtn = document.getElementById('bulkDisposeBtn');
    const oldText = disposeBtn ? disposeBtn.innerHTML : '<i class="ph-bold ph-trash"></i> Hủy hàng loạt';
    
    if (disposeBtn) { 
        disposeBtn.innerHTML = '<i class="ph-bold ph-spinner-gap spin"></i> Đang hủy...'; 
        disposeBtn.disabled = true; 
    }

    try {
        const res = await fetch(`${API_BASE}/api/staff/bloodbag/discard-blood`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(idArray.map(Number))
        });

        if (res.ok) {
            const msg = await res.text();
            if (typeof showToast === 'function') showToast(msg || `Đã hủy thành công ${idArray.length} túi máu!`, 'success');
            
            const masterCb = document.getElementById('selectAllTechnical');
            if (masterCb) masterCb.checked = false;
            
            loadBloodBags();
        } else {
            const err = await res.text();
            alert('Lỗi khi hủy: ' + err);
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối server!');
    } finally {
        if (disposeBtn) { 
            disposeBtn.innerHTML = oldText; 
            disposeBtn.disabled = false; 
            checkBulkTechnicalBtnState(); 
        }
    }
}

// ==========================================
// THÊM MỚI: CHUYỂN TỦ HÀNG LOẠT, KHÔI PHỤC, BÁO HỎNG
// ==========================================
let currentTransferBagIds = [];

window.openBulkTransferModal = async function() {
    const checked = document.querySelectorAll('#technicalTableBody .row-checkbox:checked');
    if (checked.length === 0) {
        if (typeof showToast === 'function') showToast('Vui lòng chọn ít nhất 1 túi máu!', 'warning');
        return;
    }

    currentTransferBagIds = Array.from(checked).map(cb => parseInt(cb.value));
    
    // Update Modal UI
    const countEl = document.getElementById('transferBagCount');
    const idsEl = document.getElementById('transferBagIds');
    if (countEl) countEl.textContent = currentTransferBagIds.length;
    if (idsEl) idsEl.textContent = currentTransferBagIds.map(id => '#' + id).join(', ');
    
    const modal = document.getElementById('transferModal');
    if (modal) modal.classList.add('active');

    // Fetch active storage equipment
    const select = document.getElementById('transferStorageSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Đang tải... --</option>';
    
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE}/api/staff/storage-equipment/active`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const list = await res.json();
            let opts = '<option value="">-- Chọn tủ bảo quản đích --</option>';
            list.forEach(eq => {
                opts += `<option value="${eq.equipmentId}">${eq.name} (${eq.productType} - Còn trống: ${eq.maxCapacity - (eq.currentLoad || 0)})</option>`;
            });
            select.innerHTML = opts;
        } else {
            select.innerHTML = '<option value="">Lỗi tải danh sách thiết bị</option>';
        }
    } catch (e) {
        console.error(e);
        select.innerHTML = '<option value="">Lỗi kết nối server</option>';
    }
};

window.confirmBulkTransfer = async function() {
    const equipId = document.getElementById('transferStorageSelect').value;
    if (!equipId) {
        alert('Vui lòng chọn tủ bảo quản đích!');
        return;
    }

    const token = localStorage.getItem('access_token');
    const btn = document.getElementById('confirmTransferBtn');
    const oldText = btn ? btn.innerHTML : '';

    if (btn) {
        btn.innerHTML = '<i class="ph-bold ph-spinner-gap spin"></i> Đang xử lý...';
        btn.disabled = true;
    }

    try {
        const res = await fetch(`${API_BASE}/api/staff/bloodbag/transfer-storage/${equipId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentTransferBagIds)
        });

        if (res.ok) {
            const msg = await res.text();
            if (typeof showToast === 'function') showToast(msg || 'Chuyển tủ thành công!', 'success');
            document.getElementById('transferModal').classList.remove('active');
            
            // Uncheck all
            const masterCb = document.getElementById('selectAllTechnical');
            if (masterCb) masterCb.checked = false;
            
            loadBloodBags();
        } else {
            const err = await res.text();
            alert('Lỗi chuyển tủ: ' + err);
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối server!');
    } finally {
        if (btn) {
            btn.innerHTML = oldText;
            btn.disabled = false;
        }
    }
};

let currentUndoDiscardBagIds = [];

window.openBulkUndoDiscardModal = function() {
    const checked = document.querySelectorAll('#technicalTableBody .row-checkbox:checked');
    if (checked.length === 0) {
        if (typeof showToast === 'function') showToast('Vui lòng chọn ít nhất 1 túi máu!', 'warning');
        return;
    }

    const ids = Array.from(checked).map(cb => parseInt(cb.value));
    undoDiscardBloodBags(ids);
};

window.undoDiscardBloodBags = function(ids) {
    currentUndoDiscardBagIds = ids;
    
    // Update Modal UI
    const countEl = document.getElementById('undoDiscardBagCount');
    const idsEl = document.getElementById('undoDiscardBagIds');
    if (countEl) countEl.textContent = currentUndoDiscardBagIds.length;
    if (idsEl) idsEl.textContent = currentUndoDiscardBagIds.map(id => '#' + id).join(', ');
    
    const modal = document.getElementById('undoDiscardModal');
    if (modal) modal.classList.add('active');
};

window.confirmBulkUndoDiscard = async function() {
    const token = localStorage.getItem('access_token');
    const btn = document.getElementById('confirmUndoDiscardBtn');
    const oldText = btn ? btn.innerHTML : '';

    if (btn) {
        btn.innerHTML = '<i class="ph-bold ph-spinner-gap spin"></i> Đang xử lý...';
        btn.disabled = true;
    }

    try {
        const res = await fetch(`${API_BASE}/api/staff/bloodbag/undo-discard-blood`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentUndoDiscardBagIds)
        });

        if (res.ok) {
            const msg = await res.text();
            if (typeof showToast === 'function') showToast(msg || 'Khôi phục túi máu thành công!', 'success');
            document.getElementById('undoDiscardModal').classList.remove('active');
            
            // Uncheck all
            const masterCb = document.getElementById('selectAllTechnical');
            if (masterCb) masterCb.checked = false;
            
            loadBloodBags();
        } else {
            const err = await res.text();
            alert('Lỗi khôi phục túi máu: ' + err);
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối server!');
    } finally {
        if (btn) {
            btn.innerHTML = oldText;
            btn.disabled = false;
        }
    }
};

window.openReportBrokenModal = async function() {
    const modal = document.getElementById('reportBrokenModal');
    if (modal) modal.classList.add('active');

    // Fetch active equipment
    const select = document.getElementById('brokenEquipmentSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Đang tải... --</option>';
    
    // Clear reason field
    const reasonText = document.getElementById('brokenReason');
    if (reasonText) reasonText.value = '';

    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE}/api/staff/storage-equipment/active`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const list = await res.json();
            let opts = '<option value="">-- Chọn thiết bị sự cố --</option>';
            list.forEach(eq => {
                opts += `<option value="${eq.equipmentId}">${eq.name} (${eq.productType} - Hiện tại: ${eq.currentLoad || 0}/${eq.maxCapacity})</option>`;
            });
            select.innerHTML = opts;
        } else {
            select.innerHTML = '<option value="">Lỗi tải danh sách thiết bị</option>';
        }
    } catch (e) {
        console.error(e);
        select.innerHTML = '<option value="">Lỗi kết nối server</option>';
    }
};

window.confirmReportBroken = async function() {
    const equipId = document.getElementById('brokenEquipmentSelect').value;
    const reason = document.getElementById('brokenReason').value.trim();

    if (!equipId) {
        alert('Vui lòng chọn thiết bị gặp sự cố!');
        return;
    }
    if (!reason) {
        alert('Vui lòng nhập lý do/mô tả sự cố!');
        return;
    }

    const token = localStorage.getItem('access_token');
    const btn = document.getElementById('confirmReportBrokenBtn');
    const oldText = btn ? btn.innerHTML : '';

    if (btn) {
        btn.innerHTML = '<i class="ph-bold ph-spinner-gap spin"></i> Đang gửi báo cáo...';
        btn.disabled = true;
    }

    try {
        const res = await fetch(`${API_BASE}/api/staff/storage-equipment/${equipId}/report-broken`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason: reason })
        });

        if (res.ok) {
            const msg = await res.text();
            if (typeof showToast === 'function') showToast(msg || 'Đã gửi báo cáo sự cố thành công đến Admin!', 'success');
            document.getElementById('reportBrokenModal').classList.remove('active');
            
            if (document.getElementById('equipmentTableBody')) {
                loadEquipmentList();
            } else if (typeof loadBloodBags === 'function') {
                loadBloodBags();
            }
        } else {
            const err = await res.text();
            alert('Lỗi báo hỏng thiết bị: ' + err);
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối server!');
    } finally {
        if (btn) {
            btn.innerHTML = oldText;
            btn.disabled = false;
        }
    }
};

// Xem chi tiết túi máu - gọi API GET /bloodbag/get-blood-bag-detail/{id}
window.openBagDetailsModal = async function(bloodBagId) {
    const modal = document.getElementById('bagDetailsModal');
    if (!modal) return;

    // Hiện modal trước, reset nội dung
    document.getElementById('detailBagId').textContent = '#' + bloodBagId;
    document.getElementById('detailDonorName').textContent = 'Đang tải...';
    document.getElementById('detailProductType').textContent = '--';
    document.getElementById('detailVolume').textContent = '--';
    document.getElementById('detailStatus').textContent = '--';
    document.getElementById('detailBloodType').textContent = '--';
    document.getElementById('detailCollectionDate').textContent = '--';
    document.getElementById('detailExpiryDate').textContent = '--';
    document.getElementById('detailLocation').textContent = '--';
    document.getElementById('detailTestResults').innerHTML = '<span class="text-muted">Đang tải...</span>';
    modal.classList.add('active');

    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE}/api/staff/bloodbag/get-blood-bag-detail/${bloodBagId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const err = await res.text();
            document.getElementById('detailDonorName').textContent = 'Lỗi: ' + err;
            return;
        }

        const d = await res.json();
        console.log("Dữ liệu chi tiết túi máu nhận được:", d);

        document.getElementById('detailDonorName').textContent = d.DonorName || d.donorName || '--';
        document.getElementById('detailProductType').textContent = PRODUCT_TYPE_MAP[d.productType] || d.productType || '--';
        document.getElementById('detailVolume').textContent = d.actualVolume ? d.actualVolume + ' ml' : '--';
        const stInfo = BLOOD_STATUS_MAP[d.status] || { label: d.status || '--', cls: '' };
        document.getElementById('detailStatus').innerHTML = `<span style="${stInfo.cls} padding:0.2rem 0.5rem; border-radius:0.25rem; font-size:0.8rem;">${stInfo.label}</span>`;
        document.getElementById('detailBloodType').textContent = d.bloodType ? `${d.bloodType}${d.rhFactor || ''}` : '--';
        document.getElementById('detailCollectionDate').textContent = d.collectedAt ? new Date(d.collectedAt).toLocaleString('vi-VN') : '--';
        document.getElementById('detailExpiryDate').textContent = d.expirationDate ? new Date(d.expirationDate).toLocaleString('vi-VN') : '--';
        document.getElementById('detailLocation').textContent = d.storageLocation || 'Chưa vào kho';

        // Hiển thị kết quả xét nghiệm
        const hasTestResult = d.hiv || d.hbv || d.hcv || d.syphilis || d.malaria;
        if (hasTestResult) {
            const conclusionColor = d.finalConclusion === 'AN TO\u00c0N' ? '#16a34a' : '#dc2626';
            document.getElementById('detailTestResults').innerHTML = `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin-bottom:0.75rem;">
                    <div class="detail-item" style="margin:0;">
                        <span class="label">HIV Ab/Ag</span>
                        <span style="font-weight:600; color:${d.hiv === 'Âm Tính' ? '#16a34a' : '#dc2626'}">${d.hiv || '--'}</span>
                    </div>
                    <div class="detail-item" style="margin:0;">
                        <span class="label">HBsAg (Viêm gan B)</span>
                        <span style="font-weight:600; color:${d.hbv === 'Âm Tính' ? '#16a34a' : '#dc2626'}">${d.hbv || '--'}</span>
                    </div>
                    <div class="detail-item" style="margin:0;">
                        <span class="label">HCV Ab (Viêm gan C)</span>
                        <span style="font-weight:600; color:${d.hcv === 'Âm Tính' ? '#16a34a' : '#dc2626'}">${d.hcv || '--'}</span>
                    </div>
                    <div class="detail-item" style="margin:0;">
                        <span class="label">Giang mai</span>
                        <span style="font-weight:600; color:${d.syphilis === 'Âm Tính' ? '#16a34a' : '#dc2626'}">${d.syphilis || '--'}</span>
                    </div>
                    <div class="detail-item" style="margin:0;">
                        <span class="label">Ký sinh trùng sốt rét</span>
                        <span style="font-weight:600; color:${d.malaria === 'Âm Tính' ? '#16a34a' : '#dc2626'}">${d.malaria || '--'}</span>
                    </div>
                    <div class="detail-item" style="margin:0; border:1px solid ${conclusionColor};">
                        <span class="label" style="font-weight:700;">Kết luận</span>
                        <span style="font-weight:700; color:${conclusionColor};">${d.finalConclusion || '--'}</span>
                    </div>
                </div>
                <button class="btn btn-secondary btn-sm" style="font-size:0.8rem; width:100%;" 
                    onclick="modal.classList.remove('active'); openTestModal(${bloodBagId})">
                    <i class="ph-bold ph-pencil-simple"></i> Cập nhật kết quả xét nghiệm
                </button>
            `;
        } else {
            document.getElementById('detailTestResults').innerHTML = [
                '<span class="text-muted">Chưa có kết quả xét nghiệm.</span>',
                `<br><button class="btn btn-secondary btn-sm mt-2" style="font-size:0.8rem;"`,
                `  onclick="document.getElementById('bagDetailsModal').classList.remove('active'); openTestModal(${bloodBagId})">`,
                '  <i class="ph-bold ph-test-tube"></i> Nhập kết quả ngay',
                '</button>'
            ].join('');
        }

    } catch (e) {
        console.error(e);
        document.getElementById('detailDonorName').textContent = 'Lỗi kết nối';
    }
};

const testResultData = {}; // giữ lại để không break code cũ


// 5. Test Result Logic
function openTestModal(id) {
    const modal = document.getElementById('testModal');
    const titleId = document.getElementById('testBagId');

    if (titleId) titleId.innerText = id;

    if (modal) {
        const savedeData = testResultData[id];

        if (savedeData) {
            // LOAD EXISTING DATA
            // 1. ABO & Rh
            const aboRadio = document.querySelector(`input[name="aboType"][value="${savedeData.abo}"]`);
            if (aboRadio) aboRadio.checked = true;

            const rhRadio = document.querySelector(`input[name="rhType"][value="${savedeData.rh}"]`);
            if (rhRadio) rhRadio.checked = true;

            // 2. Screening
            const toggles = ['testHIV', 'testHBV', 'testHCV', 'testSyphilis', 'testMalaria'];
            toggles.forEach(key => {
                const el = document.getElementById(key);
                if (el) {
                    el.checked = savedeData[key]; // true/false
                    updateTestConclusion(el);
                }
            });

            // Re-calc conclusion visual
            // (updateTestConclusion is called per toggle, but we might need a refresh to set the main Alert box correctly if no toggles changed state)
            // Actually updateTestConclusion checks all toggles at the end, so calling it once for the last element is enough, 
            // but calling for each is fine.
        } else {
            // RESET FORM (No data)
            document.querySelectorAll('input[name="aboType"]').forEach(el => el.checked = false);
            document.querySelectorAll('input[name="rhType"]').forEach(el => el.checked = false);
            setAllNegative();
        }

        modal.classList.add('active');
    }
}

function setAllNegative() {
    const toggles = ['testHIV', 'testHBV', 'testHCV', 'testSyphilis', 'testMalaria'];
    toggles.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.checked = false; // False = Negative
            updateTestConclusion(el);
        }
    });
}

window.togglePhysicalError = function(checkbox) {
    const isChecked = checkbox.checked;
    
    // Disable/enable ABO & Rh radio buttons
    document.querySelectorAll('input[name="aboType"]').forEach(r => {
        r.disabled = isChecked;
        if (isChecked) r.checked = false;
    });
    document.querySelectorAll('input[name="rhType"]').forEach(r => {
        r.disabled = isChecked;
        if (isChecked) r.checked = false;
    });

    // Disable/enable infectious disease switches
    const diseaseToggles = ['testHIV', 'testHBV', 'testHCV', 'testSyphilis', 'testMalaria'];
    diseaseToggles.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.disabled = isChecked;
            if (isChecked) {
                el.checked = false;
                // Update label to look disabled
                const label = el.nextElementSibling;
                if (label) {
                    label.innerText = 'Âm tính (-)';
                    label.className = 'form-check-label fw-bold text-muted small';
                    el.className = 'form-check-input md-toggle';
                    el.style.backgroundColor = '';
                    el.style.borderColor = '';
                }
            } else {
                // Restore label
                const label = el.nextElementSibling;
                if (label) {
                    label.innerText = el.checked ? 'Dương tính (+)' : 'Âm tính (-)';
                    label.className = el.checked ? 'form-check-label fw-bold text-danger small' : 'form-check-label fw-bold text-success small';
                }
            }
        }
    });

    // Disable/enable set all negative button
    const setAllNegBtn = document.querySelector('button[onclick="setAllNegative()"]');
    if (setAllNegBtn) setAllNegBtn.disabled = isChecked;

    // Refresh conclusion alert
    updateTestConclusion(null);
};

function updateTestConclusion(element) {
    // Update local label
    if (element) {
        const isPositive = element.checked;
        const label = element.nextElementSibling;

        if (label) {
            if (isPositive) {
                label.innerText = 'Dương tính (+)';
                label.className = 'form-check-label fw-bold text-danger small';
                element.className = 'form-check-input bg-danger border-danger';
            } else {
                label.innerText = 'Âm tính (-)';
                label.className = 'form-check-label fw-bold text-success small';
                element.className = 'form-check-input md-toggle';
                element.style.backgroundColor = '';
                element.style.borderColor = '';
            }
        }
    }

    // Update Global Conclusion
    const toggles = ['testHIV', 'testHBV', 'testHCV', 'testSyphilis', 'testMalaria'];
    let hasPositive = false;
    toggles.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.checked) hasPositive = true;
    });

    const alertBox = document.getElementById('testConclusionAlert');
    const icon = document.getElementById('testIcon');
    const summary = document.getElementById('testSummary');
    const desc = document.getElementById('testDesc');

    const physicalSwitch = document.getElementById('isPhysicalErrorSwitch');
    const isPhysicalError = physicalSwitch && physicalSwitch.checked;

    if (alertBox && summary) {
        if (isPhysicalError) {
            alertBox.className = 'alert alert-warning d-flex align-items-center mb-0';
            icon.className = 'ph-fill ph-warning fs-4 me-2';
            summary.innerText = 'TÚI MÁU BỊ HỎNG DO SỰ CỐ KỸ THUẬT';
            desc.innerText = 'Trạng thái Chờ hủy. Hệ thống sẽ gửi thư thông báo cho người hiến.';
        } else if (hasPositive) {
            alertBox.className = 'alert alert-danger d-flex align-items-center mb-0';
            icon.className = 'ph-fill ph-warning-circle fs-4 me-2';
            summary.innerText = 'NGUY HẠI / CHỜ HỦY';
            desc.innerText = 'Phát hiện chỉ số Dương tính (+). Không được nhập kho.';
        } else {
            alertBox.className = 'alert alert-success d-flex align-items-center mb-0';
            icon.className = 'ph-fill ph-check-circle fs-4 me-2';
            summary.innerText = 'AN TOÀN / SẴN SÀNG';
            desc.innerText = 'Tất cả chỉ số đều Âm tính (-). Có thể nhập kho.';
        }
    }
}

function saveTestResult() {
    const physicalSwitch = document.getElementById('isPhysicalErrorSwitch');
    const isPhysicalError = physicalSwitch && physicalSwitch.checked;

    let aboVal = null;
    let rhVal = null;

    if (!isPhysicalError) {
        const abo = document.querySelector('input[name="aboType"]:checked');
        const rh = document.querySelector('input[name="rhType"]:checked');

        if (!abo || !rh) {
            alert('Vui lòng chọn đầy đủ Nhóm máu (ABO và Rh)!');
            return;
        }
        aboVal = abo.value;
        rhVal = rh.value;
    }

    const bagId = document.getElementById('testBagId').innerText;

    // Build data object
    const newData = {
        abo: aboVal,
        rh: rhVal,
        testHIV: isPhysicalError ? false : document.getElementById('testHIV').checked,
        testHBV: isPhysicalError ? false : document.getElementById('testHBV').checked,
        testHCV: isPhysicalError ? false : document.getElementById('testHCV').checked,
        testSyphilis: isPhysicalError ? false : document.getElementById('testSyphilis').checked,
        testMalaria: isPhysicalError ? false : document.getElementById('testMalaria').checked,
        isPhysicalError: isPhysicalError
    };
    testResultData[bagId] = newData;

    // 3. Update Row
    const row = document.getElementById(`row-${bagId}`);

    if (row) {
        const typeCell = row.cells[2];   // Index 2 is Blood Type
        const locationCell = row.cells[5]; // Index 5 is Location
        const statusCell = row.cells[6]; // Index 6 is Status
        const actionCell = row.cells[7]; // Index 7 is Action

        if (isPhysicalError) {
            typeCell.innerHTML = `<span class="badge" style="color: var(--secondary-color); background: #f3f4f6;">--</span>`;
            locationCell.innerHTML = 'Tủ chờ hủy';
            statusCell.innerHTML = '<span class="badge bg-danger-light" style="color: #dc2626;">Chờ hủy</span>';
            actionCell.innerHTML = renderActionButtons('unsafe', bagId);
            showToast(`Đã lưu KQ túi máu ${bagId}: HỎNG VẬT LÝ`, 'warning');
        } else {
            typeCell.innerHTML = `<span class="badge bg-danger-light" style="color: var(--danger-color);">${aboVal}${rhVal}</span>`;
            const summary = document.getElementById('testSummary').innerText;
            const isSafe = summary.includes('AN TOÀN');
            if (isSafe) {
                statusCell.innerHTML = '<span class="badge bg-info-light" style="color: #0284c7;">Chờ tách chiết</span>';
                actionCell.innerHTML = renderActionButtons('ready-fraction', bagId);
                showToast(`Đã lưu KQ túi máu ${bagId}: AN TOÀN`, 'success');
            } else {
                locationCell.innerHTML = 'Tủ chờ hủy';
                statusCell.innerHTML = '<span class="badge bg-danger-light" style="color: #dc2626;">Chờ hủy</span>';
                actionCell.innerHTML = renderActionButtons('unsafe', bagId);
                showToast(`Đã lưu KQ túi máu ${bagId}: NGUY HẠI`, 'warning');
            }
        }
    }

    // Close Modal
    const modal = document.getElementById('testModal');
    if (modal) modal.classList.remove('active');
}

// --- BAG DETAILS MODAL LOGIC ---
function openBagDetailsModal(bagId) {
    const row = document.getElementById(`row-${bagId}`);
    const modal = document.getElementById('bagDetailsModal');

    if (!row || !modal) return;

    // 1. Extract data from Row
    const typeHtml = row.cells[2].innerHTML; // Badge html
    const bloodTypeRaw = row.cells[2].innerText.trim();
    const productRaw = row.cells[3].innerText.trim(); // "Máu toàn phần (350ml)"
    const dateRaw = row.cells[4].innerText.trim();
    const locationRaw = row.cells[5].innerText.trim();
    const statusHtml = row.cells[6].innerHTML; // Badge html

    // Parse Product Type & Volume
    let productType = productRaw;
    let volume = '--';
    const volMatch = productRaw.match(/\((.*?)\)/); // match "(350ml)"
    if (volMatch) {
        volume = volMatch[1];
        productType = productRaw.replace(volMatch[0], '').trim();
    }

    // Estimate Expiry (Mock: +35 days for Whole Blood ideally, just simple mock here)
    let expiry = '--';
    if (dateRaw && dateRaw !== '--') {
        try {
            // "09/01/2024 08:30" format -> Simple parse
            const parts = dateRaw.split(' ');
            const objDate = parts[0].split('/'); // DD, MM, YYYY
            if (objDate.length === 3) {
                const expDate = new Date(objDate[2], parseInt(objDate[1]) - 1, objDate[0]);
                expDate.setDate(expDate.getDate() + 35);
                expiry = expDate.toLocaleDateString('vi-VN');
            }
        } catch (e) { }
    }

    // Determine Donor Name (Mock logic for demo)
    let donorName = 'Nguyễn Văn Ẩn Danh';
    if (bagId === 'BLO-2024-001') donorName = 'Lê Văn C';
    if (bagId === 'BLO-2024-002') donorName = 'Phạm Văn D';
    if (bagId === 'BLO-2024-003') donorName = 'Trần Thị E';

    // 2. Populate Header & Basic Info
    document.getElementById('detailBagId').innerText = bagId;
    document.getElementById('detailDonorName').innerText = donorName;
    document.getElementById('detailProductType').innerText = productType;
    document.getElementById('detailVolume').innerText = volume;
    document.getElementById('detailStatus').innerHTML = statusHtml;

    document.getElementById('detailBloodType').innerHTML = typeHtml;
    document.getElementById('detailCollectionDate').innerText = dateRaw;
    document.getElementById('detailExpiryDate').innerText = expiry;
    document.getElementById('detailLocation').innerText = locationRaw;

    // 3. Populate Test Results
    const testDiv = document.getElementById('detailTestResults');
    const resultObj = testResultData[bagId];

    if (resultObj) {
        let html = `
            <div class="mb-2 pb-1 border-bottom">
                <span class="text-muted">Nhóm máu xác nhận:</span> 
                <strong class="text-danger">${resultObj.abo}${resultObj.rh}</strong>
            </div>
            <table class="table table-sm table-borderless mb-0">
                <tbody>
        `;

        const screening = [
            { key: 'testHIV', label: 'HIV Ab/Ag' },
            { key: 'testHBV', label: 'HBsAg' },
            { key: 'testHCV', label: 'HCV Ab' },
            { key: 'testSyphilis', label: 'Giang mai' },
            { key: 'testMalaria', label: 'Sốt rét' }
        ];

        screening.forEach(item => {
            const isPositive = resultObj[item.key];
            const resultBadge = isPositive
                ? '<span class="badge bg-danger">Dương tính</span>'
                : '<span class="badge bg-success">Âm tính</span>';

            html += `
                <tr>
                    <td class="ps-0 py-1" style="width: 120px;">${item.label}</td>
                    <td class="py-1">${resultBadge}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        testDiv.innerHTML = html;
        testDiv.className = "p-2 bg-light rounded small mt-2 border";

    } else {
        testDiv.innerHTML = '<span class="text-muted italic">Chưa có kết quả xét nghiệm lưu trữ.</span>';
        testDiv.className = "p-2 bg-light rounded small mt-2";
    }

    // 4. Show Modal
    modal.classList.add('active');
}

// --- QR SCANNER & CHECK-IN LOGIC ---
let qrScanner = null;
let pendingCheckinData = null; // { ticketCode, donorInfo (hoặc null nếu từ bảng) }

// Mở modal quét QR
function openQrScanModal() {
    const eventSelect = document.getElementById('eventFilterSelect');
    if (!eventSelect || !eventSelect.value) {
        alert('Vui lòng chọn sự kiện trước khi quét mã QR!');
        return;
    }
    const modal = document.getElementById('qrScanModal');
    if (modal) modal.classList.add('active');

    // Khởi động camera
    setTimeout(() => {
        startQrScanner();
    }, 300);
}

function closeQrScanModal() {
    stopQrScanner();
    const modal = document.getElementById('qrScanModal');
    if (modal) modal.classList.remove('active');
    const resultDiv = document.getElementById('qr-scan-result');
    if (resultDiv) resultDiv.style.display = 'none';
}

function startQrScanner() {
    if (qrScanner) {
        qrScanner.clear();
        qrScanner = null;
    }

    qrScanner = new Html5Qrcode("qr-reader");

    qrScanner.start(
        { facingMode: "environment" }, // Camera sau của điện thoại
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
            // Dừng scanner khi đã có kết quả
            stopQrScanner();
            
            // Hiển thị mã đã quét
            const resultDiv = document.getElementById('qr-scan-result');
            const codeSpan = document.getElementById('qr-scanned-code');
            if (resultDiv && codeSpan) {
                codeSpan.textContent = 'Đã quét: ' + decodedText;
                resultDiv.style.display = 'block';
            }

            // Gọi API checkin với ticketCode quét được
            await processCheckinByTicketCode(decodedText);
        },
        (errorMessage) => {
            // Bỏ qua lỗi quét liên tục (bình thường khi chưa có QR)
        }
    ).catch(err => {
        console.error('Lỗi khởi động camera:', err);
        alert('Không thể truy cập camera! Vui lòng kiểm tra quyền truy cập camera của trình duyệt.');
    });
}

function stopQrScanner() {
    if (qrScanner) {
        qrScanner.stop().catch(() => {});
        qrScanner = null;
    }
}

// Xử lý check-in khi có ticketCode (từ QR hoặc nút bấm)
async function processCheckinByTicketCode(ticketCode) {
    const eventSelect = document.getElementById('eventFilterSelect');
    const eventId = eventSelect ? eventSelect.value : null;
    if (!eventId) return;

    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE}/api/staff/registration/checkin/${ticketCode}/${eventId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const donor = await res.json();
            closeQrScanModal();
            // Hiển thị modal xác nhận với thông tin người hiến
            showCheckinConfirmModal(donor, ticketCode);
        } else {
            const errText = await res.text();
            closeQrScanModal();
            alert('Check-in thất bại: ' + errText);
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối tới hệ thống!');
    }
}

// Nút Check-in thủ công từ bảng danh sách
window.openCheckinConfirm = function(donorName, ticketCode, phone, gender, dob) {
    const eventSelect = document.getElementById('eventFilterSelect');
    if (!eventSelect || !eventSelect.value) {
        alert('Vui lòng chọn sự kiện!');
        return;
    }
    // Hiển thị modal xác nhận với dữ liệu có sẵn (chưa gọi API)
    pendingCheckinData = { ticketCode };
    document.getElementById('ci-donorName').textContent = donorName;
    document.getElementById('ci-phone').textContent = phone || '--';
    document.getElementById('ci-gender').textContent = gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : (gender || '--');
    document.getElementById('ci-dob').textContent = dob || '--';
    document.getElementById('ci-ticketCode').textContent = ticketCode || '--';
    document.getElementById('checkinConfirmModal').classList.add('active');
};

function showCheckinConfirmModal(donor, ticketCode) {
    // Sau khi API checkin thành công, hiển thị kết quả
    pendingCheckinData = null; // API đã gọi rồi, không cần gọi lại
    document.getElementById('ci-donorName').textContent = donor.fullName || '--';
    document.getElementById('ci-phone').textContent = donor.phone || '--';
    document.getElementById('ci-gender').textContent = donor.gender === 'male' ? 'Nam' : donor.gender === 'female' ? 'Nữ' : (donor.gender || '--');
    document.getElementById('ci-dob').textContent = donor.dob || '--';
    document.getElementById('ci-ticketCode').textContent = ticketCode || donor.ticketCode || '--';
    
    // Đổi nút xác nhận thành "Đóng" vì API đã gọi thành công
    const confirmBtn = document.getElementById('confirmCheckinBtn');
    confirmBtn.textContent = 'Đã Check-in ✓';
    confirmBtn.style.backgroundColor = '#10b981';
    confirmBtn.onclick = () => {
        closeCheckinConfirmModal();
        if (window.handleEventSelectChange) window.handleEventSelectChange();
    };
    
    document.getElementById('checkinConfirmModal').classList.add('active');
    showToast(`Check-in thành công: ${donor.fullName}`, 'success');
}

function closeCheckinConfirmModal() {
    document.getElementById('checkinConfirmModal').classList.remove('active');
    // Reset nút về trạng thái ban đầu
    const confirmBtn = document.getElementById('confirmCheckinBtn');
    if (confirmBtn) {
        confirmBtn.innerHTML = '<i class="ph-bold ph-check me-1"></i> Xác nhận Check-in';
        confirmBtn.style.backgroundColor = '#ef4444';
        confirmBtn.onclick = doConfirmCheckin;
    }
    pendingCheckinData = null;
}

async function doConfirmCheckin() {
    if (!pendingCheckinData || !pendingCheckinData.ticketCode) return;
    
    const confirmBtn = document.getElementById('confirmCheckinBtn');
    const oldText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = 'Đang xử lý...';
    confirmBtn.disabled = true;

    await processCheckinByTicketCode(pendingCheckinData.ticketCode);
    
    confirmBtn.innerHTML = oldText;
    confirmBtn.disabled = false;
    document.getElementById('checkinConfirmModal').classList.remove('active');
}



let currentRegisId = null;
let currentDonorId = null;

// 2. Open Modal
function openVitalModal(name, regisId, donorId, btnElement) {
    currentRegisId = regisId;
    currentDonorId = donorId;
    const modal = document.getElementById('vitalModal');
    const nameSpan = document.getElementById('donorNameDisplay');
    const readName = document.getElementById('readName');

    // Store reference to the row being edited
    if (btnElement) {
        currentEditingRow = btnElement.closest('tr');
    } else {
        const table = document.getElementById('receptionTableBody');
        const rows = table?.getElementsByTagName('tr') || [];
        for (let row of rows) {
            if (row.cells[0]?.querySelector('.fw-bold')?.innerText === name) {
                currentEditingRow = row;
                break;
            }
        }
    }

    if (modal && nameSpan) {
        nameSpan.textContent = name;
        if (readName) readName.textContent = name;

        // --- Auto-extract gender & dob from the row's <small> tag ---
        // Format in cell: "Nam - 2004-11-28"
        const smallEl = currentEditingRow?.cells[0]?.querySelector('small');
        const smallText = smallEl?.innerText || '';
        const parts = smallText.split(' - ');
        const genderRaw = parts[0]?.trim() || '';
        const dobStr    = parts[1]?.trim() || '';

        // Tính tuổi
        let ageText = '--';
        if (dobStr && dobStr !== '--') {
            const dob = new Date(dobStr);
            if (!isNaN(dob)) {
                const today = new Date();
                let age = today.getFullYear() - dob.getFullYear();
                const m = today.getMonth() - dob.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
                ageText = `${age} tuổi`;
            }
        }

        const genderAgeEl = document.getElementById('readGenderAge');
        if (genderAgeEl) genderAgeEl.textContent = `${genderRaw || '--'} / ${ageText}`;

        // Cân nặng khai báo — để trống nếu chưa có (không có trong dữ liệu bảng)
        const weightEl = document.getElementById('readDeclaredWeight');
        if (weightEl) weightEl.textContent = '--';

        // Reset inputs
        document.getElementById('weightInput').value = '';
        document.getElementById('bpInput').value = '';
        document.getElementById('pulseInput').value = '';
        document.getElementById('hbInput').value = '';
        document.getElementById('expectedVolumeSelect').disabled = false;
        document.getElementById('expectedVolumeSelect').value = '350';
        const volumeAutoLbl = document.getElementById('volumeAutoLabel');
        if (volumeAutoLbl) volumeAutoLbl.textContent = '';

        // Kiểm tra cache — nếu đã từng nhập kết quả thì hiện lại
        const cached = screeningCache.get(String(regisId));
        if (cached) {
            document.getElementById('weightInput').value        = cached.weight || '';
            document.getElementById('bpInput').value            = cached.bloodPressure || '';
            document.getElementById('pulseInput').value         = cached.heartRate || '';
            document.getElementById('hbInput').value            = cached.hemoglobin || '';
            const volSelect = document.getElementById('expectedVolumeSelect');
            if (volSelect && cached.expectedVolume) volSelect.value = cached.expectedVolume;
            if (cached.isEligible === false) {
                document.getElementById('statusDeferred').checked = true;
                document.getElementById('statusEligible').checked = false;
            } else {
                document.getElementById('statusEligible').checked = true;
                document.getElementById('statusDeferred').checked = false;
            }
            const deferReason = document.getElementById('deferReason');
            if (deferReason) deferReason.value = cached.rejectionReason || '';
            toggleReasonInput();
        } else {
            // Không có cache — Reset về trạng thái ban đầu
            document.getElementById('statusEligible').checked = true;
            document.getElementById('statusDeferred').checked = false;
            document.getElementById('deferReason').value = '';
            toggleReasonInput();
        }

        // Reset status indicator labels & summary panel trước khi evaluateVitals
        ['weightStatus','bpStatus','pulseStatus','hbStatus'].forEach(id => {
            const el = document.getElementById(id); if (el) el.innerHTML = '';
        });
        const panel = document.getElementById('vitalSummaryPanel');
        if (panel) {
            panel.style.background = '#f8fafc'; panel.style.border = '1.5px solid #e2e8f0';
            panel.innerHTML = '<i class="ph-bold ph-info" style="font-size:1.25rem;color:#94a3b8;"></i><span style="font-size:0.82rem;color:#64748b;">Nhập chỉ số để xem đánh giá tự động...</span>';
        }

        modal.classList.add('active');

        // Nếu có dữ liệu cũ, trigger evaluateVitals để hiện màu sắc ngay
        if (screeningCache.has(String(regisId))) {
            setTimeout(() => evaluateVitals(), 50);
        }
    }
}


function closeVitalModal() {
    const modal = document.getElementById('vitalModal');
    if (modal) modal.classList.remove('active');
}

function toggleReasonInput() {
    const isDeferred = document.getElementById('statusDeferred').checked;
    const reasonGroup = document.getElementById('deferReasonGroup');
    if (reasonGroup) {
        reasonGroup.style.display = isDeferred ? 'block' : 'none';
    }
}

// ===== REAL-TIME VITAL EVALUATION =====
function evaluateVitals() {
    const weight    = parseFloat(document.getElementById('weightInput')?.value);
    const bpRaw     = document.getElementById('bpInput')?.value?.trim();
    const pulse     = parseFloat(document.getElementById('pulseInput')?.value);
    const hb        = parseFloat(document.getElementById('hbInput')?.value);

    // --- Helpers ---
    const setStatus = (elId, level, msg) => {
        const el = document.getElementById(elId);
        if (!el) return;
        const styles = {
            green:  { color: '#15803d', bg: '#dcfce7', icon: '✅' },
            yellow: { color: '#b45309', bg: '#fef9c3', icon: '⚠️' },
            red:    { color: '#dc2626', bg: '#fee2e2', icon: '🔴' },
            none:   { color: '#6b7280', bg: 'transparent', icon: '' }
        };
        const s = styles[level] || styles.none;
        el.innerHTML = msg
            ? `<span style="display:inline-block;padding:1px 6px;border-radius:3px;background:${s.bg};color:${s.color};font-weight:600;">${s.icon} ${msg}</span>`
            : '';
    };

    let hasRed = false;
    let allGreen = true;
    const issues = [];

    // --- Cân nặng ---
    if (!isNaN(weight) && weight > 0) {
        if (weight < 42) {
            setStatus('weightStatus', 'red', `${weight}kg – Thiếu cân (< 42kg)`);
            hasRed = true; allGreen = false; issues.push('thiếu cân');
        } else if (weight < 50) {
            setStatus('weightStatus', 'yellow', `${weight}kg – Cần lưu ý`);
            allGreen = false;
        } else {
            setStatus('weightStatus', 'green', `${weight}kg – Bình thường`);
        }
    } else {
        setStatus('weightStatus', 'none', ''); allGreen = false;
    }

    // --- Huyết áp ---
    const bpParts = bpRaw ? bpRaw.split('/') : [];
    if (bpParts.length === 2) {
        const sys = parseInt(bpParts[0]), dia = parseInt(bpParts[1]);
        if (!isNaN(sys) && !isNaN(dia)) {
            const sysRed = sys < 90 || sys > 180;
            const diaRed = dia < 60 || dia > 110;
            const sysYel = sys < 100 || sys > 160;
            const diaYel = dia < 65 || dia > 100;
            if (sysRed || diaRed) {
                setStatus('bpStatus', 'red', `${sys}/${dia} – Bất thường`);
                hasRed = true; allGreen = false; issues.push('huyết áp bất thường');
            } else if (sysYel || diaYel) {
                setStatus('bpStatus', 'yellow', `${sys}/${dia} – Cần lưu ý`);
                allGreen = false;
            } else {
                setStatus('bpStatus', 'green', `${sys}/${dia} – Bình thường`);
            }
        } else { setStatus('bpStatus', 'none', ''); allGreen = false; }
    } else if (bpRaw) {
        setStatus('bpStatus', 'yellow', 'Định dạng: 110/70');
        allGreen = false;
    } else {
        setStatus('bpStatus', 'none', ''); allGreen = false;
    }

    // --- Nhịp tim ---
    if (!isNaN(pulse) && pulse > 0) {
        if (pulse < 50 || pulse > 110) {
            setStatus('pulseStatus', 'red', `${pulse} lần/ph – Bất thường`);
            hasRed = true; allGreen = false; issues.push('nhịp tim bất thường');
        } else if (pulse < 60 || pulse > 100) {
            setStatus('pulseStatus', 'yellow', `${pulse} lần/ph – Cần lưu ý`);
            allGreen = false;
        } else {
            setStatus('pulseStatus', 'green', `${pulse} lần/ph – Bình thường`);
        }
    } else {
        setStatus('pulseStatus', 'none', ''); allGreen = false;
    }

    // --- Hb (tùy chọn) ---
    if (!isNaN(hb) && hb > 0) {
        if (hb < 11) {
            setStatus('hbStatus', 'red', `${hb} g/dL – Thấp (< 11)`);
            hasRed = true; allGreen = false; issues.push('Hb thấp');
        } else if (hb < 12) {
            setStatus('hbStatus', 'yellow', `${hb} g/dL – Cần lưu ý`);
            allGreen = false;
        } else {
            setStatus('hbStatus', 'green', `${hb} g/dL – Bình thường`);
        }
    } else {
        setStatus('hbStatus', 'none', '');
    }

    // --- Tự động lượng máu & kết luận ---
    const volumeSelect   = document.getElementById('expectedVolumeSelect');
    const volumeAutoLbl  = document.getElementById('volumeAutoLabel');
    const summaryPanel   = document.getElementById('vitalSummaryPanel');

    if (hasRed) {
        // Khóa lượng máu, auto chọn Tạm hoãn
        if (volumeSelect) { volumeSelect.disabled = true; volumeSelect.value = '250'; }
        if (volumeAutoLbl) volumeAutoLbl.textContent = '';
        document.getElementById('statusDeferred').checked = true;
        document.getElementById('statusEligible').checked = false;
        toggleReasonInput();
        if (!document.getElementById('deferReason').value) {
            document.getElementById('deferReason').value = issues.join(', ');
        }
        // Summary đỏ
        if (summaryPanel) {
            summaryPanel.style.background = '#fef2f2';
            summaryPanel.style.border = '1.5px solid #fca5a5';
            summaryPanel.innerHTML = `<i class="ph-bold ph-x-circle" style="font-size:1.25rem;color:#dc2626;flex-shrink:0;"></i>
                <span style="font-size:0.82rem;color:#dc2626;font-weight:600;">⛔ KHÔNG ĐỦ ĐIỀU KIỆN – ${issues.map(i => i.charAt(0).toUpperCase()+i.slice(1)).join(', ')}. Đã tự động chuyển sang Tạm hoãn.</span>`;
        }
    } else {
        // Mở khóa lượng máu
        if (volumeSelect) volumeSelect.disabled = false;

        if (allGreen && !isNaN(weight)) {
            // Auto gợi ý lượng máu theo cân nặng
            let recommended = '350';
            if (weight >= 60) { recommended = '450'; }
            else if (weight >= 50) { recommended = '350'; }
            else { recommended = '250'; }
            volumeSelect.value = recommended;
            if (volumeAutoLbl) volumeAutoLbl.textContent = `(Gợi ý tự động)`;

            // Summary xanh
            if (summaryPanel) {
                summaryPanel.style.background = '#f0fdf4';
                summaryPanel.style.border = '1.5px solid #86efac';
                summaryPanel.innerHTML = `<i class="ph-bold ph-check-circle" style="font-size:1.25rem;color:#16a34a;flex-shrink:0;"></i>
                    <span style="font-size:0.82rem;color:#16a34a;font-weight:600;">✅ Tất cả chỉ số bình thường – Đề xuất lấy <strong>${recommended} ml</strong> dựa theo cân nặng ${weight} kg.</span>`;
            }
            document.getElementById('statusEligible').checked = true;
            document.getElementById('statusDeferred').checked = false;
            toggleReasonInput();
        } else {
            if (volumeAutoLbl) volumeAutoLbl.textContent = '';
            // Summary vàng (có chỉ số cần lưu ý)
            if (summaryPanel) {
                const hasInput = !isNaN(weight) || bpRaw || !isNaN(pulse);
                summaryPanel.style.background = hasInput ? '#fffbeb' : '#f8fafc';
                summaryPanel.style.border = hasInput ? '1.5px solid #fcd34d' : '1.5px solid #e2e8f0';
                summaryPanel.innerHTML = hasInput
                    ? `<i class="ph-bold ph-warning" style="font-size:1.25rem;color:#d97706;flex-shrink:0;"></i>
                       <span style="font-size:0.82rem;color:#92400e;">⚠️ Một số chỉ số cần lưu ý. Nhân viên y tế cần xem xét trực tiếp trước khi quyết định.</span>`
                    : `<i class="ph-bold ph-info" style="font-size:1.25rem;color:#94a3b8;flex-shrink:0;"></i>
                       <span style="font-size:0.82rem;color:#64748b;">Nhập chỉ số để xem đánh giá tự động...</span>`;
            }
        }
    }
}


// 3. Save Result - goi API khám sàng lọc và cập nhật nút trong bảng
async function saveVitalResult() {
    if (!currentRegisId || !currentDonorId) {
        alert("Thiếu dữ liệu ID để xác định phiếu khám!");
        return;
    }

    const eventSelect = document.getElementById('eventFilterSelect');
    const selectedOption = eventSelect ? eventSelect.options[eventSelect.selectedIndex] : null;
    const role = selectedOption ? selectedOption.getAttribute('data-role') : '';

    const isEligible = document.getElementById('statusEligible').checked;
    
    const payload = {
        donorId: currentDonorId,
        weight: document.getElementById('weightInput').value || "0",
        hemoglobin: document.getElementById('hbInput').value || "",
        bloodPressure: document.getElementById('bpInput').value || "",
        heartRate: document.getElementById('pulseInput').value || "",
        expectedVolume: document.getElementById('expectedVolumeSelect') ? document.getElementById('expectedVolumeSelect').value : "350",
        isEligible: isEligible,
        rejectionReason: isEligible ? "" : document.getElementById('deferReason').value
    };

    const token = localStorage.getItem('access_token');
    const saveBtn = event.currentTarget || event.target;
    const oldText = saveBtn.innerHTML;
    saveBtn.innerHTML = "Đang lưu...";
    saveBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/api/staff/registration/screening/${currentRegisId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            // Lưu kết quả vào cache để hiện lại khi bấm Sửa (không cần API GET)
            screeningCache.set(String(currentRegisId), {
                weight:          payload.weight,
                hemoglobin:      payload.hemoglobin,
                bloodPressure:   payload.bloodPressure,
                heartRate:       payload.heartRate,
                expectedVolume:  payload.expectedVolume,
                isEligible:      payload.isEligible,
                rejectionReason: payload.rejectionReason
            });

            closeVitalModal();
            showToast('Lưu kết quả khám sàng lọc thành công!', 'success');

            // Cập nhật nút trực tiếp trong bảng (không reload lại toàn bộ)
            if (currentEditingRow) {
                const statusCell = currentEditingRow.cells[2];
                const actionCell = currentEditingRow.cells[3];
                const donorName = currentEditingRow.cells[0].querySelector('.fw-bold')?.innerText || currentEditingRow.cells[0].innerText;
                const savedRegisId = currentRegisId;
                const savedDonorId = currentDonorId;

                if (isEligible) {
                    statusCell.innerHTML = '<span class="badge" style="background: #dcfce7; color: #16a34a;">Đủ điều kiện</span>';
                    
                    let buttonsHtml = '';
                    if (role === 'LAY_MAU') {
                        buttonsHtml = `
                            <button class="btn btn-danger" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" 
                                onclick="openCollectModal('${donorName}', this, '${savedRegisId}')">
                                <i class="ph-bold ph-drop"></i> Lấy máu
                            </button>
                        `;
                    } else if (role === 'KHAM_SANG_LOC') {
                        buttonsHtml = `
                            <button class="btn btn-light border" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" 
                                onclick="openVitalModal('${donorName}', '${savedRegisId}', '${savedDonorId}', this)">
                                <i class="ph-bold ph-pencil-simple"></i> Sửa
                            </button>
                        `;
                    } else {
                        buttonsHtml = `<button class="btn btn-light border" disabled>Không có HĐ</button>`;
                    }
                    actionCell.innerHTML = buttonsHtml;
                } else {
                    statusCell.innerHTML = '<span class="badge" style="background: #fee2e2; color: #ef4444;">Không đủ điều kiện</span>';
                    
                    let buttonsHtml = '';
                    if (role === 'KHAM_SANG_LOC') {
                        buttonsHtml = `
                            <button class="btn btn-light border" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" 
                                onclick="openVitalModal('${donorName}', '${savedRegisId}', '${savedDonorId}', this)">
                                <i class="ph-bold ph-pencil-simple"></i> Sửa
                            </button>
                        `;
                    } else {
                        buttonsHtml = `<button class="btn btn-light border" disabled>Không có HĐ</button>`;
                    }
                    actionCell.innerHTML = buttonsHtml;
                }
            }
        } else {
            const err = await response.text();
            alert('Lỗi: ' + err);
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối tới hệ thống server!');
    } finally {
        saveBtn.innerHTML = oldText;
        saveBtn.disabled = false;
    }
}

// 4. Collect Blood Logic
let currentCollectRegisId = null;

function openCollectModal(name, btnElement, regisId) {
    currentCollectRegisId = regisId || null;
    const modal = document.getElementById('collectBloodModal');
    const nameSpan = document.getElementById('collectDonorName');
    const bagIdInput = document.getElementById('bagIdDisplay');

    if (btnElement) {
        currentEditingRow = btnElement.closest('tr');
    }

    if (modal && nameSpan) {
        nameSpan.textContent = name;

        // Auto-generate Bag ID (tham khảo, thực tế BE sẽ generate)
        const randomId = "290-" + Math.floor(100000 + Math.random() * 900000);
        if (bagIdInput) bagIdInput.value = randomId;

        // Reset inputs
        document.getElementById('resultSuccess').checked = true;
        document.getElementById('vol350').checked = true;

        modal.classList.add('active');
    }
}

function closeCollectModal() {
    const modal = document.getElementById('collectBloodModal');
    if (modal) modal.classList.remove('active');
}

async function completeCollection() {
    if (!currentCollectRegisId) {
        alert('Không xác định được phiếu đăng ký!');
        return;
    }

    const isSuccess = document.getElementById('resultSuccess').checked;
    const volumeEl = document.querySelector('input[name="volume"]:checked');
    const actualVolume = volumeEl ? parseInt(volumeEl.id.replace('vol', '')) : 350;

    const payload = {
        actualVolume: actualVolume,
        isSuccess: isSuccess
    };

    const token = localStorage.getItem('access_token');
    const btn = event.currentTarget;
    const oldText = btn.innerHTML;
    btn.innerHTML = 'Đang xử lý...';
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/api/staff/registration/donate-blood/${currentCollectRegisId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            closeCollectModal();
            showToast('Lấy máu thành công! Túi máu đã được tạo trong hệ thống.', 'success');

            // Cập nhật nút trong bảng
            if (currentEditingRow) {
                const statusCell = currentEditingRow.cells[2];
                const actionCell = currentEditingRow.cells[3];
                if (isSuccess) {
                    statusCell.innerHTML = '<span class="badge" style="background: #6366f1; color: white;">Đã hiến máu</span>';
                    actionCell.innerHTML = '<span class="text-muted small">Hoàn tất</span>';
                } else {
                    statusCell.innerHTML = '<span class="badge" style="background: #9ca3af; color: white;">Thất bại</span>';
                    actionCell.innerHTML = '<span class="text-muted small">Ghi nhận thất bại</span>';
                }
            }
        } else {
            const err = await response.text();
            alert('Lỗi lấy máu: ' + err);
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối!');
    } finally {
        btn.innerHTML = oldText;
        btn.disabled = false;
    }
}

// Simple Toast Helper (if not exists globally)
function showToast(message, type = 'info') {
    // Check if container exists
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'primary'} border-0 show`;
    toast.style.minWidth = '250px';
    toast.style.padding = '10px 15px';
    toast.style.borderRadius = '5px';
    toast.style.marginBottom = '10px';
    toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    toast.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white ms-auto me-2" onclick="this.parentElement.parentElement.remove()"></button>
                </div>
            `;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
// --- INVENTORY LOGIC ---

// 1. Mock Data for "Completed" Donors (Waiting for Import)
// In real app, this comes from API: Donors with status 'COMPLETED' but not yet in 'BloodStock'
const mockCompletedDonors = [
    { id: 'D001', name: 'Lê Văn C', phone: '0909090909', type: 'A+', collectedDate: '2026-01-21 08:30' },
    { id: 'D002', name: 'Phạm Văn D', phone: '0912341234', type: 'O-', collectedDate: '2026-01-21 09:15' },
    { id: 'D003', name: 'Trần Thị E', phone: '0988776655', type: 'B+', collectedDate: '2026-01-20 14:00' }
];

document.addEventListener('DOMContentLoaded', () => {
    // Populate Donor Dropdown for Technical View
    populateDonorDropdown();

    // Init Reception Flow if on Reception Page
    if (document.getElementById('eventFilterSelect')) {
        initReceptionFlow();
    }

    // Auto-load blood bags if on Technical Page
    if (document.getElementById('technicalTableBody') && document.getElementById('filterBloodType')) {
        loadBloodBags();
    }
});

async function initReceptionFlow() {
    const token = localStorage.getItem('access_token');
    console.log('[Reception] Token:', token ? 'Có token' : 'KHÔNG CÓ TOKEN');
    if (!token) {
        const select = document.getElementById('eventFilterSelect');
        if (select) select.innerHTML = '<option value="">-- Chưa đăng nhập --</option>';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/staff/assignment/my-assignment?status=ACTIVE`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('[Reception] API status:', res.status);
        
        if (res.ok) {
            const resultBE = await res.json();
            
            // --- ĐÃ SỬA DÒNG NÀY ---
            // Trích xuất mảng 'assignments' từ object response, nếu null/undefined thì gán mảng rỗng []
            const data = resultBE.assignments || []; 
            
            console.log('[Reception] Array để render:', data);
            const select = document.getElementById('eventFilterSelect');
            select.innerHTML = '<option value="">-- Chọn sự kiện phân công --</option>';
            
            if (data.length === 0) {
                select.innerHTML = '<option value="">-- Chưa có sự kiện được phân công --</option>';
                handleEventSelectChange(); // Sync UI
                return;
            }

            const roleMap = {
                'TIEP_NHAN': 'Lễ tân',
                'BAC_SI': 'Bác sĩ',
                'LAY_MAU': 'Y tá'
            };

            data.forEach(assignment => {
                const evtId = assignment.event ? assignment.event.eventId : assignment.eventId;
                const evtName = assignment.event ? assignment.event.eventName : assignment.eventName;
                // Backend trả về role, nên assignment.role là đúng
                const roleCode = assignment.role || assignment.staffRole || ''; 
                const roleLabel = roleMap[roleCode] || roleCode;
                
                const displayText = `[${roleLabel}] ${evtName}`;
                
                select.innerHTML += `<option value="${evtId}" data-role="${roleCode}">${displayText}</option>`;
            });
            handleEventSelectChange(); // Sync UI with the default empty selection
        } else {
            const errText = await res.text();
            console.error('[Reception] Lỗi API:', res.status, errText);
            const select = document.getElementById('eventFilterSelect');
            if (select) select.innerHTML = `<option value="">-- Lỗi tải (${res.status}) --</option>`;
        }
    } catch (e) {
        console.error("Lỗi khi tải danh sách sự kiện:", e);
        const select = document.getElementById('eventFilterSelect');
        if (select) select.innerHTML = '<option value="">-- Lỗi kết nối --</option>';
    }
}

window.handleEventSelectChange = async () => {
    const eventSelect = document.getElementById('eventFilterSelect');
    const eventId = eventSelect.value;
    const tbody = document.getElementById('receptionTableBody');
    
    // Manage Global action buttons based on selected role
    const qrBtn = document.querySelector('.btn-scan-qr');
    const walkInBtn = document.querySelector('.btn-walk-in');
    
    // Find role in dataset
    const selectedOption = eventSelect.options[eventSelect.selectedIndex];
    const role = selectedOption ? selectedOption.getAttribute('data-role') : '';

    if (qrBtn) {
        if (role === 'TIEP_DON') {
            qrBtn.style.display = 'inline-flex';
        } else {
            qrBtn.style.display = 'none';
        }
    }
    
    if (walkInBtn) {
        if (role === 'TIEP_DON') {
            walkInBtn.style.display = 'inline-flex';
        } else {
            walkInBtn.style.display = 'none';
        }
    }

    // Kết nối WebSocket để nhận thông báo khách vãng lai mới (cho tất cả role)
    if (eventId && typeof window.connectVisitorWS === 'function') {
        window.connectVisitorWS(eventId);
    }

    if (!eventId) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Vui lòng chọn sự kiện</td></tr>';
        return;
    }

    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4"><i class="ph-bold ph-spinner spinner text-primary"></i> Đang tải danh sách chờ khám...</td></tr>';

    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE}/api/staff/registration/get-all-donors-of-event/${eventId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const resultBE = await response.json();
            const donors = resultBE.data ? resultBE.data : resultBE;
            if (!donors || donors.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Chưa có người đăng ký sự kiện này</td></tr>';
                return;
            }

            let html = '';
            donors.forEach(donor => {
                let statusBadge = '';
                let actionBtn = '';
                
                const s = donor.status || "";
                
                if (s === 'DA_DANG_KY') {
                    statusBadge = '<span class="badge bg-warning-light">Chờ Check-in</span>';
                    if (role === 'TIEP_DON' || !role) {
                        actionBtn = `<button class="btn btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;"
                            onclick="openCheckinConfirm('${donor.fullName}', '${donor.ticketCode}', '${donor.phone || ''}', '${donor.gender || ''}', '${donor.dob || ''}')"><i class="ph-bold ph-check"></i> Check-in</button>`;
                    } else {
                        actionBtn = `<button class="btn btn-light border" disabled>Không có HĐ</button>`;
                    }
                } else if (s === 'DA_CHECK_IN' || s === 'CHO_KHAM') {
                    statusBadge = `<span class="badge bg-success-light">${s === 'CHO_KHAM' ? 'Chờ khám' : 'Đang khám'}</span>`;
                    if (role === 'KHAM_SANG_LOC' || !role) {
                        actionBtn = `<button class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem; background-color: #44afef;"
                            onclick="openVitalModal('${donor.fullName}', '${donor.regisId}', '${donor.donorId}', this)">
                            <i class="ph-bold ph-heartbeat"></i> Khám sàng lọc</button>`;
                    } else if (role === 'TIEP_DON') {
                        // Nhận diện khách vãng lai qua số điện thoại đã đăng ký trong phiên làm việc
                        if (donor.phone && visitorPhones.has(String(donor.phone))) {
                            actionBtn = `<button class="btn btn-danger" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" title="Hủy đăng ký vãng lai"
                                onclick="cancelVisitor('${donor.regisId}', this)">
                                <i class="ph-bold ph-trash"></i> Hủy
                            </button>`;
                        } else {
                            actionBtn = `<button class="btn btn-light border" disabled>Không có HĐ</button>`;
                        }
                    } else {
                        actionBtn = `<button class="btn btn-light border" disabled>Không có HĐ</button>`;
                    }
                } else if (s === 'CHO_LAY_MAU' || s === 'DONG_Y') {
                    statusBadge = '<span class="badge" style="background: #059669; color: white;">Đủ điều kiện</span>';
                    if (role === 'LAY_MAU') {
                        // Chỉ nhân viên lấy máu mới được lấy máu
                        actionBtn = `<button class="btn btn-danger" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;"
                            onclick="openCollectModal('${donor.fullName}', this, '${donor.regisId}')">
                            <i class="ph-bold ph-drop"></i> Lấy máu
                        </button>`;
                    } else if (role === 'KHAM_SANG_LOC') {
                        // Bác sĩ chỉ được Sửa kết quả khám, không lấy máu
                        actionBtn = `<button class="btn btn-light border" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;"
                            onclick="openVitalModal('${donor.fullName}', '${donor.regisId}', '${donor.donorId}', this)">
                            <i class="ph-bold ph-pencil-simple"></i> Sửa
                        </button>`;
                    } else {
                        actionBtn = `<button class="btn btn-light border" disabled>Không có HĐ</button>`;
                    }
                } else {
                    statusBadge = `<span class="badge bg-secondary-light">${s}</span>`;
                    actionBtn = `<button class="btn btn-light border" disabled>Không có HĐ</button>`;
                }

                html += `
                    <tr data-regis-id="${donor.regisId}">
                        <td>
                            <div class="fw-bold">${donor.fullName}</div>
                            <small class="text-muted d-block">${donor.gender === 'male' ? 'Nam' : donor.gender === 'female' ? 'Nữ' : 'Khác'} - ${donor.dob || '--'}</small>
                        </td>
                        <td>${donor.phone || '--'}</td>
                        <td>${statusBadge}</td>
                        <td>${actionBtn}</td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } else {
            console.log(await response.text());
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-4">Lỗi khi tải danh sách từ hệ thống</td></tr>';
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-4">Lỗi kết nối mạng!</td></tr>';
    }
};

function populateDonorDropdown() {
    const select = document.getElementById('donorSelect');
    if (!select) return;

    select.innerHTML = '<option value="">-- Chọn người hiến --</option>';

    mockCompletedDonors.forEach(donor => {
        const option = document.createElement('option');
        option.value = donor.id; // Store ID as value
        option.text = `${donor.name} - ${donor.type} (${donor.collectedDate})`;
        option.dataset.type = donor.type; // Store metadata
        select.appendChild(option);
    });
}

// 2. Auto-generate Bag ID
function generateBagId() {
    const select = document.getElementById('donorSelect');
    const bagIdInput = document.getElementById('newBagId');
    const donorId = select.value;

    if (donorId && bagIdInput) {
        // Format: YYYYMMDD-XXX (Random 3 digits for demo)
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(100 + Math.random() * 900); // 100-999

        bagIdInput.value = `${dateStr}-${randomSuffix}`;
    } else if (bagIdInput) {
        bagIdInput.value = '';
    }
}
// 3. Confirm Add to Inventory
function confirmAddBlood() {
    const modal = document.getElementById('addWholeBloodModal');
    const donorSelect = document.getElementById('donorSelect');
    const bagIdInput = document.getElementById('newBagId');

    if (!donorSelect.value) {
        alert('Vui lòng chọn người hiến!');
        return;
    }

    if (modal) {
        // Close modal
        modal.classList.remove('active');
        document.body.style.overflow = '';

        // Get Data
        const donorOption = donorSelect.options[donorSelect.selectedIndex];
        const bagId = bagIdInput.value;
        const bloodType = donorOption.dataset.type || 'O+'; // Fallback
        const volume = document.getElementById('bloodVolume').value;
        const donorId = donorSelect.value;
        const donor = mockCompletedDonors.find(d => d.id === donorId);
        const dateRaw = donor && donor.collectedDate ? donor.collectedDate : new Date().toISOString();
        const dateObj = new Date(dateRaw);
        const dateDisplay = isNaN(dateObj.getTime()) ? dateRaw : (dateObj.toLocaleDateString('vi-VN') + ' ' + dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
        const location = 'Kho biệt trữ';

        // Create HTML Row
        const tbody = document.getElementById('technicalTableBody');
        const newRow = document.createElement('tr');
        newRow.id = `row-${bagId}`;
        newRow.innerHTML = `
            <td style="text-align: center;"><input type="checkbox" class="row-checkbox" value="${bagId}" onchange="checkBulkTechnicalBtnState()"></td>
            <td><span class="text-mono fw-bold">${bagId}</span></td>
            <td class="text-center" style="text-align: center;"><span class="text-muted fw-bold">--</span></td>
            <td>Máu toàn phần (${volume}ml)</td>
            <td>${dateDisplay}</td>
            <td>${location}</td>
            <td><span class="badge bg-warning-light">Chờ xét nghiệm</span></td>
            <td>
                ${renderActionButtons('pending', bagId, dateRaw)}
            </td>
        `;

        // Prepend to table
        if (tbody) {
            tbody.insertBefore(newRow, tbody.firstChild);
        }

        // Show Success Toast
        showToast(`Đã nhập kho: ${bagId} (${bloodType}) - Chờ xét nghiệm`, 'success');

        // Optional: Remove donor from dropdown to prevent duplicate import
        donorOption.remove();
        // Reset form
        document.getElementById('newBagId').value = '';
        select.value = '';
    }
}

// --- WALK-IN LOGIC ---
function openWalkInModal() {
    const eventSelect = document.getElementById('eventFilterSelect');
    if (!eventSelect || !eventSelect.value) {
        alert("Vui lòng chọn một sự kiện đang diễn ra ở góc trên bên phải trước khi đăng ký khách vãng lai.");
        return;
    }
    const modal = document.getElementById('walkInModal');
    if (modal) {
        document.getElementById('walkInForm').reset();
        modal.classList.add('active');
    }
}

function closeWalkInModal() {
    const modal = document.getElementById('walkInModal');
    if (modal) modal.classList.remove('active');
}

async function submitWalkInRegistration() {
    const eventId = document.getElementById('eventFilterSelect').value;
    if (!eventId) return;

    // Kiểm tra checkbox cam kết
    const consentCheck = document.getElementById('wiConsentCheck');
    if (!consentCheck || !consentCheck.checked) {
        consentCheck.style.outline = '2px solid #dc2626';
        alert('Vui lòng xác nhận người hiến đã ký giấy cam kết trước khi đăng ký!');
        return;
    }
    consentCheck.style.outline = '';

    const form = document.getElementById('walkInForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const payload = {
        fullName: document.getElementById('wiName').value.trim(),
        cccd: document.getElementById('wiCccd').value.trim(),
        gender: document.getElementById('wiGender').value,
        dob: document.getElementById('wiDob').value,
        email: document.getElementById('wiEmail').value.trim(),
        phone: document.getElementById('wiPhone').value.trim(),
        address: document.getElementById('wiAddress').value.trim(),
        bloodType: document.getElementById('wiBloodType').value,
        rhFactor: document.getElementById('wiRhFactor').value
    };

    const token = localStorage.getItem('access_token');
    const btn = document.querySelector('#walkInModal .modal-footer .btn-primary');
    let oldText = "Lưu & Đăng ký";
    
    try {
        if (btn) {
            oldText = btn.innerHTML;
            btn.innerHTML = "Đang xử lý...";
            btn.disabled = true;
        }

        const response = await fetch(`${API_BASE}/api/staff/donor/regis-for-visitor/${eventId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            // Lưu SĐT của khách vãng lai để nhận diện chính xác
            if (payload.phone) {
                visitorPhones.add(payload.phone);
                _saveVisitorPhones(visitorPhones);
            }

            closeWalkInModal();
            if (typeof showToast === 'function') {
                showToast('Đăng ký khách vãng lai thành công!', 'success');
            } else {
                alert('Đăng ký khách vãng lai thành công!');
            }

            if (window.handleEventSelectChange) {
                await window.handleEventSelectChange();
            }
        } else {
            const err = await response.text();
            alert('Lỗi đăng ký: ' + err);
        }
    } catch (error) {
        console.error(error);
        alert('Lỗi kết nối tới hệ thống máy chủ.');
    } finally {
        if (btn) {
            btn.innerHTML = oldText;
            btn.disabled = false;
        }
    }
}

// Hủy đăng ký khách vãng lai — xóa dòng ngay lập tức khỏi bảng
async function cancelVisitor(regisId, btnElement) {
    if (!confirm('Bạn có chắc chắn muốn hủy đăng ký của khách vãng lai này không?')) return;

    const token = localStorage.getItem('access_token');
    const row = btnElement?.closest('tr');

    // Disable nút ngay để tránh click nhiều lần
    if (btnElement) { btnElement.disabled = true; btnElement.innerHTML = '<i class="ph-bold ph-spinner"></i>'; }

    try {
        const response = await fetch(`${API_BASE}/api/staff/donor/cancel-visitor/${regisId}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            // Đọc số điện thoại từ dòng DOM để xóa khỏi Set
            const phoneCell = row?.cells[1];
            const phoneVal = phoneCell?.innerText?.trim();
            if (phoneVal) {
                visitorPhones.delete(phoneVal);
                _saveVisitorPhones(visitorPhones);
            }

            // Xóa dòng khỏi DOM ngay lập tức — không cần reload
            if (row) {
                row.style.transition = 'opacity 0.3s';
                row.style.opacity = '0';
                setTimeout(() => row.remove(), 300);
            }
            if (typeof showToast === 'function') {
                showToast('Đã hủy đăng ký khách vãng lai.', 'success');
            }
        } else {
            const err = await response.text();
            alert('Lỗi hủy đăng ký: ' + err);
            if (btnElement) { btnElement.disabled = false; btnElement.innerHTML = '<i class="ph-bold ph-trash"></i>'; }
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối máy chủ.');
        if (btnElement) { btnElement.disabled = false; btnElement.innerHTML = '<i class="ph-bold ph-trash"></i>'; }
    }
}

// 4. Action Button Helper
function renderActionButtons(status, bagId, collectionTimeStr) {
    let buttons = '<div class="technical-actions">';

    // Always show Detail button first
    buttons += `
        <button class="btn btn-light border" style="padding: 0.35rem;" title="Xem chi tiết" onclick="openBagDetailsModal('${bagId}')">
            <i class="ph-bold ph-eye"></i>
        </button>
    `;

    // Time Check Logic (12 Hours)
    let isExpired = false;
    if (collectionTimeStr) {
        const collectedTime = new Date(collectionTimeStr);
        const now = new Date();
        const diffMs = now - collectedTime;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours > 12) {
            isExpired = true;
        }
    }
    // Mock check for existing rows without explicit time (Assume old dates are expired)
    if (!collectionTimeStr && ['BLO-2024-001', 'BLO-2024-002'].includes(bagId)) {
        isExpired = true; // Mock logic for demo rows
    }


    if (status === 'pending') {
        buttons += `
            <button class="btn btn-secondary" style="padding: 0.35rem;" title="Nhập KQ Xét nghiệm" onclick="openTestModal('${bagId}')">
                <i class="ph-bold ph-test-tube"></i>
            </button>
         `;
    } else if (status === 'ready-fraction') {
        if (isExpired) {
            buttons += `
            <button class="btn btn-secondary opacity-50" style="padding: 0.35rem; cursor: not-allowed;" disabled 
                title="Đã quá thời gian quy định (12h). Không đủ điều kiện tách chiết.">
                <i class="ph-bold ph-scissors"></i>
            </button>
             `;
        } else {
            buttons += `
            <button class="btn btn-secondary" style="padding: 0.35rem;" title="Tách chiết" onclick="fractionateBlood('${bagId}')">
                <i class="ph-bold ph-scissors"></i>
            </button>
             `;
        }
        buttons += `
            <button class="btn btn-light border" style="padding: 0.35rem;" title="Cập nhật KQ Xét nghiệm" onclick="openTestModal('${bagId}')">
                <i class="ph-bold ph-pencil-simple"></i>
            </button>
        `;
    } else if (status === 'completed') {
        buttons += `
            <button class="btn btn-secondary" style="padding: 0.35rem;" title="In nhãn">
                <i class="ph-bold ph-printer"></i>
            </button>
        `;
    } else if (status === 'unsafe') {
        buttons += `
             <button class="btn btn-light border" style="padding: 0.35rem;" title="Cập nhật KQ Xét nghiệm" onclick="openTestModal('${bagId}')">
                <i class="ph-bold ph-pencil-simple"></i>
            </button>
            <button class="btn btn-danger" style="padding: 0.35rem;" title="Tiêu hủy" onclick="openDisposalModal('${bagId}')">
                <i class="ph-bold ph-trash"></i>
            </button>
        `;
    }

    buttons += '</div>';
    return buttons;
}

// 5. Disposal Logic
let currentDisposalId = null;

function openDisposalModal(bagId) {
    const modal = document.getElementById('disposalModal');
    const titleId = document.getElementById('disposalBagId');
    const reasonAuto = document.getElementById('disposalReasonAuto');
    const reasonSelect = document.getElementById('disposalReasonSelect');

    currentDisposalId = bagId;
    if (titleId) titleId.innerText = bagId;

    if (modal) {
        // Reset
        if (reasonAuto) reasonAuto.style.display = 'none';
        if (reasonSelect) reasonSelect.value = '';

        // Check if row exists to see why it is unsafe (Optional Logic)
        // For now, allow manual selection or assume Positive if newly set

        modal.classList.add('active');
    }
}

function confirmDisposal() {
    if (!currentDisposalId) return;

    const row = document.getElementById(`row-${currentDisposalId}`);
    const modal = document.getElementById('disposalModal');

    // Validate Reason
    const reasonSelect = document.getElementById('disposalReasonSelect');
    if (!reasonSelect.value) {
        alert('Vui lòng chọn lý do hủy!');
        return;
    }

    if (row && modal) {
        // Update Status to Disposed (Gray)
        const statusCell = row.cells[6];
        const actionCell = row.cells[7];

        statusCell.innerHTML = '<span class="badge bg-secondary">Đã hủy</span>';
        actionCell.innerHTML = '<span class="text-muted small">Đã tiêu hủy</span>';

        showToast(`Đã tiêu hủy túi máu ${currentDisposalId}`, 'warning');

        modal.classList.remove('active');
    }
}

// --- DISTRIBUTION VIEW LOGIC ---

let currentReq = null; // Store current request context

function openApproveModal(hospital, type, product, qty) {
    currentReq = { hospital, type, product, qty };
    const modal = document.getElementById('approveModal');
    if (modal) {
        document.getElementById('approveHospital').innerText = hospital;
        document.getElementById('reqInfo').innerText = `${qty} ${type} (${product})`;
        document.getElementById('reqQty').value = qty;
        document.getElementById('approvedQty').value = qty; // Default to full approval

        // Generate initial Picking List
        updatePickingList();

        modal.classList.add('active');
    }
}

function updatePickingList() {
    const reqQty = parseInt(document.getElementById('reqQty').value) || 0;
    const approvedQty = parseInt(document.getElementById('approvedQty').value) || 0;
    const warning = document.getElementById('partialWarning');
    const tbody = document.getElementById('fifoTableBody');

    // 1. Handle Warning
    if (warning) {
        if (approvedQty < reqQty) {
            warning.classList.remove('d-none');
        } else {
            warning.classList.add('d-none');
        }
    }

    // 2. Generate Mock FEFO List
    if (tbody) {
        tbody.innerHTML = '';
        const today = new Date();

        for (let i = 0; i < approvedQty; i++) {
            // Mock FEFO: Expiry dates roughly ordered
            const expiryDate = new Date();
            expiryDate.setDate(today.getDate() + 10 + i * 2); // 10 days from now + increment
            const expiryStr = expiryDate.toLocaleDateString('vi-VN');
            const daysLeft = 10 + i * 2;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span class="text-mono fw-bold">BLO-2023-${900 + i}</span></td>
                <td class="text-danger small fw-bold">${expiryStr} (Còn ${daysLeft} ngày)</td>
                <td>Tủ A - Ngăn ${i + 1}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-light text-danger" title="Xóa dòng" onclick="this.closest('tr').remove()">
                        <i class="ph-bold ph-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        }
    }
}

// Confirm Export Logic (Legacy Mock click listener removed to prevent event handling conflicts with dynamic confirmExportFinal/confirmReview)

// --- BLOOD REQUEST MANAGEMENT (FOR STAFF) ---

const REQUEST_STATUS_LABELS = {
    'CHO_DUYET':            { label: 'Chờ duyệt', cls: 'badge bg-secondary-light', action: 'Duyệt', btnCls: 'btn-primary' },
    'DA_DUYET_TOAN_BO':     { label: 'Đã duyệt toàn bộ', cls: 'badge bg-success-light', action: 'Xuất kho', btnCls: 'btn-success' },
    'DA_DUYET_MOT_PHAN':     { label: 'Duyệt một phần', cls: 'badge bg-info-light', action: 'Xuất kho', btnCls: 'btn-success' },
    'DA_TU_CHOI':           { label: 'Đã từ chối', cls: 'badge bg-danger-light', action: null },
    'DANG_VAN_CHUYEN':      { label: 'Đang vận chuyển', cls: 'badge bg-warning-light', action: null, icon: 'ph-truck' },
    'DA_NHAN':              { label: 'Đã nhận', cls: 'badge bg-success-light', action: null, icon: 'ph-check-circle' },
    'GIAO_THAT_BAI':        { label: 'Giao thất bại', cls: 'badge bg-danger-light', action: 'Xác nhận trả', btnCls: 'btn-danger' },
    'DA_TRA_LAI':           { label: 'Đã trả lại', cls: 'badge bg-info-light', action: null, icon: 'ph-arrow-u-up-left' },
    'HOAN_TRA_TOAN_BO':     { label: 'Hoàn trả toàn bộ', cls: 'badge bg-danger-light', action: 'Xác nhận trả', btnCls: 'btn-danger' },
    'DA_NHAN_MOT_PHAN':     { label: 'Nhận một phần (có trả)', cls: 'badge bg-warning-light', action: 'Xác nhận trả', btnCls: 'btn-warning' }
};

const PRIORITY_MAP_STAFF = {
    'KHAN_CAP': { label: 'Khẩn cấp', cls: 'bg-danger-solid', icon: 'ph-warning-octagon' },
    'BINH_THUONG': { label: 'Bình thường', cls: 'bg-success-light', icon: 'ph-check-circle' },
    'Khẩn cấp': { label: 'Khẩn cấp', cls: 'bg-danger-solid', icon: 'ph-warning-octagon' },
    'Bình thường': { label: 'Bình thường', cls: 'bg-success-light', icon: 'ph-check-circle' }
};

let allDistributionRequests = [];

window.loadDistributionRequests = async function() {
    const tbody = document.getElementById('bloodRequestTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><i class="ph-bold ph-spinner ph-spin"></i> Đang tải danh sách yêu cầu...</td></tr>';

    const token = localStorage.getItem('access_token');
    
    try {
        // Luôn fetch tất cả trước
        const res = await fetch(`${API_BASE}/api/staff/blood-request/list-request`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            let data = await res.json();
            
            // Lọc dữ liệu phía Client (Client-side filtering)
            const searchName = document.getElementById('searchHospitalName')?.value.toLowerCase().trim() || '';
            const filterStatus = document.getElementById('filterStatus')?.value || '';
            const filterPriority = document.getElementById('filterPriority')?.value || '';

            if (searchName) {
                data = data.filter(req => req.hospitalName && req.hospitalName.toLowerCase().includes(searchName));
            }
            if (filterStatus) {
                data = data.filter(req => req.status === filterStatus);
            }
            if (filterPriority) {
                data = data.filter(req => req.priority === filterPriority);
            }

            allDistributionRequests = data;

            if (allDistributionRequests.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Chưa có yêu cầu nào từ bệnh viện (hoặc không khớp bộ lọc)</td></tr>';
                return;
            }

            tbody.innerHTML = allDistributionRequests.map(req => {
                const statusInfo = REQUEST_STATUS_LABELS[req.status] || { label: req.status, cls: 'badge bg-light' };
                
                const detailSummary = req.detailRequests.map(d => `
                    <div class="mb-1 d-flex align-items-center gap-1">
                        <span class="badge bg-danger-light" style="color: var(--danger-color); min-width: 40px;">${d.bloodType}</span>
                        <div class="small">${PRODUCT_TYPE_MAP[d.productType] || d.productType} (${d.volume}ml)</div>
                        <div class="ms-auto fw-bold text-primary">${d.approvedQuantity ?? 0}/${d.quantity}</div>
                    </div>
                `).join('');

const deadline = req.deadlineDate 
    ? new Date(req.deadlineDate).toLocaleDateString('vi-VN') 
    : '--';                
                let actionHtml = '';
                if (statusInfo.action === 'Duyệt') {
                    actionHtml = `
                        <button class="btn btn-primary btn-sm" onclick="openApproveModal(${req.requestId})" style="background-color: #44afef;">
                            <i class="ph-bold ph-check"></i> Duyệt
                        </button>
                    `;
                } else if (statusInfo.action === 'Xuất kho') {
                    actionHtml = `
                        <button class="btn btn-success btn-sm text-white" onclick="openExportModal(${req.requestId})" style="background-color: var(--success-color);">
                            <i class="ph-bold ph-truck"></i> Xuất kho
                        </button>
                    `;
                } else {
                    actionHtml = `
                        <span class="${statusInfo.cls}">
                            ${statusInfo.icon ? `<i class="ph-bold ${statusInfo.icon}"></i> ` : ''}${statusInfo.label}
                        </span>`;
                }

                const detailBtn = `
                    <button class="btn btn-outline-secondary btn-sm" onclick="viewRequestDetailStaff(${req.requestId})" title="Xem chi tiết">
                        <i class="ph-bold ph-eye"></i>
                    </button>`;

                const excelBtn = req.exportId ? `
                    <button class="btn btn-sm" style="background:#16a34a;color:#fff;" 
                        onclick="exportBloodInvoice(${req.exportId})" title="Xuất hóa đơn Excel">
                        <i class="ph-bold ph-microsoft-excel-logo"></i>
                    </button>` : '';

                const prio = PRIORITY_MAP_STAFF[req.priority] || { label: req.priority, cls: 'bg-success-light', icon: 'ph-check-circle' };

                return `
                    <tr>
                        <td>
                            <div class="hospital-name fw-bold">${req.hospitalName}</div>
                            <div class="text-muted small">#REQ-${req.requestId}</div>
                        </td>
                        <td>${detailSummary}</td>
                        <td>${req.detailRequests.reduce((s,d)=>s+d.quantity,0)} Túi</td>
                        <td><span class="badge ${prio.cls}">${prio.label}</span></td>
                        <td><span class="text-muted small">Đã kiểm tra kho ✅</span></td>
                        <td><div>${deadline}</div></td>
                        <td><div class="d-flex gap-1">${actionHtml} ${detailBtn} ${excelBtn}</div></td>
                    </tr>
                `;
            }).join('');
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Lỗi kết nối máy chủ</td></tr>';
    }
}

// Global modal ID context
let activeRequestId = null;

window.openApproveModal = function(id) {
    activeRequestId = id;
    const req = allDistributionRequests.find(r => r.requestId === id);
    if (!req) return;

    const modal = document.getElementById('approveModal');
    if (!modal) return;

    // Hide scan section for approval mode
    const scanSection = document.getElementById('scanSection');
    if (scanSection) scanSection.style.display = 'none';

    document.getElementById('approveHospital').innerText = req.hospitalName;
    
    // Tóm tắt thông tin trên Header modal
    const priorityEl = document.getElementById('approvePriority');
    const totalQtyEl = document.getElementById('totalReqQty');
    if (priorityEl) {
        const prio = PRIORITY_MAP_STAFF[req.priority] || { label: req.priority, cls: 'bg-success-light', icon: 'ph-check-circle' };
        priorityEl.innerHTML = `
            <span class="stat-chip ${prio.cls}">
                <i class="ph-bold ${prio.icon}"></i>
                ${prio.label}
            </span>`;
    }
    if (totalQtyEl) {
        totalQtyEl.innerText = req.detailRequests.reduce((sum, d) => sum + d.quantity, 0);
    }
    
    // Chi tiết từng loại chế phẩm trong bảng
    const title = modal.querySelector('h4 span');
    if (title) title.innerText = 'Chi tiết yêu cầu & Phê duyệt số lượng';

    const tbody = document.getElementById('fifoTableBody');
    tbody.innerHTML = req.detailRequests.map(d => `
        <tr data-detail-id="${d.detailId}">
            <td>
                <span class="badge bg-danger-light" style="color: var(--danger-color);">${d.bloodType}</span>
                <span class="small">${PRODUCT_TYPE_MAP[d.productType] || d.productType} (${d.volume}ml)</span>
            </td>
            <td>Yêu cầu: <strong>${d.quantity}</strong> Túi</td>
            <td colspan="2">
                <div class="input-group input-group-sm">
                    <span class="input-group-text">Duyệt:</span>
                    <input type="number" class="form-control approved-qty-input" value="${d.approvedQuantity ?? d.quantity}" min="0" max="${d.quantity}">
                </div>
            </td>
        </tr>
    `).join('');

    // Change footer button logic
    const confirmBtn = document.getElementById('confirmExportBtn');
    confirmBtn.innerHTML = '<i class="ph-bold ph-check"></i> Xác nhận Duyệt';
    confirmBtn.onclick = confirmReview;

    modal.classList.add('active');
}

async function confirmReview() {
    const modal = document.getElementById('approveModal');
    const inputs = modal.querySelectorAll('.approved-qty-input');
    const approvedDetails = [];

    inputs.forEach(input => {
        const row = input.closest('tr');
        const detailId = parseInt(row.dataset.detailId);
        approvedDetails.push({
            detailId: detailId,
            approvedQuantity: parseInt(input.value) || 0
        });
    });

    const body = { approvedDetails: approvedDetails };
    const token = localStorage.getItem('access_token');

    try {
        const res = await fetch(`${API_BASE}/api/staff/blood-request/review-request/${activeRequestId}`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            alert('Đã cập nhật trạng thái phê duyệt!');
            modal.classList.remove('active');
            loadDistributionRequests();
        } else {
            const err = await res.text();
            alert('Lỗi: ' + err);
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối máy chủ!');
    }
}

window.openExportModal = async function(id) {
    activeRequestId = id;
    const req = allDistributionRequests.find(r => r.requestId === id);
    if (!req) return;

    const modal = document.getElementById('approveModal'); // Reuse modal structure
    document.getElementById('approveHospital').innerText = req.hospitalName;
    const title = modal.querySelector('h4 span');
    if (title) title.innerText = 'Xuất kho: Chọn túi máu thực tế (Tự động gợi ý FEFO)';

    // Populate modal statistics (Priority and Total approved quantity)
    const priorityEl = document.getElementById('approvePriority');
    const totalQtyEl = document.getElementById('totalReqQty');
    if (priorityEl) {
        const prio = PRIORITY_MAP_STAFF[req.priority] || { label: req.priority, cls: 'bg-success-light', icon: 'ph-check-circle' };
        priorityEl.innerHTML = `
            <span class="stat-chip ${prio.cls}">
                <i class="ph-bold ${prio.icon}"></i>
                ${prio.label}
            </span>`;
    }
    if (totalQtyEl) {
        totalQtyEl.innerText = req.detailRequests.reduce((sum, d) => sum + (d.approvedQuantity || d.quantity), 0);
    }

    const tbody = document.getElementById('fifoTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3"><i class="ph-bold ph-spinner ph-spin"></i> Đang truy vấn kho và tối ưu FEFO...</td></tr>';

    modal.classList.add('active');

    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE}/api/staff/blood-request/list-suggested-bag/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const suggestedBags = await res.json();
            if (suggestedBags.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-3">Không tìm thấy túi máu phù hợp trong kho!</td></tr>';
            } else {
                tbody.innerHTML = suggestedBags.map(bag => `
                    <tr data-bag-id="${bag.bloodBagId}">
                        <td><span class="text-mono fw-bold">BAG-${bag.bloodBagId}</span></td>
                        <td>
                            <div class="small fw-bold text-danger">${bag.bloodType}${bag.rhFactor}</div>
                            <div class="text-muted small">${new Date(bag.expiryDate).toLocaleDateString('vi-VN')}</div>
                        </td>
                        <td>${bag.storageLocation || 'Kho'}</td>
                        <td class="text-center">
                            <input type="checkbox" class="bag-checkbox" data-bag-code="${bag.bagCode}" 
                                   ${(bag.suggested || bag.isSuggested) ? 'checked' : ''} onchange="updateScanStatus()">
                        </td>
                    </tr>
                `).join('');
                
                // Update scan count indicators on load
                updateScanStatus();
            }
        } else {
            const err = await res.text();
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-3">Lỗi: ${err}</td></tr>`;
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-3">Lỗi kết nối máy chủ!</td></tr>';
    }

    const confirmBtn = document.getElementById('confirmExportBtn');
    confirmBtn.innerHTML = '<i class="ph-bold ph-truck"></i> Xác nhận Xuất kho';
    confirmBtn.onclick = confirmExportFinal;

    // Show Scan Section
    const scanSection = document.getElementById('scanSection');
    if (scanSection) {
        scanSection.style.display = 'block';
        document.getElementById('barcodeInput').value = '';
        document.getElementById('barcodeInput').focus();
        document.getElementById('scanFeedback').innerHTML = '';
        document.getElementById('scanStatus').innerText = 'Sẵn sàng quét...';
        document.getElementById('scanStatus').className = 'text-primary italic';
    }
}

window.toggleSelectAllBags = function(mainCb) {
    const cbs = document.querySelectorAll('.bag-checkbox');
    cbs.forEach(cb => cb.checked = mainCb.checked);
    updateScanStatus();
}

window.updateScanStatus = function() {
    const totalQtyEl = document.getElementById('totalReqQty');
    const totalQty = totalQtyEl ? (parseInt(totalQtyEl.innerText) || 0) : 0;
    const checkedCount = document.querySelectorAll('#fifoTableBody .bag-checkbox:checked').length;
    const status = document.getElementById('scanStatus');
    if (status) {
        if (checkedCount === totalQty) {
            status.innerText = `Đã chọn đủ (${checkedCount}/${totalQty})`;
            status.className = 'badge bg-success-light text-success';
        } else if (checkedCount > totalQty) {
            status.innerText = `Chọn thừa (${checkedCount}/${totalQty})`;
            status.className = 'badge bg-danger-light text-danger';
        } else {
            status.innerText = `Đã đối chiếu ${checkedCount}/${totalQty} túi`;
            status.className = 'badge bg-primary-light text-primary';
        }
    }
}

window.handleBarcodeKeyPress = async function(e) {
    if (e.key === 'Enter') {
        const input = document.getElementById('barcodeInput');
        const bagCode = input.value.trim();
        if (!bagCode) return;

        const feedback = document.getElementById('scanFeedback');
        const status = document.getElementById('scanStatus');
        
        status.innerText = 'Đang kiểm tra...';
        status.className = 'text-warning italic';

        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE}/api/staff/blood-request/scan-blood-bag/${activeRequestId}`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ bagCode: bagCode })
            });

            if (res.ok) {
                const data = await res.json();
                
                // Robust extraction of numeric bag ID (e.g. "BAG-4" or "BG4" -> "4")
                const bagIdStr = bagCode.replace('BAG-', '').replace('BG', '');
                
                // Try to find checkbox by exact bagCode, or find the row by numeric ID and get its checkbox
                let checkbox = document.querySelector(`#fifoTableBody .bag-checkbox[data-bag-code="${bagCode}"]`)
                               || document.querySelector(`#fifoTableBody tr[data-bag-id="${bagIdStr}"] .bag-checkbox`);
                let row = checkbox ? checkbox.closest('tr') : document.querySelector(`#fifoTableBody tr[data-bag-id="${bagIdStr}"]`);
                
                if (row) {
                    row.classList.add('scanned-success'); // Premium glow effect
                    const statusTd = row.querySelector('td:first-child');
                    if (statusTd && !statusTd.innerHTML.includes('ph-check-circle')) {
                        statusTd.innerHTML = `<i class="ph-fill ph-check-circle text-success me-1"></i> ` + statusTd.innerHTML;
                    }
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                    
                    feedback.innerHTML = `
                        <div class="scan-feedback-badge bg-success-light text-success">
                            <i class="ph-bold ph-check-circle"></i> 
                            Khớp hoàn hảo: ${data.bloodType}${data.rhFactor} (${PRODUCT_TYPE_MAP[data.productType] || data.productType})
                        </div>`;
                } else {
                    // Tự động thêm dòng mới vào bảng nếu túi máu khớp đơn hàng nhưng không nằm trong danh sách FEFO gợi ý ban đầu
                    const newRow = document.createElement('tr');
                    newRow.setAttribute('data-bag-id', bagIdStr);
                    newRow.className = 'scanned-success';
                    newRow.innerHTML = `
                        <td>
                            <i class="ph-fill ph-check-circle text-success me-1"></i>
                            <span class="text-mono fw-bold">BAG-${bagIdStr}</span>
                        </td>
                        <td>
                            <div class="small fw-bold text-danger">${data.bloodType}${data.rhFactor}</div>
                            <div class="text-muted small">${data.expirationDate ? new Date(data.expirationDate).toLocaleDateString('vi-VN') : '--'}</div>
                        </td>
                        <td>${data.storageLocation || 'Kho'}</td>
                        <td class="text-center">
                            <input type="checkbox" class="bag-checkbox" data-bag-code="${bagCode}" checked onchange="updateScanStatus()">
                        </td>
                    `;
                    document.getElementById('fifoTableBody').appendChild(newRow);

                    feedback.innerHTML = `
                        <div class="scan-feedback-badge bg-success-light text-success">
                            <i class="ph-bold ph-check-circle"></i> 
                            Đã thêm túi ngoài FEFO: ${data.bloodType}${data.rhFactor} (${PRODUCT_TYPE_MAP[data.productType] || data.productType})
                        </div>`;
                }
                
                // Recalculate selected bags count in real-time
                updateScanStatus();
                
                status.innerText = 'Đối chiếu thành công!';
                status.className = 'badge bg-success-light text-success';
            } else {
                const err = await res.text();
                feedback.innerHTML = `
                    <div class="scan-feedback-badge bg-danger-light text-danger">
                        <i class="ph-bold ph-x-circle"></i> Lỗi: ${err}
                    </div>`;
                status.innerText = 'Lỗi đối chiếu!';
                status.className = 'badge bg-danger-light text-danger';
            }
        } catch (err) {
            console.error(err);
            feedback.innerHTML = `<div class="text-danger">Lỗi kết nối máy chủ!</div>`;
        }
        input.value = '';
        input.focus();
    }
}

async function confirmExportFinal() {
    const modal = document.getElementById('approveModal');
    const checkedCbs = modal.querySelectorAll('.bag-checkbox:checked');
    const bagIds = Array.from(checkedCbs).map(cb => {
        const row = cb.closest('tr');
        return parseInt(row.dataset.bagId);
    });

    if (bagIds.length === 0) {
        alert('Vui lòng chọn ít nhất 1 túi máu để xuất kho!');
        return;
    }

    const body = { bloodBagId: bagIds };
    const token = localStorage.getItem('access_token');

    try {
        const res = await fetch(`${API_BASE}/api/staff/blood-request/export-blood/${activeRequestId}`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            alert('Xuất kho thành công! Đơn hàng đang trên đường vận chuyển.');
            modal.classList.remove('active');
            loadDistributionRequests();
        } else {
            const err = await res.text();
            alert('Lỗi: ' + err);
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối máy chủ!');
    }
}

// Global Modal Close Handler
document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('[data-modal-close]');
    if (closeBtn) {
        const modal = closeBtn.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
    }
});

// --- VIEW DETAIL FOR STAFF (PREMIUM UI) ---
window.viewRequestDetailStaff = async function(id) {
    const modal = document.getElementById('orderDetailModal');
    const modalBody = document.getElementById('staffDetailModalBody');
    const titleId = document.getElementById('staffDetailReqId');

    if (!modal || !modalBody) return;

    titleId.innerText = 'REQ-' + id;
    modalBody.innerHTML = `
        <div class="text-center py-5">
            <i class="ph-bold ph-spinner ph-spin" style="font-size:2.5rem; color: var(--primary-color);"></i>
            <p class="mt-3 text-muted fw-bold">Đang truy xuất thông tin yêu cầu...</p>
        </div>`;
    modal.classList.add('active');

    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE}/api/shared/blood-request/detail/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const err = await res.text();
            modalBody.innerHTML = `<div class="alert alert-danger mx-3 mt-3">Lỗi: ${err}</div>`;
            return;
        }

        const data = await res.json();
        const statusInfo = REQUEST_STATUS_LABELS[data.status] || { label: data.status, cls: 'bg-light', icon: 'ph-info' };
        const deadline = data.deadlineDate ? new Date(data.deadlineDate).toLocaleDateString('vi-VN') : '--';
        const requestedAt = data.requestedDate ? new Date(data.requestedDate).toLocaleString('vi-VN') : '--';
        const prio = PRIORITY_MAP_STAFF[data.priority] || { label: data.priority, cls: 'bg-success-light', icon: 'ph-check-circle' };

        modalBody.innerHTML = `
            <div class="detail-modal-body">
                <!-- Section 1: Header Info Card -->
                <div class="detail-header-card">
                    <div class="detail-info-item">
                        <div class="label">Đơn vị yêu cầu</div>
                        <div class="value">
                            <i class="ph-bold ph-hospital text-primary"></i>
                            ${data.hospitalName}
                        </div>
                    </div>
                    <div class="detail-info-item">
                        <div class="label">Mức độ</div>
                        <div class="value">
                            <span class="stat-chip ${prio.cls}">
                                <i class="ph-bold ${prio.icon}"></i>
                                ${prio.label}
                            </span>
                        </div>
                    </div>
                    <div class="detail-info-item">
                        <div class="label">Trạng thái</div>
                        <div class="value">
                            <span class="stat-chip ${statusInfo.cls}">
                                <div class="status-pulse"></div>
                                ${statusInfo.label}
                            </span>
                        </div>
                    </div>
                    <div class="detail-info-item">
                        <div class="label">Ngày gửi</div>
                        <div class="value">
                            <i class="ph-bold ph-calendar-blank text-muted"></i>
                            ${requestedAt}
                        </div>
                    </div>
                    <div class="detail-info-item" style="grid-column: span 2;">
                        <div class="label">Thời hạn (Deadline)</div>
                        <div class="value text-danger">
                            <i class="ph-bold ph-timer"></i>
                            ${deadline}
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
                                <th>Số lượng</th>
                                <th>Đã duyệt</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.requestedItems.map(item => `
                                <tr>
                                    <td><strong class="text-danger" style="font-size: 1.1rem;">${item.bloodType}</strong></td>
                                    <td>${PRODUCT_TYPE_MAP[item.productType] || item.productType}</td>
                                    <td>${item.volume} ml</td>
                                    <td><span class="fw-bold">${item.quantity}</span> túi</td>
                                    <td>
                                        ${item.approvedQuantity != null
                                            ? `<strong class="text-primary">${item.approvedQuantity} túi</strong>`
                                            : '<span class="text-muted italic">Chờ duyệt</span>'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Section 3: Export Details if applicable -->
                ${(data.exportedBags && data.exportedBags.length > 0) ? `
                    <div class="detail-section">
                        <div class="detail-section-title">
                            <i class="ph-bold ph-package"></i>
                            Túi máu đã xuất kho
                        </div>
                        <div class="alert alert-success py-2 px-3 mb-3 d-flex justify-content-between align-items-center" style="font-size: 0.85rem;">
                            <span><i class="ph-fill ph-check-circle"></i> Đã xuất kho thành công</span>                        
                        </div>

                        <div class="alert alert-success py-2 px-3 mb-3 d-flex justify-content-between align-items-center" style="font-size: 0.85rem;">
                            <span class="text-muted small">Người xuất: ${data.exportedBy || 'N/A'}</span>
                        </div>
                        <table class="premium-table">
                            <thead>
                                <tr>
                                    <th>Mã túi</th>
                                    <th>Chế phẩm</th>
                                    <th>Hạn dùng</th>
                                    <th>Vị trí kho</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.exportedBags.map(bag => `
                                    <tr>
                                        <td><span class="text-mono fw-bold text-primary">BAG-${bag.bloodBagId}</span></td>
                                        <td style="font-size: 0.8rem;">
                                            <div class="fw-bold text-danger">${bag.bloodType}${bag.rhFactor}</div>
                                            <div>${PRODUCT_TYPE_MAP[bag.productType] || bag.productType}</div>
                                        </td>
                                        <td>${new Date(bag.expiredAt).toLocaleDateString('vi-VN')}</td>
                                        <td><span class="text-muted small">${bag.storageLocation}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}
            </div>
        `;
    } catch (e) {
        console.error(e);
        modalBody.innerHTML = '<div class="alert alert-danger mx-3 mt-3">Lỗi kết nối máy chủ!</div>';
    }
}

window.closeStaffDetailModal = function() {
    const modal = document.getElementById('orderDetailModal');
    if (modal) modal.classList.remove('active');
}

// Auto load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('bloodRequestTableBody')) {
        loadDistributionRequests();
    }
});



// ==================== EXCEL EXPORT ====================

/**
 * Hàm dùng chung để tải file Excel (blob) từ BE và trigger download
 */
async function downloadExcelFile(url, fileName) {
    const token = localStorage.getItem('access_token');
    const res = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
}

/**
 * Xuất danh sách người hiến của sự kiện ra Excel
 * API: GET /api/staff/reports/events/{eventId}/donors
 */
window.exportEventDonors = async function() {
    const eventSelect = document.getElementById('eventFilterSelect');
    const eventId = eventSelect ? eventSelect.value : '';

    if (!eventId) {
        alert('Vui lòng chọn sự kiện trước khi xuất Excel!');
        return;
    }

    const btn = document.getElementById('exportEventBtn');
    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.innerHTML = '<i class="ph-bold ph-spinner-gap ph-spin"></i> Đang xuất...';
        btn.disabled = true;
    }

    try {
        if (typeof showToast === 'function') showToast('Đang tạo file Excel...', 'info');
        await downloadExcelFile(
            `${API_BASE}/api/staff/reports/events/${eventId}/donors`,
            `Danh_Sach_Nguoi_Hien_Mau_SK_${eventId}.xlsx`
        );
        if (typeof showToast === 'function') showToast('Xuất Excel thành công!', 'success');
    } catch (e) {
        console.error(e);
        alert('Lỗi khi xuất Excel: ' + e.message);
    } finally {
        if (btn) {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    }
};

/**
 * Xuất hóa đơn xuất kho ra Excel
 * API: GET /api/staff/reports/blood-exports/{exportId}/invoice
 */
window.exportBloodInvoice = async function(exportId) {
    if (!exportId) {
        alert('Không tìm thấy mã phiếu xuất kho!');
        return;
    }
    try {
        if (typeof showToast === 'function') showToast(`Đang tạo hóa đơn Excel #${exportId}...`, 'info');
        await downloadExcelFile(
            `${API_BASE}/api/staff/reports/blood-exports/${exportId}/invoice`,
            `Hoa_Don_Xuat_Kho_${exportId}.xlsx`
        );
        if (typeof showToast === 'function') showToast('Xuất hóa đơn Excel thành công!', 'success');
    } catch (e) {
        console.error(e);
        alert('Lỗi khi xuất hóa đơn: ' + e.message);
    }
};


// ==================== WEBSOCKET - URGENT ALERT ====================

let _stompClient = null;

/**
 * Kết nối WebSocket tới Backend Spring Boot.
 * Tự động thử lại mỗi 5 giây nếu mất kết nối.
 * Chỉ khởi chạy khi trang có phần tử #urgent-alert-box (tức distribution.html).
 */
function connectWebSocket() {
    // Chỉ kết nối nếu trang có khung thông báo khẩn cấp
    if (!document.getElementById('urgent-alert-box')) return;

    // Đảm bảo SockJS & Stomp đã load
    if (typeof SockJS === 'undefined' || typeof Stomp === 'undefined') {
        setTimeout(connectWebSocket, 1000);
        return;
    }

    // Lấy JWT token - nếu chưa có thì chờ thêm 2 giây (auth chưa xong)
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.warn('[BloodBank WS] Chưa có token, thử lại sau 2 giây...');
        setTimeout(connectWebSocket, 2000);
        return;
    }

    const socket = new SockJS(`${API_BASE}/ws-bloodbank`);
    _stompClient = Stomp.over(socket);

    // Tắt log STOMP để console gọn hơn
    _stompClient.debug = null;

    // Gửi JWT token trong header STOMP để backend xác thực
    const stompHeaders = {
        'Authorization': 'Bearer ' + token
    };

    _stompClient.connect(
        stompHeaders,
        function (frame) {
            console.log('🟢 [BloodBank WS] Kết nối WebSocket thành công!');

            // Subscribe kênh phát sóng yêu cầu khẩn cấp
            _stompClient.subscribe('/topic/urgent-requests', function (notification) {
                try {
                    const data = JSON.parse(notification.body);
                    showUrgentAlert(data);
                } catch (e) {
                    console.error('[BloodBank WS] Parse lỗi:', e);
                }
            });

            // Subscribe kênh phát sóng tất cả yêu cầu (thông thường & khẩn cấp & cập nhật)
            _stompClient.subscribe('/topic/blood-requests', function (notification) {
                try {
                    const data = JSON.parse(notification.body);
                    console.log('📢 [BloodBank WS] Nhận thông báo yêu cầu máu:', data);
                    if (data.priority === 'KHAN_CAP') {
                        showUrgentAlert(data);
                    } else {
                        if (typeof showToast === 'function') {
                            showToast(data.message || 'Có yêu cầu máu mới!', 'info');
                        }
                    }
                    // Tự động load lại danh sách yêu cầu máu trên giao diện phân phối nếu hàm loadBloodRequests tồn tại
                    if (typeof loadBloodRequests === 'function') {
                        loadBloodRequests();
                    }
                } catch (e) {
                    console.error('[BloodBank WS] Parse lỗi:', e);
                }
            });

            // Tự động subscribe nếu đang ở trang Quy trình kỹ thuật (technical.html)
            if (document.getElementById('technicalTableBody')) {
                autoSubscribePendingReturnOrders();
            }
        },
        function (error) {
            console.warn('🔴 [BloodBank WS] Mất kết nối, thử lại sau 5 giây...', error);
            setTimeout(connectWebSocket, 5000);
        }
    );
}

// --- WS SUBSCRIPTIONS FOR TECHNICIANS ON RETURN ORDERS ---
async function autoSubscribePendingReturnOrders() {
    const token = localStorage.getItem('access_token');
    try {
        // Lấy danh sách return logs đang DANG_CHO để tự động subscribe
        const res = await fetch(`${API_BASE}/api/staff/return-log/list-return?action=DANG_CHO&page=0&size=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            const list = data.content || [];
            
            // Trích xuất danh sách returnOrderId độc nhất
            const returnOrderIds = Array.from(new Set(
                list.map(log => log.returnOrderId).filter(id => id !== null && id !== undefined)
            ));
            
            returnOrderIds.forEach(orderId => {
                subscribeToReturnOrderInspection(orderId);
            });
        }
    } catch (e) {
        console.error('[BloodBank WS] Lỗi tự động đăng ký kênh đơn hoàn trả:', e);
    }
}

window.subscribeToReturnOrderInspection = function(returnOrderId) {
    if (!_stompClient || !_stompClient.connected) {
        setTimeout(() => window.subscribeToReturnOrderInspection(returnOrderId), 1000);
        return;
    }
    
    if (window._subscribedReturnOrders && window._subscribedReturnOrders.has(returnOrderId)) {
        return;
    }
    if (!window._subscribedReturnOrders) {
        window._subscribedReturnOrders = new Set();
    }
    window._subscribedReturnOrders.add(returnOrderId);
    
    console.log(`🟢 [BloodBank WS] Đăng ký kênh hoàn trả đơn #${returnOrderId}: /topic/return-order/${returnOrderId}/inspection-done`);
    
    _stompClient.subscribe(`/topic/return-order/${returnOrderId}/inspection-done`, function (notification) {
        try {
            const data = JSON.parse(notification.body);
            // Hiển thị toast thông báo
            if (typeof showToast === 'function') {
                showToast(data.message || `Đơn hoàn trả #${returnOrderId} đã kiểm tra xong!`, 'success');
            } else {
                alert(data.message || `Đơn hoàn trả #${returnOrderId} đã kiểm tra xong!`);
            }
            
            // Reload lại danh sách túi máu nếu có hàm loadBloodBags
            if (typeof loadBloodBags === 'function') {
                loadBloodBags();
            }
        } catch (e) {
            console.error('[BloodBank WS] Lỗi xử lý tin nhắn inspection-done:', e);
        }
    });
};

/**
 * Hiển thị popup cảnh báo yêu cầu khẩn cấp.
 * @param {Object} data - Object từ Backend (NotiMess):
 *   { title, message, priority, hospitalName, deadline }
 */
function showUrgentAlert(data) {
    const alertBox = document.getElementById('urgent-alert-box');
    if (!alertBox) return;

    // Điền dữ liệu
    const titleEl    = document.getElementById('alert-title');
    const messageEl  = document.getElementById('alert-message');
    const priorityEl = document.getElementById('alert-priority');
    const hospitalEl = document.getElementById('alert-hospital');
    const timeEl     = document.getElementById('alert-time');

    if (titleEl)    titleEl.textContent    = data.title    || '🚨 BÁO ĐỘNG KHẨN CẤP';
    if (messageEl)  messageEl.textContent  = data.message  || '';
    if (priorityEl) priorityEl.textContent = data.priority ? `⚡ Mức độ: ${data.priority}` : '';
    if (hospitalEl) hospitalEl.textContent = data.hospitalName ? `🏥 ${data.hospitalName}` : '';
    if (timeEl)     timeEl.textContent     = data.deadline  ? `⏰ Thời hạn: ${data.deadline}` : '';

    // Hiển thị và thêm hiệu ứng rung/nhấp nháy
    alertBox.classList.remove('alert-hidden');
    alertBox.classList.add('alert-pulse');

    // Phát âm thanh cảnh báo
    try {
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        audio.volume = 0.8;
        audio.play().catch(() => {/* Trình duyệt chặn autoplay - bỏ qua */});
    } catch (e) { /* ignore */ }

    console.log('📢 [BloodBank WS] Yêu cầu khẩn cấp nhận được:', data);
}

/**
 * Đóng popup cảnh báo.
 */
window.closeUrgentAlert = function() {
    const alertBox = document.getElementById('urgent-alert-box');
    if (!alertBox) return;
    alertBox.classList.add('alert-hidden');
    alertBox.classList.remove('alert-pulse');
};

// Khởi động WebSocket khi trang distribution.html load xong
(function initWS() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', connectWebSocket);
    } else {
        connectWebSocket();
    }
})();

// --- RETURNED ORDERS MANAGEMENT ---

async function getStaffId() {
    let staffId = localStorage.getItem('staff_id');
    if (staffId && staffId !== 'undefined' && staffId !== 'null') return staffId;
    
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE}/api/shared/user/get-profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const profile = await res.json();
            if (profile && profile.staffId) {
                localStorage.setItem('staff_id', profile.staffId);
                return profile.staffId;
            }
        }
    } catch (e) {
        console.error('Error fetching staff profile:', e);
    }
    return null;
}

window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });

    if (tabId === 'waiting-returns') {
        document.getElementById('tab-waiting-btn').classList.add('active');
        const content = document.getElementById('tab-waiting-returns');
        content.classList.add('active');
        content.style.display = 'block';
        loadReturnedRequests();
    } else if (tabId === 'return-history') {
        document.getElementById('tab-history-btn').classList.add('active');
        const content = document.getElementById('tab-return-history');
        content.classList.add('active');
        content.style.display = 'block';
        loadReturnHistory();
    }
}

let uniqueHospitalsList = []; // Global unique hospitals list extracted from requests

window.loadReturnedRequests = async function() {
    const tbody = document.getElementById('returnedRequestTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><i class="ph-bold ph-spinner ph-spin"></i> Đang tải danh sách hàng trả...</td></tr>';

    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE}/api/staff/blood-request/list-request`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const allReqs = await res.json();
            
            // Extract unique hospitals from requests list for the dropdown in scan mode
            const tempHospitals = {};
            allReqs.forEach(r => {
                if (r.hospitalId && r.hospitalName) {
                    tempHospitals[r.hospitalId] = r.hospitalName;
                }
            });
            uniqueHospitalsList = Object.entries(tempHospitals).map(([id, name]) => ({
                hospitalId: parseInt(id),
                hospitalName: name
            }));
            
            // Filter only requests with returned/failed/partial statuses
            const returnStatuses = ['GIAO_THAT_BAI', 'HOAN_TRA_TOAN_BO', 'DA_NHAN_MOT_PHAN', 'DA_TRA_LAI'];
            const returnedReqs = allReqs.filter(r => returnStatuses.includes(r.status));
            
            if (returnedReqs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-5">Không có đơn hàng nào bị trả lại hoặc giao thất bại.</td></tr>';
                return;
            }

            tbody.innerHTML = returnedReqs.map(req => {
                const statusInfo = REQUEST_STATUS_LABELS[req.status] || { label: req.status, cls: 'badge bg-light' };
                const detailSummary = req.detailRequests.map(d => `
                    <div class="small mb-1">
                        <span class="badge bg-danger-light" style="color: var(--danger-color);">${d.bloodType}</span> 
                        ${PRODUCT_TYPE_MAP[d.productType] || d.productType}: <strong>${d.approvedQuantity || 0}</strong> túi
                    </div>
                `).join('');

                const updatedAt = req.updatedAt ? new Date(req.updatedAt).toLocaleString('vi-VN') : '--';

                let actionHtml = '';
                if (req.status !== 'DA_TRA_LAI') {
                    actionHtml = `
                        <button class="btn btn-primary btn-sm d-flex align-items-center gap-1" onclick="openRequestReturnDetail(${req.requestId})">
                            <i class="ph-bold ph-pencil-simple-line"></i> Chi tiết & Xử lý
                        </button>
                    `;
                } else {
                    actionHtml = `<span class="text-muted small italic">Đã trả lại hoàn toàn</span>`;
                }

                return `
                    <tr>
                        <td>
                            <div class="fw-bold">${req.hospitalName}</div>
                            <div class="text-muted small">#REQ-${req.requestId}</div>
                        </td>
                        <td>${detailSummary}</td>
                        <td>${req.detailRequests.reduce((s,d)=>s+(d.approvedQuantity||0),0)} Túi</td>
                        <td><span class="${statusInfo.cls}">${statusInfo.label}</span></td>
                        <td><div class="small">${updatedAt}</div></td>
                        <td><div class="d-flex gap-1">${actionHtml}</div></td>
                    </tr>
                `;
            }).reverse().join('');
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">Lỗi kết nối máy chủ</td></tr>';
    }
}

let currentDetailRequest = null;

// --- CHECKBOX SELECTION FOR BULK PROCESS ---
window.toggleSelectAllReturnBags = function(selectAllEl) {
    const checkboxes = document.querySelectorAll('.bag-return-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = selectAllEl.checked;
    });
    updateSelectedBagsStatus();
};

window.updateSelectedBagsStatus = function() {
    const checkboxes = document.querySelectorAll('.bag-return-checkbox');
    const checkedBoxes = Array.from(checkboxes).filter(cb => cb.checked);
    const count = checkedBoxes.length;
    
    const bulkBtn = document.getElementById('bulkInspectBtn');
    const countEl = document.getElementById('selectedBagsCount');
    
    if (countEl) countEl.innerText = count;
    
    if (bulkBtn) {
        if (count > 0) {
            bulkBtn.disabled = false;
            bulkBtn.style.opacity = '1';
            bulkBtn.style.cursor = 'pointer';
        } else {
            bulkBtn.disabled = true;
            bulkBtn.style.opacity = '0.6';
            bulkBtn.style.cursor = 'not-allowed';
        }
    }
    
    const selectAllEl = document.getElementById('selectAllReturnBags');
    if (selectAllEl && checkboxes.length > 0) {
        selectAllEl.checked = (checkboxes.length === count);
    }
};

window.openBulkProcessModalFromDetail = function() {
    const checkboxes = document.querySelectorAll('.bag-return-checkbox');
    const selectedBags = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => ({
            bloodBagId: parseInt(cb.getAttribute('data-bag-id')),
            reason: cb.getAttribute('data-reason')
        }));
        
    if (selectedBags.length === 0) return;
    
    window._selectedBagsForBulk = selectedBags;
    
    document.getElementById('processBloodBagId').value = 'BULK';
    document.getElementById('processHospitalId').value = currentDetailRequest ? currentDetailRequest.hospitalId : '';
    
    // Gộp các lý do lại thành 1 chuỗi gợi ý
    const uniqueReasons = Array.from(new Set(selectedBags.map(b => b.reason).filter(r => r)));
    document.getElementById('processReason').value = uniqueReasons.join(', ') || '';
    document.getElementById('processAction').value = '';
    
    document.getElementById('processModalTitle').innerText = 'Xử lý hàng loạt túi máu';
    document.getElementById('bulkProcessSummary').style.display = 'block';
    document.getElementById('bulkProcessCount').innerText = selectedBags.length;
    
    const modal = document.getElementById('returnProcessModal');
    if (modal) modal.classList.add('active');
};

window.openRequestReturnDetail = async function(requestId) {
    const modal = document.getElementById('requestReturnDetailModal');
    const tbody = document.getElementById('requestReturnBagsTableBody');
    if (!modal || !tbody) return;
    
    document.getElementById('detailReturnReqId').innerText = requestId;
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><i class="ph-bold ph-spinner ph-spin"></i> Đang tải chi tiết túi máu...</td></tr>';
    modal.classList.add('active');
    
    // Reset selection
    const selectAllEl = document.getElementById('selectAllReturnBags');
    if (selectAllEl) selectAllEl.checked = false;
    setTimeout(() => updateSelectedBagsStatus(), 50);
    
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE}/api/staff/return-log/return-detail/${requestId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            currentDetailRequest = await res.json();
            document.getElementById('detailReturnHospital').innerText = currentDetailRequest.hospitalName || 'N/A';
            
            // Lấy độ ưu tiên (tự động phân tích từ dữ liệu chi tiết nếu có, hoặc để nhãn mặc định)
            document.getElementById('detailReturnPriority').innerHTML = `<span class="badge bg-danger-light">Khẩn cấp</span>`;
            
            const bags = currentDetailRequest.bags || [];
            
            if (bags.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Tất cả túi máu trong yêu cầu này đã được xử lý hoàn trả hoặc không có túi bị trả lại.</td></tr>';
                return;
            }
            
            tbody.innerHTML = bags.map(bag => {
                const expiredDate = bag.expiredAt ? new Date(bag.expiredAt).toLocaleDateString('vi-VN') : '--';
                const isExpired = bag.expired;
                
                let statusLabel = '';
                if (bag.currentStatus === 'DA_XUAT') {
                    statusLabel = '<span class="badge" style="background:#fef3c7;color:#92400e;">Đã xuất kho</span>';
                } else if (bag.currentStatus === 'CHO_KIEM_DINH') {
                    statusLabel = '<span class="badge bg-warning-light">Chờ kiểm định</span>';
                } else {
                    statusLabel = `<span class="badge bg-light">${bag.currentStatus}</span>`;
                }
                
                let actionHtml = '';
                let checkboxHtml = '';
                if (bag.actionTaken && bag.actionTaken !== 'DANG_CHO') {
                    const actionLabel = bag.actionTaken === 'KIEM_DINH' 
                        ? '<span class="text-success fw-bold">Chuyển kiểm định</span>' 
                        : '<span class="text-danger fw-bold">Chỉ định hủy</span>';
                    actionHtml = `<span class="small italic text-muted">Đã xử lý: ${actionLabel}</span>`;
                    checkboxHtml = `<td></td>`;
                } else {
                    actionHtml = `
                        <button class="btn btn-primary btn-sm d-flex align-items-center gap-1 mx-auto" onclick="openProcessModal(${bag.bloodBagId}, ${currentDetailRequest.hospitalId || 'null'}, '${(bag.reason || '').replace(/'/g, '\\\'')}')">
                            <i class="ph-bold ph-arrow-u-up-left"></i> Xử lý
                        </button>
                    `;
                    checkboxHtml = `
                        <td class="text-center">
                            <input type="checkbox" class="bag-return-checkbox" data-bag-id="${bag.bloodBagId}" data-reason="${(bag.reason || '').replace(/"/g, '&quot;')}" onchange="updateSelectedBagsStatus()" style="cursor: pointer; width: 16px; height: 16px;">
                        </td>
                    `;
                }
                
                return `
                    <tr ${isExpired ? 'style="background: #fff5f5;"' : ''}>
                        ${checkboxHtml}
                        <td><span class="text-mono fw-bold text-primary">BAG-${bag.bloodBagId}</span></td>
                        <td>
                            <div class="fw-bold text-danger">${bag.bloodType}${bag.rhFactor}</div>
                            <div class="small text-muted">${PRODUCT_TYPE_MAP[bag.productType] || bag.productType}</div>
                        </td>
                        <td>${bag.volume} ml</td>
                        <td>
                            <span ${isExpired ? 'style="color:#dc2626;font-weight:700;"' : ''}>${expiredDate}</span>
                            ${isExpired ? '<div class="small text-danger"><i class="ph-bold ph-warning"></i> Hết hạn</div>' : ''}
                        </td>
                        <td><span class="text-muted small">${bag.reason || 'Không có ghi chú'}</span></td>
                        <td>${statusLabel}</td>
                        <td class="text-center">${actionHtml}</td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger py-4">Lỗi tải dữ liệu chi tiết!</td></tr>';
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger py-4">Lỗi kết nối máy chủ!</td></tr>';
    }
};

window.closeRequestReturnDetailModal = function() {
    const modal = document.getElementById('requestReturnDetailModal');
    if (modal) modal.classList.remove('active');
};

window.loadReturnHistory = async function() {
    const tbody = document.getElementById('returnHistoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><i class="ph-bold ph-spinner ph-spin"></i> Đang tải lịch sử hoàn trả...</td></tr>';

    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE}/api/staff/return-log/list-return?page=0&size=50`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            const list = data.content || [];
            
            if (list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-5">Chưa có lịch sử xử lý hoàn trả nào.</td></tr>';
                return;
            }

            tbody.innerHTML = list.map(log => {
                let actionLabel = '';
                if (log.actionTaken === 'KIEM_DINH') {
                    actionLabel = '<span class="badge bg-warning-light"><i class="ph-bold ph-flask"></i> Chờ kiểm định</span>';
                } else if (log.actionTaken === 'TIEU_HUY') {
                    actionLabel = '<span class="badge bg-danger-light"><i class="ph-bold ph-trash"></i> Tiêu hủy</span>';
                } else {
                    actionLabel = `<span class="badge bg-light">${log.actionTaken}</span>`;
                }
                
                const date = log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : '--';
                const bagCode = log.bagCode || ('BAG-' + log.bloodBagId);
                
                return `
                    <tr>
                        <td>
                            <span class="text-mono fw-bold text-primary">${bagCode}</span>
                            <div class="small text-muted">${log.bloodType} | ${PRODUCT_TYPE_MAP[log.productType] || log.productType}</div>
                        </td>
                        <td><div class="fw-bold">${log.hospitalName || 'N/A'}</div></td>
                        <td><div class="small">${log.staffName || 'N/A'}</div></td>
                        <td>${actionLabel}</td>
                        <td><div class="small text-muted">${log.reason || '--'}</div></td>
                        <td><div class="small">${date}</div></td>
                    </tr>
                `;
            }).join('');
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">Lỗi kết nối máy chủ</td></tr>';
    }
};

window.openProcessModal = function(bloodBagId, hospitalId, prefilledReason = '') {
    document.getElementById('processBloodBagId').value = bloodBagId;
    document.getElementById('processHospitalId').value = hospitalId || '';
    document.getElementById('processReason').value = prefilledReason;
    
    // Tự động phân tích lý do để chọn sẵn hành động tương ứng
    const reasonLower = prefilledReason.toLowerCase();
    const isTechnical = reasonLower.includes("hỏng") || reasonLower.includes("rách") || reasonLower.includes("vỡ") || reasonLower.includes("lỗi") || reasonLower.includes("hết hạn") || reasonLower.includes("sự cố");
    
    if (isTechnical) {
        document.getElementById('processAction').value = 'TIEU_HUY';
    } else {
        document.getElementById('processAction').value = '';
    }
    
    document.getElementById('processModalTitle').innerText = 'Xử lý hàng trả lại';
    document.getElementById('bulkProcessSummary').style.display = 'none';
    window._selectedBagsForBulk = null; // Reset bulk mode
    
    // Mở modal
    const modal = document.getElementById('returnProcessModal');
    if (modal) modal.classList.add('active');
};

window.quickScanBarcode = async function() {
    const input = document.getElementById('quickBarcodeInput');
    if (!input) return;
    const barcode = input.value.trim();
    if (!barcode) {
        alert('Vui lòng nhập hoặc quét mã vạch túi máu!');
        return;
    }

    const token = localStorage.getItem('access_token');
    const resultArea = document.getElementById('scanResultPreview');
    
    try {
        if (typeof showToast === 'function') showToast('Đang quét túi máu...', 'info');
        const res = await fetch(`${API_BASE}/api/staff/return-log/scan/${barcode}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const bagInfo = await res.json();
            
            let foundHospitalId = null;
            let foundReason = '';
            
            if (currentDetailRequest && currentDetailRequest.bags) {
                const found = currentDetailRequest.bags.find(b => b.bloodBagId === bagInfo.bloodBagId);
                if (found) {
                    foundHospitalId = currentDetailRequest.hospitalId;
                    foundReason = found.reason || '';
                }
            }
            
            if (resultArea) {
                const expiredStr = bagInfo.expiredAt
                    ? new Date(bagInfo.expiredAt).toLocaleDateString('vi-VN')
                    : '--';
                const statusMap = {
                    'DA_XUAT': '<span style="color:#92400e;font-weight:600;">Đã xuất kho</span>',
                    'CHO_KIEM_DINH': '<span style="color:#d97706;font-weight:600;">Chờ kiểm định</span>',
                };
                const statusHtml = statusMap[bagInfo.currentStatus] || bagInfo.currentStatus;
                const productLabel = (typeof PRODUCT_TYPE_MAP !== 'undefined' && PRODUCT_TYPE_MAP[bagInfo.productType]) || bagInfo.productType;
                
                resultArea.innerHTML = `
                    <div style="border:1.5px solid ${bagInfo.isExpired ? '#fca5a5' : '#86efac'};
                                background:${bagInfo.isExpired ? '#fff5f5' : '#f0fdf4'};
                                border-radius:10px; padding:1rem; margin-top:0.75rem; animation: fadeIn 0.3s ease;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem;">
                            <span style="font-weight:700;font-size:0.95rem;color:#1e293b;">
                                <i class="ph-bold ph-barcode" style="color:#3b82f6;"></i>
                                ${bagInfo.bagCode || ('BAG-' + bagInfo.bloodBagId)}
                            </span>
                            ${statusHtml}
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.4rem 1rem;font-size:0.85rem;color:#475569;">
                            <div><span style="color:#94a3b8;">Nhóm máu:</span> <strong style="color:#dc2626;">${bagInfo.bloodType}${bagInfo.rhFactor || ''}</strong></div>
                            <div><span style="color:#94a3b8;">Chế phẩm:</span> ${productLabel}</div>
                            <div><span style="color:#94a3b8;">Thể tích:</span> ${bagInfo.volume} ml</div>
                            <div><span style="color:#94a3b8;">Hạn dùng:</span> <span style="${bagInfo.isExpired ? 'color:#dc2626;font-weight:700;' : ''}">${expiredStr}</span></div>
                        </div>
                        ${bagInfo.isExpired ? `
                            <div style="margin-top:0.6rem;padding:0.5rem 0.75rem;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;color:#dc2626;font-size:0.83rem;font-weight:600;">
                                <i class="ph-bold ph-warning-circle"></i> ${bagInfo.warningMessage}
                            </div>` : `
                            <div style="margin-top:0.6rem;padding:0.5rem 0.75rem;background:#f0fdf4;border:1px solid #86efac;border-radius:6px;color:#16a34a;font-size:0.83rem;">
                                <i class="ph-bold ph-check-circle"></i> ${bagInfo.warningMessage}
                            </div>`
                        }
                        <div style="margin-top:0.75rem;text-align:right;">
                            <button class="btn btn-primary btn-sm" onclick="openProcessModal(${bagInfo.bloodBagId}, ${foundHospitalId || 'null'}, '${(foundReason || bagInfo.warningMessage || '').replace(/'/g, '\\\'')}')">
                                <i class="ph-bold ph-arrow-u-up-left"></i> Tiến hành xử lý
                            </button>
                        </div>
                    </div>
                `;
                resultArea.style.display = 'block';
            }
            
            if (typeof showToast === 'function') showToast('Đã nhận diện túi máu thành công!', 'success');
            input.value = ''; // Reset input
        } else {
            const err = await res.text();
            if (resultArea) {
                resultArea.innerHTML = `
                    <div style="border:1.5px solid #fca5a5;background:#fff5f5;border-radius:10px;padding:1rem;margin-top:0.75rem;color:#dc2626;font-size:0.875rem;">
                        <i class="ph-bold ph-x-circle"></i> <strong>Không hợp lệ:</strong> ${err || 'Không thể tìm thấy túi máu hoặc túi máu không đủ điều kiện hoàn trả.'}
                    </div>
                `;
                resultArea.style.display = 'block';
            } else {
                alert('Lỗi quét túi máu: ' + (err || 'Không đủ điều kiện hoàn trả.'));
            }
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối máy chủ!');
    }
};

window.handleQuickBarcodeKeyPress = function(e) {
    if (e.key === 'Enter') {
        quickScanBarcode();
    }
};

// ===== CAMERA-BASED BARCODE SCANNING FOR RETURN LOGS =====
let _inventoryBarcodeScanner = null;

window.openBagBarcodeScanModal = function() {
    const modal = document.getElementById('bagBarcodeScanModal');
    if (modal) modal.classList.add('active');
    setTimeout(() => {
        startInventoryBarcodeScanner();
    }, 300);
};

window.closeBagBarcodeScanModal = function() {
    stopInventoryBarcodeScanner();
    const modal = document.getElementById('bagBarcodeScanModal');
    if (modal) modal.classList.remove('active');
    const resultDiv = document.getElementById('bag-barcode-scan-result');
    if (resultDiv) resultDiv.style.display = 'none';
};

function startInventoryBarcodeScanner() {
    if (_inventoryBarcodeScanner) {
        _inventoryBarcodeScanner.clear();
        _inventoryBarcodeScanner = null;
    }
    
    _inventoryBarcodeScanner = new Html5Qrcode("bag-barcode-reader");
    
    _inventoryBarcodeScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 280, height: 160 } },
        async (decodedText) => {
            stopInventoryBarcodeScanner();
            
            const scannedCodeEl = document.getElementById('bag-barcode-scanned-code');
            const resultDiv = document.getElementById('bag-barcode-scan-result');
            if (scannedCodeEl) scannedCodeEl.innerText = decodedText;
            if (resultDiv) resultDiv.style.display = 'block';
            
            const input = document.getElementById('quickBarcodeInput');
            if (input) {
                input.value = decodedText;
                setTimeout(() => {
                    closeBagBarcodeScanModal();
                    quickScanBarcode();
                }, 800);
            } else {
                closeBagBarcodeScanModal();
            }
        },
        (errorMessage) => {
            // silent fail
        }
    ).catch(err => {
        console.error("Camera access failed: ", err);
    });
}

function stopInventoryBarcodeScanner() {
    if (_inventoryBarcodeScanner) {
        try {
            _inventoryBarcodeScanner.stop().then(() => {
                _inventoryBarcodeScanner.clear();
                _inventoryBarcodeScanner = null;
            }).catch(e => console.error("Error stopping barcode scanner:", e));
        } catch (e) {
            console.error("Error stopping barcode scanner synchronously:", e);
        }
    }
}

// Xử lý gửi Form Return Process
document.addEventListener('DOMContentLoaded', () => {
    const quickBarcodeInput = document.getElementById('quickBarcodeInput');
    if (quickBarcodeInput) {
        quickBarcodeInput.addEventListener('keypress', handleQuickBarcodeKeyPress);
    }

    const processForm = document.getElementById('returnProcessForm');
    if (processForm) {
        processForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const bloodBagIdVal = document.getElementById('processBloodBagId').value;
            const reason = document.getElementById('processReason').value;
            const action = document.getElementById('processAction').value;
            
            let payload = {
                returnOrderId: currentDetailRequest ? currentDetailRequest.returnOrderId : null,
                items: []
            };
            
            if (bloodBagIdVal === 'BULK') {
                payload.items = window._selectedBagsForBulk.map(b => ({
                    bloodBagId: b.bloodBagId,
                    action: action,
                    reason: reason
                }));
            } else {
                payload.items = [{
                    bloodBagId: parseInt(bloodBagIdVal),
                    action: action,
                    reason: reason
                }];
            }
            
            const token = localStorage.getItem('access_token');
            const submitBtn = this.querySelector('button[type="submit"]');
            const oldHtml = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Đang xử lý...';
            submitBtn.disabled = true;
            
            try {
                const staffId = await getStaffId();
                if (!staffId) {
                    alert('Lỗi: Không tìm thấy ID nhân viên đang đăng nhập.');
                    return;
                }
                
                const res = await fetch(`${API_BASE}/api/staff/return-log/inspect`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'X-Staff-Id': staffId
                    },
                    body: JSON.stringify(payload)
                });
                
                if (res.ok) {
                    const result = await res.json();
                    alert(result.summary || 'Kiểm tra hoàn trả thành công!');
                    closeModal(document.getElementById('returnProcessModal'));
                    
                    const selectAllEl = document.getElementById('selectAllReturnBags');
                    if (selectAllEl) selectAllEl.checked = false;
                    updateSelectedBagsStatus();
                    
                    if (currentDetailRequest) {
                        openRequestReturnDetail(currentDetailRequest.returnOrderId);
                    }
                    
                    loadReturnedRequests();
                    if (document.getElementById('tab-history-btn')?.classList.contains('active')) {
                        loadReturnHistory();
                    }
                } else {
                    const err = await res.text();
                    alert('Lỗi: ' + (err || 'Xử lý hoàn trả thất bại.'));
                }
            } catch (error) {
                console.error(error);
                alert('Lỗi kết nối máy chủ!');
            } finally {
                submitBtn.innerHTML = oldHtml;
                submitBtn.disabled = false;
            }
        });
    }
});


// ==========================================
// Auto-Filter cho Distribution Requests
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const searchHospitalName = document.getElementById("searchHospitalName");
    const filterPriority = document.getElementById("filterPriority");
    const filterStatus = document.getElementById("filterStatus");

    // Debounce function
    let debounceTimer;
    const debounceDelay = 500; // ms

    if (searchHospitalName && typeof loadDistributionRequests === "function") {
        searchHospitalName.addEventListener("input", () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                loadDistributionRequests();
            }, debounceDelay);
        });
    }

    if (filterPriority && typeof loadDistributionRequests === "function") {
        filterPriority.addEventListener("change", () => {
            loadDistributionRequests();
        });
    }

    if (filterStatus && typeof loadDistributionRequests === "function") {
        filterStatus.addEventListener("change", () => {
            loadDistributionRequests();
        });
    }

    // Auto load equipment list on equipment.html page load
    if (document.getElementById('equipmentTableBody')) {
        loadEquipmentList();
    }
});

window.loadEquipmentList = async function() {
    const tbody = document.getElementById('equipmentTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><i class="ph-bold ph-spinner" style="animation: spin 1s linear infinite;"></i> Đang tải...</td></tr>';

    const productType = document.getElementById('filterEquipmentProductType')?.value || '';
    const params = new URLSearchParams();
    if (productType) params.append('productType', productType);

    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE}/api/staff/storage-equipment/list-equipment?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const err = await res.text();
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">Lỗi tải dữ liệu: ${err}</td></tr>`;
            return;
        }

        const list = await res.json();

        // Calculate card stats
        let totalCount = list.length;
        let activeCount = 0;
        let maintenanceCount = 0;
        let warningCount = 0;

        list.forEach(eq => {
            if (eq.status === 'ACTIVE') activeCount++;
            if (eq.status === 'MAINTENANCE') maintenanceCount++;
        });

        // Update cards in UI
        const totalCard = document.getElementById('totalEquipments');
        const activeCard = document.getElementById('activeEquipments');
        const warningCard = document.getElementById('warningEquipments');
        const maintenanceCard = document.getElementById('maintenanceEquipments');

        if (totalCard) totalCard.innerText = totalCount;
        if (activeCard) activeCard.innerText = activeCount;
        if (warningCard) warningCard.innerText = warningCount;
        if (maintenanceCard) maintenanceCard.innerText = maintenanceCount;

        if (!list || list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Không có thiết bị nào phù hợp</td></tr>';
            return;
        }

        let html = '';
        list.forEach(eq => {
            let statusBadge = '';
            if (eq.status === 'ACTIVE') {
                statusBadge = '<span class="badge bg-success-light" style="padding: 0.25rem 0.6rem; border-radius: 0.375rem; font-weight:600;">Hoạt động</span>';
            } else if (eq.status === 'INACTIVE') {
                statusBadge = '<span class="badge bg-danger-light" style="padding: 0.25rem 0.6rem; border-radius: 0.375rem; font-weight:600;">Ngừng</span>';
            } else if (eq.status === 'MAINTENANCE') {
                statusBadge = '<span class="badge bg-warning-light" style="padding: 0.25rem 0.6rem; border-radius: 0.375rem; font-weight:600;">Bảo trì</span>';
            } else {
                statusBadge = `<span class="badge" style="background: #e5e7eb; color: #374151; padding: 0.25rem 0.6rem; border-radius: 0.375rem; font-weight:600;">${eq.status}</span>`;
            }

            const productLabel = PRODUCT_TYPE_MAP[eq.productType] || eq.productType || '--';
            const standardTemp = eq.standard || '--';
            const loadVal = eq.currentLoad !== null && eq.currentLoad !== undefined ? eq.currentLoad : 0;
            const maxVal = eq.maxCapacity || 0;
            const eqCode = 'TB' + String(eq.equipmentId).padStart(3, '0');

            html += `
            <tr>
                <td><span class="text-mono" style="font-weight:600;">${eqCode}</span></td>
                <td><span style="font-weight:500;">${eq.name}</span></td>
                <td>${productLabel}</td>
                <td>${standardTemp}</td>
                <td>${maxVal}</td>
                <td>${loadVal}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="action-btn" onclick="openEditEquipmentModal(${eq.equipmentId}, '${eq.name}')" title="Chỉnh sửa thiết bị" style="padding:0.25rem;">
                        <i class="ph-bold ph-pencil-simple" style="font-size:1.15rem; color:var(--text-secondary);"></i>
                    </button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;

    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger py-4">Lỗi kết nối tới server</td></tr>';
    }
};

window.openEditEquipmentModal = function(id, name) {
    alert(`Chức năng cập nhật thiết bị ${name} (ID: ${id}) đang được phát triển.`);
};

// ===== CAMERA-BASED BARCODE SCANNING FOR BLOOD BAGS =====
let bagBarcodeScanner = null;

window.openBagBarcodeScanModal = function() {
    const modal = document.getElementById('bagBarcodeScanModal');
    if (modal) modal.classList.add('active');
    setTimeout(() => {
        startBagBarcodeScanner();
    }, 300);
};

window.closeBagBarcodeScanModal = function() {
    stopBagBarcodeScanner();
    const modal = document.getElementById('bagBarcodeScanModal');
    if (modal) modal.classList.remove('active');
    const resultDiv = document.getElementById('bag-barcode-scan-result');
    if (resultDiv) resultDiv.style.display = 'none';
};

function startBagBarcodeScanner() {
    if (bagBarcodeScanner) {
        bagBarcodeScanner.clear();
        bagBarcodeScanner = null;
    }
    
    bagBarcodeScanner = new Html5Qrcode("bag-barcode-reader");
    
    bagBarcodeScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 280, height: 160 } },
        async (decodedText) => {
            stopBagBarcodeScanner();
            
            const scannedCodeEl = document.getElementById('bag-barcode-scanned-code');
            const resultDiv = document.getElementById('bag-barcode-scan-result');
            if (scannedCodeEl) scannedCodeEl.innerText = decodedText;
            if (resultDiv) resultDiv.style.display = 'block';
            
            const input = document.getElementById('barcodeInput');
            if (input) {
                input.value = decodedText;
                setTimeout(() => {
                    window.handleBarcodeKeyPress({ key: 'Enter' });
                    closeBagBarcodeScanModal();
                }, 800);
            } else {
                closeBagBarcodeScanModal();
            }
        },
        (errorMessage) => {
            // silent fail
        }
    ).catch(err => {
        console.error("Camera access failed: ", err);
    });
}

function stopBagBarcodeScanner() {
    if (bagBarcodeScanner) {
        try {
            bagBarcodeScanner.stop().then(() => {
                bagBarcodeScanner.clear();
                bagBarcodeScanner = null;
            }).catch(e => console.error("Error stopping barcode scanner:", e));
        } catch (e) {
            console.error("Error stopping barcode scanner synchronously:", e);
        }
    }
}
