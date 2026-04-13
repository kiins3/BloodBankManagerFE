const API_DEPLOY = 'https://bloodbankmanager-production.up.railway.app';
const API_BASE = API_DEPLOY;

document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
    setupSmoothScroll();
    loadLandingEvents();
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
async function loadLandingEvents() {
    const container = document.getElementById('landing-events-list');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE}/api/shared/event/get-list-event`, {
            method: 'GET'
        });

        if (response.ok) {
            const result = await response.json();
            console.log('[Landing Events API] raw response:', JSON.stringify(result).substring(0, 500));
            
            // Hỗ trợ nhiều dạng response
            let data;
            if (Array.isArray(result)) {
                data = result;
            } else if (result.data && Array.isArray(result.data)) {
                data = result.data;
            } else if (result.content && Array.isArray(result.content)) {
                data = result.content;
            } else {
                const firstArray = Object.values(result).find(v => Array.isArray(v));
                data = firstArray || [];
            }
            
            console.log('[Landing Events API] parsed data length:', data ? data.length : 0);
            container.innerHTML = '';

            if (!data || !Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<div class="text-center py-5 w-100"><p class="text-muted">Hiện chưa có sự kiện nào.</p></div>';
                return;
            }

            // Hiển thị tối đa 4 sự kiện tiêu biểu ở trang chủ
            const displayData = data.slice(0, 4);

            displayData.forEach(event => {
                const start = new Date(event.startDate);
                const timeStr = `${start.toLocaleDateString('vi-VN')} • ${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
                const percent = Math.round(((event.currentAmount || 0) / event.targetAmount) * 100);
                
                let badgeText = 'Sắp diễn ra';
                let badgeStyle = '';
                const s = (event.status || "").toUpperCase();
                if (s === 'DANGMO' || s === 'DANGDIENRA') {
                    badgeText = 'Đang diễn ra';
                    badgeStyle = 'color: #059669; background: #ecfdf5;';
                } else if (s === 'SAPTOI') {
                    badgeText = 'Sắp tới';
                    badgeStyle = 'color: #0ea5e9; background: #e0f2fe;';
                }

                const imgText = encodeURIComponent(event.eventName.substring(0, 15));
                const imgSrc = `https://placehold.co/600x400/fee2e2/ef4444?text=${imgText}`;

                const cardHtml = `
                    <div class="event-card">
                        <div class="card-banner" style="background-image: url('${imgSrc}');">
                            <span class="card-badge" style="${badgeStyle}">${badgeText}</span>
                        </div>
                        <div class="card-body">
                            <h4 class="event-title">${event.eventName}</h4>
                            <div class="event-meta">
                                <div class="meta-item">
                                    <i class="ph-bold ph-calendar-blank"></i>
                                    <span>${timeStr}</span>
                                </div>
                                <div class="meta-item">
                                    <i class="ph-bold ph-map-pin"></i>
                                    <span>${event.location || 'Địa điểm đang cập nhật'}</span>
                                </div>
                            </div>
                            <div class="progress-container">
                                <div class="progress-info">
                                    <span>Mục tiêu: ${event.targetAmount} đơn vị</span>
                                    <span>${percent}%</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${percent}%;"></div>
                                </div>
                            </div>
                            <button class="btn btn-card" onclick="handleRegister('${event.eventId}')">
                                Đăng ký ngay
                            </button>
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', cardHtml);
            });
        }
    } catch (error) {
        console.error("Lỗi khi tải sự kiện mobile:", error);
    }
}

// 2. Register Logic
function handleRegister(eventId = null) {
    const token = localStorage.getItem('access_token');

    if (!token) {
        // Chưa đăng nhập -> Đi tới màn Login
        if (eventId) sessionStorage.setItem('redirect_event', eventId);
        window.location.href = 'login.html';
    } else {
        // Đã đăng nhập -> Đi tới danh sách sự kiện kèm id
        const targetUrl = eventId
            ? `donor_view/events.html?id=${eventId}`
            : `donor_view/events.html`;

        window.location.href = targetUrl;
    }
}

// 3. UI Interactions
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}
