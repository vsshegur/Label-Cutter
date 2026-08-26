import { auth, db } from './auth.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

let fk_rawSkuData = [];
document.getElementById('fk_excelInput').addEventListener('change', fk_handleExcel);
document.getElementById('fk_applyBulkBtn').addEventListener('click', fk_applyBulkCost);
document.getElementById('fk_lossInput').addEventListener('input', fk_updateCalculations);
document.getElementById('fk_recalcBtn').addEventListener('click', fk_updateCalculations);

function fk_handleExcel(e) {
  const file = e.target.files[0]; if (!file) return; const reader = new FileReader();
  reader.onload = function (event) { const workbook = XLSX.read(new Uint8Array(event.target.result), { type: 'array' }); fk_extractData(workbook); }; reader.readAsArrayBuffer(file);
}

function fk_extractData(wb) {
  if (!wb.SheetNames.includes('SKU-level P&L')) { alert("Missing 'SKU-level P&L' sheet in Excel."); return; }
  const sheet = wb.Sheets['SKU-level P&L']; const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }); if (rawRows.length < 2) return;
  const skuMap = new Map();
  for (let i = 1; i < rawRows.length; i++) {
    const skuId = rawRows[i][0]; if (!skuId || typeof skuId !== 'string' || skuId.trim() === '') continue;
    const netUnits = parseFloat(rawRows[i][7]) || 0; const bankSettlement = parseFloat(rawRows[i][45]) || 0;
    if (!skuMap.has(skuId)) { skuMap.set(skuId, { skuId, netUnits, bankSettlement, costOfProduct: window.app_userSavedSkus[skuId] || 0 }); } else { const item = skuMap.get(skuId); item.netUnits += netUnits; item.bankSettlement += bankSettlement; }
  }
  fk_rawSkuData = Array.from(skuMap.values()); fk_renderTable(); document.getElementById('fk_calcSection').classList.remove('hidden'); fk_updateCalculations();
}

function fk_renderTable() {
  const tbody = document.getElementById('fk_skuTableBody'); tbody.innerHTML = '';
  fk_rawSkuData.sort((a, b) => { if (a.costOfProduct === 0 && b.costOfProduct !== 0) return -1; if (a.costOfProduct !== 0 && b.costOfProduct === 0) return 1; return b.bankSettlement - a.bankSettlement; });
  fk_rawSkuData.forEach((item, index) => {
    const tr = document.createElement('tr'); const isMissing = item.costOfProduct === 0; tr.className = `border-b border-slate-800/50 ${isMissing ? 'bg-orange-500/10' : ''}`;
    const avg = item.netUnits > 0 ? (item.bankSettlement / item.netUnits) : 0;
    tr.innerHTML = `<td class="py-3 px-4">${index + 1}</td><td class="py-3 px-4 font-bold ${isMissing ? 'text-orange-400' : 'text-slate-200'}">${item.skuId}</td><td class="py-3 px-4 text-right">${item.netUnits}</td><td class="py-3 px-4 text-right text-blue-400">₹${item.bankSettlement.toFixed(2)}</td><td class="py-3 px-4 text-center"><input type="number" step="0.01" value="${item.costOfProduct || ''}" class="fk-cost-input w-24 bg-slate-950 border ${isMissing ? 'border-orange-500' : 'border-slate-700'} text-amber-400 px-2 py-1.5 rounded-lg text-center" data-index="${index}" /></td><td id="fk_pUnit_${index}" class="py-3 px-4 text-right font-bold">₹0.00</td><td id="fk_tProf_${index}" class="py-3 px-4 text-right font-bold">₹0.00</td>`;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('.fk-cost-input').forEach(input => {
    let tid; input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index')); const nCost = parseFloat(e.target.value) || 0; fk_rawSkuData[idx].costOfProduct = nCost;
      const tr = e.target.closest('tr'); const sc = tr.querySelector('td:nth-child(2)');
      if(nCost === 0 || isNaN(nCost)) { tr.classList.add('bg-orange-500/10'); sc.classList.add('text-orange-400'); sc.classList.remove('text-slate-200'); e.target.classList.add('border-orange-500'); e.target.classList.remove('border-slate-700'); } else { tr.classList.remove('bg-orange-500/10'); sc.classList.remove('text-orange-400'); sc.classList.add('text-slate-200'); e.target.classList.remove('border-orange-500'); e.target.classList.add('border-slate-700'); }
      fk_updateCalculations(); clearTimeout(tid); tid = setTimeout(() => { window.app_userSavedSkus[fk_rawSkuData[idx].skuId] = nCost; setDoc(doc(db, 'users', window.auth.currentUser.uid, 'skus', 'memory'), { [fk_rawSkuData[idx].skuId]: nCost }, { merge: true }); }, 1000);
    });
  });
}

function fk_applyBulkCost() {
  const val = parseFloat(document.getElementById('fk_bulkCostInput').value); if (isNaN(val)) return; const bulkUpdates = {};
  fk_rawSkuData.forEach((item, index) => { 
      if(item.costOfProduct === 0 || isNaN(item.costOfProduct)) {
          item.costOfProduct = val; bulkUpdates[item.skuId] = val; const inputEl = document.querySelector(`.fk-cost-input[data-index="${index}"]`);
          if(inputEl) { inputEl.value = val; inputEl.classList.remove('border-orange-500'); inputEl.classList.add('border-slate-700'); const tr = inputEl.closest('tr'); tr.classList.remove('bg-orange-500/10'); tr.querySelector('td:nth-child(2)').classList.remove('text-orange-400'); tr.querySelector('td:nth-child(2)').classList.add('text-slate-200'); }
      }
  });
  fk_updateCalculations(); Object.assign(window.app_userSavedSkus, bulkUpdates); setDoc(doc(db, 'users', window.auth.currentUser.uid, 'skus', 'memory'), bulkUpdates, { merge: true });
}

function fk_updateCalculations() {
  let tU = 0; let tS = 0; let tG = 0;
  fk_rawSkuData.forEach((item, index) => {
    const pU = document.getElementById(`fk_pUnit_${index}`); const tP = document.getElementById(`fk_tProf_${index}`);
    if (item.costOfProduct === 0 || isNaN(item.costOfProduct)) { if (pU && tP) { pU.innerHTML = `<span class="text-orange-400">Missing</span>`; tP.innerHTML = `<span class="text-orange-400">Excluded</span>`; } return; }
    tU += item.netUnits; tS += item.bankSettlement;
    const prof = (item.netUnits > 0 ? (item.bankSettlement / item.netUnits) : 0) - item.costOfProduct; const tProf = prof * item.netUnits; tG += tProf;
    if (pU && tP) { pU.textContent = `₹${prof.toFixed(2)}`; pU.className = `py-3 px-4 text-right font-black ${prof >= 0 ? 'text-emerald-400' : 'text-rose-400'}`; tP.textContent = `₹${tProf.toFixed(2)}`; tP.className = `py-3 px-4 text-right font-black ${tProf >= 0 ? 'text-emerald-400' : 'text-rose-400'}`; }
  });
  const fnP = tG - (parseFloat(document.getElementById('fk_lossInput').value) || 0);
  document.getElementById('fk_kpiUnits').textContent = tU.toLocaleString(); document.getElementById('fk_kpiSettlement').textContent = `₹${tS.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  document.getElementById('fk_kpiGross').textContent = `₹${tG.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`; document.getElementById('fk_kpiNet').textContent = `₹${fnP.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}
