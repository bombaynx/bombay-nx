/* =========================================================
   BOMBAY NX - CUSTOMER SCRIPT
   LIVE STOCK + SIZE STOCK + CART VALIDATION
   ========================================================= */

const SUPABASE_URL = "https://tetihwttelthoyeidwhl.supabase.co";
const SUPABASE_KEY = "sb_publishable_RoeCtLr9AhiOqKJq_zMXOA_txz_hOy7";

const customerSupabase =
    window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


/* =========================================================
   HELPERS
   ========================================================= */

function customerEscapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function customerFormatPrice(value) {
    const number = Number(value || 0);

    return number.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    });
}


/* =========================================================
   GET PRODUCT STOCK
   ========================================================= */

async function getCustomerProductStock(productId) {

    const { data: product, error: productError } =
        await customerSupabase
            .from("products")
            .select("id, name, stock, active")
            .eq("id", productId)
            .single();

    if (productError) {
        console.error("Product stock error:", productError);
        return null;
    }


    const { data: sizes, error: sizeError } =
        await customerSupabase
            .from("product_sizes")
            .select("id, product_id, size, stock")
            .eq("product_id", productId)
            .order("id");

    if (sizeError) {
        console.error("Size stock error:", sizeError);
    }


    return {
        product: product,
        sizes: sizes || []
    };
}


/* =========================================================
   GET AVAILABLE STOCK
   ========================================================= */

async function getCustomerAvailableStock(productId, sizeId = null) {

    const result = await getCustomerProductStock(productId);

    if (!result) {
        return 0;
    }


    if (sizeId) {

        const size = result.sizes.find(
            item => String(item.id) === String(sizeId)
        );

        return size ? Number(size.stock || 0) : 0;
    }


    if (result.sizes.length > 0) {

        return result.sizes.reduce(
            (total, item) => total + Number(item.stock || 0),
            0
        );
    }


    return Number(result.product.stock || 0);
}


/* =========================================================
   LOAD CUSTOMER PRODUCTS
   ========================================================= */

async function loadCustomerProducts(
    containerId = "productsContainer"
) {

    const container = document.getElementById(containerId);

    if (!container) {
        console.warn("Products container not found:", containerId);
        return;
    }


    container.innerHTML = "<p>Loading products...</p>";


    const { data: products, error } =
        await customerSupabase
            .from("products")
            .select("*")
            .eq("active", true)
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error("Products loading error:", error);

        container.innerHTML =
            "<p>Unable to load products.</p>";

        return;
    }


    if (!products || products.length === 0) {

        container.innerHTML =
            "<p>No products available.</p>";

        return;
    }


    container.innerHTML = "";


    for (const product of products) {

        const stockData =
            await getCustomerProductStock(product.id);

        const sizes = stockData?.sizes || [];


        let totalStock = Number(product.stock || 0);

        if (sizes.length > 0) {

            totalStock = sizes.reduce(
                (total, item) =>
                    total + Number(item.stock || 0),
                0
            );
        }


        const card =
            document.createElement("div");

        card.className = "product-card";

        card.dataset.productId = product.id;


        let sizeHTML = "";


        if (sizes.length > 0) {

            sizeHTML = `
                <div class="product-sizes">

                    ${sizes.map(size => {

                        const stock =
                            Number(size.stock || 0);

                        return `
                            <button
                                type="button"
                                class="customer-size-btn"
                                data-size-id="${customerEscapeHTML(size.id)}"
                                data-stock="${stock}"
                                ${stock <= 0 ? "disabled" : ""}
                            >
                                ${customerEscapeHTML(size.size)}
                                ${stock <= 0
                                    ? " - Out of Stock"
                                    : ""}
                            </button>
                        `;

                    }).join("")}

                </div>
            `;
        }


        card.innerHTML = `

            <div class="product-image">
                ${
                    product.image_url
                    ? `
                        <img
                            src="${customerEscapeHTML(product.image_url)}"
                            alt="${customerEscapeHTML(product.name)}"
                        >
                    `
                    : ""
                }
            </div>


            <div class="product-info">

                <h3>
                    ${customerEscapeHTML(product.name)}
                </h3>


                <div class="product-price">
                    ${customerFormatPrice(product.price)}
                </div>


                ${sizeHTML}


                <div class="customer-stock-status">

                    ${
                        totalStock > 0
                        ? `
                            <span class="stock-available">
                                Available
                            </span>
                        `
                        : `
                            <span class="stock-out">
                                Out of Stock
                            </span>
                        `
                    }

                </div>


                <button
                    type="button"
                    class="customer-add-cart-btn"
                    data-product-id="${customerEscapeHTML(product.id)}"
                    ${totalStock <= 0 ? "disabled" : ""}
                >
                    ${
                        totalStock > 0
                        ? "Add to Cart"
                        : "Out of Stock"
                    }
                </button>

            </div>
        `;


        container.appendChild(card);
    }


    setupCustomerProductButtons();
}


/* =========================================================
   CART
   ========================================================= */

function getBombayNXCart() {

    try {

        return JSON.parse(
            localStorage.getItem("bombay_nx_cart") || "[]"
        );

    } catch (error) {

        console.error("Cart read error:", error);

        return [];
    }
}


function saveBombayNXCart(cart) {

    localStorage.setItem(
        "bombay_nx_cart",
        JSON.stringify(cart)
    );


    if (typeof updateCartCount === "function") {
        updateCartCount();
    }
}


/* =========================================================
   ADD TO CART
   ========================================================= */

async function addCustomerProductToCart(
    product,
    quantity = 1,
    sizeId = null,
    sizeName = null
) {

    quantity = Number(quantity);

    if (quantity <= 0) {
        quantity = 1;
    }


    const availableStock =
        await getCustomerAvailableStock(
            product.id,
            sizeId
        );


    if (availableStock < quantity) {

        alert(
            availableStock > 0
                ? `Only ${availableStock} item(s) available.`
                : "This product is out of stock."
        );

        return false;
    }


    const cart = getBombayNXCart();


    const existingIndex = cart.findIndex(item =>

        String(item.product_id) ===
            String(product.id)

        &&

        String(item.size_id || "") ===
            String(sizeId || "")
    );


    if (existingIndex >= 0) {

        const newQuantity =
            Number(cart[existingIndex].quantity || 0)
            + quantity;


        if (newQuantity > availableStock) {

            alert(
                `Only ${availableStock} item(s) available.`
            );

            return false;
        }


        cart[existingIndex].quantity =
            newQuantity;

    } else {

        cart.push({

            product_id: product.id,

            name: product.name,

            price: Number(product.price || 0),

            image_url: product.image_url || "",

            size_id: sizeId,

            size: sizeName,

            quantity: quantity
        });
    }


    saveBombayNXCart(cart);


    if (typeof renderCart === "function") {
        renderCart();
    }


    return true;
}


/* =========================================================
   REVALIDATE CART
   ========================================================= */

async function revalidateBombayNXCart() {

    const cart = getBombayNXCart();

    let changed = false;


    for (let i = cart.length - 1; i >= 0; i--) {

        const item = cart[i];


        const stock =
            await getCustomerAvailableStock(
                item.product_id,
                item.size_id
            );


        if (stock <= 0) {

            cart.splice(i, 1);

            changed = true;

            continue;
        }


        if (Number(item.quantity || 0) > stock) {

            item.quantity = stock;

            changed = true;
        }
    }


    if (changed) {

        saveBombayNXCart(cart);

        if (typeof renderCart === "function") {
            renderCart();
        }
    }


    return cart;
}


/* =========================================================
   CHECKOUT STOCK VALIDATION
   ========================================================= */

async function validateCustomerCheckoutStock() {

    const cart = getBombayNXCart();


    if (!cart.length) {

        return {
            valid: false,
            message: "Your cart is empty."
        };
    }


    for (const item of cart) {

        const stock =
            await getCustomerAvailableStock(
                item.product_id,
                item.size_id
            );


        if (stock < Number(item.quantity || 0)) {

            return {
                valid: false,

                message:
                    `${item.name} has only ${stock} item(s) available.`
            };
        }
    }


    return {
        valid: true,
        message: "Stock available."
    };
}


/* =========================================================
   PRODUCT BUTTONS
   ========================================================= */

function setupCustomerProductButtons() {

    document
        .querySelectorAll(".customer-add-cart-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                async function () {

                    const productId =
                        this.dataset.productId;


                    const { data: product, error } =
                        await customerSupabase
                            .from("products")
                            .select("*")
                            .eq("id", productId)
                            .single();


                    if (error || !product) {

                        alert(
                            "Product could not be loaded."
                        );

                        return;
                    }


                    const card =
                        this.closest(".product-card");


                    let sizeId = null;
                    let sizeName = null;


                    const selectedSize =
                        card?.querySelector(
                            ".customer-size-btn.selected"
                        );


                    if (selectedSize) {

                        sizeId =
                            selectedSize.dataset.sizeId;

                        sizeName =
                            selectedSize.textContent
                                .replace(
                                    " - Out of Stock",
                                    ""
                                )
                                .trim();
                    }


                    await addCustomerProductToCart(
                        product,
                        1,
                        sizeId,
                        sizeName
                    );
                }
            );
        });


    document
        .querySelectorAll(".customer-size-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    if (this.disabled) {
                        return;
                    }


                    const parent =
                        this.closest(".product-sizes");


                    parent
                        ?.querySelectorAll(
                            ".customer-size-btn"
                        )
                        .forEach(btn =>
                            btn.classList.remove(
                                "selected"
                            )
                        );


                    this.classList.add("selected");
                }
            );
        });
}


/* =========================================================
   LIVE REALTIME STOCK
   ========================================================= */

function setupBombayNXCustomerRealtime() {

    customerSupabase
        .channel("bombay-nx-live-stock")

        .on(
            "postgres_changes",

            {
                event: "*",
                schema: "public",
                table: "products"
            },

            async function () {

                await loadCustomerProducts();

                await revalidateBombayNXCart();
            }
        )

        .on(
            "postgres_changes",

            {
                event: "*",
                schema: "public",
                table: "product_sizes"
            },

            async function () {

                await loadCustomerProducts();

                await revalidateBombayNXCart();
            }
        )

        .subscribe();
}


/* =========================================================
   REFRESH STOCK UI
   ========================================================= */

async function refreshCustomerStockUI() {

    await loadCustomerProducts();

    await revalidateBombayNXCart();
}


/* =========================================================
   INITIALIZE CUSTOMER
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        try {

            await loadCustomerProducts();

            await revalidateBombayNXCart();

            setupBombayNXCustomerRealtime();

        } catch (error) {

            console.error(
                "Customer initialization error:",
                error
            );
        }
    }
);


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.getCustomerProductStock =
    getCustomerProductStock;

window.getCustomerAvailableStock =
    getCustomerAvailableStock;

window.loadCustomerProducts =
    loadCustomerProducts;

window.addCustomerProductToCart =
    addCustomerProductToCart;

window.revalidateBombayNXCart =
    revalidateBombayNXCart;

window.validateCustomerCheckoutStock =
    validateCustomerCheckoutStock;

window.refreshCustomerStockUI =
    refreshCustomerStockUI;