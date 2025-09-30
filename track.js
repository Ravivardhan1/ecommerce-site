function $(sel, root=document) { return root.querySelector(sel); }

const FAKE_ORDERS = {
  BMABCD1: { status: 'Shipped', steps: ['Order Placed', 'Packed', 'Shipped'], eta: '2-3 days' },
  BMXYZ77: { status: 'Out for Delivery', steps: ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery'], eta: 'Today' },
  BMHELLO: { status: 'Delivered', steps: ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'], eta: 'Delivered' }
};

function genericStatus(orderId) {
  // Basic heuristic so any BM* order can be tracked with a plausible status
  const codes = ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const seed = orderId.split('').reduce((s,c)=> s + c.charCodeAt(0), 0);
  const idx = Math.min(codes.length - 1, (seed % (codes.length)));
  const status = codes[idx];
  const steps = codes.slice(0, idx + 1);
  const eta = status === 'Delivered' ? 'Delivered' : (idx >= 2 ? '1-2 days' : '2-4 days');
  return { status, steps, eta };
}

function renderResult(orderId, info) {
  const target = $('#trackResult');
  if (!info) {
    target.innerHTML = '<div class="meta">No order found. Please check the ID.</div>';
    return;
  }
  const stepsHtml = info.steps.map((s,i)=>`<div style="display:flex; align-items:center; gap:8px;">
      <div style="width:12px;height:12px;border-radius:999px; background:${i===info.steps.length-1?'#2ecc71':'#2874F0'}"></div>
      <div>${s}</div>
    </div>`).join('');
  target.innerHTML = `
    <div style="display:grid; gap:10px; background:#12182a; border:1px solid var(--border); border-radius:12px; padding:12px;">
      <div><strong>Order:</strong> ${orderId}</div>
      <div><strong>Status:</strong> ${info.status}</div>
      <div><strong>ETA:</strong> ${info.eta}</div>
      <div style="display:grid; gap:6px;">${stepsHtml}</div>
    </div>`;
}

function init() {
  $('#year').textContent = new Date().getFullYear();
  // Autofill from URL or last order
  const params = new URLSearchParams(location.search);
  const fromUrl = params.get('order');
  const last = localStorage.getItem('bm_last_order_id');
  if (fromUrl) { $('#orderInput').value = fromUrl; }
  else if (last) { $('#orderInput').value = last; }

  $('#trackForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const id = $('#orderInput').value.trim().toUpperCase();
    let info = FAKE_ORDERS[id];
    if (!info && id.startsWith('BM')) info = genericStatus(id);
    renderResult(id, info);
  });
}

document.addEventListener('DOMContentLoaded', init);


