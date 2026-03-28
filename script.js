/**
 * Enterprise Intern Portal - Logic Engine
 * Implements local persistence, dark mode toggling, modal operations, and core routing.
 */

const App = {
    state: {
        user: null,
        tasks: [],
        files: [],
        darkMode: false,
        notificationsUnread: 2
    },

    init() {
        this.loadSettings();
        this.loadData();
        this.bindEvents();
        this.setupCurrentPage();
    },

    loadSettings() {
        const storedTheme = localStorage.getItem('nexusTheme');
        if (storedTheme === 'dark') {
            this.state.darkMode = true;
            document.documentElement.classList.add('dark-theme');
        } else {
            document.documentElement.classList.remove('dark-theme');
        }
    },

    loadData() {
        const storedUser = localStorage.getItem('nexusUser');
        if (storedUser) this.state.user = JSON.parse(storedUser);

        const storedTasks = localStorage.getItem('nexusTasks');
        if (storedTasks) {
            this.state.tasks = JSON.parse(storedTasks);
        } else {
            this.state.tasks = [
                { id: 'T-1004', title: 'Q3 Financial Audit Script', category: 'Engineering', date: '2026-03-20', status: 'Approved', desc: 'Wrote python scripts to automate standard data sanitization.' },
                { id: 'T-1005', title: 'User Onboarding Flow UX', category: 'Design', date: '2026-03-24', status: 'Pending', desc: 'Figma prototypes incorporating stakeholder requests.' },
                { id: 'T-1006', title: 'API Security Patch', category: 'Engineering', date: '2026-03-28', status: 'Rejected', desc: 'Failed basic CI/CD pipelining test. Needs unit test coverage.' }
            ];
            this.saveData();
        }
    },

    saveData() {
        localStorage.setItem('nexusTasks', JSON.stringify(this.state.tasks));
        if (this.state.user) localStorage.setItem('nexusUser', JSON.stringify(this.state.user));
    },

    bindEvents() {
        // Theme Toggle
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) themeBtn.addEventListener('click', () => this.toggleTheme());

        // Notifications
        const notifBtn = document.getElementById('notif-toggle');
        const notifPanel = document.getElementById('notif-panel');
        if (notifBtn && notifPanel) {
            notifBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notifPanel.classList.toggle('hidden');
                document.querySelector('.notif-badge').classList.add('hidden'); // mark read visually
            });
            document.addEventListener('click', (e) => {
                if(!notifPanel.contains(e.target)) notifPanel.classList.add('hidden');
            });
        }

        // Generic Pass Toggles
        document.querySelectorAll('.pwd-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => this.togglePwd(e));
        });

        // Form bindings
        const loginForm = document.getElementById('login-form');
        if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        const regForm = document.getElementById('register-form');
        const regPwd = document.getElementById('reg-password');
        if (regForm) regForm.addEventListener('submit', (e) => this.handleRegister(e));
        if (regPwd) regPwd.addEventListener('input', (e) => this.checkPwd(e.target.value));

        const submitForm = document.getElementById('submission-form');
        if (submitForm) this.bindSubmissionEvents(submitForm);

        const profileForm = document.getElementById('profile-form');
        if (profileForm) profileForm.addEventListener('submit', (e) => this.handleProfileSave(e));

        // Filters in Submissions
        const searchInput = document.getElementById('search-tasks');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.renderSubmissionsTable());
            document.getElementById('status-filter').addEventListener('change', () => this.renderSubmissionsTable());
        }
    },

    setupCurrentPage() {
        const isAuthPage = document.body.classList.contains('auth-layout');
        
        if (!isAuthPage) {
            if (!this.state.user) {
                window.location.href = 'index.html';
                return;
            }
            
            // Populate user data across header
            const initials = this.state.user.fname.charAt(0) + this.state.user.lname.charAt(0);
            document.querySelectorAll('.display-name').forEach(el => el.textContent = `${this.state.user.fname} ${this.state.user.lname}`);
            document.querySelectorAll('#header-avatar, #profile-avatar').forEach(el => el.textContent = initials.toUpperCase());

            // Route handler
            const path = window.location.pathname;
            if (path.includes('dashboard') || path.endsWith('/') || path.endsWith('final\\') || path.endsWith('final/')) {
                this.renderDashboard();
            } else if (path.includes('submissions')) {
                this.renderSubmissionsTable();
            } else if (path.includes('profile')) {
                this.loadProfileData();
            }
        } else if (isAuthPage && this.state.user) {
            window.location.href = 'dashboard.html';
        }
    },

    // --- Dark Mode ---
    toggleTheme() {
        this.state.darkMode = !this.state.darkMode;
        if(this.state.darkMode) {
            document.documentElement.classList.add('dark-theme');
            localStorage.setItem('nexusTheme', 'dark');
        } else {
            document.documentElement.classList.remove('dark-theme');
            localStorage.setItem('nexusTheme', 'light');
        }
    },

    // --- Auth Logics ---
    togglePwd(e) {
        const icon = e.currentTarget.querySelector('i');
        const input = e.currentTarget.previousElementSibling;
        if(input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    },

    checkPwd(val) {
        const fill = document.getElementById('pwd-fill');
        if(!val) { fill.style.width = '0'; return; }
        let score = val.length > 7 ? 50 : val.length * 6;
        if(val.match(/[A-Z]/)) score += 20;
        if(val.match(/[0-9]/)) score += 30;
        fill.style.width = Math.min(score, 100) + '%';
        fill.style.background = score > 80 ? 'var(--success)' : (score > 50 ? 'var(--warning)' : 'var(--danger)');
    },

    async handleLogin(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        this.setLoading(btn, true);
        await this.delay(600);
        
        // Mock user object
        this.state.user = { fname: 'User', lname: 'Account', email: document.getElementById('login-email').value, phone: '', bio: '' };
        this.saveData();
        window.location.href = 'dashboard.html';
    },

    async handleRegister(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        this.setLoading(btn, true);
        await this.delay(800);
        
        this.state.user = { 
            fname: document.getElementById('reg-fname').value, 
            lname: document.getElementById('reg-lname').value, 
            email: document.getElementById('reg-email').value,
            phone: '', bio: ''
        };
        this.saveData();
        window.location.href = 'dashboard.html';
    },

    logout() {
        localStorage.removeItem('nexusUser');
        window.location.href = 'index.html';
    },

    // --- Dashboard logic ---
    renderDashboard() {
        if (!document.getElementById('stat-total')) return;
        
        document.getElementById('welcome-text').textContent = `Metrics for ${this.state.user.fname}'s Sprint`;

        document.getElementById('stat-total').textContent = this.state.tasks.length;
        document.getElementById('stat-pending').textContent = this.state.tasks.filter(t => t.status === 'Pending').length;
        document.getElementById('stat-approved').textContent = this.state.tasks.filter(t => t.status === 'Approved').length;
        document.getElementById('stat-rejected').textContent = this.state.tasks.filter(t => t.status === 'Rejected').length;

        const list = document.getElementById('recent-list');
        const recent = [...this.state.tasks].reverse().slice(0, 4);
        list.innerHTML = '';
        if (recent.length === 0) {
            list.innerHTML = '<p class="feed-item" style="color:var(--text-muted)">No data logged.</p>';
            return;
        }

        recent.forEach(task => {
            let color = task.status === 'Approved' ? 'success' : task.status === 'Rejected' ? 'danger' : 'warning';
            list.insertAdjacentHTML('beforeend', `
                <div class="feed-item">
                    <div class="feed-info">
                        <div>${task.title}</div>
                        <p><i class="fa-regular fa-calendar" style="margin-right:4px"></i> ${task.date} &nbsp;|&nbsp; <i class="fa-solid fa-tag" style="margin-right:4px"></i> ${task.category}</p>
                    </div>
                    <div class="feed-status">
                        <span class="m-badge" style="color: var(--${color})">${task.status}</span>
                    </div>
                </div>
            `);
        });
    },

    // --- Profile logic ---
    loadProfileData() {
        document.getElementById('prof-name').value = `${this.state.user.fname} ${this.state.user.lname}`;
        document.getElementById('prof-email').value = this.state.user.email;
        document.getElementById('prof-phone').value = this.state.user.phone || '';
        document.getElementById('prof-bio').value = this.state.user.bio || '';
    },

    async handleProfileSave(e) {
        e.preventDefault();
        const btn = document.getElementById('save-profile-btn');
        this.setLoading(btn, true);
        await this.delay(500);

        const fullName = document.getElementById('prof-name').value.trim().split(' ');
        this.state.user.fname = fullName[0] || '';
        this.state.user.lname = fullName.slice(1).join(' ') || '';
        this.state.user.phone = document.getElementById('prof-phone').value;
        this.state.user.bio = document.getElementById('prof-bio').value;

        this.saveData();
        this.setupCurrentPage(); // Re-render headers
        this.setLoading(btn, false);
        this.showToast('Profile parameters updated.', 'success');
    },

    // --- Task Submission ---
    bindSubmissionEvents(form) {
        form.addEventListener('submit', (e) => this.handleTaskSubmit(e));
        
        const drop = document.getElementById('file-drop');
        const input = document.getElementById('file-input');

        ['dragover', 'dragleave'].forEach(evt => drop.addEventListener(evt, (e) => { e.preventDefault(); if(evt==='dragover') drop.style.borderColor='var(--primary)'; else drop.style.borderColor='var(--text-muted)'; }));
        drop.addEventListener('drop', (e) => {
            e.preventDefault();
            drop.style.borderColor='var(--text-muted)';
            this.handleFiles(e.dataTransfer.files);
        });
        input.addEventListener('change', (e) => this.handleFiles(e.target.files));
    },

    handleFiles(files) {
        Array.from(files).forEach(f => { if(f.size < 50000000) this.state.files.push(f); });
        this.renderFiles();
    },

    renderFiles() {
        const list = document.getElementById('file-list');
        list.innerHTML = '';
        this.state.files.forEach((f, i) => {
            list.insertAdjacentHTML('beforeend', `
                <div class="upload-item">
                    <span><i class="fa-solid fa-file-lines" style="color:var(--text-muted); margin-right:8px;"></i> ${f.name}</span>
                    <button type="button" onclick="App.removeFile(${i})"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `);
        });
    },

    removeFile(idx) { this.state.files.splice(idx, 1); this.renderFiles(); },
    clearFiles() { this.state.files = []; this.renderFiles(); },

    async handleTaskSubmit(e) {
        e.preventDefault();
        const btn = document.getElementById('submit-btn-action');
        this.setLoading(btn, true);
        await this.delay(800);
        
        const title = document.getElementById('task-title').value;
        const category = document.getElementById('task-category').value;
        const date = document.getElementById('task-date').value;
        const desc = document.getElementById('task-desc').value;

        // Generate ID T-100X
        const newIdNum = this.state.tasks.length > 0 ? parseInt(this.state.tasks[this.state.tasks.length-1].id.split('-')[1]) + 1 : 1000;

        this.state.tasks.push({ id: `T-${newIdNum}`, title, category, date, desc, status: 'Pending' });
        this.saveData();

        this.showToast('Deliverable injected successfully.', 'success');
        setTimeout(() => window.location.href = 'submissions.html', 1000);
    },

    // --- Submissions Table & Modal ---
    renderSubmissionsTable() {
        const tbody = document.getElementById('tasks-table-body');
        const empty = document.getElementById('table-empty');
        if(!tbody) return;

        const sVal = document.getElementById('search-tasks').value.toLowerCase();
        const fVal = document.getElementById('status-filter').value;
        
        const filtered = this.state.tasks.filter(t => {
            const mS = t.title.toLowerCase().includes(sVal) || t.id.toLowerCase().includes(sVal);
            const mF = fVal === 'all' || t.status === fVal;
            return mS && mF;
        }).reverse();
        
        tbody.innerHTML = '';
        if(filtered.length === 0) {
            empty.classList.remove('hidden');
        } else {
            empty.classList.add('hidden');
            filtered.forEach(t => {
                let color = t.status === 'Approved' ? 'success' : t.status === 'Rejected' ? 'danger' : 'warning';
                tbody.insertAdjacentHTML('beforeend', `
                    <tr>
                        <td style="font-weight:600; font-family:monospace; color:var(--text-muted)">${t.id}</td>
                        <td><div class="td-main">${t.title}</div><div class="td-sub">${t.desc}</div></td>
                        <td>${t.category}</td>
                        <td>${t.date}</td>
                        <td><span class="m-badge" style="color: var(--${color})">${t.status}</span></td>
                        <td><button class="btn btn-secondary" onclick="App.openModal('${t.id}')">View Details</button></td>
                    </tr>
                `);
            });
        }
    },

    openModal(taskId) {
        const t = this.state.tasks.find(x => x.id === taskId);
        if(!t) return;
        
        document.getElementById('modal-title').textContent = `${t.id}: ${t.title}`;
        document.getElementById('modal-category').innerHTML = `<i class="fa-solid fa-tag"></i> ${t.category}`;
        document.getElementById('modal-date').innerHTML = `<i class="fa-regular fa-calendar"></i> ${t.date}`;
        
        let color = t.status === 'Approved' ? 'success' : t.status === 'Rejected' ? 'danger' : 'warning';
        const badge = document.getElementById('modal-status');
        badge.textContent = t.status;
        badge.style.color = `var(--${color})`;
        
        document.getElementById('modal-desc').textContent = t.desc;
        document.getElementById('task-modal').classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('task-modal').classList.add('hidden');
    },

    // --- Utils ---
    delay(ms) { return new Promise(r => setTimeout(r, ms)); },
    setLoading(btn, isL) {
        const t = btn.querySelector('.btn-text'), l = btn.querySelector('.loader');
        if(isL) { btn.disabled=true; t.classList.add('hidden'); l.classList.remove('hidden'); }
        else { btn.disabled=false; t.classList.remove('hidden'); l.classList.add('hidden'); }
    },
    showToast(msg, type) {
        const c = document.getElementById('toast-container');
        if(!c) return;
        const div = document.createElement('div');
        div.className = `toast ${type}`;
        const icon = type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation';
        div.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${msg}</span>`;
        c.appendChild(div);
        setTimeout(() => div.classList.add('show'), 10);
        setTimeout(() => { div.classList.remove('show'); setTimeout(()=>div.remove(), 300); }, 3000);
    }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
