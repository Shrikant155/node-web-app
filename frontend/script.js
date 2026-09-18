const API_URL = 'http://localhost:5000/api';

const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const welcomeUser = document.getElementById('welcomeUser');
const logoutBtn = document.getElementById('logoutBtn');

const tableBody = document.getElementById('tableBody');
const profileModal = document.getElementById('profileModal');
const openAddModalBtn = document.getElementById('openAddModal');
const closeModalBtn = document.getElementById('closeModal');
const cancelModalBtn = document.getElementById('cancelModal');
const profileForm = document.getElementById('profileForm');
const modalTitle = document.getElementById('modalTitle');

const profileIdInput = document.getElementById('profileId');
const modalName = document.getElementById('modalName');
const modalEmail = document.getElementById('modalEmail');
const modalPhone = document.getElementById('modalPhone');
const modalAddress = document.getElementById('modalAddress');

// Validation helper regexes
const phoneRegex = /^[0-9]{10}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.com$/;
const nameRegex = /^[a-zA-Z\s]{3,}$/;

window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('mongo_user');
    if (savedUser) {
        showDashboard(JSON.parse(savedUser));
    }
});

// 1. LOGIN WITH VALIDATIONS
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('loginName').value.trim();
    const email = document.getElementById('loginEmail').value.trim();
    const phone = document.getElementById('loginPhone').value.trim();

    // Validations
    if (!nameRegex.test(name)) {
        alert('Name must contain only letters and be at least 3 characters long.');
        return;
    }
    if (!emailRegex.test(email)) {
        alert('Email must be valid and strictly end with .com');
        return;
    }
    if (!phoneRegex.test(phone)) {
        alert('Phone number must be exactly 10 digits.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone })
        });
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('mongo_user', JSON.stringify(data.profile));
            showDashboard(data.profile);
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (err) {
        console.error('Connection error:', err);
        alert('Could not connect to backend server.');
    }
});

function showDashboard(user) {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    welcomeUser.textContent = `Welcome, ${user.name}`;
    loadProfiles();
}

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('mongo_user');
    dashboardSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    loginForm.reset();
});

// 2. LIST PROFILES (Read Operation)
async function loadProfiles() {
    try {
        const response = await fetch(`${API_URL}/profiles`);
        const profiles = await response.json();
        
        tableBody.innerHTML = '';
        if (profiles.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b;">No profiles found in database.</td></tr>`;
            return;
        }

        profiles.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(p.name)}</strong></td>
                <td>${escapeHtml(p.email)}</td>
                <td>${escapeHtml(p.phone)}</td>
                <td>${escapeHtml(p.address || '')}</td>
                <td>
                    <button class="icon-btn btn-edit" onclick="openEditModal('${p._id}', '${escapeAttr(p.name)}', '${escapeAttr(p.email)}', '${escapeAttr(p.phone)}', '${escapeAttr(p.address)}')"><i class="fa-solid fa-pen"></i> Update</button>
                    <button class="icon-btn btn-delete" onclick="deleteProfile('${p._id}')"><i class="fa-solid fa-trash"></i> Delete</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error fetching profiles:', err);
    }
}

openAddModalBtn.addEventListener('click', () => {
    modalTitle.textContent = 'Create New Profile';
    profileForm.reset();
    profileIdInput.value = '';
    profileModal.classList.add('active');
});

function closeModal() {
    profileModal.classList.remove('active');
}
closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);

// 3. CREATE & UPDATE OPERATION WITH FULL VALIDATION
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = profileIdInput.value;
    const name = modalName.value.trim();
    const email = modalEmail.value.trim();
    const phone = modalPhone.value.trim();
    const address = modalAddress.value.trim();

    // Validations for Modal Form
    if (!nameRegex.test(name)) {
        alert('Name must contain only letters and be at least 3 characters long.');
        return;
    }
    if (!emailRegex.test(email)) {
        alert('Email must be valid and strictly end with .com');
        return;
    }
    if (!phoneRegex.test(phone)) {
        alert('Phone number must be exactly 10 digits.');
        return;
    }
    if (address.length < 5) {
        alert('Address must be at least 5 characters long.');
        return;
    }

    const payload = { name, email, phone, address };

    try {
        let response;
        if (id) {
            response = await fetch(`${API_URL}/profiles/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            response = await fetch(`${API_URL}/profiles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (response.ok) {
            closeModal();
            loadProfiles();
        } else {
            const errData = await response.json();
            alert(errData.error || 'Operation failed');
        }
    } catch (err) {
        console.error('Network error:', err);
    }
});

window.openEditModal = function(id, name, email, phone, address) {
    modalTitle.textContent = 'Update Profile';
    profileIdInput.value = id;
    modalName.value = name;
    modalEmail.value = email;
    modalPhone.value = phone;
    modalAddress.value = address;
    profileModal.classList.add('active');
};

// 4. DELETE OPERATION
window.deleteProfile = async function(id) {
    if (confirm('Are you sure you want to delete this profile from MongoDB?')) {
        try {
            const response = await fetch(`${API_URL}/profiles/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                loadProfiles();
            } else {
                alert('Failed to delete profile');
            }
        } catch (err) {
            console.error('Error deleting profile:', err);
        }
    }
};

function escapeHtml(str) {
    return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeAttr(str) {
    return (str || '').replace(/'/g, "&#039;").replace(/"/g, "&quot;");
}
