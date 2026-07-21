import { CONFIG } from "./config.js";
import { loadProducts } from "./store.js";

const grid = document.getElementById("grid");
const filtersEl = document.getElementById("filters");
const marqueeText = document.getElementById("marqueeText");

let products = [];
let activeCategory = "все";
let selectedSize = null;
let activeProduct = null;

marqueeText.textContent = CONFIG.marquee.repeat(4);

function formatPrice(n){
  return n.toLocaleString("ru-RU") + " " + CONFIG.currency;
}

function renderFilters(){
  const cats = ["все", ...new Set(products.map(p => p.category))];
  filtersEl.innerHTML = cats.map(c => `
    <button class="filter-chip ${c === activeCategory ? "active" : ""}" data-cat="${c}">${c}</button>
  `).join("");

  filtersEl.querySelectorAll(".filter-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      renderFilters();
      renderGrid();
    });
  });
}

function renderGrid(){
  const list = activeCategory === "все"
    ? products
    : products.filter(p => p.category === activeCategory);

  if (list.length === 0){
    grid.innerHTML = `<div class="empty-state">В этой категории пока пусто</div>`;
    return;
  }

  grid.innerHTML = list.map(p => `
    <article class="card" data-id="${p.id}">
      <div class="card-media">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        ${p.sold ? `<div class="card-sold"><span>SOLD OUT</span></div>` : ""}
      </div>
      <div class="card-body">
        <div class="card-cat">${p.category}</div>
        <div class="card-name">${p.name}</div>
        <div class="card-price">${formatPrice(p.price)}</div>
      </div>
    </article>
  `).join("");

  grid.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => openSheet(card.dataset.id));
  });
}

// ---- bottom sheet ----
const overlay = document.getElementById("overlay");
const sheet = document.getElementById("sheet");
const sheetImg = document.getElementById("sheetImg");
const sheetCat = document.getElementById("sheetCat");
const sheetName = document.getElementById("sheetName");
const sheetPrice = document.getElementById("sheetPrice");
const sheetDesc = document.getElementById("sheetDesc");
const sizeRow = document.getElementById("sizeRow");
const orderBtn = document.getElementById("orderBtn");

function openSheet(id){
  activeProduct = products.find(p => p.id === id);
  if (!activeProduct) return;
  selectedSize = null;

  sheetImg.src = activeProduct.image;
  sheetImg.alt = activeProduct.name;
  sheetCat.textContent = activeProduct.category;
  sheetName.textContent = activeProduct.name;
  sheetPrice.textContent = formatPrice(activeProduct.price);
  sheetDesc.textContent = activeProduct.description || "";

  const sizes = activeProduct.sizes || [];
  sizeRow.innerHTML = sizes.map(s => `<button class="size-btn" data-size="${s}">${s}</button>`).join("");
  sizeRow.querySelectorAll(".size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedSize = btn.dataset.size;
      sizeRow.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  orderBtn.disabled = !!activeProduct.sold;
  orderBtn.textContent = activeProduct.sold ? "Товар распродан" : "Заказать в Telegram";

  overlay.classList.add("open");
  sheet.classList.add("open");
}

function closeSheet(){
  overlay.classList.remove("open");
  sheet.classList.remove("open");
}

overlay.addEventListener("click", closeSheet);
document.getElementById("sheetClose").addEventListener("click", closeSheet);

orderBtn.addEventListener("click", () => {
  if (!activeProduct || activeProduct.sold) return;
  const sizePart = activeProduct.sizes && activeProduct.sizes.length
    ? (selectedSize ? `Размер: ${selectedSize}` : "Размер: не выбран")
    : "";
  const lines = [
    "Здравствуйте! Хочу заказать:",
    activeProduct.name,
    `Цена: ${formatPrice(activeProduct.price)}`,
    sizePart
  ].filter(Boolean).join("\n");

  const url = `https://t.me/${CONFIG.telegramUsername}?text=${encodeURIComponent(lines)}`;
  window.open(url, "_blank");
});

// ---- init ----
(async function init(){
  try{
    products = await loadProducts();
  } catch(err){
    grid.innerHTML = `<div class="empty-state">Не удалось загрузить каталог: ${err.message}</div>`;
    return;
  }
  renderFilters();
  renderGrid();
})();
