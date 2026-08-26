import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const ADMIN_EMAIL = "vsshegur@gmail.com";

window.app_userSavedSkus = {};
window.app_isAppUnlocked = false;

document.getElementById('appSelector').addEventListener('change', (e) => {
    if (!window.app_isAppUnlocked) return;
    const val = e.target.value;
    document.getElementById('labelWorkspace').classList.add('hidden');
    document.getElementById('fkPnlWorkspace').classList.add('hidden');
    document.getElementById('msPnlWorkspace').classList.add('hidden');
    
    if (val === 'labelCutter') { document.getElementById('labelWorkspace').classList.remove('hidden'); }
    else if (val === 'fkPnlCalculator') { document.getElementById('fkPnlWorkspace').classList.remove('hidden'); }
    else if (val === 'msPnlCalculator') { document.getElementById('msPnlWorkspace').classList.remove('hidden'); }
});

document.getElementById('themeToggle').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    document.getElementById('lc_logoPreview').className = `h-full object-contain p-1 ${document.documentElement.classList.contains('dark') ? '' : 'invert'}`;
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('authWarning').classList.add('hidden');
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
        try { const memSnap = await getDoc(doc(db, 'users', user.uid, 'skus', 'memory')); if(memSnap.exists()) window.app_userSavedSkus = memSnap.data() || {}; } catch(e){}
        
        document.getElementById('userAvatar').src = user.photoURL || 'https://via.placeholder.com/32';
        document.getElementById('userName').textContent = user.displayName || 'User';
        document.getElementById('userInfo').classList.remove('hidden');
        
        const isAdmin = uData.role === 'admin';
        const now = Date.now();
        const isExpired = !isAdmin && (now > uData.expiresAt || !uData.isActive);
        
        if (isAdmin || !isExpired) {
            window.app_isAppUnlocked = true;
            document.getElementById('userPlan').textContent = isAdmin ? "ADMINISTRATOR" : `${uData.planType} Active`;
            document.getElementById('userPlan').className = "text-[9px] font-black uppercase text-emerald-500";
            document.getElementById('authPanel').classList.add('hidden');
            document.getElementById('appSelectorContainer').classList.remove('hidden');
            document.getElementById('appSelector').value = 'labelCutter';
            document.getElementById('labelWorkspace').classList.remove('hidden');
            window.dispatchEvent(new Event('appUnlocked'));
            if(isAdmin) document.getElementById('adminToggleBtn').classList.remove('hidden');
        } else {
            document.getElementById('expiredWarning').classList.remove('hidden');
        }
    } else {
        window.app_isAppUnlocked = false; window.app_userSavedSkus = {};
        document.getElementById('authPanel').classList.remove('hidden');
        document.getElementById('labelWorkspace').classList.add('hidden');
        document.getElementById('fkPnlWorkspace').classList.add('hidden');
        document.getElementById('msPnlWorkspace').classList.add('hidden');
        document.getElementById('appSelectorContainer').classList.add('hidden');
        document.getElementById('userInfo').classList.add('hidden');
    }
});

document.getElementById('googleSignInBtn').addEventListener('click', () => signInWithPopup(auth, provider).catch(e => alert(e.message)));
document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth).then(()=>window.location.reload()));
document.getElementById('expiredLogoutBtn').addEventListener('click', () => signOut(auth).then(()=>window.location.reload()));
