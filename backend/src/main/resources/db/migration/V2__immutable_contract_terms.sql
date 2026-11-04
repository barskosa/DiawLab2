-- V1 já foi aplicada: esta evolução preserva os contratos existentes e a API pública.
ALTER TABLE rental_contracts ADD COLUMN snapshot_vehicle_registration VARCHAR(60);
ALTER TABLE rental_contracts ADD COLUMN snapshot_vehicle_year INTEGER;
ALTER TABLE rental_contracts ADD COLUMN snapshot_vehicle_brand VARCHAR(80);
ALTER TABLE rental_contracts ADD COLUMN snapshot_vehicle_model VARCHAR(100);
ALTER TABLE rental_contracts ADD COLUMN snapshot_vehicle_plate VARCHAR(8);
ALTER TABLE rental_contracts ADD COLUMN snapshot_vehicle_daily_rate NUMERIC(14,2);
ALTER TABLE rental_contracts ADD COLUMN snapshot_vehicle_category VARCHAR(60);
ALTER TABLE rental_contracts ADD COLUMN snapshot_client_name VARCHAR(150);
ALTER TABLE rental_contracts ADD COLUMN snapshot_owner_name VARCHAR(150);
ALTER TABLE rental_contracts ADD COLUMN snapshot_bank_name VARCHAR(150);

-- O preenchimento inicial usa os dados conhecidos no momento da migração.
-- Para novos contratos as cópias são feitas exclusivamente durante a assinatura.
UPDATE rental_contracts SET
    snapshot_vehicle_registration = (SELECT v.registration FROM rental_orders o JOIN vehicles v ON v.id=o.vehicle_id WHERE o.id=rental_contracts.order_id),
    snapshot_vehicle_year = (SELECT v.manufacture_year FROM rental_orders o JOIN vehicles v ON v.id=o.vehicle_id WHERE o.id=rental_contracts.order_id),
    snapshot_vehicle_brand = (SELECT v.brand FROM rental_orders o JOIN vehicles v ON v.id=o.vehicle_id WHERE o.id=rental_contracts.order_id),
    snapshot_vehicle_model = (SELECT v.model FROM rental_orders o JOIN vehicles v ON v.id=o.vehicle_id WHERE o.id=rental_contracts.order_id),
    snapshot_vehicle_plate = (SELECT v.plate FROM rental_orders o JOIN vehicles v ON v.id=o.vehicle_id WHERE o.id=rental_contracts.order_id),
    snapshot_vehicle_category = (SELECT v.category FROM rental_orders o JOIN vehicles v ON v.id=o.vehicle_id WHERE o.id=rental_contracts.order_id),
    snapshot_vehicle_daily_rate = (SELECT o.total_amount / CASE WHEN o.start_date=o.end_date THEN 1 ELSE EXTRACT(DAY FROM (CAST(o.end_date AS TIMESTAMP)-CAST(o.start_date AS TIMESTAMP))) END FROM rental_orders o WHERE o.id=rental_contracts.order_id),
    snapshot_client_name = (SELECT u.name FROM rental_orders o JOIN app_users u ON u.id=o.client_id WHERE o.id=rental_contracts.order_id),
    snapshot_owner_name = (SELECT u.name FROM app_users u WHERE u.id=rental_contracts.owner_id),
    snapshot_bank_name = (SELECT u.name FROM app_users u WHERE u.id=rental_contracts.bank_id);

ALTER TABLE rental_contracts ALTER COLUMN snapshot_vehicle_registration SET NOT NULL;
ALTER TABLE rental_contracts ALTER COLUMN snapshot_vehicle_year SET NOT NULL;
ALTER TABLE rental_contracts ALTER COLUMN snapshot_vehicle_brand SET NOT NULL;
ALTER TABLE rental_contracts ALTER COLUMN snapshot_vehicle_model SET NOT NULL;
ALTER TABLE rental_contracts ALTER COLUMN snapshot_vehicle_plate SET NOT NULL;
ALTER TABLE rental_contracts ALTER COLUMN snapshot_vehicle_daily_rate SET NOT NULL;
ALTER TABLE rental_contracts ALTER COLUMN snapshot_vehicle_category SET NOT NULL;
ALTER TABLE rental_contracts ALTER COLUMN snapshot_client_name SET NOT NULL;
ALTER TABLE rental_contracts ALTER COLUMN snapshot_owner_name SET NOT NULL;

-- CHECK aceita UNKNOWN no SQL; IS NOT NULL impede que um crédito incompleto passe nessa regra.
ALTER TABLE rental_contracts ADD CONSTRAINT valid_credit_complete CHECK (
    (bank_id IS NULL AND credit_amount IS NULL AND interest_rate IS NULL AND installments IS NULL AND snapshot_bank_name IS NULL)
    OR (bank_id IS NOT NULL AND credit_amount IS NOT NULL AND interest_rate IS NOT NULL AND installments IS NOT NULL
        AND snapshot_bank_name IS NOT NULL AND credit_amount > 0 AND interest_rate >= 0 AND installments BETWEEN 1 AND 600)
);
