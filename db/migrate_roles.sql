-- Migration: add normalized roles table and enforce users.role via FK.
BEGIN;

CREATE TABLE IF NOT EXISTS roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(30) UNIQUE NOT NULL
);

INSERT INTO roles (role_name) VALUES
('ADMIN'),
('MANAGER'),
('ASSISTANT_MANAGER'),
('TEACHER'),
('STUDENT')
ON CONFLICT (role_name) DO NOTHING;

-- Add FK constraint if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_role_fk'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_role_fk
      FOREIGN KEY (role) REFERENCES roles(role_name);
  END IF;
END $$;

COMMIT;
