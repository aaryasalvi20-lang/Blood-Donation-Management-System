// Base URL for API
const API_URL = 'http://localhost:5000/api';

// --- Theme Management ---
const themeToggleBtn = document.getElementById('theme-toggle');
const darkIcon = document.getElementById('moon-icon');
const lightIcon = document.getElementById('sun-icon');

function updateThemeIcons() {
    if(!themeToggleBtn) return;
    if (document.documentElement.classList.contains('dark')) {
        darkIcon.classList.add('hidden');
        lightIcon.classList.remove('hidden');
    } else {
        lightIcon.classList.add('hidden');
        darkIcon.classList.remove('hidden');
    }
}

// Check for saved theme preference or system preference
if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}
updateThemeIcons();

if(themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function() {
        if (localStorage.getItem('color-theme')) {
            if (localStorage.getItem('color-theme') === 'light') {
                document.documentElement.classList.add('dark');
                localStorage.setItem('color-theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('color-theme', 'light');
            }
        } else {
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('color-theme', 'light');
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('color-theme', 'dark');
            }
        }
        updateThemeIcons();
    });
}

// --- Auth Utilities ---
function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function loginSuccess(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({id: data.id, name: data.name, role: data.role}));
    window.location.href = `${data.role}-dashboard.html`;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`Fetching: ${API_URL}${endpoint}`, options);
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });
    
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
    } else {
        const text = await response.text();
        throw new Error(text || `Request failed with status ${response.status}`);
    }

    if (!response.ok) {
        if (response.status === 401) {
            logout();
        }
        throw new Error(data.message || 'Something went wrong');
    }
    return data;
}

// Basic Setup for Pages that require Auth
function checkAuth() {
    const user = getUser();
    const path = window.location.pathname;
    
    // Pages that don't need auth
    const publicPages = ['login.html', 'register.html', 'index.html', '/'];
    const isPublic = publicPages.some(p => path.includes(p) || path === '/');

    if (!user && !isPublic) {
        window.location.href = 'login.html';
    }

    // Role-specific protection
    if (user) {
        if (path.includes('donor-dashboard.html') && user.role !== 'donor') {
            window.location.href = 'hospital-dashboard.html';
        }
        if (path.includes('hospital-dashboard.html') && user.role !== 'hospital') {
            window.location.href = 'donor-dashboard.html';
        }
    }

    return user;
}

document.addEventListener('DOMContentLoaded', () => {
    const user = checkAuth();
    
    // Wire up generic logout buttons
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Populate generic UI based on user role
    if (user) {
        // Update user name and initials
        const userNameDisplays = document.querySelectorAll('.user-name-display');
        userNameDisplays.forEach(el => el.textContent = user.name);
        if (user.name) {
            const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            document.querySelectorAll('.user-init').forEach(el => el.textContent = initials);
        }

        // Sidebar dynamic injection if requested
        const sidebarNav = document.getElementById('sidebar-nav');
        if (sidebarNav) {
            renderSidebar(sidebarNav, user);
        }

        // Fallback for hardcoded sidebars with data-role-only
        const roleElements = document.querySelectorAll('[data-role-only]');
        roleElements.forEach(el => {
            if (el.getAttribute('data-role-only') !== user.role) {
                el.remove();
            } else {
                el.classList.remove('hidden');
            }
        });

        // Update generic dashboard links
        const dashboardLinks = document.querySelectorAll('a[href="dashboard.html"]');
        dashboardLinks.forEach(link => {
            link.href = `${user.role}-dashboard.html`;
        });
    }
});

function renderSidebar(container, user) {
    const isDonor = user.role === 'donor';
    const navItems = [
        { name: 'Dashboard', icon: 'fas fa-home', href: `${user.role}-dashboard.html` },
        { name: 'Donors Directory', icon: 'fas fa-users', href: 'donors.html', role: 'hospital' },
        { name: 'Our Requests', icon: 'fas fa-hand-holding-medical', href: 'requests.html', role: 'donor' },
        { name: 'Manage Requests', icon: 'fas fa-tasks', href: 'requests.html', role: 'hospital' },
        { name: 'Notifications', icon: 'fas fa-bell', href: 'notifications.html' },
        { name: 'Profile Settings', icon: 'fas fa-user-cog', href: 'profile.html' }
    ];

    container.innerHTML = navItems
        .filter(item => !item.role || item.role === user.role)
        .map(item => `
            <a href="${item.href}" class="group flex items-center px-3 py-2 text-base font-medium rounded-md transition ${window.location.pathname.includes(item.href) ? 'bg-red-50 text-primary dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'}">
                <i class="${item.icon} w-6 text-center mr-3"></i> ${item.name}
            </a>
        `).join('');
}
