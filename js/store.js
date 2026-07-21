// Слой данных. Сайт — статический (без базы данных), поэтому товары
// живут в файле data/products.json. Админка правит черновик в localStorage
// этого же браузера/телефона — для мгновенного превью, а затем экспортирует
// готовый JSON, который нужно закоммитить в data/products.json на GitHub,
// чтобы изменения увидели все посетители.

const DRAFT_KEY = "colorinzo_products_draft";

async function fetchBaseProducts() {
  const res = await fetch("data/products.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Не удалось загрузить data/products.json");
  return res.json();
}

function readDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeDraft(products) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(products));
}

// Возвращает актуальный список: черновик из этого браузера, если он есть,
// иначе — базовый файл products.json.
export async function loadProducts() {
  const draft = readDraft();
  if (draft) return draft;
  return fetchBaseProducts();
}

// Всегда стартует от файла products.json, отбрасывая локальный черновик.
export async function resetToPublished() {
  const base = await fetchBaseProducts();
  localStorage.removeItem(DRAFT_KEY);
  return base;
}

export function saveDraft(products) {
  writeDraft(products);
}

export function hasDraft() {
  return readDraft() !== null;
}

export function makeId() {
  return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function exportJSON(products) {
  return JSON.stringify(products, null, 2);
}
