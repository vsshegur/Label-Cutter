import { auth } from './auth.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
let lc_rawFiles = []; let lc_parsedData = []; let currentPlatform = 'flipkart';
let lc_customLogoBase64 = null;
const DEFAULT_BRAND_LOGO = "data:image/png;base64,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";

window.addEventListener('appUnlocked', () => {
    lc_setPlatform('flipkart');
    try { 
        const cached = localStorage.getItem('savedBrandLogo');
        lc_customLogoBase64 = (cached && cached.startsWith('data:image')) ? cached : DEFAULT_BRAND_LOGO; 
        document.getElementById('lc_logoPreview').src = lc_customLogoBase64; 
    } catch(e) { 
        lc_customLogoBase64 = DEFAULT_BRAND_LOGO; 
        document.getElementById('lc_logoPreview').src = lc_customLogoBase64; 
    }
});

document.getElementById('lc_logoInput').addEventListener('change', (e) => {
    const f = e.target.files[0]; if (!f) return; const r = new FileReader();
    r.onload = (ev) => {
        const img = new Image(); img.onload = () => {
            const cvs = document.createElement('canvas'); cvs.width = img.width; cvs.height = img.height; 
            const ctx = cvs.getContext('2d'); ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0,0,cvs.width,cvs.height); const d = imgData.data; 
            for (let i=0; i<d.length; i+=4) { const gray = (d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114); if(gray > 180) d[i+3]=0; else {d[i]=0; d[i+1]=0; d[i+2]=0; d[i+3]=255;} }
            ctx.putImageData(imgData, 0, 0); lc_customLogoBase64 = cvs.toDataURL('image/png'); 
            document.getElementById('lc_logoPreview').src = lc_customLogoBase64; 
            try { localStorage.setItem('savedBrandLogo', lc_customLogoBase64); } catch(e){}
        }; img.src = ev.target.result;
    }; r.readAsDataURL(f);
});

document.getElementById('lc_tabFk').addEventListener('click', () => lc_setPlatform('flipkart'));
document.getElementById('lc_tabMs').addEventListener('click', () => lc_setPlatform('meesho'));

function lc_setPlatform(platform) {
    currentPlatform = platform; document.getElementById('lc_results').classList.add('hidden'); lc_parsedData = [];
    if (platform === 'flipkart') {
        document.getElementById('lc_tabFk').className = "bg-blue-600 text-white px-6 py-2 rounded-lg font-black text-xs uppercase shadow-md transition-all cursor-pointer";
        document.getElementById('lc_tabMs').className = "text-slate-500 bg-transparent px-6 py-2 rounded-lg font-black text-xs uppercase transition-all cursor-pointer";
        document.getElementById('lc_platformName').textContent = "Flipkart";
        document.getElementById('lc_platformName').className = "text-blue-600 relative z-10";
        document.getElementById('lc_dropzone').className = "border-[3px] border-dashed rounded-2xl p-8 text-center flex flex-col justify-center items-center relative border-blue-400 bg-blue-50/10 cursor-pointer min-h-[220px]";
        document.getElementById('lc_printFormat').innerHTML = `<option value="fk-4x6-no-inv" selected>4" x 6" Without Invoice</option><option value="fk-4x6-with-inv">4" x 6" With Invoice</option><option value="fk-3x5-no-inv">3" x 5" Without Invoice</option><option value="fk-3x5-with-inv">3" x 5" With Invoice</option>`;
    } else {
        document.getElementById('lc_tabMs').className = "bg-pink-600 text-white px-6 py-2 rounded-lg font-black text-xs uppercase shadow-md transition-all cursor-pointer";
        document.getElementById('lc_tabFk').className = "text-slate-500 bg-transparent px-6 py-2 rounded-lg font-black text-xs uppercase transition-all cursor-pointer";
        document.getElementById('lc_platformName').textContent = "Meesho";
        document.getElementById('lc_platformName').className = "text-pink-600 relative z-10";
        document.getElementById('lc_dropzone').className = "border-[3px] border-dashed rounded-2xl p-8 text-center flex flex-col justify-center items-center relative border-pink-400 bg-pink-50/10 cursor-pointer min-h-[220px]";
        document.getElementById('lc_printFormat').innerHTML = `<option value="ms-3x5-no-inv" selected>3" x 5" Without Invoice</option><option value="ms-3x5-with-inv">3" x 5" With Invoice</option><option value="ms-4x4-with-inv">4" x 4" With Invoice</option><option value="ms-4x6-with-inv">4" x 6" With Store Link</option>`;
    }
}

document.getElementById('lc_pdfFileInput').addEventListener('change', e => {
    const files = Array.from(e.target.files); if(files.length === 0) return;
    files.forEach(f => lc_rawFiles.push({ id: Math.random().toString(), name: f.name, file: f }));
    lc_updateUI(); document.getElementById('lc_pdfFileInput').value = ''; 
});

window.lc_removeFile = function(id) { lc_rawFiles = lc_rawFiles.filter(f => f.id !== id); lc_updateUI(); };

function lc_updateUI() {
    const list = document.getElementById('lc_fileList'); list.innerHTML = '';
    document.getElementById('lc_fileCount').textContent = lc_rawFiles.length;
    if (lc_rawFiles.length > 0) {
        document.getElementById('lc_fileManager').classList.remove('hidden'); document.getElementById('lc_processBtn').disabled = false;
        document.getElementById('lc_processBtnText').textContent = `Process ${lc_rawFiles.length} File(s)`;
        lc_rawFiles.forEach(item => {
            const div = document.createElement('div'); div.className = "flex items-center justify-between bg-white dark:bg-slate-800 px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 shadow-sm relative z-50";
            div.innerHTML = `<span class="truncate font-bold max-w-[200px]">${item.name}</span><button type="button" onclick="lc_removeFile('${item.id}')" class="text-rose-500 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">✕</button>`;
            list.appendChild(div);
        });
    } else {
        document.getElementById('lc_fileManager').classList.add('hidden'); document.getElementById('lc_processBtn').disabled = true; document.getElementById('lc_processBtnText').textContent = "Process Labels";
    }
}

document.getElementById('lc_resetBtn').addEventListener('click', () => { lc_rawFiles = []; document.getElementById('lc_pdfFileInput').value = ''; lc_updateUI(); });

function lc_groupLines(items) {
    const pts = items.filter(it => it.str && it.str.trim().length > 0).map(it => ({ x: it.transform[4], y: it.transform[5], str: it.str, width: it.width || (it.str.length * 5), height: it.height || Math.abs(it.transform[3]) || 9, items: [it] }));
    pts.sort((a,b) => b.y - a.y || a.x - b.x); const lines = []; const TOL = 2.5;
    for (const p of pts){ let line = lines.find(l => Math.abs(l.y - p.y) < TOL); if (!line){ line = { y: p.y, items: [] }; lines.push(line); } line.items.push(p); }
    lines.forEach(l => l.items.sort((a,b) => a.x - b.x)); lines.forEach(l => l.text = l.items.map(i => i.str).join(' ').replace(/\s+/g,' ').trim()); lines.sort((a,b) => b.y - a.y); return lines;
}

function lc_getBounds(lines, yStart, yEnd) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const l of lines){
        if (l.y < yStart || l.y > yEnd) continue;
        for (const it of l.items){ if (!it.str.trim()) continue; if (it.x < minX) minX = it.x; if (it.x + it.width > maxX) maxX = it.x + it.width; if (it.y < minY) minY = it.y; if (it.y + it.height > maxY) maxY = it.y + it.height; }
    } return { minX, maxX, minY, maxY };
}

async function lc_extract(page, platform) {
    const textContent = await page.getTextContent(); const lines = lc_groupLines(textContent.items); const fullText = lines.map(l => l.text).join(' ');
    const v = page.view; const pdfW = v[2] - v[0]; const pdfH = v[3] - v[1];
    let splitY = 0; let fkGstin = null; let msGap = null; let isStandaloneLabel = false; let soldBy = 'Unknown Seller';

    const midMarker = lines.find(l => { const y = l.y; if (y < pdfH * 0.20 || y > pdfH * 0.65) return false; return l.text.toUpperCase().startsWith('TAX INVOICE') || l.text.toUpperCase().includes('ORIGINAL FOR RECIPIENT'); });
    if (midMarker) { splitY = midMarker.y + 15; } else { isStandaloneLabel = true; splitY = 0; }

    const sbMatch = fullText.match(/Sold [Bb]y\s*[:]?\s*([^,]+?)(?:\,|\s+34\/3\/16|\s+SHEGUR|\s+GSTIN)/i);
    if (sbMatch && sbMatch[1]) { let extracted = sbMatch[1].trim(); if(extracted.length > 3) soldBy = extracted.substring(0, 40); 
    } else { if (fullText.toUpperCase().includes('VIJAYALAXMI TEXTILES')) soldBy = 'VIJAYALAXMI TEXTILES'; if (fullText.toUpperCase().includes('VIPUL TEXTILES')) soldBy = 'VIPUL TEXTILES'; }

    if (platform === 'flipkart') { const gstinLine = lines.find(l => l.text.includes('GSTIN:')); if (gstinLine) { const it = gstinLine.items.find(i => i.str.includes('GSTIN:')); if (it) fkGstin = { x: it.x, y: it.y }; } }

    const padX = 6; const padY = 12; let lBox, iBox;
    if (isStandaloneLabel) {
        const lBounds = lc_getBounds(lines, 0, pdfH);
        const lLeft = isFinite(lBounds.minX) ? Math.max(0, lBounds.minX - padX) : 0; const lRight = isFinite(lBounds.maxX) ? Math.min(pdfW, lBounds.maxX + padX) : pdfW;
        const lBot = isFinite(lBounds.minY) ? Math.max(0, lBounds.minY - padY) : 0; const lTop = isFinite(lBounds.maxY) ? Math.min(pdfH, lBounds.maxY + padY) : pdfH;
        lBox = { left: lLeft, right: lRight, bottom: lBot, top: lTop, width: lRight - lLeft, height: lTop - lBot }; iBox = { left: 0, right: pdfW, bottom: 0, top: pdfH, width: pdfW, height: pdfH };
    } else {
        const lBounds = lc_getBounds(lines, splitY, pdfH);
        const lLeft = isFinite(lBounds.minX) ? Math.max(0, lBounds.minX - padX) : 10; const lTop = isFinite(lBounds.maxY) ? Math.min(pdfH, lBounds.maxY + padY) : pdfH; let lRight = pdfW - lLeft; if (platform === 'flipkart') lRight = isFinite(lBounds.maxX) ? Math.min(pdfW, lBounds.maxX + padX) : (pdfW - lLeft);
        lBox = { left: lLeft, right: lRight, bottom: splitY, top: lTop, width: lRight - lLeft, height: lTop - splitY };
        const iBounds = lc_getBounds(lines, 0, splitY - 5); const iLeft = isFinite(iBounds.minX) ? Math.max(0, iBounds.minX - padX) : 0; const iRight = isFinite(iBounds.maxX) ? Math.min(pdfW, iBounds.maxX + padX) : pdfW; const iBot = isFinite(iBounds.minY) ? Math.max(0, iBounds.minY - padY) : 0;
        iBox = { left: iLeft, right: iRight, bottom: iBot, top: splitY - 5, width: iRight - iLeft, height: (splitY - 5) - iBot };
    }

    if (platform === 'meesho') {
        let headerLine = lines.find(l => /IF UNDELIVERED|RETURN TO/i.test(l.text)); let productLine = lines.find(l => /PRODUCT DETAILS|SKU SIZE QTY/i.test(l.text)); let headY = headerLine ? headerLine.y : pdfH * 0.85; let prodY = productLine ? productLine.y : pdfH * 0.35; let addressLines = lines.filter(l => l.y < headY - 2 && l.y > prodY + 2 && l.items.some(i => i.x < pdfW * 0.48)); let gapTopY = headY - 15; let minX = headerLine ? headerLine.items[0].x : 15; let maxX = minX + 120;
        if (addressLines.length > 0) { gapTopY = Math.min(...addressLines.map(l => l.y)); let allItems = addressLines.flatMap(l => l.items.filter(i => i.x < pdfW * 0.48)); if(allItems.length > 0) { minX = Math.min(...allItems.map(i => i.x)); maxX = Math.max(...allItems.map(i => i.x + i.width)); } }
        msGap = { x: minX, y: prodY + 10, w: Math.min(Math.max(maxX, minX + 120), (pdfW*0.48)-5) - minX, h: Math.max((gapTopY - 5) - (prodY + 10), 15) };
    }

    let qty = 1; let sku = 'Unknown SKU'; let courier = 'Unknown Courier';
    const cleanFull = fullText.replace(/\s+/g, ' '); const cMatch = cleanFull.match(/E-Kart|Shadowfax|Delhivery|Xpress Bees|Xpressbees|Valmo|Ecom Express|DTDC/i); if(cMatch) courier = cMatch[0];

    if (platform === 'flipkart') {
        const tqMatch = cleanFull.match(/TOTAL\s*QTY\s*[:\-]?\s*(\d+)/i); let totalQtyVal = tqMatch ? parseInt(tqMatch[1], 10) : null;
        let fkSkus = []; let words = cleanFull.split(/\s+/);
        for (let i = 0; i < words.length; i++) {
            if (/IMEI\/SrNo/i.test(words[i])) {
                let candidate = "";
                for (let j = i - 1; j >= Math.max(0, i - 25); j--) {
                    let w = words[j].replace(/\|/g, '').trim(); if (!w) continue; if (/^[\-\+]?[0-9,]+(\.[0-9]+)?%?$/.test(w)) continue; if (/^x$/i.test(w)) continue;
                    if (/^(Free|L|M|S|XL|XXL|Towel|Towels|Pack|of|Piece|Pieces|Cotton|Microfiber|GSM|CESS:|IGST:|CGST:|SGST:|Amount|Tax|Invoice|HSN:|Rate|Total|Discount|Value|Rs\.?|INR|Color|Colour|Multi|Design|Plain|Printed|Soft|Gross|Handling|Fee)$/i.test(w)) continue;
                    if (w.length >= 3) { candidate = w; if (j > 0) { let prevW = words[j-1].replace(/\|/g, '').trim(); if (/^(Shopsy|FKRT|FLIPKART)$/i.test(prevW)) candidate = prevW + '_' + candidate; } break; }
                }
                if (candidate && !fkSkus.includes(candidate)) fkSkus.push(candidate.replace(/^Shopsy\s+/i, 'Shopsy_'));
            }
        }
        if (fkSkus.length > 0) { let uniqueSkus = [...new Set(fkSkus)]; sku = uniqueSkus.join(' + '); qty = totalQtyVal !== null ? totalQtyVal : fkSkus.length;
        } else { const safeText = cleanFull.replace(/GSTIN\s*[:\-]?\s*[A-Z0-9]+/ig, ''); const sMatch = safeText.match(/(?:FSN|SKU(?: ID)?)\s*[:\-]?\s*([A-Za-z0-9_\-\.\/\^\+]+)/i); if (sMatch && !/^(ID|Description|QTY|Name|Price|Tax|Invoice|Amount)$/i.test(sMatch[1])) { sku = sMatch[1].trim(); } if (totalQtyVal !== null) qty = totalQtyVal; }
    } else {
        let detailsMatch = cleanFull.match(/Product Details(.*?)TAX INVOICE/i) || cleanFull.match(/Product Details(.*?)Original For Recipient/i);
        if (detailsMatch) {
            let block = detailsMatch[1].replace(/SKU|Size|Qty|Color|Order No\.?|Free Size|Multicolor/ig, '').replace(/\|/g, ' ').trim(); let words = block.split(/\s+/).filter(w => w.length > 0);
            if (words.length > 0) { sku = words[0]; for(let w = 1; w < words.length; w++) { if(!isNaN(words[w]) && parseInt(words[w]) < 100 && parseInt(words[w]) > 0) { qty = parseInt(words[w]); break; } } }
        } else { const fbm = cleanFull.match(/([A-Za-z0-9_\-\.\/]{4,50})\s+(?:Free\s*Size|[A-Za-z0-9\-]+)\s+(\d{1,3})/i); if (fbm) { sku = fbm[1]; qty = parseInt(fbm[2], 10); } }
    }
    const allBounds2 = lc_getBounds(lines, 0, pdfH);
    const fullBox = { left: isFinite(allBounds2.minX) ? Math.max(0, allBounds2.minX - padX) : 10, right: isFinite(allBounds2.maxX) ? Math.min(pdfW, allBounds2.maxX + padX) : pdfW - 10, bottom: isFinite(allBounds2.minY) ? Math.max(0, allBounds2.minY - padY) : 10, top: isFinite(allBounds2.maxY) ? Math.min(pdfH, allBounds2.maxY + padY) : pdfH - 10 };

    return { pdfW, pdfH, splitY, lBox, iBox, fullBox, fkGstin, msGap, sku, qty, courier, soldBy };
}

function lc_readFile(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(new Uint8Array(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsArrayBuffer(file); }); }

document.getElementById('lc_processBtn').addEventListener('click', async () => {
    if (lc_rawFiles.length === 0) return;
    try {
        lc_parsedData = []; document.getElementById('lc_results').classList.add('hidden'); document.getElementById('loader').classList.remove('hidden'); document.getElementById('lc_processBtn').disabled = true;
        let tPages = 0; let pCount = 0; const docs = [];
        for (const item of lc_rawFiles) { const buf = await lc_readFile(item.file); const pdf = await pdfjsLib.getDocument({ data: buf }).promise; docs.push(pdf); tPages += pdf.numPages; }
        for (let fIdx = 0; fIdx < lc_rawFiles.length; fIdx++) {
          const pdf = docs[fIdx];
          for (let pIdx = 1; pIdx <= pdf.numPages; pIdx++) {
            pCount++; await new Promise(r => setTimeout(r, 0)); 
            const page = await pdf.getPage(pIdx); const data = await lc_extract(page, currentPlatform);
            lc_parsedData.push({ fileIndex: fIdx, pageIndex: pIdx - 1, w: data.pdfW, h: data.pdfH, splitY: data.splitY, lBox: data.lBox, iBox: data.iBox, fullBox: data.fullBox, fkPos: data.fkGstin, msPos: data.msGap, sku: data.sku, qty: data.qty, courier: data.courier, soldBy: data.soldBy });
          }
        }
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('lc_metricTotal').textContent = lc_parsedData.length; document.getElementById('lc_metricPieces').textContent = lc_parsedData.reduce((s,i)=>s+i.qty,0);
        document.getElementById('lc_results').classList.remove('hidden'); document.getElementById('lc_processBtn').disabled = false;
    } catch (err) { console.error(err); alert("Extraction Error"); document.getElementById('loader').classList.add('hidden'); document.getElementById('lc_processBtn').disabled = false; }
});

async function lc_generatePdf() {
    const { PDFDocument, rgb, StandardFonts } = PDFLib;
    const outDoc = await PDFDocument.create(); const font = await outDoc.embedFont(StandardFonts.HelveticaBold); const fontReg = await outDoc.embedFont(StandardFonts.Helvetica);
    const isMs = currentPlatform === 'meesho'; const formatSelection = document.getElementById('lc_printFormat').value; const incInv = formatSelection.includes('with-inv'); const is4x4Combined = formatSelection === 'ms-4x4-with-inv'; const is4x6Combined = formatSelection === 'ms-4x6-with-inv'; const incSum = document.getElementById('lc_includeSummary').checked; const margin = 1 * 2.83465;
    const srcDocs = await Promise.all(lc_rawFiles.map(async f => await PDFDocument.load(await lc_readFile(f.file))));
    
    let logo = null;
    try { if (lc_customLogoBase64 && lc_customLogoBase64.startsWith('data:image')) { logo = await outDoc.embedPng(lc_customLogoBase64); } else if (lc_customLogoBase64) { const imgBytes = await fetch(lc_customLogoBase64).then((res) => res.arrayBuffer()); logo = await outDoc.embedPng(imgBytes); } } catch(e) {}

    const isMulti = item => (item.qty > 1 || (item.sku && item.sku.includes('+'))); const sortFn = (a, b) => { const cComp = (a.courier||'').localeCompare(b.courier||''); if (cComp !== 0) return cComp; return (a.sku||'').localeCompare(b.sku||''); };
    const sortedData = [...lc_parsedData.filter(i => !isMulti(i)).sort(sortFn), ...lc_parsedData.filter(i => isMulti(i)).sort(sortFn)];

    for (const item of sortedData) {
        const doc = srcDocs[item.fileIndex]; const srcPage = doc.getPage(item.pageIndex);
        if (is4x4Combined) {
            const p = outDoc.addPage([288, 288]); p.drawRectangle({ x: 0, y: 0, width: 288, height: 288, color: rgb(1,1,1) });
            const embBox = { left: item.fullBox.left, bottom: item.fullBox.bottom, right: item.fullBox.right, top: item.fullBox.top }; const embedded = await outDoc.embedPage(srcPage, embBox);
            const eW = embBox.right - embBox.left; const eH = embBox.top - embBox.bottom; const pW = 288 - (margin * 2); const pH = 288 - (margin * 2); const scale = Math.min(pW / eW, pH / eH);
            p.drawPage(embedded, { x: margin + (pW - (eW*scale)) / 2, y: margin + (pH - (eH*scale)) / 2, xScale: scale, yScale: scale });
        } else if (is4x6Combined) {
            const p = outDoc.addPage([288, 432]); p.drawRectangle({ x: 0, y: 0, width: 288, height: 432, color: rgb(1,1,1) });
            const printableW = 288 - (margin * 2); const printableH = 432 - (margin * 2); const bannerH = 95; const contentH = printableH - bannerH - margin;
            const embBox = { left: item.fullBox.left, bottom: item.fullBox.bottom, right: item.fullBox.right, top: item.fullBox.top }; const embedded = await outDoc.embedPage(srcPage, embBox);
            const eW = embBox.right - embBox.left; const eH = embBox.top - embBox.bottom; const scale = Math.min(printableW / eW, contentH / eH);
            p.drawPage(embedded, { x: margin + (printableW - (eW*scale)) / 2, y: margin + bannerH + margin + (contentH - (eH*scale)) / 2, xScale: scale, yScale: scale });
            p.drawRectangle({ x: margin, y: margin, width: printableW, height: bannerH, color: rgb(0.97, 0.97, 0.97), borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
            let storeUrl = /VIPUL/i.test(item.soldBy) ? "https://www.meesho.com/vipultextiless" : "https://www.meesho.com/shegursvijayalaxmitextiles";
            try { const qrDataUrl = await QRCode.toDataURL(storeUrl, { width: 150, margin: 1 }); const qrImage = await outDoc.embedPng(Uint8Array.from(atob(qrDataUrl.split(',')[1]), c => c.charCodeAt(0)));
                p.drawImage(qrImage, { x: margin + 12, y: margin + (bannerH - 75) / 2, width: 75, height: 75 }); const textX = margin + 12 + 75 + 15;
                p.drawText("Visit Store", { x: textX, y: margin + bannerH - 28, size: 11, font, color: rgb(0.1, 0.1, 0.1) }); p.drawText("Scan QR to open brand store.", { x: textX, y: margin + bannerH - 44, size: 8.5, font: fontReg, color: rgb(0.3, 0.3, 0.3) }); p.drawText(storeUrl, { x: textX, y: margin + bannerH - 60, size: 7, font: fontReg, color: rgb(0.4, 0.4, 0.4) });
            } catch (e) {}
        } else {
            const is4x6Standard = formatSelection.includes('4x6'); const embBox = { left: item.lBox.left, bottom: item.lBox.bottom, right: item.lBox.right, top: item.lBox.top }; const embedded = await outDoc.embedPage(srcPage, embBox);
            const embW = embBox.right - embBox.left; const embH = embBox.top - embBox.bottom; const baseW = is4x6Standard ? 288 : 216; const baseH = is4x6Standard ? 432 : 360; const labelFw = (embW > embH) ? baseH : baseW; const labelFh = (embW > embH) ? baseW : baseH; 
            const p1 = outDoc.addPage([labelFw, labelFh]); p1.drawRectangle({ x: 0, y: 0, width: labelFw, height: labelFh, color: rgb(1,1,1) }); 
            const sw = labelFw - (margin * 2); const sh = labelFh - (margin * 2); const scale = Math.min(sw / embW, sh / embH); const xOff = margin + (sw - (embW*scale)) / 2; const yOff = margin + (sh - (embH*scale)) / 2;
            p1.drawPage(embedded, { x: xOff, y: yOff, xScale: scale, yScale: scale });
            if (currentPlatform === 'flipkart' && logo && item.fkPos) { p1.drawImage(logo, { x: xOff + ((item.fkPos.x - embBox.left + 125)*scale), y: yOff + ((item.fkPos.y - embBox.bottom - 2)*scale), width: 60*scale, height: 18*scale }); }
            if (currentPlatform === 'meesho' && logo && item.msPos) { let lh = Math.min(26 * scale, item.msPos.h * scale * 0.90); if (lh < 15) lh = 20 * scale; let lw = lh * 3.33; const lx = xOff + ((item.msPos.x - embBox.left) * scale) + ((item.msPos.w * scale)/2) - (lw/2); const ly = yOff + ((item.msPos.y - embBox.bottom) * scale) + ((item.msPos.h * scale)/2) - (lh/2); p1.drawRectangle({ x: lx-2, y: ly-2, width: lw+4, height: lh+4, color: rgb(1,1,1) }); p1.drawImage(logo, { x: lx, y: ly, width: lw, height: lh }); }
            if (incInv && item.iBox) {
                const embeddedInv = await outDoc.embedPage(srcPage, item.iBox); const invW = item.iBox.right - item.iBox.left; const invH = item.iBox.top - item.iBox.bottom; let invFw, invFh;
                if (isMs) { invFw = labelFw; invFh = labelFh; } else { if (is4x6Standard) { invFw = (invW > invH) ? 432 : 288; invFh = (invW > invH) ? 288 : 432; } else { invFw = 360; invFh = 216; } }
                const p2 = outDoc.addPage([invFw, invFh]); p2.drawRectangle({ x: 0, y: 0, width: invFw, height: invFh, color: rgb(1,1,1) }); const iScale = Math.min((invFw - margin*2) / invW, (invFh - margin*2) / invH); p2.drawPage(embeddedInv, { x: margin + ((invFw - margin*2) - (invW*iScale)) / 2, y: margin + ((invFh - margin*2) - (invH*iScale)) / 2, xScale: iScale, yScale: iScale });
            }
        }
    }

    if (incSum) {
      let sp = outDoc.addPage([216, 360]); let y = 345; const skus = {}; const couriers = {}; const sellers = {};
      lc_parsedData.forEach(item => {
          if (!couriers[item.courier]) { couriers[item.courier] = 0; } couriers[item.courier] += 1;
          if (!sellers[item.soldBy]) { sellers[item.soldBy] = { items: 0, orders: 0 }; } sellers[item.soldBy].items += item.qty; sellers[item.soldBy].orders += 1;
          const key = item.sku + "|||" + item.qty; if (!skus[key]) { skus[key] = { sku: item.sku, qtyPerOrder: item.qty, orders: 0 }; } skus[key].orders += 1;
      });
      sp.drawRectangle({ x: 5, y: y-5, width: 206, height: 15, color: rgb(0,0,0) }); sp.drawText("DELIVERY PARTNERS", { x: 10, y: y, size: 9, font, color: rgb(1,1,1) }); sp.drawText("PARCELS", { x: 160, y: y, size: 9, font, color: rgb(1,1,1) }); y-=14;
      Object.entries(couriers).forEach(([c, n]) => { if (y<15) { sp=outDoc.addPage([216,360]); y=345; } sp.drawText(c, { x: 10, y, size: 8, font }); sp.drawText(String(n), { x: 180, y, size: 10, font }); sp.drawLine({ start: {x:5,y:y-3}, end: {x:211,y:y-3}, thickness: 0.5, color: rgb(0.8,0.8,0.8) }); y-=14; }); y-=10;
      if (y<30) { sp=outDoc.addPage([216,360]); y=345; } sp.drawRectangle({ x: 5, y: y-5, width: 206, height: 15, color: rgb(0,0,0) }); sp.drawText("SOLD BY", { x: 10, y: y, size: 9, font, color: rgb(1,1,1) }); sp.drawText("ITEMS", { x: 140, y: y, size: 9, font, color: rgb(1,1,1) }); sp.drawText("ORDS", { x: 180, y: y, size: 9, font, color: rgb(1,1,1) }); y-=14;
      Object.entries(sellers).forEach(([s, data]) => { if (y<25) { sp=outDoc.addPage([216,360]); y=345; } let line1 = s.substring(0, 25); let line2 = s.substring(25, 50); sp.drawText(line1, { x: 10, y, size: 8, font }); if (line2) sp.drawText(line2, { x: 10, y: y-10, size: 8, font }); sp.drawText(String(data.items), { x: 145, y, size: 10, font }); sp.drawText(String(data.orders), { x: 185, y, size: 10, font }); let yStep = line2 ? 22 : 14; sp.drawLine({ start: {x:5,y:y-yStep+3}, end: {x:211,y:y-yStep+3}, thickness: 0.5, color: rgb(0.8,0.8,0.8) }); y-=yStep; }); y-=10;
      if (y<30) { sp=outDoc.addPage([216,360]); y=345; } sp.drawRectangle({ x: 5, y: y-5, width: 206, height: 15, color: rgb(0,0,0) }); sp.drawText("SKU", { x: 10, y: y, size: 9, font, color: rgb(1,1,1) }); sp.drawText("QTY/ORD", { x: 135, y: y, size: 9, font, color: rgb(1,1,1) }); sp.drawText("ORDERS", { x: 180, y: y, size: 9, font, color: rgb(1,1,1) }); y-=14;
      Object.values(skus).sort((a, b) => a.sku.localeCompare(b.sku) || a.qtyPerOrder - b.qtyPerOrder).forEach(item => { let line1 = item.sku.substring(0, 28); let line2 = item.sku.substring(28, 56); if (y < (line2 ? 25 : 15)) { sp = outDoc.addPage([216, 360]); y = 345; } sp.drawText(line1, { x: 10, y, size: 8, font }); if (line2) sp.drawText(line2, { x: 10, y: y - 10, size: 8, font }); sp.drawText(String(item.qtyPerOrder), { x: 145, y, size: 10, font }); sp.drawText(String(item.orders), { x: 191, y, size: 10, font }); let yStep = line2 ? 22 : 14; sp.drawLine({ start: {x:5, y: y - yStep + 3}, end: {x:211, y: y - yStep + 3}, thickness: 0.5, color: rgb(0.8,0.8,0.8) }); y -= yStep; });
    }

    const pdfBytes = await outDoc.save(); 
    if(window.auth && window.auth.currentUser) {
        const tx = lc_dbLocal.transaction('pdfs', 'readwrite');
        tx.objectStore('pdfs').put({ id: Date.now(), userId: window.auth.currentUser.uid, platform: currentPlatform, totalOrders: lc_parsedData.length, totalPieces: lc_parsedData.reduce((s,i)=>s+i.qty,0), data: pdfBytes, timestamp: Date.now() });
        tx.oncomplete = () => lc_loadRecoveredPdfs();
    }
    return pdfBytes;
}

document.getElementById('lc_downloadBtn').addEventListener('click', async () => {
    try { const bytes = await lc_generatePdf(); const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })); const a = document.createElement('a'); a.href = url; const fmt = document.getElementById('lc_printFormat').value; const sizeName = fmt.includes('4x6') ? '4x6' : (fmt.includes('4x4') ? '4x4' : '3x5'); a.download = `Shegurs_${currentPlatform.toUpperCase()}_${sizeName}_${new Date().toISOString().slice(0,10)}.pdf`; a.click(); URL.revokeObjectURL(url); } catch (e) { alert(e.message); }
});

document.getElementById('lc_previewBtn').addEventListener('click', async () => {
    try { const bytes = await lc_generatePdf(); const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })); window.open(url, '_blank'); setTimeout(()=>URL.revokeObjectURL(url), 10000); } catch (e) { alert(e.message); }
});

let lc_dbLocal; const lc_dbRequest = indexedDB.open("ShegursLabelDB", 6);
lc_dbRequest.onupgradeneeded = (e) => { lc_dbLocal = e.target.result; if (!lc_dbLocal.objectStoreNames.contains('pdfs')) { lc_dbLocal.createObjectStore('pdfs', { keyPath: 'id' }).createIndex('userId', 'userId', { unique: false }); } };
lc_dbRequest.onsuccess = (e) => { lc_dbLocal = e.target.result; };

window.addEventListener('appUnlocked', () => { if (window.auth && window.auth.currentUser) lc_loadRecoveredPdfs(); });

function lc_loadRecoveredPdfs() {
    if (!lc_dbLocal || !window.app_isAppUnlocked || !window.auth.currentUser) return;
    const tx = lc_dbLocal.transaction('pdfs', 'readwrite'); const req = tx.objectStore('pdfs').getAll();
    req.onsuccess = () => {
        const now = Date.now(); const validItems = []; const currentUid = window.auth.currentUser.uid;
        req.result.forEach(item => { const ageHours = (now - item.timestamp) / (1000 * 60 * 60); if (ageHours >= 6) tx.objectStore('pdfs').delete(item.id); else if (item.userId === currentUid) validItems.push(item); });
        validItems.sort((a,b) => b.timestamp - a.timestamp); lc_renderRecoveryList(validItems);
    };
}

function lc_renderRecoveryList(items) {
    const panel = document.getElementById('recoveryPanel'); const list = document.getElementById('savedBatchesList'); list.innerHTML = '';
    if (items.length === 0 || !window.app_isAppUnlocked) { panel.classList.add('hidden'); return; } panel.classList.remove('hidden');
    items.forEach(item => {
        const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); const pColor = item.platform === 'flipkart' ? 'text-blue-600' : 'text-pink-600'; const li = document.createElement('li'); li.className = "flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm";
        li.innerHTML = `<div><span class="font-black text-sm uppercase ${pColor}">${item.platform}</span><span class="text-[10px] font-bold text-slate-500 ml-2 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">${timeStr}</span><div class="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">${item.totalOrders} Orders | ${item.totalPieces} Items</div></div><div class="flex gap-2"><button onclick="lc_handleRecovery(${item.id}, 'preview')" class="bg-white dark:bg-slate-800 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600">Preview</button><button onclick="lc_handleRecovery(${item.id}, 'download')" class="bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg">Save</button><button onclick="lc_handleRecovery(${item.id}, 'delete')" class="bg-rose-50 dark:bg-rose-500/10 text-rose-600 text-[10px] font-black uppercase px-2 py-1.5 rounded-lg border border-rose-200">✕</button></div>`; list.appendChild(li);
    });
}

window.lc_handleRecovery = function(id, action) {
    if (!lc_dbLocal) return; const tx = lc_dbLocal.transaction('pdfs', action === 'delete' ? 'readwrite' : 'readonly'); const store = tx.objectStore('pdfs');
    if (action === 'delete') { store.delete(id); tx.oncomplete = () => lc_loadRecoveredPdfs(); return; }
    const req = store.get(id); req.onsuccess = () => { if (!req.result) return; const bytes = req.result.data; const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })); if (action === 'download') { const a = document.createElement('a'); a.href = url; a.download = `Shegurs_${req.result.platform.toUpperCase()}_Recovered_${id}.pdf`; a.click(); URL.revokeObjectURL(url); } else if (action === 'preview') { window.open(url, '_blank'); setTimeout(() => URL.revokeObjectURL(url), 10000); } };
};
