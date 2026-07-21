import { CONFIG } from "./config.js";
import { loadProducts, resetToPublished, saveDraft, makeId, exportJSON, hasDraft } from "./store.js";

const SESSION_KEY = "colorinzo_admin_ok";

const loginBox = document.getElementById("loginBox");
const adminPanel = document.getElementById("adminPanel");
const passInput = document.getElementById("passInput");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

let products = [];
let editingId = null;

function showToast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}

function checkLogin(){
  if (sessionStorage.getItem(SESSION_KEY) === "1"){
    loginBox.style.display = "none";
    adminPanel.style.display = "block";
    boot();
  }
}

loginBtn.addEventListener("click", () => {
  if (passInput.value === CONFIG.adminPassword){
    sessionStorage.setItem(SESSION_KEY, "1");
    loginError.classList.remove("show");
    loginBox.style.display = "none";
    adminPanel.style.display = "block";
    boot();
  } else {
    loginError.classList.add("show");
  }
});
passInput.addEventListener("keydown", e => { if (e.key === "Enter") loginBtn.click(); });

checkLogin();

// ---- panel ----
function formatPrice(n){
  return Number(n).toLocaleString("ru-RU") + " " + CONFIG.currency;
}

function updateDraftBadge(){
  const badge = document.getElementById("draftBadge");
  badge.textContent = hasDraft() ? "ЕСТЬ НЕОПУБЛИКОВАННЫЕ ИЗМЕНЕНИЯ" : "ОПУБЛИКОВАНО";
}

function renderList(){
  const list = document.getElementById("productList");
  if (products.length === 0){
    list.innerHTML = `<div style="color:var(--muted);font-size:13px;">Пока нет товаров — добавь первый.</div>`;
    return;
  }
  list.innerHTML = products.map(p => `
    <div class="admin-row" data-id="${p.id}">
      <img src="${p.image}" alt="">
      <div class="info">
        <div class="n">${p.name}${p.sold ? " · SOLD" : ""}</div>
        <div class="p">${formatPrice(p.price)} · ${p.category}</div>
      </div>
      <div class="row-actions">
        <button class="icon-btn edit-btn" title="Редактировать">✎</button>
        <button class="icon-btn danger del-btn" title="Удалить">🗑</button>
      </div>
    </div>
  `).join("");

  list.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", (e) => openForm(e.target.closest(".admin-row").dataset.id));
  });
  list.querySelectorAll(".del-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.target.closest(".admin-row").dataset.id;
      if (confirm("Удалить этот товар из черновика?")){
        products = products.filter(p => p.id !== id);
        saveDraft(products);
        renderList();
        updateDraftBadge();
        showToast("Удалено");
      }
    });
  });
}

// ---- form ----
const formOverlay = document.getElementById("formOverlay");
const formSheet = document.getElementById("formSheet");
const fName = document.getElementById("fName");
const fPrice = document.getElementById("fPrice");
const fCategory = document.getElementById("fCategory");
const fImage = document.getElementById("fImage");
const fSizes = document.getElementById("fSizes");
const fDesc = document.getElementById("fDesc");
const fSold = document.getElementById("fSold");
const formError = document.getElementById("formError");
const formTitle = document.getElementById("formTitle");

function openForm(id){
  editingId = id || null;
  formError.classList.remove("show");

  if (id){
    const p = products.find(x => x.id === id);
    formTitle.textContent = "Редактировать товар";
    fName.value = p.name;
    fPrice.value = p.price;
    fCategory.value = p.category;
    fImage.value = p.image;
    fSizes.value = (p.sizes || []).join(", ");
    fDesc.value = p.description || "";
    fSold.checked = !!p.sold;
  } else {
    formTitle.textContent = "Новый товар";
    fName.value = "";
    fPrice.value = "";
    fCategory.value = "";
    fImage.value = "";
    fSizes.value = "";
    fDesc.value = "";
    fSold.checked = false;
  }

  formOverlay.classList.add("open");
  formSheet.classList.add("open");
}

function closeForm(){
  formOverlay.classList.remove("open");
  formSheet.classList.remove("open");
}

document.getElementById("addBtn").addEventListener("click", () => openForm(null));
document.getElementById("formClose").addEventListener("click", closeForm);
formOverlay.addEventListener("click", closeForm);

document.getElementById("saveBtn").addEventListener("click", () => {
  const name = fName.value.trim();
  const price = Number(fPrice.value);
  const image = fImage.value.trim();

  if (!name || !price || !image){
    formError.classList.add("show");
    return;
  }

  const data = {
    name,
    price,
    category: fCategory.value.trim() || "без категории",
    image,
    sizes: fSizes.value.split(",").map(s => s.trim()).filter(Boolean),
    description: fDesc.value.trim(),
    sold: fSold.checked
  };

  if (editingId){
    products = products.map(p => p.id === editingId ? { ...p, ...data } : p);
  } else {
    products.push({ id: makeId(), ...data });
  }

  saveDraft(products);
  renderList();
  updateDraftBadge();
  closeForm();
  showToast(editingId ? "Товар обновлён" : "Товар добавлен");
});

// ---- export / reset ----
document.getElementById("exportBtn").addEventListener("click", () => {
  const box = document.getElementById("exportBox");
  const copyBtn = document.getElementById("copyBtn");
  box.textContent = exportJSON(products);
  box.style.display = "block";
  copyBtn.style.display = "block";
});

document.getElementById("copyBtn").addEventListener("click", async () => {
  try{
    await navigator.clipboard.writeText(exportJSON(products));
    showToast("JSON скопирован");
  } catch {
    showToast("Не удалось скопировать — выдели текст вручную");
  }
});

document.getElementById("resetBtn").addEventListener("click", async () => {
  if (!confirm("Черновик будет стёрт, вернём опубликованную версию. Продолжить?")) return;
  products = await resetToPublished();
  renderList();
  updateDraftBadge();
  showToast("Черновик сброшен");
});

// ---- boot ----
async function boot(){
  products = await loadProducts();
  renderList();
  updateDraftBadge();
}
