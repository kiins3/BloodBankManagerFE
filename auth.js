const API_DEPLOY = 'https://bloodbankmanager-production.up.railway.app';
const API_BASE = API_DEPLOY;
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupPasswordToggle();
    setupForms();
    setupForgotView();
});

// 1. Password Toggle Logic
function setupPasswordToggle() {
    const toggles = document.querySelectorAll('.toggle-password');

    toggles.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const input = btn.previousElementSibling; // Assuming input is just before the button in common parent
            // Or better find input within the wrapper
            const wrapper = btn.closest('.input-wrapper');
            const passwordInput = wrapper.querySelector('input');
            const icon = btn.querySelector('i');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('ph-eye');
                icon.classList.add('ph-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('ph-eye-slash');
                icon.classList.add('ph-eye');
            }
        });
    });
}

// 2. Mock Form Submission
function setupForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotForm = document.getElementById('forgotForm');

    if (loginForm) {
    loginForm.addEventListener('submit', async (e) => { // Thêm chữ async
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (email && password) {
            const btn = loginForm.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = 'Đang xử lý...';
            btn.disabled = true;

            try {
                const response = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: password })
                });

                if (response.ok) {
                    const result = await response.json();
                    // BE trả về tên trường là accessToken chứ không phải token
                    localStorage.setItem('access_token', result.accessToken); 
                    localStorage.setItem('user_info', JSON.stringify(result.user || {}));

                    // Phân tích Role từ Token hoặc data user
                    const payload = parseJwt(result.accessToken);
                    
                    // Lấy role từ payload, hoặc từ object user do BE trả về
                    const rawRole = (payload && payload.role) || (result.user && result.user.role) || result.role;
                    
                    let defaultUrl = 'donor_view/home.html'; // Fallback an toàn
                    
                    if (rawRole) {
                        const role = rawRole.toUpperCase();
                        // Lưu role vào localStorage để sidebar đọc
                        localStorage.setItem('user_role', role);

                        if (role === 'ADMIN') {
                            defaultUrl = 'admin_view/admin_home.html';
                        } else if (role === 'DONOR') {
                            defaultUrl = 'donor_view/home.html';
                        } else if (role === 'HOSPITAL') {
                            defaultUrl = 'hospital_view/dashboard.html';
                        } else if (role === 'STAFF_TECH' || role === 'STAFF_INVENTORY') {
                            // Cả 2 role staff đều về chung dashboard
                            defaultUrl = 'staff_view/dashboard.html';
                        } else if (role === 'STAFF') {
                            // Legacy fallback
                            defaultUrl = 'staff_view/dashboard.html';
                        }
                    }

                    const returnUrl = sessionStorage.getItem('redirect_event')
                        ? 'donor_view/events.html?id=' + sessionStorage.getItem('redirect_event')
                        : defaultUrl;

                    sessionStorage.removeItem('redirect_event');
                    window.location.href = returnUrl;
                } else {
                    let errorMessage = 'Lỗi hệ thống: ';
                    try {
                        const errorResult = await response.json();
                        errorMessage = 'Đăng nhập thất bại: ' + (errorResult.message || 'Sai thông tin');
                    } catch (e) {
                        if (response.status === 403) errorMessage = 'bị từ chối truy cập (403 lỗi dòng bảo vệ)';
                        else errorMessage += response.statusText;
                    }
                    alert(errorMessage);
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Không thể kết nối tới máy chủ!');
                btn.innerText = originalText;
                btn.disabled = false;
            }
        }
    });
}


    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const cccd = document.getElementById('cccd').value;

            const btn = registerForm.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = 'Đang đăng ký...';
            btn.disabled = true;

            try {
                const response = await fetch(`${API_BASE}/auth/sign-up`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        cccd: cccd,
                        name: name,
                        phone: phone
                    })
                });

                if (response.ok) {
                    alert('Đăng ký thành công! Mật khẩu mặc định của bạn là 123456. Vui lòng đăng nhập.');
                    window.location.href = 'login.html';
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    alert('Đăng ký thất bại: ' + (errorData.message || 'Lỗi hệ thống'));
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            } catch (error) {
                console.error('Register error:', error);
                alert('Không thể kết nối đến máy chủ!');
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }

    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('forgot-email').value;
            const btn = forgotForm.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = 'Đang gửi mã...';
            btn.disabled = true;

            try {
                // Gửi trực tiếp chuỗi email vì BE dùng @RequestBody String
                const response = await fetch(`${API_BASE}/auth/generate-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' }, // Sử dụng text/plain thay vì application/json
                    body: email
                });

                if (response.ok) {
                    alert('Đã gửi mã xác nhận tới email của bạn!');
                    // Lưu email lại để dùng cho bước verify
                    localStorage.setItem('reset_email', email);
                    
                    // Chuyển sang view nhập OTP
                    document.getElementById('forgot-view').style.display = 'none';
                    document.getElementById('reset-view').style.display = 'block';
                } else {
                    const error = await response.text();
                    alert('Lỗi: ' + error);
                }
            } catch (error) {
                console.error('OTP Generate error:', error);
                alert('Không thể kết nối tới máy chủ!');
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }

    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = localStorage.getItem('reset_email');
            const otp = document.getElementById('reset-otp').value;
            const newPassword = document.getElementById('reset-new-password').value;
            const confirmPassword = document.getElementById('reset-confirm-password').value;

            if (newPassword !== confirmPassword) {
                alert('Mật khẩu xác nhận không khớp!');
                return;
            }

            const btn = resetPasswordForm.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = 'Đang đặt lại...';
            btn.disabled = true;

            try {
                const response = await fetch(`${API_BASE}/auth/verify-otp-and-change-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: email,
                        otp: otp,
                        newPassword: newPassword
                    })
                });

                if (response.ok) {
                    alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
                    localStorage.removeItem('reset_email');
                    resetPasswordForm.reset();
                    // Quay lại trang đăng nhập
                    document.getElementById('reset-view').style.display = 'none';
                    document.getElementById('login-view').style.display = 'block';
                } else {
                    const error = await response.text();
                    alert('Lỗi: ' + error);
                }
            } catch (error) {
                console.error('OTP Verify error:', error);
                alert('Không thể kết nối tới máy chủ!');
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }
}

// 3. View Switcher
function setupForgotView() {
    const loginView = document.getElementById('login-view');
    const forgotView = document.getElementById('forgot-view');
    const resetView = document.getElementById('reset-view');
    
    const forgotLink = document.getElementById('forgotLink');
    const backLink = document.getElementById('backToLogin');
    const backToForgot = document.getElementById('backToForgot');

    if (loginView && forgotView && forgotLink && backLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginView.style.display = 'none';
            forgotView.style.display = 'block';
        });

        backLink.addEventListener('click', (e) => {
            e.preventDefault();
            forgotView.style.display = 'none';
            loginView.style.display = 'block';
        });

        if (backToForgot) {
            backToForgot.addEventListener('click', (e) => {
                e.preventDefault();
                resetView.style.display = 'none';
                forgotView.style.display = 'block';
            });
        }
    }
}

