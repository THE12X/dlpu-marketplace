const MASTER_ADMIN_KEY = "mrxff129";
let isAdmin = false;
let activeDetailItemId = null;
let pendingPinAction = null;
let items = [];
let activeCategory = 'All';
let savedItemIds = JSON.parse(localStorage.getItem('dlpu_saved_items')) || [];

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').innerText = msg;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    document.body.style.overflow = '';
    if (modalId === 'detailModal') activeDetailItemId = null;
}

function toggleTheme() {
    const html = document.documentElement;
    const icon = document.getElementById('themeIcon');
    
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        if (icon) icon.className = "fa-solid fa-moon text-base";
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if (icon) icon.className = "fa-solid fa-sun text-base";
    }
}

function scrollToMarket() {
    const market = document.getElementById('marketplace');
    if (market) market.scrollIntoView({ behavior: 'smooth' });
}

function updateFavBadge() {
    const badge = document.getElementById('favBadge');
    if (!badge) return;
    if (savedItemIds.length > 0) {
        badge.innerText = savedItemIds.length;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function toggleFavorite(id, event) {
    if (event) event.stopPropagation();
    if (savedItemIds.includes(id)) {
        savedItemIds = savedItemIds.filter(itemId => itemId !== id);
        showToast('Removed from saved items');
    } else {
        savedItemIds.push(id);
        showToast('Item saved to favorites!');
    }
    localStorage.setItem('dlpu_saved_items', JSON.stringify(savedItemIds));
    updateFavBadge();
    filterItems();
}

function toggleSavedFilter() {
    scrollToMarket();
    filterCategory('Saved');
}

function filterCategory(category) {
    activeCategory = category;
    
    document.querySelectorAll('.cat-btn').forEach(btn => {
        if (btn.innerText.includes(category) || (category === 'All' && btn.innerText.includes('All'))) {
            btn.className = "cat-btn bg-lime-400 text-slate-950 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap shadow-xs flex-shrink-0 transition-colors";
        } else {
            btn.className = "cat-btn bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-800 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-colors";
        }
    });

    filterItems();
}

function clearSearch() {
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
    const btn = document.getElementById('clearSearchBtn');
    if (btn) btn.classList.add('hidden');
    filterItems();
}

function filterItems() {
    const queryInput = document.getElementById('searchInput');
    const query = queryInput ? queryInput.value.toLowerCase() : '';
    const clearBtn = document.getElementById('clearSearchBtn');
    
    if (clearBtn) {
        if (query.length > 0) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
    }

    const filtered = items.filter(item => {
        let matchesCategory = true;
        if (activeCategory === 'Saved') {
            matchesCategory = savedItemIds.includes(item.id);
        } else if (activeCategory === 'Under50') {
            matchesCategory = item.price <= 50;
        } else if (activeCategory !== 'All') {
            matchesCategory = item.category === activeCategory;
        }

        const matchesQuery = (item.title && item.title.toLowerCase().includes(query)) || 
                             (item.desc && item.desc.toLowerCase().includes(query)) || 
                             (item.location && item.location.toLowerCase().includes(query));
        return matchesCategory && matchesQuery;
    });

    renderItems(filtered);
}

function renderItems(itemsToRender) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (itemsToRender.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fa-solid fa-box-open text-4xl text-gray-300 dark:text-slate-700 mb-3"></i>
                <p class="text-gray-500 dark:text-gray-400 text-sm">No items found matching your criteria.</p>
            </div>
        `;
        return;
    }

    itemsToRender.forEach(item => {
        const isFav = savedItemIds.includes(item.id);
        const isSold = item.status === 'sold';
        
        const card = document.createElement('div');
        card.className = `bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group cursor-pointer relative ${isSold ? 'opacity-75' : ''}`;
        card.onclick = () => openItemDetail(item.id);

        card.innerHTML = `
            <div class="relative h-36 sm:h-48 bg-gray-100 dark:bg-slate-950 overflow-hidden">
                <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300 ${isSold ? 'grayscale' : ''}">
                
                ${isSold ? `
                    <div class="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
                        <span class="bg-red-600 text-white font-black text-xs sm:text-sm px-3 py-1 rounded-xl rotate-[-8deg] shadow-lg border border-white">SOLD</span>
                    </div>
                ` : ''}

                <span class="absolute top-2 left-2 sm:top-3 sm:left-3 bg-slate-950/90 text-lime-400 text-[10px] font-extrabold px-2.5 py-1 rounded-md shadow-xs z-10">${item.category}</span>
                
                <div class="absolute top-2 right-2 sm:top-3 sm:right-3 flex space-x-1.5 z-10">
                    ${isAdmin ? `
                        <button onclick="event.stopPropagation(); triggerDeleteWithPin(${item.id})" title="Delete listing" class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition shadow-md">
                            <i class="fa-solid fa-trash text-xs"></i>
                        </button>
                    ` : ''}
                    <button onclick="toggleFavorite(${item.id}, event)" class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-950/60 backdrop-blur-md flex items-center justify-center text-white hover:scale-110 transition">
                        <i class="${isFav ? 'fa-solid text-red-500' : 'fa-regular'} fa-heart text-xs sm:text-sm"></i>
                    </button>
                </div>
            </div>
            <div class="p-3 sm:p-4 flex flex-col flex-grow justify-between">
                <div>
                    <div class="flex items-center justify-between mb-0.5 sm:mb-1">
                        <span class="text-base sm:text-lg font-black ${isSold ? 'text-gray-400 line-through' : 'text-lime-600 dark:text-lime-400'}">¥${item.price}</span>
                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400">${item.condition || 'Good'}</span>
                    </div>
                    <h4 class="font-bold text-gray-900 dark:text-white text-xs sm:text-sm line-clamp-2 mb-1 leading-tight">${item.title}</h4>
                </div>
                <div class="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-slate-800/80">
                    <p class="text-[10px] text-gray-500 dark:text-gray-400 flex items-center">
                        <i class="fa-solid fa-location-dot mr-1 text-red-500"></i> ${item.location}
                    </p>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openItemDetail(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;

    activeDetailItemId = id;
    const isSold = item.status === 'sold';

    document.getElementById('modalImg').src = item.image;
    document.getElementById('modalCategory').innerText = item.category;
    document.getElementById('modalCondition').innerText = item.condition || 'Good';
    document.getElementById('modalTitle').innerText = item.title;
    document.getElementById('modalPrice').innerText = `¥${item.price}`;
    document.getElementById('modalLocationText').innerText = item.location;
    document.getElementById('modalDesc').innerText = item.desc || 'No description provided.';
    
    document.getElementById('modalWeChat').innerText = item.wechat || 'No ID provided (Use QR)';
    
    const modalSoldOverlay = document.getElementById('modalSoldOverlay');
    const toggleSoldBtn = document.getElementById('toggleSoldBtn');
    const contactBox = document.getElementById('modalContactBox');

    if (isSold) {
        modalSoldOverlay.classList.remove('hidden');
        toggleSoldBtn.innerText = "Mark as Available";
        toggleSoldBtn.className = "bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold px-3 py-2 rounded-xl transition";
        contactBox.classList.add('opacity-50', 'pointer-events-none');
    } else {
        modalSoldOverlay.classList.add('hidden');
        toggleSoldBtn.innerText = "Mark as Sold";
        toggleSoldBtn.className = "bg-slate-900 dark:bg-slate-950 text-white hover:bg-slate-800 text-xs font-bold px-3 py-2 rounded-xl transition";
        contactBox.classList.remove('opacity-50', 'pointer-events-none');
    }

    const qrContainer = document.getElementById('qrContainer');
    if (item.wechat_qr && item.wechat_qr.trim() !== '') {
        document.getElementById('modalQrImg').src = item.wechat_qr;
        qrContainer.classList.remove('hidden');
    } else {
        qrContainer.classList.add('hidden');
    }

    openModal('detailModal');
}

function toggleAdminMode() {
    if (!isAdmin) {
        const inputKey = prompt("Enter Master Admin Key:");
        if (inputKey !== MASTER_ADMIN_KEY) {
            showToast("Invalid Admin Key!");
            return;
        }
    }
    
    isAdmin = !isAdmin;
    const btn = document.getElementById('adminToggleBtn');
    const banner = document.getElementById('adminBanner');

    if (isAdmin) {
        btn.className = "w-10 h-10 rounded-2xl flex items-center justify-center bg-red-600 text-white transition shadow-xs";
        banner.classList.remove('hidden');
        showToast('Admin Mode Enabled! PIN checks bypassed.');
    } else {
        btn.className = "w-10 h-10 rounded-2xl flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition shadow-xs";
        banner.classList.add('hidden');
        showToast('Admin Mode Disabled');
    }
    filterItems();
}

function requestPinVerification(action, itemId) {
    if (isAdmin) {
        executeAction(action, itemId);
        return;
    }

    pendingPinAction = { action, itemId };
    document.getElementById('pinInput').value = '';
    openModal('pinModal');
}

function verifyAndExecutePin() {
    if (!pendingPinAction) return;

    const inputPin = document.getElementById('pinInput').value.trim();
    const targetItem = items.find(i => i.id === pendingPinAction.itemId);

    if (!targetItem) {
        showToast('Item not found');
        closeModal('pinModal');
        return;
    }

    if (inputPin === targetItem.pin) {
        executeAction(pendingPinAction.action, pendingPinAction.itemId);
        closeModal('pinModal');
        pendingPinAction = null;
    } else {
        showToast('Incorrect PIN! Please try again.');
        document.getElementById('pinInput').value = '';
    }
}

function triggerDeleteWithPin(id) {
    const targetId = id || activeDetailItemId;
    if (targetId) requestPinVerification('delete', targetId);
}

function triggerSoldStatusWithPin(id) {
    const targetId = id || activeDetailItemId;
    if (targetId) requestPinVerification('toggleSold', targetId);
}

function copyWeChatID() {
    const wechatId = document.getElementById('modalWeChat').innerText;
    if (!wechatId || wechatId.includes('No ID provided')) {
        showToast('No WeChat ID available');
        return;
    }
    navigator.clipboard.writeText(wechatId);
    showToast(`Copied "${wechatId}" to clipboard!`);
}

function openWeChatApp() {
    const wechatId = document.getElementById('modalWeChat').innerText;
    if (wechatId && !wechatId.includes('No ID provided')) {
        navigator.clipboard.writeText(wechatId);
        showToast(`Copied ID! Opening WeChat...`);
    } else {
        showToast(`Scan QR Code in WeChat!`);
    }

    setTimeout(() => {
        window.location.href = "weixin://";
    }, 500);
}

// SUPABASE BACKEND INTEGRATION
const SUPABASE_URL = "https://wwmaimwwthgnrenphvzh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Zt-gkMUe4-VXXX7Kk9bQGw_BIQ0--Wg";
let supabaseClient = null;

try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (e) {
    console.warn("Supabase CDN initialization bypassed:", e);
}

async function fetchItems() {
    if (!supabaseClient) {
        filterItems();
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('items')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            items = data;
        }
    } catch (err) {
        console.warn("Fetch exception:", err);
    }
    filterItems();
}

async function executeAction(action, itemId) {
    if (action === 'delete') {
        if (supabaseClient) {
            const { error } = await supabaseClient.from('items').delete().eq('id', itemId);
            if (error) {
                showToast('Failed to delete item from database');
                return;
            }
        }
        items = items.filter(i => i.id !== itemId);
        closeModal('detailModal');
        showToast('Listing deleted successfully!');
        await fetchItems();
    } else if (action === 'toggleSold') {
        const targetItem = items.find(i => i.id === itemId);
        if (!targetItem) return;

        const newStatus = targetItem.status === 'sold' ? 'available' : 'sold';

        if (supabaseClient) {
            const { error } = await supabaseClient.from('items').update({ status: newStatus }).eq('id', itemId);
            if (error) {
                showToast('Failed to update status');
                return;
            }
        }
        targetItem.status = newStatus;
        showToast(newStatus === 'sold' ? 'Item marked as SOLD' : 'Item marked as Available');
        await fetchItems();
        if (activeDetailItemId === itemId) {
            openItemDetail(itemId);
        }
    }
}

async function handlePostItem(event) {
    event.preventDefault();

    const pin = document.getElementById('postPin').value.trim();
    const wechat = document.getElementById('postWeChat').value.trim();
    const imgFileInput = document.getElementById('postImgFile');
    const qrFileInput = document.getElementById('postWeChatQrFile');

    if (pin.length !== 4 || isNaN(pin)) {
        showToast('Please enter a valid 4-digit numeric PIN!');
        return;
    }

    if (!imgFileInput.files || !imgFileInput.files[0]) {
        showToast('Please select a photo of your item to upload!');
        return;
    }

    const readFileAsDataURL = (file) => new Promise((resolve) => {
        if (!file) return resolve('');
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });

    const [imgDataUrl, qrDataUrl] = await Promise.all([
        readFileAsDataURL(imgFileInput.files[0]),
        readFileAsDataURL(qrFileInput.files && qrFileInput.files[0])
    ]);

    if (!wechat && !qrDataUrl) {
        showToast('Provide either a WeChat ID or a QR Code photo!');
        return;
    }

    const newItem = {
        title: document.getElementById('postTitle').value,
        price: parseFloat(document.getElementById('postPrice').value),
        category: document.getElementById('postCategory').value,
        condition: document.getElementById('postCondition').value,
        location: document.getElementById('postLocation').value,
        pin: pin,
        desc: document.getElementById('postDesc').value,
        wechat: wechat,
        wechat_qr: qrDataUrl,
        image: imgDataUrl,
        status: "available"
    };

    if (supabaseClient) {
        const { error } = await supabaseClient.from('items').insert([newItem]);
        if (error) {
            showToast('Error saving to live database');
            return;
        }
    } else {
        newItem.id = Date.now();
        items.unshift(newItem);
    }

    closeModal('postModal');
    document.getElementById('postForm').reset();
    showToast('Listing published successfully!');
    await fetchItems();
    scrollToMarket();
}

// INITIAL PAGE RUN
(function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
        const icon = document.getElementById('themeIcon');
        if (icon) icon.className = "fa-solid fa-moon text-base";
    } else {
        document.documentElement.classList.add('dark');
        const icon = document.getElementById('themeIcon');
        if (icon) icon.className = "fa-solid fa-sun text-base";
    }
})();

updateFavBadge();
fetchItems();