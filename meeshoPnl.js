import { db } from './firebase-config.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const ms_state = { pay: [], ord: [], ret: [] }; let ms_reconciledData = [];
document.getElementById('ms_payInput').addEventListener('change', (e) => ms_loadReport(e, 'pay', 'ms_labelPay'));
document.getElementById('ms_ordInput').addEventListener('change', (e) => ms_loadReport(e, 'ord', 'ms_labelOrd'));
document.getElementById('ms_retInput').addEventListener('change', (e) => ms_loadReport(e, 'ret', 'ms_labelRet'));
document.getElementById('ms_applyBulkBtn').addEventListener('click', ms_applyBulkCost);
document.getElementById('ms_lossInput').addEventListener('input', ms_computeTotals);
document.getElementById('ms_recalcBtn').addEventListener('click', ms_computeTotals);

document.getElementById('ms_exportBtn').addEventListener('click', () => {
    if(ms_reconciledData.length === 0) return alert("No Meesho data to export. Please process your files first.");
    
    const exportData = ms_reconciledData.map(item => ({
        "SKU ID": item.sku,
        "Total Dispatched": item.disp,
        "Total Delivered": item.del,
        "Customer Returns / RTOs": (item.cr + item.rto + item.can),
        "Total Net Payout (₹)": item.set,
        "Unit Mfg Cost (₹)": item.cost,
        "Total Final Profit (₹)": item.cost > 0 ? (item.set - (item.del * item.cost)) : "COST MISSING"
    }));

    const totalSet = ms_reconciledData.reduce((s, i) => s + i.set, 0);
    const totalProfit = ms_reconciledData.reduce((s, i) => i.cost > 0 ? s + (i.set - (i.del * i.cost)) : s, 0);
    const loss = parseFloat(document.getElementById('ms_lossInput').value) || 0;
    
    exportData.push({}); exportData.push({ "SKU ID": "BUSINESS SUMMARY", "Total Net Payout (₹)": totalSet, "Total Final Profit (₹)": totalProfit - loss });

    const wb = XLSX.utils.book_new(); const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Meesho PnL Report");
    XLSX.writeFile(wb, `Shegurs_Meesho_PnL_${new Date().toISOString().slice(0,10)}.xlsx`);
});

function ms_loadReport(event, type, labelId) {
  const file = event.target.files[0]; if (!file) return; const reader = new FileReader();
  reader.onload = function(e) {
    const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' }); let targetSheet = null;
    for (const sheetName of workbook.SheetNames) { const parsed = ms_parseSmart(workbook.Sheets[sheetName]); if (parsed.length > 0) { targetSheet = parsed; break; } }
    ms_state[type] = targetSheet || []; document.getElementById(labelId).textContent = file.name.substring(0, 20) + '...'; document.getElementById(labelId).className = "text-[11px] text-emerald-400 font-bold mt-2 uppercase tracking-widest";
    if (ms_state.pay.length > 0 && ms_state.ord.length > 0) ms_reconcile();
  }; reader.readAsArrayBuffer(file);
}

function ms_parseSmart(sheet) {
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }); if (!rawRows || rawRows.length === 0) return []; let hrIdx = -1;
  for (let i = 0; i < Math.min(rawRows.length, 15); i++) { const rowStr = rawRows[i].map(c => String(c).toLowerCase().replace(/\s+/g, '')).join(' '); if (rowStr.includes('suborderno') || rowStr.includes('suppliersku') || rowStr.includes('finalsettlementamount') || rowStr.includes('awbnumber')) { hrIdx = i; break; } }
  if (hrIdx === -1) return []; 
  const headers = rawRows[hrIdx].map(h => String(h).trim()); const dataRows = [];
  for (let i = hrIdx + 1; i < rawRows.length; i++) { 
      const rowObj = {}; let hasData = false; 
      rawRows[i].forEach((cell, colIdx) => { 
          if (headers[colIdx] && headers[colIdx] !== '') { rowObj[headers[colIdx]] = cell; if (cell !== '') hasData = true; } 
      }); 
      if (hasData) dataRows.push(rowObj); 
  }
  return dataRows;
}

function ms_findVal(row, candidateKeys) {
  const cR = Object.keys(row).map(k => ({ o: k, c: k.toLowerCase().replace(/[^a-z0-9]/g, '') }));
  for (const cand of candidateKeys) { const cC = cand.toLowerCase().replace(/[^a-z0-9]/g, ''); const match = cR.find(k => k.c === cC || k.c.includes(cC)); if (match && row[match.o] !== undefined && row[match.o] !== '') return row[match.o]; } return null;
}
function ms_cleanId(val) { return (!val) ? '' : String(val).trim().replace(/\.0$/, ''); }

function ms_reconcile() {
  const subOrderMap = new Map(); const skuMap = new Map();
  
  ms_state.ord.forEach(row => {
      const sid = ms_cleanId(ms_findVal(row, ['suborderno', 'suborder', 'subordernumber', 'orderno', 'orderid']));
      if (sid) subOrderMap.set(sid, { sku: String(ms_findVal(row, ['sku', 'skuid', 'productsku']) || 'MISC_SKU').trim(), qty: parseInt(ms_findVal(row, ['quantity', 'qty', 'units'])) || 1, status: String(ms_findVal(row, ['status', 'orderstatus', 'deliverystatus']) || '').toUpperCase(), settlement: 0, returnType: '' });
  });

  ms_state.pay.forEach(row => {
      const rawSid = String(ms_findVal(row, ['suborderno', 'suborder', 'subordernumber', 'orderno', 'orderid']) || '').trim();
      if (!rawSid || rawSid.includes('+') || rawSid.includes('(')) return; 
      const sid = rawSid.replace(/\.0$/, '');
      const net = parseFloat(String(ms_findVal(row, ['finalsettlementamount', 'netsettlementamount', 'banksettlementamount', 'totalpayout', 'netpayout', 'settlementamount'])).replace(/[^0-9.-]/g, '')) || 0;
      if (sid && subOrderMap.has(sid)) { subOrderMap.get(sid).settlement += net; } else if (sid) { subOrderMap.set(sid, { sku: String(ms_findVal(row, ['sku', 'productsku', 'skuid']) || 'UNMAPPED_SKU').trim(), qty: 1, status: net >= 0 ? 'DELIVERED' : 'RETURNED', settlement: net, returnType: net < 0 ? 'CUSTOMER' : '' }); }
  });
  
  ms_state.ret.forEach(row => {
      const sid = ms_cleanId(ms_findVal(row, ['suborderno', 'suborder', 'subordernumber', 'orderid', 'orderno']));
      if (sid && subOrderMap.has(sid)) subOrderMap.get(sid).returnType = String(ms_findVal(row, ['returntype', 'typeofreturn', 'trackingtype']) || '').toUpperCase().includes('CUSTOMER') ? 'CUSTOMER' : 'RTO';
  });

  subOrderMap.forEach((val) => {
    if (!skuMap.has(val.sku)) skuMap.set(val.sku, { sku: val.sku, disp: 0, del: 0, cr: 0, rto: 0, can: 0, set: 0, cost: window.appState.userSkus[val.sku] || 0 });
    const item = skuMap.get(val.sku); 
    item.set += val.settlement;
    if (val.status.includes('CANCEL')) { item.can += val.qty; } else { item.disp += val.qty; }
    if (val.returnType === 'CUSTOMER' || val.status.includes('CUSTOMER') || (val.settlement < 0 && !val.status.includes('RTO'))) item.cr += val.qty;
    else if (val.returnType === 'RTO' || val.status.includes('RTO')) item.rto += val.qty;
    else if (val.status.includes('DELIVERED') || val.settlement > 0) item.del += val.qty;
  });

  ms_reconciledData = Array.from(skuMap.values()); ms_renderTable(); document.getElementById('ms_calcSection').classList.remove('hidden'); ms_computeTotals();
}

function ms_renderTable() {
  const tbody = document.getElementById('ms_skuTableBody'); tbody.innerHTML = '';
  ms_reconciledData.sort((a, b) => { if (a.cost === 0 && b.cost !== 0) return -1; if (a.cost !== 0 && b.cost === 0) return 1; return b.set - a.set; });
  ms_reconciledData.forEach((item, index) => {
    const tr = document.createElement('tr'); const isMis = item.cost === 0; tr.className = `border-b border-slate-800/50 ${isMis ? 'bg-orange-500/10' : 'hover:bg-slate-800/30'} transition-colors`;
    tr.innerHTML = `<td class="py-4 px-6 text-slate-500">${index + 1}</td><td class="py-4 px-6 font-bold ${isMis ? 'text-orange-400' : 'text-slate-200'}">${item.sku}</td><td class="py-4 px-6 text-right text-white">${item.disp}</td><td class="py-4 px-6 text-right text-emerald-400">${item.del}</td><td class="py-4 px-6 text-right text-rose-400">${item.rto + item.can + item.cr}</td><td class="py-4 px-6 text-right text-blue-400">₹${item.set.toFixed(2)}</td><td class="py-4 px-6 text-center"><input type="number" step="0.01" value="${item.cost || ''}" placeholder="0.00" class="ms-cost-box w-24 bg-slate-900 border ${isMis ? 'border-orange-500' : 'border-slate-600'} text-white px-3 py-2 rounded-xl text-center outline-none focus:border-pink-500 transition-colors shadow-inner" data-index="${index}" /></td><td id="ms_tProf_${index}" class="py-4 px-6 text-right font-bold text-slate-300">₹0.00</td>`;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('.ms-cost-box').forEach(input => {
    let tid; input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index')); const nCost = parseFloat(e.target.value) || 0; ms_reconciledData[idx].cost = nCost;
      const tr = e.target.closest('tr'); const sc = tr.querySelector('td:nth-child(2)');
      if(nCost === 0 || isNaN(nCost)) { tr.classList.add('bg-orange-500/10'); sc.classList.add('text-orange-400'); sc.classList.remove('text-slate-200'); e.target.classList.add('border-orange-500'); e.target.classList.remove('border-slate-600'); } else { tr.classList.remove('bg-orange-500/10'); sc.classList.remove('text-orange-400'); sc.classList.add('text-slate-200'); e.target.classList.remove('border-orange-500'); e.target.classList.add('border-slate-600'); }
      ms_computeTotals(); clearTimeout(tid); tid = setTimeout(() => { window.appState.userSkus[ms_reconciledData[idx].sku] = nCost; if(window.appState.currentUser && db) setDoc(doc(db, 'users', window.appState.currentUser.uid, 'skus', 'memory'), { [ms_reconciledData[idx].sku]: nCost }, { merge: true }); }, 1000);
    });
  });
}

function ms_applyBulkCost() {
  const val = parseFloat(document.getElementById('ms_bulkCostInput').value); if (isNaN(val)) return; const bU = {};
  ms_reconciledData.forEach((item, index) => { if(item.cost === 0 || isNaN(item.cost)) { item.cost = val; bU[item.sku] = val; const inp = document.querySelector(`.ms-cost-box[data-index="${index}"]`); if(inp) { inp.value = val; inp.classList.remove('border-orange-500'); inp.classList.add('border-slate-600'); const tr = inp.closest('tr'); tr.classList.remove('bg-orange-500/10'); tr.querySelector('td:nth-child(2)').classList.remove('text-orange-400'); tr.querySelector('td:nth-child(2)').classList.add('text-slate-200'); } } });
  ms_computeTotals(); Object.assign(window.appState.userSkus, bU); if(window.appState.currentUser && db) setDoc(doc(db, 'users', window.appState.currentUser.uid, 'skus', 'memory'), bU, { merge: true });
}

function ms_computeTotals() {
  let tS = 0; let tDis = 0; let tD = 0; let tR = 0; let tG = 0;
  ms_reconciledData.forEach((item, index) => {
    const tP = document.getElementById(`ms_tProf_${index}`);
    if (item.cost === 0 || isNaN(item.cost)) { if (tP) tP.innerHTML = `<span class="text-[10px] text-orange-400 font-black uppercase">Excluded</span>`; return; }
    tS += item.set; tDis += item.disp; tD += item.del; tR += (item.cr + item.rto + item.can); 
    const skuP = item.set - (item.del * item.cost); tG += skuP;
    if (tP) { tP.textContent = `₹${skuP.toFixed(2)}`; tP.className = `py-4 px-6 text-right font-black ${skuP >= 0 ? 'text-emerald-400' : 'text-rose-400'}`; }
  });
  const fP = tG - (parseFloat(document.getElementById('ms_lossInput').value) || 0);
  document.getElementById('ms_kpiSettlement').textContent = `₹${tS.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  document.getElementById('ms_kpiDispatched').textContent = tDis.toLocaleString();
  document.getElementById('ms_kpiDelivered').textContent = tD.toLocaleString(); document.getElementById('ms_kpiReturns').textContent = tR.toLocaleString();
  document.getElementById('ms_kpiNetProfit').textContent = `₹${fP.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`; document.getElementById('ms_kpiNetProfit').className = `text-4xl font-black mt-2 ${fP >= 0 ? 'text-emerald-300' : 'text-rose-400'}`;
}
