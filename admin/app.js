// ===== Elemen =====
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

const statusText = document.getElementById('statusText');
const toggleStatusBtn = document.getElementById('toggleStatusBtn');

const productForm = document.getElementById('productForm');
const productIdField = document.getElementById('productId');
const productCategory = document.getElementById('productCategory');
const productTitle = document.getElementById('productTitle');
const productPrice = document.getElementById('productPrice');
const productImage = document.getElementById('productImage');
const productDesc = document.getElementById('productDesc');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formMsg = document.getElementById('formMsg');
const productList = document.getElementById('productList');

let storeIsOpen = true;

// ===== Auth =====
auth.onAuthStateChanged(user => {
  if (user) {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    loadStatus();
    loadProducts();
  } else {
    loginView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
  }
});

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  auth.signInWithEmailAndPassword(email, password)
    .catch(err => {
      loginError.textContent = 'Email atau kata sandi salah.';
      console.error(err);
    });
});

logoutBtn.addEventListener('click', () => auth.signOut());

// ===== Status toko (buka / tutup) =====
function loadStatus() {
  db.collection('settings').doc('store').get().then(doc => {
    storeIsOpen = doc.exists ? doc.data().isOpen !== false : true;
    renderStatus();
  });
}

function renderStatus() {
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

toggleStatusBtn.addEventListener('click', () => {
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
});

// ===== Produk: tambah / edit =====
productForm.addEventListener('submit', (e) => {
  e.preventDefault();
  formMsg.textContent = '';
  submitBtn.disabled = true;

  const data = {
    category: productCategory.value,
    title: productTitle.value.trim(),
    price: Number(productPrice.value),
    imageUrl: productImage.value.trim(),
    description: productDesc.value.trim(),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  const id = productIdField.value;
  const savePromise = id
    ? db.collection('products').doc(id).update({
        category: data.category,
        title: data.title,
        price: data.price,
        imageUrl: data.imageUrl,
        description: data.description
      })
    : db.collection('products').add(data);

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
  formTitle.textContent = 'Tambah Postingan';
  submitBtn.textContent = 'Posting';
  cancelEditBtn.classList.add('hidden');
}

// ===== Produk: daftar / edit / hapus =====
function loadProducts() {
  db.collection('products').orderBy('createdAt', 'desc').get().then(snap => {
    if (snap.empty) {
      productList.innerHTML = '<p class="sub">Belum ada postingan.</p>';
      return;
    }
    productList.innerHTML = '';
    snap.forEach(doc => {
      const p = doc.data();
      const item = document.createElement('div');
      item.className = 'admin-product-item';
      item.innerHTML = `
        ${p.imageUrl
          ? `<img src="${escapeHtml(p.imageUrl)}" alt="">`
          : `<div class="no-img">No Img</div>`}
        <div class="admin-product-info">
          <div class="cat">${escapeHtml(p.category)}</div>
          <div class="title">${escapeHtml(p.title)}</div>
          <div class="price">Rp ${Number(p.price).toLocaleString('id-ID')}</div>
        </div>
        <div class="admin-product-actions">
          <button data-action="edit">Edit</button>
          <button data-action="delete">Hapus</button>
        </div>
      `;
      item.querySelector('[data-action="edit"]').addEventListener('click', () => editProduct(doc.id, p));
      item.querySelector('[data-action="delete"]').addEventListener('click', () => deleteProduct(doc.id));
      productList.appendChild(item);
    });
  }).catch(err => {
    productList.innerHTML = '<p class="sub">Gagal memuat postingan.</p>';
    console.error(err);
  });
}

function editProduct(id, p) {
  productIdField.value = id;
  productCategory.value = p.category;
  productTitle.value = p.title;
  productPrice.value = p.price;
  productImage.value = p.imageUrl || '';
  productDesc.value = p.description;
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
