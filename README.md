# 🥗 FoodConnect
### Share Food, Share Love.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Hackathon_Prototype-orange.svg)
![Tech](https://img.shields.io/badge/built%20with-Vite%20%7C%20Firebase%20%7C%20Leaflet-green)

> **"Bridging the gap between surplus food and hunger, one meal at a time."**

---

## 💡 Inspiration & Problem Statement
Roughly one-third of the food produced in the world for human consumption every year gets lost or wasted. Meanwhile, millions of people struggle to find their next meal.

**FoodConnect** is a hyperlocal, real-time platform connecting individuals and restaurants with surplus food to people in need. We eliminate the logistical friction of food donation through an intuitive map-based interface.

---

## 🚀 Key Features

### 🗺️ For Donors (The Hunger Heroes)
* **Easy Posting:** List food items, quantity, and type (Veg/Non-Veg) in seconds.
* **Pinpoint Location:** Use "Locate Me" to auto-detect location or drag the map marker to set precise pickup spots.
* **Inventory Management:** Track active donations, view scheduled pickups, and view history.

### 🍽️ For Beneficiaries
* **Live Map View:** See available food nearby in real-time with color-coded markers.
* **One-Click Claiming:** Add items to a cart and secure your meal instantly.
* **Navigation:** Integrated routing to guide you directly to the donor's location.

### 🔐 Core Tech Features
* **Secure Auth:** Google Sign-In via Firebase Authentication.
* **Real-time Database:** Instant updates using Cloud Firestore.
* **Interactive Maps:** Powered by Leaflet.js & OpenStreetMap (No paid Map APIs required).
* **Dark Mode UI:** A sleek, neon-themed interface for modern accessibility.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, JavaScript (ES6 Modules)
* **Build Tool:** Vite
* **Backend / BaaS:** Firebase (Auth, Firestore) 
* **Maps API:** Leaflet.js, OpenStreetMap, Leaflet Routing Machine

---

## 📸 Screenshots



---

## 💻 Local Setup & Installation

Follow these steps to get the project running on your local machine.

### 1. Clone the Repository
```
https://github.com/ANSH5252/FoodConnect.git
cd foodconnect
```
### 2. Install Dependencies
```
npm install
```

### 3. Configure Environment Variables
* This project uses **Firebase**. You need to create a project in the **Firebase Console**.

* Create a file named .env in the root directory.

* Copy the contents of .env.example into .env.

* Replace the placeholder values with your actual Firebase config keys:

```
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
**Note:** Ensure you enable Firestore Database and Authentication (Google Provider) in your Firebase Console.

### 4. Run the Development Server
```
npm run dev
```
Open the local link provided (usually http://localhost:5173) in your browser.

---

## 📂 Project Structure

```
foodconnect/
├── src/
│   ├── main.js          # Core application logic & Firebase init
│   └── style.css        # Global styles & responsive design
├── .env                 # Keep your API Keys here
├── .env.example         # Template for environment variables
├── index.html           # Main entry point & layout
├── package.json         # Dependencies & scripts
├── vite.config.js       # Vite configuration
├── License              # MIT LICENSE
└── README.md            # Project Documentation
```
---
## 🔮 Future Improvements
* Push Notifications: Alert beneficiaries when food is posted nearby.

* Volunteer Delivery: A third role for volunteers to transport food from donor to beneficiary.

* AI Expiry Detection: Using image recognition to estimate food freshness.

## 🤝 Contributing
Contributions are welcome!

* Fork the Project

* Create your Feature Branch (git checkout -b feature/AmazingFeature)

* Commit your Changes (git commit -m 'Add some AmazingFeature')

* Push to the Branch (git push origin feature/AmazingFeature)

* Open a Pull Request

## 📜 License
* Distributed under the MIT License.

## ⭐ If You Liked This Project
* Please consider giving it a 🌟 Star on GitHub! It helps a lot.

## 👨‍💻 Author
**Anshuman Dash**   

[![GitHub](https://img.shields.io/badge/GitHub-Profile-black?logo=github)](https://github.com/ANSH5252) 

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?logo=linkedin)](https://www.linkedin.com/in/anshuman-dash-739793351/)

## 👥 Contributors
* **Priyavrat Singh**  
* **Harshit Dubey**  
* **Abhishek Naman**

Made with ❤️ for **TechSprint Hackathon**.