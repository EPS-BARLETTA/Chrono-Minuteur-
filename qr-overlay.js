/* QR Overlay minimal — fond blanc, marge, PNG, plein écran */
(function(){
  window.showQROverlay = function(payloadObj, filenameBase="QR_ScanProf"){
    const payload = JSON.stringify([payloadObj]);
    let wrap = document.getElementById('qr-ov-wrap');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id='qr-ov-wrap';
      wrap.innerHTML = `
        <style>
          #qr-ov-wrap{position:fixed;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.6);z-index:99999}
          #qr-ov-card{background:#121a33;color:#eef2ff;border:1px solid rgba(255,255,255,.08);border-radius:16px;width:min(92vw,760px);padding:16px;box-shadow:0 10px 32px rgba(0,0,0,.45)}
          #qr-ov-zone{display:grid;place-items:center}
          #qr-ov-zone .white{background:#fff;border:1px solid #d1d5db;border-radius:12px;padding:16px}
          .row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:10px}
          .btn{padding:10px 14px;border-radius:10px;border:none;cursor:pointer;font-weight:700}
          .btn1{background:#4f46e5;color:#fff}.btn2{background:#10b981;color:#083d31}.btn3{background:transparent;color:#aab4cc;border:1px dashed rgba(255,255,255,.3)}
          pre{margin-top:8px;background:#0e1530;border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:8px;color:#cbd5e1;font:12px ui-monospace,Menlo,Consolas,monospace;max-height:220px;overflow:auto}
          #qr-full{position:fixed;inset:0;background:#fff;display:none;place-items:center;z-index:100000}
          #qr-full .inner{display:grid;place-items:center;gap:16px}
          #qr-full .white{background:#fff;padding:20px}
          #qr-full .close{position:fixed;top:14px;right:14px}
        </style>
        <div id="qr-ov-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <h3>QR compatible ScanProf</h3>
            <button id="qr-ov-close" class="btn btn3">Fermer</button>
          </div>
          <div id="qr-ov-zone"><div class="white"><div id="qr-ov-slot"></div></div></div>
          <div class="row">
            <button id="qr-ov-regen" class="btn btn1">Régénérer</button>
            <button id="qr-ov-full" class="btn btn1">Plein écran</button>
            <button id="qr-ov-dl" class="btn btn2">Télécharger PNG</button>
          </div>
          <pre id="qr-ov-json" aria-label="JSON encodé"></pre>
        </div>
        <div id="qr-full">
          <button class="btn btn3 close">Fermer</button>
          <div class="inner">
            <div class="white"><div id="qr-full-slot"></div></div>
            <div class="row"><button id="qr-full-dl" class="btn btn2">Télécharger PNG</button></div>
          </div>
        </div>
      `;
      document.body.appendChild(wrap);
      document.getElementById('qr-ov-close').onclick=()=>wrap.remove();
      document.querySelector('#qr-full .close').onclick=()=>{document.getElementById('qr-full').style.display='none';};
      document.getElementById('qr-ov-regen').onclick=()=>render(payload);
      document.getElementById('qr-ov-full').onclick=()=>{
        renderFull(payload); document.getElementById('qr-full').style.display='grid';
      };
      document.getElementById('qr-ov-dl').onclick=()=>downloadPNG('qr-ov-slot', filenameBase);
      document.getElementById('qr-full-dl').onclick=()=>downloadPNG('qr-full-slot', filenameBase);
    }
    function render(pl){
      const slot = document.getElementById('qr-ov-slot'); slot.innerHTML='';
      new QRCode(slot,{text:pl,width:360,height:360,colorDark:"#000",colorLight:"#fff",correctLevel:QRCode.CorrectLevel.H});
      document.getElementById('qr-ov-json').textContent = JSON.stringify(JSON.parse(pl),null,2);
    }
    function renderFull(pl){
      const slot = document.getElementById('qr-full-slot'); slot.innerHTML='';
      new QRCode(slot,{text:pl,width:480,height:480,colorDark:"#000",colorLight:"#fff",correctLevel:QRCode.CorrectLevel.H});
    }
    function downloadPNG(containerId, base){
      const el=document.getElementById(containerId);
      const img=el.querySelector('img')||el.querySelector('canvas'); if(!img) return;
      const url=img.tagName==='IMG'?img.src:img.toDataURL('image/png');
      const a=document.createElement('a'); a.href=url; a.download=(base||'qr')+'.png'; a.click();
    }
    render(payload);
  };
})();