// --- CONFIGURATION ---
const BREAD_PRICE = 20; // 20 AFN

// --- DATA MANAGEMENT ---
// Customer Structure: 
// { id: 123, name: "Ali", phone: "...", address: "...", history: [ {date: "2023-10-25", count: 2, total: 40} ] }

let customers = JSON.parse(localStorage.getItem('bakeryCustomers')) || [];

function saveData() {
    localStorage.setItem('bakeryCustomers', JSON.stringify(customers));
    updateDashboard();
}

// --- NAVIGATION ---
function showSection(sectionId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    if(sectionId === 'admin-dashboard') {
        document.getElementById('admin-container').classList.add('active');
        showAdminTab('dashboard');
    } else {
        document.getElementById(sectionId).classList.add('active');
    }
}

function showAdminTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(el => el.classList.remove('active-tab'));
    document.getElementById('tab-' + tabName).classList.add('active-tab');
    
    if(tabName === 'dashboard') updateDashboard();
    if(tabName === 'manage') renderCustomerTable();
}

// --- 1. REGISTER CUSTOMER ---
document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const address = document.getElementById('cust-address').value;

    const newCustomer = {
        id: Date.now(),
        name: name,
        phone: phone,
        address: address,
        history: [] // Stores individual transactions
    };

    customers.push(newCustomer);
    saveData();
    alert('Customer Registered Successfully!');
    this.reset();
});

// --- 2. SELL SYSTEM (POPUP & LOGIC) ---
let currentSelectedCustomerId = null;

// Open the Modal
function openSellModal(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if(!customer) return;

    currentSelectedCustomerId = customerId;
    document.getElementById('modal-cust-name').innerText = "Sell to: " + customer.name;
    document.getElementById('sell-qty').value = 1; // Reset to 1
    updateModalPrice();
    
    document.getElementById('sales-modal').style.display = "block";
}

// Close the Modal
function closeModal() {
    document.getElementById('sales-modal').style.display = "none";
    currentSelectedCustomerId = null;
}

// Plus / Minus Buttons
function adjustCount(amount) {
    const input = document.getElementById('sell-qty');
    let val = parseInt(input.value);
    val += amount;
    if(val < 1) val = 1; // Minimum 1 bread
    input.value = val;
    updateModalPrice();
}

function updateModalPrice() {
    const qty = parseInt(document.getElementById('sell-qty').value);
    document.getElementById('modal-total-price').innerText = qty * BREAD_PRICE;
}

// Confirm the Sale
function confirmSale() {
    if(!currentSelectedCustomerId) return;

    const qty = parseInt(document.getElementById('sell-qty').value);
    const totalPrice = qty * BREAD_PRICE;
    
    // Get Today's Date (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    const customer = customers.find(c => c.id === currentSelectedCustomerId);
    
    // Check if customer already has history array (for old data compatibility)
    if(!customer.history) customer.history = [];

    // Add Transaction
    customer.history.push({
        date: today,
        count: qty,
        total: totalPrice
    });

    saveData();
    closeModal();
    renderCustomerTable(); // Refresh table
    // alert('Sold ' + qty + ' breads!');
}

// --- 3. RENDER CUSTOMER TABLE ---
function renderCustomerTable() {
    const tbody = document.getElementById('customer-table-body');
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    tbody.innerHTML = '';

    customers.forEach(customer => {
        if(customer.name.toLowerCase().includes(searchTerm) || customer.phone.includes(searchTerm)) {
            
            // Calculate All Time Total for display
            const allTimeBread = customer.history ? customer.history.reduce((sum, h) => sum + h.count, 0) : 0;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.id}</td>
                <td>${customer.name}</td>
                <td>${customer.phone}</td>
                <td>${allTimeBread} Loaves</td>
                <td>
                    <button class="sell-btn" onclick="openSellModal(${customer.id})">
                        💰 Sell / Manage
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        }
    });
}

// --- 4. DASHBOARD & REPORTING (MONTHLY) ---
function updateDashboard() {
    // 1. Set Month Picker to current month if empty
    const monthPicker = document.getElementById('dashboard-month');
    if(!monthPicker.value) {
        const now = new Date();
        const monthStr = now.toISOString().slice(0, 7); // "2023-10"
        monthPicker.value = monthStr;
    }
    
    const selectedMonth = monthPicker.value; // "YYYY-MM"

    let totalCust = customers.length;
    let monthlyBread = 0;
    let monthlyRevenue = 0;
    let dailyStats = {}; // To store "2023-10-01": {bread: 10, income: 200}

    customers.forEach(cust => {
        if(cust.history) {
            cust.history.forEach(trans => {
                // Check if transaction date starts with selected month
                if(trans.date.startsWith(selectedMonth)) {
                    monthlyBread += trans.count;
                    monthlyRevenue += trans.total;

                    // Aggregate for Daily Breakdown Table
                    if(!dailyStats[trans.date]) {
                        dailyStats[trans.date] = { bread: 0, income: 0 };
                    }
                    dailyStats[trans.date].bread += trans.count;
                    dailyStats[trans.date].income += trans.total;
                }
            });
        }
    });

    // Update Top Cards
    document.getElementById('total-customers').innerText = totalCust;
    document.getElementById('total-breads').innerText = monthlyBread;
    document.getElementById('total-revenue').innerText = monthlyRevenue + " AFN";

    // Update Daily Breakdown Table
    const tbody = document.getElementById('daily-stats-body');
    tbody.innerHTML = '';
    
    // Sort dates
    const sortedDates = Object.keys(dailyStats).sort();

    if(sortedDates.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">No sales found for this month.</td></tr>';
    } else {
        sortedDates.forEach(date => {
            const stat = dailyStats[date];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${date}</td>
                <td>${stat.bread}</td>
                <td>${stat.income} AFN</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// Initial Load
updateDashboard();

// Close modal if clicked outside
window.onclick = function(event) {
    const modal = document.getElementById('sales-modal');
    if (event.target == modal) {
        closeModal();
    }
}