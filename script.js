const API_DEPLOY = 'https://bloodbankmanager-production.up.railway.app';
const API_BASE = API_DEPLOY;
// Chart Configuration
const setupCharts = () => {
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

window.logout = function() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_info');
        window.location.href = 'login.html';
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

    renderStaff();

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
            document.getElementById('staffId').value = staff.id;
            document.getElementById('staffCode').value = staff.code;
            document.getElementById('staffName').value = staff.name;
            document.getElementById('staffEmail').value = staff.email || '';
            document.getElementById('staffDob').value = staff.dob || '';
            document.getElementById('staffCCCD').value = staff.cccd || '';
            document.getElementById('staffGender').value = staff.gender || 'Nam';
            document.getElementById('staffPhone').value = staff.phone || '';
            document.getElementById('staffPosition').value = staff.position;
            document.getElementById('staffStatus').checked = (staff.status === 'active');
        } else {
            title.innerText = 'Thêm nhân viên mới';
            form.reset();
            document.getElementById('staffId').value = '';
            document.getElementById('staffCode').value = '';
            if (document.getElementById('staffGender')) document.getElementById('staffGender').value = 'Nam';
            if (document.getElementById('staffEmail')) document.getElementById('staffEmail').value = '';
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
                renderStaff();
            }
        }
    };

    const form = document.getElementById('staffForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('saveStaffBtn');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang xử lý...';

            const id = document.getElementById('staffId').value;
            
            const payload = {
                fullName: document.getElementById('staffName').value,
                email: document.getElementById('staffEmail').value,
                dob: document.getElementById('staffDob').value,
                cccd: document.getElementById('staffCCCD').value,
                gender: document.getElementById('staffGender').value,
                phone: document.getElementById('staffPhone').value,
                position: document.getElementById('staffPosition').value
            };

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
                            status: document.getElementById('staffStatus').checked ? 'active' : 'locked'
                        });
                        renderStaff();
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
                btn.disabled = false;
                btn.innerHTML = originalText;
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

    renderHospitals();

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
            document.getElementById('hospitalId').value = hospital.id;
            document.getElementById('hospitalCode').value = hospital.code;
            document.getElementById('hospitalName').value = hospital.name;
            if (document.getElementById('hospitalEmail')) document.getElementById('hospitalEmail').value = hospital.email || '';
            document.getElementById('hospitalAddress').value = hospital.address || '';
            document.getElementById('hospitalPhone').value = hospital.phone || '';
            if (document.getElementById('hospitalStatus')) document.getElementById('hospitalStatus').checked = (hospital.status === 'active');
        } else {
            title.innerText = 'Thêm bệnh viện mới';
            form.reset();
            document.getElementById('hospitalId').value = '';
            document.getElementById('hospitalCode').value = '';
            if (document.getElementById('hospitalEmail')) document.getElementById('hospitalEmail').value = '';
            if (document.getElementById('hospitalStatus')) document.getElementById('hospitalStatus').checked = true;
        }

        openModal(modal);
    };

    const form = document.getElementById('hospitalForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('saveHospitalBtn');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang xử lý...';

            const id = document.getElementById('hospitalId').value;
            
            const payload = {
                hospitalName: document.getElementById('hospitalName').value,
                email: document.getElementById('hospitalEmail') ? document.getElementById('hospitalEmail').value : '',
                address: document.getElementById('hospitalAddress').value,
                hotline: document.getElementById('hospitalPhone').value
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
                        renderHospitals();
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
                btn.disabled = false;
                btn.innerHTML = originalText;
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
                    const cleanStatus = (e.status || "").toUpperCase().replace(/[^A-Z]/g, "");
                    
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
        } catch(error) {
            console.error('Lỗi tải sự kiện', error);
        }
    };

    // Helper: Status Badges
    const getStatusBadge = (status) => {
        // Ánh xạ trực tiếp từ key DB qua hiển thị
        switch (status) {
            case 'SAPTOI': return '<span class="badge status-upcoming">Sắp tới</span>';
            case 'DANGMO': 
            case 'DANGDIENRA': return '<span class="badge status-happening">Đang mở</span>';
            case 'DADONG': return '<span class="badge status-completed">Đã đóng</span>';
            case 'DAHUY': return '<span class="badge status-cancelled">Đã hủy</span>';
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
                <button class="action-btn" onclick="viewCampaignDetails(${c.id})" title="Xem chi tiết">
                    <i class="ph-bold ph-eye"></i>
                </button>
            `;

            const s = (c.status || "").toUpperCase();
            if (s === 'SAPTOI' || s === 'DANGMO' || s === 'DANGDIENRA') {
                buttons += `
                    <button class="action-btn" onclick="openEditCampaignModal(${c.id})" title="Chỉnh sửa">
                        <i class="ph-bold ph-pencil"></i>
                    </button>
                `;
                
                if (s === 'SAPTOI') {
                    buttons += `
                        <button class="action-btn" onclick="cancelCampaign(${c.id})" title="Hủy sự kiện">
                            <i class="ph-bold ph-trash" style="color: #ef4444;"></i>
                        </button>
                    `;
                } else {
                    buttons += `
                        <button class="action-btn" onclick="closeCampaign(${c.id})" title="Đóng sự kiện">
                            <i class="ph-bold ph-stop-circle" style="color: #f59e0b;"></i>
                        </button>
                    `;
                }
            }
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

            // Handle Dates (Simulated parsing for demo)
            // In real app, you'd parse c.date and c.time properly

            // Constrain Inputs
            document.getElementById('evtName').disabled = false;
            document.getElementById('evtDesc').disabled = false;
            document.getElementById('evtGoal').disabled = false; // Maybe allow goal? User didn't specify, but usually yes.

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

    window.cancelCampaign = (id) => {
        if (confirm('Bạn có chắc muốn HỦY sự kiện này không? Hành động này không thể hoàn tác.')) {
            const c = campaigns.find(x => x.id === id);
            if (c) {
                c.status = 'cancelled';
                renderCampaigns();
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

    window.viewCampaignDetails = (id) => {
        const c = campaigns.find(x => x.id === id);
        if (!c) return;

        const modal = document.getElementById('eventDetailModal');
        const title = document.getElementById('eventDetailTitle');
        const body = document.getElementById('eventDetailBody');

        title.innerText = `Chi tiết: ${c.name}`;

        // Common Event Info Section
        const eventInfoHtml = `
            <div style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; border: 1px solid #e5e7eb;">
                <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 0.25rem;">Thời gian</p>
                        <div style="font-weight: 500;"><i class="ph-bold ph-calendar-blank"></i> ${c.date}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-left: 1.25rem;">${c.time}</div>
                    </div>
                    <div>
                        <p style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 0.25rem;">Địa điểm</p>
                        <div style="font-weight: 500;"><i class="ph-bold ph-map-pin"></i> ${c.location}</div>
                    </div>
                </div>
            </div>
        `;

        body.innerHTML = eventInfoHtml; // Start with Info

        if (c.status === 'completed' || c.status === 'cancelled') {
            // VIEW: RESULT STATS
            const stats = c.stats || { participants: 0, units: 0, successRate: '0%' };

            // Add Export Excel Button for Completed events
            const exportButton = c.status === 'completed' ? `
                <div style="text-align: right; margin-bottom: 1rem;">
                    <button class="btn btn-secondary" onclick="alert('Đang xuất báo cáo Excel...')">
                        <i class="ph-bold ph-microsoft-excel-logo" style="color: #16a34a;"></i> Xuất danh sách Excel
                    </button>
                </div>
            ` : '';

            body.innerHTML += `
                ${exportButton}
                <div class="grid-4" style="margin-bottom: 1.5rem;">
                     <div class="card" style="background: #f9fafb; padding: 1rem;">
                        <p style="color: var(--text-secondary); font-size: 0.75rem;">Tổng người tham gia</p>
                        <h3 style="font-size: 1.25rem;">${stats.participants}</h3>
                     </div>
                     <div class="card" style="background: #f9fafb; padding: 1rem;">
                        <p style="color: var(--text-secondary); font-size: 0.75rem;">Đơn vị máu thu được</p>
                        <h3 style="font-size: 1.25rem; color: #ef4444;">${stats.units}</h3>
                     </div>
                     <div class="card" style="background: #f9fafb; padding: 1rem;">
                        <p style="color: var(--text-secondary); font-size: 0.75rem;">Tỷ lệ thành công</p>
                        <h3 style="font-size: 1.25rem; color: #10b981;">${stats.successRate}</h3>
                     </div>
                </div>
                
                <h4 style="margin-bottom: 1rem; font-size: 0.875rem; font-weight: 600;">Danh sách người hiến thành công</h4>
                <p style="color: var(--text-secondary); font-style: italic;">(Danh sách chi tiết đã được lưu trữ)</p>
            `;
        } else {
            // VIEW: LIST OF REGISTRANTS (Upcoming + Happening)
            // NO Time Slot, NO Actions, NO QR Scan

            let listHtml = c.donors.map(d => `
                <tr>
                    <td>
                        <div style="font-weight: 500;">${d.name}</div>
                    </td>
                    <td>${d.phone}</td>
                    <td>${getDonorStatusBadge(d.status)}</td>
                </tr>
            `).join('');

            body.innerHTML += `
                <div style="margin-bottom: 1rem;">
                    <p><strong>Tiến độ:</strong> ${c.current} / ${c.goal} đăng ký</p>
                </div>
                
                <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>Họ tên</th>
                                <th>Liên hệ</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${listHtml.length > 0 ? listHtml : '<tr><td colspan="3" style="text-align: center; color: var(--text-secondary); padding: 2rem;">Chưa có người đăng ký</td></tr>'}
                        </tbody>
                    </table>
                </div>
             `;
        }

        openModal(modal);
    }

    loadCampaigns();
};

// ==================== AUTH & ROLE HELPERS ====================

window.checkStaffRole = function(allowedRoles) {
    const role = (localStorage.getItem('user_role') || '').toUpperCase();
    const token = localStorage.getItem('access_token');

    // 1. Check token
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Check role (if specific roles are required)
    if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(role)) {
            // If role not allowed for this page, redirect to dashboard
            if (window.location.pathname.indexOf('dashboard.html') === -1) {
                alert('Bạn không có quyền truy cập trang này!');
                window.location.href = 'dashboard.html';
            }
        }
    }
};

window.logout = function() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_info');
        window.location.href = 'login.html';
    }
};

// Auto-init user info and sidebar visibility in header if element exists
document.addEventListener('DOMContentLoaded', () => {
    const userRole = localStorage.getItem('user_role');
    
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
        techItems.forEach(el => el.style.display = 'block');
        if (sidebarRoleLabel) sidebarRoleLabel.textContent = 'Nhân viên Kỹ thuật';
    } else if (userRole === 'STAFF_INVENTORY') {
        inventoryItems.forEach(el => el.style.display = 'block');
        if (sidebarRoleLabel) sidebarRoleLabel.textContent = 'Nhân viên Kho';
    } else {
        // Dev fallback or generic staff
        techItems.forEach(el => el.style.display = 'block');
        inventoryItems.forEach(el => el.style.display = 'block');
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

window.openChangePasswordModal = function() {
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

window.closeChangePasswordModal = function() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.classList.remove('active');
        document.getElementById('changePasswordForm').reset();
        document.getElementById('passwordError').style.display = 'none';
    }
};

window.submitChangePasswordStaff = async function(e) {
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
