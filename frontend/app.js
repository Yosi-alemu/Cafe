// --- CASHIER LOGIN LOGIC ---
function showCashierLogin() {
    showView('cashier-login-modal');
}

function checkCashierCredentials() {
    var userEl = document.getElementById('cashier-user');
    var passEl = document.getElementById('cashier-pass');

    if (userEl.value === 'cashier' && passEl.value === 'cafe123') {
        showView('cashier-panel');
        document.getElementById('cashier-login-error').style.display = 'none';
    } else {
        document.getElementById('cashier-login-error').style.display = 'block';
    }

    // Clear input data after submission regardless of success
    userEl.value = '';
    passEl.value = '';
}
// --- MENU & ORDER CALCULATION ---
let MENU = [];

let currentCart = [];

function renderMenu() {
    const dropdown = document.getElementById('menu-dropdown');
    dropdown.innerHTML = '<option value="" disabled selected>Select an item...</option>';
    MENU.forEach((item, index) => {
        dropdown.innerHTML += `<option value="${index}">${item.name} ($${item.price.toFixed(2)})</option>`;
    });
}

// Call renderMenu to immediately populate the HTML dropdown on page load
renderMenu();

function addToCart() {
    const dropdown = document.getElementById('menu-dropdown');
    const qtyInput = document.getElementById('menu-qty');
    const index = dropdown.value;
    const qty = parseInt(qtyInput.value) || 0;

    if (index === "" || qty <= 0) return alert("Please select a valid item and quantity.");

    const selectedItem = MENU[index];

    // Check if it already exists in the cart to increment quantity
    const existing = currentCart.find(c => c.item.name === selectedItem.name);
    if (existing) {
        existing.qty += qty;
    } else {
        currentCart.push({ item: selectedItem, qty: qty });
    }

    // Reset inputs
    dropdown.value = "";
    qtyInput.value = "1";

    renderCart();
    calculateLiveTotal();
}

function renderCart() {
    const cartList = document.getElementById('cart-list');
    cartList.innerHTML = "";
    if (currentCart.length === 0) {
        cartList.innerHTML = '<li style="color:#888; text-align:center; padding:10px;">Cart is empty</li>';
        return;
    }

    currentCart.forEach((cartItem, idx) => {
        cartList.innerHTML += `
            <li style="display:flex; justify-content:space-between; padding:5px 0;">
                <span>${cartItem.qty} x ${cartItem.item.name}</span>
                <span>$${(cartItem.qty * cartItem.item.price).toFixed(2)} 
                    <button onclick="removeFromCart(${idx})" style="margin-left:10px; background:#ff7675; color:white; border:none; border-radius:3px; cursor:pointer;">X</button>
                </span>
            </li>
        `;
    });
}

function removeFromCart(idx) {
    currentCart.splice(idx, 1);
    renderCart();
    calculateLiveTotal();
}

function calculateLiveTotal() {
    let total = currentCart.reduce((sum, cartItem) => sum + (cartItem.item.price * cartItem.qty), 0);
    document.getElementById('live-total').innerText = total.toFixed(2);
}
const API_BASE = "http://192.168.1.2:8000";
let currentRole = "";

// --- VIEW NAVIGATION ---

function showView(id) {
    document.querySelectorAll('.container').forEach(c => c.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

function goHome() {
    showView('navigation-hub');
    currentRole = "";
}

function instantLogin(role) {
    if (role === 'cashier') {
        showView('cashier-panel');
    } else {
        currentRole = role;
        document.getElementById('staff-title').innerText = role.toUpperCase() + " Queue";
        showView('staff-panel');
        loadStaffOrders();
    }
}

// --- ADMIN AUTH & CLEARING ---

// THIS WAS THE MISSING FUNCTION CAUSING THE ERROR
function showAdminLogin() {
    showView('admin-login-modal');
}

async function checkAdminCredentials() {
    const uInput = document.getElementById('admin-user');
    const pInput = document.getElementById('admin-pass');

    if (uInput.value === "admin" && pInput.value === "admin123") {
        showView('admin-panel');
        loadAdminData();

        // CLEAR LOGIN BOXES AFTER SUCCESS
        uInput.value = "";
        pInput.value = "";
    } else {
        alert("Wrong Password");
        pInput.value = ""; // Clear password on failure too
    }
}

// --- MODAL LOGIC ---

async function showOngoingModal() {
    document.getElementById('ongoing-modal').classList.remove('hidden');
    const res = await fetch(`${API_BASE}/orders/`);
    const orders = await res.json();
    const list = document.getElementById('modal-queue-list');
    list.innerHTML = "";

    orders.filter(o => o.status !== 'completed').forEach(o => {
        list.innerHTML += `
            <div style="padding:12px; border-bottom:1px solid #eee; text-align:left;">
                <b>Table ${o.table_number}</b>: ${o.items} 
                <span style="float:right; color:#e67e22; font-weight:bold;">${o.status.toUpperCase()}</span>
            </div>`;
    });
}

function closeOngoingModal() {
    document.getElementById('ongoing-modal').classList.add('hidden');
}

// --- ORDER SUBMISSION & CLEARING ---

async function submitOrder() {
    const tableInput = document.getElementById('order-table');

    if (!tableInput.value) return alert("Please select a table number.");
    if (currentCart.length === 0) return alert("Please add at least one item to the order.");

    let baristaItems = [];
    let baristaTotal = 0;
    let bakerItems = [];
    let bakerTotal = 0;

    // Parse the cart into stations
    currentCart.forEach(cartItem => {
        if (cartItem.item.target === 'barista') {
            baristaItems.push(`${cartItem.qty} x ${cartItem.item.name}`);
            baristaTotal += cartItem.qty * cartItem.item.price;
        } else {
            bakerItems.push(`${cartItem.qty} x ${cartItem.item.name}`);
            bakerTotal += cartItem.qty * cartItem.item.price;
        }
    });

    const promises = [];

    if (baristaItems.length > 0) {
        promises.push(fetch(`${API_BASE}/orders/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                items: baristaItems.join(', '),
                table_number: tableInput.value,
                total: baristaTotal,
                status: 'barista'
            })
        }));
    }

    if (bakerItems.length > 0) {
        promises.push(fetch(`${API_BASE}/orders/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                items: bakerItems.join(', '),
                table_number: tableInput.value,
                total: bakerTotal,
                status: 'cake'
            })
        }));
    }

    await Promise.all(promises);

    // CLEAR CASHIER ORDER CACHE AND UI
    tableInput.value = "";
    document.getElementById('menu-dropdown').value = "";
    document.getElementById('menu-qty').value = "1";
    currentCart = [];

    renderCart();
    calculateLiveTotal();

    alert("Order Sent Successfully");
}

async function fetchMenu() {
    try {
        const res = await fetch(`${API_BASE}/menu/`);
        MENU = await res.json();
        renderMenu();
        if (document.getElementById('admin-menu-list')) {
            renderAdminMenuMgmt();
            renderAdminOrderDropdown();
        }
    } catch (e) {
        console.error("Error fetching menu", e);
    }
}

function renderAdminMenuMgmt() {
    const list = document.getElementById('admin-menu-list');
    list.innerHTML = "";
    MENU.forEach(item => {
        list.innerHTML += `
            <tr>
                <td>#${item.id}</td>
                <td>${item.name}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>${item.target}</td>
                <td><button onclick="deleteMenuItem(${item.id})" style="background:#ff7675;color:white;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;">X</button></td>
            </tr>
        `;
    });
}

function renderAdminOrderDropdown() {
    const dropdown = document.getElementById('admin-menu-dropdown');
    dropdown.innerHTML = '<option value="" disabled selected>Select an item...</option>';
    MENU.forEach((item, index) => {
        dropdown.innerHTML += `<option value="${index}">${item.name} ($${item.price.toFixed(2)})</option>`;
    });
}

async function addMenuItem() {
    const name = document.getElementById('new-item-name').value;
    const price = parseFloat(document.getElementById('new-item-price').value);
    const target = document.getElementById('new-item-target').value;
    if (!name || isNaN(price)) return alert("Please enter valid name and price");

    await fetch(`${API_BASE}/menu/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, target })
    });

    document.getElementById('new-item-name').value = "";
    document.getElementById('new-item-price').value = "";
    fetchMenu();
    alert("Menu item saved successfully!");
}

async function deleteMenuItem(id) {
    if (confirm("Delete this menu item?")) {
        await fetch(`${API_BASE}/menu/${id}`, { method: 'DELETE' });
        fetchMenu();
    }
}

// Admin Cart Logic
let adminCurrentCart = [];

function adminAddToCart() {
    const dropdown = document.getElementById('admin-menu-dropdown');
    const qtyInput = document.getElementById('admin-menu-qty');
    const index = dropdown.value;
    const qty = parseInt(qtyInput.value) || 0;

    if (index === "" || qty <= 0) return alert("Please select a valid item and quantity.");

    const selectedItem = MENU[index];

    const existing = adminCurrentCart.find(c => c.item.name === selectedItem.name);
    if (existing) {
        existing.qty += qty;
    } else {
        adminCurrentCart.push({ item: selectedItem, qty: qty });
    }

    dropdown.value = "";
    qtyInput.value = "1";

    adminRenderCart();
    adminCalculateLiveTotal();
}

function adminRenderCart() {
    const cartList = document.getElementById('admin-cart-list');
    cartList.innerHTML = "";
    if (adminCurrentCart.length === 0) {
        cartList.innerHTML = '<li style="color:#888; text-align:center; padding:10px;">Cart is empty</li>';
        return;
    }

    adminCurrentCart.forEach((cartItem, idx) => {
        cartList.innerHTML += `
            <li style="display:flex; justify-content:space-between; padding:5px 0;">
                <span>${cartItem.qty} x ${cartItem.item.name}</span>
                <span>$${(cartItem.qty * cartItem.item.price).toFixed(2)} 
                    <button onclick="adminRemoveFromCart(${idx})" style="margin-left:10px; background:#ff7675; color:white; border:none; border-radius:3px; cursor:pointer;">X</button>
                </span>
            </li>
        `;
    });
}

function adminRemoveFromCart(idx) {
    adminCurrentCart.splice(idx, 1);
    adminRenderCart();
    adminCalculateLiveTotal();
}

function adminCalculateLiveTotal() {
    let total = adminCurrentCart.reduce((sum, cartItem) => sum + (cartItem.item.price * cartItem.qty), 0);
    document.getElementById('admin-live-total').innerText = total.toFixed(2);
}

async function adminSubmitOrder() {
    const tableInput = document.getElementById('admin-order-table');

    if (!tableInput.value) return alert("Please select a table number.");
    if (adminCurrentCart.length === 0) return alert("Please add at least one item to the order.");

    let baristaItems = [];
    let baristaTotal = 0;
    let bakerItems = [];
    let bakerTotal = 0;

    // Parse the cart into stations
    adminCurrentCart.forEach(cartItem => {
        if (cartItem.item.target === 'barista') {
            baristaItems.push(`${cartItem.qty} x ${cartItem.item.name}`);
            baristaTotal += cartItem.qty * cartItem.item.price;
        } else {
            bakerItems.push(`${cartItem.qty} x ${cartItem.item.name}`);
            bakerTotal += cartItem.qty * cartItem.item.price;
        }
    });

    const promises = [];

    if (baristaItems.length > 0) {
        promises.push(fetch(`${API_BASE}/orders/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                items: baristaItems.join(', '),
                table_number: tableInput.value,
                total: baristaTotal,
                status: 'barista'
            })
        }));
    }

    if (bakerItems.length > 0) {
        promises.push(fetch(`${API_BASE}/orders/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                items: bakerItems.join(', '),
                table_number: tableInput.value,
                total: bakerTotal,
                status: 'cake'
            })
        }));
    }

    await Promise.all(promises);

    tableInput.value = "";
    document.getElementById('admin-menu-dropdown').value = "";
    document.getElementById('admin-menu-qty').value = "1";
    adminCurrentCart = [];

    adminRenderCart();
    adminCalculateLiveTotal();
    loadAdminData();
    alert("Order Sent Successfully");
}

// Ensure menu is fetched on load
fetchMenu();

// --- WITHDRAWAL & CLEARING ---

async function submitWithdrawal() {
    const descInput = document.getElementById('exp-desc');
    const amtInput = document.getElementById('exp-amount');

    if (!descInput.value || !amtInput.value) return alert("Enter reason and amount");

    const data = {
        description: descInput.value,
        amount: parseFloat(amtInput.value)
    };

    const response = await fetch(`${API_BASE}/expenses/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        // CLEAR WITHDRAWAL BOXES
        descInput.value = "";
        amtInput.value = "";
        alert("Withdrawal Saved");
    }
}

// --- DATA LOADING & TABLES ---

async function loadStaffOrders() {
    const res = await fetch(`${API_BASE}/orders/`);
    const orders = await res.json();
    const list = document.getElementById('staff-orders-list');
    list.innerHTML = "";

    orders.filter(o => o.status === currentRole).forEach(o => {
        list.innerHTML += `
            <div class="section-card" style="min-height:auto; margin-bottom:10px;">
                <h3>Table ${o.table_number}</h3>
                <p>${o.items}</p>
                <div style="display:flex; gap:10px;">
                    <button onclick="updateStatus(${o.id}, 'completed')" class="btn-order" style="flex:1; margin-top:0;">DONE</button>
                    <button onclick="updateStatus(${o.id}, 'cancelled')" class="btn-withdraw" style="flex:1; margin-top:0;">CANCEL</button>
                </div>
            </div>`;
    });
}

async function updateStatus(id, status) {
    await fetch(`${API_BASE}/orders/${id}?status=${status}`, { method: "PUT" });
    currentRole ? loadStaffOrders() : loadAdminData();
}

async function loadAdminData() {
    const resO = await fetch(`${API_BASE}/orders/`);
    const orders = await resO.json();
    const resE = await fetch(`${API_BASE}/expenses/`);
    const expenses = await resE.json();

    const gross = orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0);
    const withdr = expenses.reduce((s, e) => s + e.amount, 0);

    document.getElementById('total-sales').innerText = gross.toFixed(2);
    document.getElementById('total-expenses').innerText = withdr.toFixed(2);
    document.getElementById('net-profit').innerText = (gross - withdr).toFixed(2);

    const expT = document.getElementById('expense-tbody');
    expT.innerHTML = "";
    expenses.reverse().forEach(e => {
        expT.innerHTML += `<tr><td>${e.description}</td><td style="color:red">-$${e.amount.toFixed(2)}</td></tr>`;
    });

    const histT = document.getElementById('admin-all-orders');
    histT.innerHTML = "";
    orders.reverse().forEach(o => {
        let tagClass = 'tag-pending';
        if (o.status === 'completed') tagClass = 'tag-completed';
        else if (o.status === 'cancelled') tagClass = 'tag-cancelled';
        histT.innerHTML += `
            <tr>
                <td>#${o.id}</td>
                <td><b>T${o.table_number}</b></td>
                <td>${o.items}</td>
                <td>$${o.total.toFixed(2)}</td>
                <td><span class="tag ${tagClass}">${o.status}</span></td>
                <td><button onclick="deleteOrder(${o.id})" style="background:#ff7675; color:white; padding:4px 8px; border-radius:4px;">X</button></td>
            </tr>`;
    });
}

async function deleteOrder(id) {
    if (confirm("Permanently delete this order?")) {
        await fetch(`${API_BASE}/orders/${id}`, { method: "DELETE" });
        loadAdminData();
    }
}