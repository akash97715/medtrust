-- 1. Add a new location if it does not already exist.
INSERT INTO locations (city, district, state, country, distance_from_base_km, base_reference, notes)
VALUES ('Sample City', 'West Champaran', 'Bihar', 'India', 25, 'Raxaul to Sample City', 'New route')
ON CONFLICT (city, district, state, country) DO NOTHING;

-- 2. Add a new hospital or agency.
INSERT INTO parties (party_type, name, phone, location_id, address_line, notes)
VALUES (
    'hospital',
    'Sample Hospital',
    '9000000000',
    (SELECT id FROM locations WHERE city = 'Sample City' AND district = 'West Champaran' LIMIT 1),
    'Main Road, Sample City',
    'First introduction visit'
);

-- 3. Add a new product once, only in the unique product master.
INSERT INTO products (sku, product_name, product_category, unit_of_measure, preferred_brand, sample_priority, notes)
VALUES ('NEW-SKU', 'Sample Product', 'General', 'piece', NULL, TRUE, 'Add once in master list');

-- 4. Record a hospital/agency visit.
INSERT INTO visits (party_id, visit_date, visit_purpose, visit_status, location_snapshot, distance_snapshot_km, contact_snapshot, notes)
VALUES (
    (SELECT id FROM parties WHERE name = 'Sample Hospital' AND party_type = 'hospital' LIMIT 1),
    CURRENT_DATE,
    'regular_visit',
    'completed',
    'Sample City',
    25,
    '9000000000',
    'Doctor asked for sample items and pricing'
);

-- 5. Record products requested during that visit.
INSERT INTO visit_required_items (visit_id, product_id, requirement_type, quantity_estimate, unit_of_measure, brand_preference, notes)
VALUES (
    (
        SELECT v.id
        FROM visits v
        JOIN parties p ON p.id = v.party_id
        WHERE p.name = 'Sample Hospital'
        ORDER BY v.visit_date DESC, v.created_at DESC
        LIMIT 1
    ),
    (SELECT id FROM products WHERE product_name = 'Sample Product'),
    'required',
    10,
    'piece',
    'Romson',
    'Interested after sample check'
);

-- 6. Record actual order separately.
INSERT INTO sales_orders (party_id, order_date, order_status, reference_number, notes)
VALUES (
    (SELECT id FROM parties WHERE name = 'Sample Hospital' AND party_type = 'hospital' LIMIT 1),
    CURRENT_DATE,
    'confirmed',
    'ORDER-1001',
    'WhatsApp confirmation received'
);

INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_of_measure, buy_rate, sell_rate, notes)
VALUES (
    (SELECT id FROM sales_orders WHERE reference_number = 'ORDER-1001' LIMIT 1),
    (SELECT id FROM products WHERE product_name = 'Sample Product'),
    10,
    'piece',
    40.00,
    55.00,
    'First confirmed order'
);

-- 7. Store current price history for that party and product.
INSERT INTO party_product_pricing (party_id, product_id, buy_rate, sell_rate, currency_code, effective_from, notes)
VALUES (
    (SELECT id FROM parties WHERE name = 'Sample Hospital' AND party_type = 'hospital' LIMIT 1),
    (SELECT id FROM products WHERE product_name = 'Sample Product'),
    40.00,
    55.00,
    'INR',
    CURRENT_DATE,
    'Current agreed rate'
);
