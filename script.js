const API_URL = "https://fakestoreapi.com/products";
const grid = document.getElementById("grid");

const renderedIds = new Set();

const toast = document.getElementById("toast");
let toastTimer = null;

async function fetchProducts(limit = 3) {
  const res = await fetch(`${API_URL}?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function createCard(product) {
  const card = document.createElement("article");
  card.className = "card";

  card.dataset.id = String(product.id);
  renderedIds.add(product.id);

  card.dataset.title = product.title.toLowerCase();

  card.innerHTML = `
    <div class="card__media">
      <img class="card__img" src="${product.image}" alt="${product.title}" loading="lazy">
    </div>

    <div class="card__body">
      <h2 class="card__title">${product.title}</h2>
      <p class="card__desc">${product.description}</p>

      <div class="card__footer">
        <span class="card__price">${formatPrice(product.price)}</span>
        <button class="card__btn" type="button">Add to Cart</button>
      </div>
    </div>
  `;

  return card;
}

async function init() {
  try {
    const products = await fetchProducts(3);
    products.forEach((p) => grid.appendChild(createCard(p)));
  } catch (err) {
    grid.innerHTML = `<p style="color:#ffb4b4">Error loading products.</p>`;
    console.error(err);
  }
}

init();

// Delegação de eventos (funciona até para cards criados depois)
grid.addEventListener("click", function (event) {
  const btn = event.target.closest(".card__btn");
  if (!btn) return;

  const card = btn.closest(".card");

  const isAdded = card.classList.toggle("is-added");

  btn.textContent = isAdded ? "Added" : "Add to Cart";

  if (isAdded) {
    showToast("Product added", "Product added successfully.", 2000, "success");
  } else {
    showToast(
      "Product removed",
      "The product was removed from cart.",
      2000,
      "danger",
    );
  }
});

const searchInput = document.getElementById("search");

searchInput.addEventListener("input", function () {
  const term = searchInput.value.trim().toLowerCase();
  const cards = grid.querySelectorAll(".card");

  cards.forEach((card) => {
    const title = card.dataset.title || "";
    const matches = title.includes(term);

    card.classList.toggle("is-hidden", !matches);
  });
});

const addSampleBtn = document.getElementById("addSample");

addSampleBtn.addEventListener("click", async function () {
  const originalText = addSampleBtn.textContent;

  try {
    addSampleBtn.disabled = true;
    addSampleBtn.textContent = "Adding...";

    const resAll = await fetch(API_URL);
    if (!resAll.ok) throw new Error("Failed to fetch products list");
    const allProducts = await resAll.json();

    const available = allProducts.filter((p) => !renderedIds.has(p.id));

    if (available.length === 0) {
      showToast(
        "Nothing to add",
        "All products are already added.",
        2000,
        "danger",
      );
      return;
    }

    const random = available[Math.floor(Math.random() * available.length)];

    const resOne = await fetch(`${API_URL}/${random.id}`);
    if (!resOne.ok) throw new Error("Failed to fetch product");
    const product = await resOne.json();

    grid.appendChild(createCard(product));
  } catch (err) {
    console.error(err);
    alert("Could not add a sample product. Please try again.");
  } finally {
    addSampleBtn.disabled = false;
    addSampleBtn.textContent = originalText;
  }
});

function showToast(title, message, durationMs = 2000, type = "success") {
  if (!toast) return;

  const titleEl = toast.querySelector(".toast__title");
  const msgEl = toast.querySelector(".toast__msg");
  const barEl = toast.querySelector(".toast__bar");

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;

  toast.classList.remove("is-success", "is-danger");
  toast.classList.add(type === "danger" ? "is-danger" : "is-success");

  clearTimeout(toastTimer);
  toast.classList.remove("is-hiding");
  toast.classList.add("is-showing");
  toast.hidden = false;

  if (barEl) {
    barEl.style.transition = "none";
    barEl.style.transform = "scaleX(1)";
    void barEl.offsetWidth;
    barEl.style.transition = `transform ${durationMs}ms linear`;
    barEl.style.transform = "scaleX(0)";
  }

  toastTimer = setTimeout(() => {
    toast.classList.remove("is-showing");
    toast.classList.add("is-hiding");

    setTimeout(() => {
      toast.hidden = true;
      toast.classList.remove("is-hiding");
    }, 180);
  }, durationMs);
}
