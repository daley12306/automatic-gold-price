// Đọc và parse CSV
async function loadGoldData() {
    try {
        const response = await fetch('./data/gold_price.csv');
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error('Lỗi khi đọc file CSV:', error);
        return [];
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim();
        });
        data.push(row);
    }
    return data;
}

// ==================== STATE ====================
let appState = {
    allData: [],
    currentDate: null,
    sortedDates: []
};

// ==================== DATE UTILITIES ====================

// Lấy tất cả các ngày đã sắp xếp (mới nhất trước)
function getSortedDates(data) {
    const dates = [...new Set(data.map(item => item.ngay))];
    dates.sort((a, b) => {
        const [da, ma, ya] = a.split('-').map(Number);
        const [db, mb, yb] = b.split('-').map(Number);
        return new Date(yb, mb - 1, db) - new Date(ya, ma - 1, da);
    });
    return dates;
}

// Format cho input date (yyyy-mm-dd)
function formatDateForInput(dateStr) {
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
}

// Parse từ input date (yyyy-mm-dd) sang dd-mm-yyyy
function parseInputDate(inputValue) {
    const [year, month, day] = inputValue.split('-');
    return `${day}-${month}-${year}`;
}

// Lấy dữ liệu theo ngày cụ thể
function getDataByDate(data, date) {
    return data.filter(item => item.ngay === date);
}

// Lấy dữ liệu ngày trước đó để tính biến động
function getPreviousData(data, currentDate) {
    const dates = getSortedDates(data);
    const currentIndex = dates.indexOf(currentDate);
    if (currentIndex < dates.length - 1) {
        const prevDate = dates[currentIndex + 1];
        return data.filter(item => item.ngay === prevDate);
    }
    return [];
}

// ==================== FORMAT UTILITIES ====================

// Format giá (triệu/lượng)
function formatPrice(price) {
    const num = parseFloat(price) / 1000;
    return num.toFixed(3);
}

// Format ngày hiển thị
function formatDate(dateStr) {
    const [day, month, year] = dateStr.split('-');
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return `${parseInt(day)} ${months[parseInt(month) - 1]}, ${year}`;
}

// Format ngày ngắn gọn
function formatShortDate(dateStr) {
    const [day, month] = dateStr.split('-');
    return `${day}/${month}`;
}

// Tính spread
function calculateSpread(giaban, giamua) {
    return (parseFloat(giaban) - parseFloat(giamua)) / 1000;
}

// Tính biến động
function calculateChange(currentPrice, prevPrice) {
    if (!prevPrice) return 0;
    return (parseFloat(currentPrice) - parseFloat(prevPrice)) / 1000;
}

// ==================== UI UPDATE FUNCTIONS ====================

// Cập nhật ngày hiện tại trong header
function updateCurrentDate(dateStr) {
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        dateEl.textContent = formatDate(dateStr);
    }
}

// Cập nhật cards tổng quan
function updateSummaryCards(items, prevItems) {
    const sjcData = items.find(item => item.masp === 'SJC');
    const n24kData = items.find(item => item.masp === 'N24K');
    const pnjData = items.find(item => item.masp === 'PNJ');
    const prevSjc = prevItems.find(item => item.masp === 'SJC');
    const prevN24k = prevItems.find(item => item.masp === 'N24K');
    const prevPnj = prevItems.find(item => item.masp === 'PNJ');

    // Card SJC
    const sjcCard = document.querySelector('.grid.grid-cols-1 > div:first-child');
    if (sjcCard && sjcData) {
        const buyPrice = sjcCard.querySelector('.space-y-4 .flex:first-child span:last-child');
        const sellPrice = sjcCard.querySelector('.space-y-4 .flex:last-child span:last-child');
        const changeEl = sjcCard.querySelector('[class*="bg-emerald"], [class*="bg-red"]');
        
        if (buyPrice) buyPrice.textContent = formatPrice(sjcData.giamua);
        if (sellPrice) sellPrice.textContent = formatPrice(sjcData.giaban);
        
        if (changeEl && prevSjc) {
            const percent = ((parseFloat(sjcData.giaban) - parseFloat(prevSjc.giaban)) / parseFloat(prevSjc.giaban) * 100).toFixed(1);
            updateChangeIndicator(changeEl, percent);
        }
    }

    // Card N24K
    const n24kCard = document.querySelector('.grid.grid-cols-1 > div:nth-child(2)');
    if (n24kCard && n24kData) {
        const buyPrice = n24kCard.querySelector('.space-y-4 .flex:first-child span:last-child');
        const sellPrice = n24kCard.querySelector('.space-y-4 .flex:last-child span:last-child');
        const changeEl = n24kCard.querySelector('[class*="bg-emerald"], [class*="bg-red"]');
        
        if (buyPrice) buyPrice.textContent = formatPrice(n24kData.giamua);
        if (sellPrice) sellPrice.textContent = formatPrice(n24kData.giaban);
        
        if (changeEl && prevN24k) {
            const percent = ((parseFloat(n24kData.giaban) - parseFloat(prevN24k.giaban)) / parseFloat(prevN24k.giaban) * 100).toFixed(1);
            updateChangeIndicator(changeEl, percent);
        }
    }

    // Card PNJ
    const pnjCard = document.querySelector('.grid.grid-cols-1 > div:nth-child(3)');
    if (pnjCard && pnjData) {
        const buyPrice = pnjCard.querySelector('.space-y-4 .flex:first-child span:last-child');
        const sellPrice = pnjCard.querySelector('.space-y-4 .flex:last-child span:last-child');
        const changeEl = pnjCard.querySelector('[class*="bg-emerald"], [class*="bg-red"]');
        
        if (buyPrice) buyPrice.textContent = formatPrice(pnjData.giamua);
        if (sellPrice) sellPrice.textContent = formatPrice(pnjData.giaban);
        
        if (changeEl && prevPnj) {
            const percent = ((parseFloat(pnjData.giaban) - parseFloat(prevPnj.giaban)) / parseFloat(prevPnj.giaban) * 100).toFixed(1);
            updateChangeIndicator(changeEl, percent);
        }
    }

    // Card tóm tắt thị trường
    updateMarketSummary(items);
}

function updateChangeIndicator(element, percent) {
    if (!element) return;
    const isPositive = parseFloat(percent) >= 0;
    element.className = isPositive 
        ? 'bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1'
        : 'bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1';
    element.innerHTML = `
        <span class="material-symbols-outlined text-sm">${isPositive ? 'trending_up' : 'trending_down'}</span> ${Math.abs(percent)}%
    `;
}

function updateMarketSummary(items) {
    const prices = items.map(item => parseFloat(item.giaban));
    const buyPrices = items.map(item => parseFloat(item.giamua));
    
    const maxPrice = Math.max(...prices);
    const minBuyPrice = Math.min(...buyPrices);
    
    const maxItem = items.find(item => parseFloat(item.giaban) === maxPrice);
    const minItem = items.find(item => parseFloat(item.giamua) === minBuyPrice);
    
    // Tính spread trung bình
    const spreads = items.map(item => parseFloat(item.giaban) - parseFloat(item.giamua));
    const avgSpread = (spreads.reduce((a, b) => a + b, 0) / spreads.length / 1000).toFixed(3);
    
    const summaryCard = document.querySelector('.grid.grid-cols-1 > div:nth-child(4)');
    if (summaryCard) {
        // Cập nhật label với mã sản phẩm
        const labels = summaryCard.querySelectorAll('.space-y-4 .flex span:first-child');
        if (labels[0] && maxItem) labels[0].textContent = `Cao nhất (${maxItem.masp})`;
        if (labels[1] && minItem) labels[1].textContent = `Thấp nhất (${minItem.masp})`;
        
        // Cập nhật giá trị
        const values = summaryCard.querySelectorAll('.space-y-4 .flex span:last-child');
        if (values[0]) values[0].textContent = formatPrice(maxPrice);
        if (values[1]) values[1].textContent = formatPrice(minBuyPrice);
        if (values[2]) values[2].textContent = avgSpread;
    }
}

// ==================== PRICE TABLE ====================

function updatePriceTable(items, prevItems, date) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-8 py-12 text-center text-slate-500">Không có dữ liệu cho ngày này</td></tr>';
        updatePaginationInfo(0);
        return;
    }
    
    items.forEach(item => {
        const prevItem = prevItems.find(p => p.masp === item.masp);
        const spread = calculateSpread(item.giaban, item.giamua);
        const change = prevItem ? calculateChange(item.giaban, prevItem.giaban) : 0;
        
        const [day, month] = date.split('-');
        const timeStr = `20:00 - ${day}/${month}`;
        
        let changeHtml = '<span class="text-slate-500">—</span>';
        if (change !== 0) {
            const isPositive = change > 0;
            changeHtml = `<span class="${isPositive ? 'text-emerald-500' : 'text-red-500'} font-bold">${isPositive ? '+' : ''}${change.toFixed(3)}</span>`;
        }
        
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-800/30 transition-all group';
        row.innerHTML = `
            <td class="px-8 py-6 text-xs text-slate-500">${timeStr}</td>
            <td class="px-8 py-6 text-xs font-mono font-bold text-gold">${item.masp}</td>
            <td class="px-8 py-6 text-sm font-semibold text-white">${item.tensp}</td>
            <td class="px-8 py-6 text-sm text-right font-medium text-slate-400">${formatPrice(item.giamua)}</td>
            <td class="px-8 py-6 text-sm text-right font-black text-gold">${formatPrice(item.giaban)}</td>
            <td class="px-8 py-6 text-sm text-right font-black text-amber-500 bg-amber-500/5">${spread.toFixed(3)}</td>
            <td class="px-8 py-6 text-sm text-right">${changeHtml}</td>
        `;
        tbody.appendChild(row);
    });
    
    updatePaginationInfo(items.length);
}

function updatePaginationInfo(itemCount) {
    const infoEl = document.getElementById('pagination-info');
    if (infoEl) {
        if (itemCount === 0) {
            infoEl.textContent = 'Không có dữ liệu';
        } else {
            infoEl.textContent = `Hiển thị ${itemCount} sản phẩm • Ngày ${formatShortDate(appState.currentDate)}`;
        }
    }
}

// Cập nhật pagination buttons (chuyển ngày)
function updatePaginationButtons() {
    const container = document.getElementById('pagination-buttons');
    if (!container) return;
    
    const { sortedDates, currentDate } = appState;
    const currentIndex = sortedDates.indexOf(currentDate);
    const totalDates = sortedDates.length;
    
    container.innerHTML = '';
    
    if (totalDates === 0) return;
    
    // Nút Previous (ngày mới hơn)
    const prevBtn = document.createElement('button');
    prevBtn.className = `w-10 h-10 flex items-center justify-center rounded-xl border border-slate-800 ${currentIndex === 0 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-500 hover:text-gold hover:border-gold'} transition-colors`;
    prevBtn.innerHTML = '<span class="material-symbols-outlined">chevron_left</span>';
    prevBtn.title = 'Ngày mới hơn';
    if (currentIndex > 0) {
        prevBtn.addEventListener('click', () => changeDate(sortedDates[currentIndex - 1]));
    }
    container.appendChild(prevBtn);
    
    // Hiển thị ngày hiện tại
    const dateLabel = document.createElement('span');
    dateLabel.className = 'px-4 h-10 flex items-center justify-center rounded-xl bg-gold text-black font-black text-xs';
    dateLabel.textContent = formatShortDate(currentDate);
    dateLabel.title = formatDate(currentDate);
    container.appendChild(dateLabel);
    
    // Nút Next (ngày cũ hơn)
    const nextBtn = document.createElement('button');
    nextBtn.className = `w-10 h-10 flex items-center justify-center rounded-xl border border-slate-800 ${currentIndex === totalDates - 1 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-500 hover:text-gold hover:border-gold'} transition-colors`;
    nextBtn.innerHTML = '<span class="material-symbols-outlined">chevron_right</span>';
    nextBtn.title = 'Ngày cũ hơn';
    if (currentIndex < totalDates - 1) {
        nextBtn.addEventListener('click', () => changeDate(sortedDates[currentIndex + 1]));
    }
    container.appendChild(nextBtn);
}

// Đổi ngày và cập nhật UI
function changeDate(newDate) {
    appState.currentDate = newDate;
    
    const items = getDataByDate(appState.allData, newDate);
    const prevItems = getPreviousData(appState.allData, newDate);
    
    // Cập nhật date picker
    const datePicker = document.getElementById('date-picker');
    if (datePicker) {
        datePicker.value = formatDateForInput(newDate);
    }
    
    // Cập nhật tất cả UI
    updateCurrentDate(newDate);
    updateSummaryCards(items, prevItems);
    updatePriceTable(items, prevItems, newDate);
    updateBarChart(items);
    updateSpreadWarning(items);
    updatePaginationButtons();
}

// ==================== DATE PICKER ====================

function setupDatePicker() {
    const datePicker = document.getElementById('date-picker');
    if (!datePicker) return;
    
    const { sortedDates } = appState;
    
    // Set min/max dates
    if (sortedDates.length > 0) {
        datePicker.min = formatDateForInput(sortedDates[sortedDates.length - 1]); // Ngày cũ nhất
        datePicker.max = formatDateForInput(sortedDates[0]); // Ngày mới nhất
        datePicker.value = formatDateForInput(sortedDates[0]); // Mặc định là ngày mới nhất
    }
    
    // Xử lý khi chọn ngày
    datePicker.addEventListener('change', (e) => {
        const selectedDate = parseInputDate(e.target.value);
        
        // Kiểm tra xem ngày có trong dữ liệu không
        if (sortedDates.includes(selectedDate)) {
            changeDate(selectedDate);
        } else {
            // Tìm ngày gần nhất có dữ liệu
            const inputDate = new Date(e.target.value);
            let closestDate = sortedDates[0];
            let minDiff = Infinity;
            
            sortedDates.forEach(dateStr => {
                const [d, m, y] = dateStr.split('-').map(Number);
                const date = new Date(y, m - 1, d);
                const diff = Math.abs(date - inputDate);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestDate = dateStr;
                }
            });
            
            alert(`Không có dữ liệu cho ngày ${formatShortDate(selectedDate)}. Đang hiển thị ngày gần nhất: ${formatShortDate(closestDate)}`);
            changeDate(closestDate);
        }
    });
}

// ==================== SEARCH ====================

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const { allData, currentDate } = appState;
        
        const items = getDataByDate(allData, currentDate);
        const prevItems = getPreviousData(allData, currentDate);
        
        const filtered = items.filter(item => 
            item.masp.toLowerCase().includes(query) || 
            item.tensp.toLowerCase().includes(query)
        );
        
        updatePriceTable(filtered, prevItems, currentDate);
    });
}

// ==================== OTHER UI FUNCTIONS ====================

// Cập nhật biểu đồ cột
function updateBarChart(items) {
    const chartContainer = document.querySelector('.absolute.inset-x-0.bottom-0.h-full.flex');
    if (!chartContainer) return;
    
    // Lấy top 5 sản phẩm có giá cao nhất
    const topItems = [...items]
        .sort((a, b) => parseFloat(b.giaban) - parseFloat(a.giaban))
        .slice(0, 5);
    
    if (topItems.length === 0) return;
    
    const maxPrice = Math.max(...topItems.map(item => parseFloat(item.giaban)));
    
    chartContainer.innerHTML = '';
    
    topItems.forEach(item => {
        const buyPrice = parseFloat(item.giamua);
        const sellPrice = parseFloat(item.giaban);
        const sellHeight = (sellPrice / maxPrice * 70).toFixed(2);
        const buyHeight = (buyPrice / maxPrice * 70).toFixed(2);
        
        const barGroup = document.createElement('div');
        barGroup.className = 'flex flex-col items-center gap-4 group h-full justify-end';
        barGroup.innerHTML = `
            <div class="flex items-end gap-1.5" style="height: ${sellHeight}%">
                <div class="w-10 bg-slate-700/60 rounded-t-md group-hover:bg-slate-600 transition-all relative h-full" style="height: ${(buyHeight / sellHeight * 100).toFixed(0)}%">
                    <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400 whitespace-nowrap">${formatPrice(buyPrice)}</div>
                </div>
                <div class="w-10 bg-gold rounded-t-md shadow-lg shadow-gold/20 transition-all relative h-full">
                    <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-gold whitespace-nowrap">${formatPrice(sellPrice)}</div>
                </div>
            </div>
            <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">${item.masp}</span>
        `;
        chartContainer.appendChild(barGroup);
    });
}

// Cập nhật cảnh báo spread
function updateSpreadWarning(items) {
    if (items.length === 0) return;
    
    const spreads = items.map(item => ({
        masp: item.masp,
        tensp: item.tensp,
        spread: calculateSpread(item.giaban, item.giamua)
    }));
    
    const maxSpread = spreads.reduce((max, curr) => curr.spread > max.spread ? curr : max);
    
    const warningText = document.querySelector('.bg-amber-900\\/10 p');
    if (warningText) {
        warningText.innerHTML = `
            Chênh lệch (Spread) giữa giá mua và bán của mã <b class="text-white">${maxSpread.masp}</b> đang ở mức <b class="text-amber-500">${maxSpread.spread.toFixed(3)} Tr/Lượng</b>. Hãy cẩn trọng khi giao dịch lướt sóng ngắn hạn.
        `;
    }
}

// ==================== EXPORT ====================

function setupExport() {
    const exportBtn = document.getElementById('btn-export');
    if (!exportBtn) return;
    
    exportBtn.addEventListener('click', () => {
        window.print();
    });
}

// ==================== INITIALIZE ====================

async function initDashboard() {
    const data = await loadGoldData();
    if (data.length === 0) {
        console.error('Không có dữ liệu');
        const infoEl = document.getElementById('pagination-info');
        if (infoEl) infoEl.textContent = 'Lỗi: Không thể tải dữ liệu';
        return;
    }
    
    // Initialize state
    appState.allData = data;
    appState.sortedDates = getSortedDates(data);
    appState.currentDate = appState.sortedDates[0]; // Ngày mới nhất
    
    const items = getDataByDate(data, appState.currentDate);
    const prevItems = getPreviousData(data, appState.currentDate);
    
    // Update all UI
    updateCurrentDate(appState.currentDate);
    updateSummaryCards(items, prevItems);
    updatePriceTable(items, prevItems, appState.currentDate);
    updateBarChart(items);
    updateSpreadWarning(items);
    updatePaginationButtons();
    
    // Setup interactions
    setupDatePicker();
    setupSearch();
    setupExport();
    
    console.log('Dashboard initialized');
    console.log('Ngày mới nhất:', appState.currentDate);
    console.log('Tổng số ngày:', appState.sortedDates.length);
    console.log('Số sản phẩm:', items.length);
}

// Chạy khi trang load xong
document.addEventListener('DOMContentLoaded', initDashboard);