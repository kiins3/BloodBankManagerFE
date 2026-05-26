<<<<<<< Updated upstream:script.js
var API_DEPLOY = 'https://bloodbankmanager-production.up.railway.app';
var API_BASE = API_DEPLOY;
=======
window.API_BASE = window.API_BASE || 'http://localhost:8080';
window.API_DEPLOY = window.API_DEPLOY || 'http://localhost:8080';
>>>>>>> Stashed changes:js/script.js
// Chart Configuration
const setupCharts = () => {
    if (window.location.pathname.includes('/admin_view/index.html') || window.location.pathname.endsWith('/admin_view/')) {
        return;
    }
    // Inventory Bar Chart (Existing)
    const ctxInventory = document.getElementById('inventoryChart');
    if (ctxInventory) {
        new Chart(ctxInventory, {
            type: 'bar',
            data: {
                labels: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
                datasets: [
                    {
                        label: 'Tồn kho hiện tại',
                        data: [45, 12, 38, 8, 15, 5, 62, 18],
                        backgroundColor: '#ef4444',
                        borderRadius: 4,
                        maxBarThickness: 32
                    },
                    {
                        label: 'Mức yêu cầu',
                        data: [50, 15, 40, 12, 18, 8, 70, 25],
                        backgroundColor: '#e5e7eb',
                        borderRadius: 4,
                        maxBarThickness: 32,
                        hidden: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f3f4f6', drawBorder: false }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // Campaign Performance Stacked Bar Chart (New)
    const ctxCampaign = document.getElementById('campaignChart');
    if (ctxCampaign) {
        new Chart(ctxCampaign, {
            type: 'bar',
            data: {
                labels: ['Hiến máu T10', 'Ngày hội đỏ', 'Giọt hồng T11', 'Noel Yêu thương', 'Xuân Hồng'],
                datasets: [
                    {
                        label: 'Đăng ký Online',
                        data: [150, 200, 180, 250, 300],
                        backgroundColor: '#d1d5db', // Lighter Gray
                        borderRadius: 4,
                        categoryPercentage: 0.7,
                        barPercentage: 0.8,
                        order: 1 // Behind
                    },
                    {
                        label: 'Thực tế đến',
                        data: [120, 185, 160, 230, 280],
                        backgroundColor: '#ef4444', // Red
                        borderRadius: 4,
                        categoryPercentage: 0.7,
                        barPercentage: 0.5, // Thinner bar
                        order: 0 // On top
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    x: {
                        stacked: false, // Overlay
                        grid: { display: false }
                    },
                    y: {
                        stacked: false, // Overlay
                        grid: { color: '#f3f4f6', drawBorder: false }
                    }
                }
            }
        });
    }
};

// Blood Status Grid
const setupStatusGrid = (filterType = 'whole') => {
    const grid = document.getElementById('bloodStatusGrid');
    if (!grid) return;

    // Mock different data based on filter
    let dataMultiplier = 1;
    let colorTheme = '#10b981'; // Default Green/Red logic
    let liquidColor = '#ef4444'; // default red liquid

    if (filterType === 'rbc') {
        dataMultiplier = 0.8;
        liquidColor = '#b91c1c'; // Darker red
    } else if (filterType === 'plasma') {
        dataMultiplier = 1.2;
        liquidColor = '#f59e0b'; // Yellow/Amber
    } else if (filterType === 'platelets') {
        dataMultiplier = 0.4;
        liquidColor = '#fbbf24'; // Lighter yellow
    }

    // Mock Data Generator
    const generateData = (baseCount, baseReq) => {
        const count = Math.round(baseCount * dataMultiplier);
        const req = Math.round(baseReq * dataMultiplier);
        const percent = Math.min(100, Math.round((count / req) * 100));
        let status = 'Ổn';
        let badgeClass = 'bg-success-solid';

        if (percent < 50) {
            status = 'Thấp';
            badgeClass = 'bg-warning-solid';
        }

        return { count, req, percent, status, badgeClass };
    };

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const baseValues = [
        { c: 45, r: 50 }, { c: 12, r: 15 }, { c: 38, r: 40 }, { c: 8, r: 12 },
        { c: 15, r: 18 }, { c: 5, r: 8 }, { c: 62, r: 70 }, { c: 18, r: 25 }
    ];

    grid.innerHTML = bloodTypes.map((type, index) => {
        const stats = generateData(baseValues[index].c, baseValues[index].r);

        return `
            <div class="blood-card">
                <!-- Icon Tube -->
                <div class="blood-tube-container">
                    <div class="tube-hanger"></div>
                    <div class="blood-tube">
                        <!-- Liquid -->
                        <div class="liquid" style="height: ${stats.percent}%; background-color: ${liquidColor};">
                           <div class="liquid-wave"></div>
                        </div>
                    </div>
                    <div class="tube-tip"></div>
                </div>
                
                <!-- Blood Type -->
                <h4 style="font-weight: 700; font-size: 1.5rem; margin-bottom: 0.5rem; color: #111827;">${type}</h4>
                
                <!-- Status Badge -->
                <div style="margin-bottom: 1rem;">
                     <span class="badge ${stats.badgeClass}" style="padding: 0.25rem 1rem; border-radius: 99px; color: white;">${stats.status}</span>
                </div>
                
                <!-- Stats Stack -->
                <div style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6;">
                    <p>Tồn kho: <span style="font-weight: 600; color: var(--text-primary);">${stats.count}</span></p>
                    <p>Cần: <span style="font-weight: 600; color: var(--text-primary);">${stats.req}</span></p>
                    <p style="font-size: 0.75rem;">(${stats.percent}%)</p>
                </div>
            </div>
        `;
    }).join('');
};

document.addEventListener('DOMContentLoaded', () => {
    setupCharts();
    setupStatusGrid();
    setupModals();
    if (typeof setupStaffDashboard === 'function') setupStaffDashboard();

    // Event Listener for Filter
    const filterSelect = document.getElementById('bloodTypeFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            setupStatusGrid(e.target.value);
        });
    }
});

// Modal Logic
const setupModals = () => {
    const openButtons = document.querySelectorAll('[data-modal-target]');
    const closeButtons = document.querySelectorAll('[data-modal-close]');
    const overlays = document.querySelectorAll('.modal-overlay');

    openButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-modal-target');
            const modal = document.getElementById(modalId);
            if (modal) {
                openModal(modal);
            }
        });
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal-overlay');
            closeModal(modal);
        });
    });

    overlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
            }
        });
    });
};

const openModal = (modal) => {
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

const closeModal = (modal) => {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

/* ================= STAFF VIEW LOGIC ================= */
const setupStaffActions = () => {
    // Reception: Vital Signs & Save
    const saveVitalBtn = document.getElementById('saveVitalBtn');
    if (saveVitalBtn) {
        saveVitalBtn.addEventListener('click', () => {
            const weight = document.getElementById('weightInput').value;
            const resDiv = document.getElementById('qualificationResult');
            const modal = document.getElementById('vitalModal');

            if (!resDiv) return;

            resDiv.style.display = 'block';
            if (weight && parseFloat(weight) < 42) {
                // Reject
                resDiv.style.backgroundColor = '#fef2f2'; // Red-50
                resDiv.style.color = '#ef4444'; // Red-500
                resDiv.style.padding = '0.75rem';
                resDiv.style.borderRadius = '0.5rem';
                resDiv.innerHTML = '<i class="ph-bold ph-x-circle"></i> <strong>Không đủ điều kiện:</strong> Cân nặng dưới 42kg. Từ chối hiến máu.';
            } else if (weight) {
                // Approve
                resDiv.style.backgroundColor = '#ecfdf5'; // Green-50
                resDiv.style.color = '#10b981'; // Green-500
                resDiv.style.padding = '0.75rem';
                resDiv.style.borderRadius = '0.5rem';
                resDiv.innerHTML = '<i class="ph-bold ph-check-circle"></i> <strong>Đủ điều kiện hiến máu.</strong>';

                // Auto close after 1s
                setTimeout(() => {
                    closeModal(modal);
                    alert('Đã lưu chỉ số sinh hiệu và trạng thái người hiến.');
                    resDiv.style.display = 'none';
                    if (document.getElementById('weightInput')) document.getElementById('weightInput').value = '';
                }, 1000);
            } else {
                alert('Vui lòng nhập cân nặng.');
            }
        });
    }

    // Technical: Test Results
    const saveTestBtn = document.getElementById('saveTestBtn');
    if (saveTestBtn) {
        saveTestBtn.addEventListener('click', () => {
            const resultSelect = document.getElementById('testResultSelect');
            if (resultSelect) {
                const result = resultSelect.value;
                const modal = document.getElementById('testModal');
                closeModal(modal);

                if (result === 'positive') {
                    alert('CẢNH BÁO: Kết quả DƯƠNG TÍNH. Túi máu đã được đánh dấu HỦY và chuyển sang quy trình xử lý rác thải y tế.');
                } else {
                    alert('Kết quả Âm tính. Túi máu đã sẵn sàng nhập kho.');
                }
            }
        });
    }

    // Distribution: Confirm Export
    const confirmExportBtn = document.getElementById('confirmExportBtn');
    if (confirmExportBtn) {
        confirmExportBtn.addEventListener('click', () => {
            const modal = document.getElementById('approveModal');
            closeModal(modal);
            alert('Đã xác nhận xuất kho thành công! Phiếu xuất kho đang được in...');
        });
    }
};

window.logout = function () {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        // Xóa toàn bộ thông tin đăng nhập
        localStorage.clear();
        
        // Chuyển hướng về login.html
        const path = window.location.pathname;
        console.log("Logging out from path:", path);
        
        if (path.includes('admin_view') || path.includes('staff_view') || 
            path.includes('donor_view') || path.includes('hospital_view')) {
            window.location.href = '../login.html';
        } else {
            window.location.href = 'login.html';
        }
    }
}

/* ================= DONOR MANAGEMENT LOGIC ================= */
// Mock Donor Data
let donors = [
    {
        id: 1,
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+1-555-0123',
        cccd: '001088000123',
        gender: 'Nam',
        dob: '1990-05-15',
        address: '123 Le Van Viet, District 9, HCMC',
        bloodType: 'O',
        rhFactor: '+',
        lastDonation: '15/01/2024',
        totalDonations: 8,
        status: 'ok' // ok, not_ok, locked
    },
    {
        id: 2,
        name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        phone: '+1-555-0124',
        cccd: '079195000456',
        gender: 'Nữ',
        dob: '1995-10-20',
        address: '456 Nguyen Van Linh, District 7, HCMC',
        bloodType: 'A',
        rhFactor: '+',
        lastDonation: '10/03/2024',
        totalDonations: 5,
        status: 'not_ok'
    },
    {
        id: 3,
        name: 'Michael Brown',
        email: 'michael.brown@email.com',
        phone: '+1-555-0125',
        cccd: '080085000789',
        gender: 'Nam',
        dob: '1985-12-05',
        address: '789 Vo Van Ngan, Thu Duc, HCMC',
        bloodType: 'B',
        rhFactor: '-',
        lastDonation: '20/12/2023',
        totalDonations: 12,
        status: 'ok'
    },
    {
        id: 4,
        name: 'Emily Davis',
        email: 'emily.davis@email.com',
        phone: '+1-555-0126',
        cccd: '001199000321',
        gender: 'Nữ',
        dob: '1999-02-28',
        address: '101 Nguyen Hue, District 1, HCMC',
        bloodType: 'AB',
        rhFactor: '+',
        lastDonation: 'Never',
        totalDonations: 0,
        status: 'locked'
    }
];

const setupDonorManagement = () => {
    const tableBody = document.getElementById('donorTableBody');
    if (!tableBody) return;

    // Render Table
    const renderDonors = () => {
        tableBody.innerHTML = donors.map(donor => {
            let statusBadge = '';
            if (donor.status === 'ok') {
                statusBadge = '<span class="badge bg-success-light">Đủ điều kiện</span>';
            } else if (donor.status === 'not_ok') {
                statusBadge = '<span class="badge bg-danger-light">Không đủ ĐK</span>';
            } else {
                statusBadge = '<span class="badge" style="background: #e5e7eb; color: #374151;">Đã khóa</span>';
            }

            return `
                <tr>
                    <td>
                        <div style="font-weight: 500;">${donor.name}</div>
                    </td>
                    <td>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">${donor.email}</div>
                    </td>
                    <td>${donor.phone}</td>
                    <td>
                        <span style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-weight: 500;">
                            ${donor.bloodType}${donor.rhFactor}
                        </span>
                    </td>
                    <td>${donor.totalDonations}</td>
                    <td>${donor.lastDonation}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="action-btn" onclick="openDonorModal(${donor.id})" title="Xem/Sửa">
                                <i class="ph ph-pencil-simple"></i>
                            </button>
                            ${donor.status !== 'locked' ? `
                            <button class="action-btn" onclick="lockDonor(${donor.id})" title="Khóa tài khoản">
                                <i class="ph ph-lock-key"></i>
                            </button>` : `
                            <button class="action-btn" onclick="unlockDonor(${donor.id})" title="Mở khóa">
                                <i class="ph ph-lock-key-open"></i>
                            </button>
                            `}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    };

    renderDonors();

    // Make functions global for inline onclick
    window.openDonorModal = (id) => {
        const modal = document.getElementById('donorModal');
        const title = document.getElementById('donorModalTitle');
        const form = document.getElementById('donorForm');

        if (!modal) return;

        if (id) {
            // Edit Mode
            const donor = donors.find(d => d.id === id);
            if (!donor) return;

            title.innerText = 'Thông tin người hiến';
            document.getElementById('donorId').value = donor.id;
            document.getElementById('donorName').value = donor.name;
            document.getElementById('donorCCCD').value = donor.cccd;
            document.getElementById('donorDob').value = donor.dob;
            document.getElementById('donorGender').value = donor.gender;
            document.getElementById('donorEmail').value = donor.email;
            document.getElementById('donorPhone').value = donor.phone;
            document.getElementById('donorAddress').value = donor.address;
            document.getElementById('donorBloodType').value = donor.bloodType;
            document.getElementById('donorRhFactor').value = donor.rhFactor;
        } else {
            // Add Mode
            title.innerText = 'Thêm người hiến mới';
            form.reset();
            document.getElementById('donorId').value = '';
        }

        openModal(modal);
    };

    window.lockDonor = (id) => {
        if (confirm('Bạn có chắc chắn muốn khóa tài khoản người hiến này không?')) {
            const donor = donors.find(d => d.id === id);
            if (donor) {
                donor.status = 'locked';
                renderDonors();
            }
        }
    };

    window.unlockDonor = (id) => {
        if (confirm('Bạn có chắc chắn muốn mở khóa tài khoản này không?')) {
            const donor = donors.find(d => d.id === id);
            if (donor) {
                donor.status = 'ok'; // Reset to OK or check eligibility logic
                renderDonors();
            }
        }
    }

    // Handle Form Submit
    const form = document.getElementById('donorForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('donorId').value;
            const newDonor = {
                id: id ? parseInt(id) : donors.length + 1,
                name: document.getElementById('donorName').value,
                email: document.getElementById('donorEmail').value,
                phone: document.getElementById('donorPhone').value,
                cccd: document.getElementById('donorCCCD').value,
                gender: document.getElementById('donorGender').value,
                dob: document.getElementById('donorDob').value,
                address: document.getElementById('donorAddress').value,
                bloodType: document.getElementById('donorBloodType').value,
                rhFactor: document.getElementById('donorRhFactor').value,
                lastDonation: 'Never',
                totalDonations: 0,
                status: 'ok'
            };

            if (id) {
                const index = donors.findIndex(d => d.id === parseInt(id));
                if (index !== -1) {
                    donors[index] = { ...donors[index], ...newDonor, totalDonations: donors[index].totalDonations, lastDonation: donors[index].lastDonation, status: donors[index].status };
                }
            } else {
                donors.push(newDonor);
            }

            renderDonors();
            const modal = document.getElementById('donorModal');
            closeModal(modal);
        });
    }
};

/* ================= USER NAVIGATION LOGIC ================= */
const setupUserNavigation = () => {
    const navHeader = document.getElementById('userNavHeader');
    const navContent = document.getElementById('userNavContent');
    const navCaret = document.getElementById('userNavCaret');

    // Dropdown Toggle
    if (navHeader && navContent && navCaret) {
        navHeader.addEventListener('click', () => {
            navContent.classList.toggle('active');
            if (navContent.classList.contains('active')) {
                navCaret.classList.replace('ph-caret-left', 'ph-caret-down');
            } else {
                navCaret.classList.replace('ph-caret-down', 'ph-caret-left');
            }
        });
    }

    // View Switching
    const navDonorList = document.getElementById('navDonorList');
    const navStaffList = document.getElementById('navStaffList');
    const donorListView = document.getElementById('donorListView');
    const staffListView = document.getElementById('staffListView');
    const hospitalListView = document.getElementById('hospitalListView');
    const navHospitalList = document.getElementById('navHospitalList');
    const headerTitle = document.querySelector('.header h2');
    const headerDesc = document.querySelector('.header p');

    if (navDonorList && navStaffList && donorListView && staffListView) {
        navDonorList.addEventListener('click', (e) => {
            e.preventDefault();
            // Update Active Nav
            navDonorList.classList.add('active');
            navStaffList.classList.remove('active');
            if (navHospitalList) navHospitalList.classList.remove('active');

            // Switch Views
            donorListView.style.display = 'block';
            staffListView.style.display = 'none';
            if (hospitalListView) hospitalListView.style.display = 'none';

            // Update Header
            if (headerTitle) headerTitle.innerText = 'Quản lý người hiến';
            if (headerDesc) headerDesc.innerText = 'Quản lý hồ sơ người hiến và lịch sử hiến máu';
        });

        navStaffList.addEventListener('click', (e) => {
            e.preventDefault();
            // Update Active Nav
            navStaffList.classList.add('active');
            navDonorList.classList.remove('active');
            if (navHospitalList) navHospitalList.classList.remove('active');

            // Switch Views
            staffListView.style.display = 'block';
            donorListView.style.display = 'none';
            if (hospitalListView) hospitalListView.style.display = 'none';

            // Update Header
            if (headerTitle) headerTitle.innerText = 'Quản lý nhân viên';
            if (headerDesc) headerDesc.innerText = 'Quản lý tài khoản và chức vụ nhân sự';
        });

        if (navHospitalList && hospitalListView) {
            navHospitalList.addEventListener('click', (e) => {
                e.preventDefault();
                // Update Active Nav
                navHospitalList.classList.add('active');
                navStaffList.classList.remove('active');
                navDonorList.classList.remove('active');

                // Switch Views
                hospitalListView.style.display = 'block';
                staffListView.style.display = 'none';
                donorListView.style.display = 'none';

                // Update Header
                if (headerTitle) headerTitle.innerText = 'Quản lý bệnh viện';
                if (headerDesc) headerDesc.innerText = 'Quản lý đối tác và thông tin bệnh viện liên kết';
            });
        }
    }
};

/* ================= STAFF MANAGEMENT LOGIC ================= */
let staffMembers = [
    { id: 1, code: 'NV001', name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', dob: '1990-05-12', cccd: '001090123456', gender: 'Nam', phone: '0901234567', position: 'Quản lý kho', status: 'active' },
    { id: 2, code: 'NV002', name: 'Trần Thị B', email: 'tranthib@gmail.com', dob: '1995-08-20', cccd: '001095123456', gender: 'Nữ', phone: '0912345678', position: 'Quản lý kỹ thuật', status: 'active' },
    { id: 3, code: 'NV003', name: 'Lê Văn C', email: 'levanc@gmail.com', dob: '1988-11-05', cccd: '001088123456', gender: 'Nam', phone: '0923456789', position: 'Quản lý kho', status: 'locked' },
    { id: 4, code: 'NV004', name: 'Phạm Thị D', email: 'phamthid@gmail.com', dob: '1992-02-15', cccd: '001092123456', gender: 'Nữ', phone: '0934567890', position: 'Quản lý kỹ thuật', status: 'active' }
];

const setupStaffManagement = () => {
    const tableBody = document.getElementById('staffTableBody');
    if (!tableBody) return;

    const renderStaff = () => {
        tableBody.innerHTML = staffMembers.map(staff => {
            const statusBadge = staff.status === 'active'
                ? '<span class="badge bg-success-light">Hoạt động</span>'
                : '<span class="badge" style="background: #e5e7eb; color: #374151;">Đã khóa</span>';

            const lockIcon = staff.status === 'active' ? 'ph-lock-key' : 'ph-lock-key-open';
            const lockTitle = staff.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa';

            return `
                <tr>
                    <td style="font-weight: 500;">${staff.code}</td>
                    <td><div style="font-weight: 500;">${staff.name}</div></td>
                    <td>${staff.position}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="action-btn" onclick="openStaffModal(${staff.id})" title="Xem/Sửa">
                                <i class="ph ph-pencil-simple"></i>
                            </button>
                            <button class="action-btn" onclick="toggleStaffLock(${staff.id})" title="${lockTitle}">
                                <i class="ph ${lockIcon}"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    };

    // Disable mock rendering
    // renderStaff();

    // Globals for inline calls
    window.openStaffModal = (id) => {
        const modal = document.getElementById('staffModal');
        const title = document.getElementById('staffModalTitle');
        const form = document.getElementById('staffForm');

        if (!modal) return;

        if (id) {
            const staff = staffMembers.find(s => s.id === id);
            if (!staff) return;

            title.innerText = 'Thông tin nhân viên';
            if (document.getElementById('staffId')) document.getElementById('staffId').value = staff.id;
            if (document.getElementById('staffCode')) document.getElementById('staffCode').value = staff.code || '';
            if (document.getElementById('staffName')) document.getElementById('staffName').value = staff.name || '';
            if (document.getElementById('staffEmail')) document.getElementById('staffEmail').value = staff.email || '';
            if (document.getElementById('staffDob')) document.getElementById('staffDob').value = staff.dob || '';
            if (document.getElementById('staffCCCD')) document.getElementById('staffCCCD').value = staff.cccd || '';
            if (document.getElementById('staffGender')) document.getElementById('staffGender').value = staff.gender || 'Nam';
            if (document.getElementById('staffPhone')) document.getElementById('staffPhone').value = staff.phone || '';
            if (document.getElementById('staffPosition')) document.getElementById('staffPosition').value = staff.position || '';
            if (document.getElementById('staffStatus')) document.getElementById('staffStatus').checked = (staff.status === 'active');
        } else {
            title.innerText = 'Thêm nhân viên mới';
            if (form) form.reset();
            if (document.getElementById('staffId')) document.getElementById('staffId').value = '';
            if (document.getElementById('staffCode')) document.getElementById('staffCode').value = '';
            if (document.getElementById('staffName')) document.getElementById('staffName').value = '';
            if (document.getElementById('staffEmail')) document.getElementById('staffEmail').value = '';
            if (document.getElementById('staffDob')) document.getElementById('staffDob').value = '';
            if (document.getElementById('staffCCCD')) document.getElementById('staffCCCD').value = '';
            if (document.getElementById('staffGender')) document.getElementById('staffGender').value = 'Nam';
            if (document.getElementById('staffPhone')) document.getElementById('staffPhone').value = '';
            if (document.getElementById('staffStatus')) document.getElementById('staffStatus').checked = true;
        }

        openModal(modal);
    };

    window.toggleStaffLock = (id) => {
        const staff = staffMembers.find(s => s.id === id);
        if (staff) {
            const action = staff.status === 'active' ? 'khóa' : 'mở khóa';
            if (confirm(`Bạn có chắc chắn muốn ${action} tài khoản nhân viên này không?`)) {
                staff.status = staff.status === 'active' ? 'locked' : 'active';
                if (typeof loadStaff === 'function') loadStaff();
            }
        }
    };

    const form = document.getElementById('staffForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = e.submitter || form.querySelector('button[type="submit"]');
            let originalText = 'Lưu';
            if (btn) {
                originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang xử lý...';
            }

            const id = document.getElementById('staffId').value;

            const position = document.getElementById('staffPosition')?.value || '';
            let role = 'STAFF_TECH';
            if (position === 'QUAN_LY_KHO') {
                role = 'STAFF_INVENTORY';
            } else if (position === 'ADMIN') {
                role = 'ADMIN';
            }

            const payload = {
                fullName: document.getElementById('staffName')?.value || '',
                email: document.getElementById('staffEmail')?.value || '',
                password: document.getElementById('staffPassword')?.value || '123126',
                position: position,
                role: role
            };

            if (document.getElementById('staffDob') && document.getElementById('staffDob').value) payload.dob = document.getElementById('staffDob').value;
            if (document.getElementById('staffCCCD') && document.getElementById('staffCCCD').value) payload.cccd = document.getElementById('staffCCCD').value;
            if (document.getElementById('staffGender')) payload.gender = document.getElementById('staffGender').value;
            if (document.getElementById('staffPhone') && document.getElementById('staffPhone').value) payload.phone = document.getElementById('staffPhone').value;

            const token = localStorage.getItem('access_token');

            try {
                // Nếu chưa có ID tức là thêm mới
                if (!id) {
                    const response = await fetch(`${API_BASE}/api/admin/user/create-staff-account`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        alert("Thêm nhân viên thành công!");
                        // Lý tưởng thì nên gọi hàm GET /user/get-all-staff để lấy lại data mới
                        // Tạm thời push vào mảng hiển thị cũ giả lập
                        staffMembers.push({
                            id: staffMembers.length + 1,
                            code: `NV${(staffMembers.length + 1).toString().padStart(3, '0')}`,
                            name: payload.fullName,
                            email: payload.email,
                            dob: payload.dob,
                            cccd: payload.cccd,
                            gender: payload.gender,
                            phone: payload.phone,
                            position: payload.position,
                            status: document.getElementById('staffStatus').checked ? 'ACTIVE' : 'INACTIVE'
                        });
                        if (typeof loadStaff === 'function') loadStaff();
                        closeModal(document.getElementById('staffModal'));
                    } else {
                        const err = await response.text();
                        alert("Lỗi khi thêm: " + err);
                    }
                } else {
                    // Update Logic (nếu BE có api cập nhật sau này)
                    alert("Chức năng cập nhật nhân viên bằng API chưa được phát triển!");
                }
            } catch (error) {
                alert("Không thể kết nối đến máy chủ BE!");
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            }
        });
    }
};

/* ================= HOSPITAL MANAGEMENT LOGIC ================= */
let hospitals = [
    { id: 1, code: 'BV001', name: 'Bệnh viện Bạch Mai', email: 'bvbma@gmail.com', address: '78 Giải Phóng, Phương Đình, Đống Đa, Hà Nội', phone: '1900888866', status: 'active' },
    { id: 2, code: 'BV002', name: 'Bệnh viện Việt Đức', email: 'bvvduc@gmail.com', address: '40 Tràng Thi, Hàng Bông, Hoàn Kiếm, Hà Nội', phone: '19001902', status: 'active' }
];

const setupHospitalManagement = () => {
    const tableBody = document.getElementById('hospitalTableBody');
    if (!tableBody) return;

    const renderHospitals = () => {
        tableBody.innerHTML = hospitals.map(hospital => {
            const statusBadge = hospital.status === 'active'
                ? '<span class="badge bg-success-light">Đang hợp tác</span>'
                : '<span class="badge" style="background: #e5e7eb; color: #374151;">Ngừng hợp tác</span>';

            return `
                <tr>
                    <td style="font-weight: 500;">${hospital.code}</td>
                    <td>${hospital.name}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="action-btn" onclick="openHospitalModal(${hospital.id})" title="Xem/Cập nhật">
                                <i class="ph ph-pencil-simple"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    };

    // Disable mock rendering so admin.js can render real data
    // renderHospitals();

    // Globals for inline calls
    window.openHospitalModal = (id) => {
        const modal = document.getElementById('hospitalModal');
        const title = document.getElementById('hospitalModalTitle');
        const form = document.getElementById('hospitalForm');

        if (!modal) return;

        if (id) {
            const hospital = hospitals.find(h => h.id === id);
            if (!hospital) return;

            title.innerText = 'Thông tin bệnh viện';
            if (document.getElementById('hospitalId')) document.getElementById('hospitalId').value = hospital.id;
            if (document.getElementById('hospitalCode')) document.getElementById('hospitalCode').value = hospital.code || '';
            if (document.getElementById('hospitalName')) document.getElementById('hospitalName').value = hospital.name || '';
            if (document.getElementById('hospitalEmail')) document.getElementById('hospitalEmail').value = hospital.email || '';
            if (document.getElementById('hospitalAddress')) document.getElementById('hospitalAddress').value = hospital.address || '';
            if (document.getElementById('hospitalPhone')) document.getElementById('hospitalPhone').value = hospital.phone || '';
            if (document.getElementById('hospitalStatus')) document.getElementById('hospitalStatus').checked = (hospital.status === 'active');
        } else {
            title.innerText = 'Thêm bệnh viện mới';
            if (form) form.reset();
            if (document.getElementById('hospitalId')) document.getElementById('hospitalId').value = '';
            if (document.getElementById('hospitalCode')) document.getElementById('hospitalCode').value = '';
            if (document.getElementById('hospitalName')) document.getElementById('hospitalName').value = '';
            if (document.getElementById('hospitalEmail')) document.getElementById('hospitalEmail').value = '';
            if (document.getElementById('hospitalAddress')) document.getElementById('hospitalAddress').value = '';
            if (document.getElementById('hospitalPhone')) document.getElementById('hospitalPhone').value = '';
            if (document.getElementById('hospitalStatus')) document.getElementById('hospitalStatus').checked = true;
        }

        openModal(modal);
    };

    const form = document.getElementById('hospitalForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = e.submitter || form.querySelector('button[type="submit"]');
            let originalText = 'Lưu';
            if (btn) {
                originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang xử lý...';
            }

            const id = document.getElementById('hospitalId').value;

            const payload = {
                hospitalName: document.getElementById('hospitalName')?.value || '',
                email: document.getElementById('hospitalEmail')?.value || '',
                address: document.getElementById('hospitalAddress')?.value || '',
                hotline: document.getElementById('hospitalPhone')?.value || ''
            };

            const token = localStorage.getItem('access_token');

            try {
                if (!id) {
                    const response = await fetch(`${API_BASE}/api/admin/user/create-hospital-account`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        alert("Thêm bệnh viện thành công!");
                        // Tạm thời push vào mảng hiển thị cũ giả lập
                        hospitals.push({
                            id: hospitals.length + 1,
                            code: `BV${(hospitals.length + 1).toString().padStart(3, '0')}`,
                            name: payload.hospitalName,
                            email: payload.email,
                            address: payload.address,
                            phone: payload.hotline,
                            status: document.getElementById('hospitalStatus') && document.getElementById('hospitalStatus').checked ? 'active' : 'inactive'
                        });
                        if (typeof loadHospitals === 'function') loadHospitals();
                        closeModal(document.getElementById('hospitalModal'));
                    } else {
                        const err = await response.text();
                        alert("Lỗi khi thêm: " + err);
                    }
                } else {
                    alert("Chức năng cập nhật bệnh viện bằng API chưa được phát triển!");
                }
            } catch (error) {
                alert("Không thể kết nối đến máy chủ BE!");
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            }
        });
    }
};

/* ================= INVENTORY NAVIGATION LOGIC ================= */
const setupInventoryNavigation = () => {
    const navHeader = document.getElementById('inventoryNavHeader');
    const navContent = document.getElementById('inventoryNavContent');
    const navCaret = document.getElementById('inventoryNavCaret');

    // Dropdown Toggle
    if (navHeader && navContent && navCaret) {
        navHeader.addEventListener('click', () => {
            navContent.classList.toggle('active');
            if (navContent.classList.contains('active')) {
                navCaret.classList.replace('ph-caret-left', 'ph-caret-down');
            } else {
                navCaret.classList.replace('ph-caret-down', 'ph-caret-left');
            }
        });
    }

    // View Switching
    const navBloodList = document.getElementById('navBloodList');
    const navEquipmentManager = document.getElementById('navEquipmentManager');
    const bloodListView = document.getElementById('bloodListView');
    const equipmentManagerView = document.getElementById('equipmentManagerView');
    const headerTitle = document.querySelector('.header h2');
    const headerDesc = document.querySelector('.header p');

    if (navBloodList && navEquipmentManager && bloodListView && equipmentManagerView) {
        navBloodList.addEventListener('click', (e) => {
            e.preventDefault();
            // Update Active Nav
            navBloodList.classList.add('active');
            navEquipmentManager.classList.remove('active');

            // Switch Views
            bloodListView.style.display = 'block';
            equipmentManagerView.style.display = 'none';

            // Update Header
            if (headerTitle) headerTitle.innerText = 'Kho máu';
            if (headerDesc) headerDesc.innerText = 'Quản lý các đơn vị máu, theo dõi hạn sử dụng và giám sát mức tồn kho.';
        });

        navEquipmentManager.addEventListener('click', (e) => {
            e.preventDefault();
            // Update Active Nav
            navEquipmentManager.classList.add('active');
            navBloodList.classList.remove('active');

            // Switch Views
            equipmentManagerView.style.display = 'block';
            bloodListView.style.display = 'none';

            // Update Header
            if (headerTitle) headerTitle.innerText = 'Quản lý thiết bị';
            if (headerDesc) headerDesc.innerText = 'Quản lý hệ thống tủ bảo quản máu và chế phẩm.';
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setupCharts();
    setupStatusGrid();
    setupModals();
    setupStaffActions();
    setupDonorManagement();
    setupCampaignManagement();
    setupInventoryNavigation();
    setupUserNavigation();
    setupStaffManagement();
    setupHospitalManagement();

    // Event Listener for Filter
    const filterSelect = document.getElementById('bloodTypeFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            setupStatusGrid(e.target.value);
        });
    }

    // Equipment Filter Logic
    const equipmentFilter = document.getElementById('equipmentTypeFilter');
    if (equipmentFilter) {
        equipmentFilter.addEventListener('change', (e) => {
            const selectedType = e.target.value;
            const rows = document.querySelectorAll('.equipment-row');

            rows.forEach(row => {
                if (selectedType === 'all' || row.dataset.type === selectedType) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
});

/* ================= CAMPAIGN MANAGEMENT LOGIC ================= */
const setupCampaignManagement = () => {
    const tableBody = document.getElementById('campaignTableBody');
    if (!tableBody) return;

    let campaigns = [];

    window.loadCampaignStats = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE}/api/admin/event/event-stat`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (document.getElementById('statUpcomingEvent')) {
                    document.getElementById('statUpcomingEvent').innerText = data.upcomingEvent || 0;
                }
                if (document.getElementById('statOngoingEvent')) {
                    document.getElementById('statOngoingEvent').innerText = data.ongoingEvent || 0;
                }
                if (document.getElementById('statCompletedEvent')) {
                    document.getElementById('statCompletedEvent').innerText = data.completedEvent || 0;
                }
            }
        } catch (error) {
            console.error('Lỗi tải thống kê sự kiện', error);
        }
    };

    window.loadCampaigns = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE}/api/shared/event/get-list-event`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                campaigns = data.map(e => {
                    const start = new Date(e.startDate);
                    const end = new Date(e.endDate);

                    const dateStr = start.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const timeStart = start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    const timeEnd = end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                    // Dọn dẹp tuyệt đối: ÉP HOA, xóa tất cả ký tự không phải chữ cái (dấu cách, dấu gạch dưới, v.v.)
                    const cleanStatus = (e.status || "").trim().toUpperCase();

                    return {
                        id: e.eventId,
                        name: e.eventName,
                        location: e.location,
                        date: dateStr,
                        time: `${timeStart} - ${timeEnd}`,
                        goal: e.targetAmount,
                        current: e.currentAmount || 0,
                        status: cleanStatus, // VD: "SAPTOI", "DADONG", "DANGMO"
                        rawStart: e.startDate,
                        rawEnd: e.endDate,
                        donors: []
                    };
                });

                // Hàm render đang ở bên dưới nên tí sẽ gọi ở đuôi setupCampaignManagement
                if (typeof renderCampaigns === 'function') {
                    renderCampaigns();
                }
            }
        } catch (error) {
            console.error('Lỗi tải sự kiện', error);
        }
    };

    // Helper: Status Badges
    const getStatusBadge = (status) => {
        // Ánh xạ trực tiếp từ key DB qua hiển thị
        switch (status) {
            case 'SAP_TOI': return '<span class="badge status-upcoming">Sắp tới</span>';
            case 'DANG_MO': return '<span class="badge status-happening">Đang mở</span>';
            case 'DA_DONG': return '<span class="badge status-completed">Đã đóng</span>';
            case 'DA_HUY': return '<span class="badge status-cancelled">Đã hủy</span>';
            default: return `<span class="badge">${status || 'Không rõ'}</span>`;
        }
    };

    // Helper: Donor Status Badge (for Details)
    const getDonorStatusBadge = (status) => {
        switch (status) {
            case 'cx_checkin': return '<span class="badge" style="background: #f3f4f6; color: #6b7280;">Chờ Check-in</span>';
            case 'examining': return '<span class="badge" style="background: #e0f2fe; color: #0284c7;">Đang khám</span>';
            case 'eligible': return '<span class="badge" style="background: #dcfce7; color: #16a34a;">Đủ điều kiện</span>';
            case 'success': return '<span class="badge" style="background: #10b981; color: white;">Hoàn thành</span>';
            case 'failed': return '<span class="badge" style="background: #fee2e2; color: #ef4444;">Không ĐK</span>';
            case 'registered': return '<span class="badge" style="background: #eff6ff; color: #3b82f6;">Đã đăng ký</span>';
            default: return '<span class="badge">--</span>';
        }
    };

    // Render Table
    const renderCampaigns = () => {
        tableBody.innerHTML = campaigns.map(c => {
            const percent = Math.round((c.current / c.goal) * 100);

            // Buttons logic
            let buttons = `
    <button class="action-btn" onclick="viewCampaignDetails(${c.id})" title="Xem chi tiết sự kiện">
        <i class="ph-bold ph-eye"></i>
    </button>
    <button class="action-btn" onclick="viewAssignedStaff(${c.id})" title="Danh sách nhân viên được phân công">
        <i class="ph-bold ph-users"></i>
    </button>
`;

            const s = (c.status || "").toUpperCase();

            buttons += `
        <button class="action-btn" onclick="openEditCampaignModal(${c.id})" title="Chỉnh sửa">
            <i class="ph-bold ph-pencil"></i>
        </button>
    `;

            buttons += `
        <button class="action-btn" onclick="cancelCampaign(${c.id})" title="Hủy sự kiện">
            <i class="ph-bold ph-trash" style="color: #ef4444;"></i>
        </button>
    `;
            // Completed/Cancelled gets only View

            return `
                <tr>
                    <td>
                        <div>
                            <div style="font-weight: 600; color: var(--text-primary);">${c.name}</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);"><i class="ph-bold ph-map-pin"></i> ${c.location}</div>
                        </div>
                    </td>
                    <td>
                        <div>
                            <div style="font-weight: 500;">${c.date}</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">${c.time}</div>
                        </div>
                    </td>
                    <td style="font-weight: 500;">${c.goal} Đơn vị</td>
                    <td style="width: 150px;">
                        <div style="font-size: 0.75rem; margin-bottom: 4px; display: flex; justify-content: space-between;">
                            <span>${c.current}/${c.goal}</span>
                            <span style="color: var(--primary-color);">${percent}%</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width: ${percent}%; ${c.status === 'DA_DONG' ? 'background-color: #10b981;' : ''}"></div>
                        </div>
                    </td>
                    <td>${getStatusBadge(c.status)}</td>
                    <td>
                        <div style="display: flex; gap: 0.5rem;">${buttons}</div>
                    </td>
                </tr>
            `;
        }).join('');
    };

    // Actions
    window.editingCampaignId = null;

    window.openEditCampaignModal = (id) => {
        const c = campaigns.find(x => x.id === id);
        if (!c) return;

        window.editingCampaignId = id;

        const modal = document.getElementById('createEventModal');
        const titleHeader = modal.querySelector('.modal-header h3');
        const saveBtn = document.getElementById('saveEventBtn');

        if (modal) {
            titleHeader.innerText = 'Chỉnh sửa sự kiện';
            saveBtn.innerText = 'Cập nhật';

            // Fill Data
            document.getElementById('evtName').value = c.name;
            document.getElementById('evtLocation').value = c.location;
            document.getElementById('evtGoal').value = c.goal;
            document.getElementById('evtDesc').value = c.description || ''; // Assuming description field exists in object

            // Handle Dates: set to datetime-local inputs
            if (c.rawStart) document.getElementById('evtStart').value = c.rawStart.substring(0, 16);
            if (c.rawEnd) document.getElementById('evtEnd').value = c.rawEnd.substring(0, 16);

            // Constrain Inputs
            document.getElementById('evtName').disabled = false;
            document.getElementById('evtDesc').disabled = false;
            document.getElementById('evtGoal').disabled = false;

            // Disable Restricted
            document.getElementById('evtLocation').disabled = true;
            document.getElementById('evtStart').disabled = true;
            document.getElementById('evtEnd').disabled = true;

            modal.classList.add('active');
        }
    };

    // Override/Hook into the modal save
    const saveBtn = document.getElementById('saveEventBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (saveBtn.disabled) return;

            if (window.editingCampaignId) {
                // UPDATE Logic
                const origText = saveBtn.innerHTML;
                saveBtn.disabled = true;
                saveBtn.innerHTML = 'Đang cập nhật...';

                const currentEvent = campaigns.find(x => x.id === window.editingCampaignId);
                const name = document.getElementById('evtName').value.trim();
                const goal = document.getElementById('evtGoal').value;

                // Giữ nguyên trạng thái hiện tại từ danh sách cũ
                const payload = {
                    eventName: name,
                    targetAmount: goal,
                    status: currentEvent ? currentEvent.status : "SAP_TOI"
                };

                const token = localStorage.getItem('access_token');

                try {
                    const response = await fetch(`${API_BASE}/api/admin/event/update-event/${window.editingCampaignId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        alert('Cập nhật sự kiện thành công trên hệ thống!');

                        // Fake UI Update cho mượt
                        const c = campaigns.find(x => x.id === window.editingCampaignId);
                        if (c) {
                            c.name = name;
                            c.goal = goal;
                            renderCampaigns();
                        }
                        closeCreateEventModal();
                    } else {
                        const err = await response.text();
                        alert('Lỗi cập nhật: ' + err);
                    }
                } catch (error) {
                    alert('Không kết nối được tới Backend!');
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = origText;
                }

            } else {
                // CREATE Logic (Delegating to existing function)
                if (typeof window.saveNewEvent === 'function') {
                    window.saveNewEvent();
                }
            }
        });
    }

    // Hook into global close to reset state
    const originalClose = window.closeCreateEventModal;
    window.closeCreateEventModal = () => {
        const modal = document.getElementById('createEventModal');
        if (modal) modal.classList.remove('active');
        window.editingCampaignId = null;

        // Reset Inputs State
        const inputs = modal.querySelectorAll('input, textarea');
        inputs.forEach(i => i.disabled = false);

        const titleHeader = modal.querySelector('.modal-header h3');
        const saveBtn = document.getElementById('saveEventBtn');
        if (titleHeader) titleHeader.innerText = 'Tạo Sự Kiện Mới';
        if (saveBtn) saveBtn.innerText = 'Lưu sự kiện';

        // Clear Values
        document.getElementById('evtName').value = '';
        document.getElementById('evtLocation').value = '';
        document.getElementById('evtGoal').value = '';
        document.getElementById('evtDesc').value = '';
    };

    window.cancelCampaign = async (id) => {
        if (confirm('Bạn có chắc muốn HỦY sự kiện này không? Hành động này không thể hoàn tác.')) {
            const token = localStorage.getItem('access_token');
            try {
                // Sử dụng PATCH /api/admin/event/cancel-event/{id} theo yêu cầu
                const res = await fetch(`${API_BASE}/api/admin/event/cancel-event/${id}`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    alert('Đã hủy sự kiện thành công');
                    loadCampaigns(); // Load lại từ server thay vì mock data
                } else {
                    alert('Lỗi hủy sự kiện: ' + await res.text());
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    window.closeCampaign = (id) => {
        if (confirm('Xác nhận ĐÓNG sự kiện? Trạng thái sẽ chuyển sang Đã hoàn thành.')) {
            const c = campaigns.find(x => x.id === id);
            if (c) {
                c.status = 'completed';
                // Mock stats generation
                c.stats = {
                    participants: c.current + 20, // some failed
                    units: c.current,
                    successRate: '95%'
                };
                renderCampaigns();
            }
        }
    };

    window.viewCampaignDetails = async (id) => {
        const token = localStorage.getItem('access_token');
        const modal = document.getElementById('eventDetailModal');
        const title = document.getElementById('eventDetailTitle');
        const body = document.getElementById('eventDetailBody');

        title.innerText = `Đang tải chi tiết...`;
        body.innerHTML = `<div style="text-align: center; padding: 2rem;">Đang tải dữ liệu...</div>`;
        openModal(modal);

        try {
            const res = await fetch(`${API_BASE}/api/shared/event/event-detail/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                title.innerText = `Chi tiết: ${data.eventName || 'Sự kiện'}`;

                const startDateStr = new Date(data.startDate).toLocaleString('vi-VN');
                const endDateStr = new Date(data.endDate).toLocaleString('vi-VN');

                const statusMap = {
                    'SAP_TOI': '<span class="badge status-upcoming">Sắp tới</span>',
                    'DANG_MO': '<span class="badge status-happening">Đang mở</span>',
                    'DA_DONG': '<span class="badge status-completed">Đã đóng</span>',
                    'DA_HUY': '<span class="badge status-cancelled">Đã hủy</span>'
                };
                const statusBadge = statusMap[data.status] || `<span class="badge">${data.status || 'Không rõ'}</span>`;

                const eventInfoHtml = `
                    <div style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; border: 1px solid #e5e7eb;">
                        <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <p style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 0.25rem;">Thời gian</p>
                                <div style="font-weight: 500;"><i class="ph-bold ph-calendar-blank"></i> Bắt đầu: ${startDateStr}</div>
                                <div style="font-weight: 500; margin-top: 0.5rem;"><i class="ph-bold ph-calendar-blank"></i> Kết thúc: ${endDateStr}</div>
                            </div>
                            <div>
                                <p style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 0.25rem;">Địa điểm & Trạng thái</p>
                                <div style="font-weight: 500;"><i class="ph-bold ph-map-pin"></i> ${data.location || '--'}</div>
                                <div style="margin-top: 0.5rem;">${statusBadge}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                         <div class="card" style="background: #f9fafb; padding: 1rem; box-shadow: none; border: 1px solid var(--border-color);">
                            <p style="color: var(--text-secondary); font-size: 0.75rem;">Mục tiêu (ĐV máu)</p>
                            <h3 style="font-size: 1.25rem;">${data.targetAmount || 0}</h3>
                         </div>
                         <div class="card" style="background: #f9fafb; padding: 1rem; box-shadow: none; border: 1px solid var(--border-color);">
                            <p style="color: var(--text-secondary); font-size: 0.75rem;">Số người đăng ký</p>
                            <h3 style="font-size: 1.25rem; color: #3b82f6;">${data.registeredCount || 0}</h3>
                         </div>
                         <div class="card" style="background: #f9fafb; padding: 1rem; box-shadow: none; border: 1px solid var(--border-color);">
                            <p style="color: var(--text-secondary); font-size: 0.75rem;">Thực tế tham gia</p>
                            <h3 style="font-size: 1.25rem; color: #10b981;">${data.actualCount || 0}</h3>
                         </div>
                    </div>
                `;

                body.innerHTML = eventInfoHtml;

                if (typeof window.loadRegisteredDonorsForEvent === 'function') {
                    window.loadRegisteredDonorsForEvent(id);
                }

                if (typeof window.loadUnassignedStaffForEvent === 'function') {
                    window.loadUnassignedStaffForEvent(id);
                }
            } else {
                body.innerHTML = `<div style="text-align: center; color: red; padding: 2rem;">Lỗi tải dữ liệu chi tiết (${res.status})</div>`;
            }
        } catch (error) {
            body.innerHTML = `<div style="text-align: center; color: red; padding: 2rem;">Mất kết nối máy chủ</div>`;
            console.error('Lỗi fetch detail:', error);
        }
    };

    window.loadRegisteredDonorsForEvent = async (eventId) => {
        const body = document.getElementById('eventDetailBody');
        const donorContainer = document.createElement('div');
        donorContainer.id = 'registeredDonorsContainer';
        donorContainer.style.marginTop = '1.5rem';
        donorContainer.innerHTML = `
            <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem; border-top: 1px solid #e5e7eb; padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                <span>Danh sách người đăng ký tham gia</span>
                <span id="donorCountBadge" style="font-size: 0.75rem; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 9999px;">0 người</span>
            </h4>
            <div id="registeredDonorsList" style="max-height: 250px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 0.5rem; margin-bottom: 1rem; padding: 0.5rem;">
                <div style="text-align: center; padding: 1rem; color: #6b7280;">Đang tải danh sách người đăng ký...</div>
            </div>
        `;
        body.appendChild(donorContainer);

        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE}/api/staff/donor/get-list-donor-status/${eventId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const listContainer = document.getElementById('registeredDonorsList');
            const badge = document.getElementById('donorCountBadge');

            if (res.ok) {
                const list = await res.json();
                if (badge) badge.innerText = `${list.length} người`;

                if (list.length === 0) {
                    listContainer.innerHTML = `<div style="text-align: center; padding: 1rem; color: #6b7280;">Chưa có người hiến máu nào đăng ký sự kiện này.</div>`;
                } else {
                    const statusMap = {
                        'DA_DANG_KY': '<span class="badge" style="background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px;">Đã đăng ký</span>',
                        'DA_HET_HAN': '<span class="badge" style="background-color: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px;">Đã hết hạn</span>',
                        'DA_HUY': '<span class="badge" style="background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px;">Đã hủy</span>',
                        'CHO_KHAM': '<span class="badge" style="background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px;">Chờ khám</span>',
                        'DONG_Y': '<span class="badge" style="background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px;">Đồng ý hiến</span>',
                        'TU_CHOI': '<span class="badge" style="background-color: #fff5f5; color: #c53030; border: 1px solid #feb2b2; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px;">Từ chối</span>',
                        'DA_LAY_MAU': '<span class="badge" style="background-color: #e0f2fe; color: #075985; border: 1px solid #bae6fd; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px;">Đã lấy máu</span>',
                        'THAT_BAI': '<span class="badge" style="background-color: #fdf2f8; color: #9d174d; border: 1px solid #fbcfe8; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px;">Thất bại</span>',
                        'HOAN_THANH': '<span class="badge" style="background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px;">Hoàn thành</span>'
                    };

                    let tableRows = list.map((d, index) => {
                        const genderText = d.gender === 'NAM' ? 'Nam' : (d.gender === 'NU' ? 'Nữ' : d.gender || '--');
                        const dobText = d.dob ? new Date(d.dob).toLocaleDateString('vi-VN') : '--';
                        const statusBadge = statusMap[d.status] || `<span class="badge" style="font-size: 0.75rem; padding: 2px 6px; border-radius: 4px;">${d.status || '--'}</span>`;
                        return `
                            <tr style="border-bottom: 1px solid #f3f4f6;">
                                <td style="padding: 0.5rem; text-align: center;">${index + 1}</td>
                                <td style="padding: 0.5rem;"><span style="font-weight: 500;">${d.fullName || '--'}</span></td>
                                <td style="padding: 0.5rem; text-align: center;">${dobText}</td>
                                <td style="padding: 0.5rem; text-align: center;">${genderText}</td>
                                <td style="padding: 0.5rem;">${d.phone || '--'}</td>
                                <td style="padding: 0.5rem;">${d.email || '--'}</td>
                                <td style="padding: 0.5rem; text-align: center;">${statusBadge}</td>
                            </tr>
                        `;
                    }).join('');

                    listContainer.innerHTML = `
                        <div class="table-container" style="max-height: 230px; overflow-y: auto; margin: -0.5rem;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                                <thead>
                                    <tr style="background: #f9fafb; text-align: left; position: sticky; top: 0; z-index: 10; border-bottom: 1px solid #e5e7eb;">
                                        <th style="padding: 0.5rem; text-align: center; font-weight: 600;">STT</th>
                                        <th style="padding: 0.5rem; font-weight: 600;">Họ tên</th>
                                        <th style="padding: 0.5rem; text-align: center; font-weight: 600;">Ngày sinh</th>
                                        <th style="padding: 0.5rem; text-align: center; font-weight: 600;">Giới tính</th>
                                        <th style="padding: 0.5rem; font-weight: 600;">Số điện thoại</th>
                                        <th style="padding: 0.5rem; font-weight: 600;">Email</th>
                                        <th style="padding: 0.5rem; text-align: center; font-weight: 600;">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableRows}
                                </tbody>
                            </table>
                        </div>
                    `;
                }
            } else {
                listContainer.innerHTML = `<div style="text-align: center; padding: 1rem; color: red;">Lỗi khi tải danh sách người hiến máu (${res.status})</div>`;
            }
        } catch (e) {
            console.error('Lỗi loadRegisteredDonorsForEvent:', e);
            document.getElementById('registeredDonorsList').innerHTML = `<div style="text-align: center; padding: 1rem; color: red;">Lỗi kết nối máy chủ: ${e.message}</div>`;
        }
    };

    window.viewAssignedStaff = async (id) => {
        const token = localStorage.getItem('access_token');
        const modal = document.getElementById('eventDetailModal');
        const title = document.getElementById('eventDetailTitle');
        const body = document.getElementById('eventDetailBody');

        title.innerText = `Đang tải danh sách...`;
        body.innerHTML = `<div style="text-align: center; padding: 2rem;">Đang tải danh sách nhân viên phân công...</div>`;
        openModal(modal);

        try {
            const res = await fetch(`${API_BASE}/api/admin/assignment/list-assignment-staff/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                title.innerText = `Phân công: ${data.eventName || 'Sự kiện'}`;

                const staffList = data.assignedStaff || [];
                let staffHtml = staffList.map(s => {
                    const formatPosition = (pos) => {
                        const map = {
                            'QUAN_LY_KHO': 'Quản lý kho',
                            'KY_THUAT': 'Kỹ thuật viên',
                            'Y_TA': 'Y tá',
                            'BAC_SI': 'Bác sĩ',
                            'ADMIN': 'Admin'
                        };
                        return map[pos] || pos;
                    };
                    return `
                    <tr>
                        <td><span style="font-weight: 500;">NV${String(s.staffId || '').padStart(3, '0')}</span></td>
                        <td>${s.fullName || '--'}</td>
                        <td><span class="badge" style="background: #e0f2fe; color: #0369a1;">${formatPosition(s.position)}</span></td>
                    </tr>
                `}).join('');

                const tableHtml = `
                    <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f9fafb; text-align: left;">
                                    <th style="padding: 0.75rem; border-bottom: 1px solid var(--border-color);">Mã NV</th>
                                    <th style="padding: 0.75rem; border-bottom: 1px solid var(--border-color);">Họ tên</th>
                                    <th style="padding: 0.75rem; border-bottom: 1px solid var(--border-color);">Vị trí / Vai trò</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${staffHtml.length > 0 ? staffHtml : '<tr><td colspan="3" style="text-align: center; color: var(--text-secondary); padding: 2rem;">Chưa có nhân viên nào được phân công</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                `;
                body.innerHTML = tableHtml;
            } else {
                body.innerHTML = `<div style="text-align: center; color: red; padding: 2rem;">Lỗi tải dữ liệu nhân viên (${res.status})</div>`;
            }
        } catch (error) {
            body.innerHTML = `<div style="text-align: center; color: red; padding: 2rem;">Mất kết nối máy chủ</div>`;
            console.error('Lỗi fetch staff assign:', error);
        }
    }

    window.loadUnassignedStaffForEvent = async (eventId) => {
        const body = document.getElementById('eventDetailBody');
        const assignContainer = document.createElement('div');
        assignContainer.id = 'assignStaffContainer';
        assignContainer.style.marginTop = '1.5rem';
        assignContainer.innerHTML = `
            <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem; border-top: 1px solid #e5e7eb; padding-top: 1rem;">Phân công nhân viên mới</h4>
            <div id="unassignedStaffList" style="max-height: 250px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 0.5rem; margin-bottom: 1rem; padding: 0.5rem;">
                <div style="text-align: center; padding: 1rem; color: #6b7280;">Đang tải danh sách nhân viên...</div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 1rem; align-items: center;">
                <button class="btn btn-primary" onclick="submitAssignStaff(${eventId})"><i class="ph-bold ph-check"></i> Lưu phân công</button>
            </div>
        `;
        body.appendChild(assignContainer);

        try {
            const token = localStorage.getItem('access_token');

            // 1. Get assigned staff
            let assignedStaffIds = [];
            const resAssigned = await fetch(`${API_BASE}/api/admin/assignment/list-assignment-staff/${eventId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resAssigned.ok) {
                const dataAssign = await resAssigned.json();
                if (dataAssign.assignedStaff) {
                    assignedStaffIds = dataAssign.assignedStaff.map(s => s.staffId);
                }
            }

            // 2. Get all staff (loại trừ QUAN_LY_KHO, ưu tiên chưa phân công lên đầu)
            const resAll = await fetch(`${API_BASE}/api/admin/staff/get-smart-list-staff`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            let staffList = [];
            if (resAll.ok) {
                const resultBE = await resAll.json();
                staffList = Array.isArray(resultBE) ? resultBE : (resultBE.data?.content || resultBE.content || resultBE.data || []);
            }

            const listContainer = document.getElementById('unassignedStaffList');
            if (staffList.length === 0) {
                listContainer.innerHTML = `<div style="text-align: center; padding: 1rem; color: #6b7280;">Không có nhân viên nào.</div>`;
            } else {
                listContainer.innerHTML = staffList.map(s => {
                    const safeId = s.staffId || s.id || '';
                    const staffRole = s.position || s.role || '';
                    // Map vị trí nhân viên sang role phân công mặc định (enum: TIEP_DON, LAY_MAU, KHAM_SANG_LOC)
                    let defaultRole = 'TIEP_DON';
                    if (staffRole === 'BAC_SI') defaultRole = 'KHAM_SANG_LOC';
                    else if (staffRole === 'Y_TA') defaultRole = 'LAY_MAU';

                    const positionMap = { 'BAC_SI': 'Bác sĩ', 'Y_TA': 'Y tá', 'KY_THUAT': 'Kỹ thuật viên', 'ADMIN': 'Admin' };
                    const positionLabel = positionMap[staffRole] || staffRole || '--';

                    // Badge cho nhân viên đã phân công ở sự kiện khác (available = false)
                    const isAvailable = s.available !== false;
                    const availableBadge = !isAvailable
                        ? `<span style="font-size:0.7rem; color:#d97706; background:#fef3c7; padding:1px 6px; border-radius:4px; margin-left:6px;">Đã phân công</span>`
                        : '';

                    return `
                    <div style="display: flex; align-items: center; padding: 0.5rem; border-bottom: 1px solid #f3f4f6;">
                        <input type="checkbox" id="staff_${safeId}" value="${safeId}" class="staff-checkbox" style="margin-right: 1rem; width: 1.15rem; height: 1.15rem; cursor: pointer;">
                        <label for="staff_${safeId}" style="cursor: pointer; flex: 1; display: flex; flex-direction: column;">
                            <div style="font-weight: 500;">${s.fullName || s.name || '--'} <span style="color: #6b7280; font-weight: normal; font-size: 0.875rem;">(NV${String(safeId).padStart(3, '0')})</span>${availableBadge}</div>
                            <div style="font-size: 0.75rem; color: #6b7280;">Vị trí: ${positionLabel}</div>
                        </label>
                        <select class="staff-role-select" id="role_${safeId}" style="margin-left: 1rem; padding: 0.4rem; border: 1px solid var(--border-color); border-radius: var(--radius); font-size: 0.875rem; width: 160px; outline: none;">
                            <option value="TIEP_DON" ${defaultRole === 'TIEP_DON' ? 'selected' : ''}>Tiếp đón</option>
                            <option value="KHAM_SANG_LOC" ${defaultRole === 'KHAM_SANG_LOC' ? 'selected' : ''}>Khám sàng lọc</option>
                            <option value="LAY_MAU" ${defaultRole === 'LAY_MAU' ? 'selected' : ''}>Lấy máu</option>
                        </select>
                    </div>
                `}).join('');
            }

        } catch (e) {
            document.getElementById('unassignedStaffList').innerHTML = `<div style="text-align: center; padding: 1rem; color: red;">Lỗi khi tải danh sách nhân viên: ${e.message}</div>`;
        }
    };

    window.submitAssignStaff = async (eventId) => {
        const checkboxes = document.querySelectorAll('.staff-checkbox:checked');
        if (checkboxes.length === 0) {
            alert('Vui lòng chọn ít nhất 1 nhân viên để phân công!');
            return;
        }
        // Cấu trúc payload mới theo backend: Thu thập vai trò từ mỗi ô select của từng nhân viên
        const assignments = Array.from(checkboxes).map(cb => {
            const staffId = parseInt(cb.value);
            const roleSelect = document.getElementById('role_' + staffId);
            return {
                staffId: staffId,
                role: roleSelect ? roleSelect.value : 'TIEP_DON'
            };
        });

        const payload = {
            eventId: eventId,
            assignments: assignments
        };

        const token = localStorage.getItem('access_token');
        const btn = event.currentTarget;
        const origText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = 'Đang lưu...';

        try {
            // Cập nhật endpoint để có eventId
            const res = await fetch(`${API_BASE}/api/admin/assignment/assignment-staff/${eventId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Phân công nhân viên thành công!');
                // Nạp lại chi tiết / Phân công để thấy danh sách đã cập nhật
                viewCampaignDetails(eventId);
            } else {
                const err = await res.text();
                alert('Lỗi phân công: ' + err);
                btn.disabled = false;
                btn.innerHTML = origText;
            }

        } catch (e) {
            alert('Lỗi kết nối máy chủ!');
            btn.disabled = false;
            btn.innerHTML = origText;
        }
    };

    loadCampaigns();
    if (typeof window.loadCampaignStats === 'function') window.loadCampaignStats();
};

// ==================== AUTH & ROLE HELPERS ====================

<<<<<<< Updated upstream:script.js
// Helper: redirect về login an toàn từ bất kỳ đâu
function safeRedirectToLogin() {
    const path = window.location.pathname;
    if (path.includes('admin_view') || path.includes('staff_view') ||
        path.includes('donor_view') || path.includes('hospital_view')) {
        window.location.href = '../login.html';
    } else {
        window.location.href = 'login.html';
    }
}

window.checkStaffRole = function(allowedRoles) {
=======
window.checkStaffRole = function (allowedRoles) {
>>>>>>> Stashed changes:js/script.js
    const role = (localStorage.getItem('user_role') || '').toUpperCase();
    const token = localStorage.getItem('access_token');

    // 1. Kiểm tra token
    if (!token) {
        safeRedirectToLogin();
        return;
    }

    // 2. Kiểm tra quyền
    if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(role)) {
            if (window.location.pathname.indexOf('dashboard.html') === -1) {
                alert('Bạn không có quyền truy cập trang này!');
                window.location.href = 'dashboard.html';
            }
        }
    }
};

<<<<<<< Updated upstream:script.js
// Bỏ định nghĩa logout trùng bên dưới — đã có hàm đúng ở trên (dòng 312)

=======
window.logout = function () {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_info');
        window.location.href = '../home/login.html';
    }
};
>>>>>>> Stashed changes:js/script.js

// Auto-init user info and sidebar visibility in header if element exists
document.addEventListener('DOMContentLoaded', () => {
    const userRole = localStorage.getItem('user_role');

    // Nếu là Bệnh viện hoặc Người hiến máu, không thực hiện các xử lý sidebar/header của nhân viên
    if (userRole === 'HOSPITAL' || userRole === 'DONOR') {
        return;
    }

    // 1. Update Header Info
    const roleLabel = document.getElementById('headerRoleLabel');
    if (roleLabel) {
        if (userRole === 'STAFF_TECH') roleLabel.textContent = 'Nhân viên Kỹ thuật';
        else if (userRole === 'STAFF_INVENTORY') roleLabel.textContent = 'Nhân viên Kho';
        else roleLabel.textContent = 'Nhân viên';
    }

    // 2. Update Sidebar Visibility
    const techItems = document.querySelectorAll('.staff-tech-only');
    const inventoryItems = document.querySelectorAll('.staff-inventory-only');
    const sidebarRoleLabel = document.getElementById('staffRoleLabel');

    if (userRole === 'STAFF_TECH') {
        techItems.forEach(el => {
            if (el.classList.contains('nav-item-dropdown')) {
                el.style.display = 'flex';
            } else {
                el.style.display = 'block';
            }
        });
        if (sidebarRoleLabel) sidebarRoleLabel.textContent = 'Nhân viên Kỹ thuật';
    } else if (userRole === 'STAFF_INVENTORY') {
        inventoryItems.forEach(el => {
            if (el.classList.contains('nav-item-dropdown')) {
                el.style.display = 'flex';
            } else {
                el.style.display = 'block';
            }
        });
        if (sidebarRoleLabel) sidebarRoleLabel.textContent = 'Nhân viên Kho';
    } else {
        // Dev fallback or generic staff
        techItems.forEach(el => {
            if (el.classList.contains('nav-item-dropdown')) {
                el.style.display = 'flex';
            } else {
                el.style.display = 'block';
            }
        });
        inventoryItems.forEach(el => {
            if (el.classList.contains('nav-item-dropdown')) {
                el.style.display = 'flex';
            } else {
                el.style.display = 'block';
            }
        });
    }

    // 2b. Map existing "Tài khoản" sidebar items to openProfileModal() or inject if missing
    let hasAccountNav = false;
    document.querySelectorAll('.nav-menu a').forEach(a => {
        if ((a.textContent.includes('Tài khoản') || a.querySelector('.ph-user-circle')) && !a.textContent.includes('Hồ sơ Bệnh viện')) {
            a.href = 'javascript:void(0)';
            a.setAttribute('onclick', 'openProfileModal()');
            hasAccountNav = true;
        }
    });

    if (!hasAccountNav) {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            const profileLi = document.createElement('li');
            profileLi.className = 'nav-item';
            profileLi.style.marginTop = 'auto'; // Put at the bottom before change password
            profileLi.innerHTML = `
                <a href="javascript:void(0)" onclick="openProfileModal()">
                    <i class="ph-bold ph-user-circle"></i>
                    Hồ sơ cá nhân
                </a>
            `;

            // Insert it before Change Password
            const changePasswordItem = Array.from(navMenu.querySelectorAll('.nav-item')).find(li => li.innerHTML.includes('openChangePasswordModal'));
            if (changePasswordItem) {
                navMenu.insertBefore(profileLi, changePasswordItem);
            } else {
                const logoutItem = navMenu.querySelector('li:last-child');
                if (logoutItem) navMenu.insertBefore(profileLi, logoutItem);
                else navMenu.appendChild(profileLi);
            }
        }
    }

    // 3. Load real user name from API
    loadStaffUserInfo();
});

// Ham tai ten & avatar nhan vien tu API profile
async function loadStaffUserInfo() {
    const headerUserName = document.getElementById('headerUserName');
    if (!headerUserName) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
        const res = await fetch(`${API_BASE}/api/shared/user/get-profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const resultBE = await res.json();
            const data = resultBE.data ? resultBE.data : resultBE;
            const fullName = data.fullName || data.name || 'Nhan vien';

            headerUserName.textContent = fullName;

            const avatarEl = document.getElementById('headerAvatar');
            if (avatarEl) {
                avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=c0392b&color=fff`;
                avatarEl.alt = fullName;
            }
        }
    } catch (e) {
        console.warn('Khong the tai thong tin nguoi dung:', e.message);
    }
}

// ==================== CHANGE PASSWORD MODAL ====================

window.openChangePasswordModal = function () {
    let modal = document.getElementById('changePasswordModal');

    if (!modal) {
        // Inject modal HTML if not already in DOM
        const modalHtml = `
            <div id="changePasswordModal" class="modal-overlay">
                <div class="modal" style="max-width: 450px;">
                    <div class="modal-header">
                        <h3><i class="ph-bold ph-lock"></i> Đổi mật khẩu</h3>
                        <button class="close-modal" onclick="closeChangePasswordModal()">&times;</button>
                    </div>
                    <form id="changePasswordForm" onsubmit="submitChangePasswordStaff(event)">
                        <div class="modal-body">
                            <div class="form-group mb-3">
                                <label class="form-label">Mật khẩu hiện tại</label>
                                <input type="password" id="oldPassword" class="form-control" required placeholder="Nhập mật khẩu cũ">
                            </div>
                            <div class="form-group mb-3">
                                <label class="form-label">Mật khẩu mới</label>
                                <input type="password" id="newPassword" class="form-control" required minlength="6" placeholder="Ít nhất 6 ký tự">
                            </div>
                            <div class="form-group mb-3">
                                <label class="form-label">Xác nhận mật khẩu mới</label>
                                <input type="password" id="confirmPassword" class="form-control" required placeholder="Nhập lại mật khẩu mới">
                            </div>
                            <div id="passwordError" class="text-danger small mt-2" style="display: none;">Mật khẩu mới không trùng khớp!</div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="closeChangePasswordModal()">Hủy</button>
                            <button type="submit" class="btn btn-primary">Xác nhận đổi</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modal = document.getElementById('changePasswordModal');
    }

    modal.classList.add('active');
};

window.closeChangePasswordModal = function () {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.classList.remove('active');
        document.getElementById('changePasswordForm').reset();
        document.getElementById('passwordError').style.display = 'none';
    }
};

window.submitChangePasswordStaff = async function (e) {
    e.preventDefault();
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorEl = document.getElementById('passwordError');

    if (newPassword !== confirmPassword) {
        errorEl.textContent = 'Mật khẩu mới không trùng khớp!';
        errorEl.style.display = 'block';
        return;
    }

    const token = localStorage.getItem('access_token');
    const rq = { oldPassword, newPassword, confirmPassword };

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Đang xử lý...';

    try {
        const res = await fetch(`${API_BASE}/api/shared/user/change-password`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(rq)
        });

        if (res.ok) {
            alert('Đổi mật khẩu thành công!');
            closeChangePasswordModal();
        } else {
            const err = await res.text();
            alert('Lỗi: ' + err);
        }
    } catch (e) {
        alert('Lỗi kết nối máy chủ!');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
};

// ==================== PROFILE MODAL ====================

window.openProfileModal = async function () {
    let modal = document.getElementById('profileModal');
    const userRole = localStorage.getItem('user_role');
    const isLocalAdmin = userRole === 'ADMIN';

    if (!modal) {
        // Inject modal HTML if not already in DOM
        const modalHtml = `
            <div id="profileModal" class="modal-overlay">
                <div class="modal" style="max-width: 550px;">
                    <div class="modal-header">
                        <h3><i class="ph-bold ph-user-circle"></i> ${isLocalAdmin ? 'Hồ sơ cá nhân Admin' : 'Hồ sơ cá nhân nhân viên'}</h3>
                        <button class="close-modal" onclick="closeProfileModal()">&times;</button>
                    </div>
                    <form id="profileForm" onsubmit="submitUpdateProfile(event)">
                        <div class="modal-body" style="max-height: 450px; overflow-y: auto;">
                            <div id="profileLoading" style="text-align: center; padding: 2rem;">
                                <i class="ph-bold ph-spinner" style="animation: spin 1s linear infinite; font-size: 2rem; display: inline-block;"></i>
                                <p style="margin-top: 0.5rem; color: var(--text-secondary);">Đang tải thông tin...</p>
                            </div>
                            <div id="profileContent" style="display: none;">
                                <div class="grid-2 gap-3 mb-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                    <div class="form-group">
                                        <label class="form-label" style="font-weight: 500; font-size: 0.875rem;">${isLocalAdmin ? 'Mã Admin' : 'Mã nhân viên'}</label>
                                        <input type="text" id="profileStaffId" class="form-control" disabled readonly style="background-color: #f3f4f6;">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label" style="font-weight: 500; font-size: 0.875rem;">Họ và tên *</label>
                                        <input type="text" id="profileFullName" class="form-control" required style="width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius); padding: 0.5rem; box-sizing: border-box;">
                                    </div>
                                </div>
                                <div class="grid-2 gap-3 mb-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                    <div class="form-group">
                                        <label class="form-label" style="font-weight: 500; font-size: 0.875rem;">Số CCCD/CMND *</label>
                                        <input type="text" id="profileCCCD" class="form-control" required style="width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius); padding: 0.5rem; box-sizing: border-box;">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label" style="font-weight: 500; font-size: 0.875rem;">Ngày sinh *</label>
                                        <input type="date" id="profileDob" class="form-control" required style="width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius); padding: 0.5rem; box-sizing: border-box;">
                                    </div>
                                </div>
                                <div class="grid-2 gap-3 mb-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                    <div class="form-group">
                                        <label class="form-label" style="font-weight: 500; font-size: 0.875rem;">Giới tính *</label>
                                        <select id="profileGender" class="form-control" style="width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius); padding: 0.5rem; box-sizing: border-box; height: 38px;">
                                            <option value="Nam">Nam</option>
                                            <option value="Nữ">Nữ</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label" style="font-weight: 500; font-size: 0.875rem;">Chức vụ/Vị trí</label>
                                        <input type="text" id="profilePosition" class="form-control" disabled readonly style="background-color: #f3f4f6;">
                                    </div>
                                </div>
                                <div class="grid-2 gap-3 mb-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                    <div class="form-group">
                                        <label class="form-label" style="font-weight: 500; font-size: 0.875rem;">Email *</label>
                                        <input type="email" id="profileEmail" class="form-control" required style="width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius); padding: 0.5rem; box-sizing: border-box;">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label" style="font-weight: 500; font-size: 0.875rem;">Số điện thoại *</label>
                                        <input type="text" id="profilePhone" class="form-control" required style="width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius); padding: 0.5rem; box-sizing: border-box;">
                                    </div>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="form-label" style="font-weight: 500; font-size: 0.875rem;">Địa chỉ *</label>
                                    <textarea id="profileAddress" class="form-control" rows="3" required placeholder="Nhập địa chỉ của bạn" style="width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius); padding: 0.5rem; box-sizing: border-box;"></textarea>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer" id="profileFooter" style="display: none;">
                            <button type="button" class="btn btn-secondary" onclick="closeProfileModal()">Đóng</button>
                            <button type="submit" class="btn btn-primary" id="btnSaveProfile">Lưu thay đổi</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modal = document.getElementById('profileModal');
    }

    modal.classList.add('active');

    // Show loading
    document.getElementById('profileLoading').style.display = 'block';
    document.getElementById('profileContent').style.display = 'none';
    document.getElementById('profileFooter').style.display = 'none';

    // Fetch data
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE}/api/shared/user/get-profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();

            document.getElementById('profileStaffId').value = data.staffId || '';
            document.getElementById('profileFullName').value = data.fullName || '';
            document.getElementById('profileCCCD').value = data.cccd || '';
            document.getElementById('profileDob').value = data.dob || '';
            document.getElementById('profileGender').value = data.gender || 'Nam';
            document.getElementById('profilePosition').value = data.position || '';
            document.getElementById('profileEmail').value = data.email || '';
            document.getElementById('profilePhone').value = data.phone || '';
            document.getElementById('profileAddress').value = data.address || '';

            // Hide loading
            document.getElementById('profileLoading').style.display = 'none';
            document.getElementById('profileContent').style.display = 'block';
            document.getElementById('profileFooter').style.display = 'flex';
        } else {
            alert('Không thể tải thông tin hồ sơ!');
            closeProfileModal();
        }
    } catch (e) {
        alert('Lỗi kết nối máy chủ khi tải hồ sơ!');
        closeProfileModal();
    }
};

window.closeProfileModal = function () {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.remove('active');
    }
};

window.submitUpdateProfile = async function (e) {
    e.preventDefault();
    const token = localStorage.getItem('access_token');

    const payload = {
        fullName: document.getElementById('profileFullName').value.trim(),
        cccd: document.getElementById('profileCCCD').value.trim(),
        dob: document.getElementById('profileDob').value || null,
        gender: document.getElementById('profileGender').value,
        email: document.getElementById('profileEmail').value.trim(),
        phone: document.getElementById('profilePhone').value.trim(),
        address: document.getElementById('profileAddress').value.trim()
    };

    const btn = document.getElementById('btnSaveProfile');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Đang xử lý...';

    try {
        const res = await fetch(`${API_BASE}/api/staff/staff/update-profile`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('Cập nhật thông tin thành công!');

            // Cập nhật hiển thị tên ở Header ngay lập tức
            const headerUserName = document.getElementById('headerUserName');
            if (headerUserName) {
                headerUserName.textContent = payload.fullName;
            }
            const avatarEl = document.getElementById('headerAvatar');
            if (avatarEl) {
                avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.fullName)}&background=c0392b&color=fff`;
            }

            closeProfileModal();
        } else {
            const err = await res.text();
            alert('Lỗi cập nhật: ' + err);
        }
    } catch (e) {
        alert('Lỗi kết nối máy chủ khi cập nhật!');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
};

/* ================= STAFF DASHBOARD LOGIC ================= */
const setupStaffDashboard = async () => {
    const statPendingTest = document.getElementById('statPendingTest');
    const assignmentsContainer = document.getElementById('assignmentsContainer');
    if (!statPendingTest || !assignmentsContainer) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
        console.warn('No access token found.');
        return;
    }

    // 1. Fetch General Stats
    try {
        const statRes = await fetch(`${API_BASE}/api/staff/general-stat`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (statRes.ok) {
            const data = await statRes.json();
            document.getElementById('statPendingTest').innerText = data.pendingTestBloodBag || 0;
            document.getElementById('statPendingStorage').innerText = data.pendingStorageBloodBag || 0;
            document.getElementById('statPendingRequest').innerText = data.pendingRequest || 0;

            const expiring = data.expiringBloodBag || 0;
            const expired = data.expiredBloodBag || 0;
            document.getElementById('statExpiring').innerText = expiring + expired;
        } else {
            console.error('Failed to fetch general stats:', statRes.status);
            throw new Error('Failed to fetch general stats');
        }
    } catch (e) {
        console.error('Error fetching general stats', e);
        ['statPendingTest', 'statPendingStorage', 'statPendingRequest', 'statExpiring'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = '0';
        });
    }

    // 2. Fetch Assignments
    try {
        const assignRes = await fetch(`${API_BASE}/api/staff/assignment/my-assignment`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (assignRes.ok) {
            const data = await assignRes.json();
            const assignments = data.assignments || [];

            if (assignments.length === 0) {
                assignmentsContainer.innerHTML = `
                    <div style="background-color: var(--bg-secondary); padding: 2.5rem 2rem; border-radius: 12px; text-align: center; color: var(--text-secondary); border: 2px dashed #e5e7eb;">
                        <i class="ph ph-calendar-check" style="font-size: 3.5rem; color: var(--primary-color); margin-bottom: 1rem; opacity: 0.9;"></i>
                        <h4 style="font-size: 1.15rem; color: var(--text-primary); margin-bottom: 0.5rem; font-weight: 600;">Bạn chưa có lịch phân công sự kiện nào sắp tới.</h4>
                        <p style="font-size: 1rem; color: var(--text-secondary);">Chúc bạn một ngày làm việc hiệu quả tại trung tâm!</p>
                    </div>
                `;
            } else {
                const formatDate = (dateString) => {
                    if (!dateString) return '';
                    const date = new Date(dateString);
                    const pad = n => n.toString().padStart(2, '0');
                    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
                };

                assignmentsContainer.innerHTML = assignments.map(task => {
                    let roleLabel = '';
                    switch (task.role) {
                        case 'TIEP_NHAN': roleLabel = 'Tiếp nhận'; break;
                        case 'BAC_SI': roleLabel = 'Bác sĩ khám'; break;
                        case 'LAY_MAU': roleLabel = 'Lấy mẫu'; break;
                        default: roleLabel = task.role || 'Chưa rõ';
                    }

                    return `
                    <div class="card event-card" style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; padding: 1.5rem; border-radius: 12px; margin-bottom: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.06); background-color: #fff; transition: transform 0.2s, box-shadow 0.2s;">
                        <div style="display: flex; gap: 1.5rem; align-items: center; flex: 1 1 auto; min-width: 300px;">
                            <div style="background-color: var(--primary-color-light); color: var(--primary-color); width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                <i class="ph-bold ph-calendar-star" style="font-size: 2.25rem;"></i>
                            </div>
                            <div style="flex: 1;">
                                <h4 style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.35rem;">${task.eventName || 'Sự kiện hiến máu'}</h4>
                                <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 0.75rem;">
                                    <span style="display: flex; align-items: center; gap: 0.35rem;"><i class="ph-bold ph-clock"></i> ${formatDate(task.startDate)} - ${formatDate(task.endDate)}</span>
                                    <span style="display: flex; align-items: center; gap: 0.35rem;"><i class="ph-bold ph-map-pin"></i> ${task.location || 'Chưa cập nhật địa điểm'}</span>
                                </div>
                                <span class="badge" style="background-color: #fef3c7; color: #b45309; padding: 0.4rem 0.8rem; border-radius: 99px; font-weight: 600; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.25rem;">
                                    <i class="ph-bold ph-user-circle"></i> Vai trò: ${roleLabel}
                                </span>
                            </div>
                        </div>
                        <div style="flex-shrink: 0; min-width: max-content; margin-top: 1rem;">
                            <!-- Thêm responsive cho margin-top trên mobile/tablet sau nếu cần -->
                        </div>
                        <div style="width: 100%; display: flex; justify-content: flex-end; margin-top: 0.5rem;">
                            <a href="reception.html" class="btn btn-primary" style="padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; background-color: var(--primary-color); color: white; text-decoration: none; transition: all 0.2s;">
                                Đi tới điểm tiếp nhận <i class="ph-bold ph-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                    `;
                }).join('');
            }
        } else {
            console.error('Failed to fetch assignments:', assignRes.status);
            throw new Error('Failed to fetch assignments');
        }
    } catch (e) {
        console.error('Error fetching assignments', e);
        assignmentsContainer.innerHTML = '<p style="color: var(--danger-color); padding: 1rem;">Đã xảy ra lỗi khi tải danh sách phân công.</p>';
    }
};

window.toggleSidebarDropdown = function (headerElement) {
    const parent = headerElement.closest('.nav-item-dropdown');
    if (!parent) return;
    const content = parent.querySelector('.nav-dropdown-content');
    const caret = parent.querySelector('.dropdown-arrow');
    if (content) {
        content.classList.toggle('active');
        if (caret) {
            if (content.classList.contains('active')) {
                caret.classList.replace('ph-caret-down', 'ph-caret-up');
            } else {
                caret.classList.replace('ph-caret-up', 'ph-caret-down');
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Auto open sidebar dropdowns if they contain active items
    document.querySelectorAll('.nav-item-dropdown').forEach(dropdown => {
        const hasActiveChild = dropdown.querySelector('.nav-dropdown-item.active');
        if (hasActiveChild) {
            const content = dropdown.querySelector('.nav-dropdown-content');
            const header = dropdown.querySelector('.nav-item-header');
            const caret = dropdown.querySelector('.dropdown-arrow');
            if (content) content.classList.add('active');
            if (header) header.classList.add('active');
            if (caret) {
                if (caret.classList.contains('ph-caret-down')) {
                    caret.classList.replace('ph-caret-down', 'ph-caret-up');
                }
            }
        }
    });
});
