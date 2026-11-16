/**
 * LUXESTATE — ULTRA-LUXURY REAL ESTATE BACKEND SERVER
 * Built with Node.js native runtime & SQLite (Zero external dependencies)
 * Features:
 * - SQLite Relational Database with Auto-Migration & Seed Data
 * - RESTful API (/api/auth, /api/properties, /api/inquiries, /api/clients, /api/favorites, /api/analytics)
 * - Session & Role-Based Access Control (Admin / Client)
 * - Static File Server with Clean Routing & MIME resolution
 */

'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'luxestate.db');
const PUBLIC_DIR = __dirname;

// ============================================================
// 1. DATABASE INITIALIZATION & SCHEMA
// ============================================================
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for high performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    price TEXT NOT NULL,
    price_num INTEGER NOT NULL,
    location TEXT NOT NULL,
    address TEXT,
    beds REAL,
    baths REAL,
    sqft INTEGER,
    year_built INTEGER,
    hoa TEXT,
    garage TEXT,
    property_id TEXT,
    rating REAL DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    badge TEXT,
    is_new INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    agent_json TEXT,
    img TEXT,
    gallery_json TEXT,
    description TEXT,
    features_json TEXT,
    listed TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    initials TEXT,
    color TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    tier TEXT DEFAULT 'gold',
    deals INTEGER DEFAULT 0,
    spend TEXT DEFAULT '$0',
    interest TEXT DEFAULT 'Buying',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    sender TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    property TEXT,
    property_id INTEGER,
    interest TEXT DEFAULT 'buy',
    budget TEXT,
    tour_type TEXT,
    date TEXT,
    message TEXT,
    time TEXT,
    timestamp INTEGER,
    unread INTEGER DEFAULT 1,
    replies_json TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    property_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, property_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// ============================================================
// 2. CRYPTO & AUTH HELPERS
// ============================================================
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const check = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return check === hash;
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Session store management
function createSession(userId) {
  const token = generateToken();
  const now = Date.now();
  const expiresAt = now + (7 * 24 * 60 * 60 * 1000); // 7 days
  const stmt = db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)');
  stmt.run(token, userId, now, expiresAt);
  return token;
}

function getSessionUser(token) {
  if (!token) return null;
  const stmt = db.prepare(`
    SELECT u.id, u.username, u.email, u.role, s.expires_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ?
  `);
  const row = stmt.get(token);
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  return { id: row.id, username: row.username, email: row.email, role: row.role };
}

function destroySession(token) {
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
}

// ============================================================
// 3. SEED INITIAL DATA
// ============================================================
function seedDatabase() {
  // 1. Ensure demo accounts exist without blocking additional registered users.
  // INSERT OR IGNORE preserves any existing accounts and their passwords.
  console.log('Checking default demo accounts...');
  const adminPass = hashPassword('luxestate2024');
  const userPass = hashPassword('password');
  const insertDemoUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, email, password_hash, salt, role)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertDemoUser.run('admin', 'admin@luxestate.com', adminPass.hash, adminPass.salt, 'admin');
  insertDemoUser.run('user', 'user@luxestate.com', userPass.hash, userPass.salt, 'user');

  // 2. Seed Properties
  const propCount = db.prepare('SELECT COUNT(*) as count FROM properties').get().count;
  if (propCount === 0) {
    console.log('Seeding default luxury properties...');
    const insertProp = db.prepare(`
      INSERT INTO properties (
        id, name, type, category, price, price_num, location, address, beds, baths, sqft,
        year_built, hoa, garage, property_id, rating, reviews_count, badge, is_new, status,
        agent_json, img, gallery_json, description, features_json, listed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const SEED_PROPERTIES = [
      {
        id: 1, name: 'Sky Penthouse', type: 'Penthouse', category: 'buy', price: '$8,500,000', price_num: 8500000,
        location: 'Manhattan, New York', address: '432 Park Avenue, Penthouse 76, New York, NY 10022',
        beds: 4, baths: 4.5, sqft: 4200, year_built: 2021, hoa: '$3,800/mo', garage: '2 Private Spaces',
        property_id: 'LUX-NY-7601', rating: 4.9, reviews_count: 24, badge: 'For Sale', is_new: 0, status: 'active',
        agent: { name: 'Victoria Sterling', role: 'Senior Luxury Specialist', phone: '+1 (212) 555-8821', email: 'victoria@luxestate.com', initials: 'VS' },
        img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80'
        ],
        description: 'Perched high above Manhattan, this trophy duplex penthouse offers 360-degree panoramic views of Central Park, the East River, and the iconic city skyline. Features soaring 14-foot ceilings, custom Calacatta marble finishes, private elevator vestibule, and an expansive wraparound terrace for world-class entertaining.',
        features: ['Private Keyed Elevator', '360° Panoramic Views', 'Wraparound Sky Terrace', 'Calacatta Marble Kitchen', 'Wine Cellar & Tasting Room', '24/7 White-Glove Doorman', 'Heated Infinity Lap Pool', 'Automated Smart Home System'],
        listed: 'Sep 12, 2026'
      },
      {
        id: 2, name: 'Azure Dream Villa', type: 'Villa', category: 'buy', price: '$14,200,000', price_num: 14200000,
        location: 'Malibu, California', address: '33200 Pacific Coast Hwy, Malibu, CA 90265',
        beds: 6, baths: 6.5, sqft: 8800, year_built: 2023, hoa: '$1,200/mo', garage: '4-Car Climate Controlled',
        property_id: 'LUX-CA-4420', rating: 5.0, reviews_count: 18, badge: 'For Sale', is_new: 1, status: 'active',
        agent: { name: 'Marcus Cole', role: 'West Coast Director', phone: '+1 (310) 555-7492', email: 'marcus@luxestate.com', initials: 'MC' },
        img: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
          'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80',
          'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&q=80'
        ],
        description: 'An architectural tour de force seamlessly carved into the coastal bluffs of Malibu. Floor-to-ceiling glass walls pocket away to merge indoor opulence with private Pacific beachfront. Features an oceanfront zero-edge pool, private funicular to sandy beach, and a wellness pavilion.',
        features: ['Private Beach Access', 'Zero-Edge Infinity Pool', 'Wellness Spa & Sauna', 'Private Funicular', 'Chef Kitchen with Sub-Zero', 'Screening Room / Cinema', 'Solar & Tesla Powerwall', 'Gated Security Compound'],
        listed: 'Aug 5, 2026'
      },
      {
        id: 3, name: 'Heritage Townhouse', type: 'Townhouse', category: 'rent', price: '$28,000/mo', price_num: 28000,
        location: 'Chelsea, London', address: '14 Royal Crescent, Chelsea, London SW3 4UT',
        beds: 5, baths: 4.5, sqft: 5600, year_built: 1890, hoa: 'Included', garage: 'Private Mews Garage',
        property_id: 'LUX-UK-1890', rating: 4.8, reviews_count: 31, badge: 'For Rent', is_new: 0, status: 'active',
        agent: { name: 'James Ashford', role: 'International Director', phone: '+44 20 7946 0912', email: 'james@luxestate.com', initials: 'JA' },
        img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
          'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200&q=80',
          'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200&q=80',
          'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80'
        ],
        description: 'A masterfully restored 6-story Victorian townhouse combining regal period architecture with cutting-edge bespoke amenities. Features soaring ornate plasterwork ceilings, passenger lift serving all floors, landscaped private walled English garden, and subterranean wellness sanctuary.',
        features: ['Internal Passenger Elevator', 'Landscaped Walled Garden', 'Subterranean Swimming Pool', 'Wine Cellar for 1,200 Bottles', 'Air Conditioning Throughout', 'Bespoke Italian Kitchen', 'Separate Staff Quarters', 'CCTV & Security Concierge'],
        listed: 'Jul 22, 2026'
      },
      {
        id: 4, name: 'Ocean Crest Condo', type: 'Condo', category: 'rent', price: '$18,500/mo', price_num: 18500,
        location: 'South Beach, Miami', address: '100 Ocean Drive, Suite 2402, Miami Beach, FL 33139',
        beds: 3, baths: 3.5, sqft: 2900, year_built: 2022, hoa: 'Included', garage: '2 Valet Spaces',
        property_id: 'LUX-FL-2402', rating: 4.9, reviews_count: 19, badge: 'For Rent', is_new: 0, status: 'active',
        agent: { name: 'Victoria Sterling', role: 'Senior Luxury Specialist', phone: '+1 (212) 555-8821', email: 'victoria@luxestate.com', initials: 'VS' },
        img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80'
        ],
        description: 'Spectacular flow-through residence in one of South Beach\'s most prestigious oceanfront towers. Endless Atlantic sunrises and sunset skyline views of Downtown Miami from deep dual terraces. Features Italian porcelain floors, Boffi designer kitchen, and five-star resort amenities.',
        features: ['Direct Oceanfront View', 'Private Elevator Landing', 'Dual Sunrise/Sunset Terraces', '5-Star Beach Club Service', 'Full Spa & Tennis Courts', '24/7 Valet & Concierge', 'Designer Furnished Option', 'Custom Sound & Light Automation'],
        listed: 'Oct 1, 2026'
      },
      {
        id: 5, name: 'The SoHo Loft', type: 'Loft', category: 'new', price: '$4,750,000', price_num: 4750000,
        location: 'SoHo, New York', address: '118 Prince Street, 4th Floor, New York, NY 10012',
        beds: 2, baths: 2.5, sqft: 3100, year_built: 2024, hoa: '$2,100/mo', garage: 'Attached Heated Garage',
        property_id: 'LUX-NY-1184', rating: 4.7, reviews_count: 8, badge: 'New Launch', is_new: 1, status: 'active',
        agent: { name: 'Sophia Laurent', role: 'Investment Advisor', phone: '+1 (212) 555-3390', email: 'sophia@luxestate.com', initials: 'SL' },
        img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80',
          'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80'
        ],
        description: 'An authentic cast-iron loft newly reimagined by world-renowned minimalist architects. Featuring 13-foot timber ceilings, original exposed brick, museum-grade art walls, oversized historic sash windows, and an industrial-chic chef kitchen.',
        features: ['Historic Cast-Iron Building', 'Direct Key-in Elevator', '13-Foot Exposed Timber Ceilings', 'Custom Poliform Kitchen', 'Primary Suite with Dressing Room', 'Radiant Heated Concrete Floors', 'Integrated SONOS Architectural Audio', 'Low Monthly Carrying Charges'],
        listed: 'Oct 8, 2026'
      },
      {
        id: 6, name: 'Horizon Estate', type: 'Mansion', category: 'buy', price: '$32,000,000', price_num: 32000000,
        location: 'Beverly Hills, CA', address: '1040 Loma Vista Drive, Beverly Hills, CA 90210',
        beds: 8, baths: 11, sqft: 14000, year_built: 2022, hoa: '$2,400/mo', garage: '8-Car Gallery Showroom',
        property_id: 'LUX-BH-1040', rating: 5.0, reviews_count: 14, badge: 'For Sale', is_new: 0, status: 'active',
        agent: { name: 'Marcus Cole', role: 'West Coast Director', phone: '+1 (310) 555-7492', email: 'marcus@luxestate.com', initials: 'MC' },
        img: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80',
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
          'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80'
        ],
        description: 'The pinnacle of Beverly Hills grandeur. Sited behind double security gates on a 2.5-acre promontory with city-to-ocean views. Boasts an infinity-edge resort pool, championship tennis court, 20-seat Dolby Atmos screening room, and two detached guest villas.',
        features: ['2.5-Acre Private Promontory', 'City-to-Ocean Jetliner Views', 'Championship Tennis Court', 'Resort Infinity Pool & Cabana', '20-Seat Dolby Cinema', 'Commercial Catering Kitchen', 'Separate Guest Houses', 'State-of-the-Art Guard House'],
        listed: 'Sep 28, 2026'
      },
      {
        id: 7, name: 'Chalet Bellavista', type: 'Villa', category: 'buy', price: '$19,500,000', price_num: 19500000,
        location: 'Aspen, Colorado', address: '720 Red Mountain Road, Aspen, CO 81611',
        beds: 5, baths: 6.5, sqft: 7200, year_built: 2023, hoa: '$850/mo', garage: '3-Car Heated Motorcourt',
        property_id: 'LUX-CO-7200', rating: 4.9, reviews_count: 11, badge: 'For Sale', is_new: 0, status: 'active',
        agent: { name: 'Victoria Sterling', role: 'Senior Luxury Specialist', phone: '+1 (212) 555-8821', email: 'victoria@luxestate.com', initials: 'VS' },
        img: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&q=80',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80'
        ],
        description: 'Nestled on Aspen\'s iconic Red Mountain, this alpine sanctuary provides direct ski-in/ski-out convenience with unobstructed views of Ajax Mountain. Features hand-hewn Colorado timber, floor-to-ceiling stone fireplaces, heated terraces, and private outdoor hot springs spa.',
        features: ['Ski-In / Ski-Out Access', 'Panoramic Red Mountain Views', 'Outdoor Hot Springs Spa', 'Heated Driveway & Terraces', 'Custom Ski Locker Room', 'Wine Cellar & Billiards Room', 'Stone Wood-Burning Fireplaces', 'Oxygenated Primary Suite'],
        listed: 'Oct 15, 2026'
      },
      {
        id: 8, name: 'Palais Luminaire', type: 'Villa', category: 'rent', price: '$45,000/mo', price_num: 45000,
        location: 'Cap d\'Antibes, France', address: 'Boulevard de la Garoupe, 06160 Cap d\'Antibes, France',
        beds: 6, baths: 7, sqft: 9500, year_built: 2020, hoa: 'Included', garage: '6-Car Private Garage',
        property_id: 'LUX-FR-0616', rating: 5.0, reviews_count: 16, badge: 'For Rent', is_new: 0, status: 'active',
        agent: { name: 'James Ashford', role: 'International Director', phone: '+44 20 7946 0912', email: 'james@luxestate.com', initials: 'JA' },
        img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80'
        ],
        description: 'A sublime Belle Époque estate set within olive groves overlooking the azure waters of the French Riviera. Features private Mediterranean seaside access, infinity pool, manicured French gardens, private tennis court, and full villa staffing available upon request.',
        features: ['Direct Mediterranean Access', 'Heated Infinity Sea-View Pool', 'Private Clay Tennis Court', 'Century-Old Olive Grove', 'Caretaker & Staff Cottage', 'Summer Kitchen & Pizza Oven', 'Helipad Landing Rights', 'High-Security Perimeters'],
        listed: 'Aug 18, 2026'
      }
    ];

    for (const p of SEED_PROPERTIES) {
      insertProp.run(
        p.id, p.name, p.type, p.category, p.price, p.price_num, p.location, p.address,
        p.beds, p.baths, p.sqft, p.year_built, p.hoa, p.garage, p.property_id, p.rating,
        p.reviews_count, p.badge, p.is_new, p.status, JSON.stringify(p.agent), p.img,
        JSON.stringify(p.gallery), p.description, JSON.stringify(p.features), p.listed
      );
    }
  }

  // 3. Seed Clients
  const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;
  if (clientCount === 0) {
    console.log('Seeding CRM clients...');
    const insertClient = db.prepare(`
      INSERT INTO clients (id, name, initials, color, email, phone, location, tier, deals, spend, interest)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const SEED_CLIENTS = [
      { id: 1, name: 'Robert & Helen Harrison', initials: 'RH', color: 'linear-gradient(135deg,#c9a84c,#6b4f1a)', email: 'robert@harrison.com', phone: '+1 (212) 555-8821', location: 'New York, USA', tier: 'platinum', deals: 2, spend: '$16.8M', interest: 'Buying' },
      { id: 2, name: 'Antoine Laurent', initials: 'AL', color: 'linear-gradient(135deg,#4a6fa5,#1e3a5f)', email: 'antoine@laurent.mc', phone: '+377 98 98 00 11', location: 'Monaco', tier: 'platinum', deals: 3, spend: '$22.4M', interest: 'Investing' },
      { id: 3, name: 'David Kim', initials: 'DK', color: 'linear-gradient(135deg,#4ca87a,#1a5f3a)', email: 'dkim@apexventures.io', phone: '+1 (415) 555-0199', location: 'San Francisco, USA', tier: 'gold', deals: 1, spend: '$4.7M', interest: 'Investing' },
      { id: 4, name: 'Sarah Mitchell', initials: 'SM', color: 'linear-gradient(135deg,#a84c6f,#5f1a3a)', email: 'sarah.m@malibugroup.com', phone: '+1 (310) 555-2244', location: 'Los Angeles, USA', tier: 'gold', deals: 1, spend: '$14.2M', interest: 'Selling' },
      { id: 5, name: 'James & Eva Whitmore', initials: 'JW', color: 'linear-gradient(135deg,#5b9cf6,#1e3a8a)', email: 'jwhitmore@kensington.co.uk', phone: '+44 20 7123 4567', location: 'London, UK', tier: 'silver', deals: 0, spend: '$0', interest: 'Renting' },
      { id: 6, name: 'Priya Nair', initials: 'PN', color: 'linear-gradient(135deg,#c084fc,#7c3aed)', email: 'priya.nair@dubaiholding.ae', phone: '+971 4 362 7700', location: 'Dubai, UAE', tier: 'platinum', deals: 4, spend: '$38.1M', interest: 'Investing' }
    ];

    for (const c of SEED_CLIENTS) {
      insertClient.run(c.id, c.name, c.initials, c.color, c.email, c.phone, c.location, c.tier, c.deals, c.spend, c.interest);
    }
  }

  // 4. Seed Inquiries
  const inqCount = db.prepare('SELECT COUNT(*) as count FROM inquiries').get().count;
  if (inqCount === 0) {
    console.log('Seeding initial inquiries...');
    const insertInq = db.prepare(`
      INSERT INTO inquiries (
        id, sender, email, phone, property, property_id, interest, budget,
        tour_type, date, message, time, timestamp, unread, replies_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const SEED_INQS = [
      {
        id: 1, sender: 'Robert Harrison', email: 'robert@harrison.com', phone: '+1 (212) 555-8821',
        property: 'Sky Penthouse', property_id: 1, interest: 'buy', budget: 'Up to $12M',
        tour_type: 'In-Person VIP Tour', date: 'This Weekend (Sat 2 PM)',
        message: 'I am interested in scheduling a private viewing of the Sky Penthouse in Manhattan. My wife and I are relocating from London.',
        time: '2m ago', timestamp: Date.now() - 120000, unread: 1, replies: []
      },
      {
        id: 2, sender: 'Antoine Laurent', email: 'antoine@laurent.mc', phone: '+377 98 98 00 11',
        property: 'Palais Luminaire', property_id: 8, interest: 'rent', budget: '$50,000/mo',
        tour_type: 'Private 4K Virtual Walkthrough', date: 'Next Tuesday',
        message: 'We are seeking a 6-month luxury summer lease for Palais Luminaire in Cap d\'Antibes.',
        time: '1h ago', timestamp: Date.now() - 3600000, unread: 1, replies: []
      },
      {
        id: 3, sender: 'Sarah Mitchell', email: 'sarah.m@malibugroup.com', phone: '+1 (310) 555-2244',
        property: 'Azure Dream Villa', property_id: 2, interest: 'buy', budget: '$15M+',
        tour_type: 'In-Person VIP Tour', date: 'Thursday afternoon',
        message: 'Question regarding the private beachfront access and bluff stability reports for Azure Dream Villa.',
        time: '3h ago', timestamp: Date.now() - 10800000, unread: 1, replies: []
      }
    ];

    for (const q of SEED_INQS) {
      insertInq.run(
        q.id, q.sender, q.email, q.phone, q.property, q.property_id, q.interest,
        q.budget, q.tour_type, q.date, q.message, q.time, q.timestamp, q.unread, JSON.stringify(q.replies)
      );
    }
  }
}

seedDatabase();

// ============================================================
// 4. HTTP REQUEST UTILITIES
// ============================================================
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf'
};

function sendJson(res, statusCode, data, headers = {}) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...headers
  });
  res.end(payload);
}

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }
  return list;
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) { // 2MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

function getAuthFromReq(req) {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    const cookies = parseCookies(req);
    token = cookies.lux_token || null;
  }
  return getSessionUser(token);
}

function formatPropertyRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    category: row.category,
    price: row.price,
    priceNum: row.price_num,
    location: row.location,
    address: row.address,
    beds: row.beds,
    baths: row.baths,
    sqft: row.sqft,
    yearBuilt: row.year_built,
    hoa: row.hoa,
    garage: row.garage,
    propertyId: row.property_id,
    rating: row.rating,
    reviewsCount: row.reviews_count,
    badge: row.badge,
    isNew: Boolean(row.is_new),
    status: row.status,
    agent: row.agent_json ? JSON.parse(row.agent_json) : null,
    img: row.img,
    gallery: row.gallery_json ? JSON.parse(row.gallery_json) : [],
    description: row.description,
    features: row.features_json ? JSON.parse(row.features_json) : [],
    listed: row.listed,
    createdAt: row.created_at
  };
}

// ============================================================
// 5. ROUTE HANDLERS
// ============================================================
const server = http.createServer(async (req, res) => {
  // Global CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const user = getAuthFromReq(req);

  // ----------------------------------------------------------
  // A. REST API ROUTES
  // ----------------------------------------------------------
  if (pathname.startsWith('/api/')) {
    try {
      // 1. AUTH API
      if (pathname === '/api/auth/register' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const { username, email, password } = body;
        if (!username || !email || !password) {
          return sendJson(res, 400, { error: 'Username, email, and password are required' });
        }
        if (String(username).trim().length < 3 || String(username).trim().length > 40) {
          return sendJson(res, 400, { error: 'Username must be between 3 and 40 characters' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
          return sendJson(res, 400, { error: 'Please enter a valid email address' });
        }
        if (String(password).length < 8) {
          return sendJson(res, 400, { error: 'Password must be at least 8 characters long' });
        }
        const normalizedUsername = String(username).trim().toLowerCase();
        const normalizedEmail = String(email).trim().toLowerCase();
        const exists = db.prepare('SELECT id FROM users WHERE lower(username) = ? OR lower(email) = ?').get(normalizedUsername, normalizedEmail);
        if (exists) {
          return sendJson(res, 409, { error: 'Username or email already registered' });
        }
        const { hash, salt } = hashPassword(password);
        // Public registration must never grant administrator privileges.
        const safeRole = 'user';
        const result = db.prepare(`
          INSERT INTO users (username, email, password_hash, salt, role)
          VALUES (?, ?, ?, ?, ?)
        `).run(normalizedUsername, normalizedEmail, hash, salt, safeRole);

        const token = createSession(Number(result.lastInsertRowid));
        return sendJson(res, 201, {
          success: true,
          token,
          user: { id: Number(result.lastInsertRowid), username: normalizedUsername, email: normalizedEmail, role: safeRole }
        }, { 'Set-Cookie': `lux_token=${token}; Path=/; HttpOnly; SameSite=Lax` });
      }

      if (pathname === '/api/auth/login' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const { username, password } = body;
        if (!username || !password) {
          return sendJson(res, 400, { error: 'Username/email and password required' });
        }

        const row = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username.trim(), username.trim().toLowerCase());
        if (!row || !verifyPassword(password, row.password_hash, row.salt)) {
          return sendJson(res, 401, { error: 'Invalid credentials. Demo: user / password or admin / luxestate2024' });
        }

        const token = createSession(row.id);
        return sendJson(res, 200, {
          success: true,
          token,
          user: { id: row.id, username: row.username, email: row.email, role: row.role }
        }, { 'Set-Cookie': `lux_token=${token}; Path=/; HttpOnly; SameSite=Lax` });
      }

      if (pathname === '/api/auth/me' && req.method === 'GET') {
        if (!user) {
          return sendJson(res, 401, { authenticated: false, user: null });
        }
        return sendJson(res, 200, { authenticated: true, user });
      }

      if (pathname === '/api/auth/logout' && req.method === 'POST') {
        const authHeader = req.headers.authorization;
        let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : parseCookies(req).lux_token;
        destroySession(token);
        return sendJson(res, 200, { success: true }, {
          'Set-Cookie': 'lux_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
        });
      }

      // 2. PROPERTIES API
      if (pathname === '/api/properties' && req.method === 'GET') {
        const q = (parsedUrl.searchParams.get('q') || '').toLowerCase().trim();
        const category = parsedUrl.searchParams.get('category') || '';
        const type = parsedUrl.searchParams.get('type') || '';
        const status = parsedUrl.searchParams.get('status') || '';
        const minPrice = Number(parsedUrl.searchParams.get('minPrice')) || 0;
        const maxPrice = Number(parsedUrl.searchParams.get('maxPrice')) || 0;
        const beds = Number(parsedUrl.searchParams.get('beds')) || 0;
        const sort = parsedUrl.searchParams.get('sort') || 'default';
        const page = Math.max(1, Number(parsedUrl.searchParams.get('page')) || 1);
        const limit = Math.max(1, Math.min(100, Number(parsedUrl.searchParams.get('limit')) || 50));

        let sql = 'SELECT * FROM properties WHERE 1=1';
        const params = [];

        if (category && category !== 'all') {
          if (category === 'new') {
            sql += " AND (is_new = 1 OR category = 'new')";
          } else {
            sql += ' AND category = ?';
            params.push(category);
          }
        }
        if (type && type !== 'all') {
          sql += ' AND LOWER(type) = ?';
          params.push(type.toLowerCase());
        }
        if (status && status !== 'all') {
          sql += ' AND status = ?';
          params.push(status);
        }
        if (minPrice > 0) {
          sql += ' AND price_num >= ?';
          params.push(minPrice);
        }
        if (maxPrice > 0) {
          sql += ' AND price_num <= ?';
          params.push(maxPrice);
        }
        if (beds > 0) {
          sql += ' AND beds >= ?';
          params.push(beds);
        }
        if (q) {
          sql += ' AND (LOWER(name) LIKE ? OR LOWER(location) LIKE ? OR LOWER(address) LIKE ?)';
          const term = `%${q}%`;
          params.push(term, term, term);
        }

        // Sorting
        if (sort === 'price-asc') sql += ' ORDER BY price_num ASC';
        else if (sort === 'price-desc') sql += ' ORDER BY price_num DESC';
        else if (sort === 'rating') sql += ' ORDER BY rating DESC';
        else if (sort === 'newest') sql += ' ORDER BY id DESC';
        else sql += ' ORDER BY id ASC';

        const allRows = db.prepare(sql).all(...params);
        const total = allRows.length;
        const offset = (page - 1) * limit;
        const pagedRows = allRows.slice(offset, offset + limit).map(formatPropertyRow);

        return sendJson(res, 200, {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
          properties: pagedRows
        });
      }

      // Single Property Details
      const propIdMatch = pathname.match(/^\/api\/properties\/(\d+)$/);
      if (propIdMatch && req.method === 'GET') {
        const id = Number(propIdMatch[1]);
        const row = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
        if (!row) {
          return sendJson(res, 404, { error: 'Property not found' });
        }
        return sendJson(res, 200, { property: formatPropertyRow(row) });
      }

      // Create Property (Admin only)
      if (pathname === '/api/properties' && req.method === 'POST') {
        if (!user || user.role !== 'admin') {
          return sendJson(res, 403, { error: 'Admin authorization required' });
        }
        const body = await parseJsonBody(req);
        const { name, type = 'Villa', category = 'buy', price, location, beds = 3, baths = 3, sqft = 3000, img, description, agent } = body;
        if (!name || !price || !location) {
          return sendJson(res, 400, { error: 'Name, price, and location are required' });
        }
        const priceNum = Number(String(price).replace(/[^0-9]/g, '')) || 0;
        const formattedPrice = String(price).startsWith('$') ? price : `$${Number(priceNum).toLocaleString()}`;
        const propCode = `LUX-${(location.slice(0, 2) || 'GL').toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const stmt = db.prepare(`
          INSERT INTO properties (
            name, type, category, price, price_num, location, address, beds, baths, sqft,
            year_built, hoa, garage, property_id, rating, reviews_count, badge, is_new, status,
            agent_json, img, gallery_json, description, features_json, listed
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const defaultGallery = img ? [img] : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80'];
        const defaultFeatures = ['Private Security', 'Chef Kitchen', 'Panoramic Views', 'Smart Home Integration'];
        const defaultAgent = agent || {
          name: 'Victoria Sterling',
          role: 'Senior Luxury Specialist',
          phone: '+1 (212) 555-8821',
          email: 'victoria@luxestate.com',
          initials: 'VS'
        };

        const result = stmt.run(
          name, type, category, formattedPrice, priceNum, location, body.address || location,
          Number(beds), Number(baths), Number(sqft), body.yearBuilt || 2024, body.hoa || '$1,500/mo',
          body.garage || '2 Private Garage Spaces', propCode, 5.0, 1, 'New Listing', 1, body.status || 'active',
          JSON.stringify(defaultAgent), img || defaultGallery[0], JSON.stringify(defaultGallery),
          description || 'Exquisite luxury architectural masterpiece.', JSON.stringify(body.features || defaultFeatures),
          new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        );

        const created = db.prepare('SELECT * FROM properties WHERE id = ?').get(Number(result.lastInsertRowid));
        return sendJson(res, 201, { success: true, property: formatPropertyRow(created) });
      }

      // Update Property (Admin only)
      if (propIdMatch && (req.method === 'PUT' || req.method === 'PATCH')) {
        if (!user || user.role !== 'admin') {
          return sendJson(res, 403, { error: 'Admin authorization required' });
        }
        const id = Number(propIdMatch[1]);
        const body = await parseJsonBody(req);
        const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
        if (!existing) {
          return sendJson(res, 404, { error: 'Property not found' });
        }

        let price = body.price !== undefined ? body.price : existing.price;
        let priceNum = body.priceNum !== undefined ? body.priceNum : existing.price_num;
        if (body.price && !body.priceNum) {
          priceNum = Number(String(body.price).replace(/[^0-9]/g, '')) || existing.price_num;
        }

        db.prepare(`
          UPDATE properties SET
            name = ?, type = ?, category = ?, price = ?, price_num = ?,
            location = ?, address = ?, beds = ?, baths = ?, sqft = ?,
            status = ?, img = ?, description = ?
          WHERE id = ?
        `).run(
          body.name || existing.name,
          body.type || existing.type,
          body.category || existing.category,
          price,
          priceNum,
          body.location || existing.location,
          body.address || existing.address,
          body.beds !== undefined ? Number(body.beds) : existing.beds,
          body.baths !== undefined ? Number(body.baths) : existing.baths,
          body.sqft !== undefined ? Number(body.sqft) : existing.sqft,
          body.status || existing.status,
          body.img || existing.img,
          body.description || existing.description,
          id
        );

        const updated = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
        return sendJson(res, 200, { success: true, property: formatPropertyRow(updated) });
      }

      // Delete Property (Admin only)
      if (propIdMatch && req.method === 'DELETE') {
        if (!user || user.role !== 'admin') {
          return sendJson(res, 403, { error: 'Admin authorization required' });
        }
        const id = Number(propIdMatch[1]);
        db.prepare('DELETE FROM properties WHERE id = ?').run(id);
        return sendJson(res, 200, { success: true, message: 'Property deleted' });
      }

      // 3. INQUIRIES & TOUR BOOKINGS API
      if (pathname === '/api/inquiries' && req.method === 'GET') {
        let rows = [];
        if (user && user.role === 'admin') {
          rows = db.prepare('SELECT * FROM inquiries ORDER BY id DESC').all();
        } else if (user) {
          rows = db.prepare('SELECT * FROM inquiries WHERE user_id = ? OR email = ? ORDER BY id DESC').all(user.id, user.email);
        } else {
          rows = [];
        }

        const inquiries = rows.map(r => ({
          id: r.id,
          userId: r.user_id,
          sender: r.sender,
          email: r.email,
          phone: r.phone,
          property: r.property,
          propertyId: r.property_id,
          interest: r.interest,
          budget: r.budget,
          tourType: r.tour_type,
          date: r.date,
          message: r.message,
          time: r.time,
          timestamp: r.timestamp,
          unread: Boolean(r.unread),
          replies: r.replies_json ? JSON.parse(r.replies_json) : []
        }));

        return sendJson(res, 200, { inquiries });
      }

      if (pathname === '/api/inquiries' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const { sender, email, phone, property, propertyId, interest = 'buy', budget, tourType, date, message } = body;
        if (!sender || !email) {
          return sendJson(res, 400, { error: 'Name and email are required' });
        }

        const now = Date.now();
        const stmt = db.prepare(`
          INSERT INTO inquiries (
            user_id, sender, email, phone, property, property_id,
            interest, budget, tour_type, date, message, time, timestamp, unread, replies_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, '[]')
        `);

        const result = stmt.run(
          user ? user.id : null,
          sender.trim(),
          email.trim().toLowerCase(),
          phone || '',
          property || 'General VIP Inquiry',
          propertyId ? Number(propertyId) : null,
          interest,
          budget || 'Flexible',
          tourType || 'Private VIP Tour',
          date || 'Flexible Window',
          message || 'Requesting private consultation regarding this residence.',
          'Just now',
          now
        );

        return sendJson(res, 201, {
          success: true,
          inquiryId: Number(result.lastInsertRowid),
          message: 'Your inquiry has been directly dispatched to our senior brokerage team.'
        });
      }

      // Reply to Inquiry (Admin only)
      const inqReplyMatch = pathname.match(/^\/api\/inquiries\/(\d+)\/reply$/);
      if (inqReplyMatch && req.method === 'POST') {
        if (!user || user.role !== 'admin') {
          return sendJson(res, 403, { error: 'Admin authorization required' });
        }
        const id = Number(inqReplyMatch[1]);
        const body = await parseJsonBody(req);
        const { reply } = body;
        if (!reply) return sendJson(res, 400, { error: 'Reply text is required' });

        const row = db.prepare('SELECT replies_json FROM inquiries WHERE id = ?').get(id);
        if (!row) return sendJson(res, 404, { error: 'Inquiry not found' });

        const replies = row.replies_json ? JSON.parse(row.replies_json) : [];
        replies.push({
          author: user.username,
          text: reply.trim(),
          date: new Date().toISOString()
        });

        db.prepare('UPDATE inquiries SET unread = 0, replies_json = ? WHERE id = ?').run(JSON.stringify(replies), id);
        return sendJson(res, 200, { success: true, replies });
      }

      // Mark Inquiry Read (Admin)
      const inqReadMatch = pathname.match(/^\/api\/inquiries\/(\d+)\/read$/);
      if (inqReadMatch && req.method === 'POST') {
        const id = Number(inqReadMatch[1]);
        db.prepare('UPDATE inquiries SET unread = 0 WHERE id = ?').run(id);
        return sendJson(res, 200, { success: true });
      }

      // Delete Inquiry (Admin)
      const inqDeleteMatch = pathname.match(/^\/api\/inquiries\/(\d+)$/);
      if (inqDeleteMatch && req.method === 'DELETE') {
        if (!user || user.role !== 'admin') {
          return sendJson(res, 403, { error: 'Admin authorization required' });
        }
        const id = Number(inqDeleteMatch[1]);
        db.prepare('DELETE FROM inquiries WHERE id = ?').run(id);
        return sendJson(res, 200, { success: true });
      }

      // 4. CLIENTS CRM API (Admin only)
      if (pathname === '/api/clients' && req.method === 'GET') {
        if (!user || user.role !== 'admin') {
          return sendJson(res, 403, { error: 'Admin authorization required' });
        }
        const clients = db.prepare('SELECT * FROM clients ORDER BY id DESC').all();
        return sendJson(res, 200, { clients });
      }

      if (pathname === '/api/clients' && req.method === 'POST') {
        if (!user || user.role !== 'admin') {
          return sendJson(res, 403, { error: 'Admin authorization required' });
        }
        const body = await parseJsonBody(req);
        const { name, email, phone, location, tier = 'gold', interest = 'Buying' } = body;
        if (!name) return sendJson(res, 400, { error: 'Client name required' });

        const parts = name.trim().split(' ');
        const initials = (parts[0][0] + (parts[1] ? parts[1][0] : parts[0][1] || '')).toUpperCase();
        const colors = [
          'linear-gradient(135deg,#c9a84c,#6b4f1a)',
          'linear-gradient(135deg,#4a6fa5,#1e3a5f)',
          'linear-gradient(135deg,#4ca87a,#1a5f3a)',
          'linear-gradient(135deg,#a84c6f,#5f1a3a)',
          'linear-gradient(135deg,#c084fc,#7c3aed)'
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];

        const result = db.prepare(`
          INSERT INTO clients (name, initials, color, email, phone, location, tier, deals, spend, interest)
          VALUES (?, ?, ?, ?, ?, ?, ?, 0, '$0', ?)
        `).run(name.trim(), initials, color, email || '', phone || '', location || 'International', tier, interest);

        const newClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(Number(result.lastInsertRowid));
        return sendJson(res, 201, { success: true, client: newClient });
      }

      // Update / Delete Client (Admin only)
      const clientMatch = pathname.match(/^\/api\/clients\/(\d+)$/);
      if (clientMatch && (req.method === 'PUT' || req.method === 'PATCH')) {
        if (!user || user.role !== 'admin') {
          return sendJson(res, 403, { error: 'Admin authorization required' });
        }
        const id = Number(clientMatch[1]);
        const body = await parseJsonBody(req);
        const existing = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
        if (!existing) return sendJson(res, 404, { error: 'Client not found' });

        db.prepare(`
          UPDATE clients SET
            name = ?, email = ?, phone = ?, location = ?, tier = ?, interest = ?, spend = ?, deals = ?
          WHERE id = ?
        `).run(
          body.name || existing.name,
          body.email !== undefined ? body.email : existing.email,
          body.phone !== undefined ? body.phone : existing.phone,
          body.location !== undefined ? body.location : existing.location,
          body.tier || existing.tier,
          body.interest || existing.interest,
          body.spend !== undefined ? body.spend : existing.spend,
          body.deals !== undefined ? Number(body.deals) : existing.deals,
          id
        );
        const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
        return sendJson(res, 200, { success: true, client: updated });
      }

      if (clientMatch && req.method === 'DELETE') {
        if (!user || user.role !== 'admin') {
          return sendJson(res, 403, { error: 'Admin authorization required' });
        }
        const id = Number(clientMatch[1]);
        db.prepare('DELETE FROM clients WHERE id = ?').run(id);
        return sendJson(res, 200, { success: true, message: 'Client removed' });
      }

      // 5. FAVORITES API
      if (pathname === '/api/favorites' && req.method === 'GET') {
        if (!user) {
          return sendJson(res, 200, { favorites: [] });
        }
        const rows = db.prepare(`
          SELECT p.* FROM properties p
          JOIN favorites f ON p.id = f.property_id
          WHERE f.user_id = ?
        `).all(user.id);
        return sendJson(res, 200, { favorites: rows.map(formatPropertyRow) });
      }

      if (pathname === '/api/favorites/toggle' && req.method === 'POST') {
        if (!user) {
          return sendJson(res, 401, { error: 'Please sign in to save favorites' });
        }
        const body = await parseJsonBody(req);
        const propertyId = Number(body.propertyId);
        if (!propertyId) return sendJson(res, 400, { error: 'Property ID required' });

        const exists = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND property_id = ?').get(user.id, propertyId);
        if (exists) {
          db.prepare('DELETE FROM favorites WHERE id = ?').run(exists.id);
          return sendJson(res, 200, { isFavorite: false });
        } else {
          db.prepare('INSERT INTO favorites (user_id, property_id) VALUES (?, ?)').run(user.id, propertyId);
          return sendJson(res, 200, { isFavorite: true });
        }
      }

      // 6. ANALYTICS API (Admin)
      if (pathname === '/api/analytics' && req.method === 'GET') {
        const totalPortfolio = db.prepare('SELECT SUM(price_num) as total FROM properties').get().total || 0;
        const activeCount = db.prepare("SELECT COUNT(*) as count FROM properties WHERE status = 'active'").get().count;
        const totalProperties = db.prepare('SELECT COUNT(*) as count FROM properties').get().count;
        const totalClients = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;
        const unreadInquiries = db.prepare('SELECT COUNT(*) as count FROM inquiries WHERE unread = 1').get().count;
        const typeBreakdown = db.prepare('SELECT type, COUNT(*) as count FROM properties GROUP BY type').all();

        return sendJson(res, 200, {
          totalPortfolio,
          activeCount,
          totalProperties,
          totalClients,
          unreadInquiries,
          typeBreakdown
        });
      }

      // API 404
      return sendJson(res, 404, { error: 'API endpoint not found' });
    } catch (err) {
      console.error('API Error:', err);
      return sendJson(res, 500, { error: err.message || 'Internal server error' });
    }
  }

  // ----------------------------------------------------------
  // B. STATIC ASSET & PRETTY PAGE ROUTING
  // ----------------------------------------------------------
  let filePath = '';

  // Clean Page URL aliases
  const PAGE_MAP = {
    '/':                 'index.html',
    '/home':             'index.html',
    '/properties':       'properties.html',
    '/property-details': 'property-details.html',
    '/about':            'about.html',
    '/services':         'services.html',
    '/calculator':       'calculator.html',
    '/contact':          'contact.html',
    '/book-tour':        'book-tour.html',
    '/dashboard':        'dashboard.html',
    '/admin':            'admin.html',
    '/login':            'login.html'
  };

  // Section redirects fallback for single-page client architecture
  const SECTION_REDIRECTS = {
    '/properties': '/#listings',
    '/about':      '/#about',
    '/services':   '/#services',
    '/calculator': '/#calculator',
    '/contact':    '/#contact',
    '/book-tour':  '/#listings',
    '/dashboard':  '/admin.html'
  };

  if (PAGE_MAP[pathname]) {
    const candidateFile = path.join(PUBLIC_DIR, PAGE_MAP[pathname]);
    if (!fs.existsSync(candidateFile) && SECTION_REDIRECTS[pathname]) {
      res.writeHead(302, { 'Location': SECTION_REDIRECTS[pathname] });
      return res.end();
    }
    filePath = candidateFile;
  } else {
    // Normal file path
    filePath = path.join(PUBLIC_DIR, pathname);
  }

  // Security check: ensure path is within PUBLIC_DIR
  const resolvedPath = path.resolve(filePath);
  if (resolvedPath !== PUBLIC_DIR && !resolvedPath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access Denied');
  }

  // Enforce authentication on the server as well as in the browser.
  const requestedPage = path.basename(resolvedPath).toLowerCase();
  if (requestedPage === 'admin.html' && (!user || user.role !== 'admin')) {
    res.writeHead(302, { Location: '/login.html' });
    return res.end();
  }
  if (requestedPage === 'index.html' && !user) {
    res.writeHead(302, { Location: '/login.html' });
    return res.end();
  }

  fs.stat(resolvedPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // If user requested a path that matches a .html file without extension
      const fallbackHtml = resolvedPath + '.html';
      if (fs.existsSync(fallbackHtml)) {
        return serveFile(fallbackHtml, res);
      }
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>404 Not Found | LuxEstate</title><link rel="stylesheet" href="style.css"></head>
        <body style="background:#0a0a0f;color:#f0ece0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;text-align:center;">
          <h1 style="color:#c9a84c;font-size:3rem;margin-bottom:10px;">404</h1>
          <p style="color:#8a8a9a;font-size:1.2rem;margin-bottom:20px;">The requested luxury estate or page could not be located.</p>
          <a href="/" style="background:#c9a84c;color:#0a0a0f;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Return to Home</a>
        </body>
        </html>
      `);
    }

    serveFile(resolvedPath, res);
  });
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('Error loading file');
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(content);
  });
}

// Start Server
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  LUXESTATE PLATFORM RUNNING AT:`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  - Home:             http://localhost:${PORT}/`);
  console.log(`  - Properties:       http://localhost:${PORT}/properties.html`);
  console.log(`  - Property Details: http://localhost:${PORT}/property-details.html?id=1`);
  console.log(`  - Services:         http://localhost:${PORT}/services.html`);
  console.log(`  - About:            http://localhost:${PORT}/about.html`);
  console.log(`  - Calculator:       http://localhost:${PORT}/calculator.html`);
  console.log(`  - Book VIP Tour:    http://localhost:${PORT}/book-tour.html`);
  console.log(`  - Client Dashboard: http://localhost:${PORT}/dashboard.html`);
  console.log(`  - Admin Dashboard:  http://localhost:${PORT}/admin.html`);
  console.log(`  - Sign In:          http://localhost:${PORT}/login.html`);
  console.log(`======================================================\n`);
});

