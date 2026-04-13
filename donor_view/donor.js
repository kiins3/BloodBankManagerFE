
document.addEventListener('DOMContentLoaded', function () {
    console.log("Donor Portal Loaded");
    // Tự động load thông tin người dùng lên Navbar nếu có các element cần thiết
    initHomeNavbar();

    // Hook search button (chỉ có trên events.html)
    const btnSearch = document.getElementById('btnSearchEvent');
    if (btnSearch) {
        btnSearch.addEventListener('click', () => {
            const loc = document.getElementById('searchLocation').value;
            const date = document.getElementById('searchDate').value;
            loadDonorEvents(loc, date, false);
        });
    }

    // Load sự kiện: home.html (compact, 3 items) vs events.html (full list)
    const eventsContainer = document.getElementById('donor-events-list');
    if (eventsContainer) {
        const isHomePage = window.location.pathname.endsWith('home.html');
        loadDonorEvents('', '', isHomePage).then(() => {
            // Sau khi load xong, kiểm tra có id truyền qua URL để auto-mở modal (chỉ ở events.html)
            if (!isHomePage) {
                const params = new URLSearchParams(window.location.search);
                const eventId = params.get('id');
                if (eventId) {
                    const btn = document.querySelector(`a[onclick*="'${eventId}'"]`);
                    if (btn) btn.click();
                }
            }
        });
    }
});

// Tải thông tin người dùng thật lên Navbar (avatar + tên)
async function initHomeNavbar() {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE}/api/shared/user/get-profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const resultBE = await response.json();
            const data = resultBE.data ? resultBE.data : resultBE;
            const fullName = data.fullName || data.name || 'Người dùng';
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=c0392b&color=fff`;

            // --- Cập nhật Avatar trong Navbar ---
            const avatarById = document.getElementById('navbarAvatar');
            if (avatarById) {
                avatarById.src = avatarUrl;
                avatarById.alt = fullName;
            } else {
                // Các trang khác: tìm ảnh avatar trong navbar
                const avatarBySelector = document.querySelector('a.dropdown-toggle img.rounded-circle');
                if (avatarBySelector) {
                    avatarBySelector.src = avatarUrl;
                    avatarBySelector.alt = fullName;
                }
            }

            // --- Cập nhật tên trong dropdown ---
            const nameById = document.getElementById('navbarDropdownName');
            if (nameById) {
                nameById.textContent = fullName;
            } else {
                const nameBySelector = document.querySelector('ul.dropdown-menu h6.dropdown-header');
                if (nameBySelector) nameBySelector.textContent = fullName;
            }

            // --- Cập nhật tên mobile ---
            const nameMobile = document.getElementById('navbarUserNameMobile');
            if (nameMobile) nameMobile.textContent = fullName;

            // --- Cập nhật lời chào trang home ---
            const welcomeName = document.getElementById('welcomeUserName');
            if (welcomeName) welcomeName.innerHTML = `${fullName}! 👋`;

            // --- Cập nhật avatar bên trái profile page (128px) ---
            const profileAvatar = document.querySelector('.card img.rounded-circle[width="128"]');
            if (profileAvatar) {
                profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=c0392b&color=fff&size=128`;
            }
        }
    } catch (e) {
        console.warn('Không thể tải thông tin người dùng cho Navbar:', e.message);
    }
}

// Chạy luôn không cần đợi DOMContentLoaded vì script đặt ở cuối body rồi
if (document.getElementById('fullName')) {
    loadProfile();
}

// Load events được xử lý trong DOMContentLoaded ở trên

if (document.getElementById('ticketQrImg')) {
    loadTicketDetails();
}

if (document.getElementById('my-tickets-list')) {
    loadMyTickets();
}

async function loadMyTickets() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/donor/registration/get-all-my-tickets`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const container = document.getElementById('my-tickets-list');
            const emptyState = document.getElementById('emptyState');

            container.innerHTML = '';
            
            if (!data || data.length === 0) {
                emptyState.classList.remove('d-none');
                return;
            }
            emptyState.classList.add('d-none');

            // Hiển thị danh sách vé (BE đã sắp xếp sẵn ưu tiên gần đây nhất)
            data.forEach(ticket => {
                let badgeHtml = '';
                const s = (ticket.status || "").toUpperCase().replace(/[^A-Z]/g, "");

                if (s === 'SAPTOI') {
                    badgeHtml = '<span class="badge bg-warning bg-opacity-10 text-warning rounded-pill px-3 border border-warning">Sắp tới</span>';
                } else if (s === 'DANGMO' || s === 'DANGDIENRA') {
                    badgeHtml = '<span class="badge bg-success bg-opacity-10 text-success rounded-pill px-3 border border-success">Sắp diễn ra</span>';
                } else if (s === 'DADONG') {
                    badgeHtml = '<span class="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3 border border-secondary">Đã đóng</span>';
                } else if (s === 'DAHUY') {
                    badgeHtml = '<span class="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 border border-danger">Đã hủy</span>';
                } else {
                    badgeHtml = `<span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 border border-primary">${ticket.status || 'Không rõ'}</span>`;
                }

                let timeDisplay = '';
                if (ticket.startDate) {
                    const start = new Date(ticket.startDate);
                    let endStr = "";
                    if (ticket.endDate) {
                        const end = new Date(ticket.endDate);
                        endStr = ` - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit'})}`;
                    }
                    timeDisplay = `
                        <div class="d-flex align-items-center text-muted mb-2">
                            <i class="ph-bold ph-calendar-blank me-2 fs-5"></i>
                            <span class="fw-medium">${start.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                            <span class="mx-2">•</span>
                            <span>${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit'})}${endStr}</span>
                        </div>
                    `;
                }

                let cancelBtnHtml = '';
                if (s === 'SAPTOI' || s === 'DANGMO' || s === 'DANGDIENRA') {
                    cancelBtnHtml = `
                        <button class="btn btn-outline-danger rounded-pill fw-bold px-4"
                            onclick="showCancelModal('ticket-card-${ticket.eventId}', '${ticket.eventName}')">
                            Hủy đăng ký
                        </button>
                    `;
                }

                const cardHtml = `
            <div class="col-12 col-md-6" id="ticket-card-${ticket.eventId}">
                <div class="card border-0 shadow-sm h-100 ${s === 'DADONG' || s === 'DAHUY' ? 'opacity-75 bg-light' : ''}">
                    <div class="card-body p-4 d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h5 class="fw-bold mb-0 text-truncate header-font pe-2" title="${ticket.eventName}">${ticket.eventName}</h5>
                            ${badgeHtml}
                        </div>

                        <div class="mb-4 flex-grow-1">
                            ${timeDisplay}
                            <div class="d-flex align-items-center text-muted">
                                <i class="ph-bold ph-map-pin me-2 fs-5"></i>
                                <span class="text-truncate">${ticket.location || "Đang cập nhật địa điểm"}</span>
                            </div>
                        </div>

                        <div class="d-grid gap-2 d-md-flex mt-auto">
                            <a href="ticket.html?id=${ticket.eventId}" class="btn btn-primary rounded-pill fw-bold px-4 flex-grow-1">
                                <i class="ph-bold ph-qr-code me-2"></i>Xem Chi Tiết / Mã QR
                            </a>
                            ${cancelBtnHtml}
                        </div>
                    </div>
                </div>
            </div>`;
                container.insertAdjacentHTML('beforeend', cardHtml);
            });
        } else {
            console.error("Lỗi khi tải danh sách vé:", response.status);
            document.getElementById('my-tickets-list').innerHTML = '<div class="col-12 text-center py-5 text-danger">Lỗi định dạng khi đăng nhập.</div>';
        }
    } catch (error) {
        console.error(error);
        const container = document.getElementById('my-tickets-list');
        if (container) container.innerHTML = '<div class="col-12 text-center py-5 text-danger">Lỗi kết nối tới hệ thống vé.</div>';
    }
}

async function loadTicketDetails() {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');
    
    if (!eventId) {
        document.getElementById('ticketEventName').textContent = 'Mã vé không hợp lệ';
        document.getElementById('ticketStatus').innerHTML = '<i class="ph-bold ph-warning-circle me-1"></i> Lỗi';
        return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }

    try {
        // Cố gắng kéo thông tin người dùng để hiện tên lên vé
        try {
            const profRes = await fetch(`${API_BASE}/api/shared/user/get-profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (profRes.ok) {
                const profile = await profRes.json();
                const d = profile.data ? profile.data : profile;
                const donorNameEl = document.getElementById('ticketDonorName');
                if (donorNameEl) donorNameEl.textContent = d.fullName || d.name || 'Người hiến máu';
                
                // Tranh thủ cập nhật tên lên Navbar
                document.querySelectorAll('.dropdown-header, .ms-2.d-lg-none').forEach(el => {
                     if(el.textContent.includes('Nguyễn Văn A')) el.textContent = d.fullName || d.name;
                });
            }
        } catch(e) {}

        // Kéo thông tin Vé
        const response = await fetch(`${API_BASE}/api/donor/registration/get-my-ticket/${eventId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            document.getElementById('ticketEventName').textContent = data.eventName || 'Sự kiện hiến máu';
            document.getElementById('ticketCodeText').textContent = "Mã vé: #" + (data.ticketCode || '----');
            if (data.qrCode) {
                document.getElementById('ticketQrImg').src = 'data:image/png;base64,' + data.qrCode;
                document.getElementById('ticketQrImg').style.objectFit = 'contain';
            }

            if (data.donorName) {
                document.getElementById('ticketDonorName').textContent = data.donorName;
            }

            if (data.startDate) {
                const start = new Date(data.startDate);
                document.getElementById('ticketDateRow').style.display = 'flex';
                document.getElementById('ticketDateVal').textContent = start.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                
                if (data.endDate) {
                    const end = new Date(data.endDate);
                    document.getElementById('ticketTimeRow').style.display = 'flex';
                    document.getElementById('ticketTimeVal').textContent = `${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit'})} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit'})}`;
                }
            }

            document.getElementById('ticketLocationRow').style.display = 'flex';
            if (data.location) {
                document.getElementById('ticketLocationVal').textContent = data.location;
            } else {
                document.getElementById('ticketLocationVal').textContent = "Đang cập nhật";
                document.getElementById('ticketLocationVal').classList.remove('fw-bold');
                document.getElementById('ticketLocationVal').classList.add('fst-italic', 'text-muted');
            }

            const statusBadge = document.getElementById('ticketStatus');
            if (data.status === 'DA_DANG_KY') {
                statusBadge.innerHTML = '<i class="ph-bold ph-check-circle me-1"></i> Sẵn sàng Check-in';
                statusBadge.className = 'status-badge'; 
            } else if (data.status === 'DA_CHECK_IN') {
                statusBadge.innerHTML = '<i class="ph-bold ph-check-circle me-1"></i> Đã Check-in';
                statusBadge.className = 'status-badge bg-success text-white'; 
                statusBadge.style.background = '#10b981';
                statusBadge.style.color = 'white';
            } else {
                statusBadge.innerHTML = `<i class="ph-bold ph-info me-1"></i> ${data.status || 'Không rõ'}`;
                statusBadge.className = 'status-badge bg-secondary text-white';
            }
        } else {
            const err = await response.text();
            document.getElementById('ticketEventName').textContent = 'Lỗi tải vé';
            document.getElementById('ticketStatus').innerHTML = '<i class="ph-bold ph-warning-circle me-1"></i> Không tìm thấy';
            console.error(err);
        }
    } catch (error) {
        console.error(error);
        alert("Lỗi kết nối khi tải dữ liệu vé!");
    }
}

async function loadDonorEvents(filterLoc = '', filterDate = '', compactMode = false) {
    const token = localStorage.getItem('access_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const container = document.getElementById('donor-events-list');
    if (!container) return;

    // Hiển thị skeleton loader
    container.innerHTML = `
        <div class="col-12 text-center py-5 text-muted">
            <div class="spinner-border text-danger" role="status">
                <span class="visually-hidden">Đang tải...</span>
            </div>
            <p class="mt-2 small">Đang tải danh sách sự kiện...</p>
        </div>`;

    try {
        const response = await fetch(`${API_BASE}/api/shared/event/get-list-event`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            container.innerHTML = '<div class="col-12 text-center py-5 text-danger">Lỗi khi tải dữ liệu từ máy chủ.</div>';
            return;
        }

        const result = await response.json();
        console.log('[Events API] raw response:', JSON.stringify(result).substring(0, 500));
        
        // Hỗ trợ nhiều dạng response: { data: [...] } | { code, data: [...] } | [...]
        let data;
        if (Array.isArray(result)) {
            data = result;
        } else if (result.data && Array.isArray(result.data)) {
            data = result.data;
        } else if (result.content && Array.isArray(result.content)) {
            data = result.content;
        } else {
            // Cố tìm mảng trong object
            const firstArray = Object.values(result).find(v => Array.isArray(v));
            data = firstArray || [];
        }
        
        console.log('[Events API] parsed data length:', data ? data.length : 0);
        container.innerHTML = '';

        if (!data || !Array.isArray(data) || data.length === 0) {
            container.innerHTML = '<div class="col-12 text-center py-5 text-muted">Hiện chưa có sự kiện nào.</div>';
            return;
        }

        // Lọc dữ liệu phía Client
        let filteredResults = data;
        if (filterLoc) {
            filteredResults = filteredResults.filter(e =>
                (e.location || '').toLowerCase().includes(filterLoc.toLowerCase()) ||
                (e.eventName || '').toLowerCase().includes(filterLoc.toLowerCase())
            );
        }
        if (filterDate) {
            filteredResults = filteredResults.filter(e => {
                const start = new Date(e.startDate).toISOString().split('T')[0];
                return start === filterDate;
            });
        }

        if (filteredResults.length === 0) {
            container.innerHTML = '<div class="col-12 text-center py-5 text-muted">Không tìm thấy sự kiện nào khớp với yêu cầu.</div>';
            return;
        }

        // compactMode (home.html): chỉ hiện 3 sự kiện, nút dẫn sang events.html
        const displayList = compactMode ? filteredResults.slice(0, 3) : filteredResults;

        displayList.forEach(e => {
            const s = (e.status || "").toUpperCase().replace(/[^A-Z]/g, "");

            let badgeHtml = '';
            let buttonHtml = '';
            let opacity = '1';

            const start = new Date(e.startDate);
            const end = new Date(e.endDate);
            const timeStr = `${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}, ${start.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;

            const percent = Math.round(((e.currentAmount || 0) / e.targetAmount) * 100);

            if (s === 'DANGMO' || s === 'DANGDIENRA') {
                badgeHtml = '<span class="badge bg-success position-absolute top-0 end-0 m-3">Đang mở</span>';
                if (compactMode) {
                    buttonHtml = `<a href="events.html?id=${e.eventId}" class="btn btn-danger w-100 rounded-pill fw-bold mt-2">Đăng ký tham gia</a>`;
                } else {
                    buttonHtml = `<a href="#" onclick="handleRegistration(event, '${e.eventId}', '${e.eventName}', '${timeStr}')" class="btn btn-danger w-100 rounded-pill fw-bold mt-2">Đăng ký tham gia</a>`;
                }
            } else if (s === 'SAPTOI') {
                badgeHtml = '<span class="badge bg-warning text-dark position-absolute top-0 end-0 m-3">Sắp tới</span>';
                if (compactMode) {
                    buttonHtml = `<a href="events.html?id=${e.eventId}" class="btn btn-primary w-100 rounded-pill fw-bold mt-2" style="background-color: var(--primary-color); border: none;">Xem sự kiện</a>`;
                } else {
                    buttonHtml = `<a href="#" onclick="handleRegistration(event, '${e.eventId}', '${e.eventName}', '${timeStr}')" class="btn btn-primary w-100 rounded-pill fw-bold mt-2" style="background-color: var(--primary-color); border: none;">Đăng ký tham gia</a>`;
                }
            } else if (s === 'DADONG') {
                badgeHtml = '<span class="badge bg-secondary position-absolute top-0 end-0 m-3">Đã đóng</span>';
                buttonHtml = `<button class="btn btn-light w-100 rounded-pill fw-bold mt-2 text-muted" disabled>Đã kết thúc</button>`;
                opacity = '0.7';
            } else {
                badgeHtml = `<span class="badge bg-dark position-absolute top-0 end-0 m-3">${e.status}</span>`;
                buttonHtml = `<button class="btn btn-light w-100 rounded-pill fw-bold mt-2 text-muted" disabled>Không khả dụng</button>`;
                opacity = '0.5';
            }

            const imgText = encodeURIComponent(e.eventName.substring(0, 15));
            const imgSrc = `https://placehold.co/600x300/e0f2fe/0984e3?text=${imgText}`;

            const cardHtml = `
                <div class="col-12 col-md-6 col-lg-4" style="opacity: ${opacity}">
                    <div class="event-card bg-white d-flex flex-column h-100 shadow-sm rounded">
                        <div class="position-relative">
                            <img src="${imgSrc}" class="card-img-top event-img" alt="Event Image" style="height: 180px; object-fit: cover;">
                            ${badgeHtml}
                        </div>
                        <div class="p-3 d-flex flex-column flex-grow-1">
                            <h5 class="fw-bold mb-2">${e.eventName}</h5>

                            <div class="mb-3 text-secondary small">
                                <div class="d-flex align-items-center mb-2">
                                    <i class="ph-bold ph-clock me-2"></i> ${timeStr}
                                </div>
                                <div class="d-flex align-items-center">
                                    <i class="ph-bold ph-map-pin me-2"></i> ${e.location || 'Đang cập nhật'}
                                </div>
                            </div>

                            <div class="mt-auto">
                                <div class="d-flex justify-content-between small fw-bold mb-1">
                                    <span>Tiến độ</span>
                                    <span class="${percent >= 90 ? 'text-danger' : ''}">${e.currentAmount || 0}/${e.targetAmount}</span>
                                </div>
                                <div class="progress progress-custom mb-3" style="height: 8px;">
                                    <div class="progress-bar ${percent >= 90 ? 'bg-danger' : 'bg-primary'}" role="progressbar" style="width: ${percent}%"></div>
                                </div>

                                ${buttonHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', cardHtml);
        });

    } catch (error) {
        console.error("Lỗi khi fetch events:", error);
        container.innerHTML = '<div class="col-12 text-center py-5 text-danger">Không thể kết nối đến máy chủ sự kiện.</div>';
    }
}

async function loadProfile() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/shared/user/get-profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const resultBE = await response.json();
            const data = resultBE.data ? resultBE.data : resultBE;

            // Đổ dữ liệu vào các ô Input
            if (document.getElementById('fullName')) document.getElementById('fullName').value = data.fullName || data.name || '';
            if (document.getElementById('gender')) document.getElementById('gender').value = data.gender || 'male';
            if (document.getElementById('address')) document.getElementById('address').value = data.address || '';
            if (document.getElementById('phone')) document.getElementById('phone').value = data.phone || '';
            if (document.getElementById('cccd')) document.getElementById('cccd').value = data.cccd || '';

            
            // Xử lý định dạng ngày sinh cho thẻ <input type="date">
            if (document.getElementById('dob') && data.dob) {
                let dobVal = data.dob;
                // Nếu Backend ném về DD-MM-YYYY thì chẻ ra lật lại thành YYYY-MM-DD
                if (dobVal.includes('-') && dobVal.split('-')[0].length === 2) {
                    const p = dobVal.split('-');
                    dobVal = `${p[2]}-${p[1]}-${p[0]}`;
                }
                document.getElementById('dob').value = dobVal;
            }

            // Xử lý ô Hiển thị nhóm máu read-only
            if (document.getElementById('bloodType')) {
                document.getElementById('bloodType').value = (data.bloodType || 'Chưa XN') + (data.rhFactor === '+' || data.rhFactor === '-' ? data.rhFactor : '');
            }
            if (document.getElementById('rhFactor')) {
                document.getElementById('rhFactor').value = data.rhFactor === '+' ? 'Dương tính (+)' : (data.rhFactor === '-' ? 'Âm tính (-)' : 'Chưa định dạng');
            }

            // Ghi đè tên lên giao diện avatar bên trái
            const profileName = document.querySelector('h5.fw-bold.mb-1');
            if (profileName) profileName.textContent = data.fullName || data.name || 'Người hiến máu';
            
            const profileAvatar = document.querySelector('.card img.rounded-circle[width="128"]');
            if (profileAvatar && (data.fullName || data.name)) {
                profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName || data.name)}&background=random&size=128`;
            }
            
            // Sửa luôn cả chữ Nguyễn Văn A trên thanh Navbar menu nếu có
            document.querySelectorAll('.dropdown-header, .ms-2.d-lg-none').forEach(el => {
                 if(el.textContent.includes('Nguyễn Văn A')) el.textContent = data.fullName || data.name;
            });

            showToast("Đã tải thành công dữ liệu từ hệ thống", "success");

        } else {
            const err = await response.text();
            showToast("Lỗi khi tải Profile từ BE: " + err, "warning");
        }
    } catch (error) {
        showToast("Lỗi mạng (CORS) hoặc không kết nối được BE: " + error.message, "danger");
    }
}

// Mock Data: Simulate last donation date
// Let's assume the user donated 90 days ago (Eligible) or 20 days ago (Not Eligible)
// Change this value to test different scenarios
const MOCK_LAST_DONATION_DATE = new Date();
MOCK_LAST_DONATION_DATE.setDate(MOCK_LAST_DONATION_DATE.getDate() - 90); // 90 days ago -> Eligible

// Minimum days between donations
const MIN_DAYS_BETWEEN_DONATIONS = 84;

let currentEventId = null;

// Function to handle registration click
function handleRegistration(event, eventId, eventName, eventTime) {
    event.preventDefault();
    currentEventId = eventId;

    // Step 1: Check Eligibility
    if (!checkEligibility()) {
        const nextEligibleDate = new Date(MOCK_LAST_DONATION_DATE);
        nextEligibleDate.setDate(nextEligibleDate.getDate() + MIN_DAYS_BETWEEN_DONATIONS);

        const formattedDate = nextEligibleDate.toLocaleDateString('vi-VN');

        alert(`Bạn chưa đủ thời gian giãn cách. Ngày được hiến lại là: ${formattedDate}`);
        return;
    }

    // Step 2: Show Confirmation Modal
    showConfirmationModal(eventName, eventTime);
}

// Check eligibility based on mock data
function checkEligibility() {
    const today = new Date();
    const diffTime = Math.abs(today - MOCK_LAST_DONATION_DATE);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= MIN_DAYS_BETWEEN_DONATIONS;
}

// Show Confirmation Modal
function showConfirmationModal(eventName, eventTime) {
    // Populate modal data
    document.getElementById('modalEventName').textContent = eventName;
    document.getElementById('modalEventTime').textContent = eventTime;

    // Reset Checkbox
    document.getElementById('confirmCheckbox').checked = false;
    document.getElementById('btnConfirmReg').disabled = true;

    // Show Modal
    const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    modal.show();
}

// Handle Checkbox Change
function toggleConfirmButton() {
    const isChecked = document.getElementById('confirmCheckbox').checked;
    document.getElementById('btnConfirmReg').disabled = !isChecked;
}

// Handle Final Confirmation
async function confirmRegistration() {
    const btn = document.getElementById('btnConfirmReg');
    btn.disabled = true;
    btn.innerText = 'Đang xử lý...';

    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('Bạn cần đăng nhập để thao tác.');
            window.location.href = '../login.html';
            return;
        }

        const res = await fetch(`${API_BASE}/api/donor/registration/regisEvent/${currentEventId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (res.ok) {
            alert("Đăng ký thành công! Đang chuyển đến vé của bạn...");
            
            // Ẩn modal
            const modalEl = document.getElementById('confirmationModal');
            if (modalEl) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }

            // Redirect tới trang vé (hoặc tab vé của tôi)
            window.location.href = `ticket.html?id=${currentEventId}`;
        } else {
            const err = await res.text();
            alert("Đăng ký thất bại: " + err);
        }
    } catch (error) {
        console.error(error);
        alert("Lỗi kết nối tới máy chủ.");
    } finally {
        btn.disabled = false;
        btn.innerText = 'Xác nhận';
    }
}

// --- TICKET CANCELLATION LOGIC ---

let ticketIdToCancel = null;

function showCancelModal(elementId, eventName) {
    ticketIdToCancel = elementId;
    document.getElementById('cancelEventName').textContent = eventName;

    // Show Modal
    const modal = new bootstrap.Modal(document.getElementById('cancelModal'));
    modal.show();
}

function confirmCancellation() {
    if (!ticketIdToCancel) return;

    // 1. Remove the element from DOM
    const cardElement = document.getElementById(ticketIdToCancel);
    if (cardElement) {
        cardElement.remove();
    }

    // 2. Mock API Call Success
    showToast("Hủy đăng ký thành công!", "success");

    // 3. Hide Modal
    const modalEl = document.getElementById('cancelModal');
    const modal = bootstrap.Modal.getInstance(modalEl); // Get existing instance
    modal.hide();

    // 4. Check if list is empty
    const ticketsContainer = document.querySelector('.row.g-4');
    if (ticketsContainer && ticketsContainer.children.length === 0) {
        document.getElementById('emptyState').classList.remove('d-none');
    }
}

// Helper to show toast/alert (Simple version)
function showToast(message, type) {
    const alertPlaceholder = document.getElementById('alertsPlaceholder');
    if (!alertPlaceholder) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible" role="alert">`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
    ].join('');

    alertPlaceholder.append(wrapper);

    // Auto dismiss after 3 seconds
    setTimeout(() => {
        wrapper.remove();
    }, 3000);
}

// --- PROFILE SAVE LOGIC ---
async function handleProfileSave(event) {
    event.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const gender = document.getElementById('gender').value;
    const dobRaw = document.getElementById('dob').value;
    const address = document.getElementById('address').value;

    // Format DOB từ YYYY-MM-DD sang DD-MM-YYYY cho API
    let formattedDob = dobRaw;
    if (dobRaw && dobRaw.includes('-')) {
        const parts = dobRaw.split('-');
        formattedDob = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    // Trích xuất các trường thông tin y tế (đọc read-only)
    let bloodTypeField = document.getElementById('bloodType');
    let rhFactorField = document.getElementById('rhFactor');
    
    let bloodTypeRaw = bloodTypeField ? bloodTypeField.value : '';
    let rhRaw = rhFactorField ? rhFactorField.value : '';

    // Xử lý sạch text ("O+" -> "O", "Dương tính (+)" -> "+")
    let bloodType = bloodTypeRaw.replace('+', '').replace('-', '').trim();
    if (bloodType.includes('Chưa XN') || bloodType === '') bloodType = null;

    let rhFactor = rhRaw.includes('+') ? '+' : (rhRaw.includes('-') ? '-' : null);

    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang lưu...';

    const token = localStorage.getItem('access_token');

    try {
        const response = await fetch(`${API_BASE}/api/donor/update-donor`, {
            method: 'PUT', // Dùng PUT theo ảnh Postman
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                fullName: fullName,
                gender: gender,
                dob: formattedDob,
                bloodType: bloodType,
                rhFactor: rhFactor,
                address: address
            })
        });

        if (response.ok) {
            showToast("Cập nhật thông tin thành công!", "success");
        } else {
            const err = await response.json().catch(() => ({}));
            showToast("Cập nhật thất bại: " + (err.message || "Lỗi Server"), "danger");
        }
    } catch (error) {
        showToast("Không thể kết nối đến máy chủ!", "danger");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// --- CHANGE PASSWORD LOGIC ---
async function handleChangePassword(event) {
    event.preventDefault();

    const oldPass = document.getElementById('oldPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;

    if (newPass !== confirmPass) {
        showToast("Mật khẩu xác nhận không khớp!", "warning");
        return;
    }

    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang xử lý...';

    const token = localStorage.getItem('access_token');

    try {
        // Chú ý: Backend đặt api này ở thư mục /auth thay vì /donor
        const response = await fetch(`${API_BASE}/api/shared/user/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                oldPassword: oldPass,
                newPassword: newPass,
                confirmPassword: confirmPass
            })
        });

        if (response.ok) {
            showToast("Đổi mật khẩu thành công!", "success");
            event.target.reset(); // Xóa trắng form
        } else {
            const err = await response.text();
            showToast("Thất bại: " + err, "danger");
        }
    } catch (error) {
        showToast("Lỗi mạng (CORS) hoặc không thể kết nối tới BE!", "danger");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}


