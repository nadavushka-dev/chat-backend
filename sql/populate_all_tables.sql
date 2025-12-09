-- wipe existing rows only
-- TRUNCATE messages, room_participants, rooms, users RESTART IDENTITY CASCADE;

-- 1) two users
INSERT INTO users (name, email, password_hash)
VALUES
  ('alice', 'alice@example.com', 'hash1'),
  ('bob',   'bob@example.com',   'hash2');

-- 2) two rooms
INSERT INTO rooms (name, created_by)
VALUES
  ('general', 1),
  ('random',  2);

-- 3) memberships
INSERT INTO room_participants (room_id, user_id)
VALUES
  (1, 1), (1, 2),
  (2, 1), (2, 2);

-- 4) two messages
INSERT INTO messages (room_id, sender_id, body)
VALUES
  (1, 1, 'Hi everyone in general!'),
  (2, 2, 'Random chatter here.');
