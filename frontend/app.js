// --- CASHIER LOGIN LOGIC ---
function showCashierLogin() {
    showView('cashier-login-modal');
}

function checkCashierCredentials() {
    var user = document.getElementById('cashier-user').value;
    var pass = document.getElementById('cashier-pass').value;
    if(user === 'cashier' && pass === 'cafe123') {
        showView('cashier-panel');
        document.getElementById('cashier-login-error').style.display = 'none';
        document.getElementById('cashier-user').value = '';
        document.getElementById('cashier-pass').value = '';
    } else {
        document.getElementById('cashier-login-error').style.display = 'block';
    }
}
// --- MENU & ORDER CALCULATION ---
const MENU = [
    { name: 'Espresso', price: 3 },
    { name: 'Latte', price: 4 },
    { name: 'Cappuccino', price: 4 },
    { name: 'Mocha', price: 4.5 },
    { name: 'Tea', price: 2.5 },
    { name: 'Cake Slice', price: 3.5 },
    { name: 'Cookie', price: 2 }
];

function renderMenu() {
    const menuDiv = document.getElementById('menu-list');
    menuDiv.innerHTML = '';
    MENU.forEach(item => {
        menuDiv.innerHTML += `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
                <span>${item.name} ($${item.price.toFixed(2)})</span>
                <input type="number" min="0" value="0" style="width:50px;" id="menu-qty-${item.name.replace(/\s/g,'-')}">
            </div>
        `;
    });
}

function calculateOrderTotal() {
    let total = 0;
    let items = [];
    MENU.forEach(item => {
        const qty = parseInt(document.getElementById('menu-qty-' + item.name.replace(/\s/g,'-')).value) || 0;
        if(qty > 0) {
            total += qty * item.price;
            items.push(`${qty} x ${item.name}`);
        }
    });
    document.getElementById('order-items').value = items.join(', ');
    document.getElementById('order-total').value = total.toFixed(2);
}
const API_BASE = "http://127.0.0.1:8000";
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
    const itemsInput = document.getElementById('order-items');
    const tableInput = document.getElementById('order-table');
    const totalInput = document.getElementById('order-total');
    const statusSelect = document.getElementById('target-staff');

    if(!itemsInput.value || !tableInput.value || !totalInput.value) return alert("Fill all fields");

    const data = {
        items: itemsInput.value,
        table_number: tableInput.value,
        total: parseFloat(totalInput.value),
        status: statusSelect.value
    };

    await fetch(`${API_BASE}/orders/`, { 
        method: "POST", 
        headers: {"Content-Type": "application/json"}, 
        body: JSON.stringify(data) 
    });

    // CLEAR CASHIER ORDER BOXES & MENU
    itemsInput.value = "";
    tableInput.value = "";
    totalInput.value = "";
    MENU.forEach(item => {
        document.getElementById('menu-qty-' + item.name.replace(/\s/g,'-')).value = 0;
    });
    alert("Order Sent Successfully");
}

async function adminSubmitOrder() {
    const itemsInput = document.getElementById('admin-order-items');
    const tableInput = document.getElementById('admin-order-table');
    const totalInput = document.getElementById('admin-order-total');
    const statusSelect = document.getElementById('admin-target-staff');

    if(!itemsInput.value || !tableInput.value || !totalInput.value) return alert("Fill all fields");

    const data = {
        items: itemsInput.value,
        table_number: tableInput.value,
        total: parseFloat(totalInput.value),
        status: statusSelect.value
    };

    await fetch(`${API_BASE}/orders/`, { 
        method: "POST", 
        headers: {"Content-Type": "application/json"}, 
        body: JSON.stringify(data) 
    });

    // CLEAR ADMIN QUICK ORDER BOXES
    itemsInput.value = "";
    tableInput.value = "";
    totalInput.value = "";
    
    loadAdminData(); 
}

// --- WITHDRAWAL & CLEARING ---

async function submitWithdrawal() {
    const descInput = document.getElementById('exp-desc');
    const amtInput = document.getElementById('exp-amount');

    if(!descInput.value || !amtInput.value) return alert("Enter reason and amount");

    const data = {
        description: descInput.value,
        amount: parseFloat(amtInput.value)
    };

    const response = await fetch(`${API_BASE}/expenses/`, { 
        method: "POST", 
        headers: {"Content-Type": "application/json"}, 
        body: JSON.stringify(data) 
    });

    if(response.ok) {
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
                <button onclick="updateStatus(${o.id}, 'completed')" class="btn-order">DONE</button>
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
        const tagClass = o.status === 'completed' ? 'tag-completed' : 'tag-pending';
        histT.innerHTML += `
            <tr>
                <td>#${o.id}</td>
                <td><b>T${o.table_number}</b></td>
                <td>$${o.total.toFixed(2)}</td>
                <td><span class="tag ${tagClass}">${o.status}</span></td>
                <td><button onclick="deleteOrder(${o.id})" style="background:#ff7675; color:white; padding:4px 8px; border-radius:4px;">X</button></td>
            </tr>`;
    });
}

async function deleteOrder(id) {
    if(confirm("Permanently delete this order?")) { 
        await fetch(`${API_BASE}/orders/${id}`, {method:"DELETE"}); 
        loadAdminData(); 
    }
}