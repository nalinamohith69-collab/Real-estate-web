# LuxEstate — Ultra-Luxury Real Estate Web Platform

A premier, fully responsive web application for ultra-high-net-worth real estate brokerage and management. Built with modern vanilla JavaScript, semantic HTML5, and bespoke luxury CSS.

---

## 🌟 Key Features

### 1. Client Portal (`index.html`)
- **Hero & Dynamic Search Engine**: Multi-parameter search by transaction type (Buy / Rent / Invest), location keywords, property types (Villa, Penthouse, Mansion, Condo, Townhouse, Loft), and price budget.
- **Dynamic Property Catalog**: Rendered in real-time from the shared `LuxStore` data layer. Changes made in the Admin Dashboard (additions, edits, deletions, status changes) reflect immediately on the frontend.
- **Interactive Property Details Modal**:
  - Full-screen multi-photo gallery carousel with thumbnail navigation and keyboard support.
  - Comprehensive architectural specifications (Beds, Baths, Sq. Ft, Year Built, Garage, HOA).
  - Verified luxury amenities tags (Private Beach Access, Infinity Pool, Wine Cellar, Helipad, Smart Home Automation).
  - Assigned senior broker card with direct phone, email, and tour booking.
- **Private VIP Tour Booking**:
  - Modal with date & time picker, format selection (In-Person VIP Tour vs. 4K Virtual Walkthrough), and contact capture.
  - Submissions automatically sync to the Admin Inbox in real-time.
- **Saved Properties (Favorites) Drawer**:
  - Heart toggle buttons on property cards save listings to `localStorage`.
  - Slide-over drawer with real-time counter badge in the navbar, allowing instant review and removal.
- **Luxury Mortgage & Financing Calculator**:
  - Interactive sliders for Home Price ($1M–$35M), Down Payment (10%–50%), Interest Rate (3.0%–9.0%), and Loan Term (15 / 30 Years).
  - Live monthly payment calculation with detailed visual breakdown: Principal & Interest, Property Taxes, Homeowners Insurance, and Luxury HOA.
- **Interactive Inquiries & Lead Capture**:
  - Contact and Newsletter forms that store leads directly into the CRM inbox.

### 2. Admin Management Dashboard (`admin.html`)
- **Live Portfolio Analytics & KPIs**:
  - Total Active Portfolio Value, Live Listing Count, High-Net-Worth Client count, and Unread Inquiries counter.
  - Interactive distribution charts and deal volume tracking.
- **Complete Property CRUD**:
  - **Add Property**: Modal with full field validation, image URL, category, specs, and agent assignment.
  - **Edit Property**: Interactive edit modal pre-populating existing data with instant live update.
  - **Delete Property**: Permanent removal with confirmation.
  - **Status Management**: Quick dropdown to toggle between Active, Pending, Sold, and Rented.
- **Client Relationship Management (CRM)**:
  - Add and manage VIP clients across tiers (Platinum, Gold, Silver).
  - Track total spend, deal counts, and primary acquisition interest.
- **Real-Time Inquiry & Tour Inbox**:
  - View incoming leads submitted from the website.
  - Message reader pane displaying sender information, preferred viewing dates, budgets, and phone numbers.
  - In-app reply dispatch and inquiry deletion.
- **Export Capabilities**:
  - One-click export of complete portfolio data to JSON for external reporting.

### 3. Unified Authentication (`login.html`)
- **Role-Based Authentication**:
  - Seamless routing for Clients (`index.html`) and Administrators (`admin.html`).
- **1-Click Demo Buttons**:
  - Instant auto-fill and login for rapid testing:
    - **Client Demo**: Username `user` | Password `password`
    - **Admin Demo**: Username `admin` | Password `luxestate2024`
- **Active Session Management**:
  - Displays currently active session banner with direct portal access button and clean sign-out.

### 4. Shared LocalStorage Data Store (`store.js`)
- Centralized `LuxStore` module managing:
  - `lux_properties`: Luxury property listings with full specifications, images, and features.
  - `lux_inquiries`: Tour requests, general inquiries, and contact leads.
  - `lux_clients`: Client CRM records.
  - `lux_favorites`: User saved properties.
  - `lux_auth`: Authentication state and role tokens.

---

## 📁 Project Structure

```
C:\Real-estate-app\
├── server.js        # Native Node.js & SQLite relational backend server & REST API
├── index.html       # Client-facing luxury real estate portal
├── admin.html       # Administrator management dashboard & CRM
├── login.html       # Authentication portal with 1-click demo logins
├── store.js         # Centralized hybrid data store (LocalStorage + SQLite sync)
├── script.js        # Client interactions, search, calculator, & modals
├── style.css        # Luxury dark & gold design system & responsive layout
├── package.json     # Node.js project manifest & startup scripts
└── README.md        # Documentation & usage guide
```

---

## 🚀 How to Run the Project

### Recommended: Full-Stack Server with SQLite Backend

**Requirements:** Node.js 22.16.0 or newer. The app uses Node.js built-in SQLite and has no external npm dependencies.

Run the application from this folder:
```bash
# Start the full-stack server
npm start
# or: node server.js
```
The server will start at `http://localhost:3000`:
- **Home / Client Portal**: `http://localhost:3000/`
- **Sign In Portal**: `http://localhost:3000/login.html`
- **Admin Dashboard**: `http://localhost:3000/admin.html`
- **RESTful API**: `http://localhost:3000/api/properties`, `/api/analytics`, etc.

**Important:** Do not open the HTML files directly or use a static-only server. Authentication, the SQLite database, and protected admin routes require `node server.js` to be running. The server redirects unauthenticated visitors to the login page.

---

## 🔑 Demo Credentials

These credentials are for local demonstration only. Change them before deploying publicly.

| Role | Username | Password | Redirects To |
| :--- | :--- | :--- | :--- |
| **Client / User** | `user` | `password` | `index.html` |
| **Administrator** | `admin` | `luxestate2024` | `admin.html` |


## Validation and security notes

- Public account registration (if enabled through the API) always creates a regular client account; it cannot assign the administrator role.
- The admin page is protected by a server-side session check, and admin API operations independently verify the admin role.
- Login fails closed if the backend is unavailable; it does not create a fake browser-only session.
- Passwords are stored as salted PBKDF2 hashes in SQLite, not as plaintext.
- Run `npm test` to perform JavaScript syntax checks.
