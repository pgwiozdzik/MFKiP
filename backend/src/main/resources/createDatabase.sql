-- Create a dedicated schema for the MFKiP festival application to isolate its tables
CREATE SCHEMA IF NOT EXISTS mfkip;

/*
 * Table: days
 * Purpose: Stores the schedule of festival days.
 * Includes a boolean flag 'is_active' to determine which day is currently
 * visible and being managed on the frontend.
 */
CREATE TABLE IF NOT EXISTS mfkip.days (
                                          id SERIAL PRIMARY KEY,
                                          name VARCHAR(255) NOT NULL,
                                          date DATE,
                                          is_active BOOLEAN DEFAULT FALSE
);

/*
 * Table: volunteers
 * Purpose: Stores contact information and optional notes for festival volunteers.
 * These individuals are assigned to look after specific performances/performers.
 */
CREATE TABLE IF NOT EXISTS mfkip.volunteers (
                                                id SERIAL PRIMARY KEY,
                                                name VARCHAR(255) NOT NULL,
                                                phone VARCHAR(50),
                                                notes TEXT
);

/*
 * Table: performances
 * Purpose: The core scheduling table. Stores both performances and breaks.
 * Tracks planned schedule times versus actual real-world stage times.
 * Establishes foreign key relationships to both the 'days' and 'volunteers' tables.
 */
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

    -- Foreign key linking the performance to a specific festival day
                                                  CONSTRAINT fk_day FOREIGN KEY (day_id) REFERENCES mfkip.days(id),

    -- Foreign key linking the performance to an assigned volunteer (optional)
                                                  CONSTRAINT fk_volunteer FOREIGN KEY (volunteer_id) REFERENCES mfkip.volunteers(id)
);

/*
 * Function: set_changed_start_time_func
 * Purpose: A PL/pgSQL trigger function that ensures 'changed_start_time'
 * is never null upon creation. If a performance is created without a specific
 * changed time, it defaults to the 'planned_start_time'.
 */
CREATE OR REPLACE FUNCTION mfkip.set_changed_start_time_func()
    RETURNS TRIGGER AS $$
BEGIN
    IF NEW.changed_start_time IS NULL THEN
        NEW.changed_start_time := NEW.planned_start_time;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/*
 * Trigger: trg_set_changed_start_time
 * Purpose: Executes the 'set_changed_start_time_func' automatically
 * before any new row is inserted into the 'performances' table.
 */
CREATE TRIGGER trg_set_changed_start_time
    BEFORE INSERT ON mfkip.performances
    FOR EACH ROW
EXECUTE FUNCTION mfkip.set_changed_start_time_func();

-- ==========================================
-- SEED DATA: Initial population of the database
-- ==========================================

-- Insert the standard 4 days of the festival for the 2026 edition
INSERT INTO mfkip.days (name, date)
VALUES
    ('Czwartek', '2026-01-15'),
    ('Piątek', '2026-01-16'),
    ('Sobota', '2026-01-17'),
    ('Niedziela', '2026-01-18')
ON CONFLICT DO NOTHING;

-- Set the first day of the festival as the initially active day
UPDATE mfkip.days
SET is_active = TRUE
WHERE name = 'Czwartek';

-- Insert an initial batch of performances scheduled for the first day (Day ID 1)
INSERT INTO mfkip.performances
(day_id, planned_start_time, performer_name)
VALUES
    (1, '09:00', 'Solistka Joanna Wojciechowska z Wokalnego Atelier Małgorzaty Grancewicz'),
    (1, '09:10', 'Duet Wiktoria Taracińska i Joanna Wojciechowska z Wokalnego Atelier Małgorzaty Grancewicz'),
    (1, '09:20', 'Solista Leon Skorupski z Akademii Wokalnej Joanna Bortel'),
    (1, '09:30', 'Solistka Julia Kurczyńska z Siemianowic Śląskich'),
    (1, '09:40', 'Solistka Oliwia Kramek ze Studia Wokalnego Voicesing Joanna Kasperek-Szymonik'),
    (1, '09:50', 'Solistka Łucja Mieszczanin z Imielina'),
    (1, '10:00', 'Solistka Sarah Jokiel z Fundacji “Singart” w Gliwicach'),
    (1, '10:10', 'Solistka Aleksandra Skiba z Parku Kultury w Starachowicach'),
    (1, '10:20', 'Solistka Nikola Sowińska z Zespołu Szkół nr 13 SP nr 58 w Lublinie'),
    (1, '10:30', 'Solistka Karolina Musialik ze Studia Wokalnego Adrianny Noszczyk w Sosnowcu');