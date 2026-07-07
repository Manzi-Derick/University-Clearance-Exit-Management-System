-- UniClear Oracle schema
-- Run as the application schema owner in SQL Developer.

BEGIN
  FOR obj IN (
    SELECT object_name, object_type
    FROM user_objects
    WHERE object_name IN (
      'AUDIT_LOGS', 'NOTIFICATIONS', 'CLEARANCE_REQUESTS', 'USERS', 'DEPARTMENTS',
      'AUDIT_LOGS_SEQ', 'NOTIFICATIONS_SEQ', 'CLEARANCE_REQUESTS_SEQ', 'USERS_SEQ', 'DEPARTMENTS_SEQ'
    )
  ) LOOP
    IF obj.object_type = 'TABLE' THEN
      EXECUTE IMMEDIATE 'DROP TABLE ' || obj.object_name || ' CASCADE CONSTRAINTS';
    ELSIF obj.object_type = 'SEQUENCE' THEN
      EXECUTE IMMEDIATE 'DROP SEQUENCE ' || obj.object_name;
    END IF;
  END LOOP;
END;
/

CREATE TABLE departments (
  department_id NUMBER PRIMARY KEY,
  department_name VARCHAR2(120) NOT NULL,
  is_active CHAR(1) DEFAULT 'Y' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT departments_name_uq UNIQUE (department_name),
  CONSTRAINT departments_active_ck CHECK (is_active IN ('Y', 'N'))
);

CREATE TABLE users (
  user_id NUMBER PRIMARY KEY,
  name VARCHAR2(160) NOT NULL,
  email VARCHAR2(180) NOT NULL,
  password_hash VARCHAR2(255) NOT NULL,
  role VARCHAR2(20) NOT NULL,
  student_id VARCHAR2(40),
  department_id NUMBER,
  status VARCHAR2(20) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP,
  CONSTRAINT users_email_uq UNIQUE (email),
  CONSTRAINT users_student_id_uq UNIQUE (student_id),
  CONSTRAINT users_role_ck CHECK (role IN ('student', 'officer', 'admin')),
  CONSTRAINT users_status_ck CHECK (status IN ('active', 'inactive')),
  CONSTRAINT users_department_fk FOREIGN KEY (department_id) REFERENCES departments(department_id),
  CONSTRAINT users_student_role_ck CHECK (
    (role = 'student' AND student_id IS NOT NULL AND department_id IS NULL)
    OR (role = 'officer' AND student_id IS NULL AND department_id IS NOT NULL)
    OR (role = 'admin' AND student_id IS NULL)
  )
);

CREATE TABLE clearance_requests (
  request_id NUMBER PRIMARY KEY,
  user_id NUMBER NOT NULL,
  department_id NUMBER NOT NULL,
  status VARCHAR2(20) DEFAULT 'pending' NOT NULL,
  remarks VARCHAR2(1000),
  reviewed_by NUMBER,
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  review_date TIMESTAMP,
  CONSTRAINT clearance_user_fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT clearance_department_fk FOREIGN KEY (department_id) REFERENCES departments(department_id),
  CONSTRAINT clearance_reviewer_fk FOREIGN KEY (reviewed_by) REFERENCES users(user_id),
  CONSTRAINT clearance_status_ck CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT clearance_review_ck CHECK (
    (status = 'pending' AND reviewed_by IS NULL AND review_date IS NULL)
    OR (status IN ('approved', 'rejected') AND reviewed_by IS NOT NULL AND review_date IS NOT NULL)
  )
);

CREATE UNIQUE INDEX clearance_active_uq
  ON clearance_requests (
    user_id,
    department_id,
    CASE WHEN status IN ('pending', 'approved') THEN 1 ELSE NULL END
  );

CREATE TABLE notifications (
  notification_id NUMBER PRIMARY KEY,
  user_id NUMBER NOT NULL,
  title VARCHAR2(160) NOT NULL,
  message VARCHAR2(1000) NOT NULL,
  type VARCHAR2(40) NOT NULL,
  request_id NUMBER,
  is_read CHAR(1) DEFAULT 'N' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT notifications_user_fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT notifications_request_fk FOREIGN KEY (request_id) REFERENCES clearance_requests(request_id) ON DELETE CASCADE,
  CONSTRAINT notifications_read_ck CHECK (is_read IN ('Y', 'N'))
);

CREATE TABLE audit_logs (
  audit_id NUMBER PRIMARY KEY,
  actor_user_id NUMBER,
  action VARCHAR2(80) NOT NULL,
  entity_type VARCHAR2(80) NOT NULL,
  entity_id NUMBER,
  details VARCHAR2(2000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT audit_actor_fk FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE SEQUENCE departments_seq START WITH 10 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE users_seq START WITH 20 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE clearance_requests_seq START WITH 100 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE notifications_seq START WITH 100 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE audit_logs_seq START WITH 100 INCREMENT BY 1 NOCACHE;

CREATE OR REPLACE TRIGGER departments_bi
BEFORE INSERT ON departments
FOR EACH ROW
BEGIN
  IF :NEW.department_id IS NULL THEN
    SELECT departments_seq.NEXTVAL INTO :NEW.department_id FROM dual;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER users_bi
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  IF :NEW.user_id IS NULL THEN
    SELECT users_seq.NEXTVAL INTO :NEW.user_id FROM dual;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER users_bu
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
  :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

CREATE OR REPLACE TRIGGER clearance_requests_bi
BEFORE INSERT ON clearance_requests
FOR EACH ROW
BEGIN
  IF :NEW.request_id IS NULL THEN
    SELECT clearance_requests_seq.NEXTVAL INTO :NEW.request_id FROM dual;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER notifications_bi
BEFORE INSERT ON notifications
FOR EACH ROW
BEGIN
  IF :NEW.notification_id IS NULL THEN
    SELECT notifications_seq.NEXTVAL INTO :NEW.notification_id FROM dual;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER audit_logs_bi
BEFORE INSERT ON audit_logs
FOR EACH ROW
BEGIN
  IF :NEW.audit_id IS NULL THEN
    SELECT audit_logs_seq.NEXTVAL INTO :NEW.audit_id FROM dual;
  END IF;
END;
/

CREATE INDEX users_role_status_idx ON users(role, status);
CREATE INDEX users_department_idx ON users(department_id);
CREATE INDEX clearance_user_idx ON clearance_requests(user_id, status);
CREATE INDEX clearance_department_idx ON clearance_requests(department_id, status);
CREATE INDEX clearance_review_date_idx ON clearance_requests(review_date);
CREATE INDEX notifications_user_idx ON notifications(user_id, is_read, created_at);
CREATE INDEX audit_entity_idx ON audit_logs(entity_type, entity_id);

-- Password for all sample users: password123
INSERT INTO departments (department_id, department_name) VALUES (1, 'Library');
INSERT INTO departments (department_id, department_name) VALUES (2, 'Finance');
INSERT INTO departments (department_id, department_name) VALUES (3, 'IT Department');
INSERT INTO departments (department_id, department_name) VALUES (4, 'Academic Registry');
INSERT INTO departments (department_id, department_name) VALUES (5, 'Student Affairs');

INSERT INTO users (user_id, name, email, password_hash, role, status)
VALUES (1, 'System Admin', 'admin@university.edu', '$2b$10$YULP8HlMvoxurqcsiX1DMe1cEKJc4Eei50YhQZv6w2byMQ4LS8NMu', 'admin', 'active');

INSERT INTO users (user_id, name, email, password_hash, role, department_id, status)
VALUES (2, 'Library Officer', 'library@university.edu', '$2b$10$YULP8HlMvoxurqcsiX1DMe1cEKJc4Eei50YhQZv6w2byMQ4LS8NMu', 'officer', 1, 'active');

INSERT INTO users (user_id, name, email, password_hash, role, department_id, status)
VALUES (3, 'Finance Officer', 'finance@university.edu', '$2b$10$YULP8HlMvoxurqcsiX1DMe1cEKJc4Eei50YhQZv6w2byMQ4LS8NMu', 'officer', 2, 'active');

INSERT INTO users (user_id, name, email, password_hash, role, department_id, status)
VALUES (4, 'IT Officer', 'it@university.edu', '$2b$10$YULP8HlMvoxurqcsiX1DMe1cEKJc4Eei50YhQZv6w2byMQ4LS8NMu', 'officer', 3, 'active');

INSERT INTO users (user_id, name, email, password_hash, role, department_id, status)
VALUES (5, 'Registry Officer', 'registry@university.edu', '$2b$10$YULP8HlMvoxurqcsiX1DMe1cEKJc4Eei50YhQZv6w2byMQ4LS8NMu', 'officer', 4, 'active');

INSERT INTO users (user_id, name, email, password_hash, role, department_id, status)
VALUES (6, 'Student Affairs Officer', 'affairs@university.edu', '$2b$10$YULP8HlMvoxurqcsiX1DMe1cEKJc4Eei50YhQZv6w2byMQ4LS8NMu', 'officer', 5, 'active');

INSERT INTO users (user_id, name, email, password_hash, role, student_id, status)
VALUES (8, 'John Doe', 'john@university.edu', '$2b$10$YULP8HlMvoxurqcsiX1DMe1cEKJc4Eei50YhQZv6w2byMQ4LS8NMu', 'student', 'STU001', 'active');

INSERT INTO users (user_id, name, email, password_hash, role, student_id, status)
VALUES (9, 'Jane Smith', 'jane@university.edu', '$2b$10$YULP8HlMvoxurqcsiX1DMe1cEKJc4Eei50YhQZv6w2byMQ4LS8NMu', 'student', 'STU002', 'active');

INSERT INTO clearance_requests (request_id, user_id, department_id, status, reviewed_by, remarks, request_date, review_date)
VALUES (1, 8, 1, 'approved', 2, 'No outstanding library materials.', SYSTIMESTAMP - INTERVAL '3' DAY, SYSTIMESTAMP - INTERVAL '2' DAY);

INSERT INTO clearance_requests (request_id, user_id, department_id, status, request_date)
VALUES (2, 8, 2, 'pending', SYSTIMESTAMP - INTERVAL '1' DAY);

INSERT INTO clearance_requests (request_id, user_id, department_id, status, reviewed_by, remarks, request_date, review_date)
VALUES (3, 9, 1, 'rejected', 2, 'Outstanding library book.', SYSTIMESTAMP - INTERVAL '4' DAY, SYSTIMESTAMP - INTERVAL '3' DAY);

INSERT INTO notifications (notification_id, user_id, title, message, type, request_id, is_read)
VALUES (1, 8, 'Clearance approved', 'Library approved your clearance request.', 'request_approved', 1, 'N');

INSERT INTO notifications (notification_id, user_id, title, message, type, request_id, is_read)
VALUES (2, 3, 'New clearance request', 'A student submitted a clearance request for Finance.', 'new_request', 2, 'N');

INSERT INTO notifications (notification_id, user_id, title, message, type, request_id, is_read)
VALUES (3, 9, 'Clearance rejected', 'Library rejected your clearance request. Remarks: Outstanding library book.', 'request_rejected', 3, 'N');

INSERT INTO audit_logs (audit_id, actor_user_id, action, entity_type, entity_id, details)
VALUES (1, 1, 'schema_seeded', 'system', NULL, 'Initial UniClear schema and seed data loaded.');

COMMIT;
