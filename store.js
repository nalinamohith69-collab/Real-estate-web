/* ============================================================
   LUXESTATE — CENTRALIZED DATA STORE & LOCAL STORAGE MANAGER
   Shared by Client Portal (index.html), Admin (admin.html), & Auth
   ============================================================ */

'use strict';

const LuxStore = (() => {
  const KEYS = {
    PROPERTIES: 'lux_properties',
    INQUIRIES:  'lux_inquiries',
    CLIENTS:    'lux_clients',
    FAVORITES:  'lux_favorites',
    AUTH:       'lux_auth',
    SETTINGS:   'lux_settings',
    TOKEN:      'lux_token'
  };


  // ----------------------------------------------------------
  // Default Luxury Properties Seed Data
  // ----------------------------------------------------------
  const DEFAULT_PROPERTIES = [
    {
      id: 1,
      name: 'Sky Penthouse',
      type: 'Penthouse',
      category: 'buy',
      price: '$8,500,000',
      priceNum: 8500000,
      location: 'Manhattan, New York',
      address: '432 Park Avenue, Penthouse 76, New York, NY 10022',
      beds: 4,
      baths: 4.5,
      sqft: 4200,
      yearBuilt: 2021,
      hoa: '$3,800/mo',
      garage: '2 Private Spaces',
      propertyId: 'LUX-NY-7601',
      rating: 4.9,
      reviewsCount: 24,
      badge: 'For Sale',
      status: 'active',
      agent: {
        name: 'Victoria Sterling',
        role: 'Senior Luxury Specialist',
        phone: '+1 (212) 555-8821',
        email: 'victoria@luxestate.com',
        initials: 'VS'
      },
      img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80'
      ],
      description: 'Perched high above Manhattan, this trophy duplex penthouse offers 360-degree panoramic views of Central Park, the East River, and the iconic city skyline. Features soaring 14-foot ceilings, custom Calacatta marble finishes, private elevator vestibule, and an expansive wraparound terrace for world-class entertaining.',
      features: [
        'Private Keyed Elevator',
        '360° Panoramic Views',
        'Wraparound Sky Terrace',
        'Calacatta Marble Kitchen',
        'Wine Cellar & Tasting Room',
        '24/7 White-Glove Doorman',
        'Heated Infinity Lap Pool',
        'Automated Smart Home System'
      ],
      listed: 'Sep 12, 2026'
    },
    {
      id: 2,
      name: 'Azure Dream Villa',
      type: 'Villa',
      category: 'buy',
      price: '$14,200,000',
      priceNum: 14200000,
      location: 'Malibu, California',
      address: '33200 Pacific Coast Hwy, Malibu, CA 90265',
      beds: 6,
      baths: 6.5,
      sqft: 8800,
      yearBuilt: 2023,
      hoa: '$1,200/mo',
      garage: '4-Car Climate Controlled',
      propertyId: 'LUX-CA-4420',
      rating: 5.0,
      reviewsCount: 18,
      badge: 'For Sale',
      isNew: true,
      status: 'active',
      agent: {
        name: 'Marcus Cole',
        role: 'West Coast Director',
        phone: '+1 (310) 555-7492',
        email: 'marcus@luxestate.com',
        initials: 'MC'
      },
      img: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&q=80'
      ],
      description: 'An architectural tour de force seamlessly carved into the coastal bluffs of Malibu. Floor-to-ceiling glass walls pocket away to merge indoor opulence with private Pacific beachfront. Features an oceanfront zero-edge pool, private funicular to sandy beach, and a wellness pavilion.',
      features: [
        'Private Beach Access',
        'Zero-Edge Infinity Pool',
        'Wellness Spa & Sauna',
        'Private Funicular',
        'Chef Kitchen with Sub-Zero',
        'Screening Room / Cinema',
        'Solar & Tesla Powerwall',
        'Gated Security Compound'
      ],
      listed: 'Aug 5, 2026'
    },
    {
      id: 3,
      name: 'Heritage Townhouse',
      type: 'Townhouse',
      category: 'rent',
      price: '$28,000/mo',
      priceNum: 28000,
      location: 'Chelsea, London',
      address: '14 Royal Crescent, Chelsea, London SW3 4UT',
      beds: 5,
      baths: 4.5,
      sqft: 5600,
      yearBuilt: 1890,
      hoa: 'Included',
      garage: 'Private Mews Garage',
      propertyId: 'LUX-UK-1890',
      rating: 4.8,
      reviewsCount: 31,
      badge: 'For Rent',
      status: 'active',
      agent: {
        name: 'James Ashford',
        role: 'International Director',
        phone: '+44 20 7946 0912',
        email: 'james@luxestate.com',
        initials: 'JA'
      },
      img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
        'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200&q=80',
        'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200&q=80',
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80'
      ],
      description: 'A masterfully restored 6-story Victorian townhouse combining regal period architecture with cutting-edge bespoke amenities. Features soaring ornate plasterwork ceilings, passenger lift serving all floors, landscaped private walled English garden, and subterranean wellness sanctuary.',
      features: [
        'Internal Passenger Elevator',
        'Landscaped Walled Garden',
        'Subterranean Swimming Pool',
        'Wine Cellar for 1,200 Bottles',
        'Air Conditioning Throughout',
        'Bespoke Italian Kitchen',
        'Separate Staff Quarters',
        'CCTV & Security Concierge'
      ],
      listed: 'Jul 22, 2026'
    },
    {
      id: 4,
      name: 'Ocean Crest Condo',
      type: 'Condo',
      category: 'rent',
      price: '$18,500/mo',
      priceNum: 18500,
      location: 'South Beach, Miami',
      address: '100 Ocean Drive, Suite 2402, Miami Beach, FL 33139',
      beds: 3,
      baths: 3.5,
      sqft: 2900,
      yearBuilt: 2022,
      hoa: 'Included',
      garage: '2 Valet Spaces',
      propertyId: 'LUX-FL-2402',
      rating: 4.9,
      reviewsCount: 19,
      badge: 'For Rent',
      status: 'active',
      agent: {
        name: 'Victoria Sterling',
        role: 'Senior Luxury Specialist',
        phone: '+1 (212) 555-8821',
        email: 'victoria@luxestate.com',
        initials: 'VS'
      },
      img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80'
      ],
      description: 'Spectacular flow-through residence in one of South Beach\'s most prestigious oceanfront towers. Endless Atlantic sunrises and sunset skyline views of Downtown Miami from deep dual terraces. Features Italian porcelain floors, Boffi designer kitchen, and five-star resort amenities.',
      features: [
        'Direct Oceanfront View',
        'Private Elevator Landing',
        'Dual Sunrise/Sunset Terraces',
        '5-Star Beach Club Service',
        'Full Spa & Tennis Courts',
        '24/7 Valet & Concierge',
        'Designer Furnished Option',
        'Custom Sound & Light Automation'
      ],
      listed: 'Oct 1, 2026'
    },
    {
      id: 5,
      name: 'The SoHo Loft',
      type: 'Loft',
      category: 'new',
      price: '$4,750,000',
      priceNum: 4750000,
      location: 'SoHo, New York',
      address: '118 Prince Street, 4th Floor, New York, NY 10012',
      beds: 2,
      baths: 2.5,
      sqft: 3100,
      yearBuilt: 2024,
      hoa: '$2,100/mo',
      garage: 'Attached Heated Garage',
      propertyId: 'LUX-NY-1184',
      rating: 4.7,
      reviewsCount: 8,
      badge: 'New Launch',
      isNew: true,
      status: 'active',
      agent: {
        name: 'Sophia Laurent',
        role: 'Investment Advisor',
        phone: '+1 (212) 555-3390',
        email: 'sophia@luxestate.com',
        initials: 'SL'
      },
      img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80',
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80'
      ],
      description: 'An authentic cast-iron loft newly reimagined by world-renowned minimalist architects. Featuring 13-foot timber ceilings, original exposed brick, museum-grade art walls, oversized historic sash windows, and an industrial-chic chef kitchen.',
      features: [
        'Historic Cast-Iron Building',
        'Direct Key-in Elevator',
        '13-Foot Exposed Timber Ceilings',
        'Custom Poliform Kitchen',
        'Primary Suite with Dressing Room',
        'Radiant Heated Concrete Floors',
        'Integrated SONOS Architectural Audio',
        'Low Monthly Carrying Charges'
      ],
      listed: 'Oct 8, 2026'
    },
    {
      id: 6,
      name: 'Horizon Estate',
      type: 'Mansion',
      category: 'buy',
      price: '$32,000,000',
      priceNum: 32000000,
      location: 'Beverly Hills, CA',
      address: '1040 Loma Vista Drive, Beverly Hills, CA 90210',
      beds: 8,
      baths: 11,
      sqft: 14000,
      yearBuilt: 2022,
      hoa: '$2,400/mo',
      garage: '8-Car Gallery Showroom',
      propertyId: 'LUX-BH-1040',
      rating: 5.0,
      reviewsCount: 14,
      badge: 'For Sale',
      status: 'active',
      agent: {
        name: 'Marcus Cole',
        role: 'West Coast Director',
        phone: '+1 (310) 555-7492',
        email: 'marcus@luxestate.com',
        initials: 'MC'
      },
      img: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80'
      ],
      description: 'The pinnacle of Beverly Hills grandeur. Sited behind double security gates on a 2.5-acre promontory with city-to-ocean views. Boasts an infinity-edge resort pool, championship tennis court, 20-seat Dolby Atmos screening room, and two detached guest villas.',
      features: [
        '2.5-Acre Private Promontory',
        'City-to-Ocean Jetliner Views',
        'Championship Tennis Court',
        'Resort Infinity Pool & Cabana',
        '20-Seat Dolby Cinema',
        'Commercial Catering Kitchen',
        'Separate Guest Houses',
        'State-of-the-Art Guard House'
      ],
      listed: 'Sep 28, 2026'
    },
    {
      id: 7,
      name: 'Chalet Bellavista',
      type: 'Villa',
      category: 'buy',
      price: '$19,500,000',
      priceNum: 19500000,
      location: 'Aspen, Colorado',
      address: '720 Red Mountain Road, Aspen, CO 81611',
      beds: 5,
      baths: 6.5,
      sqft: 7200,
      yearBuilt: 2023,
      hoa: '$850/mo',
      garage: '3-Car Heated Motorcourt',
      propertyId: 'LUX-CO-7200',
      rating: 4.9,
      reviewsCount: 11,
      badge: 'For Sale',
      status: 'active',
      agent: {
        name: 'Victoria Sterling',
        role: 'Senior Luxury Specialist',
        phone: '+1 (212) 555-8821',
        email: 'victoria@luxestate.com',
        initials: 'VS'
      },
      img: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80'
      ],
      description: 'Nestled on Aspen\'s iconic Red Mountain, this alpine sanctuary provides direct ski-in/ski-out convenience with unobstructed views of Ajax Mountain. Features hand-hewn Colorado timber, floor-to-ceiling stone fireplaces, heated terraces, and private outdoor hot springs spa.',
      features: [
        'Ski-In / Ski-Out Access',
        'Panoramic Red Mountain Views',
        'Outdoor Hot Springs Spa',
        'Heated Driveway & Terraces',
        'Custom Ski Locker Room',
        'Wine Cellar & Billiards Room',
        'Stone Wood-Burning Fireplaces',
        'Oxygenated Primary Suite'
      ],
      listed: 'Oct 15, 2026'
    },
    {
      id: 8,
      name: 'Palais Luminaire',
      type: 'Villa',
      category: 'rent',
      price: '$45,000/mo',
      priceNum: 45000,
      location: 'Cap d\'Antibes, France',
      address: 'Boulevard de la Garoupe, 06160 Cap d\'Antibes, France',
      beds: 6,
      baths: 7,
      sqft: 9500,
      yearBuilt: 2020,
      hoa: 'Included',
      garage: '6-Car Private Garage',
      propertyId: 'LUX-FR-0616',
      rating: 5.0,
      reviewsCount: 16,
      badge: 'For Rent',
      status: 'active',
      agent: {
        name: 'James Ashford',
        role: 'International Director',
        phone: '+44 20 7946 0912',
        email: 'james@luxestate.com',
        initials: 'JA'
      },
      img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80'
      ],
      description: 'A sublime Belle Époque estate set within olive groves overlooking the azure waters of the French Riviera. Features private Mediterranean seaside access, infinity pool, manicured French gardens, private tennis court, and full villa staffing available upon request.',
      features: [
        'Direct Mediterranean Access',
        'Heated Infinity Sea-View Pool',
        'Private Clay Tennis Court',
        'Century-Old Olive Grove',
        'Caretaker & Staff Cottage',
        'Summer Kitchen & Pizza Oven',
        'Helipad Landing Rights',
        'High-Security Perimeters'
      ],
      listed: 'Aug 18, 2026'
    }
  ];

  // ----------------------------------------------------------
  // Default CRM Clients Seed Data
  // ----------------------------------------------------------
  const DEFAULT_CLIENTS = [
    { id: 1, name: 'Robert & Helen Harrison', initials: 'RH', color: 'linear-gradient(135deg,#c9a84c,#6b4f1a)', email: 'robert@harrison.com', phone: '+1 (212) 555-8821', location: 'New York, USA', tier: 'platinum', deals: 2, spend: '$16.8M', interest: 'Buying' },
    { id: 2, name: 'Antoine Laurent', initials: 'AL', color: 'linear-gradient(135deg,#4a6fa5,#1e3a5f)', email: 'antoine@laurent.mc', phone: '+377 98 98 00 11', location: 'Monaco', tier: 'platinum', deals: 3, spend: '$22.4M', interest: 'Investing' },
    { id: 3, name: 'David Kim', initials: 'DK', color: 'linear-gradient(135deg,#4ca87a,#1a5f3a)', email: 'dkim@apexventures.io', phone: '+1 (415) 555-0199', location: 'San Francisco, USA', tier: 'gold', deals: 1, spend: '$4.7M', interest: 'Investing' },
    { id: 4, name: 'Sarah Mitchell', initials: 'SM', color: 'linear-gradient(135deg,#a84c6f,#5f1a3a)', email: 'sarah.m@malibugroup.com', phone: '+1 (310) 555-2244', location: 'Los Angeles, USA', tier: 'gold', deals: 1, spend: '$14.2M', interest: 'Selling' },
    { id: 5, name: 'James & Eva Whitmore', initials: 'JW', color: 'linear-gradient(135deg,#5b9cf6,#1e3a8a)', email: 'jwhitmore@kensington.co.uk', phone: '+44 20 7123 4567', location: 'London, UK', tier: 'silver', deals: 0, spend: '$0', interest: 'Renting' },
    { id: 6, name: 'Priya Nair', initials: 'PN', color: 'linear-gradient(135deg,#c084fc,#7c3aed)', email: 'priya.nair@dubaiholding.ae', phone: '+971 4 362 7700', location: 'Dubai, UAE', tier: 'platinum', deals: 4, spend: '$38.1M', interest: 'Investing' }
  ];

  // ----------------------------------------------------------
  // Default Inquiries / Messages Seed Data
  // ----------------------------------------------------------
  const DEFAULT_INQUIRIES = [
    {
      id: 1,
      sender: 'Robert Harrison',
      email: 'robert@harrison.com',
      phone: '+1 (212) 555-8821',
      property: 'Sky Penthouse',
      propertyId: 1,
      interest: 'buy',
      budget: 'Up to $12M',
      tourType: 'In-Person VIP Tour',
      date: 'This Weekend (Sat 2 PM)',
      message: 'I am interested in scheduling a private viewing of the Sky Penthouse in Manhattan. My wife and I are relocating from London. Could you arrange a private tour this coming weekend? We would appreciate a full breakdown of the HOA fees and recent building upgrades.',
      time: '2m ago',
      timestamp: Date.now() - 120000,
      unread: true,
      replies: []
    },
    {
      id: 2,
      sender: 'Antoine Laurent',
      email: 'antoine@laurent.mc',
      phone: '+377 98 98 00 11',
      property: 'Palais Luminaire',
      propertyId: 8,
      interest: 'rent',
      budget: '$50,000/mo',
      tourType: 'Private 4K Virtual Walkthrough',
      date: 'Next Tuesday',
      message: 'We are seeking a 6-month luxury summer lease for Palais Luminaire in Cap d\'Antibes. Please confirm availability for June through November and whether on-site yacht mooring is accessible.',
      time: '1h ago',
      timestamp: Date.now() - 3600000,
      unread: true,
      replies: []
    },
    {
      id: 3,
      sender: 'Sarah Mitchell',
      email: 'sarah.m@malibugroup.com',
      phone: '+1 (310) 555-2244',
      property: 'Azure Dream Villa',
      propertyId: 2,
      interest: 'buy',
      budget: '$15M+',
      tourType: 'In-Person VIP Tour',
      date: 'Thursday afternoon',
      message: 'Question regarding the private beachfront access and bluff stability reports for Azure Dream Villa. Can Marcus send over the geological disclosures?',
      time: '3h ago',
      timestamp: Date.now() - 10800000,
      unread: true,
      replies: []
    },
    {
      id: 4,
      sender: 'James Whitmore',
      email: 'jwhitmore@kensington.co.uk',
      phone: '+44 20 7123 4567',
      property: 'Heritage Townhouse',
      propertyId: 3,
      interest: 'rent',
      budget: '$30,000/mo',
      tourType: 'In-Person VIP Tour',
      date: 'Tomorrow morning',
      message: 'Inquiring about multi-year tenancy options for the Chelsea Heritage Townhouse. Is the mews garage suitable for an extended wheelbase vehicle?',
      time: '5h ago',
      timestamp: Date.now() - 18000000,
      unread: false,
      replies: ['Thank you James, yes the garage accommodates long wheelbases up to 5.4m. We will see you tomorrow at 10 AM.']
    }
  ];

  // Helper getters & setters
  function getRaw(key, defaultVal) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : defaultVal;
    } catch (e) {
      console.warn('LuxStore read error:', e);
      return defaultVal;
    }
  }

  function setRaw(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('LuxStore write error:', e);
    }
  }

  // ----------------------------------------------------------
  // Backend REST API Sync Utilities
  // ----------------------------------------------------------
  function getToken() {
    return localStorage.getItem(KEYS.TOKEN) || '';
  }

  function setToken(token) {
    if (token) {
      localStorage.setItem(KEYS.TOKEN, token);
    } else {
      localStorage.removeItem(KEYS.TOKEN);
    }
  }

  async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Do not leave forms waiting forever if the backend is stopped or unreachable.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(endpoint, {
        ...options,
        headers,
        credentials: 'include',
        signal: options.signal || controller.signal
      });
      if (!res.ok) {
        let msg = `Request failed (HTTP ${res.status})`;
        try {
          const json = await res.json();
          if (json && json.error) msg = json.error;
        } catch (_) {}
        throw new Error(msg);
      }
      return await res.json();
    } catch (err) {
      if (err && err.name === 'AbortError') {
        throw new Error('The server did not respond within 12 seconds. Make sure the website server is running, then try again.');
      }
      if (err instanceof TypeError) {
        throw new Error('Cannot connect to the website server. Run "npm start" and open http://localhost:3000/login.html.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function syncFromBackend() {
    if (typeof window === 'undefined' || !window.location || !window.location.protocol.startsWith('http')) return;
    try {
      // 1. Sync properties
      const propData = await apiFetch('/api/properties?limit=100').catch(() => null);
      if (propData && Array.isArray(propData.properties) && propData.properties.length > 0) {
        setRaw(KEYS.PROPERTIES, propData.properties);
      }

      // 2. Sync auth state
      const authData = await apiFetch('/api/auth/me').catch(() => null);
      if (authData && authData.authenticated && authData.user) {
        setRaw(KEYS.AUTH, {
          username: authData.user.username,
          role: authData.user.role,
          email: authData.user.email,
          ts: Date.now()
        });
      }

      // 3. Sync inquiries and clients if admin
      const auth = getAuth();
      if (auth && auth.role === 'admin') {
        const inqData = await apiFetch('/api/inquiries').catch(() => null);
        if (inqData && Array.isArray(inqData.inquiries)) {
          setRaw(KEYS.INQUIRIES, inqData.inquiries);
        }
        const clientData = await apiFetch('/api/clients').catch(() => null);
        if (clientData && Array.isArray(clientData.clients)) {
          setRaw(KEYS.CLIENTS, clientData.clients);
        }
      }

      // 4. Sync favorites if user logged in
      if (auth) {
        const favData = await apiFetch('/api/favorites').catch(() => null);
        if (favData && Array.isArray(favData.favorites)) {
          const ids = favData.favorites.map(f => f.id);
          setRaw(KEYS.FAVORITES, ids);
        }
      }
    } catch (err) {
      console.debug('LuxStore sync notice:', err.message);
    }
  }

  // ----------------------------------------------------------
  // Initialization
  // ----------------------------------------------------------
  function init() {
    if (!localStorage.getItem(KEYS.PROPERTIES)) {
      setRaw(KEYS.PROPERTIES, DEFAULT_PROPERTIES);
    }
    if (!localStorage.getItem(KEYS.CLIENTS)) {
      setRaw(KEYS.CLIENTS, DEFAULT_CLIENTS);
    }
    if (!localStorage.getItem(KEYS.INQUIRIES)) {
      setRaw(KEYS.INQUIRIES, DEFAULT_INQUIRIES);
    }
    if (!localStorage.getItem(KEYS.FAVORITES)) {
      setRaw(KEYS.FAVORITES, [1, 2]); // default favorites
    }
    // Attempt asynchronous background sync if running over HTTP
    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      setTimeout(syncFromBackend, 50);
    }
  }

  // Run init immediately on script evaluation
  init();

  // ----------------------------------------------------------
  // Properties API
  // ----------------------------------------------------------
  function getProperties(filter = {}) {
    const props = getRaw(KEYS.PROPERTIES, DEFAULT_PROPERTIES);
    return props.filter(p => {
      if (filter.category && filter.category !== 'all') {
        if (filter.category === 'new') {
          if (!p.isNew && p.category !== 'new') return false;
        } else if (p.category !== filter.category) {
          return false;
        }
      }
      if (filter.type && filter.type !== 'all' && p.type.toLowerCase() !== filter.type.toLowerCase()) {
        return false;
      }
      if (filter.status && filter.status !== 'all' && p.status !== filter.status) {
        return false;
      }
      if (filter.query) {
        const q = filter.query.toLowerCase();
        const match = (p.name && p.name.toLowerCase().includes(q)) ||
                      (p.location && p.location.toLowerCase().includes(q)) ||
                      (p.address && p.address.toLowerCase().includes(q)) ||
                      (p.type && p.type.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (filter.budget) {
        const cost = p.priceNum || 0;
        if (filter.budget === '1m' && cost > 1000000) return false;
        if (filter.budget === '5m' && (cost < 1000000 || cost > 5000000)) return false;
        if (filter.budget === '10m' && (cost < 5000000 || cost > 10000000)) return false;
        if (filter.budget === '10m+' && cost < 10000000) return false;
      }
      return true;
    });
  }

  function getPropertyById(id) {
    const props = getRaw(KEYS.PROPERTIES, DEFAULT_PROPERTIES);
    return props.find(p => p.id === Number(id)) || null;
  }

  function addProperty(propData) {
    const props = getRaw(KEYS.PROPERTIES, DEFAULT_PROPERTIES);
    const nextId = props.length > 0 ? Math.max(...props.map(p => p.id || 0)) + 1 : 1;
    const newProp = {
      id: nextId,
      name: propData.name || 'Exclusive Luxury Residence',
      type: propData.type || 'Villa',
      category: propData.category || (propData.type === 'Rent' ? 'rent' : 'buy'),
      price: propData.price.startsWith('$') ? propData.price : `$${Number(propData.price).toLocaleString()}`,
      priceNum: Number(String(propData.price).replace(/[^0-9]/g, '')) || 0,
      location: propData.location || 'Beverly Hills, CA',
      address: propData.address || `${propData.location || 'Private Gated Enclave'}`,
      beds: Number(propData.beds) || 4,
      baths: Number(propData.baths) || 4,
      sqft: Number(propData.sqft) || 5000,
      yearBuilt: Number(propData.yearBuilt) || new Date().getFullYear(),
      hoa: propData.hoa || '$1,500/mo',
      garage: propData.garage || '2-Car Garage',
      propertyId: `LUX-PROP-${nextId.toString().padStart(4, '0')}`,
      rating: 5.0,
      reviewsCount: 1,
      badge: propData.badge || (propData.category === 'rent' ? 'For Rent' : 'For Sale'),
      status: propData.status || 'active',
      isNew: propData.isNew || false,
      agent: propData.agent || {
        name: 'Victoria Sterling',
        role: 'Senior Luxury Specialist',
        phone: '+1 (212) 555-8821',
        email: 'victoria@luxestate.com',
        initials: 'VS'
      },
      img: propData.img || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
      gallery: propData.gallery && propData.gallery.length ? propData.gallery : [
        propData.img || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80'
      ],
      description: propData.description || 'An exquisite luxury estate featuring world-class finishes, high ceilings, seamless indoor-outdoor living, and state-of-the-art security.',
      features: propData.features && propData.features.length ? propData.features : [
        'Private Swimming Pool',
        'Smart Home Automation',
        'Floor-to-Ceiling Windows',
        'Designer Chef Kitchen',
        'Gated Privacy & Security',
        'Spa & Sauna Suite'
      ],
      listed: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    props.unshift(newProp);
    setRaw(KEYS.PROPERTIES, props);

    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      apiFetch('/api/properties', {
        method: 'POST',
        body: JSON.stringify(newProp)
      }).then(res => {
        if (res && res.property && res.property.id) {
          const currentProps = getRaw(KEYS.PROPERTIES, []);
          const idx = currentProps.findIndex(p => p.id === nextId);
          if (idx !== -1) {
            currentProps[idx].id = res.property.id;
            setRaw(KEYS.PROPERTIES, currentProps);
          }
        }
      }).catch(err => console.debug('Backend property sync notice:', err.message));
    }

    return newProp;
  }

  function updateProperty(id, data) {
    const props = getRaw(KEYS.PROPERTIES, DEFAULT_PROPERTIES);
    const idx = props.findIndex(p => p.id === Number(id));
    if (idx === -1) return null;

    props[idx] = { ...props[idx], ...data };
    if (data.price && !data.priceNum) {
      props[idx].priceNum = Number(String(data.price).replace(/[^0-9]/g, '')) || 0;
    }
    setRaw(KEYS.PROPERTIES, props);

    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      apiFetch(`/api/properties/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }).catch(err => console.debug('Backend property update notice:', err.message));
    }

    return props[idx];
  }

  function deleteProperty(id) {
    let props = getRaw(KEYS.PROPERTIES, DEFAULT_PROPERTIES);
    props = props.filter(p => p.id !== Number(id));
    setRaw(KEYS.PROPERTIES, props);

    // Also remove from favorites if present
    removeFavorite(id);

    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      apiFetch(`/api/properties/${id}`, {
        method: 'DELETE'
      }).catch(err => console.debug('Backend property delete notice:', err.message));
    }

    return true;
  }

  // ----------------------------------------------------------
  // Inquiries & Tour Requests API
  // ----------------------------------------------------------
  function getInquiries() {
    return getRaw(KEYS.INQUIRIES, DEFAULT_INQUIRIES);
  }

  function addInquiry(inquiryData) {
    const inqs = getRaw(KEYS.INQUIRIES, DEFAULT_INQUIRIES);
    const nextId = inqs.length > 0 ? Math.max(...inqs.map(i => i.id || 0)) + 1 : 1;
    const newInq = {
      id: nextId,
      sender: inquiryData.sender || 'Discerning Client',
      email: inquiryData.email || '',
      phone: inquiryData.phone || '',
      property: inquiryData.property || 'General Inquiry',
      propertyId: inquiryData.propertyId || null,
      interest: inquiryData.interest || 'buy',
      budget: inquiryData.budget || 'Flexible',
      tourType: inquiryData.tourType || 'Standard Inquiry',
      date: inquiryData.date || 'Earliest Convenience',
      message: inquiryData.message || 'I am interested in receiving more information regarding this property.',
      time: 'Just now',
      timestamp: Date.now(),
      unread: true,
      replies: []
    };
    inqs.unshift(newInq);
    setRaw(KEYS.INQUIRIES, inqs);

    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      apiFetch('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({
          sender: newInq.sender,
          email: newInq.email,
          phone: newInq.phone,
          property: newInq.property,
          propertyId: newInq.propertyId,
          interest: newInq.interest,
          budget: newInq.budget,
          tourType: newInq.tourType,
          date: newInq.date,
          message: newInq.message
        })
      }).then(res => {
        if (res && res.inquiryId) {
          const curInqs = getRaw(KEYS.INQUIRIES, []);
          const idx = curInqs.findIndex(i => i.id === nextId);
          if (idx !== -1) {
            curInqs[idx].id = res.inquiryId;
            setRaw(KEYS.INQUIRIES, curInqs);
          }
        }
      }).catch(err => console.debug('Backend inquiry sync notice:', err.message));
    }

    return newInq;
  }

  function markInquiryRead(id) {
    const inqs = getRaw(KEYS.INQUIRIES, DEFAULT_INQUIRIES);
    const item = inqs.find(i => i.id === Number(id));
    if (item) {
      item.unread = false;
      setRaw(KEYS.INQUIRIES, inqs);
      if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
        apiFetch(`/api/inquiries/${id}/read`, { method: 'POST' }).catch(() => {});
      }
    }
    return item;
  }

  function replyInquiry(id, replyText) {
    const inqs = getRaw(KEYS.INQUIRIES, DEFAULT_INQUIRIES);
    const item = inqs.find(i => i.id === Number(id));
    if (item) {
      item.unread = false;
      if (!item.replies) item.replies = [];
      item.replies.push(replyText);
      setRaw(KEYS.INQUIRIES, inqs);
      if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
        apiFetch(`/api/inquiries/${id}/reply`, {
          method: 'POST',
          body: JSON.stringify({ reply: replyText })
        }).catch(err => console.debug('Backend reply sync notice:', err.message));
      }
    }
    return item;
  }

  function deleteInquiry(id) {
    let inqs = getRaw(KEYS.INQUIRIES, DEFAULT_INQUIRIES);
    inqs = inqs.filter(i => i.id !== Number(id));
    setRaw(KEYS.INQUIRIES, inqs);
    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      apiFetch(`/api/inquiries/${id}`, { method: 'DELETE' }).catch(() => {});
    }
    return true;
  }

  // ----------------------------------------------------------
  // Clients CRM API
  // ----------------------------------------------------------
  function getClients() {
    return getRaw(KEYS.CLIENTS, DEFAULT_CLIENTS);
  }

  function addClient(clientData) {
    const clients = getRaw(KEYS.CLIENTS, DEFAULT_CLIENTS);
    const nextId = clients.length > 0 ? Math.max(...clients.map(c => c.id || 0)) + 1 : 1;
    const name = clientData.name || 'New Client';
    const parts = name.split(' ');
    const initials = (parts[0][0] + (parts[1] ? parts[1][0] : parts[0][1] || '')).toUpperCase();
    const colors = [
      'linear-gradient(135deg,#c9a84c,#6b4f1a)',
      'linear-gradient(135deg,#4a6fa5,#1e3a5f)',
      'linear-gradient(135deg,#4ca87a,#1a5f3a)',
      'linear-gradient(135deg,#a84c6f,#5f1a3a)',
      'linear-gradient(135deg,#c084fc,#7c3aed)'
    ];
    const newClient = {
      id: nextId,
      name,
      initials,
      color: colors[nextId % colors.length],
      email: clientData.email || '',
      phone: clientData.phone || '',
      location: clientData.location || 'United States',
      tier: clientData.tier || 'gold',
      deals: Number(clientData.deals) || 0,
      spend: clientData.spend || '$0',
      interest: clientData.interest || 'Buying'
    };
    clients.unshift(newClient);
    setRaw(KEYS.CLIENTS, clients);

    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      apiFetch('/api/clients', {
        method: 'POST',
        body: JSON.stringify(newClient)
      }).then(res => {
        if (res && res.client && res.client.id) {
          const curClients = getRaw(KEYS.CLIENTS, []);
          const idx = curClients.findIndex(c => c.id === nextId);
          if (idx !== -1) {
            curClients[idx].id = res.client.id;
            setRaw(KEYS.CLIENTS, curClients);
          }
        }
      }).catch(err => console.debug('Backend client sync notice:', err.message));
    }

    return newClient;
  }

  function deleteClient(id) {
    let clients = getRaw(KEYS.CLIENTS, DEFAULT_CLIENTS);
    clients = clients.filter(c => c.id !== Number(id));
    setRaw(KEYS.CLIENTS, clients);
    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      apiFetch(`/api/clients/${id}`, { method: 'DELETE' }).catch(() => {});
    }
    return true;
  }

  // ----------------------------------------------------------
  // Favorites API
  // ----------------------------------------------------------
  function getFavorites() {
    return getRaw(KEYS.FAVORITES, []);
  }

  function isFavorite(propId) {
    const favs = getFavorites();
    return favs.includes(Number(propId));
  }

  function toggleFavorite(propId) {
    let favs = getFavorites();
    const num = Number(propId);
    if (favs.includes(num)) {
      favs = favs.filter(id => id !== num);
    } else {
      favs.push(num);
    }
    setRaw(KEYS.FAVORITES, favs);

    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      apiFetch('/api/favorites/toggle', {
        method: 'POST',
        body: JSON.stringify({ propertyId: num })
      }).catch(() => {});
    }

    return favs.includes(num);
  }

  function removeFavorite(propId) {
    let favs = getFavorites();
    favs = favs.filter(id => id !== Number(propId));
    setRaw(KEYS.FAVORITES, favs);

    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      apiFetch('/api/favorites/toggle', {
        method: 'POST',
        body: JSON.stringify({ propertyId: Number(propId) })
      }).catch(() => {});
    }
  }

  function getFavoriteProperties() {
    const favIds = getFavorites();
    const props = getProperties();
    return props.filter(p => favIds.includes(p.id));
  }

  // ----------------------------------------------------------
  // Auth API
  // ----------------------------------------------------------
  function getAuth() {
    return getRaw(KEYS.AUTH, null);
  }

  function isAuthenticated() {
    const auth = getAuth();
    return auth && !!auth.role;
  }

  function isAdmin() {
    const auth = getAuth();
    return auth && auth.role === 'admin';
  }

  async function login(username, password, role) {
    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      try {
        const res = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password })
        });
        if (res && res.token && res.user) {
          if (role && res.user.role !== role) {
            return { success: false, error: role === 'admin'
              ? 'This account is not an administrator. Please use User Login.'
              : 'Please use the Admin Portal for this administrator account.' };
          }
          setToken(res.token);
          const authData = {
            username: res.user.username,
            role: res.user.role,
            email: res.user.email,
            ts: Date.now()
          };
          setRaw(KEYS.AUTH, authData);
          return { success: true, user: authData };
        }
      } catch (err) {
        return { success: false, error: err.message || 'Unable to connect to the server. Please start the application server and try again.' };
      }
    }
    return { success: false, error: 'Please open this website through the application server (http://localhost:3000), not as a local file.' };
  }


  async function register(username, email, password) {
    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      try {
        const res = await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ username, email, password })
        });
        if (res && res.token && res.user) {
          setToken(res.token);
          const authData = {
            username: res.user.username,
            role: res.user.role,
            email: res.user.email,
            ts: Date.now()
          };
          setRaw(KEYS.AUTH, authData);
          return { success: true, user: authData };
        }
        return { success: false, error: 'Registration could not be completed.' };
      } catch (err) {
        return { success: false, error: err.message || 'Unable to register. Please try again.' };
      }
    }
    return { success: false, error: 'Please open this website through the application server (http://localhost:3000).' };
  }

  async function logout() {
    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      try {
        await apiFetch('/api/auth/logout', { method: 'POST' });
      } catch (_) {}
    }
    setToken(null);
    localStorage.removeItem(KEYS.AUTH);
    window.location.href = 'login.html';
  }

  // ----------------------------------------------------------
  // Public Interface
  // ----------------------------------------------------------
  return {
    init,
    syncFromBackend,
    // Properties
    getProperties,
    getPropertyById,
    addProperty,
    updateProperty,
    deleteProperty,
    // Inquiries
    getInquiries,
    addInquiry,
    markInquiryRead,
    replyInquiry,
    deleteInquiry,
    // Clients
    getClients,
    addClient,
    deleteClient,
    // Favorites
    getFavorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    getFavoriteProperties,
    // Auth
    getAuth,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    getToken
  };
})();

// Expose the store to login.html and other classic browser scripts.
// Top-level `const` declarations are not properties of `window`.
if (typeof window !== 'undefined') {
  window.LuxStore = LuxStore;
}
