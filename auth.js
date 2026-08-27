import { auth, db, provider } from './firebase-config.js';
import { signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const ADMIN_EMAIL = "vsshegur@gmail.com";
window.appState = { userSkus: {}, isUnlocked: false, currentUser: null, currentApp: 'labelCutter' };

document.getElementById('appSelector').addEventListener('change', (e) => {
    if (!window.appState.isUnlocked) return;
    window.appState.currentApp = e.target.value;
    document.getElementById('authPanel').classList.add('hidden');
    document.getElementById('labelWorkspace').classList.add('hidden');
    document.getElementById('fkPnlWorkspace').classList.add('hidden');
    
    if (window.appState.currentApp === 'labelCutter') { 
        document.getElementById('labelWorkspace').classList.remove('hidden'); 
        window.dispatchEvent(new Event('appUnlocked')); 
    } 
    else if (window.appState.currentApp === 'fkPnlCalculator') { 
        document.getElementById('fkPnlWorkspace').classList.remove('hidden'); 
    } 
});

document.getElementById('themeToggle').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    document.getElementById('lc_logoPreview').className = `h-full object-contain p-1 ${document.documentElement.classList.contains('dark') ? '' : 'invert'}`;
});

if(auth) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            document.getElementById('authWarning').classList.add('hidden');
            document.getElementById('authFeatures').classList.add('hidden');
            
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            let uData = userSnap.exists() ? userSnap.data() : { email: user.email, name: user.displayName || 'User', photo: user.photoURL || '', role: user.email === ADMIN_EMAIL ? 'admin' : 'user', planType: 'Free Trial', createdAt: Date.now(), expiresAt: Date.now() + (2 * 24 * 60 * 60 * 1000), isActive: true };
            if (!userSnap.exists()) await setDoc(userRef, uData);
            else if (user.email === ADMIN_EMAIL && uData.role !== 'admin') { uData.role = 'admin'; await updateDoc(userRef, { role: 'admin' }); }
            
            try { const memSnap = await getDoc(doc(db, 'users', user.uid, 'skus', 'memory')); if(memSnap.exists()) window.appState.userSkus = memSnap.data() || {}; } catch(e){}
            
            window.appState.currentUser = user;
            document.getElementById('userAvatar').src = user.photoURL || 'https://via.placeholder.com/32';
            document.getElementById('userName').textContent = user.displayName || 'User';
            document.getElementById('userInfo').classList.remove('hidden');
            
            const isAdmin = uData.role === 'admin'; 
            const now = Date.now(); 
            const isExpired = !isAdmin && (now > uData.expiresAt || !uData.isActive);
            const daysLeft = Math.ceil((uData.expiresAt - now) / (1000 * 60 * 60 * 24));
            
            if (isAdmin || !isExpired) {
                const planText = isAdmin ? "ADMIN" : uData.planType;
                document.getElementById('userPlan').textContent = `${planText} • ${daysLeft} Days Left`;
                if(isAdmin) document.getElementById('adminToggleBtn').classList.remove('hidden');
                
                window.appState.isUnlocked = true; document.getElementById('authPanel').classList.add('hidden'); document.getElementById('appSelectorContainer').classList.remove('hidden');
                document.getElementById('appSelector').value = "labelCutter"; document.getElementById('labelWorkspace').classList.remove('hidden'); window.dispatchEvent(new Event('appUnlocked'));
            } else {
                document.getElementById('userPlan').textContent = "PLAN EXPIRED"; document.getElementById('expiredWarning').classList.remove('hidden');
            }
        } else {
            window.appState.currentUser = null; window.appState.userSkus = {}; window.appState.isUnlocked = false;
            document.getElementById('authPanel').classList.remove('hidden'); document.getElementById('authWarning').classList.remove('hidden'); document.getElementById('authFeatures').classList.remove('hidden'); 
            document.getElementById('expiredWarning').classList.add('hidden'); document.getElementById('labelWorkspace').classList.add('hidden'); document.getElementById('fkPnlWorkspace').classList.add('hidden'); 
            document.getElementById('adminPanel').classList.add('hidden'); document.getElementById('appSelectorContainer').classList.add('hidden'); document.getElementById('userInfo').classList.add('hidden');
            document.getElementById('googleSignInBtn').innerHTML = `Secure Login`;
        }
    });

    document.getElementById('googleSignInBtn').addEventListener('click', () => { 
        document.getElementById('googleSignInBtn').innerHTML = `<svg class="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Connecting...`;
        signInWithPopup(auth, provider).catch(e => {
            alert("⚠️ LOGIN FAILED: \n\n" + e.message + "\n\nMake sure 'madhvishegur.vercel.app' is added to Authorized Domains in your Firebase Authentication Settings.");
            document.getElementById('googleSignInBtn').innerHTML = `Secure Login`;
        });
    });
    document.getElementById('logoutBtn').addEventListener('click', () => { signOut(auth).then(()=>location.reload()); });
    document.getElementById('expiredLogoutBtn').addEventListener('click', () => { signOut(auth).then(()=>location.reload()); });
}

document.getElementById('adminToggleBtn').addEventListener('click', async () => {
    if (document.getElementById('adminPanel').classList.contains('hidden')) {
        document.getElementById('authPanel').classList.add('hidden'); document.getElementById('labelWorkspace').classList.add('hidden'); document.getElementById('fkPnlWorkspace').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('hidden'); document.getElementById('adminToggleBtn').textContent = "Back to App"; await loadAdminUsers();
    } else {
        document.getElementById('adminPanel').classList.add('hidden'); document.getElementById('adminToggleBtn').textContent = "Admin Panel";
        if(window.appState.currentApp === 'labelCutter') document.getElementById('labelWorkspace').classList.remove('hidden'); 
        else if (window.appState.currentApp === 'fkPnlCalculator') document.getElementById('fkPnlWorkspace').classList.remove('hidden');
    }
});

async function loadAdminUsers() {
    const tbody = document.getElementById('adminUserTableBody'); tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-xs font-bold text-slate-500">Fetching users...</td></tr>';
    try {
        const snapshot = await getDocs(collection(db, 'users')); tbody.innerHTML = '';
        snapshot.forEach(docSnap => {
            const u = docSnap.data(); const uid = docSnap.id; const now = Date.now(); const daysLeft = Math.ceil((u.expiresAt - now) / (1000 * 60 * 60 * 24)); const isExp = daysLeft <= 0;
            const tr = document.createElement('tr'); tr.className = "border-b border-slate-200 dark:border-slate-800/50 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors";
            tr.innerHTML = `<td class="py-4 px-4 flex items-center gap-3"><img src="${u.photo || 'https://via.placeholder.com/24'}" class="w-8 h-8 rounded-full shadow-sm"><div><p class="font-bold text-slate-900 dark:text-white">${u.name}</p><p class="text-[10px] text-slate-500">${u.email}</p></div></td><td class="py-4 px-4"><span class="px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}">${u.role}</span></td><td class="py-4 px-4"><span class="px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${u.planType === 'Free Trial' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'}">${u.planType}</span></td><td class="py-4 px-4 font-black text-xs ${isExp && u.role !== 'admin' ? 'text-rose-600 dark:text-rose-500' : 'text-slate-700 dark:text-slate-300'}">${daysLeft} DAYS</td><td class="py-4 px-4 flex justify-end items-center gap-2">${u.role !== 'admin' ? `<button onclick="window.updateDaysAdmin('${uid}')" class="bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] px-3 py-2 rounded uppercase tracking-widest font-black transition-colors shadow-md">Add 30 Days</button>` : '<span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Sys Admin</span>'}</td>`; tbody.appendChild(tr);
        });
    } catch(e) {}
}

window.updateDaysAdmin = async function(uid) {
    if(!confirm(`Add 30 Days?`)) return;
    const userRef = doc(db, 'users', uid); const snap = await getDoc(userRef);
    if(snap.exists()) { const u = snap.data(); let baseTime = u.expiresAt > Date.now() ? u.expiresAt : Date.now(); let newExp = baseTime + (30 * 24 * 60 * 60 * 1000); await updateDoc(userRef, { expiresAt: newExp, planType: 'Paid Plan' }); loadAdminUsers(); }
}
