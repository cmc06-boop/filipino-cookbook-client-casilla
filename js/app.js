"use strict";

const app = document.getElementById("app");
const navigationButtons = document.querySelectorAll(
    "header button[data-page], .page-actions button[data-page]"
);

function updateBodyModalState() {
    const anyOpen = document.querySelector(
        ".details-modal:not([hidden])"
    );

    document.body.classList.toggle("modal-open", !!anyOpen);
}

function closeAllOverlayModals() {
    document
        .querySelectorAll(".details-modal:not([hidden])")
        .forEach((modal) => {
            modal.hidden = true;
        });

    updateBodyModalState();
}

function createOverlayModal(modalId, dialogId, dialogClass = "") {
    let modal = document.getElementById(modalId);

    if (!modal) {
        modal = document.createElement("div");
        modal.id = modalId;
        modal.className = "details-modal";
        modal.hidden = true;
        modal.innerHTML = `
            <div
                class="details-modal-dialog ${dialogClass}"
                id="${dialogId}"
            ></div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                if (modalId === "foodDetailsModal") {
                    closeFoodDetailsModal();
                    return;
                }

                modal.hidden = true;
                updateBodyModalState();
            }
        });
    }

    return modal;
}

function openOverlayModal(modal) {
    modal.hidden = false;
    document.body.appendChild(modal);
    document.body.classList.add("modal-open");
}

function bindFoodCardClicks() {
    document
        .querySelectorAll("[data-food-id]")
        .forEach((button) => {
            button.addEventListener("click", () => {
                showFoodDetails(button.dataset.foodId);
            });
        });
}

function getFoodDetailsModal() {
    const modal = createOverlayModal(
        "foodDetailsModal",
        "foodDetailsModalDialog"
    );

    return modal;
}

function setFoodDetailsDialogMode(mode = "details") {
    const dialog = document.getElementById("foodDetailsModalDialog");

    if (!dialog) {
        return;
    }

    dialog.classList.toggle(
        "search-modal-dialog",
        mode === "search"
    );
}

const foodDetailsCloseBehavior = {
    closeSearchResultsToo: false
};

function closeFoodDetailsModal() {
    const modal = document.getElementById("foodDetailsModal");

    if (modal) {
        modal.hidden = true;
    }

    if (foodDetailsCloseBehavior.closeSearchResultsToo) {
        foodDetailsCloseBehavior.closeSearchResultsToo = false;
        closeSearchResultsModal();
        return;
    }

    updateBodyModalState();
}

function showFoodDetailsLoading() {
    const modal = getFoodDetailsModal();
    const dialog = document.getElementById("foodDetailsModalDialog");

    dialog.innerHTML = `
        <section class="details-card details-card-loading">
            <div class="loading-box">
                <div class="spinner" aria-hidden="true"></div>
                <p>Loading food details...</p>
            </div>
        </section>
    `;

    openOverlayModal(modal);
}

function renderFoodDetailsHtml(food) {
    const ingredients = Array.isArray(food.ingredients)
        ? food.ingredients
        : [];

    const ingredientItems = ingredients.length > 0
        ? ingredients
            .map((ingredient) => {
                const name =
                    typeof ingredient === "object"
                        ? ingredient.ingredient_name
                        : ingredient;

                return `
                    <li>${escapeHtml(name)}</li>
                `;
            })
            .join("")
        : "<li>No ingredients were provided.</li>";

    const foodName = food.food_name || "Unnamed Food";
    const imagePath = getImagePath("Foods", foodName);

    return `
        <section class="details-card">
            <button
                type="button"
                class="details-close"
                id="closeFoodDetails"
                aria-label="Close"
            >
                &times;
            </button>

            <div class="details-hero">
                <img
                    src="${escapeHtml(imagePath)}"
                    alt="${escapeHtml(foodName)}"
                    onerror="this.closest('.details-hero').classList.add('no-image')"
                >
            </div>

            <div class="details-body">
                <span class="modal-eyebrow">Recipe Details</span>
                <h2>${escapeHtml(foodName)}</h2>

                <div class="details-grid">
                    <article>
                        <h3>Category</h3>
                        <p>
                            ${escapeHtml(
                                food.category_name ||
                                "Not specified"
                            )}
                        </p>
                    </article>

                    <article>
                        <h3>Origin</h3>
                        <p>
                            ${escapeHtml(
                                food.origin_name ||
                                "Not specified"
                            )}
                        </p>
                    </article>
                </div>

                <div class="details-section">
                    <h3>Ingredients</h3>

                    <ul class="ingredient-list">
                        ${ingredientItems}
                    </ul>
                </div>

                <div class="details-section details-section-instructions">
                    <h3>Cooking Instructions</h3><p class="details-instructions-text">${escapeHtml(
                        formatInstructions(food.instructions) ||
                        "No cooking instructions were provided."
                    )}</p>
                </div>
            </div>
        </section>
    `;
}

async function apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;

    const requestOptions = {
        method: options.method || "GET",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${API_CONFIG.token}`
        }
    };

    if (options.body) {
        requestOptions.headers["Content-Type"] =
            "application/json";

        requestOptions.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(url, requestOptions);

        let data = null;

        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            throw new Error(
                data?.message ||
                `Request failed with status ${response.status}.`
            );
        }

        return data;
    } catch (error) {
        throw new Error(
            error.message || "Unable to connect to the API."
        );
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function renderSearchStyleModalHtml(options = {}) {
    const {
        eyebrow = "",
        title = "",
        message = "",
        closeButtonId = "closeModal"
    } = options;

    const eyebrowHtml = eyebrow
        ? `<span class="modal-eyebrow">${escapeHtml(eyebrow)}</span>`
        : "";

    return `
        <section class="search-results-card search-results-card--message">
            <button
                type="button"
                class="details-close"
                id="${escapeHtml(closeButtonId)}"
                aria-label="Close"
            >
                &times;
            </button>

            <div class="search-results-header">
                ${eyebrowHtml}
                <h2>${escapeHtml(title)}</h2>
            </div>

            <section class="search-modal-grid search-modal-grid--single">
                <div class="search-empty-message">
                    <p>${escapeHtml(message)}</p>
                </div>
            </section>
        </section>
    `;
}

function renderFoodDetailsErrorHtml(message, closeButtonId) {
    return renderSearchStyleModalHtml({
        eyebrow: "404 Not Found",
        title: "Unable to load details",
        message,
        closeButtonId
    });
}

function formatInstructions(value) {
    return String(value ?? "")
        .replace(/^\s+|\s+$/g, "")
        .replace(/\r\n/g, "\n");
}

function getImagePath(folder, name) {
    if (!name) {
        return "";
    }

    const fileName = `${String(name).trim().toLowerCase()}.jpg`;

    return `images/${folder}/${fileName}`;
}

function renderFoodCard(food) {
    const foodName = food.food_name || "Unnamed Food";
    const imagePath = getImagePath("Foods", foodName);

    return `
        <article class="food-card">
            <div class="food-card-image">
                <img
                    src="${escapeHtml(imagePath)}"
                    alt="${escapeHtml(foodName)}"
                    loading="lazy"
                    onerror="this.closest('.food-card-image').classList.add('no-image')"
                >
            </div>

            <div class="food-card-body">
                <h3>${escapeHtml(foodName)}</h3>

                <button
                    type="button"
                    class="view-button"
                    data-food-id="${escapeHtml(food.food_id)}"
                >
                    View Details
                </button>
            </div>
        </article>
    `;
}

function renderCategoryCard(category) {
    const categoryName =
        category.category_name || "Unnamed Category";
    const imagePath = getImagePath("Categories", categoryName);

    return `
        <article class="category-card">
            <div class="category-card-image">
                <img
                    src="${escapeHtml(imagePath)}"
                    alt="${escapeHtml(categoryName)}"
                    loading="lazy"
                    onerror="this.closest('.category-card-image').classList.add('no-image')"
                >
            </div>

            <div class="category-card-body">
                <h3>${escapeHtml(categoryName)}</h3>

                <button
                    type="button"
                    class="view-button"
                    data-category-id="${escapeHtml(category.category_id)}"
                    data-category-name="${escapeHtml(categoryName)}"
                >
                    View Foods
                </button>
            </div>
        </article>
    `;
}

const foodsPageState = {
    categories: [],
    foods: [],
    activeCategoryId: "all",
    isLoading: false,
    loadError: ""
};

function normalizeCategories(result) {
    return Array.isArray(result)
        ? result
        : result?.data || result?.categories || [];
}

function normalizeFoods(result) {
    return Array.isArray(result)
        ? result
        : result?.data || result?.foods || [];
}

function normalizeFood(result) {
    if (!result || typeof result !== "object") {
        return null;
    }

    if (Array.isArray(result)) {
        return result[0] || null;
    }

    if (result.food_id || result.food_name) {
        return result;
    }

    return result.data || result.food || null;
}

function getFoodsApiEndpoint(categoryId) {
    if (!categoryId || categoryId === "all") {
        return "/api/foods";
    }

    return `/api/categories/${encodeURIComponent(categoryId)}/foods`;
}

function getCategoryFilterIcon(categoryKey) {
    const key = String(categoryKey || "").toLowerCase();

    if (key === "all") {
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                <rect x="4" y="4" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.8" />
                <rect x="13" y="4" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.8" />
                <rect x="4" y="13" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.8" />
                <rect x="13" y="13" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.8" />
            </svg>
        `;
    }

    if (/appet|starter|merienda|snack/.test(key)) {
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                <ellipse cx="12" cy="15" rx="7" ry="3" stroke="currentColor" stroke-width="1.8" />
                <path
                    d="M12 12V8"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                />
                <circle cx="12" cy="6.5" r="1.5" fill="currentColor" />
            </svg>
        `;
    }

    if (/dessert|sweet|panghimagas|kakanin/.test(key)) {
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                <path
                    d="M8 11h8v7H8z"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linejoin="round"
                />
                <path
                    d="M10 11V9a2 2 0 1 1 4 0v2"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                />
                <path
                    d="M12 7V5"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                />
            </svg>
        `;
    }

    if (/grill|inihaw|bbq|barbecue|ihaw/.test(key)) {
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                <path
                    d="M12 20c-3.5-2.8-5.5-6-5.5-9.5C6.5 7.5 9 5 12 5s5.5 2.5 5.5 5.5C17.5 14 15.5 17.2 12 20Z"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linejoin="round"
                />
                <path
                    d="M12 20c-2-1.6-3-3.8-3-6.2"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                />
            </svg>
        `;
    }

    if (/main|entree|ulam/.test(key)) {
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                <path
                    d="M5 15h14"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                />
                <path
                    d="M7 15v-2.5a5 5 0 0 1 10 0V15"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linejoin="round"
                />
                <path
                    d="M12 8.5V6"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                />
            </svg>
        `;
    }

    if (/noodle|pasta|pancit|bihon|sotanghon/.test(key)) {
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                <path
                    d="M6 13h12l-1.2 6.5H7.2L6 13Z"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linejoin="round"
                />
                <path
                    d="M8 12.5c1.2-1.8 2.6-2.5 4-2.5s2.8.7 4 2.5"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                />
                <path
                    d="M8 16.5c1.2.8 2.4 1.2 4 1.2s2.8-.4 4-1.2"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                />
                <path
                    d="M10 16.5c.6-.6 1.2-.9 2-.9"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                />
            </svg>
        `;
    }

    if (/soup|sabaw/.test(key)) {
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                <path
                    d="M6 12h12l-1 7.5H7L6 12Z"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linejoin="round"
                />
                <path
                    d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                />
                <path
                    d="M9 9.5c.8-.8 1.8-1.2 3-1.2"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                />
            </svg>
        `;
    }

    if (/veget|vegan|gulay|plant/.test(key)) {
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                <path
                    d="M12 20c4.5-3.5 6.5-6.5 6.5-10.5C18.5 6.5 15.5 4 12 4S5.5 6.5 5.5 9.5C5.5 13.5 7.5 16.5 12 20Z"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linejoin="round"
                />
                <path
                    d="M12 20V10"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                />
            </svg>
        `;
    }

    if (/salad|side|garnish/.test(key)) {
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                <path
                    d="M5 14c2-5 5-7 7-7s5 2 7 7"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                />
                <path
                    d="M6 14h12v4H6z"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linejoin="round"
                />
            </svg>
        `;
    }

    if (/international|global|world|foreign/.test(key)) {
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.8" />
                <path
                    d="M4 12h16M12 4a13 13 0 0 1 0 16M12 4a13 13 0 0 0 0 16"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                />
            </svg>
        `;
    }

    if (/healthy|health|nutrit/.test(key)) {
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                <path
                    d="M12 20s-6-4.2-6-9a4 4 0 0 1 7-2.4A4 4 0 0 1 18 11c0 4.8-6 9-6 9Z"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linejoin="round"
                />
            </svg>
        `;
    }

    if (/quick|easy|fast|supper|mabilis/.test(key)) {
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.8" />
                <path
                    d="M12 7v5l3 2"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </svg>
        `;
    }

    return `
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="1.8" />
            <path
                d="M8.5 12h7"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
            />
        </svg>
    `;
}

function renderCategoryFilterChip(categoryId, label, isActive) {
    const iconKey = categoryId === "all" ? "all" : label;

    return `
        <button
            type="button"
            class="category-filter-chip${isActive ? " active" : ""}"
            data-category-filter="${escapeHtml(String(categoryId))}"
            aria-pressed="${isActive ? "true" : "false"}"
        >
            <span class="category-filter-chip-icon">
                ${getCategoryFilterIcon(iconKey)}
            </span>
            <span class="category-filter-chip-label">
                ${escapeHtml(label)}
            </span>
        </button>
    `;
}

function renderFoodsFilterHeader(categories, activeCategoryId) {
    const categoryChips = [
        renderCategoryFilterChip(
            "all",
            "All Types",
            activeCategoryId === "all"
        ),
        ...categories.map((category) => {
            const categoryId = String(category.category_id);
            const categoryName =
                category.category_name || "Unnamed Category";

            return renderCategoryFilterChip(
                categoryId,
                categoryName,
                activeCategoryId === categoryId
            );
        })
    ].join("");

    return `
        <div class="foods-filter-header">
            <h2 class="foods-filter-title">
                What to <span class="foods-filter-accent">Cook</span>?
            </h2>

            <div
                class="category-filter-chips"
                role="group"
                aria-label="Filter foods by category"
            >
                ${categoryChips}
            </div>
        </div>
    `;
}

function renderFoodsGridLoading() {
    return `
        <section class="loading-box foods-filter-empty">
            <div class="spinner" aria-hidden="true"></div>
            <p>Loading foods...</p>
        </section>
    `;
}

function renderFoodsGridError(message) {
    return `
        <section class="error-message foods-filter-empty">
            <h2>Unable to load foods</h2>
            <p>${escapeHtml(message)}</p>
        </section>
    `;
}

function renderFoodsGridSection(foods) {
    if (!Array.isArray(foods) || foods.length === 0) {
        return `
            <section class="empty-message foods-filter-empty">
                <h2>No foods found</h2>
                <p>No food records match this category.</p>
            </section>
        `;
    }

    const foodCards = foods
        .map((food) => renderFoodCard(food))
        .join("");

    return `
        <section class="food-grid">
            ${foodCards}
        </section>
    `;
}

function renderFoodsPageContent() {
    const {
        categories,
        activeCategoryId,
        foods,
        isLoading,
        loadError
    } = foodsPageState;

    let gridContent;

    if (isLoading) {
        gridContent = renderFoodsGridLoading();
    } else if (loadError) {
        gridContent = renderFoodsGridError(loadError);
    } else {
        gridContent = renderFoodsGridSection(foods);
    }

    app.innerHTML = `
        ${renderFoodsFilterHeader(categories, activeCategoryId)}
        ${gridContent}
    `;

    bindCategoryFilterClicks();

    if (!isLoading && !loadError) {
        bindFoodCardClicks();
    }
}

async function loadFoodsByCategory(categoryId) {
    foodsPageState.activeCategoryId = categoryId;
    foodsPageState.isLoading = true;
    foodsPageState.loadError = "";
    renderFoodsPageContent();

    try {
        const result = await apiRequest(getFoodsApiEndpoint(categoryId));
        foodsPageState.foods = normalizeFoods(result);
    } catch (error) {
        foodsPageState.foods = [];
        foodsPageState.loadError = error.message;
    } finally {
        foodsPageState.isLoading = false;
        renderFoodsPageContent();
    }
}

function bindCategoryFilterClicks() {
    document
        .querySelectorAll("[data-category-filter]")
        .forEach((button) => {
            button.addEventListener("click", () => {
                const categoryId = button.dataset.categoryFilter;

                if (
                    categoryId === foodsPageState.activeCategoryId &&
                    !foodsPageState.isLoading
                ) {
                    return;
                }

                loadFoodsByCategory(categoryId);
            });
        });
}

function showLoading(message = "Loading data...") {
    app.innerHTML = `
        <section class="loading-box">
            <div class="spinner" aria-hidden="true"></div>
            <p>${escapeHtml(message)}</p>
        </section>
    `;
}

function showError(message) {
    app.innerHTML = `
        <section class="error-message">
            <h2>Unable to load data</h2>
            <p>${escapeHtml(message)}</p>
        </section>
    `;
}

function setActiveNav(page) {
    navigationButtons.forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.page === page
        );
    });

    document.body.classList.toggle("landing-page", page === "home");
    document.body.classList.toggle("foods-page", page === "foods");
}

function renderHomePage() {
    return `
        <section class="hero hero-get-started">
            <header class="landing-topbar">
                <div class="landing-brand">
                    <h1 class="landing-brand-title">Filipino Cookbook</h1>
                </div>
            </header>

            <div class="hero-get-started-inner">
                <div class="hero-content">
                    <span class="hero-label">Welcome</span>

                    <h2 class="hero-headline">
                        FRESH. AUTHENTIC. DELICIOUS<span class="hero-dot">.</span>
                    </h2>

                    <hr class="hero-divider" aria-hidden="true">

                    <p class="hero-lead" id="apiWelcomeMessage">
                        Loading API welcome...
                    </p>

                    <p class="hero-description">
                        This Application retrieves Filipino food information from
                        the API developed by: Lizhary Ylexis C. Gomez.
                    </p>

                    <p class="hero-api-note" id="apiWelcomeNote" aria-live="polite"></p>

                    <button
                        type="button"
                        class="primary-button hero-cta"
                        id="browseFoodsButton"
                    >
                        Browse Foods
                    </button>
                </div>

                <div class="hero-visual">
                    <div class="hero-visual-pattern"></div>
                    <img
                        class="hero-food-image"
                        src="images/Background/Get%20Started.png"
                        alt="Filipino food platter with pancit, barbecue, and lechon kawali"
                    >
                </div>
            </div>

            <footer class="landing-footer">
                <div class="landing-footer-credits">
                    <p>API by <strong>Lizhary Ylexis Gomez</strong></p>
                    <span class="landing-footer-divider" aria-hidden="true">·</span>
                    <p>Client by <strong>Cherry Lyn M. Casilla</strong></p>
                </div>
            </footer>
        </section>
    `;
}

function formatApiWelcomeNote(note) {
    const trimmed = String(note ?? "").trim();

    if (!trimmed) {
        return "";
    }

    return trimmed.startsWith("Note:")
        ? trimmed
        : `Note: ${trimmed}`;
}

async function loadApiWelcome() {
    const messageEl = document.getElementById("apiWelcomeMessage");
    const noteEl = document.getElementById("apiWelcomeNote");

    if (!messageEl || !noteEl) {
        return;
    }

    messageEl.textContent = "Loading API welcome...";
    messageEl.classList.add("hero-lead-loading");
    noteEl.innerHTML = "";

    try {
        const welcome = await apiRequest("/api");

        messageEl.textContent =
            welcome.message ||
            "Welcome to the Filipino Cookbook API.";
        messageEl.classList.remove("hero-lead-loading");

        const note = formatApiWelcomeNote(welcome.note);

        noteEl.innerHTML = note
            ? `<em>${escapeHtml(note)}</em>`
            : "";
    } catch (error) {
        messageEl.textContent = "Unable to load API welcome message.";
        messageEl.classList.remove("hero-lead-loading");
        noteEl.innerHTML = `
            <em>${escapeHtml(error.message || "Unable to connect to the API.")}</em>
        `;
    }
}

function bindBrowseFoodsButton() {
    const browseButton = document.getElementById("browseFoodsButton");

    if (!browseButton || browseButton.dataset.bound === "true") {
        return;
    }

    browseButton.dataset.bound = "true";
    browseButton.addEventListener("click", showFoods);
}

function playLandingEntrance() {
    const hero = app.querySelector(".hero-get-started");

    if (!hero) {
        return;
    }

    hero.classList.remove("landing-animate");
    void hero.offsetWidth;
    hero.classList.add("landing-animate");
}

function showHome() {
    closeAllOverlayModals();
    setActiveNav("home");

    if (!app.querySelector(".hero-get-started")) {
        app.innerHTML = renderHomePage();
    }

    bindBrowseFoodsButton();
    loadApiWelcome();
    requestAnimationFrame(() => playLandingEntrance());
}

async function showFoods() {
    closeAllOverlayModals();
    setActiveNav("foods");
    showLoading("Loading foods...");

    try {
        const categoriesResult = await apiRequest("/api/categories");

        foodsPageState.categories = normalizeCategories(categoriesResult);
        foodsPageState.activeCategoryId = "all";
        foodsPageState.foods = [];
        foodsPageState.isLoading = false;
        foodsPageState.loadError = "";

        await loadFoodsByCategory("all");
    } catch (error) {
        showError(error.message);
    }
}

async function showFoodDetails(foodId, options = {}) {
    foodDetailsCloseBehavior.closeSearchResultsToo =
        !!options.closeSearchResultsToo;

    showFoodDetailsLoading();

    try {
        const result = await apiRequest(
            `/api/foods/${encodeURIComponent(foodId)}`
        );
        const food = normalizeFood(result);

        if (!food) {
            throw new Error("Food details were not returned by the API.");
        }

        const dialog = document.getElementById("foodDetailsModalDialog");
        setFoodDetailsDialogMode("details");
        dialog.innerHTML = renderFoodDetailsHtml(food);

        document
            .getElementById("closeFoodDetails")
            .addEventListener("click", closeFoodDetailsModal);
    } catch (error) {
        const dialog = document.getElementById("foodDetailsModalDialog");

        setFoodDetailsDialogMode("details");
        dialog.innerHTML = renderFoodDetailsErrorHtml(
            error.message,
            "closeFoodDetails"
        );

        document
            .getElementById("closeFoodDetails")
            .addEventListener("click", closeFoodDetailsModal);
    }
}

function closeSearchResultsModal() {
    const modal = document.getElementById("searchResultsModal");

    if (modal) {
        modal.hidden = true;
    }

    updateBodyModalState();
}

function showSearchResultsLoading() {
    const modal = createOverlayModal(
        "searchResultsModal",
        "searchResultsModalDialog",
        "search-modal-dialog"
    );
    const dialog = document.getElementById("searchResultsModalDialog");

    dialog.innerHTML = `
        <section class="search-results-card details-card-loading">
            <div class="loading-box">
                <div class="spinner" aria-hidden="true"></div>
                <p>Searching foods...</p>
            </div>
        </section>
    `;

    openOverlayModal(modal);
}

async function showSearchResults(searchName) {
    showSearchResultsLoading();

    const dialog = document.getElementById("searchResultsModalDialog");

    try {
        const foods = await apiRequest(
            `/api/foods/search/${encodeURIComponent(searchName)}`
        );

        const foodsList = normalizeFoods(foods);
        const resultCount = foodsList.length;

        if (resultCount === 0) {
            dialog.innerHTML = renderSearchStyleModalHtml({
                eyebrow: "Search",
                title: "Search Results",
                message: "No food matched your search.",
                closeButtonId: "closeSearchResults"
            });

            document
                .getElementById("closeSearchResults")
                .addEventListener("click", closeSearchResultsModal);

            return;
        }

        const resultList = foodsList
            .map((food) => renderFoodCard(food))
            .join("");

        const gridClass = resultCount === 1
            ? "food-grid search-modal-grid search-modal-grid--single"
            : resultCount === 2
                ? "food-grid search-modal-grid search-modal-grid--double"
                : "food-grid search-modal-grid search-modal-grid--many";

        dialog.innerHTML = `
            <section class="search-results-card">
                <button
                    type="button"
                    class="details-close"
                    id="closeSearchResults"
                    aria-label="Close"
                >
                    &times;
                </button>

                <div class="search-results-header">
                    <span class="modal-eyebrow">Search</span>
                    <h2>Search Results</h2>
                </div>

                <section class="${gridClass}">
                    ${resultList}
                </section>
            </section>
        `;

        document
            .getElementById("closeSearchResults")
            .addEventListener("click", closeSearchResultsModal);

        dialog
            .querySelectorAll("[data-food-id]")
            .forEach((button) => {
                button.addEventListener("click", () => {
                    showFoodDetails(button.dataset.foodId, {
                        closeSearchResultsToo: resultCount === 1
                    });
                });
            });
    } catch (error) {
        dialog.innerHTML = renderSearchStyleModalHtml({
            eyebrow: "Search",
            title: "Unable to search",
            message: error.message,
            closeButtonId: "closeSearchResults"
        });

        document
            .getElementById("closeSearchResults")
            .addEventListener("click", closeSearchResultsModal);
    }
}

async function handleSearch(event) {
    event.preventDefault();

    const searchInput = document.getElementById("searchInput");
    const searchName = searchInput.value.trim();

    if (!searchName) {
        return;
    }

    await showSearchResults(searchName);
}

async function showCategories() {
    closeAllOverlayModals();
    setActiveNav("categories");
    showLoading("Loading categories...");

    try {
        const result = await apiRequest("/api/categories");

        const categories = Array.isArray(result)
            ? result
            : result.data || result.categories || [];

        if (categories.length === 0) {
            app.innerHTML = `
                <section class="empty-message">
                    <h2>Food Categories</h2>
                    <p>No categories were found.</p>
                </section>
            `;
            return;
        }

        const categoryCards = categories
            .map((category) => renderCategoryCard(category))
            .join("");

        app.innerHTML = `
            <section class="category-grid">
                ${categoryCards}
            </section>
        `;

        document
            .querySelectorAll("[data-category-id]")
            .forEach((button) => {
                button.addEventListener("click", () => {
                    showCategoryFoods(
                        button.dataset.categoryId,
                        button.dataset.categoryName
                    );
                });
            });
    } catch (error) {
        showError(error.message);
    }
}

function closeCategoryFoodsModal() {
    const modal = document.getElementById("categoryFoodsModal");

    if (modal) {
        modal.hidden = true;
    }

    updateBodyModalState();
}

function showCategoryFoodsLoading() {
    const modal = createOverlayModal(
        "categoryFoodsModal",
        "categoryFoodsModalDialog",
        "search-modal-dialog"
    );
    const dialog = document.getElementById("categoryFoodsModalDialog");

    dialog.innerHTML = `
        <section class="search-results-card details-card-loading">
            <div class="loading-box">
                <div class="spinner" aria-hidden="true"></div>
                <p>Loading category foods...</p>
            </div>
        </section>
    `;

    openOverlayModal(modal);
}

async function showCategoryFoods(categoryId, categoryName) {
    showCategoryFoodsLoading();

    const dialog = document.getElementById("categoryFoodsModalDialog");

    try {
        const result = await apiRequest(
            `/api/categories/${encodeURIComponent(categoryId)}/foods`
        );

        const foods = normalizeFoods(result);
        const foodCount = foods.length;

        const foodCards = foodCount > 0
            ? foods.map((food) => renderFoodCard(food)).join("")
            : `
                <div class="search-empty-message">
                    <p>No foods were found under this category.</p>
                </div>
            `;

        const gridClass = foodCount === 1
            ? "food-grid search-modal-grid search-modal-grid--single"
            : foodCount === 2
                ? "food-grid search-modal-grid search-modal-grid--double"
                : "food-grid search-modal-grid search-modal-grid--many";

        dialog.innerHTML = `
            <section class="search-results-card">
                <button
                    type="button"
                    class="details-close"
                    id="closeCategoryFoods"
                    aria-label="Close"
                >
                    &times;
                </button>

                <div class="search-results-header">
                    <span class="modal-eyebrow">Category</span>
                    <h2>${escapeHtml(categoryName)}</h2>
                </div>

                <section class="${gridClass}">
                    ${foodCards}
                </section>
            </section>
        `;

        document
            .getElementById("closeCategoryFoods")
            .addEventListener("click", closeCategoryFoodsModal);

        dialog
            .querySelectorAll("[data-food-id]")
            .forEach((button) => {
                button.addEventListener("click", () => {
                    showFoodDetails(button.dataset.foodId);
                });
            });
    } catch (error) {
        dialog.innerHTML = `
            <section class="search-results-card details-card-loading">
                <button
                    type="button"
                    class="details-close"
                    id="closeCategoryFoods"
                    aria-label="Close"
                >
                    &times;
                </button>

                <div class="details-body">
                    <h2>Unable to load foods</h2>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            </section>
        `;

        document
            .getElementById("closeCategoryFoods")
            .addEventListener("click", closeCategoryFoodsModal);
    }
}

async function showIngredients() {
    closeAllOverlayModals();
    setActiveNav("ingredients");
    showLoading("Loading ingredients...");

    try {
        const result = await apiRequest("/api/ingredients");

        const ingredients = Array.isArray(result)
            ? result
            : result.data || result.ingredients || [];

        if (ingredients.length === 0) {
            app.innerHTML = `
                <section class="empty-message">
                    <h2>Ingredients</h2>
                    <p>No ingredients were found.</p>
                </section>
            `;

            return;
        }

        const ingredientCards = ingredients
            .map((ingredient) => {
                const ingredientName =
                    typeof ingredient === "object"
                        ? ingredient.ingredient_name
                        : ingredient;

                return `
                    <article class="ingredient-card">
                        <div class="ingredient-card-image">
                            <img
                                src="${escapeHtml(getImagePath("Ingredients", ingredientName))}"
                                alt="${escapeHtml(ingredientName || "Unnamed Ingredient")}"
                                loading="lazy"
                                onerror="this.closest('.ingredient-card-image').classList.add('no-image')"
                            >
                        </div>

                        <h3>
                            ${escapeHtml(
                                ingredientName || "Unnamed Ingredient"
                            )}
                        </h3>
                    </article>
                `;
            })
            .join("");

        app.innerHTML = `
            <section class="ingredient-grid">
                ${ingredientCards}
            </section>
        `;
    } catch (error) {
        showError(error.message);
    }
}

function renderRandomFoodDetailsHtml(food) {
    const ingredients = Array.isArray(food.ingredients)
        ? food.ingredients
        : [];

    const ingredientList = ingredients.length
        ? ingredients.map((item) => {
            const name = typeof item === "object"
                ? item.ingredient_name
                : item;

            return `<li>${escapeHtml(name)}</li>`;
        }).join("")
        : "<li>No ingredients available.</li>";

    const foodName = food.food_name || "Random Food";

    return `
        <span class="random-badge">Random Pick</span>

        <h2>${escapeHtml(foodName)}</h2>

        <div class="details-grid">
            <article>
                <h3>Category</h3>
                <p>${escapeHtml(food.category_name || "Not specified")}</p>
            </article>

            <article>
                <h3>Origin</h3>
                <p>${escapeHtml(food.origin_name || "Not specified")}</p>
            </article>
        </div>

        <div class="details-section">
            <h3>Ingredients</h3>

            <ul class="ingredient-list">
                ${ingredientList}
            </ul>
        </div>

        <div class="details-section details-section-instructions">
            <h3>Cooking Instructions</h3><p class="details-instructions-text">${escapeHtml(
                formatInstructions(food.instructions) ||
                "No instructions available."
            )}</p>
        </div>
    `;
}

function renderRandomFoodHtml(food) {
    const foodName = food.food_name || "Random Food";
    const imagePath = getImagePath("Foods", foodName);

    return `
        <section class="details-card random-card">
            <button
                type="button"
                class="details-close"
                id="closeRandomFood"
                aria-label="Close"
            >
                &times;
            </button>

            <div class="details-hero random-card-hero" id="randomFoodHero">
                <img
                    src="${escapeHtml(imagePath)}"
                    alt="${escapeHtml(foodName)}"
                    onerror="this.closest('.details-hero').classList.add('no-image')"
                >
            </div>

            <div class="random-card-details">
                <div class="random-card-content">
                    <div
                        class="details-body random-card-scroll"
                        id="randomFoodScroll"
                    >
                        ${renderRandomFoodDetailsHtml(food)}
                    </div>

                    <div
                        class="random-card-loading"
                        id="randomFoodLoading"
                        hidden
                    >
                        <div class="spinner" aria-hidden="true"></div>
                        <p>Loading random food...</p>
                    </div>
                </div>

                <div class="random-card-actions">
                    <button
                        type="button"
                        class="primary-button"
                        id="anotherRandom"
                    >
                        Get Another Random Food
                    </button>
                </div>
            </div>
        </section>
    `;
}

function setRandomFoodRefreshing(isLoading) {
    const loading = document.getElementById("randomFoodLoading");
    const button = document.getElementById("anotherRandom");

    if (loading) {
        loading.hidden = !isLoading;
    }

    if (button) {
        button.disabled = isLoading;
        button.setAttribute("aria-busy", isLoading ? "true" : "false");
    }
}

function updateRandomFoodContent(food) {
    const hero = document.getElementById("randomFoodHero");
    const scroll = document.getElementById("randomFoodScroll");

    if (!hero || !scroll) {
        return false;
    }

    const foodName = food.food_name || "Random Food";
    const imagePath = getImagePath("Foods", foodName);

    hero.classList.remove("no-image");
    hero.innerHTML = `
        <img
            src="${escapeHtml(imagePath)}"
            alt="${escapeHtml(foodName)}"
            onerror="this.closest('.details-hero').classList.add('no-image')"
        >
    `;
    scroll.innerHTML = renderRandomFoodDetailsHtml(food);

    return true;
}

function bindRandomFoodModalEvents() {
    document
        .getElementById("closeRandomFood")
        ?.addEventListener("click", closeRandomFoodModal);

    document
        .getElementById("anotherRandom")
        ?.addEventListener("click", () => {
            showRandomFood({ refresh: true });
        });
}

function closeRandomFoodModal() {
    const modal = document.getElementById("randomFoodModal");

    if (modal) {
        modal.hidden = true;
    }

    updateBodyModalState();
}

function showRandomFoodLoading() {
    const modal = createOverlayModal(
        "randomFoodModal",
        "randomFoodModalDialog",
        "random-modal-dialog"
    );
    const dialog = document.getElementById("randomFoodModalDialog");

    dialog.innerHTML = `
        <section class="details-card details-card-loading">
            <div class="loading-box">
                <div class="spinner" aria-hidden="true"></div>
                <p>Loading random food...</p>
            </div>
        </section>
    `;

    openOverlayModal(modal);
}

async function showRandomFood(options = {}) {
    const modal = document.getElementById("randomFoodModal");
    const canRefresh = !!document.getElementById("randomFoodScroll");
    const refresh = options.refresh === true ||
        (canRefresh && modal && !modal.hidden);

    if (refresh) {
        setRandomFoodRefreshing(true);
    } else {
        showRandomFoodLoading();
    }

    const dialog = document.getElementById("randomFoodModalDialog");

    try {
        const result = await apiRequest("/api/foods/random");

        const food = Array.isArray(result)
            ? result[0]
            : result.data || result.food || result;

        if (!food) {
            if (refresh) {
                const scroll = document.getElementById("randomFoodScroll");

                if (scroll) {
                    scroll.innerHTML = `
                        <h2>Random Food</h2>
                        <p>No food was returned by the API.</p>
                    `;
                    return;
                }
            }

            dialog.innerHTML = `
                <section class="details-card details-card-loading">
                    <button
                        type="button"
                        class="details-close"
                        id="closeRandomFood"
                        aria-label="Close"
                    >
                        &times;
                    </button>

                    <div class="details-body">
                        <h2>Random Food</h2>
                        <p>No food was returned by the API.</p>
                    </div>
                </section>
            `;

            bindRandomFoodModalEvents();
            return;
        }

        if (refresh && updateRandomFoodContent(food)) {
            return;
        }

        dialog.innerHTML = renderRandomFoodHtml(food);
        bindRandomFoodModalEvents();
    } catch (error) {
        if (refresh) {
            const scroll = document.getElementById("randomFoodScroll");

            if (scroll) {
                scroll.innerHTML = `
                    <h2>Unable to load random food</h2>
                    <p>${escapeHtml(error.message)}</p>
                `;
                return;
            }
        }

        dialog.innerHTML = `
            <section class="details-card details-card-loading">
                <button
                    type="button"
                    class="details-close"
                    id="closeRandomFood"
                    aria-label="Close"
                >
                    &times;
                </button>

                <div class="details-body">
                    <h2>Unable to load random food</h2>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            </section>
        `;

        bindRandomFoodModalEvents();
    } finally {
        setRandomFoodRefreshing(false);
    }
}

function closeAddFoodModal() {
    const modal = document.getElementById("addFoodModal");

    if (modal) {
        modal.hidden = true;
    }

    updateBodyModalState();
}

function closeAddFoodSuccessModal() {
    const modal = document.getElementById("addFoodSuccessModal");

    if (modal) {
        modal.hidden = true;
    }

    updateBodyModalState();
}

function showAddFoodSuccess(foodName, message) {
    closeAddFoodModal();

    const modal = createOverlayModal(
        "addFoodSuccessModal",
        "addFoodSuccessModalDialog",
        "add-food-success-dialog"
    );
    const dialog = document.getElementById("addFoodSuccessModalDialog");
    const successMessage = message || "Food added successfully.";

    dialog.innerHTML = `
        <section class="success-card add-food-success-card">
            <div class="success-card-body">
                <div class="success-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="1.8"
                        />
                        <path
                            d="M8 12.5l2.5 2.5L16 9.5"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                </div>

                <span class="modal-eyebrow">Success</span>
                <p class="success-message">
                    ${escapeHtml(successMessage)}
                </p>
                <p class="success-food-name">
                    “${escapeHtml(foodName)}”
                </p>

                <div class="success-actions">
                    <button
                        type="button"
                        class="primary-button"
                        id="addAnotherFood"
                    >
                        Add Another Food
                    </button>

                    <button
                        type="button"
                        class="view-button"
                        id="closeAddFoodSuccessBtn"
                    >
                        Close
                    </button>
                </div>
            </div>
        </section>
    `;

    document
        .getElementById("closeAddFoodSuccessBtn")
        .addEventListener("click", closeAddFoodSuccessModal);

    document
        .getElementById("addAnotherFood")
        .addEventListener("click", () => {
            closeAddFoodSuccessModal();
            showAddFood();
        });

    openOverlayModal(modal);
}

function showAddFoodLoading() {
    const modal = createOverlayModal(
        "addFoodModal",
        "addFoodModalDialog",
        "add-food-modal-dialog"
    );
    const dialog = document.getElementById("addFoodModalDialog");

    dialog.innerHTML = `
        <section class="form-card add-food-card details-card-loading">
            <div class="loading-box">
                <div class="spinner" aria-hidden="true"></div>
                <p>Loading form...</p>
            </div>
        </section>
    `;

    openOverlayModal(modal);
}

async function showAddFood() {
    showAddFoodLoading();

    const dialog = document.getElementById("addFoodModalDialog");

    try {
        const [categoryResult, ingredientResult] = await Promise.all([
            apiRequest("/api/categories"),
            apiRequest("/api/ingredients")
        ]);

        const categories = Array.isArray(categoryResult)
            ? categoryResult
            : categoryResult.data || categoryResult.categories || [];

        const ingredients = Array.isArray(ingredientResult)
            ? ingredientResult
            : ingredientResult.data || ingredientResult.ingredients || [];

        const categoryOptions = categories
            .map((category) => `
                <option value="${escapeHtml(category.category_id)}">
                    ${escapeHtml(category.category_name)}
                </option>
            `)
            .join("");

        const ingredientOptions = ingredients
            .map((ingredient) => `
                <label class="checkbox-item">
                    <input
                        type="checkbox"
                        name="ingredient_ids"
                        value="${escapeHtml(ingredient.ingredient_id)}"
                    >
                    <span>
                        ${escapeHtml(ingredient.ingredient_name)}
                    </span>
                </label>
            `)
            .join("");

        dialog.innerHTML = `
            <section class="form-card add-food-card">
                <button
                    type="button"
                    class="details-close"
                    id="closeAddFood"
                    aria-label="Close"
                >
                    &times;
                </button>

                <div class="form-modal-heading">
                    <span class="modal-eyebrow">New Entry</span>
                    <h2>Add New Food</h2>
                    <p>
                        Fill out the form to submit a new food through
                        the API.
                    </p>
                </div>

                <div id="formMessage"></div>

                <form id="addFoodForm">
                    <div class="form-row form-row-primary">
                        <div class="form-group">
                            <label for="foodName">
                                Food Name
                            </label>

                            <input
                                type="text"
                                id="foodName"
                                required
                            >
                        </div>

                        <div class="form-group">
                            <label for="categoryId">
                                Category
                            </label>

                            <select id="categoryId" required>
                                <option value="">
                                    Select a category
                                </option>

                                ${categoryOptions}
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="originId">
                                Origin ID
                            </label>

                            <input
                                type="number"
                                id="originId"
                                min="1"
                                placeholder="Example: 1"
                                required
                            >
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="instructions">
                            Cooking Instructions
                        </label>

                        <textarea
                            id="instructions"
                            rows="6"
                            required
                        ></textarea>
                    </div>

                    <div class="form-group">
                        <label>
                            Ingredients
                        </label>

                        <div class="checkbox-grid">
                            ${ingredientOptions}
                        </div>
                    </div>

                    <button
                        type="submit"
                        class="primary-button"
                        id="submitFoodButton"
                    >
                        Add Food
                    </button>
                </form>
            </section>
        `;

        document
            .getElementById("closeAddFood")
            .addEventListener("click", closeAddFoodModal);

        document
            .getElementById("addFoodForm")
            .addEventListener("submit", handleAddFood);
    } catch (error) {
        dialog.innerHTML = `
            <section class="form-card add-food-card details-card-loading">
                <button
                    type="button"
                    class="details-close"
                    id="closeAddFood"
                    aria-label="Close"
                >
                    &times;
                </button>

                <div class="details-body">
                    <h2>Unable to load form</h2>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            </section>
        `;

        document
            .getElementById("closeAddFood")
            .addEventListener("click", closeAddFoodModal);
    }
}

async function handleAddFood(event) {
    event.preventDefault();

    const foodName = document
        .getElementById("foodName")
        .value
        .trim();

    const categoryId = Number(
        document.getElementById("categoryId").value
    );

    const originId = Number(
        document.getElementById("originId").value
    );

    const instructions = document
        .getElementById("instructions")
        .value
        .trim();

    const ingredientIds = Array.from(
        document.querySelectorAll(
            'input[name="ingredient_ids"]:checked'
        )
    ).map((checkbox) => Number(checkbox.value));

    const formMessage = document.getElementById("formMessage");
    const submitButton =
        document.getElementById("submitFoodButton");

    if (
        !foodName ||
        !categoryId ||
        !originId ||
        !instructions ||
        ingredientIds.length === 0
    ) {
        formMessage.innerHTML = `
            <div class="form-error">
                Please complete all fields and select at least
                one ingredient.
            </div>
        `;

        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Adding Food...";

    try {
        const result = await apiRequest("/api/foods", {
            method: "POST",
            body: {
                food_name: foodName,
                category_id: categoryId,
                origin_id: originId,
                instructions: instructions,
                ingredient_ids: ingredientIds
            }
        });

        showAddFoodSuccess(
            foodName,
            result.message || "Your food has been added successfully."
        );
    } catch (error) {
        formMessage.innerHTML = `
            <div class="form-error">
                ${escapeHtml(error.message)}
            </div>
        `;
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Add Food";
    }
}

function showNotReady(title) {
    app.innerHTML = `
        <section class="empty-message">
            <h2>${escapeHtml(title)}</h2>

            <p>
                This page will be added in the next step.
            </p>
        </section>
    `;
}

navigationButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const page = button.dataset.page;

        if (page === "home") {
            showHome();
            return;
        }

        if (page === "foods") {
            showFoods();
            return;
        }

        if (page === "categories") {
            showCategories();
            return;
        }

        if (page === "ingredients") {
            showIngredients();
            return;
        }

        if (page === "random") {
            showRandomFood();
            return;
        }

        if (page === "add") {
            showAddFood();
        }
    });
});

showHome();

document
    .getElementById("searchForm")
    .addEventListener("submit", handleSearch);

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
        return;
    }

    const openModal = document.querySelector(
        ".details-modal:not([hidden])"
    );

    if (openModal) {
        openModal.hidden = true;
        updateBodyModalState();
    }
});