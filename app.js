/* =====================================================================
   SUBFLOW — app.js
   All business logic, rendering, modals, charts.
   ===================================================================== */

// ─── DB: Firestore per UID + in-memory cache ───
const DB = (function () {
  let _uid = null;
  const _COLS = ['pakets', 'customers', 'suppliers', 'transaksis', 'biayas'];
  const _cache = { pakets: [], customers: [], suppliers: [], transaksis: [], biayas: [] };

  async function _fsGet(col) {
    try {
      const snap = await window._fsGetDoc(window._fsDoc(window._db, col, _uid));
      return snap.exists() ? (snap.data().items || []) : [];
    } catch (e) { console.warn('[DB] fsGet error', col, e); return []; }
  }

  function _fsSet(col, items) {
    window._fsSetDoc(window._fsDoc(window._db, col, _uid), { items })
      .catch(e => console.warn('[DB] fsSet error', col, e));
  }

  return {
    async setUID(uid) {
      _uid = uid;
      const results = await Promise.all(_COLS.map(k => _fsGet(k)));
      _COLS.forEach((k, i) => { _cache[k] = results[i]; });
    },
    clearUID() {
      _uid = null;
      _COLS.forEach(k => { _cache[k] = []; });
    },
    get(k)    { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    pakets()     { return _cache.pakets     || []; },
    customers()  { return _cache.customers  || []; },
    suppliers()  { return _cache.suppliers  || []; },
    transaksis() { return _cache.transaksis || []; },
    biayas()     { return _cache.biayas     || []; },
    savePakets(v)     { _cache.pakets     = v; _fsSet('pakets',     v); },
    saveCustomers(v)  { _cache.customers  = v; _fsSet('customers',  v); },
    saveSuppliers(v)  { _cache.suppliers  = v; _fsSet('suppliers',  v); },
    saveTransaksis(v) { _cache.transaksis = v; _fsSet('transaksis', v); },
    saveBiayas(v)     { _cache.biayas     = v; _fsSet('biayas',     v); },
  };
})();

// ─── SEED ───
function seedDemoData() {
  DB.savePakets([
    { id: 1, nama: 'Netflix 1P',       harga: 45000, hpp: 30000, durasi: 30, status: 'aktif' },
    { id: 2, nama: 'Spotify 1B',       harga: 20000, hpp: 12000, durasi: 30, status: 'aktif' },
    { id: 3, nama: 'Disney+ 1P',       harga: 35000, hpp: 22000, durasi: 30, status: 'aktif' },
    { id: 4, nama: 'YouTube Premium',  harga: 25000, hpp: 16000, durasi: 30, status: 'aktif' },
    { id: 5, nama: 'Netflix 7 Hari',   harga: 15000, hpp: 10000, durasi: 7,  status: 'aktif' },
  ]);
  DB.saveCustomers([
    { id: 1, nama: 'Budi Santoso',    wa: '6281234567890', catatan: 'VIP customer' },
    { id: 2, nama: 'Sari Dewi',       wa: '6287654321098', catatan: '' },
    { id: 3, nama: 'Andi Kurniawan',  wa: '6285555123456', catatan: 'Sering terlambat bayar' },
  ]);
  DB.saveSuppliers([
    { id: 1, nama: 'Toko Akun ABC',   kontak: '6281111222333' },
    { id: 2, nama: 'DigitalStore ID', kontak: 'Telegram: @digitalstore' },
  ]);
  const today = new Date();
  DB.saveTransaksis([
    { id: 1, tgl: fmtDate(new Date(today.getFullYear(), today.getMonth(), 1)),   custId: 1, paketId: 1, harga: 45000, hpp: 30000, profit: 15000, mulai: fmtDate(new Date(today.getFullYear(), today.getMonth(), 1)),  expired: fmtDate(new Date(today.getFullYear(), today.getMonth(), 31)),                  statusLangganan: 'aktif',   statusBayar: 'lunas',   suppId: 1, catatan: 'Email: budi@gmail.com | Pass: Budi1234' },
    { id: 2, tgl: fmtDate(new Date(today.getFullYear(), today.getMonth(), 3)),   custId: 2, paketId: 2, harga: 20000, hpp: 12000, profit: 8000,  mulai: fmtDate(new Date(today.getFullYear(), today.getMonth(), 3)),  expired: fmtDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2)), statusLangganan: 'aktif',   statusBayar: 'lunas',   suppId: 2, catatan: '' },
    { id: 3, tgl: fmtDate(new Date(today.getFullYear(), today.getMonth() - 1, 15)), custId: 3, paketId: 3, harga: 35000, hpp: 22000, profit: 13000, mulai: fmtDate(new Date(today.getFullYear(), today.getMonth() - 1, 15)), expired: fmtDate(new Date(today.getFullYear(), today.getMonth() - 1, 44)), statusLangganan: 'expired',  statusBayar: 'lunas',   suppId: 1, catatan: '' },
    { id: 4, tgl: fmtDate(new Date(today.getFullYear(), today.getMonth(), 5)),   custId: 1, paketId: 4, harga: 25000, hpp: 16000, profit: 9000,  mulai: fmtDate(new Date(today.getFullYear(), today.getMonth(), 5)),  expired: fmtDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)), statusLangganan: 'aktif',   statusBayar: 'pending', suppId: 2, catatan: 'Akun slot 3 dari supplier B' },
  ]);
  DB.saveBiayas([
    { id: 1, nama: 'Iklan IG', nominal: 50000, tgl: fmtDate(new Date(today.getFullYear(), today.getMonth(), 1)) },
    { id: 2, nama: 'Domain',   nominal: 20000, tgl: fmtDate(new Date(today.getFullYear(), today.getMonth(), 10)) },
  ]);
}

// ─── UTILS ───
function fmtDate(d) {
  if (!(d instanceof Date) || isNaN(d)) return '';
  return d.toISOString().split('T')[0];
}

function fmtRupiah(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

function fmtShort(n) {
  n = Number(n || 0);
  if (n >= 1000000) return 'Rp ' + (n / 1000000).toFixed(1).replace('.0', '') + 'jt';
  if (n >= 1000)    return 'Rp ' + (n / 1000).toFixed(0) + 'rb';
  return 'Rp ' + n;
}

// ─── STATUS UPDATE ───
function updateLanggananStatus() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const trxs = DB.transaksis();
  let changed = false;
  trxs.forEach(t => {
    const exp = new Date(t.expired); exp.setHours(0, 0, 0, 0);
    const ns = today > exp ? 'expired' : 'aktif';
    if (t.statusLangganan !== ns) { t.statusLangganan = ns; changed = true; }
  });
  if (changed) DB.saveTransaksis(trxs);
}

function checkReminders() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiring = DB.transaksis().filter(t => {
    if (t.statusLangganan !== 'aktif') return false;
    const exp = new Date(t.expired); exp.setHours(0, 0, 0, 0);
    const diff = (exp - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3;
  });
  const n = expiring.length;
  const badge = document.getElementById('reminderBadge');
  const bnavBadge = document.getElementById('bnavBadge');
  if (badge) { badge.style.display = n ? 'inline-flex' : 'none'; badge.textContent = n; }
  if (bnavBadge) { bnavBadge.style.display = n ? 'flex' : 'none'; bnavBadge.textContent = n; }
}

// ─── AUTH UI ───
function showAuthTab(t) {
  document.getElementById('loginForm').style.display    = t === 'login'    ? 'flex' : 'none';
  document.getElementById('registerForm').style.display = t === 'register' ? 'flex' : 'none';
  document.getElementById('tabLogin').classList.toggle('active',    t === 'login');
  document.getElementById('tabRegister').classList.toggle('active', t === 'register');
  document.getElementById('authMsg').style.display = 'none';
}

function showAuthMsg(msg, ok = false) {
  const el = document.getElementById('authMsg');
  el.textContent = msg;
  el.style.display = 'block';
  el.style.color = ok ? '#10b981' : '#ef4444';
}

function togglePass(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}

// ─── NAVIGATION ───
const PAGE_TITLES = {
  dashboard: 'Dashboard', transaksi: 'Transaksi', langganan: 'Langganan',
  paket: 'Master Paket', customer: 'Customer', supplier: 'Supplier',
  laporan: 'Laporan', biaya: 'Biaya', profit: 'Profit', profil: 'Akun',
};

// Pages that get highlighted in bottom nav
const BNAV_MAP = {
  dashboard: 'dashboard',
  transaksi: 'transaksi',
  langganan: null,
  paket: null, customer: null, supplier: null,
  laporan: null, biaya: null, profit: null,
  profil: 'profil',
};

function showPage(name) {
  document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');

  // Topbar
  document.getElementById('topbarTitle').textContent = PAGE_TITLES[name] || name;

  // Sidebar nav active
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === name);
  });

  // Bottom nav active
  document.querySelectorAll('.bnav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.page === name);
  });

  // Scroll to top
  const ca = document.getElementById('contentArea');
  if (ca) ca.scrollTop = 0;

  // Render
  const renders = {
    dashboard: renderDashboard,
    transaksi: renderTransaksi,
    langganan: renderLangganan,
    paket:     renderPaket,
    customer:  renderCustomer,
    supplier:  renderSupplier,
    laporan:   renderLaporan,
    biaya:     renderBiaya,
    profit:    renderProfit,
  };
  if (renders[name]) renders[name]();
}

// ─── MOBILE MENU ───
function toggleMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
}

// ─── FAB MENU ───
function openFabMenu() {
  const fab = document.getElementById('fabBtn');
  const menu = document.getElementById('fabMenu');
  fab.classList.add('open');
  menu.style.display = 'block';
}

function closeFabMenu() {
  const fab = document.getElementById('fabBtn');
  const menu = document.getElementById('fabMenu');
  fab.classList.remove('open');
  menu.style.display = 'none';
}

// ─── MASTER MENU ───
function toggleMasterMenu() {
  const menu = document.getElementById('masterMenu');
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function closeMasterMenu() {
  document.getElementById('masterMenu').style.display = 'none';
}

// ─── DARK MODE ───
function toggleDark() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? '' : 'dark');
  const icons = ['darkIcon', 'darkIconMobile', 'darkIconProfil'];
  const label = document.getElementById('darkModeLabel');
  icons.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = isDark ? 'bi bi-moon' : 'bi bi-sun';
  });
  if (label) label.textContent = isDark ? 'Dark Mode' : 'Light Mode';
  DB.set('darkMode', !isDark);
}

// ─── TOAST ───
function showToast(msg, type = 'success') {
  const icons = { success: '✓', error: '✕', warning: '!' };
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = 'toast-item';
  t.innerHTML = `<span>${icons[type] || '✓'}</span>${msg}`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 3000);
}

// ─── MODAL ───
let _currentEditId = null;

function openModal(title, bodyHtml, onSave, saveLabel = 'Simpan') {
  const el = document.getElementById('modalContainer');
  el.innerHTML = `
    <div class="modal-backdrop" id="modalBg" onclick="closeModalOnBg(event)">
      <div class="modal-box">
        <div class="modal-drag"></div>
        <div class="modal-header">
          <h5>${title}</h5>
          <button class="btn-modal-close" onclick="closeModal()"><i class="bi bi-x"></i></button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        <div class="modal-footer">
          <button class="btn-cancel" onclick="closeModal()">Batal</button>
          <button class="btn-save" onclick="${onSave}">${saveLabel}</button>
        </div>
      </div>
    </div>`;
}

function closeModal() {
  document.getElementById('modalContainer').innerHTML = '';
  _currentEditId = null;
}

function closeModalOnBg(e) {
  if (e.target.id === 'modalBg') closeModal();
}

function fieldGroup(label, inputHtml) {
  return `<div class="field-group"><label>${label}</label>${inputHtml}</div>`;
}

function selectHtml(id, opts, val = '') {
  return `<select class="field-input" id="${id}">${opts.map(([v, l]) =>
    `<option value="${v}" ${v == val ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
}

// ─── CATATAN FIELD ───
function catatanField(val = '') {
  return fieldGroup(
    'Catatan <span style="font-size:11px;font-weight:400;color:var(--text-3);">(opsional)</span>',
    `<textarea class="field-input" id="tCatatan" rows="3" placeholder="cth: Email: user@mail.com | Pass: xxxxx">${val}</textarea>`
  );
}

// ─── TRANSAKSI CRUD ───
function createTransaction(data) {
  const trxs = DB.transaksis();
  const newId = trxs.length ? Math.max(...trxs.map(t => t.id)) + 1 : 1;
  trxs.push({ id: newId, ...data });
  DB.saveTransaksis(trxs);
  return newId;
}

function updateTransaction(id, data) {
  const trxs = DB.transaksis();
  const idx = trxs.findIndex(t => t.id === id);
  if (idx < 0) return false;
  trxs[idx] = { id, ...data };
  DB.saveTransaksis(trxs);
  return true;
}

function deleteTransaction(id) {
  if (!confirm('Yakin hapus transaksi ini?')) return;
  DB.saveTransaksis(DB.transaksis().filter(t => t.id !== id));
  showToast('Transaksi dihapus');
  renderTransaksi();
  checkReminders();
}

function toggleBayar(id) {
  const trxs = DB.transaksis();
  const idx = trxs.findIndex(t => t.id === id);
  if (idx < 0) return;
  trxs[idx].statusBayar = trxs[idx].statusBayar === 'lunas' ? 'pending' : 'lunas';
  DB.saveTransaksis(trxs);
  renderTransaksi();
  showToast('Status pembayaran diperbarui');
}

// ─── MODAL TRANSAKSI ───
function openModalTransaksi(renewData = null) {
  _currentEditId = null;
  const pks    = DB.pakets().filter(p => p.status === 'aktif');
  const custs  = DB.customers();
  const supps  = DB.suppliers();
  const today  = new Date().toISOString().split('T')[0];

  const html = `
    ${fieldGroup('Tanggal *', `<input type="date" class="field-input" id="tTgl" value="${today}">`)}
    ${fieldGroup('Customer *', `<select class="field-input" id="tCust">
      ${custs.map(c => `<option value="${c.id}" ${renewData && renewData.custId === c.id ? 'selected' : ''}>${c.nama}</option>`).join('')}
    </select>`)}
    ${fieldGroup('Paket *', `<select class="field-input" id="tPaket" onchange="previewProfit()">
      ${pks.map(p => `<option value="${p.id}" data-harga="${p.harga}" data-hpp="${p.hpp}" data-durasi="${p.durasi}" ${renewData && renewData.paketId === p.id ? 'selected' : ''}>${p.nama} — ${fmtRupiah(p.harga)}</option>`).join('')}
    </select>`)}
    <div class="row-2col">
      ${fieldGroup('Harga Jual', `<input class="field-input" id="tHarga" readonly>`)}
      ${fieldGroup('HPP', `<input class="field-input" id="tHpp" readonly>`)}
    </div>
    <div id="profitPreviewArea"></div>
    ${fieldGroup('Supplier', `<select class="field-input" id="tSupp">
      <option value="">— Pilih Supplier —</option>
      ${supps.map(s => `<option value="${s.id}">${s.nama}</option>`).join('')}
    </select>`)}
    ${fieldGroup('Status Bayar', selectHtml('tStatusBayar', [['lunas', 'Lunas'], ['pending', 'Pending']]))}
    ${catatanField('')}`;

  openModal('Tambah Transaksi', html, 'saveTransaksi()', 'Simpan');
  setTimeout(previewProfit, 50);
}

function editTransaksi(id) {
  const t = DB.transaksis().find(t => t.id === id);
  if (!t) return;
  _currentEditId = id;
  const pks   = DB.pakets().filter(p => p.status === 'aktif');
  const custs = DB.customers();
  const supps = DB.suppliers();

  const html = `
    ${fieldGroup('Tanggal *', `<input type="date" class="field-input" id="tTgl" value="${t.tgl}">`)}
    ${fieldGroup('Customer *', `<select class="field-input" id="tCust">
      ${custs.map(c => `<option value="${c.id}" ${t.custId === c.id ? 'selected' : ''}>${c.nama}</option>`).join('')}
    </select>`)}
    ${fieldGroup('Paket *', `<select class="field-input" id="tPaket" onchange="previewProfit()">
      ${pks.map(p => `<option value="${p.id}" data-harga="${p.harga}" data-hpp="${p.hpp}" data-durasi="${p.durasi}" ${t.paketId === p.id ? 'selected' : ''}>${p.nama} — ${fmtRupiah(p.harga)}</option>`).join('')}
    </select>`)}
    <div class="row-2col">
      ${fieldGroup('Harga Jual', `<input class="field-input" id="tHarga" readonly>`)}
      ${fieldGroup('HPP', `<input class="field-input" id="tHpp" readonly>`)}
    </div>
    <div id="profitPreviewArea"></div>
    ${fieldGroup('Supplier', `<select class="field-input" id="tSupp">
      <option value="">— Pilih Supplier —</option>
      ${supps.map(s => `<option value="${s.id}" ${t.suppId === s.id ? 'selected' : ''}>${s.nama}</option>`).join('')}
    </select>`)}
    ${fieldGroup('Status Bayar', selectHtml('tStatusBayar', [['lunas', 'Lunas'], ['pending', 'Pending']], t.statusBayar))}
    ${catatanField(t.catatan || '')}`;

  openModal('Edit Transaksi #' + id, html, 'saveTransaksi()', 'Update');
  setTimeout(previewProfit, 50);
}

function previewProfit() {
  const sel = document.getElementById('tPaket'); if (!sel) return;
  const opt = sel.options[sel.selectedIndex]; if (!opt) return;
  const harga  = parseInt(opt.dataset.harga || 0);
  const hpp    = parseInt(opt.dataset.hpp   || 0);
  const profit = harga - hpp;
  const hEl = document.getElementById('tHarga'); if (hEl) hEl.value = fmtRupiah(harga);
  const pEl = document.getElementById('tHpp');   if (pEl) pEl.value = fmtRupiah(hpp);
  const pa  = document.getElementById('profitPreviewArea');
  if (pa) pa.innerHTML = `<div class="profit-preview-box"><span>Estimasi Profit</span><span>${fmtRupiah(profit)}</span></div>`;
}

function saveTransaksi() {
  const tgl        = document.getElementById('tTgl').value;
  const custId     = parseInt(document.getElementById('tCust').value);
  const paketId    = parseInt(document.getElementById('tPaket').value);
  const statusBayar = document.getElementById('tStatusBayar').value;
  const catatanEl  = document.getElementById('tCatatan');
  const catatan    = catatanEl ? catatanEl.value.trim() : '';
  if (!tgl || !custId || !paketId) { showToast('Lengkapi semua field!', 'error'); return; }
  const paket = DB.pakets().find(p => p.id === paketId);
  if (!paket) { showToast('Paket tidak ditemukan', 'error'); return; }
  const mulai   = tgl;
  const expDate = new Date(tgl); expDate.setDate(expDate.getDate() + paket.durasi);
  const expired = fmtDate(expDate);
  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const expD    = new Date(expired); expD.setHours(0, 0, 0, 0);
  const statusLangganan = today > expD ? 'expired' : 'aktif';
  const suppId  = parseInt(document.getElementById('tSupp').value) || null;
  const trxData = { tgl, custId, paketId, harga: paket.harga, hpp: paket.hpp, profit: paket.harga - paket.hpp, mulai, expired, statusLangganan, statusBayar, suppId, catatan };

  if (_currentEditId !== null) {
    updateTransaction(_currentEditId, trxData);
    showToast('Transaksi diperbarui ✅');
  } else {
    createTransaction(trxData);
    showToast('Transaksi disimpan 🎉');
  }
  closeModal();
  renderTransaksi();
  checkReminders();
}

function doRenewal(trxId) {
  const t = DB.transaksis().find(t => t.id === trxId);
  if (!t) return;
  openModalTransaksi({ custId: t.custId, paketId: t.paketId });
  showToast('Data customer & paket sudah diisi', 'success');
}

// ─── DASHBOARD ───
let _salesChart, _packageChart;

function renderDashboard() {
  const today      = new Date().toISOString().split('T')[0];
  const todayMonth = today.substring(0, 7);
  const trxs       = DB.transaksis();
  const todayTrx   = trxs.filter(t => t.tgl === today);
  const monthTrx   = trxs.filter(t => t.tgl && t.tgl.startsWith(todayMonth));
  const aktif      = trxs.filter(t => t.statusLangganan === 'aktif').length;
  const omzetToday = todayTrx.reduce((a, t) => a + t.harga,  0);
  const profitMo   = monthTrx.reduce((a, t) => a + t.profit, 0);
  const omzetMo    = monthTrx.reduce((a, t) => a + t.harga,  0);

  // Stats
  document.getElementById('dashStats').innerHTML = [
    { label: 'Omzet Hari Ini', value: fmtShort(omzetToday), sub: `${todayTrx.length} transaksi`, icon: 'bi-cash-coin', bg: '#dbeafe', col: '#2563eb' },
    { label: 'Omzet Bulan',    value: fmtShort(omzetMo),    sub: `${monthTrx.length} transaksi`, icon: 'bi-graph-up',  bg: '#d1fae5', col: '#065f46' },
    { label: 'Profit Bulan',   value: fmtShort(profitMo),   sub: 'Laba kotor',                   icon: 'bi-trophy',    bg: '#fef3c7', col: '#92400e' },
    { label: 'Aktif',          value: aktif,                 sub: 'Langganan aktif',              icon: 'bi-people-fill', bg: '#ede9fe', col: '#6d28d9' },
  ].map(s => `
    <div class="stat-card">
      <div class="stat-icon" style="background:${s.bg};color:${s.col};"><i class="bi ${s.icon}"></i></div>
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-sub">${s.sub}</div>
    </div>`).join('');

  // Sales chart
  const months = [], omzetArr = [], profArr = [];
  const MONTHS_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const m = d.toISOString().substring(0, 7);
    months.push(MONTHS_ID[d.getMonth()]);
    const mt = trxs.filter(t => t.tgl && t.tgl.startsWith(m));
    omzetArr.push(mt.reduce((a, t) => a + t.harga,  0));
    profArr.push( mt.reduce((a, t) => a + t.profit, 0));
  }
  if (_salesChart) _salesChart.destroy();
  _salesChart = new Chart(document.getElementById('salesChart'), {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'Omzet',  data: omzetArr, backgroundColor: 'rgba(37,99,235,0.15)',  borderColor: '#2563eb', borderWidth: 2, borderRadius: 6 },
        { label: 'Profit', data: profArr,  backgroundColor: 'rgba(16,185,129,0.15)', borderColor: '#10b981', borderWidth: 2, borderRadius: 6 },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top', labels: { font: { family: "'DM Sans'" }, boxRadius: 4 } } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => fmtShort(v), font: { family: "'DM Mono'", size: 10 } } } },
    },
  });

  // Package chart
  const pks = DB.pakets(); const pkgData = {};
  monthTrx.forEach(t => { const p = pks.find(pk => pk.id === t.paketId); if (p) pkgData[p.nama] = (pkgData[p.nama] || 0) + 1; });
  if (_packageChart) _packageChart.destroy();
  const pkNames = Object.keys(pkgData); const pkVals = Object.values(pkgData);
  _packageChart = new Chart(document.getElementById('packageChart'), {
    type: 'doughnut',
    data: {
      labels: pkNames.length ? pkNames : ['Belum ada data'],
      datasets: [{ data: pkVals.length ? pkVals : [1], backgroundColor: ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'], borderWidth: 0 }],
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { family: "'DM Sans'", size: 11 }, boxRadius: 4 } } } },
  });

  // Reminders
  const today2 = new Date(); today2.setHours(0, 0, 0, 0);
  const expiring = trxs.filter(t => {
    if (t.statusLangganan !== 'aktif') return false;
    const exp = new Date(t.expired); exp.setHours(0, 0, 0, 0);
    const diff = (exp - today2) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3;
  });
  const custs = DB.customers();
  if (!expiring.length) {
    document.getElementById('reminderList').innerHTML = '<p class="empty-note">Tidak ada yang akan expired dalam 3 hari</p>';
  } else {
    document.getElementById('reminderList').innerHTML = expiring.map(t => {
      const c   = custs.find(c => c.id === t.custId);
      const p   = pks.find(p => p.id === t.paketId);
      const exp = new Date(t.expired); exp.setHours(0, 0, 0, 0);
      const diff = Math.round((exp - today2) / (1000 * 60 * 60 * 24));
      return `<div class="reminder-item">
        <div>
          <div style="font-size:13.5px;font-weight:700;">${c ? c.nama : '–'}</div>
          <div style="font-size:12px;color:var(--text-3);">${p ? p.nama : '–'} · Exp: ${t.expired}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="badge badge-warning">${diff}h</span>
          <button class="btn-sm accent" onclick="doRenewal(${t.id})"><i class="bi bi-arrow-repeat"></i> Perpanjang</button>
        </div>
      </div>`;
    }).join('');
  }
}

// ─── TRANSAKSI ───
function renderTransaksi() {
  const search      = (document.getElementById('searchTransaksi') || {}).value || '';
  const filterBayar = (document.getElementById('filterStatusPembayaran') || {}).value || '';
  const filterBulan = (document.getElementById('filterBulanTransaksi') || {}).value || '';
  const trxs  = DB.transaksis();
  const custs = DB.customers();
  const pks   = DB.pakets();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  let filtered = trxs.filter(t => {
    const c = custs.find(c => c.id === t.custId);
    const p = pks.find(p => p.id === t.paketId);
    const q = ((c ? c.nama : '') + (p ? p.nama : '')).toLowerCase();
    if (search && !q.includes(search.toLowerCase())) return false;
    if (filterBayar && t.statusBayar !== filterBayar) return false;
    if (filterBulan && !(t.tgl && t.tgl.startsWith(filterBulan))) return false;
    return true;
  });

  const el = document.getElementById('transaksiList');
  if (!filtered.length) {
    el.innerHTML = `<div class="empty-state"><i class="bi bi-receipt"></i><p>Belum ada transaksi</p></div>`;
    return;
  }

  el.innerHTML = filtered.sort((a, b) => b.id - a.id).map(t => {
    const c    = custs.find(c => c.id === t.custId);
    const p    = pks.find(p => p.id === t.paketId);
    const exp  = new Date(t.expired); exp.setHours(0, 0, 0, 0);
    const diff = Math.round((exp - today) / (1000 * 60 * 60 * 24));
    const isReminder = t.statusLangganan === 'aktif' && diff >= 0 && diff <= 3;
    return `
      <div class="item-card ${isReminder ? 'reminder-card' : ''}">
        <div class="item-card-header">
          <div>
            <div class="item-card-title">${c ? c.nama : '<span style="color:var(--danger)">?</span>'}</div>
            <div class="item-card-sub">${p ? p.nama : '?'} · ${t.tgl}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:15px;font-weight:800;color:var(--text);font-family:var(--mono);">${fmtShort(t.harga)}</div>
            <div class="profit-badge">+${fmtShort(t.profit)}</div>
          </div>
        </div>
        <div class="item-card-body">
          <span class="item-meta"><i class="bi bi-calendar3"></i>${t.mulai} → ${t.expired}</span>
          ${t.catatan ? `<span class="item-meta"><i class="bi bi-sticky" style="color:var(--warning);"></i>${t.catatan.length > 30 ? t.catatan.substring(0, 30) + '…' : t.catatan}</span>` : ''}
        </div>
        <div class="item-card-footer">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <span class="badge ${t.statusLangganan === 'aktif' ? 'badge-success' : 'badge-danger'}">${t.statusLangganan}</span>
            <span class="badge ${t.statusBayar === 'lunas' ? 'badge-info' : 'badge-warning'}">${t.statusBayar}</span>
          </div>
          <div class="item-actions">
            <button class="btn-sm" onclick="toggleBayar(${t.id})" title="Toggle Bayar"><i class="bi bi-arrow-left-right"></i></button>
            <button class="btn-sm" onclick="editTransaksi(${t.id})" title="Edit"><i class="bi bi-pencil"></i></button>
            <button class="btn-sm danger" onclick="deleteTransaction(${t.id})" title="Hapus"><i class="bi bi-trash"></i></button>
            ${t.statusLangganan === 'aktif' ? `<button class="btn-sm accent" onclick="doRenewal(${t.id})" title="Perpanjang"><i class="bi bi-arrow-repeat"></i></button>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}

// ─── LANGGANAN ───
function renderLangganan() {
  const search = (document.getElementById('searchLangganan') || {}).value || '';
  const filterStatus = (document.getElementById('filterLanggananStatus') || {}).value || '';
  const trxs  = DB.transaksis();
  const custs = DB.customers();
  const pks   = DB.pakets();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  let filtered = trxs.filter(t => {
    const c = custs.find(c => c.id === t.custId);
    if (search && !((c ? c.nama : '').toLowerCase().includes(search.toLowerCase()))) return false;
    if (filterStatus && t.statusLangganan !== filterStatus) return false;
    return true;
  });

  const el = document.getElementById('langgananList');
  if (!filtered.length) {
    el.innerHTML = `<div class="empty-state"><i class="bi bi-arrow-repeat"></i><p>Belum ada langganan</p></div>`;
    return;
  }

  el.innerHTML = filtered.sort((a, b) => new Date(a.expired) - new Date(b.expired)).map(t => {
    const c    = custs.find(c => c.id === t.custId);
    const p    = pks.find(p => p.id === t.paketId);
    const exp  = new Date(t.expired); exp.setHours(0, 0, 0, 0);
    const diff = Math.round((exp - today) / (1000 * 60 * 60 * 24));
    const isReminder = t.statusLangganan === 'aktif' && diff >= 0 && diff <= 3;
    return `
      <div class="item-card ${isReminder ? 'reminder-card' : ''}">
        <div class="item-card-header">
          <div>
            <div class="item-card-title">${c ? c.nama : '–'}</div>
            <div class="item-card-sub">${p ? p.nama : '–'}</div>
          </div>
          <span class="badge ${t.statusLangganan === 'aktif' ? 'badge-success' : 'badge-danger'}">${t.statusLangganan}</span>
        </div>
        <div class="item-card-body">
          <span class="item-meta"><i class="bi bi-calendar-range"></i>${t.mulai} → ${t.expired}</span>
          ${t.statusLangganan === 'aktif' ? `<span class="badge ${diff <= 3 ? 'badge-warning' : 'badge-gray'}">${diff} hari tersisa</span>` : ''}
        </div>
        <div class="item-card-footer">
          <div></div>
          <div class="item-actions">
            ${t.statusLangganan === 'aktif' ? `<button class="btn-sm accent" onclick="doRenewal(${t.id})"><i class="bi bi-arrow-repeat"></i> Perpanjang</button>` : ''}
            ${c ? `<a href="https://wa.me/${c.wa}" target="_blank" class="btn-sm success"><i class="bi bi-whatsapp"></i> WA</a>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}

// ─── PAKET ───
function renderPaket() {
  const pks = DB.pakets();
  const el  = document.getElementById('paketList');
  if (!pks.length) {
    el.innerHTML = `<div class="empty-state"><i class="bi bi-box-seam"></i><p>Belum ada paket</p></div>`;
    return;
  }
  el.innerHTML = pks.map(p => `
    <div class="item-card">
      <div class="item-card-header">
        <div>
          <div class="item-card-title">${p.nama}</div>
          <div class="item-card-sub">${p.durasi} hari</div>
        </div>
        <span class="badge ${p.status === 'aktif' ? 'badge-success' : 'badge-gray'}">${p.status}</span>
      </div>
      <div class="item-card-body">
        <span class="item-meta"><i class="bi bi-tag"></i>Jual: <strong>${fmtRupiah(p.harga)}</strong></span>
        <span class="item-meta"><i class="bi bi-box-arrow-in-down"></i>HPP: <strong>${fmtRupiah(p.hpp)}</strong></span>
        <span class="item-meta"><i class="bi bi-graph-up"></i>Margin: <strong style="color:var(--success);">${fmtRupiah(p.harga - p.hpp)}</strong></span>
      </div>
      <div class="item-card-footer">
        <div></div>
        <div class="item-actions">
          <button class="btn-sm" onclick="editPaket(${p.id})"><i class="bi bi-pencil"></i> Edit</button>
          <button class="btn-sm ${p.status === 'aktif' ? 'success' : ''}" onclick="togglePaketStatus(${p.id})">
            <i class="bi bi-toggle-${p.status === 'aktif' ? 'on' : 'off'}"></i> ${p.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
          </button>
        </div>
      </div>
    </div>`).join('');
}

function openModalPaket(id = null) {
  const pks = DB.pakets();
  const p   = id ? pks.find(pk => pk.id === id) : null;
  const html = `
    ${fieldGroup('Nama Paket *', `<input type="text" class="field-input" id="pNama" value="${p ? p.nama : ''}" placeholder="cth: Netflix 1P">`)}
    <div class="row-2col">
      ${fieldGroup('Harga Jual *', `<input type="number" class="field-input" id="pHarga" value="${p ? p.harga : ''}" placeholder="45000">`)}
      ${fieldGroup('HPP *', `<input type="number" class="field-input" id="pHpp" value="${p ? p.hpp : ''}" placeholder="30000">`)}
    </div>
    ${fieldGroup('Durasi', selectHtml('pDurasi', [['7', '7 Hari'], ['30', '30 Hari']], p ? p.durasi : 30))}
    ${fieldGroup('Status', selectHtml('pStatus', [['aktif', 'Aktif'], ['nonaktif', 'Nonaktif']], p ? p.status : 'aktif'))}`;
  openModal(id ? 'Edit Paket' : 'Tambah Paket', html, `savePaket(${id || 'null'})`);
}

function editPaket(id) { openModalPaket(id); }

function savePaket(id) {
  const nama   = document.getElementById('pNama').value.trim();
  const harga  = parseFloat(document.getElementById('pHarga').value);
  const hpp    = parseFloat(document.getElementById('pHpp').value);
  const durasi = parseInt(document.getElementById('pDurasi').value);
  const status = document.getElementById('pStatus').value;
  if (!nama || !harga || !hpp) { showToast('Nama, Harga, HPP wajib diisi!', 'error'); return; }
  const pks = DB.pakets();
  if (id) {
    const idx = pks.findIndex(p => p.id === id);
    if (idx >= 0) pks[idx] = { ...pks[idx], nama, harga, hpp, durasi, status };
  } else {
    const newId = pks.length ? Math.max(...pks.map(p => p.id)) + 1 : 1;
    pks.push({ id: newId, nama, harga, hpp, durasi, status });
  }
  DB.savePakets(pks);
  closeModal();
  showToast('Paket disimpan!');
  renderPaket();
}

function togglePaketStatus(id) {
  const pks = DB.pakets();
  const idx = pks.findIndex(p => p.id === id);
  if (idx >= 0) {
    pks[idx].status = pks[idx].status === 'aktif' ? 'nonaktif' : 'aktif';
    DB.savePakets(pks);
    renderPaket();
    showToast('Status paket diperbarui');
  }
}

// ─── CUSTOMER ───
function renderCustomer() {
  const search = (document.getElementById('searchCustomer') || {}).value || '';
  const custs  = DB.customers();
  const trxs   = DB.transaksis();
  let filtered = custs.filter(c => !search || (c.nama + c.wa).toLowerCase().includes(search.toLowerCase()));
  const el = document.getElementById('customerList');
  if (!filtered.length) {
    el.innerHTML = `<div class="empty-state"><i class="bi bi-people"></i><p>Belum ada customer</p></div>`;
    return;
  }
  el.innerHTML = filtered.map(c => {
    const total = trxs.filter(t => t.custId === c.id).length;
    return `
      <div class="item-card">
        <div class="item-card-header">
          <div>
            <div class="item-card-title">${c.nama}</div>
            <div class="item-card-sub">${c.catatan || '–'}</div>
          </div>
          <span class="badge badge-info">${total} transaksi</span>
        </div>
        <div class="item-card-body">
          <span class="item-meta"><i class="bi bi-whatsapp" style="color:var(--success);"></i>${c.wa}</span>
        </div>
        <div class="item-card-footer">
          <div></div>
          <div class="item-actions">
            <button class="btn-sm" onclick="editCustomer(${c.id})"><i class="bi bi-pencil"></i> Edit</button>
            <a href="https://wa.me/${c.wa}" target="_blank" class="btn-sm success"><i class="bi bi-whatsapp"></i> WA</a>
            <button class="btn-sm accent" onclick="openModalTransaksi({custId:${c.id}})"><i class="bi bi-plus-lg"></i></button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function openModalCustomer(id = null) {
  const custs = DB.customers();
  const c     = id ? custs.find(cu => cu.id === id) : null;
  const html  = `
    ${fieldGroup('Nama *', `<input type="text" class="field-input" id="cNama" value="${c ? c.nama : ''}" placeholder="Nama customer">`)}
    ${fieldGroup('No. WhatsApp *', `<input type="text" class="field-input" id="cWa" value="${c ? c.wa : ''}" placeholder="628xxxxxxxxxx">`)}
    ${fieldGroup('Catatan', `<textarea class="field-input" id="cCatatan" rows="2" placeholder="Catatan opsional">${c ? c.catatan : ''}</textarea>`)}`;
  openModal(id ? 'Edit Customer' : 'Tambah Customer', html, `saveCustomer(${id || 'null'})`);
}

function editCustomer(id) { openModalCustomer(id); }

function saveCustomer(id) {
  const nama   = document.getElementById('cNama').value.trim();
  const wa     = document.getElementById('cWa').value.trim();
  const catatan = document.getElementById('cCatatan').value.trim();
  if (!nama || !wa) { showToast('Nama & WhatsApp wajib diisi!', 'error'); return; }
  const custs = DB.customers();
  if (id) {
    const idx = custs.findIndex(c => c.id === id);
    if (idx >= 0) custs[idx] = { ...custs[idx], nama, wa, catatan };
  } else {
    const newId = custs.length ? Math.max(...custs.map(c => c.id)) + 1 : 1;
    custs.push({ id: newId, nama, wa, catatan });
  }
  DB.saveCustomers(custs);
  closeModal();
  showToast('Customer disimpan!');
  renderCustomer();
}

// ─── SUPPLIER ───
function renderSupplier() {
  const supps = DB.suppliers();
  const trxs  = DB.transaksis();
  const el    = document.getElementById('supplierList');
  if (!supps.length) {
    el.innerHTML = `<div class="empty-state"><i class="bi bi-truck"></i><p>Belum ada supplier</p></div>`;
    return;
  }
  el.innerHTML = supps.map(s => {
    const total = trxs.filter(t => t.suppId === s.id).length;
    return `
      <div class="item-card">
        <div class="item-card-header">
          <div>
            <div class="item-card-title">${s.nama}</div>
            <div class="item-card-sub">${s.kontak}</div>
          </div>
          <span class="badge badge-info">${total} transaksi</span>
        </div>
        <div class="item-card-footer">
          <div></div>
          <button class="btn-sm" onclick="editSupplier(${s.id})"><i class="bi bi-pencil"></i> Edit</button>
        </div>
      </div>`;
  }).join('');
}

function openModalSupplier(id = null) {
  const supps = DB.suppliers();
  const s     = id ? supps.find(sp => sp.id === id) : null;
  const html  = `
    ${fieldGroup('Nama Supplier *', `<input type="text" class="field-input" id="sNama" value="${s ? s.nama : ''}" placeholder="Nama toko / supplier">`)}
    ${fieldGroup('Kontak *', `<input type="text" class="field-input" id="sKontak" value="${s ? s.kontak : ''}" placeholder="No. HP / Telegram / etc">`)}`;
  openModal(id ? 'Edit Supplier' : 'Tambah Supplier', html, `saveSupplier(${id || 'null'})`);
}

function editSupplier(id) { openModalSupplier(id); }

function saveSupplier(id) {
  const nama   = document.getElementById('sNama').value.trim();
  const kontak = document.getElementById('sKontak').value.trim();
  if (!nama || !kontak) { showToast('Semua field wajib diisi!', 'error'); return; }
  const supps = DB.suppliers();
  if (id) {
    const idx = supps.findIndex(s => s.id === id);
    if (idx >= 0) supps[idx] = { ...supps[idx], nama, kontak };
  } else {
    const newId = supps.length ? Math.max(...supps.map(s => s.id)) + 1 : 1;
    supps.push({ id: newId, nama, kontak });
  }
  DB.saveSuppliers(supps);
  closeModal();
  showToast('Supplier disimpan!');
  renderSupplier();
}

// ─── LAPORAN ───
let _laporanChart, _laporanPaketChart;

function renderLaporan() {
  const periode = (document.getElementById('filterLaporanPeriode') || {}).value || '';
  const trxs    = DB.transaksis();
  const custs   = DB.customers();
  const pks     = DB.pakets();
  const filtered = periode ? trxs.filter(t => t.tgl && t.tgl.startsWith(periode)) : trxs;

  const totalOmzet  = filtered.reduce((a, t) => a + t.harga,  0);
  const totalProfit = filtered.reduce((a, t) => a + t.profit, 0);
  const totalHpp    = filtered.reduce((a, t) => a + t.hpp,    0);

  document.getElementById('laporanStats').innerHTML = [
    { label: 'Total Transaksi', value: filtered.length, sub: '' },
    { label: 'Total Omzet',     value: fmtShort(totalOmzet), sub: '' },
    { label: 'Total HPP',       value: fmtShort(totalHpp),   sub: '' },
    { label: 'Laba Kotor',      value: fmtShort(totalProfit), sub: '', accent: true },
  ].map(s => `
    <div class="stat-card">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value" ${s.accent ? 'style="color:var(--success)"' : ''}>${s.value}</div>
    </div>`).join('');

  const MONTHS_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const months = [], omzetArr = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const m = d.toISOString().substring(0, 7);
    months.push(MONTHS_ID[d.getMonth()]);
    omzetArr.push(trxs.filter(t => t.tgl && t.tgl.startsWith(m)).reduce((a, t) => a + t.harga, 0));
  }

  if (_laporanChart) _laporanChart.destroy();
  _laporanChart = new Chart(document.getElementById('laporanChart'), {
    type: 'line',
    data: {
      labels: months,
      datasets: [{ label: 'Omzet', data: omzetArr, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.07)', fill: true, tension: 0.4, pointBackgroundColor: '#2563eb', pointRadius: 4 }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => fmtShort(v), font: { family: "'DM Mono'", size: 10 } } } },
    },
  });

  const pkgData = {};
  filtered.forEach(t => { const p = pks.find(p => p.id === t.paketId); if (p) pkgData[p.nama] = (pkgData[p.nama] || 0) + 1; });
  if (_laporanPaketChart) _laporanPaketChart.destroy();
  const pkNames = Object.keys(pkgData); const pkVals = Object.values(pkgData);
  _laporanPaketChart = new Chart(document.getElementById('laporanPaketChart'), {
    type: 'doughnut',
    data: {
      labels: pkNames.length ? pkNames : ['Belum ada'],
      datasets: [{ data: pkVals.length ? pkVals : [1], backgroundColor: ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6'], borderWidth: 0 }],
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { family: "'DM Sans'", size: 11 }, boxRadius: 4 } } } },
  });

  const el = document.getElementById('laporanList');
  if (!filtered.length) {
    el.innerHTML = `<div class="empty-state"><i class="bi bi-bar-chart"></i><p>Tidak ada data</p></div>`;
    return;
  }
  el.innerHTML = filtered.sort((a, b) => new Date(b.tgl) - new Date(a.tgl)).map(t => {
    const c = custs.find(c => c.id === t.custId);
    const p = pks.find(p => p.id === t.paketId);
    return `
      <div class="item-card">
        <div class="item-card-header">
          <div>
            <div class="item-card-title">${c ? c.nama : '–'}</div>
            <div class="item-card-sub">${p ? p.nama : '–'} · ${t.tgl}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:800;font-family:var(--mono);">${fmtShort(t.harga)}</div>
            <div class="profit-badge">+${fmtShort(t.profit)}</div>
          </div>
        </div>
        <div class="item-card-footer">
          <span class="badge ${t.statusBayar === 'lunas' ? 'badge-info' : 'badge-warning'}">${t.statusBayar}</span>
          <span class="item-meta">HPP: ${fmtShort(t.hpp)}</span>
        </div>
      </div>`;
  }).join('');
}

function exportLaporan() {
  const trxs  = DB.transaksis();
  const custs = DB.customers();
  const pks   = DB.pakets();
  let csv = 'Tanggal,Customer,Paket,Harga Jual,HPP,Profit,Status Bayar,Catatan\n';
  trxs.forEach(t => {
    const c = custs.find(c => c.id === t.custId);
    const p = pks.find(p => p.id === t.paketId);
    csv += `${t.tgl},"${c ? c.nama : '?'}","${p ? p.nama : '?'}",${t.harga},${t.hpp},${t.profit},${t.statusBayar},"${(t.catatan || '').replace(/"/g, '""')}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = 'laporan_subflow.csv'; a.click();
  showToast('Export CSV berhasil!');
}

// ─── BIAYA ───
function renderBiaya() {
  const biayas    = DB.biayas();
  const todayMonth = new Date().toISOString().substring(0, 7);
  const monthTotal = biayas.filter(b => b.tgl && b.tgl.startsWith(todayMonth)).reduce((a, b) => a + b.nominal, 0);
  const allTotal   = biayas.reduce((a, b) => a + b.nominal, 0);

  document.getElementById('biayaStats').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Biaya Bulan Ini</div>
      <div class="stat-value" style="color:var(--danger);">${fmtShort(monthTotal)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Semua Biaya</div>
      <div class="stat-value">${fmtShort(allTotal)}</div>
    </div>`;

  const el = document.getElementById('biayaList');
  if (!biayas.length) {
    el.innerHTML = `<div class="empty-state"><i class="bi bi-wallet2"></i><p>Belum ada biaya</p></div>`;
    return;
  }
  el.innerHTML = biayas.sort((a, b) => new Date(b.tgl) - new Date(a.tgl)).map(b => `
    <div class="item-card">
      <div class="item-card-header">
        <div>
          <div class="item-card-title">${b.nama}</div>
          <div class="item-card-sub">${b.tgl}</div>
        </div>
        <div style="font-size:15px;font-weight:800;color:var(--danger);font-family:var(--mono);">${fmtShort(b.nominal)}</div>
      </div>
      <div class="item-card-footer">
        <div></div>
        <button class="btn-sm danger" onclick="hapusBiaya(${b.id})"><i class="bi bi-trash"></i> Hapus</button>
      </div>
    </div>`).join('');
}

function openModalBiaya() {
  const html = `
    ${fieldGroup('Nama Biaya *', `<input type="text" class="field-input" id="bNama" placeholder="cth: Iklan, Hosting, dll">`)}
    ${fieldGroup('Nominal *', `<input type="number" class="field-input" id="bNominal" placeholder="50000">`)}
    ${fieldGroup('Tanggal *', `<input type="date" class="field-input" id="bTgl" value="${new Date().toISOString().split('T')[0]}">`)}`;
  openModal('Tambah Biaya', html, 'saveBiaya()');
}

function saveBiaya() {
  const nama    = document.getElementById('bNama').value.trim();
  const nominal = parseFloat(document.getElementById('bNominal').value);
  const tgl     = document.getElementById('bTgl').value;
  if (!nama || !nominal || !tgl) { showToast('Semua field wajib diisi!', 'error'); return; }
  const biayas = DB.biayas();
  const newId  = biayas.length ? Math.max(...biayas.map(b => b.id)) + 1 : 1;
  biayas.push({ id: newId, nama, nominal, tgl });
  DB.saveBiayas(biayas);
  closeModal();
  showToast('Biaya dicatat!');
  renderBiaya();
}

function hapusBiaya(id) {
  if (!confirm('Hapus biaya ini?')) return;
  DB.saveBiayas(DB.biayas().filter(b => b.id !== id));
  renderBiaya();
  showToast('Biaya dihapus');
}

// ─── PROFIT ───
let _profitChart;

function renderProfit() {
  const filterBulan = (document.getElementById('filterProfitBulan') || {}).value || new Date().toISOString().substring(0, 7);
  const pfEl = document.getElementById('filterProfitBulan');
  if (pfEl) pfEl.value = filterBulan;

  const trxs   = DB.transaksis();
  const biayas = DB.biayas();
  const mTrx   = trxs.filter(t => t.tgl && t.tgl.startsWith(filterBulan));
  const mBiaya = biayas.filter(b => b.tgl && b.tgl.startsWith(filterBulan));

  const totalPenjualan = mTrx.reduce((a, t) => a + t.harga,    0);
  const totalHpp       = mTrx.reduce((a, t) => a + t.hpp,      0);
  const labaKotor      = mTrx.reduce((a, t) => a + t.profit,   0);
  const totalBiaya     = mBiaya.reduce((a, b) => a + b.nominal, 0);
  const labaBersih     = labaKotor - totalBiaya;

  document.getElementById('profitStats').innerHTML = [
    { label: 'Total Penjualan', value: fmtShort(totalPenjualan) },
    { label: 'Total HPP',       value: fmtShort(totalHpp) },
    { label: 'Laba Kotor',      value: fmtShort(labaKotor), accent: 'success' },
    { label: 'Biaya Ops',       value: fmtShort(totalBiaya), accent: 'danger' },
  ].map(s => `
    <div class="stat-card">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value" ${s.accent ? `style="color:var(--${s.accent})"` : ''}>${s.value}</div>
    </div>`).join('');

  const MONTHS_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const months = [], labaArr = [], biayaArr = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const m = d.toISOString().substring(0, 7);
    months.push(MONTHS_ID[d.getMonth()]);
    labaArr.push(trxs.filter(t => t.tgl && t.tgl.startsWith(m)).reduce((a, t) => a + t.profit, 0));
    biayaArr.push(biayas.filter(b => b.tgl && b.tgl.startsWith(m)).reduce((a, b) => a + b.nominal, 0));
  }

  if (_profitChart) _profitChart.destroy();
  _profitChart = new Chart(document.getElementById('profitChart'), {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'Laba Kotor', data: labaArr,  backgroundColor: 'rgba(16,185,129,0.18)', borderColor: '#10b981', borderWidth: 2, borderRadius: 6 },
        { label: 'Biaya',      data: biayaArr, backgroundColor: 'rgba(239,68,68,0.15)',  borderColor: '#ef4444', borderWidth: 2, borderRadius: 6 },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top', labels: { font: { family: "'DM Sans'" }, boxRadius: 4 } } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => fmtShort(v), font: { family: "'DM Mono'", size: 10 } } } },
    },
  });

  document.getElementById('profitDetail').innerHTML = [
    ['Total Penjualan',  totalPenjualan, 'var(--text)'],
    ['Total HPP',        totalHpp,       'var(--danger)'],
    ['Laba Kotor',       labaKotor,      'var(--success)'],
    ['Biaya Operasional',totalBiaya,     'var(--danger)'],
    ['🎯 Laba Bersih',  labaBersih,     labaBersih >= 0 ? 'var(--success)' : 'var(--danger)'],
  ].map(([l, v, c]) => `
    <div class="profit-row">
      <span>${l}</span>
      <strong style="color:${c};">${fmtRupiah(v)}</strong>
    </div>`).join('');
}

// ─── PROFIL ───
function applyProfilePhoto(base64) {
  const big = document.getElementById('profileAvatarBig');
  if (big) big.innerHTML = `<img src="${base64}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
}

// ─── STARTUP ───
(function init() {
  // Dark mode
  const savedDark = DB.get('darkMode');
  if (savedDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    ['darkIcon', 'darkIconMobile', 'darkIconProfil'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.className = 'bi bi-sun';
    });
    const label = document.getElementById('darkModeLabel');
    if (label) label.textContent = 'Light Mode';
  }

  // Default month filters
  const curMonth = new Date().toISOString().substring(0, 7);
  ['filterBulanTransaksi', 'filterLaporanPeriode', 'filterProfitBulan'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = curMonth;
  });
})();