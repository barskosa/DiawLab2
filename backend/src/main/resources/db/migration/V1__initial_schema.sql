CREATE TABLE app_users (
    id UUID PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('CLIENT','COMPANY','BANK')),
    rg VARCHAR(30),
    cpf VARCHAR(11) UNIQUE,
    address VARCHAR(500),
    profession VARCHAR(120),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    version BIGINT NOT NULL DEFAULT 0
);
CREATE TABLE employments (
    client_id UUID NOT NULL REFERENCES app_users(id),
    position INTEGER NOT NULL CHECK (position >= 0 AND position < 3),
    employer VARCHAR(150) NOT NULL,
    income NUMERIC(14,2) NOT NULL CHECK (income > 0),
    PRIMARY KEY (client_id,position)
);
CREATE TABLE vehicles (
    id UUID PRIMARY KEY,
    registration VARCHAR(60) NOT NULL UNIQUE,
    manufacture_year INTEGER NOT NULL CHECK (manufacture_year >= 1900),
    brand VARCHAR(80) NOT NULL,
    model VARCHAR(100) NOT NULL,
    plate VARCHAR(8) NOT NULL UNIQUE,
    daily_rate NUMERIC(14,2) NOT NULL CHECK (daily_rate > 0),
    category VARCHAR(60) NOT NULL,
    owner_id UUID NOT NULL REFERENCES app_users(id),
    version BIGINT NOT NULL DEFAULT 0
);
CREATE TABLE rental_orders (
    id UUID PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES app_users(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL CHECK (end_date >= start_date),
    total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING','APPROVED','REJECTED','CONTRACTED','CANCELLED')),
    notes VARCHAR(2000),
    review_notes VARCHAR(2000),
    reviewed_by_id UUID REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    version BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX idx_orders_client ON rental_orders(client_id);
CREATE INDEX idx_orders_vehicle_status ON rental_orders(vehicle_id,status);
CREATE TABLE rental_contracts (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL UNIQUE REFERENCES rental_orders(id),
    owner_id UUID NOT NULL REFERENCES app_users(id),
    signed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    bank_id UUID REFERENCES app_users(id),
    credit_amount NUMERIC(14,2),
    interest_rate NUMERIC(8,4),
    installments INTEGER,
    CONSTRAINT valid_credit CHECK (
        (bank_id IS NULL AND credit_amount IS NULL AND interest_rate IS NULL AND installments IS NULL)
        OR (bank_id IS NOT NULL AND credit_amount > 0 AND interest_rate >= 0 AND installments > 0)
    )
);
