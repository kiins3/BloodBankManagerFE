// Backend URL. Local dev talks to the API on localhost:8080;
// any other host (e.g. Vercel) uses the deployed API.
(function () {
    var DEPLOYED_API = 'https://bloodbank-api.onrender.com';
    var isLocal = ['localhost', '127.0.0.1', ''].indexOf(location.hostname) !== -1;
    window.API_BASE = isLocal ? 'http://localhost:8080' : DEPLOYED_API;
})();
