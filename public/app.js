const ADMIN_WHATSAPP = '6287720254002'; // 087720254002 dalam format internasional

const CATEGORIES = [
  { name: 'Tas', emoji: '👜' },
  { name: 'Baju', emoji: '👚' },
  { name: 'Celana', emoji: '👖' },
  { name: 'Jaket', emoji: '🧥' }
];

const closedView = document.getElementById('closedView');
const appView = document.getElementById('appView');

const categoryView = document.getElementById('categoryView');
const categoryGrid = document.getElementById('categoryGrid');

const listView = document.getElementById('listView');
const listCategoryTitle = document.getElementById('listCategoryTitle');
const productGrid = document.getElementById('productGrid');
const backToCategoryBtn = document.getElementById('backToCategoryBtn');

const detailView = document.getElementById('detailView');
const backToListBtn = document.getElementById('backToListBtn');
const detailImage = document.getElementById('detailImage');
const detailCategory = document.getElementById('detailCategory');
const detailTitle = document.getElementById('detailTitle');
const detailPrice = document.getElementById('detailPrice');
const detailDesc = document.getElementById('detailDesc');
const orderForm = document.getElementById('orderForm');

let allProducts = [];
let currentCategory = '';
let currentProduct = null;

// ===== Cek status toko dulu =====
db.collection('settings').doc('store').get().then(doc => {
  const isOpen = doc.exists ? doc.data().isOpen !== false : true;
  if (!isOpen) {
    closedView.classList.remove('hidden');
  } else {
    appView.classList.remove('hidden');
    init();
  }
}).catch(err => {
  console.error(err);
  appView.classList.remove('hidden');
  init();
});

function init() {
  db.collection('products').orderBy('createdAt', 'desc').get().then(snap => {
    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCategories();
  }).catch(err => {
    categoryGrid.innerHTML = '<p class="empty-msg">Gagal memuat data. Coba refresh halaman.</p>';
    console.error(err);
  });
}

function renderCategories() {
  categoryGrid.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const count = allProducts.filter(p => p.category === cat.name).length;
    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerHTML = `
      <span class="emoji">${cat.emoji}</span>
      <div class="name">${cat.name}</div>
      <div class="count">${count} produk</div>
    `;
    card.addEventListener('click', () => openCategory(cat.name));
    categoryGrid.appendChild(card);
  });
}

function openCategory(catName) {
  currentCategory = catName;
  listCategoryTitle.textContent = catName;
  const items = allProducts.filter(p => p.category === catName);

  productGrid.innerHTML = '';
  if (items.length === 0) {
    productGrid.innerHTML = '<p class="empty-msg">Belum ada produk di kategori ini.</p>';
  } else {
    items.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        ${p.imageUrl
          ? `<img class="thumb" src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.title)}">`
          : `<div class="thumb placeholder">Tanpa Foto</div>`}
        <div class="info">
          <div class="title">${escapeHtml(p.title)}</div>
          <div class="price">Rp ${Number(p.price).toLocaleString('id-ID')}</div>
        </div>
      `;
      card.addEventListener('click', () => openDetail(p));
      productGrid.appendChild(card);
    });
  }

  showView(listView);
}

function openDetail(p) {
  currentProduct = p;
  detailCategory.textContent = p.category;
  detailTitle.textContent = p.title;
  detailPrice.textContent = 'Rp ' + Number(p.price).toLocaleString('id-ID');
  detailDesc.textContent = p.description;
  if (p.imageUrl) {
    detailImage.src = p.imageUrl;
    detailImage.style.display = 'block';
  } else {
    detailImage.removeAttribute('src');
    detailImage.style.display = 'none';
  }
  orderForm.reset();
  showView(detailView);
}

backToCategoryBtn.addEventListener('click', () => showView(categoryView));
backToListBtn.addEventListener('click', () => showView(listView));

function showView(view) {
  [categoryView, listView, detailView].forEach(v => v.classList.add('hidden'));
  view.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Form pesan -> WhatsApp =====
orderForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!currentProduct) return;

  const name = document.getElementById('orderName').value.trim();
  const region = document.getElementById('orderRegion').value.trim();
  const phone = document.getElementById('orderPhone').value.trim();

  const message =
`Halo Admin Khaliji Shop, saya mau tanya/pesan produk ini:

Produk: ${currentProduct.title}
Kategori: ${currentProduct.category}
Harga: Rp ${Number(currentProduct.price).toLocaleString('id-ID')}

Data Pemesan:
Nama: ${name}
Daerah: ${region}
No. WhatsApp/Telp: ${phone}`;

  const waUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
