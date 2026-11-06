# Blood Bank Management System — Frontend

Web client for [BloodBankManager](https://github.com/kiins3/BloodBankManager), a blood donation and blood bank management system (Spring Boot API).

**HTML · CSS · vanilla JavaScript · Chart.js · SockJS/STOMP · html5-qrcode** — no build step, deployed on Vercel.

## Portals

| Role | Pages |
|---|---|
| Guest | Landing page with upcoming donation events, sign up, log in, forgot password (email OTP) |
| Donor | Events and registration, tickets with QR code, donation history, lab results, profile |
| Staff — technical | Reception (QR check-in, live queue over WebSocket), health screening, equipment |
| Staff — inventory | Blood bag inventory, distribution to hospitals (QR scan, live request alerts) |
| Hospital | Create blood requests, track request history, profile |
| Admin | Dashboard with charts, campaigns, donors, inventory, audit logs, staff/hospital accounts |

Login reads the role from the JWT and sends each user to their own portal.

## Run locally

1. Start the API: see [BloodBankManager → Run it locally](https://github.com/kiins3/BloodBankManager#run-it-locally) (`docker compose up -d`, API on `http://localhost:8080`).
2. Serve this folder on any static server, for example:
   ```bash
   python -m http.server 5500
   ```
3. Open http://localhost:5500 and log in with `admin@bloodbank.local` / `Admin@123`.

## Backend URL

[`config.js`](config.js) picks the API: `http://localhost:8080` on localhost, otherwise `DEPLOYED_API`. Change that one line after deploying the backend.

## Structure

```
index.html, login.html, register.html   public pages (landing.js, auth.js)
config.js                               backend URL
script.js, style.css                    shared layout, sidebar, charts
admin_view/  donor_view/  staff_view/  hospital_view/   one folder per portal
```

## Author

**Tran Hai Dang** — [GitHub](https://github.com/kiins3)
