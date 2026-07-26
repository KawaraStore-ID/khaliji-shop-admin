// ===== Username & Password Admin =====
const ADMIN_USERNAME = 'khaliji';
const ADMIN_PASSWORD = '120407';

// ===== Elemen =====
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

const statusText = document.getElementById('statusText');
const toggleStatusBtn = document.getElementById('toggleStatusBtn');

const incomeAmount = document.getElementById('incomeAmount');
const incomeSubtext = document.getElementById('incomeSubtext');

const productForm = document.getElementById('productForm');
const productIdField = document.getElementById('productId');
const productCategory = document.getElementById('productCategory');
const productTitle = document.getElementById('productTitle');
const productPrice = document.getElementById('productPrice');
const productImageFile = document.getElementById('productImageFile');
const imagePreviewWrap = document.getElementById('imagePreviewWrap');
const imagePreview = document.getElementById('imagePreview');
const removeImageBtn = document.getElementById('removeImageBtn');
const productDesc = document.getElementById('productDesc');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formMsg = document.getElementById('formMsg');
const productList = document.getElementById('productList');

let storeIsOpen = true;
let currentImageData = ''; // base64 data URL foto yang akan disimpan
let allProductsCache = [];

// ===== Login sederhana =====
function showDashboard() {
  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  loadStatus();
  loadProducts();
}
function showLogin() {
  loginView.classList.remove('hidden');
  dashboardView.classList.add('hidden');
}
if (localStorage.getItem('khaliji_admin_logged_in') === 'yes') {
  showDashboard();
} else {
  showLogin();
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    localStorage.setItem('khaliji_admin_logged_in', 'yes');
    loginForm.reset();
    showDashboard();
  } else {
    loginError.textContent = 'Username atau password salah.';
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('khaliji_admin_logged_in');
  showLogin();
});

// ===== Status toko (buka / tutup) — dengan penanganan error =====
function loadStatus() {
  toggleStatusBtn.textContent = 'Memuat...';
  toggleStatusBtn.disabled = true;
  db.collection('settings').doc('store').get().then(doc => {
    storeIsOpen = doc.exists ? doc.data().isOpen !== false : true;
    renderStatus();
    toggleStatusBtn.disabled = false;
  }).catch(err => {
    console.error(err);
    statusText.textContent = 'Gagal memuat status. Cek koneksi internet atau pengaturan Firebase (firebase-config.js & Firestore rules).';
    toggleStatusBtn.textContent = 'Coba Lagi';
    toggleStatusBtn.disabled = false;
    toggleStatusBtn.onclick = loadStatus;
  });
}

function renderStatus() {
  toggleStatusBtn.onclick = handleToggleStatus;
  if (storeIsOpen) {
    statusText.textContent = 'Toko sedang BUKA — pembeli bisa melihat & memesan produk.';
    toggleStatusBtn.textContent = 'Tutup Toko';
    toggleStatusBtn.classList.remove('closed');
  } else {
    statusText.textContent = 'Toko sedang TUTUP — pengunjung hanya melihat tulisan "LAGI TUTUP".';
    toggleStatusBtn.textContent = 'Buka Toko';
    toggleStatusBtn.classList.add('closed');
  }
}

function handleToggleStatus() {
  storeIsOpen = !storeIsOpen;
  toggleStatusBtn.disabled = true;
  db.collection('settings').doc('store').set({ isOpen: storeIsOpen }, { merge: true })
    .then(() => renderStatus())
    .catch(err => {
      alert('Gagal mengubah status. Coba lagi.');
      console.error(err);
      storeIsOpen = !storeIsOpen;
    })
    .finally(() => { toggleStatusBtn.disabled = false; });
}

// ===== Upload & kompres foto =====
productImageFile.addEventListener('change', () => {
  const file = productImageFile.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert('File harus berupa gambar.');
    productImageFile.value = '';
    return;
  }
  compressImage(file, 900, 0.72).then(dataUrl => {
    if (dataUrl.length > 900000) {
      // terlalu besar, coba kompres lebih agresif
      return compressImage(file, 600, 0.55).then(smallerUrl => {
        currentImageData = smallerUrl;
        showPreview(smallerUrl);
      });
    }
    currentImageData = dataUrl;
    showPreview(dataUrl);
  }).catch(err => {
    console.error(err);
    alert('Gagal memproses foto. Coba foto lain.');
  });
});

removeImageBtn.addEventListener('click', () => {
  currentImageData = '';
  productImageFile.value = '';
  imagePreviewWrap.classList.add('hidden');
  imagePreview.src = '';
});

function showPreview(dataUrl) {
  imagePreview.src = dataUrl;
  imagePreviewWrap.classList.remove('hidden');
}

function compressImage(file, maxWidth, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ===== Produk: tambah / edit =====
productForm.addEventListener('submit', (e) => {
  e.preventDefault();
  formMsg.textContent = '';
  submitBtn.disabled = true;

  const id = productIdField.value;

  const baseData = {
    category: productCategory.value,
    title: productTitle.value.trim(),
    price: Number(productPrice.value),
    description: productDesc.value.trim()
  };
  if (currentImageData) {
    baseData.imageUrl = currentImageData;
  }

  let savePromise;
  if (id) {
    savePromise = db.collection('products').doc(id).update(baseData);
  } else {
    savePromise = db.collection('products').add({
      ...baseData,
      imageUrl: baseData.imageUrl || '',
      sold: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  savePromise.then(() => {
    formMsg.textContent = id ? 'Postingan berhasil diperbarui.' : 'Postingan berhasil ditambahkan.';
    resetForm();
    loadProducts();
  }).catch(err => {
    formMsg.textContent = '';
    alert('Gagal menyimpan. Coba lagi.');
    console.error(err);
  }).finally(() => {
    submitBtn.disabled = false;
  });
});

cancelEditBtn.addEventListener('click', resetForm);

function resetForm() {
  productForm.reset();
  productIdField.value = '';
  currentImageData = '';
  productImageFile.value = '';
  imagePreviewWrap.classList.add('hidden');
  formTitle.textContent = 'Tambah Postingan';
  submitBtn.textContent = 'Posting';
  cancelEditBtn.classList.add('hidden');
}

// ===== Produk: daftar / edit / hapus / tandai terjual =====
function loadProducts() {
  db.collection('products').orderBy('createdAt', 'desc').get().then(snap => {
    allProductsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProductList();
    renderIncome();
  }).catch(err => {
    productList.innerHTML = '<p class="sub">Gagal memuat postingan. Cek koneksi/pengaturan Firebase.</p>';
    console.error(err);
  });
}

function renderIncome() {
  const sold = allProductsCache.filter(p => p.sold);
  const total = sold.reduce((sum, p) => sum + Number(p.price || 0), 0);
  incomeAmount.textContent = 'Rp ' + total.toLocaleString('id-ID');
  incomeSubtext.textContent = `dari ${sold.length} produk terjual`;
}

function renderProductList() {
  if (allProductsCache.length === 0) {
    productList.innerHTML = '<p class="sub">Belum ada postingan.</p>';
    return;
  }
  productList.innerHTML = '';
  allProductsCache.forEach(p => {
    const item = document.createElement('div');
    item.className = 'admin-product-item' + (p.sold ? ' sold' : '');
    item.innerHTML = `
      ${p.imageUrl
        ? `<img src="${p.imageUrl}" alt="">`
        : `<div class="no-img">No Foto</div>`}
      <div class="admin-product-info">
        <div class="cat">${escapeHtml(p.category)}</div>
        <div class="title">${escapeHtml(p.title)}${p.sold ? '<span class="sold-badge">TERJUAL</span>' : ''}</div>
        <div class="price">Rp ${Number(p.price).toLocaleString('id-ID')}</div>
      </div>
      <div class="admin-product-actions">
        <button data-action="sold" class="mark-sold">${p.sold ? 'Batal Terjual' : 'Tandai Terjual'}</button>
        <button data-action="edit">Edit</button>
        <button data-action="delete">Hapus</button>
      </div>
    `;
    item.querySelector('[data-action="sold"]').addEventListener('click', () => toggleSold(p.id, !p.sold));
    item.querySelector('[data-action="edit"]').addEventListener('click', () => editProduct(p.id, p));
    item.querySelector('[data-action="delete"]').addEventListener('click', () => deleteProduct(p.id));
    productList.appendChild(item);
  });
}

function toggleSold(id, soldValue) {
  db.collection('products').doc(id).update({ sold: soldValue }).then(loadProducts).catch(err => {
    alert('Gagal memperbarui status terjual.');
    console.error(err);
  });
}

function editProduct(id, p) {
  productIdField.value = id;
  productCategory.value = p.category;
  productTitle.value = p.title;
  productPrice.value = p.price;
  productDesc.value = p.description;
  currentImageData = '';
  productImageFile.value = '';
  if (p.imageUrl) {
    imagePreview.src = p.imageUrl;
    imagePreviewWrap.classList.remove('hidden');
  } else {
    imagePreviewWrap.classList.add('hidden');
  }
  formTitle.textContent = 'Edit Postingan';
  submitBtn.textContent = 'Simpan Perubahan';
  cancelEditBtn.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteProduct(id) {
  if (!confirm('Yakin mau hapus postingan ini?')) return;
  db.collection('products').doc(id).delete().then(loadProducts).catch(err => {
    alert('Gagal menghapus. Coba lagi.');
    console.error(err);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
