if (typeof CONFIG === 'undefined') alert("Error: config.js not found!");

firebase.initializeApp(CONFIG.FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();

// Variables
let map;
let markers = {};
let tempMarker = null;
let currentUserRole = null;
let donorLoc = { lat: null, lng: null };
let benLoc = { lat: null, lng: null };
let cart = []; 
let donationListener = null;

// Icons
const greenIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
const redDragIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
const blueBenIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });

// --- UI HELPERS ---
window.toggleProfileMenu = function() {
    const dropdown = document.getElementById('profile-dropdown');
    dropdown.classList.toggle('show');
}

window.onclick = function(event) {
    if (!event.target.closest('.profile-wrapper')) {
        const dropdown = document.getElementById('profile-dropdown');
        if (dropdown && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    }
}

// --- 1. NAVIGATION & ROLE ---
window.selectRole = function(role) {
    currentUserRole = role;
    document.getElementById('landing-page').style.display = 'none';
    
    const listContainer = document.getElementById('listings-container');
    const listTitle = document.getElementById('list-title');
    const listSubtitle = document.getElementById('list-subtitle');
    const cartBtn = document.getElementById('cart-btn');
    const ordersBtn = document.getElementById('orders-btn');
    const pickupsBtn = document.getElementById('pickups-btn');

    if (role === 'beneficiary') {
        document.getElementById('donor-section').style.display = 'none';
        document.getElementById('beneficiary-section').style.display = 'block';
        cartBtn.style.display = 'inline-block';
        ordersBtn.style.display = 'inline-block';
        pickupsBtn.style.display = 'none';
        listContainer.style.display = 'none'; 
        listTitle.innerText = "Recent Donations";
        listSubtitle.style.display = 'block';
        listSubtitle.innerText = "Set your location to see available food items below.";
    } else {
        document.getElementById('donor-section').style.display = 'block';
        document.getElementById('beneficiary-section').style.display = 'none';
        cartBtn.style.display = 'none';
        ordersBtn.style.display = 'none';
        pickupsBtn.style.display = 'inline-block';
        listContainer.style.display = 'block';
        listTitle.innerText = "My Donations"; 
        listSubtitle.style.display = 'block';
        listSubtitle.innerText = "Manage your active listings below.";
    }
    
    fetchDonations(); 
    setTimeout(() => map.invalidateSize(), 600);
}

window.goHome = function() {
    document.getElementById('main-container').style.display = 'flex';
    document.getElementById('listings-container').style.display = 'block';
    document.getElementById('cart-page').style.display = 'none';
    document.getElementById('pickups-page').style.display = 'none';
    document.getElementById('orders-page').style.display = 'none';
    document.getElementById('history-page').style.display = 'none'; // Ensure history hides
    setTimeout(() => map.invalidateSize(), 200);
}

window.logout = function() {
    auth.signOut().then(() => location.reload());
}

// --- 2. MAP & SEARCH ---
function initMap() {
    map = L.map('map').setView([28.675, 77.502], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '© OpenStreetMap' }).addTo(map);

    map.on('click', function(e) {
        if(currentUserRole === 'donor') placeDraggableMarker(e.latlng.lat, e.latlng.lng, 'donor');
        if(currentUserRole === 'beneficiary') placeDraggableMarker(e.latlng.lat, e.latlng.lng, 'beneficiary');
    });
    fetchDonations();
}

window.findLocation = function(role) {
    const btn = event.target;
    let addr, city, pin;

    if (role === 'donor') {
        addr = document.getElementById('donorAddr').value;
        city = document.getElementById('donorCity').value;
        pin = document.getElementById('donorPincode').value;
    } else {
        addr = document.getElementById('benAddr').value;
        city = document.getElementById('benCity').value;
        pin = document.getElementById('benPincode').value;
    }

    if(!city || !pin) return alert("Please enter at least City and Pincode.");

    btn.innerText = "⏳ Searching...";
    btn.disabled = true;

    const exactQuery = `${addr}, ${city}, ${pin}`;
    const fallbackQuery = `${city}, ${pin}`;

    searchOSM(exactQuery).then(coords => {
        if(coords) {
            handleSuccess(coords.lat, coords.lon, role, btn);
        } else {
            searchOSM(fallbackQuery).then(fallbackCoords => {
                if(fallbackCoords) {
                    handleSuccess(fallbackCoords.lat, fallbackCoords.lon, role, btn);
                    alert("Exact address not found on map, but we located your Area! \n\nPlease DRAG the marker to your exact spot.");
                } else {
                    btn.innerText = role === 'donor' ? "🔎 Locate Me" : "📍 Set My Location";
                    btn.disabled = false;
                    alert("Location not found. Please check the Pincode and City spelling.");
                }
            });
        }
    });
}

function searchOSM(query) {
    return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
        .then(r => r.json())
        .then(data => {
            if(data && data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
            return null;
        })
        .catch(e => { console.error(e); return null; });
}

function handleSuccess(lat, lon, role, btn) {
    map.setView([lat, lon], 15);
    placeDraggableMarker(lat, lon, role);
    btn.innerText = role === 'donor' ? "🔎 Locate Me" : "📍 Set My Location";
    btn.disabled = false;
    if(role === 'beneficiary') {
        document.getElementById('listings-container').style.display = 'block';
        document.getElementById('listings-container').scrollIntoView({ behavior: 'smooth' });
    }
}

function placeDraggableMarker(lat, lng, role) {
    if(tempMarker) map.removeLayer(tempMarker);
    const icon = role === 'donor' ? redDragIcon : blueBenIcon;
    const msg = role === 'donor' ? "📍 Drag to pickup spot" : "📍 You are here";
    
    tempMarker = L.marker([lat, lng], { draggable: true, icon: icon }).addTo(map).bindPopup(msg).openPopup();
    
    if(role === 'donor') { donorLoc = {lat, lng}; } else { benLoc = {lat, lng}; }
    tempMarker.on('dragend', e => { 
        const pos = e.target.getLatLng();
        if(role === 'donor') donorLoc = pos; else benLoc = pos;
    });
}

// --- 3. CART & CHECKOUT ---
window.addToCart = function(id, food, place, maxQty) {
    if(!benLoc.lat) return alert("Please set your location first.");
    if(cart.find(item => item.id === id)) return alert("Item already in cart!");

    cart.push({ id, food, place, maxQty, selectedQty: 1 });
    document.getElementById('cart-count').innerText = cart.length;
    alert("✅ Added to Cart! Go to 'Cart' to checkout.");
}

window.openCart = function() {
    document.getElementById('main-container').style.display = 'none';
    document.getElementById('listings-container').style.display = 'none';
    document.getElementById('cart-page').style.display = 'block';
    renderCart();
}

function renderCart() {
    const list = document.getElementById('cart-items-list');
    list.innerHTML = "";
    if(cart.length === 0) { list.innerHTML = "<p>Cart is empty.</p>"; return; }

    cart.forEach((item, index) => {
        const div = document.createElement('div');
        div.style.cssText = "background:#2d2d2d; padding:15px; margin-bottom:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;";
        div.innerHTML = `
            <div><strong>${item.food}</strong><br><small>${item.place}</small></div>
            <div style="display:flex; gap:10px; align-items:center;">
                <input type="number" value="${item.selectedQty}" min="1" max="${item.maxQty}" 
                    onchange="updateCartQty(${index}, this.value)" style="width:60px; margin:0;">
                <button onclick="removeFromCart(${index})" style="background:#ff5252; color:white; padding:5px 10px;">✕</button>
            </div>`;
        list.appendChild(div);
    });
}

window.updateCartQty = function(index, val) {
    if(val > cart[index].maxQty) { alert("Max quantity exceeded!"); return renderCart(); }
    cart[index].selectedQty = parseInt(val);
}

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    document.getElementById('cart-count').innerText = cart.length;
    renderCart();
}

document.getElementById('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if(cart.length === 0) return alert("Cart is empty!");
    if(!auth.currentUser) return alert("Login required!");
    
    const name = document.getElementById('claimerName').value;
    const phone = document.getElementById('claimerPhone').value;
    
    if(confirm(`Place order for ${cart.length} items?`)) {
        try {
            for(const item of cart) {
                const docRef = db.collection('donations').doc(item.id);
                const doc = await docRef.get();
                if(doc.exists) {
                    const dData = doc.data();
                    const currentQty = dData.quantity;
                    const newQty = currentQty - item.selectedQty;
                    if(newQty < 0) throw new Error(`Not enough ${item.food} left.`);
                    
                    const updateData = newQty === 0 ? { status: 'claimed', quantity: 0 } : { quantity: newQty };
                    await docRef.update(updateData);

                    await db.collection('pickups').add({
                        donorId: dData.donorId,
                        beneficiaryId: auth.currentUser.uid,
                        food: item.food,
                        place: item.place,
                        qty: item.selectedQty,
                        beneficiary: name,
                        phone: phone,
                        location: dData.location,
                        lat: dData.lat,
                        lng: dData.lng,
                        benLat: benLoc.lat,
                        benLng: benLoc.lng,
                        status: 'pending',
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
            alert("🎉 Order Placed!");
            cart = [];
            document.getElementById('cart-count').innerText = 0;
            goHome();
        } catch(err) { alert("Error: " + err.message); }
    }
});

// --- 4. PICKUPS, ORDERS & HISTORY ---

window.openPickups = function() {
    if(!auth.currentUser) return alert("Login required");
    document.getElementById('main-container').style.display = 'none';
    document.getElementById('listings-container').style.display = 'none';
    document.getElementById('pickups-page').style.display = 'block';
    
    const list = document.getElementById('pickups-list');
    list.innerHTML = "<li>Loading...</li>";
    
    db.collection('pickups')
      .where('donorId', '==', auth.currentUser.uid)
      .where('status', '==', 'pending')
      .get()
      .then(snap => {
          list.innerHTML = "";
          if(snap.empty) { list.innerHTML = "<li>No active pickups.</li>"; return; }
          
          snap.forEach(doc => {
              const data = doc.data();
              const pickupId = doc.id;
              const benMapUrl = `https://www.google.com/maps/search/?api=1&query=${data.benLat},${data.benLng}`;
              
              list.innerHTML += `<li style="background:#2d2d2d; padding:15px; margin-bottom:10px; border-radius:8px; border-left:5px solid #00e676;">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <strong>${data.food}</strong> (${data.qty} servings)<br>
                        <div style="margin-top:5px; color:#ddd;">👤 <b>${data.beneficiary}</b><br>📞 ${data.phone}</div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <a href="${benMapUrl}" target="_blank" style="background:#333; color:white; padding:5px 10px; border-radius:4px; text-decoration:none; font-size:0.8rem; text-align:center;">📍 Ben. Loc</a>
                        <button onclick="completePickup('${pickupId}')" style="background:#00e676; color:black; border:none; padding:8px 12px; border-radius:5px; font-weight:bold; cursor:pointer;">✅ Complete</button>
                    </div>
                  </div>
              </li>`;
          });
      });
}

window.completePickup = function(id) {
    if(confirm("Mark this pickup as done? It will move to History for both you and the beneficiary.")) {
        db.collection('pickups').doc(id).update({ status: 'completed' })
          .then(() => { alert("Pickup completed!"); openPickups(); });
    }
}

window.openOrders = function() {
    if(!auth.currentUser) return alert("Login required");
    document.getElementById('main-container').style.display = 'none';
    document.getElementById('listings-container').style.display = 'none';
    document.getElementById('orders-page').style.display = 'block';
    
    const list = document.getElementById('orders-list');
    list.innerHTML = "<li>Loading...</li>";
    
    // Beneficiary strictly sees 'pending' items
    db.collection('pickups')
      .where('beneficiaryId', '==', auth.currentUser.uid)
      .where('status', '==', 'pending')
      .get()
      .then(snap => {
          list.innerHTML = "";
          if(snap.empty) { list.innerHTML = "<li>No pending orders. Check History for past pickups.</li>"; return; }
          
          snap.forEach(doc => {
              const data = doc.data();
              const mapUrl = `https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lng}`;
              
              list.innerHTML += `<li style="background:#2d2d2d; padding:15px; margin-bottom:10px; border-radius:8px; border-left:5px solid #2196F3;">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <strong style="color:white;">${data.food}</strong> from <b>${data.place || 'Donor'}</b><br>
                        <div style="color:#aaa; font-size:0.85rem; margin-top:5px;">📍 ${data.location}</div>
                    </div>
                    <a href="${mapUrl}" target="_blank" style="background:#4285F4; color:white; padding:8px 12px; border-radius:5px; text-decoration:none; font-size:0.8rem; font-weight:bold;">🗺️ Navigate</a>
                  </div>
              </li>`;
          });
      });
}

// --- NEW: SHARED HISTORY PAGE ---
window.openHistory = function() {
    if(!auth.currentUser) return alert("Login required");
    document.getElementById('main-container').style.display = 'none';
    document.getElementById('listings-container').style.display = 'none';
    document.getElementById('pickups-page').style.display = 'none';
    document.getElementById('orders-page').style.display = 'none';
    
    const historyPage = document.getElementById('history-page');
    if(historyPage) historyPage.style.display = 'block';
    
    const list = document.getElementById('history-list');
    list.innerHTML = "<li>Loading History...</li>";
    
    const roleField = currentUserRole === 'donor' ? 'donorId' : 'beneficiaryId';
    
    db.collection('pickups')
      .where(roleField, '==', auth.currentUser.uid)
      .where('status', '==', 'completed')
      .get()
      .then(snap => {
          list.innerHTML = "";
          if(snap.empty) { list.innerHTML = "<li>No completed history yet.</li>"; return; }
          
          snap.forEach(doc => {
              const data = doc.data();
              const date = data.timestamp ? data.timestamp.toDate().toLocaleDateString() : "N/A";
              list.innerHTML += `<li style="background:#1a1a1a; padding:15px; margin-bottom:10px; border-radius:8px; opacity: 0.8; border-left:5px solid #aaa;">
                  <strong style="color:#aaa;">${data.food}</strong> (${data.qty} qty)<br>
                  <div style="font-size:0.8rem; color:#666;">Date: ${date} | Status: Completed</div>
              </li>`;
          });
      });
}

// --- 5. DONOR INVENTORY ---
window.manageDonation = function(id, currentQty) {
    const input = prompt(`Manage Donation:\n- Enter '0' to DELETE listing.\n- Enter new quantity to UPDATE.\nCurrent: ${currentQty}`);
    if(input === null) return;
    const newQty = parseInt(input);
    if(isNaN(newQty) || newQty < 0) return alert("Invalid number");

    if(newQty === 0) {
        if(confirm("Delete this listing permanently?")) db.collection("donations").doc(id).delete();
    } else {
        db.collection("donations").doc(id).update({ quantity: newQty });
    }
}

// --- 6. CORE FUNCTIONS ---
document.getElementById('donation-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if(!auth.currentUser || !donorLoc.lat) return alert("Login & Location required.");
    const fullAddr = `${document.getElementById('donorAddr').value}, ${document.getElementById('donorCity').value} - ${document.getElementById('donorPincode').value}`;
    
    db.collection("donations").add({
        placeName: document.getElementById('placeName').value,
        food: document.getElementById('foodItem').value,
        type: document.getElementById('foodType').value,
        quantity: parseInt(document.getElementById('quantity').value),
        location: fullAddr,
        donor: auth.currentUser.displayName,
        donorId: auth.currentUser.uid,
        status: "available",
        lat: donorLoc.lat, lng: donorLoc.lng,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => { alert("Donation Posted!"); document.getElementById('donation-form').reset(); });
});

function fetchDonations() {
    if (donationListener) donationListener();
    
    donationListener = db.collection("donations").orderBy("timestamp", "desc").onSnapshot(snap => {
        const list = document.getElementById("listings-list");
        if(list) list.innerHTML = "";
        Object.values(markers).forEach(m => map.removeLayer(m)); markers = {};

        snap.forEach(doc => {
            const data = doc.data();
            if(data.timestamp && (new Date() - data.timestamp.toDate()) / 36e5 >= 6) {
                db.collection("donations").doc(doc.id).delete(); return;
            }
            if(data.status !== 'available') return;
            if(currentUserRole === 'donor' && data.donorId !== auth.currentUser?.uid) return; 

            const placeName = data.placeName || "Donor";
            const marker = L.marker([data.lat, data.lng], { icon: greenIcon }).addTo(map);
            marker.bindPopup(`<b>${placeName}</b><br>${data.food}<br>${data.quantity} Servings`);
            markers[doc.id] = marker;

            if(list) {
                const li = document.createElement("li");
                const borderColor = data.type === "Veg" ? "#00e676" : "#ff5252";
                li.style.borderLeft = `5px solid ${borderColor}`;
                
                let actionHtml = currentUserRole === 'beneficiary' ? 
                    `<button onclick="addToCart('${doc.id}', '${data.food}', '${placeName}', ${data.quantity})" style="width:100%; margin-top:15px; background:#333; color:white; border:1px solid #555; padding:10px; border-radius:5px; cursor:pointer; font-weight:600;">Add to Cart 🛒</button>` :
                    `<button onclick="manageDonation('${doc.id}', ${data.quantity})" style="width:100%; margin-top:15px; background:#FF9800; color:black; border:none; padding:10px; border-radius:5px; cursor:pointer; font-weight:bold;">⚙️ Manage</button>`;

                li.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; width:100%;">
                        <div>
                            <div style="font-size:1.2rem; font-weight:bold; color:#fff; margin-bottom:5px;">${placeName}</div>
                            <div style="font-size:1rem; color:#00e676; margin-bottom:5px;">${data.food}</div>
                            <div style="font-size:0.85rem; color:#aaa;">📍 ${data.location}</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:1.5rem; font-weight:bold; color:#fff;">${data.quantity}</div>
                            <div style="font-size:0.8rem; color:#aaa;">Servings</div>
                        </div>
                    </div>
                    ${actionHtml}
                `;
                list.appendChild(li);
            }
        });
    });
}

auth.onAuthStateChanged(u => {
    document.getElementById('login-btn').style.display = u ? 'none' : 'block';
    document.getElementById('user-profile').style.display = u ? 'flex' : 'none';
    if(u) {
        document.getElementById('user-name').innerText = (u.displayName || "User").split(" ")[0];
        document.getElementById('user-img').src = u.photoURL;
    }
});

initMap();
window.googleLogin = function() { auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); }