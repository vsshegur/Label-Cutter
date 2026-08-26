import { auth, db, provider } from './firebase-config.js';
import { signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const ADMIN_EMAIL = "vsshegur@gmail.com";
const EXTENSION_ID = "YOUR_EXTENSION_ID_HERE";

// Global state available to other modules
window.appState = {
    userSkus: {},
    isUnlocked: false,
    currentUser: null
};

// UI Elements
const DOM = {
    authContainer: document.getElementById('authContainer'),
    mainAppContainer: document.getElementById('mainAppContainer'),
    authWarning: document.getElementById('authWarning'),
    authFeatures: document.getElementById('authFeatures'),
    expiredWarning: document.getElementById('expiredWarning'),
    userInfo: document.getElementById('userInfo'),
    userName: document.getElementById('userName'),
    userAvatar: document.getElementById('userAvatar'),
    userPlan: document.getElementById('userPlan'),
    adminToggleBtn: document.getElementById('adminToggleBtn'),
    appSelector: document.getElementById('appSelector'),
    workspaces: {
        labelCutter: document.getElementById('workspace_label'),
        fkPnlCalculator: document.getElementById('workspace_flipkart'),
        msPnlCalculator: document.getElementById('workspace_meesho'),
        admin: document.getElementById('workspace_admin')
    }
};

// Navigation
DOM.appSelector.addEventListener('change', (e) => {
    Object.values(DOM.workspaces).forEach(w => w.classList.add('hidden'));
    if (DOM.workspaces[e.target.value]) {
        DOM.workspaces[e.target.value].classList.remove('hidden');
    }
});

document.getElementById('themeToggle').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
});

// Auth Logic
if (auth) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            DOM.authWarning.classList.add('hidden');
            DOM.authFeatures.classList.add('hidden');
            
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            let uData;
            
            if (!userSnap.exists()) {
                uData = { email: user.email, name: user.displayName || 'User', photo: user.photoURL || '', role: user.email === ADMIN_EMAIL ? 'admin' : 'user', planType: 'Free Trial', createdAt: Date.now(), expiresAt: Date.now() + (2 * 24 * 60 * 60 * 1000), isActive: true };
                await setDoc(userRef, uData);
            } else {
                uData = userSnap.data();
                if (user.email === ADMIN_EMAIL && uData.role !== 'admin') { uData.role = 'admin'; await updateDoc(userRef, { role: 'admin' }); }
            }
            
            try { 
                const memSnap = await getDoc(doc(db, 'users', user.uid, 'skus', 'memory')); 
                if(memSnap.exists()) window.appState.userSkus = memSnap.data() || {}; 
            } catch(e) {}
            
            window.appState.currentUser = user;
            DOM.userAvatar.src = user.photoURL || 'https://via.placeholder.com/32';
            DOM.userName.textContent = user.displayName || 'User';
            DOM.userInfo.classList.remove('hidden');
            
            const isAdmin = uData.role === 'admin';
            const isExpired = !isAdmin && (Date.now() > uData.expiresAt || !uData.isActive);
            
            if (isAdmin) {
                DOM.userPlan.textContent = "ADMINISTRATOR";
                DOM.adminToggleBtn.classList.remove('hidden');
                unlockApp();
                loadAdminUsers();
            } else if (!isExpired) {
                const daysLeft = Math.ceil((uData.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
                DOM.userPlan.textContent = `${uData.planType} • ${daysLeft} Days Left`;
                unlockApp();
            } else {
                DOM.userPlan.textContent = "PLAN EXPIRED";
                DOM.userPlan.classList.replace('text-emerald-400', 'text-rose-500');
                DOM.expiredWarning.classList.remove('hidden');
            }
        } else {
            lockApp();
        }
    });
} else {
    document.getElementById('googleSignInBtn').addEventListener('click', () => {
        alert("Firebase Configuration Missing! Please add your API keys to firebase-config.js");
    });
}

function unlockApp() {
    window.appState.isUnlocked = true;
    DOM.authContainer.classList.add('hidden');
    DOM.mainAppContainer.classList.remove('hidden');
    DOM.workspaces.labelCutter.classList.remove('hidden');
    DOM.appSelector.value = "labelCutter";
    window.dispatchEvent(new Event('appUnlocked'));
}

function lockApp() {
    window.appState.isUnlocked = false;
    window.appState.userSkus = {};
    window.appState.currentUser = null;
    DOM.authContainer.classList.remove('hidden');
    DOM.authWarning.classList.remove('hidden');
    DOM.authFeatures.classList.remove('hidden');
    DOM.expiredWarning.classList.add('hidden');
    DOM.mainAppContainer.classList.add('hidden');
}

// Buttons
const btnLogin = document.getElementById('googleSignInBtn');
if(btnLogin && auth) {
    btnLogin.addEventListener('click', () => {
        btnLogin.innerHTML = "Connecting...";
        signInWithPopup(auth, provider).catch(e => {
            alert("Login Failed: " + e.message);
            btnLogin.innerHTML = "Secure Login";
        });
    });
}

document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth).then(()=>location.reload()));
document.getElementById('expiredLogoutBtn').addEventListener('click', () => signOut(auth).then(()=>location.reload()));

// Admin Logic
DOM.adminToggleBtn.addEventListener('click', async () => {
    Object.values(DOM.workspaces).forEach(w => w.classList.add('hidden'));
    if (DOM.adminToggleBtn.textContent === "Admin") {
        DOM.workspaces.admin.classList.remove('hidden');
        DOM.adminToggleBtn.textContent = "Back";
        await loadAdminUsers();
    } else {
        DOM.workspaces[DOM.appSelector.value].classList.remove('hidden');
        DOM.adminToggleBtn.textContent = "Admin";
    }
});

async function loadAdminUsers() {
    const tbody = document.getElementById('adminUserTableBody'); 
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-slate-500">Fetching users...</td></tr>';
    try {
        const snapshot = await getDocs(collection(db, 'users')); 
        tbody.innerHTML = '';
        snapshot.forEach(docSnap => {
            const u = docSnap.data(); const uid = docSnap.id;
            const daysLeft = Math.ceil((u.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
            const tr = document.createElement('tr'); 
            tr.innerHTML = `<td class="py-4 px-4">${u.name}</td><td class="py-4 px-4">${u.role}</td><td class="py-4 px-4">${u.planType}</td><td class="py-4 px-4">${daysLeft} Days</td><td class="py-4 px-4"><button onclick="updateUser('${uid}')" class="bg-indigo-600 px-3 py-1 rounded text-white text-xs">Add 30 Days</button></td>`; 
            tbody.appendChild(tr);
        });
    } catch(e) {}
}

window.updateUser = async function(uid) {
    if(!confirm("Add 30 days to this user?")) return;
    const userRef = doc(db, 'users', uid); const snap = await getDoc(userRef);
    if(snap.exists()) {
        const u = snap.data(); 
        const baseTime = u.expiresAt > Date.now() ? u.expiresAt : Date.now();
        await updateDoc(userRef, { expiresAt: baseTime + (30 * 24 * 60 * 60 * 1000), planType: 'Paid Plan' }); 
        loadAdminUsers();
    }
}
