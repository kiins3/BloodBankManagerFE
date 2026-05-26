document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
    setupSmoothScroll();
    fetchUpcomingEvents();
});

// 1. Auth Logic
function checkAuthState() {
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
        // Luôn hiển thị 2 nút Đăng nhập / Đăng ký ở trang chủ công khai
        authContainer.innerHTML = `
            <a href="login.html" class="btn btn-login">Đăng nhập</a>
            <a href="register.html" class="btn btn-register">Đăng ký</a>
        `;
    }
}

// 2. Fetch & Render Events
async function fetchUpcomingEvents() {
    const grid = document.getElementById('events-grid');
    try {
        const response = await fetch('http://localhost:8080/api/shared/event/list-event-coming');
        if (!response.ok) throw new Error('Failed to fetch events');

        const events = await response.json();

        if (!events || events.length === 0) {
            grid.innerHTML = '<div class="loading-state">Hiện chưa có sự kiện nào sắp diễn ra.</div>';
            return;
        }

        grid.innerHTML = events.slice(0, 6).map(event => renderEventCard(event)).join('');
    } catch (error) {
        console.error('Error fetching events:', error);
        grid.innerHTML = '<div class="loading-state text-danger">Không thể tải dữ liệu sự kiện. Vui lòng thử lại sau.</div>';
    }
}

function renderEventCard(event) {
    const currentAmt = event.currentAmount || 0;
    const targetAmt = event.targetAmount || 100;
    const progress = Math.min(Math.round((currentAmt / targetAmt) * 100), 100) || 0;
    const bannerUrl = event.banner || `https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&q=80`;

    const statusText = (event.status === 'SAP_TOI' || event.status === 'SAPTOI') ? 'Sắp diễn ra' : 'Đang diễn ra';

    return `
        <div class="event-card">
            <div class="card-banner" style="background-image: url('${bannerUrl}');">
                <span class="card-badge">${statusText}</span>
            </div>
            <div class="card-body">
                <h4 class="event-title">${event.eventName || '--'}</h4>

                <div class="event-meta">
                    <div class="meta-item">
                        <i class="ph-bold ph-calendar-blank"></i>
                        <span>${new Date(event.startDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div class="meta-item">
                        <i class="ph-bold ph-map-pin"></i>
                        <span>${event.location || '--'}</span>
                    </div>
                </div>

                <div class="progress-container">
                    <div class="progress-info">
                        <span>Đã đạt: ${currentAmt} đơn vị</span>
                        <span>${progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%;"></div>
                    </div>
                </div>

                <button class="btn btn-card" onclick="handleRegister('${event.eventId}')">
                    Đăng ký ngay
                </button>
            </div>
        </div>
    `;
}

// 3. Register Logic
function handleRegister(eventId = null) {
    const token = localStorage.getItem('access_token');

    if (!token) {
        // Chưa đăng nhập -> Đi tới màn Login
        if (eventId) sessionStorage.setItem('redirect_event', eventId);
        window.location.href = 'login.html';
    } else {
        // Đã đăng nhập -> Đi tới danh sách sự kiện kèm id
        const targetUrl = eventId
            ? `../donor_view/events.html?id=${eventId}`
            : `../donor_view/events.html`;

        window.location.href = targetUrl;
    }
}

// 4. UI Interactions
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

