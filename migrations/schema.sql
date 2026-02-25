CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    config TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id TEXT NOT NULL,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending',
    custom_fields TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id)
);

CREATE TABLE IF NOT EXISTS site_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id TEXT NOT NULL,
    field_name TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type TEXT NOT NULL,
    field_options TEXT,
    is_required INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    placeholder TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id),
    UNIQUE(site_id, field_name)
);

CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bun_partner_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    event_date TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bun_partner_sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_name TEXT NOT NULL,
    product_type TEXT,
    region TEXT,
    support_condition TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inquiries_site_id ON inquiries(site_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_site_fields_site_id ON site_fields(site_id);
CREATE INDEX IF NOT EXISTS idx_bun_partner_events_date ON bun_partner_events(event_date);
CREATE INDEX IF NOT EXISTS idx_bun_partner_sites_created ON bun_partner_sites(created_at);

INSERT OR IGNORE INTO sites (id, name, domain) VALUES
    ('band-program', '분양리더 - 밴드홍보대행', NULL),
    ('marketing', '분양리더마케팅', 'https://분양리더애드.com');

INSERT OR IGNORE INTO site_fields (site_id, field_name, field_label, field_type, field_options, is_required, display_order) VALUES
    ('band-program', 'product_type', '상품유형', 'select', '["베이직(100만원)", "프리미엄(200만원)", "VIP(300만원)"]', 1, 1),
    ('marketing', 'productType', '상품유형', 'select', '["메타광고", "당근광고", "구글GDN광고", "호갱노노광고", "블로그광고", "LMS문자광고"]', 1, 1);

INSERT OR IGNORE INTO admins (username, password) VALUES
    ('admin', 'admin123');
