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
    { id: 1, tgl: fmtDate(new Date(today.getFullYear(), today.getMonth(), 1)),   custId: 1, paketId: 1, harga: 45000, hpp: 30000, profit: 15000, mulai: fmtDate(new Date(today.getFullYear(), today.getMonth(), 1)),  expired: fmtDate(new Date(today.getFullYear(), today.getMonth(), 31)),                  statusLangganan: 'aktif',   statusBayar: 'lunas',   suppId: 1, catatan: 'Email: budi@gmail.com | Pass: Budi1234', storeName: 'Nama Store', customerNotes: 'Terima kasih telah berbelanja di Nama Store.' },
    { id: 2, tgl: fmtDate(new Date(today.getFullYear(), today.getMonth(), 3)),   custId: 2, paketId: 2, harga: 20000, hpp: 12000, profit: 8000,  mulai: fmtDate(new Date(today.getFullYear(), today.getMonth(), 3)),  expired: fmtDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2)), statusLangganan: 'aktif',   statusBayar: 'lunas',   suppId: 2, catatan: '', storeName: 'Nama Store', customerNotes: 'Terima kasih telah berbelanja di Nama Store.' },
    { id: 3, tgl: fmtDate(new Date(today.getFullYear(), today.getMonth() - 1, 15)), custId: 3, paketId: 3, harga: 35000, hpp: 22000, profit: 13000, mulai: fmtDate(new Date(today.getFullYear(), today.getMonth() - 1, 15)), expired: fmtDate(new Date(today.getFullYear(), today.getMonth() - 1, 44)), statusLangganan: 'expired',  statusBayar: 'lunas',   suppId: 1, catatan: '', storeName: 'Nama Store', customerNotes: 'Terima kasih telah berbelanja di Nama Store.' },
    { id: 4, tgl: fmtDate(new Date(today.getFullYear(), today.getMonth(), 5)),   custId: 1, paketId: 4, harga: 25000, hpp: 16000, profit: 9000,  mulai: fmtDate(new Date(today.getFullYear(), today.getMonth(), 5)),  expired: fmtDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)), statusLangganan: 'aktif',   statusBayar: 'pending', suppId: 2, catatan: 'Akun slot 3 dari supplier B', storeName: 'Nama Store', customerNotes: 'Terima kasih telah berbelanja di Nama Store.' },
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

// ─── WHATSAPP SERVICE ───
const WhatsAppService = {
  // Konfigurasi API (Bisa diganti dengan endpoint Fonnte, WABlas, dsb)
  API_URL: 'https://api.fonnte.com/send',
  API_TOKEN: 'TOKEN_ANDA_DISINI',
  
  formatNumber(phone) {
    if (!phone) return '';
    let f = phone.replace(/\D/g, '');
    if (f.startsWith('0')) f = '62' + f.substring(1);
    else if (f.startsWith('+62')) f = '62' + f.substring(3);
    return f;
  },

  async logNotification(data) {
    try {
      if (!window._db || !window._fsAddDoc) return;
      await window._fsAddDoc(window._fsCollection(window._db, 'whatsapp_logs'), {
        ...data,
        sentAt: window._fsServerTimestamp()
      });
    } catch (e) { console.warn('[WA Log Error]', e); }
  },

  async sendWA(phoneRaw, message, trxId, custId, retries = 3) {
    const phone = this.formatNumber(phoneRaw);
    if (!phone) return false;

    // Jika token belum diset, jalankan mode simulasi agar aplikasi tidak crash
    if (this.API_TOKEN === 'TOKEN_ANDA_DISINI') {
      console.warn('[WhatsAppService] Mode Simulasi: Token belum diatur. Mengirim simulasi WA H-3 ke', phone);
      await this.logNotification({ subscriptionId: trxId, customerId: custId, phone, message, status: 'simulated_success' });
      return true; 
    }

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(this.API_URL, {
          method: 'POST',
          headers: { 'Authorization': this.API_TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: phone, message: message })
        });
        const data = await response.json();
        if (response.ok && data.status) {
          await this.logNotification({ subscriptionId: trxId, customerId: custId, phone, message, status: 'success' });
          return true;
        } else {
          throw new Error(data.reason || data.detail || 'API Error');
        }
      } catch (error) {
        console.warn(`[WA Retry ${i+1}/${retries}] Failed:`, error.message);
        if (i === retries - 1) {
          showToast('Gagal mengirim notif WA otomatis', 'error');
          await this.logNotification({ subscriptionId: trxId, customerId: custId, phone, message, status: 'failed', error: error.message });
          return false;
        }
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    return false;
  }
};

// ─── REMINDERS & NOTIFICATIONS ───
function checkReminders() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const trxs = DB.transaksis();
  const custs = DB.customers();
  const pks = DB.pakets();

  const expiring = trxs.filter(t => {
    if (t.statusLangganan !== 'aktif') return false;
    const exp = new Date(t.expired); exp.setHours(0, 0, 0, 0);
    const diff = Math.round((exp - today) / (1000 * 60 * 60 * 24));
    
    // Otomatisasi WA H-3
    if (diff === 3) {
      if (!t.whatsappNotifications || !t.whatsappNotifications.h3Sent) {
        const c = custs.find(c => c.id === t.custId);
        const p = pks.find(p => p.id === t.paketId);
        if (c && c.wa) {
          const storeName = window.currentStoreName || 'Nama Store';
          const tglExpired = new Date(t.expired).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'});
          const msg = `Halo ${c.nama},\n\nMasa aktif paket ${p ? p.nama : 'langganan Anda'} di ${storeName} akan berakhir dalam 3 hari, tepat pada ${tglExpired}.\n\nSegera lakukan perpanjangan agar layanan tetap aktif.\n\nTerima kasih.`;
          
          WhatsAppService.sendWA(c.wa, msg, t.id, c.id).then(success => {
            if (success) {
              const idx = DB.transaksis().findIndex(trx => trx.id === t.id);
              if (idx >= 0) {
                const trxsUpdate = DB.transaksis();
                trxsUpdate[idx].whatsappNotifications = {
                  h3Sent: true,
                  h3SentAt: new Date().toISOString() // Fallback from serverTimestamp due to Array limitations
                };
                DB.saveTransaksis(trxsUpdate);
              }
            }
          });
        }
      }
    }

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
  laporan: 'Laporan', biaya: 'Biaya', profit: 'Profit', lainnya: 'Lainnya',
};

const BNAV_MAP = {
  dashboard: 'dashboard',
  transaksi: 'transaksi',
  langganan: null,
  paket: null, customer: null, supplier: null,
  laporan: null, biaya: null, profit: null,
  lainnya: 'lainnya',
};

function showPage(name) {
  document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');

  document.getElementById('topbarTitle').textContent = PAGE_TITLES[name] || name;

  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === name);
  });

  document.querySelectorAll('.bnav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.page === name);
  });

  const ca = document.getElementById('contentArea');
  if (ca) ca.scrollTop = 0;

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

// ─── THEME MODE ───
const THEMES = ['light', 'dark', 'system'];

function applyThemeUI(theme) {
  const icons = ['darkIcon', 'darkIconMobile', 'darkIconLainnya'];
  const label = document.getElementById('darkModeLabelLainnya');
  
  icons.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (theme === 'light') el.className = 'bi bi-sun';
      else if (theme === 'dark') el.className = 'bi bi-moon';
      else el.className = 'bi bi-display';
    }
  });
  
  if (label) {
    if (theme === 'light') label.textContent = 'Light Mode';
    else if (theme === 'dark') label.textContent = 'Dark Mode';
    else label.textContent = 'System Mode';
  }
}

function toggleTheme() {
  let currentTheme = DB.get('appTheme') || 'system';
  let nextIdx = (THEMES.indexOf(currentTheme) + 1) % THEMES.length;
  let newTheme = THEMES[nextIdx];
  
  document.documentElement.classList.remove('light', 'dark', 'system');
  document.documentElement.classList.add(newTheme);
  
  applyThemeUI(newTheme);
  DB.set('appTheme', newTheme);
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

// ─── INVOICE FIELDS ─── (NEW)

function customerNotesField(val = '') {
  return fieldGroup(
    'Keterangan Invoice <span style="font-size:11px;font-weight:400;color:var(--text-3);">(opsional)</span>',
    `<textarea class="field-input" id="tCustomerNotes" rows="2" placeholder="cth: Terima kasih telah berbelanja di Toko Kami.">${val}</textarea>`
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
    ${catatanField('')}
    <div style="border-top:1px solid var(--border);margin:12px 0 4px;padding-top:12px;">
      <div style="font-size:12px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;"><i class="bi bi-receipt" style="margin-right:4px;"></i>Info Invoice</div>
      ${customerNotesField('')}
    </div>`;

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
    ${catatanField(t.catatan || '')}
    <div style="border-top:1px solid var(--border);margin:12px 0 4px;padding-top:12px;">
      <div style="font-size:12px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;"><i class="bi bi-receipt" style="margin-right:4px;"></i>Info Invoice</div>
      ${customerNotesField(t.customerNotes || '')}
    </div>`;

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

  // ─── Keterangan Invoice ───
  const customerNotesEl = document.getElementById('tCustomerNotes');
  const storeName       = window.currentStoreName || 'Nama Store';
  const customerNotesRaw = customerNotesEl ? customerNotesEl.value.trim() : '';
  const customerNotes    = customerNotesRaw || `Terima kasih telah berbelanja di ${storeName}.`;

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
  const trxData = {
    tgl, custId, paketId,
    harga: paket.harga, hpp: paket.hpp, profit: paket.harga - paket.hpp,
    mulai, expired, statusLangganan, statusBayar, suppId, catatan,
    customerNotes
  };

  if (_currentEditId !== null) {
    updateTransaction(_currentEditId, trxData);
    showToast('Transaksi diperbarui ✅');
  } else {
    const newId = createTransaction(trxData);
    showToast('Transaksi disimpan 🎉');
    setTimeout(() => exportInvoiceToJPG(newId), 500);
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

// ─── INVOICE PREVIEW & PRINT (NEW) ───
function previewInvoice(id) {
  const t     = DB.transaksis().find(t => t.id === id);
  if (!t) return;
  const custs = DB.customers();
  const pks   = DB.pakets();
  const c     = custs.find(c => c.id === t.custId);
  const p     = pks.find(p => p.id === t.paketId);

  const storeName     = window.currentStoreName || 'Nama Store';
  const customerNotes = t.customerNotes || `Terima kasih telah berbelanja di ${storeName}.`;
  const custName      = c ? c.nama : '–';
  const paketName     = p ? p.nama : '–';
  const durasi        = p ? p.durasi + ' Hari' : '–';

  const invoiceHtml = `
    <div style="font-family:'DM Sans',sans-serif;max-width:420px;margin:0 auto;background:var(--surface);border-radius:16px;overflow:hidden;border:1px solid var(--border);">
      <div style="background:var(--accent);color:#fff;padding:20px 24px 16px;">
        <div style="font-size:20px;font-weight:800;letter-spacing:-.5px;">${storeName}</div>
        <div style="font-size:12px;opacity:.8;margin-top:2px;">Invoice #${t.id}</div>
      </div>
      <div style="padding:20px 24px;">
        <div style="display:grid;gap:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed var(--border);">
            <span style="font-size:12px;color:var(--text-3);font-weight:500;">Tanggal</span>
            <span style="font-size:13px;font-weight:600;">${t.tgl}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed var(--border);">
            <span style="font-size:12px;color:var(--text-3);font-weight:500;">Customer</span>
            <span style="font-size:13px;font-weight:600;">${custName}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed var(--border);">
            <span style="font-size:12px;color:var(--text-3);font-weight:500;">Aplikasi Premium</span>
            <span style="font-size:13px;font-weight:600;">${paketName}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed var(--border);">
            <span style="font-size:12px;color:var(--text-3);font-weight:500;">Durasi</span>
            <span style="font-size:13px;font-weight:600;">${durasi}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed var(--border);">
            <span style="font-size:12px;color:var(--text-3);font-weight:500;">Periode</span>
            <span style="font-size:13px;font-weight:600;">${t.mulai} → ${t.expired}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:2px solid var(--border);">
            <span style="font-size:14px;font-weight:700;">Total Harga</span>
            <span style="font-size:16px;font-weight:800;color:var(--accent);font-family:var(--mono);">${fmtRupiah(t.harga)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;">
            <span style="font-size:12px;color:var(--text-3);font-weight:500;">Status Bayar</span>
            <span style="font-size:12px;font-weight:700;padding:3px 10px;border-radius:99px;background:${t.statusBayar === 'lunas' ? 'rgba(16,185,129,.15)' : 'rgba(245,158,11,.15)'};color:${t.statusBayar === 'lunas' ? 'var(--success)' : 'var(--warning)'};">${t.statusBayar.toUpperCase()}</span>
          </div>
        </div>
        <div style="margin-top:16px;padding:12px 14px;background:var(--bg);border-radius:10px;border:1px solid var(--border);">
          <div style="font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Keterangan</div>
          <div style="font-size:13px;color:var(--text);line-height:1.5;">${customerNotes}</div>
        </div>
        <div style="text-align:center;margin-top:16px;font-size:11px;color:var(--text-3);">Powered by <strong>Subflow</strong></div>
      </div>
    </div>`;

  const el = document.getElementById('modalContainer');
  el.innerHTML = `
    <div class="modal-backdrop" id="modalBg" onclick="closeModalOnBg(event)">
      <div class="modal-box" style="max-width:460px;">
        <div class="modal-drag"></div>
        <div class="modal-header">
          <h5><i class="bi bi-receipt" style="margin-right:6px;"></i>Invoice #${t.id}</h5>
          <button class="btn-modal-close" onclick="closeModal()"><i class="bi bi-x"></i></button>
        </div>
        <div class="modal-body" id="invoicePreviewBody">${invoiceHtml}</div>
        <div class="modal-footer" style="gap:8px;">
          <button class="btn-cancel" onclick="closeModal()">Tutup</button>
          <button class="btn-save" onclick="printInvoice(${id})" style="background:var(--success);"><i class="bi bi-printer"></i> Cetak</button>
          <button class="btn-save" onclick="downloadInvoice(${id})"><i class="bi bi-download"></i> Download</button>
        </div>
      </div>
    </div>`;
}

function printInvoice(id) {
  const t     = DB.transaksis().find(t => t.id === id);
  if (!t) return;
  const custs = DB.customers();
  const pks   = DB.pakets();
  const c     = custs.find(c => c.id === t.custId);
  const p     = pks.find(p => p.id === t.paketId);
  const storeName     = window.currentStoreName || 'Nama Store';
  const customerNotes = t.customerNotes || `Terima kasih telah berbelanja di ${storeName}.`;
  const durasi        = p ? p.durasi + ' Hari' : '–';

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Invoice #${t.id} — ${storeName}</title>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:'DM Sans',sans-serif;background:#f8fafc;display:flex;justify-content:center;padding:40px 16px;}
      .invoice{max-width:400px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);}
      .inv-header{background:#2563eb;color:#fff;padding:24px 28px 20px;}
      .inv-store{font-size:22px;font-weight:800;letter-spacing:-.5px;}
      .inv-num{font-size:12px;opacity:.75;margin-top:3px;}
      .inv-body{padding:24px 28px;}
      .inv-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px dashed #e2e8f0;}
      .inv-row:last-of-type{border-bottom:none;}
      .inv-label{font-size:12px;color:#64748b;font-weight:500;}
      .inv-val{font-size:13px;font-weight:600;color:#1e293b;}
      .inv-total{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-top:2px solid #e2e8f0;border-bottom:2px solid #e2e8f0;margin:4px 0;}
      .inv-total-label{font-size:14px;font-weight:700;color:#1e293b;}
      .inv-total-val{font-size:18px;font-weight:800;color:#2563eb;font-family:'DM Mono',monospace;}
      .inv-badge{display:inline-block;padding:3px 12px;border-radius:99px;font-size:12px;font-weight:700;}
      .badge-lunas{background:#d1fae5;color:#065f46;}
      .badge-pending{background:#fef3c7;color:#92400e;}
      .inv-notes{margin-top:16px;padding:14px 16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;}
      .inv-notes-label{font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;}
      .inv-notes-text{font-size:13px;color:#334155;line-height:1.55;}
      .inv-footer{text-align:center;margin-top:18px;font-size:11px;color:#94a3b8;}
      @media print{body{background:#fff;padding:0;}@page{margin:0;}.invoice{box-shadow:none;border-radius:0;}}
    </style>
  </head><body>
    <div class="invoice">
      <div class="inv-header">
        <div class="inv-store">${storeName}</div>
        <div class="inv-num">Invoice #${t.id}</div>
      </div>
      <div class="inv-body">
        <div class="inv-row"><span class="inv-label">Tanggal</span><span class="inv-val">${t.tgl}</span></div>
        <div class="inv-row"><span class="inv-label">Customer</span><span class="inv-val">${c ? c.nama : '–'}</span></div>
        <div class="inv-row"><span class="inv-label">Aplikasi Premium</span><span class="inv-val">${p ? p.nama : '–'}</span></div>
        <div class="inv-row"><span class="inv-label">Durasi</span><span class="inv-val">${durasi}</span></div>
        <div class="inv-row"><span class="inv-label">Periode</span><span class="inv-val">${t.mulai} → ${t.expired}</span></div>
        <div class="inv-total">
          <span class="inv-total-label">Total Harga</span>
          <span class="inv-total-val">${fmtRupiah(t.harga)}</span>
        </div>
        <div class="inv-row" style="margin-top:4px;"><span class="inv-label">Status Bayar</span><span class="inv-badge ${t.statusBayar === 'lunas' ? 'badge-lunas' : 'badge-pending'}">${t.statusBayar.toUpperCase()}</span></div>
        <div class="inv-notes">
          <div class="inv-notes-label">Keterangan</div>
          <div class="inv-notes-text">${customerNotes}</div>
        </div>
        <div class="inv-footer">Powered by <strong>Subflow</strong></div>
      </div>
    </div>
    <script>window.onload=function(){window.print();}<\/script>
  </body></html>`);
  win.document.close();
}

function downloadInvoice(id) {
  if (typeof html2canvas === 'undefined') {
    showToast('Library html2canvas tidak ditemukan.', 'error');
    return;
  }
  const t = DB.transaksis().find(t => t.id === id);
  if (!t) return;
  const custs = DB.customers();
  const c     = custs.find(c => c.id === t.custId);

  const storeName = window.currentStoreName || 'Nama Store';
  const custName  = c ? c.nama : 'Customer';
  const dateStr   = t.tgl || new Date().toISOString().split('T')[0];

  const targetEl = document.getElementById('invoicePreviewBody');
  if (!targetEl) return;
  
  const invoiceContainer = targetEl.firstElementChild;
  if (!invoiceContainer) return;

  showToast('Menyiapkan gambar...', 'success');
  html2canvas(invoiceContainer, {
    scale: 3,
    useCORS: true,
    backgroundColor: '#ffffff'
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = `Invoice-${storeName}-${custName}-${dateStr}.jpg`.replace(/\s+/g, '-');
    link.href = canvas.toDataURL('image/jpeg', 1.0);
    link.click();
    showToast('Invoice JPG berhasil didownload!');
  }).catch(err => {
    console.error('Error generating JPG', err);
    showToast('Gagal membuat JPG', 'error');
  });
}

// ─── AUTO EXPORT JPG (NEW) ───
function exportInvoiceToJPG(id) {
  if (typeof html2canvas === 'undefined') {
    showToast('Library html2canvas tidak ditemukan.', 'error');
    return;
  }
  const t = DB.transaksis().find(t => t.id === id);
  if (!t) return;
  const custs = DB.customers();
  const pks   = DB.pakets();
  const c     = custs.find(c => c.id === t.custId);
  const p     = pks.find(p => p.id === t.paketId);

  const storeName     = window.currentStoreName || 'Nama Store';
  const customerNotes = t.customerNotes || `Terima kasih telah berbelanja di ${storeName}.`;
  const custName      = c ? c.nama : '–';
  const paketName     = p ? p.nama : '–';
  const durasi        = p ? p.durasi + ' Hari' : '–';

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '420px';
  container.style.background = '#ffffff';

  container.innerHTML = `
    <div id="captureInvoiceTarget" style="font-family:'DM Sans',sans-serif;max-width:420px;margin:0 auto;background:#ffffff;border-radius:0;overflow:hidden;border:none;">
      <div style="background:#2563eb;color:#fff;padding:20px 24px 16px;">
        <div style="font-size:20px;font-weight:800;letter-spacing:-.5px;">${storeName}</div>
        <div style="font-size:12px;opacity:.8;margin-top:2px;">Invoice #${t.id}</div>
      </div>
      <div style="padding:20px 24px;background:#ffffff;color:#1e293b;">
        <div style="display:grid;gap:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed #e2e8f0;">
            <span style="font-size:12px;color:#64748b;font-weight:500;">Tanggal</span>
            <span style="font-size:13px;font-weight:600;">${t.tgl}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed #e2e8f0;">
            <span style="font-size:12px;color:#64748b;font-weight:500;">Customer</span>
            <span style="font-size:13px;font-weight:600;">${custName}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed #e2e8f0;">
            <span style="font-size:12px;color:#64748b;font-weight:500;">Aplikasi Premium</span>
            <span style="font-size:13px;font-weight:600;">${paketName}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed #e2e8f0;">
            <span style="font-size:12px;color:#64748b;font-weight:500;">Durasi</span>
            <span style="font-size:13px;font-weight:600;">${durasi}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed #e2e8f0;">
            <span style="font-size:12px;color:#64748b;font-weight:500;">Periode</span>
            <span style="font-size:13px;font-weight:600;">${t.mulai} → ${t.expired}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:2px solid #e2e8f0;">
            <span style="font-size:14px;font-weight:700;">Total Harga</span>
            <span style="font-size:16px;font-weight:800;color:#2563eb;font-family:'DM Mono',monospace;">${fmtRupiah(t.harga)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;">
            <span style="font-size:12px;color:#64748b;font-weight:500;">Status Bayar</span>
            <span style="font-size:12px;font-weight:700;padding:3px 10px;border-radius:99px;background:${t.statusBayar === 'lunas' ? '#d1fae5' : '#fef3c7'};color:${t.statusBayar === 'lunas' ? '#059669' : '#d97706'};">${t.statusBayar.toUpperCase()}</span>
          </div>
        </div>
        <div style="margin-top:16px;padding:12px 14px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
          <div style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Keterangan</div>
          <div style="font-size:13px;color:#334155;line-height:1.5;">${customerNotes}</div>
        </div>
        <div style="text-align:center;margin-top:16px;font-size:11px;color:#94a3b8;">Powered by <strong>Subflow</strong></div>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  setTimeout(() => {
    html2canvas(document.getElementById('captureInvoiceTarget'), {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = `Invoice-${storeName}-${custName}-${t.tgl}.jpg`.replace(/\s+/g, '-');
      link.href = canvas.toDataURL('image/jpeg', 1.0);
      link.click();
      document.body.removeChild(container);
      showToast('Invoice JPG berhasil dibuat!');
    }).catch(err => {
      console.error('Error generating JPG', err);
      document.body.removeChild(container);
    });
  }, 100);
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
    const storeName = t.storeName || 'Nama Store';
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
          <span class="item-meta"><i class="bi bi-shop" style="color:var(--accent);"></i>${storeName}</span>
          ${t.catatan ? `<span class="item-meta"><i class="bi bi-sticky" style="color:var(--warning);"></i>${t.catatan.length > 30 ? t.catatan.substring(0, 30) + '…' : t.catatan}</span>` : ''}
        </div>
        <div class="item-card-footer">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <span class="badge ${t.statusLangganan === 'aktif' ? 'badge-success' : 'badge-danger'}">${t.statusLangganan}</span>
            <span class="badge ${t.statusBayar === 'lunas' ? 'badge-info' : 'badge-warning'}">${t.statusBayar}</span>
          </div>
          <div class="item-actions">
            <button class="btn-sm" onclick="previewInvoice(${t.id})" title="Invoice"><i class="bi bi-receipt"></i></button>
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
            <button class="btn-sm" onclick="previewInvoice(${t.id})"><i class="bi bi-receipt"></i> Invoice</button>
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
          <div style="display:flex;gap:6px;align-items:center;">
            <span class="item-meta">HPP: ${fmtShort(t.hpp)}</span>
            <button class="btn-sm" onclick="previewInvoice(${t.id})"><i class="bi bi-receipt"></i></button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function exportLaporan() {
  const trxs  = DB.transaksis();
  const custs = DB.customers();
  const pks   = DB.pakets();
  let csv = 'Tanggal,Customer,Paket,Harga Jual,HPP,Profit,Status Bayar,Nama Store,Keterangan,Catatan\n';
  trxs.forEach(t => {
    const c = custs.find(c => c.id === t.custId);
    const p = pks.find(p => p.id === t.paketId);
    csv += `${t.tgl},"${c ? c.nama : '?'}","${p ? p.nama : '?'}",${t.harga},${t.hpp},${t.profit},${t.statusBayar},"${(t.storeName || 'Nama Store').replace(/"/g,'""')}","${(t.customerNotes || '').replace(/"/g,'""')}","${(t.catatan || '').replace(/"/g, '""')}"\n`;
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

// ─── LAINNYA & PREFERENSI ───
function toggleAccordion(btn) {
  const content = btn.nextElementSibling;
  const isActive = btn.classList.contains('active');
  
  document.querySelectorAll('.accordion-btn').forEach(b => {
    b.classList.remove('active');
    b.nextElementSibling.classList.remove('active');
  });

  if (!isActive) {
    btn.classList.add('active');
    content.classList.add('active');
  }
}

function savePreferences() {
  const notifLangganan = document.getElementById('prefNotifLangganan') ? document.getElementById('prefNotifLangganan').checked : true;
  const notifPaket = document.getElementById('prefNotifPaket') ? document.getElementById('prefNotifPaket').checked : true;
  
  DB.set('prefNotifLangganan', notifLangganan);
  DB.set('prefNotifPaket', notifPaket);
  showToast('Preferensi disimpan');
}

function loadPreferences() {
  const notifLangganan = DB.get('prefNotifLangganan');
  const notifPaket = DB.get('prefNotifPaket');
  
  if (notifLangganan !== null && document.getElementById('prefNotifLangganan')) {
    document.getElementById('prefNotifLangganan').checked = notifLangganan;
  }
  if (notifPaket !== null && document.getElementById('prefNotifPaket')) {
    document.getElementById('prefNotifPaket').checked = notifPaket;
  }
}

// ─── STARTUP ───
(function init() {
  const savedTheme = DB.get('appTheme') || 'system';
  document.documentElement.classList.add(savedTheme);
  applyThemeUI(savedTheme);
  loadPreferences();

  const curMonth = new Date().toISOString().substring(0, 7);
  ['filterBulanTransaksi', 'filterLaporanPeriode', 'filterProfitBulan'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = curMonth;
  });
})();
