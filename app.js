/**
 * B Mart storefront app
 * - Renders product catalog
 * - Manages cart (localStorage persistence)
 * - Applies search, sort, and filter controls
 */

// Catalog data (replace thumbs with your own product image URLs if desired)
const PRODUCTS = [
  { id: 'hero-splendor-plus', title: 'Hero Splendor Plus', brand: 'Hero', category: 'Road', rating: 4.6, price: 79999, mrp: 85999, thumb: 'hero splender.jpg', images: ['hero splender.jpg'] },
  { id: 'bajaj-pulsar-150', title: 'Bajaj Pulsar 150', brand: 'Bajaj', category: 'Road', rating: 4.7, price: 115000, mrp: 122000, thumb: 'pulsar.jpg', images: ['pulsar.jpg'] },
  { id: 'tvs-apache-160', title: 'TVS Apache RTR 160', brand: 'TVS', category: 'Road', rating: 4.5, price: 119000, mrp: 126000, thumb: 'weeb/apache 160.jpg', images: ['weeb/apache 160.jpg'] },
  { id: 'royal-enfield-classic-350', title: 'Royal Enfield Classic 350', brand: 'Royal Enfield', category: 'Road', rating: 4.8, price: 198000, mrp: 210000, thumb: 'images.jpg', images: ['images.jpg'] },
  { id: 'firefox-mtb', title: 'Firefox Bad Attitude MTB', brand: 'Firefox', category: 'Mountain', rating: 4.3, price: 18000, mrp: 22000, thumb: 'blue bike .jpg', images: ['blue bike .jpg'] },
  { id: 'hercules-roadeo', title: 'Hercules Roadeo A75', brand: 'Hercules', category: 'Mountain', rating: 4.4, price: 15000, mrp: 18000, thumb: 'redbike.jpg', images: ['redbike.jpg'] },
  { id: 'montra-hybrid', title: 'Montra Blues Hybrid', brand: 'Montra', category: 'Hybrid', rating: 4.2, price: 22000, mrp: 26000, thumb: 'mof .jpg', images: ['mof .jpg'] },
  { id: 'ather-450x', title: 'Ather 450X (Electric)', brand: 'Ather', category: 'Electric', rating: 4.6, price: 145000, mrp: 155000, thumb: 'anther.jpg', images: ['anther.jpg'] }
];

// Small DOM helpers
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));

// Localized currency formatting (INR)
const formatCurrency = (amount) => new Intl.NumberFormat(
  'en-IN',
  { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }
).format(amount);

const state = {
  search: '',
  brands: new Set(),
  categories: new Set(),
  minPrice: null,
  maxPrice: null,
  sort: 'relevance',
  cart: new Map(), // id -> {product, qty}
};

// Load cart from localStorage
const CART_KEY = 'bikemart_cart_v1';
function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    for (const item of arr) {
      const product = PRODUCTS.find(p => p.id === item.id);
      if (product) state.cart.set(item.id, { product, qty: item.qty });
    }
  } catch (e) { console.warn('Cart load failed', e); }
}
function saveCart() {
  const arr = Array.from(state.cart.values()).map(({ product, qty }) => ({ id: product.id, qty }));
  localStorage.setItem(CART_KEY, JSON.stringify(arr));
}

// Rendering products
/**
 * Returns a filtered and sorted copy of the provided products list
 */
function applyFilters(products) {
  let out = products;
  if (state.search) {
    const q = state.search.toLowerCase();
    out = out.filter(p => `${p.title} ${p.brand} ${p.category}`.toLowerCase().includes(q));
  }
  if (state.brands.size) out = out.filter(p => state.brands.has(p.brand));
  if (state.categories.size) out = out.filter(p => state.categories.has(p.category));
  if (state.minPrice != null) out = out.filter(p => p.price >= state.minPrice);
  if (state.maxPrice != null) out = out.filter(p => p.price <= state.maxPrice);

  switch (state.sort) {
    case 'price-asc': out = out.slice().sort((a,b)=>a.price-b.price); break;
    case 'price-desc': out = out.slice().sort((a,b)=>b.price-a.price); break;
    case 'rating-desc': out = out.slice().sort((a,b)=>b.rating-a.rating); break;
    default: break; // relevance
  }
  return out;
}

/**
 * Renders the product grid based on current state
 */
function renderProducts() {
  const grid = $('#grid');
  const filtered = applyFilters(PRODUCTS);
  $('#resultCount').textContent = `Showing ${filtered.length} bikes`;
  grid.innerHTML = '';
  for (const p of filtered) {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="thumb"><img alt="${p.title}" src="${p.thumb}" loading="lazy"></div>
      <div class="card-body">
        <div class="title">${p.title}</div>
        <div class="meta">${p.brand} • ${p.category} • ⭐ ${p.rating.toFixed(1)}</div>
        <div class="price-row">
          <div class="price">${formatCurrency(p.price)}</div>
          <div class="strike">${formatCurrency(p.mrp)}</div>
        </div>
        <button class="btn add" data-id="${p.id}">Add to cart</button>
      </div>`;
    grid.appendChild(card);
  }
}

/** Add a product to cart */
function addToCart(id, qty=1) {
  const product = PRODUCTS.find(p=>p.id===id);
  if (!product) return;
  const entry = state.cart.get(id) || { product, qty: 0 };
  entry.qty += qty;
  state.cart.set(id, entry);
  saveCart();
  renderCart();
}

/** Remove a product from cart */
function removeFromCart(id) {
  state.cart.delete(id);
  saveCart();
  renderCart();
}

/** Update quantity for a cart line */
function updateQty(id, qty) {
  if (!state.cart.has(id)) return;
  if (qty <= 0) { removeFromCart(id); return; }
  state.cart.get(id).qty = qty;
  saveCart();
  renderCart();
}

function calcSubtotal() {
  let sum = 0;
  for (const {product, qty} of state.cart.values()) sum += product.price * qty;
  return sum;
}

/** Render the cart drawer UI */
function renderCart() {
  const list = $('#cartList');
  list.innerHTML = '';
  let count = 0;
  for (const {product, qty} of state.cart.values()) {
    count += qty;
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img src="${product.thumb}" alt="${product.title}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;" />
      <div>
        <div style="font-weight:700;">${product.title}</div>
        <div class="meta">${product.brand} • ${product.category}</div>
        <div class="price">${formatCurrency(product.price)}</div>
      </div>
      <div style="display:grid; gap:6px; justify-items:end;">
        <div class="qty" aria-label="Quantity">
          <button data-id="${product.id}" data-action="dec" aria-label="Decrease">–</button>
          <span>${qty}</span>
          <button data-id="${product.id}" data-action="inc" aria-label="Increase">+</button>
        </div>
        <button class="remove" data-id="${product.id}">Remove</button>
      </div>`;
    list.appendChild(row);
  }
  $('#cartCount').textContent = String(count);
  $('#subtotal').textContent = formatCurrency(calcSubtotal());
  if (!count) {
    list.innerHTML = '<div class="meta">Your cart is empty.</div>';
  }
}

// Drawer controls
const openDrawer = () => { $('#drawerBackdrop').classList.add('show'); $('#cartDrawer').classList.add('open'); };
const closeDrawer = () => { $('#drawerBackdrop').classList.remove('show'); $('#cartDrawer').classList.remove('open'); };

// Checkout modal
/** Open the checkout modal */
function openCheckout() {
  if (!state.cart.size) return alert('Your cart is empty.');
  const tpl = $('#checkoutTemplate');
  const node = tpl.content.cloneNode(true);
  document.body.appendChild(node);
  const modal = $('#checkoutModal');
  $('#cancelCheckout').addEventListener('click', ()=> modal.remove());
  $('#checkoutForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const orderId = 'BM' + Math.random().toString(36).slice(2,8).toUpperCase();
    try { localStorage.setItem('bm_last_order_id', orderId); } catch (_) {}
    state.cart.clear(); saveCart(); renderCart(); closeDrawer(); modal.remove();
    const tpl2 = $('#orderTemplate');
    const node2 = tpl2.content.cloneNode(true);
    document.body.appendChild(node2);
    $('#orderId').textContent = '#' + orderId;
    $('#closeOrder').addEventListener('click', ()=> $('#orderModal').remove());
  });
  // close on backdrop click
  modal.addEventListener('click', (ev)=>{ if (ev.target === modal) modal.remove(); });
}

// Event bindings
function bindEvents() {
  $('#searchInput').addEventListener('input', (e)=>{ state.search = e.target.value.trim(); renderProducts(); });
  $('#sortSelect').addEventListener('change', (e)=>{ state.sort = e.target.value; renderProducts(); });
  const filtersEl = document.querySelector('.filters');
  const toggleBtn = $('#toggleFilters');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', ()=>{
      const open = filtersEl.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', String(open));
      if (open) { filtersEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  }
  $('#applyFilters').addEventListener('click', ()=>{
    const brands = $$('.brand-filter').filter(i=>i.checked).map(i=>i.value);
    const cats = $$('.cat-filter').filter(i=>i.checked).map(i=>i.value);
    state.brands = new Set(brands);
    state.categories = new Set(cats);
    const min = parseFloat($('#minPrice').value);
    const max = parseFloat($('#maxPrice').value);
    state.minPrice = isNaN(min) ? null : min;
    state.maxPrice = isNaN(max) ? null : max;
    renderProducts();
  });
  $('#clearFilters').addEventListener('click', ()=>{
    $$('.brand-filter').forEach(i=>i.checked=false);
    $$('.cat-filter').forEach(i=>i.checked=false);
    $('#minPrice').value=''; $('#maxPrice').value='';
    state.brands.clear(); state.categories.clear(); state.minPrice=null; state.maxPrice=null;
    renderProducts();
  });
  $('#grid').addEventListener('click', (e)=>{
    const btn = e.target.closest('.add');
    if (!btn) return;
    addToCart(btn.dataset.id, 1);
    openDrawer();
  });
  $('#cartBtn').addEventListener('click', openDrawer);
  $('#closeCart').addEventListener('click', closeDrawer);
  $('#drawerBackdrop').addEventListener('click', closeDrawer);
  $('#cartList').addEventListener('click', (e)=>{
    const removeBtn = e.target.closest('.remove');
    if (removeBtn) { removeFromCart(removeBtn.dataset.id); return; }
    const inc = e.target.closest('[data-action="inc"]');
    const dec = e.target.closest('[data-action="dec"]');
    if (inc) { const id = inc.dataset.id; const cur = state.cart.get(id)?.qty || 0; updateQty(id, cur+1); }
    if (dec) { const id = dec.dataset.id; const cur = state.cart.get(id)?.qty || 0; updateQty(id, cur-1); }
  });
  $('#checkoutBtn').addEventListener('click', openCheckout);
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') { closeDrawer(); const m=$('#checkoutModal'); if (m) m.remove(); const o=$('#orderModal'); if (o) o.remove(); } });
}

/**
 * Allow category pages to preselect a category easily
 */
window.applyCategoryFilter = function applyCategoryFilter(category) {
  if (!category) return;
  state.categories = new Set([category]);
  // Tick the checkbox in the UI if present
  const input = Array.from(document.querySelectorAll('.cat-filter')).find(i => i.value === category);
  if (input) input.checked = true;
  renderProducts();
};

// Init
(function init(){
  $('#year').textContent = new Date().getFullYear();
  loadCart();
  renderProducts();
  renderCart();
  bindEvents();
})();


