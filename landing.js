document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
    setupSmoothScroll();
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
            ? `../donor_view/events.html?id=${eventId}`
            : `../donor_view/events.html`;

        window.location.href = targetUrl;
    }
}

// 3. UI Interactions
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
}
