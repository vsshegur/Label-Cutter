import { db } from './firebase-config.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const ms_state = { pay: [], ord: [], ret: [], ads: [] }; 
let masterOrdersMap = new Map();
let currentFilteredOrders = [];
let ms_reconciledData = [];

// TABS
document.getElementById('ms_tabSku').addEventListener('click', () => {
    document.getElementById('ms_tabSku').className = "text-pink-400 font-bold border-b-2 border-pink-400 pb-2 uppercase tracking-widest text-sm transition-colors";
    document.getElementById('ms_tabDaily').className = "text-slate-500 hover:text-slate-300 font-bold pb-2 uppercase tracking-widest text-sm transition-colors";
    document.getElementById('ms_viewSku').classList.remove('hidden');
    document.getElementById('ms_viewDaily').classList.add('hidden');
});
document.getElementById('ms_tabDaily').addEventListener('click', () => {
    document.getElementById('ms_tabDaily').className = "text-pink-400 font-bold border-b-2 border-pink-400 pb-2 uppercase tracking-widest text-sm transition-colors";
    document.getElementById('ms_tabSku').className = "text-slate-500 hover:text-slate-300 font-bold pb-2 uppercase tracking-widest text-sm transition-colors";
    document.getElementById('ms_viewDaily').classList.remove('hidden');
    document.getElementById('ms_viewSku').classList.add('hidden');
});

document.getElementById('ms_ordInput').addEventListener('change', (e) => ms_loadReport(e, 'ord', 'ms_labelOrd'));
document.getElementById('ms_payInput').addEventListener('change', (e) => ms_loadReport(e, 'pay', 'ms_labelPay'));
document.getElementById('ms_retInput').addEventListener('change', (e) => ms_loadReport(e, 'ret', 'ms_labelRet'));
document.getElementById('ms_applyBulkBtn').addEventListener('click', ms_applyBulkCost);
document.getElementById('ms_recalcBtn').addEventListener('click', ms_computeTotals);
document.getElementById('ms_lossInput').addEventListener('input', ms_computeTotals);
document.getElementById('ms_filterBtn').addEventListener('click', ms_applyDateFilter);

document.getElementById('ms_exportBtn').addEventListener('click', () => {
    if(ms_reconciledData.length === 0) return alert("No Meesho data to export.");
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
    
    exportData.push({}); 
    exportData.push({ "SKU ID": "BUSINESS SUMMARY", "Total Net Payout (₹)": totalSet, "Total Final Profit (₹)": totalProfit - loss });

    const wb = XLSX.utils.book_new(); const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Meesho PnL Report");
    XLSX.writeFile(wb, `Shegurs_Meesho_PnL_${new Date().toISOString().slice(0,10)}.xlsx`);
});

function ms_loadReport(event, type, labelId) {
  const file = event.target.files[0]; if (!file) return; 
  document.getElementById('loader').classList.remove('hidden');
  const reader = new FileReader();
  reader.onload = function(e) {
    const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' }); 
    
    if (type === 'pay') {
        let paySheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('order payment')) || workbook.SheetNames[0];
        let adsSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('ads cost'));
        ms_state.pay = ms_parseSmart(workbook.Sheets[paySheetName]);
        if (adsSheetName) ms_state.ads = ms_parseSmart(workbook.Sheets[adsSheetName]);
    } else {
        let targetSheet = workbook.SheetNames.find(n => !n.toLowerCase().includes('disclaimer')) || workbook.SheetNames[0];
        ms_state[type] = ms_parseSmart(workbook.Sheets[targetSheet]);
    }
    
    document.getElementById(labelId).textContent = file.name.substring(0, 20) + '...'; 
    document.getElementById(labelId).className = "text-[11px] text-emerald-400 font-bold mt-2 uppercase tracking-widest";
    
    if (ms_state.pay.length > 0 && ms_state.ord.length > 0) ms_reconcile();
    document.getElementById('loader').classList.add('hidden');
  }; 
  reader.readAsArrayBuffer(file);
}

function ms_parseSmart(sheet) {
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }); if (!rawRows || rawRows.length === 0) return []; 
  let hrIdx = -1;
  for (let i = 0; i < Math.min(rawRows.length, 15); i++) { 
      const rowStr = rawRows[i].map(c => String(c).toLowerCase().replace(/\s+/g, '')).join(' '); 
      if (rowStr.includes('suborderno') || rowStr.includes('reasonforcreditentry') || rowStr.includes('totaladscost')) { hrIdx = i; break; } 
  }
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
function parseDateString(dStr) { if(!dStr) return null; const d = new Date(dStr); return isNaN(d) ? null : d; }

function ms_reconcile() {
  masterOrdersMap.clear();
  
  // 1. Base Map from Orders File
  ms_state.ord.forEach(row => {
      const sid = ms_cleanId(ms_findVal(row, ['suborderno', 'suborder', 'subordernumber', 'orderno', 'orderid']));
      if (sid) {
          const dateStr = String(ms_findVal(row, ['orderdate']) || '').substring(0, 10);
          masterOrdersMap.set(sid, { 
              sid: sid,
              sku: String(ms_findVal(row, ['sku', 'skuid', 'productsku']) || 'MISC_SKU').trim(), 
              qty: parseInt(ms_findVal(row, ['quantity', 'qty', 'units'])) || 1, 
              status: String(ms_findVal(row, ['reasonforcreditentry', 'status', 'orderstatus', 'deliverystatus']) || '').toUpperCase(), 
              date: parseDateString(dateStr),
              dateStr: dateStr,
              settlement: 0, gross: 0, retDed: 0, returnType: '' 
          });
      }
  });

  // 2. Add Payouts (Allows fallback matching if Orders missing)
  ms_state.pay.forEach(row => {
      const rawSid = String(ms_findVal(row, ['suborderno', 'suborder', 'subordernumber', 'orderno', 'orderid']) || '').trim();
      if (!rawSid || rawSid.includes('+') || rawSid.includes('(')) return; 
      const sid = rawSid.replace(/\.0$/, '');
      const net = parseFloat(String(ms_findVal(row, ['finalsettlementamount', 'netsettlementamount', 'banksettlementamount', 'totalpayout', 'netpayout', 'settlementamount'])).replace(/[^0-9.-]/g, '')) || 0;
      const gross = parseFloat(String(ms_findVal(row, ['totalsaleamount', 'grossamount'])).replace(/[^0-9.-]/g, '')) || 0;
      const retDed = (parseFloat(String(ms_findVal(row, ['returnshippingcharge'])).replace(/[^0-9.-]/g, '')) || 0) + (parseFloat(String(ms_findVal(row, ['returnpremium'])).replace(/[^0-9.-]/g, '')) || 0);

      if (sid && masterOrdersMap.has(sid)) { 
          const ord = masterOrdersMap.get(sid); ord.settlement += net; ord.gross += gross; ord.retDed += retDed; 
      } else if (sid) { 
          // Legacy fallback if no orders file uploaded
          const dateStr = String(ms_findVal(row, ['orderdate']) || '').substring(0, 10);
          masterOrdersMap.set(sid, { 
              sid: sid, sku: String(ms_findVal(row, ['sku', 'productsku', 'skuid']) || 'UNMAPPED_SKU').trim(), 
              qty: 1, status: net >= 0 ? 'DELIVERED' : 'RETURNED', 
              date: parseDateString(dateStr), dateStr: dateStr,
              settlement: net, gross: gross, retDed: retDed, returnType: '' 
          }); 
      }
  });
  
  // 3. Safe Returns Filtering (Strictly matches to orders)
  ms_state.ret.forEach(row => {
      const sid = ms_cleanId(ms_findVal(row, ['suborderno', 'suborder', 'subordernumber', 'orderid', 'orderno']));
      if (sid && masterOrdersMap.has(sid)) masterOrdersMap.get(sid).returnType = String(ms_findVal(row, ['returntype', 'typeofreturn', 'trackingtype']) || '').toUpperCase().includes('CUSTOMER') ? 'CUSTOMER' : 'RTO';
  });

  ms_applyDateFilter();
}

function ms_applyDateFilter() {
    const startStr = document.getElementById('ms_startDate').value;
    const endStr = document.getElementById('ms_endDate').value;
    let startD = startStr ? new Date(startStr) : null;
    let endD = endStr ? new Date(endStr) : null;
    if(endD) endD.setHours(23, 59, 59);

    currentFilteredOrders = Array.from(masterOrdersMap.values()).filter(ord => {
        if(!ord.date) return true;
        if(startD && ord.date < startD) return false;
        if(endD && ord.date > endD) return false;
        return true;
    });

    const skuMap = new Map();
    const dailyMap = new Map();

    currentFilteredOrders.forEach((val) => {
        // Build SKU Map
        if (!skuMap.has(val.sku)) skuMap.set(val.sku, { sku: val.sku, disp: 0, del: 0, cr: 0, rto: 0, can: 0, set: 0, gross: 0, retDed: 0, cost: window.appState.userSkus[val.sku] || 0 });
        const item = skuMap.get(val.sku); 
        item.set += val.settlement; item.gross += val.gross; item.retDed += val.retDed;
        
        let cDisp=0, cDel=0, cCr=0, cRto=0, cCan=0;

        if (val.status.includes('CANCEL')) { item.can += val.qty; cCan += val.qty; } else { item.disp += val.qty; cDisp += val.qty; }
        if (val.returnType === 'CUSTOMER' || val.status.includes('CUSTOMER') || (val.settlement < 0 && !val.status.includes('RTO'))) { item.cr += val.qty; cCr += val.qty; }
        else if (val.returnType === 'RTO' || val.status.includes('RTO')) { item.rto += val.qty; cRto += val.qty; }
        else if (val.status.includes('DELIVERED') || val.settlement > 0) { item.del += val.qty; cDel += val.qty; }

        // Build Daily Map
        if (val.dateStr) {
            if (!dailyMap.has(val.dateStr)) dailyMap.set(val.dateStr, { date: val.dateStr, disp: 0, del: 0, cr: 0, rto: 0, set: 0, costTotal: 0 });
            const day = dailyMap.get(val.dateStr);
            day.disp += cDisp; day.del += cDel; day.cr += cCr; day.rto += cRto; day.set += val.settlement;
            if((window.appState.userSkus[val.sku] || 0) > 0) day.costTotal += (cDel * window.appState.userSkus[val.sku]);
        }
    });

    ms_reconciledData = Array.from(skuMap.values()); 
    document.getElementById('ms_calcSection').classList.remove('hidden'); 
    ms_renderTable(); 
    ms_renderDailyTable(Array.from(dailyMap.values()));
    ms_computeTotals();
}

function ms_renderTable() {
  const tbody = document.getElementById('ms_skuTableBody'); tbody.innerHTML = '';
  ms_reconciledData.sort((a, b) => b.set - a.set);
  ms_reconciledData.forEach((item, index) => {
    const tr = document.createElement('tr'); const isMis = item.cost === 0; tr.className = `border-b border-slate-800/50 ${isMis ? 'bg-orange-500/10' : 'hover:bg-slate-800/30'} transition-colors`;
    tr.innerHTML = `<td class="py-4 px-6 font-bold ${isMis ? 'text-orange-400' : 'text-slate-200'}">${item.sku}</td><td class="py-4 px-6 text-right text-white">${item.disp}</td><td class="py-4 px-6 text-right text-emerald-400">${item.del}</td><td class="py-4 px-6 text-right text-rose-400">${item.rto} / ${item.cr} / ${item.can}</td><td class="py-4 px-6 text-right text-blue-400">₹${item.set.toFixed(2)}</td><td class="py-4 px-6 text-center"><input type="number" step="0.01" value="${item.cost || ''}" class="ms-cost-box w-20 bg-slate-900 border ${isMis ? 'border-orange-500' : 'border-slate-600'} text-white px-2 py-1.5 rounded-lg text-center outline-none focus:border-pink-500" data-index="${index}" /></td><td id="ms_tProf_${index}" class="py-4 px-6 text-right font-bold">₹0.00</td>`;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('.ms-cost-box').forEach(input => {
    let tid; input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index')); const nCost = parseFloat(e.target.value) || 0; ms_reconciledData[idx].cost = nCost;
      const tr = e.target.closest('tr'); const sc = tr.querySelector('td:nth-child(1)');
      if(nCost === 0 || isNaN(nCost)) { tr.classList.add('bg-orange-500/10'); sc.classList.add('text-orange-400'); sc.classList.remove('text-slate-200'); e.target.classList.add('border-orange-500'); e.target.classList.remove('border-slate-600'); } else { tr.classList.remove('bg-orange-500/10'); sc.classList.remove('text-orange-400'); sc.classList.add('text-slate-200'); e.target.classList.remove('border-orange-500'); e.target.classList.add('border-slate-600'); }
      ms_computeTotals(); clearTimeout(tid); tid = setTimeout(() => { window.appState.userSkus[ms_reconciledData[idx].sku] = nCost; ms_applyDateFilter(); if(window.appState.currentUser && db) setDoc(doc(db, 'users', window.appState.currentUser.uid, 'skus', 'memory'), { [ms_reconciledData[idx].sku]: nCost }, { merge: true }); }, 1000);
    });
  });
}

function ms_renderDailyTable(dailyData) {
    const tbody = document.getElementById('ms_dailyTableBody'); tbody.innerHTML = '';
    dailyData.sort((a, b) => new Date(b.date) - new Date(a.date));
    dailyData.forEach((day) => {
        const tr = document.createElement('tr'); tr.className = `border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors`;
        const profit = day.set - day.costTotal;
        tr.innerHTML = `<td class="py-4 px-6 font-bold text-white">${day.date}</td><td class="py-4 px-6 text-right">${day.disp}</td><td class="py-4 px-6 text-right text-emerald-400">${day.del}</td><td class="py-4 px-6 text-right text-orange-400">${day.rto}</td><td class="py-4 px-6 text-right text-rose-400">${day.cr}</td><td class="py-4 px-6 text-right text-blue-400">₹${day.set.toFixed(2)}</td><td class="py-4 px-6 text-right font-black ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}">₹${profit.toFixed(2)}</td>`;
        tbody.appendChild(tr);
    });
}

function ms_applyBulkCost() {
  const val = parseFloat(document.getElementById('ms_bulkCostInput').value); if (isNaN(val)) return; const bU = {};
  ms_reconciledData.forEach((item, index) => { if(item.cost === 0 || isNaN(item.cost)) { item.cost = val; bU[item.sku] = val; const inp = document.querySelector(`.ms-cost-box[data-index="${index}"]`); if(inp) { inp.value = val; inp.classList.remove('border-orange-500'); inp.classList.add('border-slate-600'); const tr = inp.closest('tr'); tr.classList.remove('bg-orange-500/10'); tr.querySelector('td:nth-child(1)').classList.remove('text-orange-400'); tr.querySelector('td:nth-child(1)').classList.add('text-slate-200'); } } });
  ms_computeTotals(); Object.assign(window.appState.userSkus, bU); ms_applyDateFilter(); if(window.appState.currentUser && db) setDoc(doc(db, 'users', window.appState.currentUser.uid, 'skus', 'memory'), bU, { merge: true });
}

function ms_computeTotals() {
  let tS = 0; let tDis = 0; let tD = 0; let tR = 0; let tG = 0; let grossOut = 0; let retDeductions = 0;
  ms_reconciledData.forEach((item, index) => {
    const tP = document.getElementById(`ms_tProf_${index}`);
    grossOut += item.gross; retDeductions += item.retDed;
    if (item.cost === 0 || isNaN(item.cost)) { if (tP) tP.innerHTML = `<span class="text-[10px] text-orange-400 font-black uppercase">Excluded</span>`; return; }
    tS += item.set; tDis += item.disp; tD += item.del; tR += (item.cr + item.rto + item.can); 
    const skuP = item.set - (item.del * item.cost); tG += skuP;
    if (tP) { tP.textContent = `₹${skuP.toFixed(2)}`; tP.className = `py-4 px-6 text-right font-black ${skuP >= 0 ? 'text-emerald-400' : 'text-rose-400'}`; }
  });
  
  let adSpend = 0;
  if(ms_state.ads && ms_state.ads.length > 0) {
      ms_state.ads.forEach(r => { adSpend += parseFloat(String(ms_findVal(r, ['totaladscost', 'adcost'])).replace(/[^0-9.-]/g, '')) || 0; });
  }

  const fP = tG - Math.abs(adSpend) - (parseFloat(document.getElementById('ms_lossInput').value) || 0);
  
  document.getElementById('ms_kpiGross').textContent = `₹${grossOut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  document.getElementById('ms_kpiReturnDed').textContent = `-₹${Math.abs(retDeductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  document.getElementById('ms_kpiAds').textContent = `-₹${Math.abs(adSpend).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  document.getElementById('ms_kpiSettlement').textContent = `₹${tS.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  document.getElementById('ms_kpiDispatched').textContent = tDis.toLocaleString();
  document.getElementById('ms_kpiDelivered').textContent = tD.toLocaleString(); 
  document.getElementById('ms_kpiReturns').textContent = tR.toLocaleString();
  
  document.getElementById('ms_kpiNetProfit').textContent = `₹${fP.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`; 
  document.getElementById('ms_kpiNetProfit').className = `text-4xl font-black mt-2 ${fP >= 0 ? 'text-emerald-300' : 'text-rose-400'}`;
  document.getElementById('ms_kpiNetProfitTotal').textContent = `Realized True Net Profit: ₹${fP.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  document.getElementById('ms_kpiNetProfitTotal').className = `px-3 py-1 rounded-lg text-[10px] ${fP >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`;
}
