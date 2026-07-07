-- Add Admin User to UniClear Database
-- Run this in SQL Developer to add the admin account

-- Insert System Admin user
INSERT INTO users (name, email, password_hash, role)
VALUES ('System Admin', 'admin@university.edu', '$2b$10$z3Ks.JaZsh1qOp5Y1sM91uZFppi1Cg4cO86QaSstnR7jISJnITvku', 'admin');

-- Commit the transaction
COMMIT;

-- Verify the admin was added
SELECT user_id, name, email, role FROM users WHERE role = 'admin';

-- You should see:
-- ADMIN | System Admin | admin@university.edu | admin
