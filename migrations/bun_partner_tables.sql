-- 분양파트너 일정·현장리스트 테이블 (기존 DB에 이미 schema.sql 적용된 경우 이 파일만 실행)
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

CREATE INDEX IF NOT EXISTS idx_bun_partner_events_date ON bun_partner_events(event_date);
CREATE INDEX IF NOT EXISTS idx_bun_partner_sites_created ON bun_partner_sites(created_at);
