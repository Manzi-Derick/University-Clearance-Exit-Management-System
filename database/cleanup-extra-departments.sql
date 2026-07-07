-- UniClear Database Cleanup Script
-- Run this in SQL Developer or Oracle SQL*Plus to remove extra departments
-- This will keep only Library, Finance, and IT Department

SET DEFINE OFF;

-- First, check what departments exist
SELECT department_id, department_name FROM departments;

-- Delete officers from unwanted departments (Hostel, Academic Affairs, Sports & Recreation)
DELETE FROM users WHERE department_id IN (4, 5, 6);

-- Delete clearance requests for unwanted departments
DELETE FROM clearance_requests WHERE department_id IN (4, 5, 6);

-- Now delete the unwanted departments
DELETE FROM departments WHERE department_id IN (4, 5, 6);

-- Verify only Library, Finance, and IT remain
SELECT department_id, department_name FROM departments;

COMMIT;

PROMPT Cleanup complete! Only Library, Finance, and IT Department should remain.
