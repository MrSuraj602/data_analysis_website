// script.js - Complete Updated Code
let superData = [];
let salesTimeChart, salesCatChart, salesSubPieChart;
let profitTimeChart, profitCatChart, profitSubPieChart;
let currentUser = sessionStorage.getItem('currentUser');

function showTab(name) {
  document.querySelectorAll('.tab-content').forEach(div => div.style.display = 'none');
  document.querySelectorAll('.tabs button').forEach(btn => btn.classList.remove('active'));

  document.getElementById(name).style.display = 'block';
  document.getElementById('tab-' + name).classList.add('active');

  const year = document.getElementById('yearSelect').value;
  if (name === 'sales' || name === 'profit') {
    renderForYear(year);
  }
}

function setupFileUpload() {
  const fileInput = document.getElementById('dataFile');

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(new Error('File read error'));
        reader.readAsText(file);
      });

      document.querySelector('.file-info').textContent = file.name;
      superData = parseCSV(text);

      const users = JSON.parse(localStorage.getItem('superstore_users')) || {};
      if (users[currentUser]) {
        users[currentUser].data = text;
        users[currentUser].lastUpload = new Date().toISOString();
        localStorage.setItem('superstore_users', JSON.stringify(users));
      }

      updateYearDropdown();
      renderForYear(document.getElementById('yearSelect').value);

      alert('File uploaded successfully! Data loaded.');
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing file. Please check the format.');
    }
  });
}

function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(v => v.trim().replace(/"/g, ''));
    if (values.length !== headers.length) continue;

    try {
      const row = {};
      headers.forEach((header, index) => row[header] = values[index]);

      const date = new Date(row['Order Date']);
      if (isNaN(date)) continue;

      data.push({
        date,
        year: date.getFullYear(),
        month: date.getMonth(),
        category: row['Category'],
        subCategory: row['Sub-Category'],
        sales: parseFloat(row['Sales'].replace(/[^0-9.-]/g, '')),
        profit: parseFloat(row['Profit'].replace(/[^0-9.-]/g, ''))
      });
    } catch (e) {
      console.warn('Skipping row:', e);
    }
  }
  return data;
}

function updateYearDropdown() {
  const years = Array.from(new Set(superData.map(d => d.year))).sort();
  const sel = document.getElementById('yearSelect');
  sel.innerHTML = '';
  years.forEach(y => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    sel.appendChild(opt);
  });
  sel.value = years[0];
}

function group(arr, keyFn, valFn) {
  return arr.reduce((acc, r) => {
    const key = keyFn(r);
    acc[key] = (acc[key] || 0) + valFn(r);
    return acc;
  }, {});
}

function fmt(n) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function randomColor() {
  return `hsl(${Math.random() * 360}, 70%, 80%)`;
}

function renderForYear(year, data = superData) {
  if (!data.length) return;
  year = +year;
  const subset = data.filter(r => r.year === year);
  const months = [...Array(12).keys()];

  // Clear top tables when data changes
  document.getElementById('topTablesContainer').style.display = 'none';
  document.getElementById('salesTopTable').innerHTML = '';
  document.getElementById('profitTopTable').innerHTML = '';

  const totalSales = subset.reduce((s, r) => s + r.sales, 0);
  const totalProfit = subset.reduce((s, r) => s + r.profit, 0);
  const profitMargin = totalSales ? (totalProfit / totalSales) * 100 : 0;

  document.getElementById('totalSales').textContent = `\u20B9 ${fmt(totalSales)}`;
  document.getElementById('totalProfit').textContent = `\u20B9 ${fmt(totalProfit)}`;
  document.getElementById('profitMargin').textContent = `${profitMargin.toFixed(1)} %`;

  // Sales Charts
  const salesByMonth = group(subset, r => r.month, r => r.sales);
  const salesTS = months.map(m => salesByMonth[m] || 0);
  if (salesTimeChart) salesTimeChart.destroy();
  salesTimeChart = new Chart(document.getElementById('salesTimeChart'), {
    type: 'bar', 
    data: { 
      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      datasets: [{ 
        label: 'Sales', 
        data: salesTS, 
        backgroundColor: 'rgba(54, 162, 235, 0.6)' 
      }] 
    },
    options: { responsive: true }
  });

  const salesByCat = group(subset, r => r.category, r => r.sales);
  if (salesCatChart) salesCatChart.destroy();
  salesCatChart = new Chart(document.getElementById('salesCatChart'), {
    type: 'bar', 
    data: {
      labels: Object.keys(salesByCat),
      datasets: [{ 
        label: 'Sales', 
        data: Object.values(salesByCat), 
        backgroundColor: Object.keys(salesByCat).map(() => randomColor()) 
      }]
    }, 
    options: { responsive: true }
  });

  // Profit Charts
  const profitByMonth = group(subset, r => r.month, r => r.profit);
  const profTS = months.map(m => profitByMonth[m] || 0);
  if (profitTimeChart) profitTimeChart.destroy();
  profitTimeChart = new Chart(document.getElementById('profitTimeChart'), {
    type: 'bar', 
    data: { 
      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      datasets: [{ 
        label: 'Profit', 
        data: profTS, 
        backgroundColor: 'rgba(75, 192, 192, 0.6)' 
      }] 
    },
    options: { responsive: true }
  });

  const profitByCat = group(subset, r => r.category, r => r.profit);
  if (profitCatChart) profitCatChart.destroy();
  profitCatChart = new Chart(document.getElementById('profitCatChart'), {
    type: 'bar', 
    data: {
      labels: Object.keys(profitByCat),
      datasets: [{ 
        label: 'Profit', 
        data: Object.values(profitByCat), 
        backgroundColor: Object.keys(profitByCat).map(() => randomColor()) 
      }]
    }, 
    options: { responsive: true }
  });

  // Build tables for sales and profit tabs
  const salesBySub = group(subset, r => r.subCategory, r => r.sales);
  const profitBySub = group(subset, r => r.subCategory, r => r.profit);
  
  buildTopTable('Top 5 Selling Sub-Categories', salesBySub, 'topSalesTable');
  buildTopTable('Top 5 Profitable Sub-Categories', profitBySub, 'topProfitTable');
}

function setupCardInteractions() {
  document.getElementById('totalSalesCard').addEventListener('click', function() {
    const container = document.getElementById('topTablesContainer');
    const salesTable = document.getElementById('salesTopTable');
    const profitTable = document.getElementById('profitTopTable');
    
    // Always regenerate with current data
    const year = document.getElementById('yearSelect').value;
    const subset = superData.filter(r => r.year === +year);
    const salesBySub = group(subset, r => r.subCategory, r => r.sales);
    buildInteractiveTopTable('Top 5 Selling Sub-Categories', salesBySub, 'salesTopTable');
    
    if (container.style.display === 'none' || profitTable.style.display === 'block') {
      container.style.display = 'block';
      salesTable.style.display = 'block';
      profitTable.style.display = 'none';
    } else {
      container.style.display = 'none';
    }
  });

  document.getElementById('totalProfitCard').addEventListener('click', function() {
    const container = document.getElementById('topTablesContainer');
    const salesTable = document.getElementById('salesTopTable');
    const profitTable = document.getElementById('profitTopTable');
    
    // Always regenerate with current data
    const year = document.getElementById('yearSelect').value;
    const subset = superData.filter(r => r.year === +year);
    const profitBySub = group(subset, r => r.subCategory, r => r.profit);
    buildInteractiveTopTable('Top 5 Profitable Sub-Categories', profitBySub, 'profitTopTable');
    
    if (container.style.display === 'none' || salesTable.style.display === 'block') {
      container.style.display = 'block';
      salesTable.style.display = 'none';
      profitTable.style.display = 'block';
    } else {
      container.style.display = 'none';
    }
  });
}

function buildTopTable(title, dataObj, containerId) {
  const entries = Object.entries(dataObj).sort((a, b) => b[1] - a[1]).slice(0, 5);
  let html = `<h3>${title}</h3><table><tr><th>Sub-Category</th><th>Amount</th></tr>`;
  entries.forEach(([key, val]) => html += `<tr><td>${key}</td><td>\u20B9 ${fmt(val)}</td></tr>`);
  html += '</table>';
  document.getElementById(containerId).innerHTML = html;
}

function buildInteractiveTopTable(title, dataObj, containerId) {
  const entries = Object.entries(dataObj).sort((a, b) => b[1] - a[1]).slice(0, 5);
  let html = `
    <div class="table-header">
      <h3>${title}</h3>
      <button onclick="document.getElementById('topTablesContainer').style.display='none'" 
              class="close-table-btn">
        <i class="fas fa-times"></i> Close
      </button>
    </div>
    <table>
      <tr><th>Sub-Category</th><th>Amount</th></tr>`;
  
  entries.forEach(([key, val]) => {
    html += `<tr>
      <td>${key}</td>
      <td>\u20B9 ${fmt(val)}</td>
    </tr>`;
  });
  
  html += '</table>';
  document.getElementById(containerId).innerHTML = html;
}

function applyDateFilter() {
  const from = new Date(document.getElementById('fromDate').value);
  const to = new Date(document.getElementById('toDate').value);
  const filtered = superData.filter(r => r.date >= from && r.date <= to);
  renderFilteredData(filtered);
}

function renderFilteredData(dataSubset) {
  if (!dataSubset.length) {
    alert("No data in selected range");
    return;
  }
  const year = dataSubset[0].year;
  renderForYear(year, dataSubset);
}

function exportCharts() {
  const charts = [salesTimeChart, salesCatChart, salesSubPieChart, 
                 profitTimeChart, profitCatChart, profitSubPieChart];
  charts.forEach((chart, i) => {
    if (!chart) return;
    const link = document.createElement('a');
    link.href = chart.toBase64Image();
    link.download = `chart${i + 1}.png`;
    link.click();
  });
}

function toggleDarkMode() {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
}

// Initialize the dashboard
window.addEventListener('DOMContentLoaded', async () => {
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
  }

  setupFileUpload();
  setupCardInteractions();

  try {
    const users = JSON.parse(localStorage.getItem('superstore_users')) || {};
    const userData = users[currentUser]?.data;

    if (userData) {
      superData = parseCSV(userData);
      const lastUpload = users[currentUser]?.lastUpload;
      if (lastUpload) {
        alert(`Welcome back! Last data upload: ${new Date(lastUpload).toLocaleString()}`);
      }
    } else {
      const response = await fetch('superstore.csv');
      if (!response.ok) throw new Error('Failed to load default data');
      const text = await response.text();
      superData = parseCSV(text);
    }

    updateYearDropdown();
    renderForYear(document.getElementById('yearSelect').value);

    document.getElementById('yearSelect').addEventListener('change', () => {
      const activeTab = document.querySelector('.tabs button.active').id.replace('tab-', '');
      if (activeTab === 'sales' || activeTab === 'profit') {
        renderForYear(document.getElementById('yearSelect').value);
      }
    });

    showTab('home');
  } catch (error) {
    console.error('Initialization error:', error);
    alert('Failed to initialize dashboard. Please try again.');
  }
});