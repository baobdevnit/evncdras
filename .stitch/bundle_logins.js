const fs = require('fs');
const path = require('path');

const templatesDir = path.resolve(__dirname, '../templates');
const outDir = __dirname;

// Read logo EVN and convert to data URI
const logoSvg = fs.readFileSync(path.join(templatesDir, 'logo_evn.svg'), 'utf-8');
const logoB64 = Buffer.from(logoSvg).toString('base64');
const logoDataUri = 'data:image/svg+xml;base64,' + logoB64;

// 1. Process login.html
let loginHtml = fs.readFileSync(path.join(templatesDir, 'login.html'), 'utf-8');
const loginCss = fs.readFileSync(path.join(templatesDir, 'login.css'), 'utf-8');

loginHtml = loginHtml.replace('<link rel="stylesheet" href="login.css">', '<style>\n' + loginCss + '\n</style>');
loginHtml = loginHtml.replace('src="logo_evn.svg"', 'src="' + logoDataUri + '"');

const loginScript = `
<script>
document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        const themeText = themeToggleBtn.querySelector('.theme-text');
        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                if (themeText) themeText.textContent = 'Giao diện tối';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                if (themeText) themeText.textContent = 'Giao diện sáng';
            }
        });
    }

    // Toggle password
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPw = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPw ? 'text' : 'password');
        });
    }

    // Demo fill
    const fillDemoBtn = document.getElementById('fillDemoBtn');
    const emailInput = document.getElementById('email');
    if (fillDemoBtn && emailInput && passwordInput) {
        fillDemoBtn.addEventListener('click', () => {
            emailInput.value = 'cdr.evnit@evn.com.vn';
            passwordInput.value = '1234567890';
        });
    }
});
</script>
`;

loginHtml = loginHtml.replace('<script src="main.js"></script>', '');
loginHtml = loginHtml.replace('<script src="login.js"></script>', loginScript);

const loginOutPath = path.join(outDir, 'login.html');
fs.writeFileSync(loginOutPath, loginHtml, 'utf-8');
console.log('Created:', loginOutPath, 'Size:', fs.statSync(loginOutPath).size, 'bytes');

// 2. Process login_admin.html
let adminHtml = fs.readFileSync(path.join(templatesDir, 'login_admin.html'), 'utf-8');
const adminCss = fs.readFileSync(path.join(templatesDir, 'login_admin.css'), 'utf-8');

adminHtml = adminHtml.replace('<link rel="stylesheet" href="login_admin.css">', '<style>\n' + adminCss + '\n</style>');
adminHtml = adminHtml.replace('src="logo_evn.svg"', 'src="' + logoDataUri + '"');

const adminScript = `
<script>
document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        const themeText = themeToggleBtn.querySelector('.theme-text');
        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                if (themeText) themeText.textContent = 'Giao diện tối';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                if (themeText) themeText.textContent = 'Giao diện sáng';
            }
        });
    }

    // Toggle password
    const toggleAdminPasswordBtn = document.getElementById('toggleAdminPassword');
    const adminPasswordInput = document.getElementById('adminPassword');
    if (toggleAdminPasswordBtn && adminPasswordInput) {
        toggleAdminPasswordBtn.addEventListener('click', () => {
            const isPw = adminPasswordInput.getAttribute('type') === 'password';
            adminPasswordInput.setAttribute('type', isPw ? 'text' : 'password');
        });
    }
});
</script>
`;

adminHtml = adminHtml.replace('<script src="main.js"></script>', '');
adminHtml = adminHtml.replace('<script src="login_admin.js"></script>', adminScript);

const adminOutPath = path.join(outDir, 'login_admin.html');
fs.writeFileSync(adminOutPath, adminHtml, 'utf-8');
console.log('Created:', adminOutPath, 'Size:', fs.statSync(adminOutPath).size, 'bytes');
