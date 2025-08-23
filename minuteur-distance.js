/* minuteur-distance.js — v6.4
 * Minuteur distance & vitesse — même visuel et UX que "Chrono avec vitesse"
 * Fonctions : compte à rebours, +1 tour, fraction finale, distance totale,
 * vitesse moyenne, VMA (si durée = 6'), QR JSON compatible ScanProf.
 */

(() => {
  // Helpers DOM
  const $ = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

  // Elements
  const nom = $('#nom'), prenom = $('#prenom'), classe = $('#classe');
  const sexeInputs = $$('input[name="sexe"]');
  const piste = $('#piste'), tours = $('#tours');
  const min = $('#min'), sec = $('#sec'), fraction = $('#fraction');

  const timeEl = $('#time');
  const hudTours = $('#hud-tours'), hudDist = $('#hud-distance');
  const speedEl = $('#speed'), vmaEl = $('#vma');

  const btnStart = $('#btn-start'), btnPause = $('#btn-pause'), btnReset = $('#btn-reset');
  const btnPlus1 = $('#btn-plus1'), btnFull = $('#btn-full');
  const btnQR = $('#btn-qr'), qrJson = $('#qr-json');

  const btnF0 = $('#btn-f0'), btnF25 = $('#btn-f25'), btnF50 = $('#btn-f50'), btnF75 = $('#btn-f75');

  const qrBox = $('#qrcode');

  // State
  let totalCenti = 6*60*100; // par défaut 6:00.00
  let remainingCenti = totalCenti;
  let timerId = null;
  let running = false;

  // ---- Time formatting ----
  function fmtCenti(c){
    const totalSeconds = Math.floor(c/100);
    const cs = c % 100;
    const m = Math.floor(totalSeconds/60);
    const s = totalSeconds % 60;
    return `${String(m)}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
  }

  function uiUpdateTime(){
    timeEl.textContent = fmtCenti(remainingCenti);
  }

  function uiUpdateHUD(){
    // distance = (tours + fraction) * piste
    const t = Number(tours.value || 0);
    const f = Number(fraction.value || 0);
    const p = Number(piste.value || 0);
    const distance = Math.round((t + f) * p);

    hudTours.textContent = String(t);
    hudDist.textContent = String(distance);

    // vitesse moyenne = distance / durée * 3.6
    const durSec = (totalCenti - remainingCenti) > 0
      ? ( (totalCenti - remainingCenti) / 100 )   // temps effectivement couru (si on préfère la vitesse jusqu'à maintenant)
      : ( totalCenti / 100 );                      // sinon, la vitesse théorique à la fin
    const effectiveSec = Math.max(durSec, 0.001);
    const speed = (distance / effectiveSec) * 3.6;

    speedEl.textContent = isFinite(speed) ? speed.toFixed(2) : '0.00';

    // VMA (≥ 6') : si durée paramétrée = 6:00, on affiche distance/100, sinon "—"
    const paramSec = (Number(min.value||0) * 60) + Number(sec.value||0);
    if (paramSec === 360) {
      const vma = distance / 100; // distance (m) sur 6' → km/h
      vmaEl.textContent = vma.toFixed(2) + ' km/h';
    } else {
      vmaEl.textContent = '—';
    }
  }

  function recalcTotal(){
    const m = Math.max(0, Number(min.value||0)|0);
    const s = Math.max(0, Number(sec.value||0)|0);
    const clampedS = Math.min(59, s);
    if (s !== clampedS) sec.value = clampedS;
    totalCenti = (m * 60 + clampedS) * 100;
    remainingCenti = totalCenti;
    uiUpdateTime();
    uiUpdateHUD();
  }

  // ---- Controls ----
  function tick(){
    if (!running) return;
    remainingCenti = Math.max(0, remainingCenti - 1);
    uiUpdateTime();
    if (remainingCenti <= 0){
      running = false;
      clearInterval(timerId);
      timerId = null;
      // à la fin : laisser l’utilisateur choisir la fraction puis générer le QR s’il veut
    }
  }

  btnStart.addEventListener('click', () => {
    if (running) return;
    running = true;
    // si on relance après reset : recalcule totalCenti
    if (remainingCenti === totalCenti) {
      // démarrage “propre”
    }
    if (!timerId) timerId = setInterval(tick, 10); // centi = 10 ms
  });

  btnPause.addEventListener('click', () => {
    running = false;
    if (timerId){ clearInterval(timerId); timerId = null; }
  });

  btnReset.addEventListener('click', () => {
    running = false;
    if (timerId){ clearInterval(timerId); timerId = null; }
    recalcTotal();
  });

  btnPlus1.addEventListener('click', () => {
    tours.value = String( (Number(tours.value||0)|0) + 1 );
    uiUpdateHUD();
  });

  // Fractions (boutons rapides)
  btnF0.addEventListener('click', ()=>{ fraction.value = "0"; uiUpdateHUD(); });
  btnF25.addEventListener('click', ()=>{ fraction.value = "0.25"; uiUpdateHUD(); });
  btnF50.addEventListener('click', ()=>{ fraction.value = "0.5"; uiUpdateHUD(); });
  btnF75.addEventListener('click', ()=>{ fraction.value = "0.75"; uiUpdateHUD(); });

  // Plein écran
  btnFull.addEventListener('click', () => {
    const el = document.documentElement;
    if (!document.fullscreenElement){
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  });

  // Inputs → recalculs
  [min,sec,piste,tours,fraction].forEach(inp=>{
    inp.addEventListener('input', () => {
      if (inp===min || inp===sec) recalcTotal();
      else uiUpdateHUD();
    });
    inp.addEventListener('change', () => {
      if (inp===min || inp===sec) recalcTotal();
      else uiUpdateHUD();
    });
  });

  // ---- QR ----
  let qr;
  function ensureQR(){
    if (!qr){
      qr = new QRCode(qrBox, { width: 140, height: 140, correctLevel: QRCode.CorrectLevel.M });
    }
    return qr;
  }

  function selectedSexe(){
    const s = sexeInputs.find(r=>r.checked)?.value || '';
    // force 'M' ou 'F' comme demandé par ScanProf
    return s === 'M' ? 'M' : (s === 'F' ? 'F' : '');
    // (si vide, ScanProf affichera juste la colonne sans valeur)
  }

  btnQR.addEventListener('click', () => {
    // distance finale = (tours + fraction) * piste
    const t = Number(tours.value||0);
    const f = Number(fraction.value||0);
    const p = Number(piste.value||0);
    const distance = Math.round((t + f) * p);

    // durée paramétrée (centi)
    const durCenti = totalCenti;

    // vitesse moyenne finale = distance / (durée en s) * 3.6
    const speed = (distance / (durCenti/100)) * 3.6;

    // Payload JSON “large” compatible ScanProf (colonnes dynamiques)
    const payload = [{
      nom: (nom.value||'').trim(),
      prenom: (prenom.value||'').trim(),
      classe: (classe.value||'').trim(),
      sexe: selectedSexe(),             // 'M' / 'F'
      distance: distance,               // mètres
      duree_centi: durCenti,            // centi-secondes
      vitesse_kmh: Number.isFinite(speed) ? Number(speed.toFixed(2)) : 0,
      piste_m: Number(p)||0,
      tours: Number(t)||0,
      fraction: Number(f)||0,
      mode: "minuteur"
    }];

    const json = JSON.stringify(payload);
    ensureQR().makeCode(json);
    qrJson.textContent = json;
  });

  // Init
  recalcTotal();
})();
