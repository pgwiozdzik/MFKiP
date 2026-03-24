CREATE SCHEMA IF NOT EXISTS mfkip;


CREATE TABLE IF NOT EXISTS mfkip.days (
                                          id SERIAL PRIMARY KEY,
                                          name VARCHAR(255) NOT NULL,
    date DATE,
    is_active BOOLEAN DEFAULT FALSE
    );

CREATE TABLE IF NOT EXISTS mfkip.volunteers (
                                                id SERIAL PRIMARY KEY,
                                                name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    notes TEXT
    );

CREATE TABLE IF NOT EXISTS mfkip.performances (
                                                  id SERIAL PRIMARY KEY,
                                                  day_id INTEGER NOT NULL,
                                                  planned_start_time TIME NOT NULL,
                                                  changed_start_time TIME,
                                                  actual_start_time TIME,
                                                  performer_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'none',
    volunteer_id INTEGER,
    is_break BOOLEAN DEFAULT FALSE,
    end_time TIME,
    CONSTRAINT fk_volunteer FOREIGN KEY (volunteer_id) REFERENCES mfkip.volunteers(id),
    CONSTRAINT fk_day FOREIGN KEY (day_id) REFERENCES mfkip.days(id)
    );

INSERT INTO mfkip.days (name, date)
VALUES
    ('Czwartek', '2026-01-15'),
    ('Piątek', '2026-01-16'),
    ('Sobota', '2026-01-17'),
    ('Niedziela', '2026-01-18')
    ON CONFLICT DO NOTHING;