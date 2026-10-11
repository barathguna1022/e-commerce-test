// VOLTX Pro — single-rAF engine: cursor + mascot eyes + dust (zero-lag)
const PRODUCTS = [
  {id:1, name:"Aura X1 Headphones", cat:"audio", price:249, old:349, rating:4.9, reviews:2314, badge:"Bestseller", img:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80&auto=format&fit=crop", desc:"Adaptive noise cancelling down to −42 dB, graphene 40mm drivers, 48-hour battery and multipoint Bluetooth 5.4.", specs:["48h battery","ANC −42dB","BT 5.4"]},
  {id:2, name:"Pulse Watch Ultra", cat:"wearables", price:199, old:279, rating:4.8, reviews:1892, badge:"New", img:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80&auto=format&fit=crop", desc:"Titanium 49mm case, AMOLED display, ECG + SpO2, dual-band GPS and a genuine 14-day battery.", specs:["Titanium","ECG + SpO2","14-day battery"]},
  {id:3, name:"Volt Drone V2", cat:"drones", price:599, old:799, rating:4.9, reviews:964, badge:"Save 25%", img:"https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80&auto=format&fit=crop", desc:"8K 3-axis gimbal, 45-minute flight time, AI obstacle avoidance and 10 km video transmission.", specs:["8K gimbal","45-min flight","10 km range"]},
  {id:4, name:"Mech 75 Keyboard", cat:"gaming", price:129, old:169, rating:4.7, reviews:3321, badge:"Popular", img:"https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80&auto=format&fit=crop", desc:"Gasket-mounted 75% board, hot-swap linear switches, PBT keycaps and tri-mode connectivity.", specs:["Hot-swap","PBT caps","Tri-mode"]},
  {id:5, name:"Nebula Speaker 360", cat:"audio", price:149, old:199, rating:4.6, reviews:1204, badge:"Save 25%", img:"https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80&auto=format&fit=crop", desc:"Room-filling 360° sound, dedicated bass radiator, 24-hour playtime and IPX7 waterproofing.", specs:["360° sound","24h play","IPX7"]},
  {id:6, name:"Vision VR One", cat:"gaming", price:499, old:649, rating:4.8, reviews:743, badge:"New", img:"https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=800&q=80&auto=format&fit=crop", desc:"4K micro-OLED per eye, 120 Hz refresh, inside-out tracking, 256 GB standalone + PCVR.", specs:["4K OLED","120 Hz","256 GB"]},
  {id:7, name:"Echo Buds Pro", cat:"audio", price:89, old:129, rating:4.5, reviews:5210, badge:"Great value", img:"https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80&auto=format&fit=crop", desc:"Feather-light fit, hybrid ANC, wireless charging and 36 hours total with the case.", specs:["Hybrid ANC","36h total","Wireless"]},
  {id:8, name:"Strike Controller Elite", cat:"gaming", price:79, old:99, rating:4.7, reviews:2890, badge:"Save 20%", img:"https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80&auto=format&fit=crop", desc:"Hall-effect anti-drift sticks, 4 remappable back paddles and 40-hour battery for PC, console and mobile.", specs:["Anti-drift","40h battery","3-platform"]},
];

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const grid = $("#productGrid"), emptyMsg = $("#emptyMsg");
const money = n => "$" + n.toFixed(2);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(pointer: fine)").matches;

function load(key, fb){ try { return JSON.parse(localStorage.getItem(key)) ?? fb; } catch { return fb; } }
function persist(){ try { localStorage.setItem("voltx_cart", JSON.stringify(cart)); localStorage.setItem("voltx_wish", JSON.stringify(wishlist)); } catch {} }
let cart = load("voltx_cart", []);
let wishlist = load("voltx_wish", []);
let activeCat = "all", sortBy = "feat", query = "", promo = 0;

/* ---------- Preloader ---------- */
addEventListener("load", () => setTimeout(() => $("#preloader").classList.add("done"), 500));
setTimeout(() => $("#preloader").classList.add("done"), 2500);

/* ============================================================
   ZERO-LAG ENGINE — one rAF loop drives cursor + mascot + dust
   ============================================================ */
const dot = $("#cursorDot"), ring = $("#cursorRing"), cLabel = $("#cursorLabel");
const mascot = $("#mascot"), pupilL = $("#pupilL"), pupilR = $("#pupilR"), head = $("#mascotHead");
let mx = innerWidth/2, my = innerHeight/3, rx = mx, ry = my;      // cursor target / rendered
let ex = 0, ey = 0, erx = 0, ery = 0;                             // eye target / rendered
let down = false, frame = 0;
addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; }, {passive:true});
addEventListener("mousedown", () => { down = true; ring.classList.add("is-down"); });
addEventListener("mouseup", () => { down = false; ring.classList.remove("is-down"); });

// Cursor context via delegation (works for dynamically rendered cards — fixes old bug)
const labelFor = el => {
  if (el.closest("[data-add]")) return {cls:"is-add", text:"ADD"};
  if (el.closest(".card-img")) return {cls:"is-view", text:"VIEW"};
  if (el.closest("a,button,select,.pill")) return {cls:"is-hover", text:""};
  return null;
};
document.addEventListener("mouseover", e => {
  if (!finePointer) return;
  const ctx = labelFor(e.target);
  ring.className = "cursor-ring" + (ctx ? " " + ctx.cls : "");
  cLabel.textContent = ctx ? ctx.text : "";
});
document.addEventListener("mouseleave", () => { ring.className = "cursor-ring"; cLabel.textContent = ""; }, true);
// Volty gets excited over products (pure class toggle, no layout)
document.addEventListener("mouseover", e => {
  if (mascot) mascot.classList.toggle("excited", !!e.target.closest(".card, .j-panel, [data-add]"));
});

// Mascot eye target — document-space centre cached (no per-frame layout reads = no lag)
let mDocX = 0, mDocY = 0, mVisible = true;
const voltyStatus = $("#voltyStatus");
const browL = $("#browL"), browR = $("#browR");
function cacheMascotDoc(){
  if (!mascot) return;
  const r = mascot.getBoundingClientRect();
  mDocX = r.left + r.width/2 + scrollX;
  mDocY = r.top + r.height/2 + scrollY;
}
cacheMascotDoc();
addEventListener("resize", cacheMascotDoc);
addEventListener("load", cacheMascotDoc);
setTimeout(cacheMascotDoc, 800); // after images/fonts settle
// visibility: skip eye math when mascot far off-screen (perf), re-cache centre cheaply on scroll (1 read per scroll tick, not per frame)
let mViewY = 0;
addEventListener("scroll", () => { mViewY = mDocY - scrollY; mVisible = mViewY > -500 && mViewY < innerHeight + 500; }, {passive:true});

// Lightweight dust canvas (36 pts, no link-lines → no O(n²), no lag)
const dc = $("#dust"), dctx = dc.getContext("2d");
let dust = [];
function sizeDust(){ dc.width = innerWidth; dc.height = innerHeight; }
sizeDust(); addEventListener("resize", sizeDust);
if (!reduceMotion) for (let i=0;i<36;i++) dust.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,v:(Math.random()*.25+.06),r:Math.random()*1.6+.4,a:Math.random()*.5+.15});

function engine(){
  frame++;
  // 1) cursor — fast lerp, GPU transform only
  rx += (mx - rx) * (reduceMotion ? 1 : .28);
  ry += (my - ry) * (reduceMotion ? 1 : .28);
  dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
  ring.style.transform = `translate(${rx.toFixed(1)}px,${ry.toFixed(1)}px) translate(-50%,-50%)`;

  // 2) lifelike gaze — clipped eyeballs glide inside the sockets, head barely drifts
  if (mascot && mVisible && pupilL && head) {
    const cx = mDocX - scrollX, cy = mViewY || (mDocY - scrollY);
    const dx = mx - cx, dy = my - cy;
    const d = Math.hypot(dx, dy) || 1;
    const maxP = 3;   // almond sockets are narrow — 3 units keeps the iris fully inside (clip is the backstop)
    ex = (dx/d) * Math.min(maxP, d/90);
    ey = (dy/d) * Math.min(maxP*.55, d/110);
    erx += (ex - erx) * .18; ery += (ey - ery) * .18;   // slower easing reads as calm, human
    const px = erx.toFixed(2), py = ery.toFixed(2);
    pupilL.style.transform = `translate(${px}px,${py}px)`;
    pupilR.style.transform = `translate(${px}px,${py}px)`;
    head.style.transform = `translate(${(erx*.5).toFixed(2)}px,${(ery*.35).toFixed(2)}px) rotate(${(erx*.45).toFixed(2)}deg)`;
    // brows breathe almost imperceptibly — no more puppet look
    if (browL) {
      const lift = (-ery*.8).toFixed(2);
      browL.style.transform = `translate(${(erx*.4).toFixed(2)}px,${lift}px)`;
      browR.style.transform = `translate(${(erx*.4).toFixed(2)}px,${lift}px)`;
    }
  }

  // 3) dust drift
  if (!reduceMotion && dust.length) {
    dctx.clearRect(0,0,dc.width,dc.height);
    const dark = document.documentElement.dataset.theme !== "light";
    dctx.fillStyle = dark ? "rgba(212,162,78,.45)" : "rgba(122,22,34,.28)";
    for (const p of dust) {
      p.y -= p.v; if (p.y < -4) { p.y = innerHeight+4; p.x = Math.random()*innerWidth; }
      dctx.globalAlpha = p.a;
      dctx.beginPath(); dctx.arc(p.x, p.y, p.r, 0, 7); dctx.fill();
    }
    dctx.globalAlpha = 1;
  }

  // 4) showcase lean: stage skews into scroll velocity, photo eases toward mouse tilt
  const jStage = $("#journeyStage");
  if (jStage && !reduceMotion) {
    const target = Math.max(-4, Math.min(4, jVel * 900));
    jSkew += (target - jSkew) * .1; jVel *= .9;
    jTiltX *= .96; jTiltY *= .96;
    const act = panels[jIdx];
    const media = act && act.querySelector(".j-media");
    if (media) media.style.transform = `rotateX(${jTiltX.toFixed(2)}deg) rotateY(${jTiltY.toFixed(2)}deg)`;
    jStage.style.transform = `skewY(${(jSkew * .35).toFixed(2)}deg)`;
  }
  requestAnimationFrame(engine);
}
requestAnimationFrame(engine);

// Mascot blink (cheap class toggle, no layout)
if (mascot) setInterval(() => {
  mascot.classList.add("blink");
  setTimeout(() => mascot.classList.remove("blink"), 240);
}, 3800 + Math.random()*1500);

/* ---------- Scroll: progress + reveals ---------- */
const prog = $("#scrollProgress"), toTop = $("#toTop");
let ticking = false;
addEventListener("scroll", () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    const h = document.documentElement;
    prog.style.width = (h.scrollTop/(h.scrollHeight-h.clientHeight)*100) + "%";
    toTop.classList.toggle("hidden", h.scrollTop < 600);
    journeyScrub();
    ticking = false;
  });
}, {passive:true});
toTop.onclick = () => scrollTo({top:0, behavior:"smooth"});

const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
}), {threshold:.12});
$$(".reveal").forEach(el => io.observe(el));

/* ---------- Journey: TRUE scroll-scrubbed one-by-one intro (fixed) ---------- */
const panels = $$(".j-panel"), jFill = $("#journeyFill"), jDots = $$("#jDots button"), jStep = $("#jStep");
const jTall = $("#journeyTall");
let jIdx = -1, jVel = 0, lastProg = 0, jSkew = 0, jTiltX = 0, jTiltY = 0;
function setJourney(i, progress){
  jIdx = i;
  panels.forEach((p,k) => {
    p.classList.toggle("is-active", k===i);
    p.classList.toggle("is-past", k<i);
  });
  jDots.forEach((d,k)=>d.classList.toggle("on", k===i));
  if (jStep) jStep.textContent = `${i+1} / ${panels.length}`;
  if (jFill) jFill.style.width = (progress*100).toFixed(1)+"%";
}
function journeyScrub(){
  if (!jTall || !panels.length) return;
  // Tall-section math: progress 0→1 as the tall block scrolls through the pinned viewport.
  const r = jTall.getBoundingClientRect();   // 1 layout read per scroll tick (throttled) — fine
  const vh = innerHeight;
  const total = r.height - vh;
  const scrolled = -r.top;
  const progress = Math.min(Math.max(scrolled / total, 0), 1);
  const scaled = progress * panels.length;
  const idx = Math.min(panels.length-1, Math.max(0, Math.floor(scaled)));
  const frac = scaled - idx; // 0..1 within current panel — drives parallax
  // velocity → lean the stage into the scroll direction (decays in the rAF engine)
  jVel = progress - lastProg; lastProg = progress;
  if (idx !== jIdx) setJourney(idx, progress);
  else if (jFill) jFill.style.width = (progress*100).toFixed(1)+"%";
  // Unique life: parallax the ACTIVE image + ghost + glow tint while scrolling inside a panel.
  const active = panels[idx];
  if (active) {
    const img = active.querySelector("img");
    const ghost = active.querySelector(".j-ghost");
    if (img) img.style.translate = `${((0.5-frac)*-36).toFixed(1)}px ${(frac*10).toFixed(1)}px`;
    if (ghost) ghost.style.translate = `${((frac-.5)*70).toFixed(1)}px 0px`;
    const tint = active.dataset.tint || "#D4A24E";
    const stage = $("#journeyStage"), glow = $("#stageGlow");
    if (stage) { stage.dataset.active = String(idx); stage.dataset.dir = jVel >= 0 ? "down" : "up"; }
    if (glow) glow.style.setProperty("--glow", tint);
  }
}
// Mouse-tilt on the live panel photo (desktop only, transform-only)
if (finePointer) document.addEventListener("mousemove", e => {
  const active = panels[jIdx]; if (!active) return;
  const media = active.querySelector(".j-media"); if (!media) return;
  const r = media.getBoundingClientRect();
  if (e.clientY < r.top - 200 || e.clientY > r.bottom + 200) return;
  const x = (e.clientX - (r.left + r.width/2)) / r.width;
  const y = (e.clientY - (r.top + r.height/2)) / r.height;
  jTiltX += ((y * -5) - jTiltX) * .2;
  jTiltY += ((x * 7) - jTiltY) * .2;
}, {passive:true});
jDots.forEach(d => d.onclick = () => {
  if (!jTall) return;
  const i = +d.dataset.j;
  const H = jTall.offsetHeight, vh = innerHeight;
  const top = jTall.getBoundingClientRect().top + scrollY + ((i + .5) / panels.length) * (H - vh) - vh * .05;
  scrollTo({top: Math.max(0, top), behavior:"smooth"});
});

/* ---------- Shop: cascade one-by-one ---------- */
function starStr(r){ return "★".repeat(Math.round(r)) + "<span style='opacity:.35'>" + "★".repeat(5-Math.round(r)) + "</span>"; }
function filtered(){
  let list = PRODUCTS.filter(p => (activeCat==="all"||p.cat===activeCat) && p.name.toLowerCase().includes(query));
  if (sortBy==="low") list = [...list].sort((a,b)=>a.price-b.price);
  if (sortBy==="high") list = [...list].sort((a,b)=>b.price-a.price);
  if (sortBy==="rating") list = [...list].sort((a,b)=>b.rating-a.rating);
  return list;
}
const cardIO = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); cardIO.unobserve(e.target); }
}), {threshold:.08, rootMargin:"0px 0px -20px 0px"});

function render(){
  const list = filtered();
  emptyMsg.classList.toggle("hidden", list.length>0);
  $("#resultCount").textContent = list.length ? `${list.length} product${list.length>1?"s":""} · free returns` : "";
  grid.innerHTML = list.map((p,i) => `
    <article class="card" data-id="${p.id}" style="transition-delay:${(i%4)*70}ms">
      <div class="card-img">
        <img loading="lazy" src="${p.img}" alt="${p.name}"/>
        <span class="card-badge">${p.badge}</span>
        <button class="wish ${wishlist.includes(p.id)?"active":""}" data-wish="${p.id}" aria-label="Wishlist ${p.name}">${wishlist.includes(p.id)?"♥":"♡"}</button>
      </div>
      <div class="card-body">
        <span class="card-cat">${p.cat}</span>
        <h3>${p.name}</h3>
        <div class="card-rate"><span class="stars">${starStr(p.rating)}</span> ${p.rating} (${p.reviews.toLocaleString()})</div>
        <div class="card-price"><b>${money(p.price)}</b><s>${money(p.old)}</s></div>
        <div class="card-actions">
          <button class="add-btn" data-add="${p.id}">Add to cart</button>
          <button class="view-btn" data-view="${p.id}" aria-label="Quick view ${p.name}">⤢</button>
        </div>
      </div>
    </article>`).join("");
  $$("#productGrid .card").forEach(c => cardIO.observe(c));
}
$("#catPills").addEventListener("click", e => {
  const b = e.target.closest(".pill"); if (!b) return;
  $$(".pill").forEach(p => p.classList.remove("active"));
  b.classList.add("active"); activeCat = b.dataset.cat; render();
});
$("#sortSel").onchange = e => { sortBy = e.target.value; render(); };
$("#searchInput").oninput = e => { query = e.target.value.trim().toLowerCase(); render(); };

/* ---------- Wishlist ---------- */
function updateWish(){ const w = $("#wishCount"); w.textContent = wishlist.length; w.classList.toggle("hidden", !wishlist.length); }
$("#wishlistBtn").onclick = () => {
  if (!wishlist.length) return toast("Wishlist is empty — tap a heart on any product.");
  toast(`${wishlist.length} saved: ` + wishlist.map(id => PRODUCTS.find(p=>p.id===id).name).join(", "));
};

/* ---------- Cart ---------- */
const drawer = $("#cartDrawer"), overlay = $("#overlay");
const openCart = () => { drawer.classList.add("open"); overlay.classList.add("show"); };
const closeCart = () => { drawer.classList.remove("open"); overlay.classList.remove("show"); };
$("#cartOpen").onclick = openCart; $("#cartClose").onclick = closeCart;
$("#continueBtn").onclick = closeCart; overlay.onclick = closeCart;
addEventListener("keydown", e => { if (e.key==="Escape"){ closeCart(); $("#quickView").classList.add("hidden"); $("#checkoutModal").classList.add("hidden"); } });

const cartQty = () => cart.reduce((s,i)=>s+i.qty,0);
const subtotal = () => cart.reduce((s,i)=> s + PRODUCTS.find(p=>p.id===i.id).price * i.qty, 0);

function renderCart(){
  const box = $("#cartItems"), n = cartQty();
  $("#cartCount").textContent = n; $("#drawerCount").textContent = `(${n})`;
  box.innerHTML = cart.length ? cart.map(i => {
    const p = PRODUCTS.find(p=>p.id===i.id);
    return `<div class="cart-item">
      <img src="${p.img}" alt="${p.name}"/>
      <div class="ci-info"><b>${p.name}</b><small>${money(p.price)} each</small>
        <div class="qty"><button data-dec="${p.id}" aria-label="Decrease">−</button><span>${i.qty}</span><button data-inc="${p.id}" aria-label="Increase">+</button></div>
      </div>
      <div class="ci-right"><b>${money(p.price*i.qty)}</b><button class="rm" data-rm="${p.id}">remove</button></div>
    </div>`;
  }).join("") : `<div class="cart-empty">Your cart is empty.<br/><br/><button class="add-btn" id="emptyShop">Browse products</button></div>`;
  const emptyBtn = $("#emptyShop");
  if (emptyBtn) emptyBtn.onclick = () => { closeCart(); location.hash = "#shop"; };
  const sub = subtotal(), disc = sub*promo, total = sub-disc;
  $("#subTotal").textContent = money(sub);
  $("#discount").textContent = "−" + money(disc);
  $("#grandTotal").textContent = money(total);
  $("#payAmt").textContent = money(total);
  $("#shipFill").style.width = Math.min(sub/99*100,100) + "%";
  $("#shipMsg").innerHTML = sub >= 99 ? "<b>Free express shipping unlocked.</b>" : `Add <b>${money(99-sub)}</b> more for free express shipping`;
  persist();
}
document.addEventListener("click", e => {
  const add = e.target.closest("[data-add]");
  if (add) {
    const id = +add.dataset.add;
    const f = cart.find(i=>i.id===id); f ? f.qty++ : cart.push({id, qty:1});
    renderCart(); openCart();
    toast(PRODUCTS.find(p=>p.id===id).name + " added to cart");
    return;
  }
  const inc = e.target.closest("[data-inc]"); if (inc){ cart.find(i=>i.id===+inc.dataset.inc).qty++; renderCart(); return; }
  const dec = e.target.closest("[data-dec]"); if (dec){
    const it = cart.find(i=>i.id===+dec.dataset.dec);
    it.qty--; if (it.qty<=0) cart = cart.filter(i=>i.id!==it.id); renderCart(); return;
  }
  const rm = e.target.closest("[data-rm]"); if (rm){ cart = cart.filter(i=>i.id!==+rm.dataset.rm); renderCart(); return; }
  const w = e.target.closest("[data-wish]"); if (w){
    const id = +w.dataset.wish;
    wishlist.includes(id) ? wishlist = wishlist.filter(x=>x!==id) : wishlist.push(id);
    persist(); updateWish(); render(); return;
  }
  const v = e.target.closest("[data-view]"); if (v){ openQV(+v.dataset.view); return; }
});
$("#promoBtn").onclick = () => {
  const code = $("#promoInput").value.trim().toUpperCase();
  if (code==="VOLT15"){ promo = .15; toast("VOLT15 applied — 15% off"); }
  else if (code==="NEON10"){ promo = .10; toast("NEON10 applied — 10% off"); }
  else { promo = 0; toast("That code isn't valid — try VOLT15"); }
  renderCart();
};

/* ---------- Quick view / checkout ---------- */
function openQV(id){
  const p = PRODUCTS.find(p=>p.id===id);
  $("#qvBox").innerHTML = `
    <button class="icon-btn qv-close" id="qvClose" aria-label="Close">✕</button>
    <div class="qv-grid">
      <img src="${p.img}" alt="${p.name}"/>
      <div>
        <span class="card-cat">${p.cat} · ${p.badge}</span>
        <h3>${p.name}</h3>
        <div class="card-rate"><span class="stars">${starStr(p.rating)}</span> ${p.rating} · ${p.reviews.toLocaleString()} reviews</div>
        <p class="desc">${p.desc}</p>
        <div class="spec">${p.specs.map(s=>`<span>${s}</span>`).join("")}</div>
        <div class="card-price"><b style="font-size:24px">${money(p.price)}</b><s>${money(p.old)}</s></div>
        <div class="card-actions"><button class="add-btn" data-add="${p.id}">Add to cart — ${money(p.price)}</button></div>
      </div>
    </div>`;
  $("#quickView").classList.remove("hidden");
  $("#qvClose").onclick = () => $("#quickView").classList.add("hidden");
}
$("#quickView").addEventListener("click", e => { if (e.target.id==="quickView") e.target.classList.add("hidden"); });

$("#checkoutBtn").onclick = () => {
  if (!cart.length) return toast("Your cart is empty.");
  $("#checkoutModal").classList.remove("hidden"); $("#paySuccess").classList.add("hidden");
};
$("#coClose").onclick = () => $("#checkoutModal").classList.add("hidden");
$("#checkoutModal").addEventListener("click", e => { if (e.target.id==="checkoutModal") e.target.classList.add("hidden"); });
$("#payBtn").onclick = () => {
  if (!$("#coName").value.trim() || !/.+@.+\..+/.test($("#coEmail").value)) return toast("Please add your name and a valid email.");
  $("#orderId").textContent = "#VTX-" + Math.floor(1000+Math.random()*9000);
  $("#paySuccess").classList.remove("hidden");
  cart = []; promo = 0; renderCart();
  setTimeout(() => { $("#checkoutModal").classList.add("hidden"); closeCart(); }, 2400);
};

/* ---------- Offer timer ---------- */
let s = 12*3600 + 45*60 + 30;
setInterval(() => {
  s = Math.max(s-1, 0);
  $("#tH").textContent = String(Math.floor(s/3600)).padStart(2,"0");
  $("#tM").textContent = String(Math.floor(s%3600/60)).padStart(2,"0");
  $("#tS").textContent = String(s%60).padStart(2,"0");
}, 1000);

/* ---------- Reviews ---------- */
let rIdx = 0;
function slide(){
  const t = $("#revTrack"); if (!t.children.length) return;
  const w = t.children[0].offsetWidth + 14;
  const max = Math.max(t.children.length - Math.floor(t.parentElement.offsetWidth/w), 0);
  rIdx = rIdx > max ? 0 : rIdx;
  t.style.transform = `translateX(${-rIdx*w}px)`;
}
$("#revNext").onclick = () => { rIdx++; slide(); };
$("#revPrev").onclick = () => { rIdx = Math.max(rIdx-1, 0); slide(); };
setInterval(() => { const t=$("#revTrack"); rIdx = rIdx >= t.children.length-1 ? 0 : rIdx+1; slide(); }, 5000);
addEventListener("resize", slide);

/* ---------- Misc ---------- */
$("#themeBtn").onclick = () => {
  const h = document.documentElement;
  h.dataset.theme = h.dataset.theme === "dark" ? "light" : "dark";
  toast(h.dataset.theme === "dark" ? "Dark mode" : "Light mode");
};
$("#hamburger").onclick = () => $("#mobileMenu").classList.toggle("open");
$$("#mobileMenu a").forEach(a => a.onclick = () => $("#mobileMenu").classList.remove("open"));
$$(".nav-links a").forEach(a => a.onclick = () => $$(".nav-links a").forEach(x => x.classList.remove("active")) + a.classList.add("active"));

$("#newsForm").onsubmit = e => {
  e.preventDefault();
  const v = $("#newsEmail").value.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return $("#newsMsg").textContent = "Please enter a valid email address.";
  $("#newsMsg").textContent = "Welcome aboard — code VOLT15 sent to " + v;
  $("#newsEmail").value = ""; toast("Discount code: VOLT15");
};

// Hero rotation (paused when tab hidden — saves battery, no lag)
const heroSet = [PRODUCTS[0], PRODUCTS[2], PRODUCTS[1]];
let hi = 0;
setInterval(() => {
  if (document.hidden) return;
  hi = (hi+1) % heroSet.length;
  const img = $("#heroImg");
  img.style.opacity = 0;
  setTimeout(() => {
    img.src = heroSet[hi].img; img.alt = heroSet[hi].name; img.style.opacity = 1;
    $("#heroPriceCard").innerHTML = `<div><small>${heroSet[hi].name} · Bestseller</small><strong>${money(heroSet[hi].price)} <s>${money(heroSet[hi].old)}</s></strong></div><button class="btn-primary btn-sm" data-add="${heroSet[hi].id}">Add to cart</button>`;
  }, 350);
}, 5000);

function toast(msg){
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
  const box = $("#toasts"); box.appendChild(t);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { t.style.opacity = 0; setTimeout(() => t.remove(), 350); }, 2300);
}

/* init */
render(); renderCart(); updateWish(); setJourney(0,0); journeyScrub(); slide(); cacheMascotDoc();

/* ---- added: extra category-wise products below the showcase (existing shop untouched) ---- */
const EXTRA_CATS = [
  {key:"pc", name:"PC & Computing", tag:"Laptops, monitors & desk gear"},
  {key:"phones", name:"Phones & Mobile", tag:"Phones, tablets & charging"},
  {key:"home", name:"Home Appliances", tag:"Smart home & everyday helpers"},
];
const EXTRA_PRODUCTS = [
  {id:9, name:"Volt Laptop Pro 14", cat:"pc", price:1099, old:1299, rating:4.8, reviews:861, badge:"New", img:"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80&auto=format&fit=crop", desc:"14-inch 3K OLED, 32 GB RAM, 1 TB SSD, 18-hour battery in a 1.2 kg magnesium body.", specs:["3K OLED","32GB RAM","18h battery"]},
  {id:10, name:"UltraView 34 Curved", cat:"pc", price:449, old:549, rating:4.7, reviews:542, badge:"Save 18%", img:"https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80&auto=format&fit=crop", desc:"34-inch 165 Hz curved ultrawide, HDR600, height-adjust stand and 90 W USB-C.", specs:["34in 165Hz","HDR600","USB-C 90W"]},
  {id:11, name:"Volt Mouse Pro", cat:"pc", price:59, old:79, rating:4.6, reviews:2104, badge:"Popular", img:"https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80&auto=format&fit=crop", desc:"26K sensor, silent clicks, 90-day battery and tri-device switching.", specs:["26K sensor","90-day","Tri-device"]},
  {id:12, name:"Nova Phone X", cat:"phones", price:799, old:899, rating:4.8, reviews:1930, badge:"New", img:"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80&auto=format&fit=crop", desc:"6.7-inch AMOLED 120 Hz, 200 MP camera, 2-day battery and full 5G bands.", specs:["200MP","120Hz","5G"]},
  {id:13, name:"Tab S11", cat:"phones", price:499, old:599, rating:4.7, reviews:764, badge:"Save 17%", img:"https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80&auto=format&fit=crop", desc:"11-inch 120 Hz display, stylus in the box and a 12-hour battery for work and play.", specs:["11in 120Hz","Stylus","12h battery"]},
  {id:14, name:"Volt Power Hub 65W", cat:"phones", price:39, old:59, rating:4.6, reviews:3410, badge:"Great value", img:"https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80&auto=format&fit=crop", desc:"65 W GaN 3-port charger that folds flat — charges a laptop and phone together.", specs:["65W GaN","3-port","Folds flat"]},
  {id:15, name:"Echo Smart Hub", cat:"home", price:99, old:139, rating:4.6, reviews:1522, badge:"Popular", img:"https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80&auto=format&fit=crop", desc:"Voice control for 100,000+ devices, room-filling sound and a mic privacy shutter.", specs:["Voice hub","100k devices","Privacy"]},
  {id:16, name:"Luma Desk Lamp", cat:"home", price:49, old:69, rating:4.5, reviews:987, badge:"Save 29%", img:"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80&auto=format&fit=crop", desc:"Eye-care auto-dim, 15 W wireless charger in the base and 5 colour modes.", specs:["Auto-dim","15W charge","5 modes"]},
  {id:17, name:"Cyclone Cordless Vacuum", cat:"home", price:299, old:399, rating:4.7, reviews:1108, badge:"Save 25%", img:"https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=80&auto=format&fit=crop", desc:"60-minute runtime, laser dust detection, sealed HEPA and 5 attachments.", specs:["60-min","HEPA","Laser detect"]},
  {id:18, name:"Brew Pour-Over Set", cat:"home", price:79, old:99, rating:4.8, reviews:643, badge:"New", img:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80&auto=format&fit=crop", desc:"Precision gooseneck kettle, dripper and timer scale in barista-grade steel.", specs:["Gooseneck","Scale","Steel"]},
];
function renderMoreCats(){
  const wrap = document.getElementById("moreCatsWrap");
  if (!wrap) return;
  wrap.innerHTML = EXTRA_CATS.map(c => {
    const items = EXTRA_PRODUCTS.filter(p => p.cat === c.key);
    return `<div class="cat-block reveal">
      <div class="cat-block-head"><h3>${c.name}</h3><small>${c.tag} · ${items.length}</small></div>
      <div class="grid">${items.map((p,i) => `
        <article class="card" style="transition-delay:${(i%4)*70}ms">
          <div class="card-img">
            <img loading="lazy" src="${p.img}" alt="${p.name}"/>
            <span class="card-badge">${p.badge}</span>
            <button class="wish ${wishlist.includes(p.id)?"active":""}" data-wish="${p.id}" data-extra="1" aria-label="Wishlist ${p.name}">${wishlist.includes(p.id)?"♥":"♡"}</button>
          </div>
          <div class="card-body">
            <span class="card-cat">${p.cat}</span>
            <h3>${p.name}</h3>
            <div class="card-rate"><span class="stars">${starStr(p.rating)}</span> ${p.rating} (${p.reviews.toLocaleString()})</div>
            <div class="card-price"><b>${money(p.price)}</b><s>${money(p.old)}</s></div>
            <div class="card-actions">
              <button class="add-btn" data-add="${p.id}" data-extra="1">Add to cart</button>
              <button class="view-btn" data-view="${p.id}" data-extra="1" aria-label="Quick view ${p.name}">⤢</button>
            </div>
          </div>
        </article>`).join("")}</div>
    </div>`;
  }).join("");
  wrap.querySelectorAll(".card").forEach(c => cardIO.observe(c));
  wrap.querySelectorAll(".reveal").forEach(el => io.observe(el));
}
// wishlist hearts inside the new section toggle locally (existing handler is left untouched)
document.getElementById("moreCatsWrap").addEventListener("click", e => {
  const w = e.target.closest('[data-wish][data-extra]');
  if (!w) return;
  e.stopPropagation();
  const id = +w.dataset.wish;
  wishlist.includes(id) ? wishlist = wishlist.filter(x => x !== id) : wishlist.push(id);
  persist(); updateWish();
  document.querySelectorAll(`[data-wish="${id}"]`).forEach(b => {
    const on = wishlist.includes(id);
    b.classList.toggle("active", on);
    b.textContent = on ? "♥" : "♡";
  });
});
// add-to-cart + quick-view inside the new section reuse the existing handlers untouched
// (extras are registered in PRODUCTS so the shared cart never misses a lookup)
PRODUCTS.push(...EXTRA_PRODUCTS);
renderMoreCats();

/* ---- added: store-standard features (chat, recently viewed, related, delivery estimate) ---- */
function loadJSON(k, fb){ try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } }
function saveJSON(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

/* recently viewed */
let recent = loadJSON("voltx_recent", []);
function recordView(id){
  window.__lastQV = id;
  recent = [id, ...recent.filter(x => x !== id)].slice(0, 8);
  saveJSON("voltx_recent", recent);
  renderRecent();
}
document.addEventListener("click", e => {
  const v = e.target.closest("[data-view]");
  if (v) recordView(+v.dataset.view);
}, true);
function renderRecent(){
  const sec = document.getElementById("recently"), grid = document.getElementById("recentGrid");
  if (!sec || !grid) return;
  const items = recent.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
  sec.classList.toggle("hidden", !items.length);
  grid.innerHTML = items.map((p,i) => `
    <article class="card" style="transition-delay:${(i%4)*60}ms">
      <div class="card-img">
        <img loading="lazy" src="${p.img}" alt="${p.name}"/>
        <span class="card-badge">${p.badge}</span>
        <button class="wish ${wishlist.includes(p.id)?"active":""}" data-wish="${p.id}" data-rv="1" aria-label="Wishlist ${p.name}">${wishlist.includes(p.id)?"♥":"♡"}</button>
      </div>
      <div class="card-body">
        <span class="card-cat">${p.cat}</span>
        <h3>${p.name}</h3>
        <div class="card-rate"><span class="stars">${starStr(p.rating)}</span> ${p.rating}</div>
        <div class="card-price"><b>${money(p.price)}</b><s>${money(p.old)}</s></div>
        <div class="card-actions">
          <button class="add-btn" data-add="${p.id}">Add to cart</button>
          <button class="view-btn" data-view="${p.id}" aria-label="Quick view ${p.name}">⤢</button>
        </div>
      </div>
    </article>`).join("");
  grid.querySelectorAll(".card").forEach(c => cardIO.observe(c));
}
document.getElementById("recentGrid").addEventListener("click", e => {
  const w = e.target.closest("[data-wish][data-rv]");
  if (!w) return;
  e.stopPropagation();
  const id = +w.dataset.wish;
  wishlist.includes(id) ? wishlist = wishlist.filter(x => x !== id) : wishlist.push(id);
  persist(); updateWish();
  document.querySelectorAll(`[data-wish="${id}"]`).forEach(b => {
    const on = wishlist.includes(id);
    b.classList.toggle("active", on);
    b.textContent = on ? "♥" : "♡";
  });
});
document.getElementById("clearRecent").onclick = () => { recent = []; saveJSON("voltx_recent", recent); renderRecent(); };

/* related items inside quick view (appended by observer, existing modal untouched) */
new MutationObserver(() => {
  const box = document.getElementById("qvBox");
  if (!box || box.querySelector(".qv-related")) return;
  const p = PRODUCTS.find(p => p.id === window.__lastQV);
  if (!p) return;
  const rel = [
    ...PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id),
    ...PRODUCTS.filter(x => x.cat !== p.cat && x.id !== p.id).sort((a,b) => b.rating - a.rating),
  ].slice(0, 3);
  const div = document.createElement("div");
  div.className = "qv-related";
  div.innerHTML = `<h4>You may also like</h4><div class="qv-rel-row">${rel.map(r => `
    <div class="qv-rel">
      <img loading="lazy" src="${r.img}" alt="${r.name}"/>
      <div><b>${r.name}</b><small>${money(r.price)}</small></div>
      <button data-add="${r.id}" aria-label="Add ${r.name}">Add</button>
    </div>`).join("")}</div>`;
  box.appendChild(div);
}).observe(document.getElementById("qvBox"), {childList:true});

/* delivery estimate line in the cart drawer (injected once, refreshed on cart change) */
const dEst = document.createElement("p");
dEst.className = "delivery-est hidden";
const dFoot = document.querySelector(".drawer-foot");
if (dFoot) dFoot.insertBefore(dEst, dFoot.firstChild);
function refreshEst(){
  if (!dEst) return;
  if (!cart.length) { dEst.classList.add("hidden"); return; }
  const d = new Date(Date.now() + 3 * 864e5);
  const date = d.toLocaleDateString("en-US", {weekday:"short", month:"short", day:"numeric"});
  dEst.innerHTML = `Order now — arrives by <b>${date}</b> · free returns included`;
  dEst.classList.remove("hidden");
}
new MutationObserver(refreshEst).observe(document.getElementById("cartItems"), {childList:true});
refreshEst();

/* remember the last order id so chat can track it (observes existing success box) */
new MutationObserver(() => {
  const s = document.getElementById("paySuccess"), o = document.getElementById("orderId");
  if (s && o && !s.classList.contains("hidden")) saveJSON("voltx_lastorder", o.textContent);
}).observe(document.getElementById("checkoutModal"), {attributes:true, subtree:true, attributeFilter:["class"]});

/* support chat */
const chatFab = document.getElementById("chatFab"), chatPanel = document.getElementById("chatPanel"),
      chatMsgs = document.getElementById("chatMsgs"), chatForm = document.getElementById("chatForm"),
      chatInput = document.getElementById("chatInput");
let chatOpened = false;
chatFab.onclick = () => {
  chatPanel.classList.toggle("hidden");
  if (!chatOpened) {
    chatOpened = true;
    const ping = chatFab.querySelector(".chat-ping");
    if (ping) ping.remove();
    botSay("Hi, I'm Volty Support. Ask about orders, shipping, returns — or tap a shortcut below.");
  }
};
document.getElementById("chatClose").onclick = () => chatPanel.classList.add("hidden");
function bubble(text, me){
  const d = document.createElement("div");
  d.className = "chat-msg " + (me ? "me" : "bot");
  d.textContent = text;
  chatMsgs.appendChild(d);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
  return d;
}
function botSay(text){
  const ty = bubble("", false);
  ty.classList.add("typing");
  ty.innerHTML = "<span></span><span></span><span></span>";
  setTimeout(() => { ty.classList.remove("typing"); ty.textContent = text; chatMsgs.scrollTop = chatMsgs.scrollHeight; }, 650);
}
function botAnswer(q){
  const last = loadJSON("voltx_lastorder", null);
  q = q.toLowerCase();
  if (/track|order|status|where/.test(q)) return botSay(last ? `Order ${last} is packed and leaves our warehouse tonight. The live tracking link was emailed to you.` : "No orders on this device yet — once you check out, I can track it right here with live updates.");
  if (/ship|deliver|arrive/.test(q)) return botSay("Express dispatch in 24h. Orders over $99 ship free and arrive in 2–4 days — your cart shows the exact date.");
  if (/return|refund|exchange/.test(q)) return botSay("30-day no-questions returns with instant refunds once the courier scans your parcel.");
  if (/discount|promo|coupon|offer|code|deal/.test(q)) return botSay("Use VOLT15 for 15% off your first order. NEON10 takes 10% off accessories.");
  if (/human|agent|call|phone|person/.test(q)) return botSay("Connecting you — a specialist replies within about 2 minutes on weekdays, 9am–9pm.");
  if (/^(hi|hello|hey)\b/.test(q)) return botSay("Hello! Ask me about tracking, shipping, returns or discounts.");
  if (/thank/.test(q)) return botSay("Anytime! Anything else I can help with?");
  return botSay("Noted — a specialist will pick this up. Meanwhile try 'track', 'shipping', 'returns' or 'discount'.");
}
document.getElementById("chatQuick").addEventListener("click", e => {
  const b = e.target.closest("[data-q]");
  if (!b) return;
  bubble(b.textContent, true);
  botAnswer(b.dataset.q);
});
chatForm.onsubmit = e => {
  e.preventDefault();
  const v = chatInput.value.trim();
  if (!v) return;
  bubble(v, true);
  chatInput.value = "";
  botAnswer(v);
};
renderRecent();
