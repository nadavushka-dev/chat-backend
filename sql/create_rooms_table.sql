CREATE TABLE rooms (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by    INTEGER    NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

