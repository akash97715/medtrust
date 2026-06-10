BEGIN;

INSERT INTO locations (city, district, state, country, distance_from_base_km, base_reference, notes)
VALUES
    ('Raxaul', 'East Champaran', 'Bihar', 'India', 0, 'Raxaul base', 'Primary business base'),
    ('Harnatand', 'West Champaran', 'Bihar', 'India', 22, 'Bagaha to Harnatand', 'Visit area'),
    ('Bagaha City', 'West Champaran', 'Bihar', 'India', NULL, 'Bagaha city', 'Hospital visit cluster'),
    ('Ramnagar', 'West Champaran', 'Bihar', 'India', 34, 'Bagaha to Ramnagar', 'Today visit hospital cluster');

INSERT INTO parties (party_type, name, phone, location_id, address_line, notes)
VALUES
    ('agency', 'Suman Medical Hall', '9931084446', (SELECT id FROM locations WHERE city = 'Harnatand'), 'Bagaha to Harnatand', 'Initial survey entry'),
    ('agency', 'RAI Drug Agency', '9934498910', (SELECT id FROM locations WHERE city = 'Harnatand'), 'Harnatand', 'Initial survey entry'),
    ('hospital', 'Krishna Hospital', NULL, (SELECT id FROM locations WHERE city = 'Harnatand'), 'Harnatand', 'Visit hospital'),
    ('hospital', 'Patwari Netra Chikitsalaya', NULL, (SELECT id FROM locations WHERE city = 'Harnatand'), 'Harnatand', 'Visit hospital'),
    ('hospital', 'Sunaina Smriti Sewa Sansthan', NULL, (SELECT id FROM locations WHERE city = 'Harnatand'), 'Harnatand', 'Visit hospital'),
    ('hospital', 'Hope Hospital', '9431318866', (SELECT id FROM locations WHERE city = 'Bagaha City'), 'Bagaha City', 'Hospital name visit'),
    ('hospital', 'Budha Hospital & Maternity Centre', '9565688301', (SELECT id FROM locations WHERE city = 'Bagaha City'), 'Bagaha City', 'Hospital name visit'),
    ('hospital', 'Savitri Health Care', '9304380249', (SELECT id FROM locations WHERE city = 'Bagaha City'), 'Bagaha City', 'Hospital name visit'),
    ('hospital', 'Sanjeevani Hospital', '6251226410', (SELECT id FROM locations WHERE city = 'Bagaha City'), 'Bagaha City', 'Hospital name visit'),
    ('hospital', 'Shyam Hospital', NULL, (SELECT id FROM locations WHERE city = 'Bagaha City'), 'Bagaha City', 'Hospital name visit'),
    ('hospital', 'Shanti Seva Sadan', NULL, (SELECT id FROM locations WHERE city = 'Bagaha City'), 'Bagaha City', 'Hospital name visit'),
    ('hospital', 'Bagah City Hospital', NULL, (SELECT id FROM locations WHERE city = 'Bagaha City'), 'Bagaha City', 'Hospital name visit'),
    ('hospital', 'Homoeo Cancer Sewa Hospital', '9955133355', (SELECT id FROM locations WHERE city = 'Bagaha City'), 'Bagaha City', 'Hospital name visit'),
    ('hospital', 'APPLO Dental Hospital', '9934803480', (SELECT id FROM locations WHERE city = 'Bagaha City'), 'Bagaha City', 'Hospital name visit'),
    ('hospital', 'Dr BN Jha', NULL, (SELECT id FROM locations WHERE city = 'Ramnagar'), 'Ramnagar, Harinagar', 'Today visit hospital'),
    ('hospital', 'Aman Hospital', NULL, (SELECT id FROM locations WHERE city = 'Ramnagar'), 'Ramnagar, Harinagar', 'Today visit hospital'),
    ('hospital', 'Janta Hospital', NULL, (SELECT id FROM locations WHERE city = 'Ramnagar'), 'Ramnagar, Harinagar', 'Today visit hospital'),
    ('hospital', 'Alfa Emergency Hospital', NULL, (SELECT id FROM locations WHERE city = 'Ramnagar'), 'Ramnagar, Harinagar', 'Today visit hospital');

INSERT INTO products (sku, product_name, product_category, unit_of_measure, preferred_brand, hindi_name, sample_priority, notes)
VALUES
    ('ABD-BELT', 'Abdominal Belt', 'Orthopaedic Support', 'piece', NULL, 'पेट / एब्डोमिनल सपोर्ट', TRUE, NULL),
    ('KNEE-CAP', 'Knee Cap', 'Orthopaedic Support', 'piece', NULL, 'घुटने का सपोर्ट', TRUE, NULL),
    ('CREPE-BANDAGE', 'Crepe Bandage', 'Bandage', 'piece', NULL, NULL, TRUE, NULL),
    ('PAPER-TAPE', 'Paper Tape', 'Tape', 'piece', NULL, NULL, TRUE, NULL),
    ('IV-SET', 'IV Set', 'Infusion', 'piece', NULL, 'ड्रिप सेट', TRUE, NULL),
    ('INFANT-CAP', 'Infant Cap', 'Neonatal', 'piece', NULL, 'नवजात शिशु की टोपी', FALSE, NULL),
    ('FIXING-TAPE', 'Fixing Tape', 'Tape', 'piece', NULL, 'ड्रेसिंग फिक्स करने वाली टेप', TRUE, NULL),
    ('FOLEY-CATH', 'Foley Catheter', 'Urology', 'piece', NULL, NULL, TRUE, NULL),
    ('GLOVES-POWDER', 'Hand Gloves (Powder)', 'Gloves', 'box', NULL, NULL, TRUE, NULL),
    ('COTTON-400GM', 'Cotton (Big) 400 gm', 'Dressing', 'pack', NULL, NULL, TRUE, NULL),
    ('BANDAGE-6IN', 'Bandage 6 Inch', 'Bandage', 'piece', NULL, NULL, FALSE, NULL),
    ('SYRINGE-DISP', 'Syringe / Disposal', 'Injection', 'piece', NULL, NULL, TRUE, NULL),
    ('IV-CANNULA', 'Cannula', 'Infusion', 'piece', 'Romson', NULL, TRUE, NULL),
    ('URINE-BAG', 'Urine Bag', 'Urology', 'piece', 'Romson', NULL, TRUE, NULL),
    ('URINAL-PIPE', 'Urinal Pipe', 'Urology', 'piece', 'Romson', NULL, FALSE, NULL),
    ('RYLES-TUBE', 'Ryle''s Tube', 'Gastro', 'piece', 'Romson', NULL, TRUE, NULL),
    ('SURGICAL-GLOVES', 'Surgical Gloves', 'Gloves', 'box', NULL, NULL, TRUE, 'Recommended sample item'),
    ('EXAM-GLOVES', 'Examination Gloves', 'Gloves', 'box', NULL, NULL, TRUE, 'Recommended sample item'),
    ('SYRINGE-2ML', 'Syringe 2 ml', 'Injection', 'piece', NULL, NULL, TRUE, 'Recommended sample item'),
    ('SYRINGE-5ML', 'Syringe 5 ml', 'Injection', 'piece', NULL, NULL, TRUE, 'Recommended sample item'),
    ('SYRINGE-10ML', 'Syringe 10 ml', 'Injection', 'piece', NULL, NULL, TRUE, 'Recommended sample item'),
    ('LS-BELT', 'LS Belt', 'Orthopaedic Support', 'piece', NULL, NULL, TRUE, 'Recommended sample item');

INSERT INTO product_aliases (product_id, alias_name)
VALUES
    ((SELECT id FROM products WHERE product_name = 'Abdominal Belt'), 'Abdominal bag'),
    ((SELECT id FROM products WHERE product_name = 'Foley Catheter'), 'Foley''s'),
    ((SELECT id FROM products WHERE product_name = 'Cannula'), 'IV Cannula'),
    ((SELECT id FROM products WHERE product_name = 'Hand Gloves (Powder)'), 'Gloves (Powder)'),
    ((SELECT id FROM products WHERE product_name = 'Syringe / Disposal'), 'Disposal'),
    ((SELECT id FROM products WHERE product_name = 'Cotton (Big) 400 gm'), 'Cotton 400 gm');

INSERT INTO visits (party_id, visit_date, visit_purpose, visit_status, location_snapshot, distance_snapshot_km, contact_snapshot, notes)
VALUES
    ((SELECT id FROM parties WHERE name = 'Suman Medical Hall'), CURRENT_DATE, 'regular_visit', 'completed', 'Harnatand', 22, '9931084446', 'Captured address, phone, and required items'),
    ((SELECT id FROM parties WHERE name = 'RAI Drug Agency'), CURRENT_DATE, 'regular_visit', 'completed', 'Harnatand', 22, '9934498910', 'Captured address, phone, and required items'),
    ((SELECT id FROM parties WHERE name = 'Krishna Hospital'), CURRENT_DATE, 'regular_visit', 'completed', 'Harnatand', 22, NULL, 'Visit hospital list'),
    ((SELECT id FROM parties WHERE name = 'Patwari Netra Chikitsalaya'), CURRENT_DATE, 'regular_visit', 'completed', 'Harnatand', 22, NULL, 'Visit hospital list'),
    ((SELECT id FROM parties WHERE name = 'Sunaina Smriti Sewa Sansthan'), CURRENT_DATE, 'regular_visit', 'completed', 'Harnatand', 22, NULL, 'Visit hospital list'),
    ((SELECT id FROM parties WHERE name = 'Hope Hospital'), CURRENT_DATE, 'regular_visit', 'completed', 'Bagaha City', NULL, '9431318866', 'Hospital name visit'),
    ((SELECT id FROM parties WHERE name = 'Budha Hospital & Maternity Centre'), CURRENT_DATE, 'regular_visit', 'completed', 'Bagaha City', NULL, '9565688301', 'Hospital name visit'),
    ((SELECT id FROM parties WHERE name = 'Savitri Health Care'), CURRENT_DATE, 'regular_visit', 'completed', 'Bagaha City', NULL, '9304380249', 'Hospital name visit'),
    ((SELECT id FROM parties WHERE name = 'Sanjeevani Hospital'), CURRENT_DATE, 'regular_visit', 'completed', 'Bagaha City', NULL, '6251226410', 'Hospital name visit'),
    ((SELECT id FROM parties WHERE name = 'Shyam Hospital'), CURRENT_DATE, 'regular_visit', 'completed', 'Bagaha City', NULL, NULL, 'Hospital name visit'),
    ((SELECT id FROM parties WHERE name = 'Shanti Seva Sadan'), CURRENT_DATE, 'regular_visit', 'completed', 'Bagaha City', NULL, NULL, 'Hospital name visit'),
    ((SELECT id FROM parties WHERE name = 'Bagah City Hospital'), CURRENT_DATE, 'regular_visit', 'completed', 'Bagaha City', NULL, NULL, 'Hospital name visit'),
    ((SELECT id FROM parties WHERE name = 'Homoeo Cancer Sewa Hospital'), CURRENT_DATE, 'regular_visit', 'completed', 'Bagaha City', NULL, '9955133355', 'Hospital name visit'),
    ((SELECT id FROM parties WHERE name = 'APPLO Dental Hospital'), CURRENT_DATE, 'regular_visit', 'completed', 'Bagaha City', NULL, '9934803480', 'Hospital name visit'),
    ((SELECT id FROM parties WHERE name = 'Dr BN Jha'), CURRENT_DATE, 'regular_visit', 'completed', 'Ramnagar', 34, NULL, 'Today visit hospital'),
    ((SELECT id FROM parties WHERE name = 'Aman Hospital'), CURRENT_DATE, 'regular_visit', 'completed', 'Ramnagar', 34, NULL, 'Today visit hospital'),
    ((SELECT id FROM parties WHERE name = 'Janta Hospital'), CURRENT_DATE, 'regular_visit', 'completed', 'Ramnagar', 34, NULL, 'Today visit hospital'),
    ((SELECT id FROM parties WHERE name = 'Alfa Emergency Hospital'), CURRENT_DATE, 'regular_visit', 'completed', 'Ramnagar', 34, NULL, 'Today visit hospital');

INSERT INTO visit_required_items (visit_id, product_id, requirement_type, notes)
VALUES
    ((SELECT v.id FROM visits v JOIN parties p ON p.id = v.party_id WHERE p.name = 'Suman Medical Hall'), (SELECT id FROM products WHERE product_name = 'Abdominal Belt'), 'required', NULL),
    ((SELECT v.id FROM visits v JOIN parties p ON p.id = v.party_id WHERE p.name = 'Suman Medical Hall'), (SELECT id FROM products WHERE product_name = 'Knee Cap'), 'required', NULL),
    ((SELECT v.id FROM visits v JOIN parties p ON p.id = v.party_id WHERE p.name = 'Suman Medical Hall'), (SELECT id FROM products WHERE product_name = 'Crepe Bandage'), 'required', NULL),
    ((SELECT v.id FROM visits v JOIN parties p ON p.id = v.party_id WHERE p.name = 'Suman Medical Hall'), (SELECT id FROM products WHERE product_name = 'Paper Tape'), 'required', NULL),
    ((SELECT v.id FROM visits v JOIN parties p ON p.id = v.party_id WHERE p.name = 'Suman Medical Hall'), (SELECT id FROM products WHERE product_name = 'IV Set'), 'required', NULL),
    ((SELECT v.id FROM visits v JOIN parties p ON p.id = v.party_id WHERE p.name = 'Suman Medical Hall'), (SELECT id FROM products WHERE product_name = 'Infant Cap'), 'required', NULL),
    ((SELECT v.id FROM visits v JOIN parties p ON p.id = v.party_id WHERE p.name = 'Suman Medical Hall'), (SELECT id FROM products WHERE product_name = 'Fixing Tape'), 'required', NULL),
    ((SELECT v.id FROM visits v JOIN parties p ON p.id = v.party_id WHERE p.name = 'Suman Medical Hall'), (SELECT id FROM products WHERE product_name = 'Foley Catheter'), 'required', NULL),
    ((SELECT v.id FROM visits v JOIN parties p ON p.id = v.party_id WHERE p.name = 'Suman Medical Hall'), (SELECT id FROM products WHERE product_name = 'Hand Gloves (Powder)'), 'required', NULL),
    ((SELECT v.id FROM visits v JOIN parties p ON p.id = v.party_id WHERE p.name = 'Suman Medical Hall'), (SELECT id FROM products WHERE product_name = 'Cotton (Big) 400 gm'), 'required', NULL),
    ((SELECT v.id FROM visits v JOIN parties p ON p.id = v.party_id WHERE p.name = 'Suman Medical Hall'), (SELECT id FROM products WHERE product_name = 'Bandage 6 Inch'), 'required', NULL),
    ((SELECT v.id FROM visits v JOIN parties p ON p.id = v.party_id WHERE p.name = 'RAI Drug Agency'), (SELECT id FROM products WHERE product_name = 'Cotton (Big) 400 gm'), 'required', NULL),
    ((SELECT v.id FROM visits v JOIN parties p ON p.id = v.party_id WHERE p.name = 'RAI Drug Agency'), (SELECT id FROM products WHERE product_name = 'Syringe / Disposal'), 'required', NULL),
    ((SELECT v.id FROM visits v JOIN parties p ON p.id = v.party_id WHERE p.name = 'RAI Drug Agency'), (SELECT id FROM products WHERE product_name = 'Hand Gloves (Powder)'), 'required', NULL),
    ((SELECT v.id FROM visits v JOIN parties p ON p.id = v.party_id WHERE p.name = 'RAI Drug Agency'), (SELECT id FROM products WHERE product_name = 'Cannula'), 'required', 'Company Name: Romson'),
    ((SELECT v.id FROM visits v JOIN parties p ON p.id = v.party_id WHERE p.name = 'RAI Drug Agency'), (SELECT id FROM products WHERE product_name = 'Urine Bag'), 'required', 'Company Name: Romson'),
    ((SELECT v.id FROM visits v JOIN parties p ON p.id = v.party_id WHERE p.name = 'RAI Drug Agency'), (SELECT id FROM products WHERE product_name = 'Urinal Pipe'), 'required', 'Company Name: Romson'),
    ((SELECT v.id FROM visits v JOIN parties p ON p.id = v.party_id WHERE p.name = 'RAI Drug Agency'), (SELECT id FROM products WHERE product_name = 'Ryle''s Tube'), 'required', 'Company Name: Romson');

INSERT INTO sales_orders (party_id, order_date, order_status, reference_number, notes)
VALUES
    ((SELECT id FROM parties WHERE name = 'Suman Medical Hall'), CURRENT_DATE, 'confirmed', 'INIT-ORDER-001', 'Initial sample order for dashboard testing'),
    ((SELECT id FROM parties WHERE name = 'RAI Drug Agency'), CURRENT_DATE, 'confirmed', 'INIT-ORDER-002', 'Initial sample order for dashboard testing'),
    ((SELECT id FROM parties WHERE name = 'Hope Hospital'), CURRENT_DATE, 'confirmed', 'INIT-ORDER-003', 'Initial sample order for dashboard testing');

INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_of_measure, buy_rate, sell_rate, notes)
VALUES
    ((SELECT id FROM sales_orders WHERE reference_number = 'INIT-ORDER-001'), (SELECT id FROM products WHERE product_name = 'IV Set'), 20, 'piece', 12.00, 16.00, NULL),
    ((SELECT id FROM sales_orders WHERE reference_number = 'INIT-ORDER-001'), (SELECT id FROM products WHERE product_name = 'Hand Gloves (Powder)'), 10, 'box', 180.00, 220.00, NULL),
    ((SELECT id FROM sales_orders WHERE reference_number = 'INIT-ORDER-001'), (SELECT id FROM products WHERE product_name = 'Cotton (Big) 400 gm'), 15, 'pack', 65.00, 82.00, NULL),
    ((SELECT id FROM sales_orders WHERE reference_number = 'INIT-ORDER-002'), (SELECT id FROM products WHERE product_name = 'Cannula'), 30, 'piece', 18.00, 25.00, 'Romson'),
    ((SELECT id FROM sales_orders WHERE reference_number = 'INIT-ORDER-002'), (SELECT id FROM products WHERE product_name = 'Urine Bag'), 12, 'piece', 55.00, 72.00, 'Romson'),
    ((SELECT id FROM sales_orders WHERE reference_number = 'INIT-ORDER-002'), (SELECT id FROM products WHERE product_name = 'Ryle''s Tube'), 8, 'piece', 30.00, 44.00, 'Romson'),
    ((SELECT id FROM sales_orders WHERE reference_number = 'INIT-ORDER-003'), (SELECT id FROM products WHERE product_name = 'Surgical Gloves'), 6, 'box', 210.00, 255.00, NULL),
    ((SELECT id FROM sales_orders WHERE reference_number = 'INIT-ORDER-003'), (SELECT id FROM products WHERE product_name = 'Syringe 5 ml'), 100, 'piece', 3.20, 4.80, NULL);

INSERT INTO party_product_pricing (party_id, product_id, buy_rate, sell_rate, currency_code, effective_from, notes)
VALUES
    ((SELECT id FROM parties WHERE name = 'Suman Medical Hall'), (SELECT id FROM products WHERE product_name = 'IV Set'), 12.00, 16.00, 'INR', CURRENT_DATE, 'Initial price capture'),
    ((SELECT id FROM parties WHERE name = 'Suman Medical Hall'), (SELECT id FROM products WHERE product_name = 'Hand Gloves (Powder)'), 180.00, 220.00, 'INR', CURRENT_DATE, 'Initial price capture'),
    ((SELECT id FROM parties WHERE name = 'RAI Drug Agency'), (SELECT id FROM products WHERE product_name = 'Cannula'), 18.00, 25.00, 'INR', CURRENT_DATE, 'Initial price capture'),
    ((SELECT id FROM parties WHERE name = 'RAI Drug Agency'), (SELECT id FROM products WHERE product_name = 'Urine Bag'), 55.00, 72.00, 'INR', CURRENT_DATE, 'Initial price capture'),
    ((SELECT id FROM parties WHERE name = 'Hope Hospital'), (SELECT id FROM products WHERE product_name = 'Surgical Gloves'), 210.00, 255.00, 'INR', CURRENT_DATE, 'Initial price capture');

COMMIT;
