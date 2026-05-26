window.API_BASE = window.API_BASE || 'http://localhost:8080';
window.API_DEPLOY = window.API_DEPLOY || 'http://localhost:8080';
document.addEventListener('DOMContentLoaded', function () {
    console.log("Donor Portal Loaded");
    // Tự động load thông tin người dùng lên Navbar nếu có các element cần thiết
    initHomeNavbar();
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

if (document.getElementById('donor-events-list')) {
    loadDonorEvents();
}

if (document.getElementById('ticketQrImg')) {
    loadTicketDetails();
}

if (document.getElementById('my-tickets-list')) {
    loadMyTickets();
}

if (document.getElementById('donorBloodType') || document.getElementById('upcomingEventsList')) {
    loadDonorStat();
    loadUpcomingEvents();
}

if (document.getElementById('historyTimeline')) {
    loadHealthRecord();
    loadMyHistory();
}

async function loadDonorStat() {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE}/api/donor/donor-stat`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const bloodTypeEl = document.getElementById('donorBloodType');
            const totalDonationEl = document.getElementById('donorTotalDonation');

            if (bloodTypeEl) {
                let bt = data.bloodType || '';
                if (bt === '0') bt = 'O'; // Handle potential typo in DB
                let rh = data.rhFactor || '';

                if (!bt) {
                    bloodTypeEl.textContent = '--';
                } else {
                    bloodTypeEl.textContent = `${bt}${rh}`;
                }
            }
            if (totalDonationEl) {
                totalDonationEl.textContent = data.totalTimeDonate || 0;
            }
        }
    } catch (e) {
        console.error("Lỗi khi tải donor stat:", e);
    }
}

async function loadUpcomingEvents() {
    const token = localStorage.getItem('access_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(`${API_BASE}/api/shared/event/list-event-coming`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            const container = document.getElementById('upcomingEventsList');
            if (!container) return;

            container.innerHTML = '';

            if (!data || data.length === 0) {
                container.innerHTML = '<div class="col-12 text-center text-muted">Không có sự kiện nào sắp tới.</div>';
                return;
            }

            const eventsToShow = data.slice(0, 3); // Display max 3 events on home page

            eventsToShow.forEach((e, index) => {
                const start = new Date(e.startDate);
                const end = new Date(e.endDate);
                const timeStr = `${start.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} • ${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

                const imgSrc = index % 2 === 0 ? "https://placehold.co/600x300/ffeeee/red?text=Hien+Mau+Nhan+Dao" : "https://placehold.co/600x300/eef2ff/blue?text=Trao+Giot+Hong";
                const badgeText = (e.status === 'DANG_DIEN_RA' || e.status === 'DANGMO' || e.status === 'DANG_MO') ? 'Đang mở' : 'Sắp diễn ra';
                const badgeClass = (e.status === 'DANG_DIEN_RA' || e.status === 'DANGMO' || e.status === 'DANG_MO') ? 'bg-success' : 'bg-danger';

                const cardHtml = `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="event-card bg-white h-100 position-relative shadow-sm rounded border-0">
                    <img src="${imgSrc}" class="card-img-top event-img" alt="Event" style="height: 160px; object-fit: cover; border-top-left-radius: 0.375rem; border-top-right-radius: 0.375rem;">
                    <div class="p-3">
                        <div class="badge ${badgeClass} mb-2">${badgeText}</div>
                        <h6 class="fw-bold text-truncate" title="${e.eventName}">${e.eventName}</h6>
                        <div class="d-flex align-items-center text-muted small mt-2">
                            <i class="ph-bold ph-calendar-blank me-1"></i>
                            <span>${timeStr}</span>
                        </div>
                        <div class="d-flex align-items-center text-muted small mt-1 mb-3">
                            <i class="ph-bold ph-map-pin me-1"></i>
                            <span class="text-truncate" title="${e.location}">${e.location || 'Đang cập nhật'}</span>
                        </div>
                        <a href="#"
                            onclick="handleRegistration(event, '${e.eventId}', '${e.eventName}', '${timeStr}')"
                            class="btn btn-outline-danger w-100 rounded-pill">Đăng ký ngay</a>
                    </div>
                </div>
            </div>`;
                container.insertAdjacentHTML('beforeend', cardHtml);
            });
        }
    } catch (error) {
        console.error("Lỗi khi fetch upcoming events:", error);
    }
}

async function loadMyTickets() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '../home/login.html';
        return;
    }

    let statusFilter = '';
    const filterEl = document.getElementById('ticketStatusFilter');
    if (filterEl) {
        statusFilter = filterEl.value;
    }
    const queryStr = statusFilter ? `?status=${statusFilter}` : '';

    try {
        const response = await fetch(`${API_BASE}/api/donor/registration/get-all-my-tickets${queryStr}`, {
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
                const regStatus = (ticket.registrationStatus || "").toUpperCase().replace(/[^A-Z]/g, "");
                const eventStatus = (ticket.status || "").toUpperCase().replace(/[^A-Z]/g, "");

                if (regStatus === 'DADANGKY') {
                    badgeHtml = '<span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 border border-primary">Đã đăng ký</span>';
                } else if (regStatus === 'DACHECKIN') {
                    badgeHtml = '<span class="badge bg-info bg-opacity-10 text-info rounded-pill px-3 border border-info">Đã check-in</span>';
                } else if (regStatus === 'DAKHAM') {
                    badgeHtml = '<span class="badge bg-warning bg-opacity-10 text-warning rounded-pill px-3 border border-warning">Đã khám</span>';
                } else if (regStatus === 'DALAYMAU') {
                    badgeHtml = '<span class="badge bg-success bg-opacity-10 text-success rounded-pill px-3 border border-success">Đã hiến máu</span>';
                } else if (regStatus === 'DAHUY') {
                    badgeHtml = '<span class="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 border border-danger">Đã hủy</span>';
                } else {
                    badgeHtml = `<span class="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3 border border-secondary">${ticket.registrationStatus || 'Không rõ'}</span>`;
                }

                let timeDisplay = '';
                if (ticket.startDate) {
                    const start = new Date(ticket.startDate);
                    let endStr = "";
                    if (ticket.endDate) {
                        const end = new Date(ticket.endDate);
                        endStr = ` - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
                    }
                    timeDisplay = `
                        <div class="d-flex align-items-center text-muted mb-2">
                            <i class="ph-bold ph-calendar-blank me-2 fs-5"></i>
                            <span class="fw-medium">${start.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                            <span class="mx-2">•</span>
                            <span>${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}${endStr}</span>
                        </div>
                    `;
                }

                // Khởi tạo ban đầu là RỖNG (Không hiện nút)
                let cancelBtnHtml = '';

                // Chỉ cho phép hủy nếu vé đang ở trạng thái Đã đăng ký
                if (regStatus === 'DADANGKY') {

                    // Lớp bảo vệ: Tìm đúng ID vé (nếu backend trả về tên là id thay vì registrationId thì vẫn lấy được)
                    // Nếu không có cả 2, gán tạm là null để tránh lỗi cú pháp dấu phẩy
                    const safeRegId = ticket.registrationId || ticket.id || null;

                    cancelBtnHtml = `
                        <button class="btn btn-outline-danger rounded-pill fw-bold px-4"
                            onclick="showCancelModal(${safeRegId}, '${ticket.eventName}')">
                            Hủy đăng ký
                        </button>
                    `;
                }

                const cardHtml = `
            <div class="col-12 col-md-6" id="ticket-card-${ticket.eventId}">
                <div class="card border-0 shadow-sm h-100 ${eventStatus === 'DADONG' || regStatus === 'DAHUY' ? 'opacity-75 bg-light' : ''}">
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
        window.location.href = '../home/login.html';
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
                    if (el.textContent.includes('Nguyễn Văn A')) el.textContent = d.fullName || d.name;
                });
            }
        } catch (e) { }

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
                    document.getElementById('ticketTimeVal').textContent = `${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
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

            // Cấu hình nút Hủy đăng ký trong trang chi tiết vé
            const cancelBtn = document.getElementById('cancelTicketBtn');
            if (cancelBtn) {
                if (data.status === 'DA_DANG_KY') {
                    cancelBtn.style.display = 'block';
                    
                    let safeRegId = data.registrationId || data.regisId || data.id || null;
                    if (!safeRegId) {
                        try {
                            const allTicketsRes = await fetch(`${API_BASE}/api/donor/registration/get-all-my-tickets`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (allTicketsRes.ok) {
                                const allTickets = await allTicketsRes.json();
                                const matchingTicket = allTickets.find(t => String(t.eventId) === String(eventId));
                                if (matchingTicket) {
                                    safeRegId = matchingTicket.registrationId || matchingTicket.id;
                                }
                            }
                        } catch (e) {
                            console.error("Lỗi khi tìm registrationId từ danh sách vé:", e);
                        }
                    }
                    
                    cancelBtn.onclick = () => showCancelModal(safeRegId, data.eventName);
                } else {
                    cancelBtn.style.display = 'none';
                }
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

async function loadDonorEvents() {
    const token = localStorage.getItem('access_token');
    // Mặc dù lấy list event có thể không cần token tùy cấu hình BE, nhưng ta cứ truyền hoặc bỏ qua nếu FE đã quen truyền.
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(`${API_BASE}/api/shared/event/list-event-coming`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            const container = document.getElementById('donor-events-list');
            container.innerHTML = '';

            if (data.length === 0) {
                container.innerHTML = '<div class="col-12 text-center py-5 text-muted">Hiện chưa có sự kiện nào.</div>';
                return;
            }

            // Chỉ hiển thị các sự kiện Đang mở hoặc Sắp tới nếu muốn, hoặc hiển thị hết. Ở đây sẽ hiển thị hết.
            data.forEach(e => {
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
                    buttonHtml = `<a href="#" onclick="handleRegistration(event, '${e.eventId}', '${e.eventName}', '${timeStr}')" class="btn btn-danger w-100 rounded-pill fw-bold mt-2">Đăng ký tham gia</a>`;
                } else if (s === 'SAPTOI') {
                    badgeHtml = '<span class="badge bg-warning text-dark position-absolute top-0 end-0 m-3">Sắp tới</span>';
                    buttonHtml = `<a href="#" onclick="handleRegistration(event, '${e.eventId}', '${e.eventName}', '${timeStr}')" class="btn btn-primary w-100 rounded-pill fw-bold mt-2" style="background-color: var(--primary-color); border: none;">Đăng ký tham gia</a>`;
                } else if (s === 'DADONG') {
                    badgeHtml = '<span class="badge bg-secondary position-absolute top-0 end-0 m-3">Đã đóng</span>';
                    buttonHtml = `<button class="btn btn-light w-100 rounded-pill fw-bold mt-2 text-muted" disabled>Đã kết thúc</button>`;
                    opacity = '0.7';
                } else {
                    badgeHtml = `<span class="badge bg-dark position-absolute top-0 end-0 m-3">${e.status}</span>`;
                    buttonHtml = `<button class="btn btn-light w-100 rounded-pill fw-bold mt-2 text-muted" disabled>Không khả dụng</button>`;
                    opacity = '0.5';
                }

                // Random placeholder image based on name
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
                                        <i class="ph-bold ph-map-pin me-2"></i> ${e.location}
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

        }
    } catch (error) {
        console.error("Lỗi khi fetch events:", error);
        document.getElementById('donor-events-list').innerHTML = '<div class="col-12 text-center py-5 text-danger">Không thể kết nối đến máy chủ sự kiện.</div>';
    }
}

async function loadProfile() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '../home/login.html';
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
                if (el.textContent.includes('Nguyễn Văn A')) el.textContent = data.fullName || data.name;
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
            window.location.href = '../home/login.html';
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
let registrationIdToCancel = null;

function showCancelModal(regId, eventName) {
    console.log("ID vé cần hủy:", regId); // Check log xem có undefined không

    registrationIdToCancel = regId;
    document.getElementById('cancelEventName').textContent = eventName;

    // SỬA Ở ĐÂY: Dùng getOrCreateInstance
    const modalEl = document.getElementById('cancelModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}

async function confirmCancellation() {
    if (!registrationIdToCancel) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
        showToast("Bạn cần đăng nhập để thao tác.", "warning");
        window.location.href = '../home/login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/donor/registration/discard-my-ticket/${registrationIdToCancel}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Đóng Modal an toàn
        const modalEl = document.getElementById('cancelModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
            modal.hide();
        }

        if (response.ok) {
            showToast("Hủy đăng ký thành công!", "success");
            const isTicketPage = window.location.pathname.includes('ticket.html');
            if (isTicketPage) {
                // Nếu ở trang chi tiết vé, quay về trang Vé Của Tôi sau 1.5s để cập nhật
                setTimeout(() => {
                    window.location.href = 'my_tickets.html';
                }, 1500);
            } else {
                loadMyTickets();
            }
        } else {
            const err = await response.text();
            showToast("Hủy đăng ký thất bại: " + err, "danger");
        }
    } catch (error) {
        console.error("Lỗi Fetch:", error);

        const modalEl = document.getElementById('cancelModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        showToast("Lỗi kết nối tới máy chủ", "danger");
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
window.logout = function () {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_info');
        window.location.href = '../home/login.html';
    }
}

// --- LỊCH SỬ HIẾN MÁU ---
async function loadHealthRecord() {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE}/api/donor/my-health-record`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const totalDonationEl = document.getElementById('totalDonationStat');
            const totalVolumeEl = document.getElementById('totalVolumeStat');
            
            // Lấy element hiển thị nhóm máu (badge màu đỏ trên UI)
            const bloodGroupEl = document.getElementById('bloodGroupBadge'); 

            if (totalDonationEl) totalDonationEl.textContent = data.totalDonation || 0;
            if (totalVolumeEl) {
                const volLiters = (data.totalVolumeMl || 0) / 1000;
                totalVolumeEl.textContent = volLiters + 'L';
            }

            // Xử lý hiển thị nhóm máu và Rh
            if (bloodGroupEl) {
                // Kiểm tra nếu có dữ liệu thì ghép lại (VD: "O" + "+" = "O+")
                if (data.bloodType && data.rhFactor) {
                    bloodGroupEl.textContent = `${data.bloodType}${data.rhFactor}`;
                } else {
                    // Nếu API trả về null như trong ảnh, hiển thị mặc định
                    bloodGroupEl.textContent = 'Chưa rõ nhóm máu'; 
                    // Hoặc bạn có thể ẩn luôn badge này bằng cách:
                    // bloodGroupEl.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error("Lỗi khi tải hồ sơ sức khỏe:", error);
    }
}

async function loadMyHistory() {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE}/api/donor/my-history`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            renderHistoryList(data.history || []);
        } else {
            document.getElementById('historyTimeline').innerHTML = '<p class="text-muted text-center mt-4">Không thể tải lịch sử hiến máu.</p>';
        }
    } catch (error) {
        console.error("Lỗi khi tải lịch sử:", error);
        document.getElementById('historyTimeline').innerHTML = '<p class="text-danger text-center mt-4">Lỗi kết nối đến máy chủ.</p>';
    }
}

function renderHistoryList(historyArray) {
    const container = document.getElementById('historyTimeline');
    if (!container) return;

    if (historyArray.length === 0) {
        container.innerHTML = '<p class="text-muted text-center mt-4">Bạn chưa có lịch sử hiến máu nào.</p>';
        return;
    }

    let html = '';
    historyArray.forEach((item, index) => {
        // Format date: yyyy-MM-ddTHH:mm:ss -> dd/MM/yyyy
        let dateStr = "N/A";
        if (item.donationDate) {
            const d = new Date(item.donationDate);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            dateStr = `${day}/${month}/${year}`;
        }

        const isMostRecent = index === 0;
        const dotClass = isMostRecent ? 'timeline-dot' : 'timeline-dot bg-secondary';

        // Cấu trúc accordion
        html += `
            <div class="timeline-item">
                <div class="${dotClass}"></div>
                <div class="card border shadow-sm rounded-4 mb-4">
                    <div class="card-header bg-white border-bottom-0 p-3 rounded-4" id="headingHistory${item.registrationId}">
                        <div class="d-flex justify-content-between align-items-center" style="cursor: pointer;" data-bs-toggle="collapse" data-bs-target="#collapseHistory${item.registrationId}" aria-expanded="false" aria-controls="collapseHistory${item.registrationId}" onclick="viewHistoryDetail(${item.registrationId})">
                            <div>
                                <h5 class="fw-bold mb-1">${dateStr}</h5>
                                <p class="mb-0 small text-secondary">${item.location || item.eventName || 'Không xác định'}</p>
                            </div>
                            <a href="javascript:void(0)" class="text-primary text-decoration-none small fw-medium d-flex align-items-center">
                                Xem chi tiết <i class="ph-bold ph-caret-down ms-1"></i>
                            </a>
                        </div>
                    </div>

                    <div id="collapseHistory${item.registrationId}" class="accordion-collapse collapse" aria-labelledby="headingHistory${item.registrationId}">
                        <div class="card-body pt-0">
                            <hr class="opacity-10 mt-0 mb-3">
                            <div id="historyDetailContent${item.registrationId}" class="text-center">
                                <span class="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></span> Đang tải...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

async function viewHistoryDetail(registrationId) {
    const detailContainer = document.getElementById(`historyDetailContent${registrationId}`);
    if (!detailContainer) return;

    // Check if already loaded to avoid redundant calls
    if (!detailContainer.innerHTML.includes('spinner-border')) {
        return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE}/api/donor/history-detail/${registrationId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();

            const volume = data.actualVolume || data.expectedVolume || '--';
            const weight = data.screeningInfo?.weight || '--';
            const bloodPressure = data.screeningInfo?.bloodPressure || '--';
            const heartRate = data.screeningInfo?.heartRate || '--';
            const hemoglobin = data.screeningInfo?.hemoglobin || '--';

            const hiv = data.testResultInfo?.hiv || '--';
            const hbv = data.testResultInfo?.hbv || '--';
            const hcv = data.testResultInfo?.hcv || '--';
            const syphilis = data.testResultInfo?.syphilis || '--';
            const malaria = data.testResultInfo?.malaria || '--';
            const conclusion = data.testResultInfo?.finalConclusion || '--';

            // Helper format test status
            const getTestStatus = (val) => {
                if (val === 'AM_TINH') return '<span class="small text-success fw-bold"><i class="ph-fill ph-check-circle me-1"></i>Âm tính</span>';
                if (val === 'DUONG_TINH') return '<span class="small text-danger fw-bold"><i class="ph-fill ph-warning-circle me-1"></i>Dương tính</span>';
                if (val === 'NGHI_NGO') return '<span class="small text-warning fw-bold"><i class="ph-fill ph-question me-1"></i>Nghi ngờ</span>';
                return `<span class="small text-muted">${val}</span>`;
            };
            
            const conclusionClass = (conclusion || '').toLowerCase().includes('an toàn') ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger';

            let resultHtml = `
                <!-- Khám sàng lọc -->
                <div class="d-flex flex-wrap text-center justify-content-between mb-2">
                    <div class="flex-fill border-end px-2 mb-3">
                        <i class="ph-fill ph-drop fs-4 text-danger mb-1" style="opacity: 0.8"></i>
                        <div class="small text-secondary mb-1">Lượng máu</div>
                        <div class="fw-bold fs-5">${volume} ml</div>
                    </div>
                    <div class="flex-fill border-end px-2 mb-3">
                        <i class="ph-fill ph-heartbeat fs-4 text-danger mb-1" style="opacity: 0.8"></i>
                        <div class="small text-secondary mb-1">Huyết áp</div>
                        <div class="fw-bold fs-5">${bloodPressure}</div>
                    </div>
                    <div class="flex-fill border-end px-2 mb-3">
                        <i class="ph-fill ph-scales fs-4 text-success mb-1" style="opacity: 0.8"></i>
                        <div class="small text-secondary mb-1">Cân nặng</div>
                        <div class="fw-bold fs-5">${weight} kg</div>
                    </div>
                    <div class="flex-fill border-end px-2 mb-3 d-none d-sm-block">
                        <i class="ph-fill ph-activity fs-4 text-warning mb-1" style="opacity: 0.8"></i>
                        <div class="small text-secondary mb-1">Nhịp tim</div>
                        <div class="fw-bold fs-5">${heartRate} bpm</div>
                    </div>
                    <div class="flex-fill px-2 mb-3 d-none d-sm-block">
                        <i class="ph-fill ph-flask fs-4 text-primary mb-1" style="opacity: 0.8"></i>
                        <div class="small text-secondary mb-1">Huyết sắc tố</div>
                        <div class="fw-bold fs-5">${hemoglobin} g/L</div>
                    </div>
                </div>

                <hr class="opacity-10 mt-0 mb-4">

                <!-- Kết quả xét nghiệm -->
                <div>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="mb-0 fw-bold text-dark d-flex align-items-center">
                            <i class="ph-fill ph-clipboard-text text-primary me-2 fs-5"></i> Kết quả xét nghiệm
                        </h6>
                        <span class="badge ${conclusionClass} rounded-pill px-3 py-2 border-0">${conclusion}</span>
                    </div>
                    
                    <div class="row g-x-4 g-y-3">
                        <div class="col-12 col-md-6">
                            <div class="d-flex justify-content-between align-items-center border-bottom pb-2">
                                <span class="small fw-medium text-secondary">HIV</span>
                                ${getTestStatus(hiv)}
                            </div>
                        </div>
                        <div class="col-12 col-md-6">
                            <div class="d-flex justify-content-between align-items-center border-bottom pb-2">
                                <span class="small fw-medium text-secondary">Viêm gan B (HBV)</span>
                                ${getTestStatus(hbv)}
                            </div>
                        </div>
                        <div class="col-12 col-md-6">
                            <div class="d-flex justify-content-between align-items-center border-bottom pb-2">
                                <span class="small fw-medium text-secondary">Viêm gan C (HCV)</span>
                                ${getTestStatus(hcv)}
                            </div>
                        </div>
                        <div class="col-12 col-md-6">
                            <div class="d-flex justify-content-between align-items-center border-bottom pb-2">
                                <span class="small fw-medium text-secondary">Giang mai</span>
                                ${getTestStatus(syphilis)}
                            </div>
                        </div>
                        <div class="col-12 col-md-6">
                            <div class="d-flex justify-content-between align-items-center border-bottom pb-2">
                                <span class="small fw-medium text-secondary">Sốt rét</span>
                                ${getTestStatus(malaria)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            detailContainer.innerHTML = resultHtml;
        } else {
            detailContainer.innerHTML = '<p class="text-danger small mb-0 text-center">Không thể tải thông tin chi tiết.</p>';
        }
    } catch (error) {
        console.error("Lỗi khi tải chi tiết lịch sử:", error);
        detailContainer.innerHTML = '<p class="text-danger small mb-0 text-center">Lỗi kết nối.</p>';
    }
}
