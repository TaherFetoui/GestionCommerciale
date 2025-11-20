-- ============================================
-- SEED DATA FOR GESTION COMMERCIALE
-- Script de remplissage avec données de test
-- ============================================

-- NOTE: Ce script suppose qu'un utilisateur existe déjà
-- Remplacez 'YOUR_USER_ID' par un UUID d'utilisateur valide de auth.users

-- ATTENTION: Ce script supprime d'abord les données de test existantes
-- pour éviter les doublons. Commentez la section de nettoyage si vous
-- voulez conserver les données existantes.

-- Variable pour l'utilisateur (à remplacer)
DO $$
DECLARE
    v_user_id uuid := '7be719e9-857c-4a97-a237-f9e780350b02'; -- REMPLACER PAR UN VRAI USER ID
    v_client1_id uuid;
    v_client2_id uuid;
    v_client3_id uuid;
    v_supplier1_id uuid;
    v_supplier2_id uuid;
    v_supplier3_id uuid;
    v_family1_id uuid;
    v_family2_id uuid;
    v_family3_id uuid;
    v_item1_id uuid;
    v_item2_id uuid;
    v_item3_id uuid;
    v_item4_id uuid;
    v_item5_id uuid;
    v_warehouse1_id uuid;
    v_bank_account1_id uuid;
    v_bank_account2_id uuid;
    v_cash_box_id uuid;
    v_invoice1_id uuid;
    v_invoice2_id uuid;
    v_quote1_id uuid;
BEGIN

-- ============================================
-- NETTOYAGE DES DONNÉES DE TEST EXISTANTES
-- ============================================
-- Suppression dans l'ordre inverse des dépendances
DELETE FROM public.supplier_returns WHERE created_by = v_user_id;
DELETE FROM public.client_returns WHERE created_by = v_user_id;
DELETE FROM public.payment_slips WHERE created_by = v_user_id;
DELETE FROM public.supplier_payment_orders WHERE created_by = v_user_id;
DELETE FROM public.client_payment_orders WHERE created_by = v_user_id;
DELETE FROM public.financial_transactions WHERE created_by = v_user_id;
DELETE FROM public.checks WHERE created_by = v_user_id;
DELETE FROM public.cash_sessions WHERE opened_by = v_user_id;
DELETE FROM public.stock_movements WHERE user_id = v_user_id;
DELETE FROM public.purchase_orders WHERE user_id = v_user_id;
DELETE FROM public.delivery_notes WHERE user_id = v_user_id;
DELETE FROM public.quotes WHERE user_id = v_user_id;
DELETE FROM public.invoices WHERE user_id = v_user_id;
DELETE FROM public.items WHERE user_id = v_user_id;
DELETE FROM public.item_families WHERE user_id = v_user_id;
DELETE FROM public.warehouses WHERE user_id = v_user_id;
DELETE FROM public.bank_accounts WHERE created_by = v_user_id;
DELETE FROM public.suppliers WHERE user_id = v_user_id;
DELETE FROM public.clients WHERE user_id = v_user_id;
DELETE FROM public.fiscal_years WHERE created_by = v_user_id;
DELETE FROM public.company_info WHERE user_id = v_user_id;

RAISE NOTICE 'Données existantes nettoyées';

-- ============================================
-- 1. COMPANY INFO
-- ============================================
INSERT INTO public.company_info (user_id, name, address, city, country, postal_code, phone, email, tax_id, trade_register)
VALUES (
    v_user_id,
    'SARL TechnoTrade',
    '123 Avenue Habib Bourguiba',
    'Tunis',
    'Tunisie',
    '1000',
    '+216 71 123 456',
    'contact@technotrade.tn',
    '1234567/A/M/000',
    'B12345678'
) ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 2. CLIENTS
-- ============================================
INSERT INTO public.clients (user_id, name, raison_sociale, matricule_fiscale, email, phone, address, ville, pays, code_postale, type_client)
VALUES (v_user_id, 'Société Moderne SARL', 'Société Moderne SARL', '0123456A/M/000', 'contact@moderne.tn', '+216 71 234 567', '45 Rue de la République', 'Tunis', 'Tunisie', '1001', 'entreprise')
RETURNING id INTO v_client1_id;

INSERT INTO public.clients (user_id, name, raison_sociale, matricule_fiscale, email, phone, address, ville, pays, code_postale, type_client)
VALUES (v_user_id, 'Distribution Plus', 'Distribution Plus SUARL', '0234567B/N/000', 'info@distplus.tn', '+216 71 345 678', '78 Avenue de la Liberté', 'Sfax', 'Tunisie', '3000', 'entreprise')
RETURNING id INTO v_client2_id;

INSERT INTO public.clients (user_id, name, raison_sociale, matricule_fiscale, email, phone, address, ville, pays, code_postale, type_client)
VALUES (v_user_id, 'Tech Solutions', 'Tech Solutions SA', '0345678C/P/000', 'admin@techsol.tn', '+216 71 456 789', '12 Boulevard du 7 Novembre', 'Sousse', 'Tunisie', '4000', 'entreprise')
RETURNING id INTO v_client3_id;

INSERT INTO public.clients (user_id, name, raison_sociale, matricule_fiscale, email, phone, address, ville, pays, code_postale, type_client)
VALUES (v_user_id, 'Ahmed Ben Ali', 'Ahmed Ben Ali', NULL, 'ahmed.benali@email.tn', '+216 98 123 456', '34 Rue des Jasmins', 'Ariana', 'Tunisie', '2080', 'particulier');

INSERT INTO public.clients (user_id, name, raison_sociale, matricule_fiscale, email, phone, address, ville, pays, code_postale, type_client)
VALUES (v_user_id, 'Fatma Trabelsi', 'Fatma Trabelsi', NULL, 'fatma.trabelsi@email.tn', '+216 98 234 567', '56 Avenue Mongi Slim', 'La Marsa', 'Tunisie', '2070', 'particulier');

-- ============================================
-- 3. SUPPLIERS
-- ============================================
INSERT INTO public.suppliers (user_id, name, tax_id, address, city, country, postal_code, phone, email)
VALUES (v_user_id, 'Global Import Export', '1111111/A/M/000', '89 Zone Industrielle', 'Ben Arous', 'Tunisie', '2013', '+216 71 567 890', 'contact@globalimport.tn')
RETURNING id INTO v_supplier1_id;

INSERT INTO public.suppliers (user_id, name, tax_id, address, city, country, postal_code, phone, email)
VALUES (v_user_id, 'TechnoSupply SARL', '2222222/B/N/000', '45 Rue de l''Industrie', 'Tunis', 'Tunisie', '1002', '+216 71 678 901', 'info@technosupply.tn')
RETURNING id INTO v_supplier2_id;

INSERT INTO public.suppliers (user_id, name, tax_id, address, city, country, postal_code, phone, email)
VALUES (v_user_id, 'ElectroDistrib', '3333333/C/P/000', '23 Avenue de France', 'Sfax', 'Tunisie', '3001', '+216 74 789 012', 'sales@electrodistrib.tn')
RETURNING id INTO v_supplier3_id;

-- ============================================
-- 4. ITEM FAMILIES
-- ============================================
INSERT INTO public.item_families (user_id, name)
VALUES (v_user_id, 'Informatique')
RETURNING id INTO v_family1_id;

INSERT INTO public.item_families (user_id, name)
VALUES (v_user_id, 'Électronique')
RETURNING id INTO v_family2_id;

INSERT INTO public.item_families (user_id, name)
VALUES (v_user_id, 'Fournitures Bureau')
RETURNING id INTO v_family3_id;

INSERT INTO public.item_families (user_id, name)
VALUES (v_user_id, 'Consommables');

-- ============================================
-- 5. ITEMS (ARTICLES)
-- ============================================
INSERT INTO public.items (user_id, reference, name, description, purchase_price, sale_price, vat_rate, family_id, stock_quantity, alert_threshold)
VALUES (v_user_id, 'PC-001', 'Ordinateur Portable Dell Latitude', 'PC Dell Latitude 5520, i5-11Gen, 8GB RAM, 256GB SSD', 1800.000, 2400.000, 19.0, v_family1_id, 15, 5)
RETURNING id INTO v_item1_id;

INSERT INTO public.items (user_id, reference, name, description, purchase_price, sale_price, vat_rate, family_id, stock_quantity, alert_threshold)
VALUES (v_user_id, 'MON-001', 'Écran Dell 24"', 'Moniteur Dell 24 pouces Full HD', 450.000, 650.000, 19.0, v_family1_id, 25, 8)
RETURNING id INTO v_item2_id;

INSERT INTO public.items (user_id, reference, name, description, purchase_price, sale_price, vat_rate, family_id, stock_quantity, alert_threshold)
VALUES (v_user_id, 'KEY-001', 'Clavier Sans Fil Logitech', 'Clavier sans fil Logitech K380', 65.000, 95.000, 19.0, v_family2_id, 50, 15)
RETURNING id INTO v_item3_id;

INSERT INTO public.items (user_id, reference, name, description, purchase_price, sale_price, vat_rate, family_id, stock_quantity, alert_threshold)
VALUES (v_user_id, 'MOU-001', 'Souris Optique HP', 'Souris optique USB HP X3000', 35.000, 55.000, 19.0, v_family2_id, 80, 20);

INSERT INTO public.items (user_id, reference, name, description, purchase_price, sale_price, vat_rate, family_id, stock_quantity, alert_threshold)
VALUES (v_user_id, 'USB-001', 'Clé USB 32GB Kingston', 'Clé USB 3.0 Kingston DataTraveler 32GB', 18.000, 32.000, 19.0, v_family2_id, 120, 30)
RETURNING id INTO v_item4_id;

INSERT INTO public.items (user_id, reference, name, description, purchase_price, sale_price, vat_rate, family_id, stock_quantity, alert_threshold)
VALUES (v_user_id, 'RAM-001', 'Barrette RAM 8GB DDR4', 'Mémoire RAM DDR4 8GB 2666MHz', 120.000, 180.000, 19.0, v_family1_id, 40, 10)
RETURNING id INTO v_item5_id;

INSERT INTO public.items (user_id, reference, name, description, purchase_price, sale_price, vat_rate, family_id, stock_quantity, alert_threshold)
VALUES (v_user_id, 'CAB-001', 'Câble HDMI 2m', 'Câble HDMI 2.0 haute vitesse 2 mètres', 12.000, 25.000, 19.0, v_family2_id, 150, 40);

INSERT INTO public.items (user_id, reference, name, description, purchase_price, sale_price, vat_rate, family_id, stock_quantity, alert_threshold)
VALUES (v_user_id, 'PAP-001', 'Ramette Papier A4', 'Ramette papier A4 80g 500 feuilles', 8.000, 15.000, 19.0, v_family3_id, 200, 50);

-- ============================================
-- 6. WAREHOUSES
-- ============================================
INSERT INTO public.warehouses (user_id, name, address, is_default)
VALUES (v_user_id, 'Entrepôt Principal', '123 Zone Industrielle, Ben Arous', true)
RETURNING id INTO v_warehouse1_id;

INSERT INTO public.warehouses (user_id, name, address, is_default)
VALUES (v_user_id, 'Entrepôt Secondaire', '45 Rue du Commerce, Tunis', false);

-- ============================================
-- 7. BANK ACCOUNTS
-- ============================================
INSERT INTO public.bank_accounts (account_type, account_name, account_number, bank_name, branch_name, rib, iban, currency, opening_balance, current_balance, is_active, created_by)
VALUES ('bank', 'Compte Courant Principal', '10001234567', 'Banque Nationale Agricole', 'Agence Centre Ville', '10001234567890123456', 'TN59 1000 1234 5678 9012 3456', 'TND', 50000.000, 52500.000, true, v_user_id)
RETURNING id INTO v_bank_account1_id;

INSERT INTO public.bank_accounts (account_type, account_name, account_number, bank_name, branch_name, rib, iban, currency, opening_balance, current_balance, is_active, created_by)
VALUES ('bank', 'Compte Courant Secondaire', '20002345678', 'Banque de Tunisie', 'Agence Lafayette', '20002345678901234567', 'TN59 2000 2345 6789 0123 4567', 'TND', 20000.000, 18750.000, true, v_user_id)
RETURNING id INTO v_bank_account2_id;

INSERT INTO public.bank_accounts (account_type, account_name, account_number, bank_name, branch_name, rib, iban, currency, opening_balance, current_balance, is_active, created_by)
VALUES ('cash_box', 'Caisse Principale', NULL, NULL, NULL, NULL, NULL, 'TND', 5000.000, 6200.000, true, v_user_id)
RETURNING id INTO v_cash_box_id;

INSERT INTO public.bank_accounts (account_type, account_name, account_number, bank_name, branch_name, rib, iban, currency, opening_balance, current_balance, is_active, created_by)
VALUES ('mobile_money', 'Compte D17', 'D17-98123456', 'D17', NULL, NULL, NULL, 'TND', 1000.000, 1850.000, true, v_user_id);

-- ============================================
-- 8. INVOICES
-- ============================================
INSERT INTO public.invoices (user_id, client_id, invoice_number, issue_date, due_date, total_ht, total_vat, fiscal_stamp, total_amount, status, payment_method, items)
VALUES (v_user_id, v_client1_id, 'FA-2025-001', '2025-01-15', '2025-02-15', 4800.000, 912.000, 1.000, 5713.000, 'paid', 'Chèque', 
'[
    {"description": "Ordinateur Portable Dell Latitude", "quantity": 2, "unitPrice": 2400.000, "vatRate": 19}
]'::jsonb)
RETURNING id INTO v_invoice1_id;

INSERT INTO public.invoices (user_id, client_id, invoice_number, issue_date, due_date, total_ht, total_vat, fiscal_stamp, total_amount, status, payment_method, items)
VALUES (v_user_id, v_client2_id, 'FA-2025-002', '2025-01-20', '2025-02-20', 2450.000, 465.500, 1.000, 2916.500, 'awaiting_payment', 'Virement', 
'[
    {"description": "Écran Dell 24\"", "quantity": 2, "unitPrice": 650.000, "vatRate": 19},
    {"description": "Clavier Sans Fil Logitech", "quantity": 5, "unitPrice": 95.000, "vatRate": 19},
    {"description": "Souris Optique HP", "quantity": 10, "unitPrice": 55.000, "vatRate": 19}
]'::jsonb)
RETURNING id INTO v_invoice2_id;

INSERT INTO public.invoices (user_id, client_id, invoice_number, issue_date, due_date, total_ht, total_vat, fiscal_stamp, total_amount, status, payment_method, items)
VALUES (v_user_id, v_client3_id, 'FA-2025-003', '2025-02-01', '2025-03-01', 1840.000, 349.600, 1.000, 2190.600, 'awaiting_payment', 'Espèces', 
'[
    {"description": "Barrette RAM 8GB DDR4", "quantity": 10, "unitPrice": 180.000, "vatRate": 19},
    {"description": "Clé USB 32GB Kingston", "quantity": 2, "unitPrice": 32.000, "vatRate": 19}
]'::jsonb);

INSERT INTO public.invoices (user_id, client_id, invoice_number, issue_date, due_date, total_ht, total_vat, fiscal_stamp, total_amount, status, payment_method, items)
VALUES (v_user_id, v_client1_id, 'FA-2025-004', '2025-02-10', '2025-03-10', 950.000, 180.500, 1.000, 1131.500, 'overdue', 'Chèque', 
'[
    {"description": "Câble HDMI 2m", "quantity": 10, "unitPrice": 25.000, "vatRate": 19},
    {"description": "Ramette Papier A4", "quantity": 50, "unitPrice": 15.000, "vatRate": 19}
]'::jsonb);

-- September 2025 invoices
INSERT INTO public.invoices (user_id, client_id, invoice_number, issue_date, due_date, total_ht, total_vat, fiscal_stamp, total_amount, status, payment_method, items)
VALUES (v_user_id, v_client2_id, 'FA-2025-005', '2025-09-05', '2025-10-05', 3200.000, 608.000, 1.000, 3809.000, 'paid', 'Virement', 
'[
    {"description": "Ordinateur Portable HP", "quantity": 2, "unitPrice": 1600.000, "vatRate": 19}
]'::jsonb);

INSERT INTO public.invoices (user_id, client_id, invoice_number, issue_date, due_date, total_ht, total_vat, fiscal_stamp, total_amount, status, payment_method, items)
VALUES (v_user_id, v_client3_id, 'FA-2025-006', '2025-09-18', '2025-10-18', 1500.000, 285.000, 1.000, 1786.000, 'paid', 'Chèque', 
'[
    {"description": "Écran Samsung 27\"", "quantity": 3, "unitPrice": 500.000, "vatRate": 19}
]'::jsonb);

-- October 2025 invoices
INSERT INTO public.invoices (user_id, client_id, invoice_number, issue_date, due_date, total_ht, total_vat, fiscal_stamp, total_amount, status, payment_method, items)
VALUES (v_user_id, v_client1_id, 'FA-2025-007', '2025-10-10', '2025-11-10', 4500.000, 855.000, 1.000, 5356.000, 'awaiting_payment', 'Virement', 
'[
    {"description": "Serveur Dell PowerEdge", "quantity": 1, "unitPrice": 4500.000, "vatRate": 19}
]'::jsonb);

INSERT INTO public.invoices (user_id, client_id, invoice_number, issue_date, due_date, total_ht, total_vat, fiscal_stamp, total_amount, status, payment_method, items)
VALUES (v_user_id, v_client2_id, 'FA-2025-008', '2025-10-22', '2025-11-22', 2800.000, 532.000, 1.000, 3333.000, 'paid', 'Chèque', 
'[
    {"description": "Imprimante Laser HP", "quantity": 4, "unitPrice": 700.000, "vatRate": 19}
]'::jsonb);

-- November 2025 invoices
INSERT INTO public.invoices (user_id, client_id, invoice_number, issue_date, due_date, total_ht, total_vat, fiscal_stamp, total_amount, status, payment_method, items)
VALUES (v_user_id, v_client3_id, 'FA-2025-009', '2025-11-05', '2025-12-05', 3600.000, 684.000, 1.000, 4285.000, 'paid', 'Virement', 
'[
    {"description": "Switch Cisco 24 ports", "quantity": 2, "unitPrice": 1800.000, "vatRate": 19}
]'::jsonb);

INSERT INTO public.invoices (user_id, client_id, invoice_number, issue_date, due_date, total_ht, total_vat, fiscal_stamp, total_amount, status, payment_method, items)
VALUES (v_user_id, v_client1_id, 'FA-2025-010', '2025-11-15', '2025-12-15', 2400.000, 456.000, 1.000, 2857.000, 'awaiting_payment', 'Chèque', 
'[
    {"description": "Ordinateur Bureau Dell", "quantity": 3, "unitPrice": 800.000, "vatRate": 19}
]'::jsonb);

-- December 2025 invoices
INSERT INTO public.invoices (user_id, client_id, invoice_number, issue_date, due_date, total_ht, total_vat, fiscal_stamp, total_amount, status, payment_method, items)
VALUES (v_user_id, v_client2_id, 'FA-2025-011', '2025-12-08', '2026-01-08', 5200.000, 988.000, 1.000, 6189.000, 'awaiting_payment', 'Virement', 
'[
    {"description": "Licence Microsoft 365", "quantity": 20, "unitPrice": 260.000, "vatRate": 19}
]'::jsonb);

INSERT INTO public.invoices (user_id, client_id, invoice_number, issue_date, due_date, total_ht, total_vat, fiscal_stamp, total_amount, status, payment_method, items)
VALUES (v_user_id, v_client3_id, 'FA-2025-012', '2025-12-20', '2026-01-20', 1800.000, 342.000, 1.000, 2143.000, 'paid', 'Espèces', 
'[
    {"description": "Disque Dur Externe 2TB", "quantity": 6, "unitPrice": 300.000, "vatRate": 19}
]'::jsonb);

-- January 2026 invoice
INSERT INTO public.invoices (user_id, client_id, invoice_number, issue_date, due_date, total_ht, total_vat, fiscal_stamp, total_amount, status, payment_method, items)
VALUES (v_user_id, v_client1_id, 'FA-2026-001', '2026-01-10', '2026-02-10', 4200.000, 798.000, 1.000, 4999.000, 'awaiting_payment', 'Virement', 
'[
    {"description": "NAS Synology", "quantity": 2, "unitPrice": 2100.000, "vatRate": 19}
]'::jsonb);

INSERT INTO public.invoices (user_id, client_id, invoice_number, issue_date, due_date, total_ht, total_vat, fiscal_stamp, total_amount, status, payment_method, items)
VALUES (v_user_id, v_client2_id, 'FA-2026-002', '2026-01-25', '2026-02-25', 3300.000, 627.000, 1.000, 3928.000, 'paid', 'Chèque', 
'[
    {"description": "MacBook Pro 14\"", "quantity": 2, "unitPrice": 1650.000, "vatRate": 19}
]'::jsonb);

-- ============================================
-- 9. QUOTES (DEVIS)
-- ============================================
INSERT INTO public.quotes (user_id, client_id, quote_number, issue_date, expiry_date, total_amount, status, items, notes)
VALUES (v_user_id, v_client1_id, 'DEV-2025-001', '2025-01-10', '2025-02-10', 7200.000, 'accepted', 
'[
    {"description": "Ordinateur Portable Dell Latitude", "quantity": 3, "unitPrice": 2400.000}
]'::jsonb, 'Devis pour renouvellement parc informatique')
RETURNING id INTO v_quote1_id;

INSERT INTO public.quotes (user_id, client_id, quote_number, issue_date, expiry_date, total_amount, status, items, notes)
VALUES (v_user_id, v_client2_id, 'DEV-2025-002', '2025-02-05', '2025-03-05', 3250.000, 'sent', 
'[
    {"description": "Écran Dell 24\"", "quantity": 5, "unitPrice": 650.000}
]'::jsonb, 'Équipement salle de réunion');

INSERT INTO public.quotes (user_id, client_id, quote_number, issue_date, expiry_date, total_amount, status, items, notes)
VALUES (v_user_id, v_client3_id, 'DEV-2025-003', '2025-02-12', '2025-03-12', 1900.000, 'sent', 
'[
    {"description": "Barrette RAM 8GB DDR4", "quantity": 10, "unitPrice": 180.000},
    {"description": "Clé USB 32GB Kingston", "quantity": 5, "unitPrice": 32.000}
]'::jsonb, NULL);

-- ============================================
-- 10. DELIVERY NOTES
-- ============================================
INSERT INTO public.delivery_notes (user_id, client_id, note_number, delivery_date, status, items, total_amount, related_invoice_id, notes)
VALUES 
    (v_user_id, v_client1_id, 'BL-2025-001', '2025-01-16', 'delivered', 
    jsonb_build_array(
        jsonb_build_object('item_id', v_item1_id, 'item_name', 'Ordinateur Portable Dell Latitude', 'quantity', 2)
    ), 4800.000, v_invoice1_id, 'Livraison effectuée et signée'),
    (v_user_id, v_client2_id, 'BL-2025-002', '2025-01-22', 'delivered', 
    jsonb_build_array(
        jsonb_build_object('item_id', v_item2_id, 'item_name', 'Écran Dell 24"', 'quantity', 2),
        jsonb_build_object('item_id', v_item3_id, 'item_name', 'Clavier Sans Fil Logitech', 'quantity', 5)
    ), 1775.000, v_invoice2_id, NULL),
    (v_user_id, v_client3_id, 'BL-2025-003', '2025-02-03', 'pending', 
    jsonb_build_array(
        jsonb_build_object('item_id', v_item5_id, 'item_name', 'Barrette RAM 8GB DDR4', 'quantity', 10)
    ), 1800.000, NULL, 'En attente de récupération');

-- ============================================
-- 11. PURCHASE ORDERS
-- ============================================
INSERT INTO public.purchase_orders (user_id, supplier_id, order_number, order_date, expected_delivery_date, status, items, total_amount)
VALUES 
    (v_user_id, v_supplier1_id, 'CMD-2025-001', '2025-01-05', '2025-01-20', 'received', 
    jsonb_build_array(
        jsonb_build_object('item_id', v_item1_id, 'item_name', 'Ordinateur Portable Dell Latitude', 'quantity', 20, 'purchase_price', 1800.000)
    ), 36000.000),
    (v_user_id, v_supplier2_id, 'CMD-2025-002', '2025-01-12', '2025-01-27', 'received', 
    jsonb_build_array(
        jsonb_build_object('item_id', v_item2_id, 'item_name', 'Écran Dell 24"', 'quantity', 30, 'purchase_price', 450.000),
        jsonb_build_object('item_id', v_item3_id, 'item_name', 'Clavier Sans Fil Logitech', 'quantity', 50, 'purchase_price', 65.000)
    ), 16750.000),
    (v_user_id, v_supplier3_id, 'CMD-2025-003', '2025-02-01', '2025-02-15', 'confirmed', 
    jsonb_build_array(
        jsonb_build_object('item_id', v_item4_id, 'item_name', 'Clé USB 32GB Kingston', 'quantity', 100, 'purchase_price', 18.000),
        jsonb_build_object('item_id', v_item5_id, 'item_name', 'Barrette RAM 8GB DDR4', 'quantity', 50, 'purchase_price', 120.000)
    ), 7800.000),
    (v_user_id, v_supplier1_id, 'CMD-2025-004', '2025-02-15', '2025-03-01', 'pending', 
    jsonb_build_array(
        jsonb_build_object('item_id', v_item1_id, 'item_name', 'Ordinateur Portable Dell Latitude', 'quantity', 15, 'purchase_price', 1800.000)
    ), 27000.000);

-- ============================================
-- 12. STOCK MOVEMENTS
-- ============================================
INSERT INTO public.stock_movements (user_id, item_id, warehouse_id, movement_type, quantity, reference_type, notes)
VALUES 
    -- Entrées de stock (achats)
    (v_user_id, v_item1_id, v_warehouse1_id, 'in', 20, 'purchase_order', 'Réception commande CMD-2025-001'),
    (v_user_id, v_item2_id, v_warehouse1_id, 'in', 30, 'purchase_order', 'Réception commande CMD-2025-002'),
    (v_user_id, v_item3_id, v_warehouse1_id, 'in', 50, 'purchase_order', 'Réception commande CMD-2025-002'),
    (v_user_id, v_item4_id, v_warehouse1_id, 'in', 100, 'purchase_order', 'Réception commande initiale'),
    (v_user_id, v_item5_id, v_warehouse1_id, 'in', 50, 'purchase_order', 'Réception commande initiale'),
    -- Sorties de stock (ventes)
    (v_user_id, v_item1_id, v_warehouse1_id, 'out', 2, 'invoice', 'Livraison BL-2025-001'),
    (v_user_id, v_item2_id, v_warehouse1_id, 'out', 2, 'invoice', 'Livraison BL-2025-002'),
    (v_user_id, v_item3_id, v_warehouse1_id, 'out', 5, 'invoice', 'Livraison BL-2025-002'),
    (v_user_id, v_item5_id, v_warehouse1_id, 'out', 10, 'invoice', 'Livraison BL-2025-003');

-- ============================================
-- 13. CASH SESSIONS
-- ============================================
INSERT INTO public.cash_sessions (session_number, cash_box_id, opening_balance, closing_balance, expected_balance, difference, total_sales, total_expenses, opened_at, closed_at, opened_by, closed_by, status, note)
VALUES 
    ('SES-2025-001', v_cash_box_id, 5000.000, 5850.000, 5850.000, 0.000, 1200.000, 350.000, '2025-01-15 08:00:00', '2025-01-15 18:00:00', v_user_id, v_user_id, 'closed', 'Journée normale'),
    ('SES-2025-002', v_cash_box_id, 5850.000, 6200.000, 6180.000, 20.000, 800.000, 450.000, '2025-01-16 08:00:00', '2025-01-16 18:00:00', v_user_id, v_user_id, 'closed', 'Petite différence de caisse'),
    ('SES-2025-003', v_cash_box_id, 6200.000, NULL, NULL, NULL, 0.000, 0.000, '2025-02-17 08:00:00', NULL, v_user_id, NULL, 'open', 'Session en cours');

-- ============================================
-- 14. CHECKS
-- ============================================
INSERT INTO public.checks (check_number, check_type, drawer_name, bank_name, amount, issue_date, due_date, deposit_date, encashment_date, status, bank_account_id, client_supplier, created_by, note)
VALUES 
    ('CHQ-001234', 'received', 'Société Moderne SARL', 'BNA', 5713.000, '2025-01-15', '2025-02-15', '2025-01-20', '2025-02-15', 'encashed', v_bank_account1_id, 'Société Moderne SARL', v_user_id, 'Paiement facture FA-2025-001'),
    ('CHQ-002345', 'received', 'Distribution Plus', 'Banque de Tunisie', 2916.500, '2025-01-25', '2025-02-25', '2025-01-28', NULL, 'deposited', v_bank_account1_id, 'Distribution Plus', v_user_id, 'Paiement facture FA-2025-002'),
    ('CHQ-003456', 'received', 'Tech Solutions', 'STB', 1131.500, '2025-02-10', '2025-03-10', NULL, NULL, 'pending', NULL, 'Tech Solutions', v_user_id, 'Paiement facture FA-2025-004 - en attente'),
    ('CHQ-004567', 'issued', 'Global Import Export', 'BNA', 36000.000, '2025-01-10', '2025-02-10', NULL, '2025-02-10', 'encashed', v_bank_account1_id, 'Global Import Export', v_user_id, 'Paiement fournisseur CMD-2025-001');

-- ============================================
-- 15. FINANCIAL TRANSACTIONS
-- ============================================
INSERT INTO public.financial_transactions (transaction_number, transaction_type, category, amount, transaction_date, bank_account_id, payment_method, reference, description, status, related_entity_type, related_entity_name, created_by)
VALUES 
    ('TRX-2025-001', 'income', 'Ventes', 5713.000, '2025-02-15', v_bank_account1_id, 'check', 'CHQ-001234', 'Encaissement chèque facture FA-2025-001', 'completed', 'client', 'Société Moderne SARL', v_user_id),
    ('TRX-2025-002', 'expense', 'Achats', 36000.000, '2025-02-10', v_bank_account1_id, 'check', 'CHQ-004567', 'Paiement fournisseur CMD-2025-001', 'completed', 'supplier', 'Global Import Export', v_user_id),
    ('TRX-2025-003', 'income', 'Ventes', 1850.000, '2025-02-05', v_cash_box_id, 'cash', 'FA-2025-003', 'Paiement comptant facture FA-2025-003', 'completed', 'client', 'Tech Solutions', v_user_id),
    ('TRX-2025-004', 'expense', 'Charges', 450.000, '2025-02-08', v_bank_account2_id, 'transfer', 'VIR-001', 'Loyer mensuel bureau', 'completed', 'other', 'Propriétaire', v_user_id),
    ('TRX-2025-005', 'expense', 'Salaires', 3500.000, '2025-02-01', v_bank_account1_id, 'transfer', 'SAL-FEB-2025', 'Salaires du mois de février', 'completed', 'employee', 'Personnel', v_user_id),
    ('TRX-2025-006', 'transfer', 'Transfert interne', 2000.000, '2025-02-12', v_bank_account1_id, 'transfer', 'TRSF-001', 'Transfert vers compte secondaire', 'completed', 'other', 'Compte interne', v_user_id);

-- ============================================
-- 16. CLIENT PAYMENT ORDERS
-- ============================================
INSERT INTO public.client_payment_orders (order_number, client, amount, payment_method, payment_date, due_date, status, bank_account, reference, created_by, note)
VALUES 
    ('OC-2025-001', 'Société Moderne SARL', 5713.000, 'check', '2025-02-15', '2025-02-15', 'received', 'Compte Courant Principal', 'CHQ-001234', v_user_id, 'Facture FA-2025-001'),
    ('OC-2025-002', 'Distribution Plus', 2916.500, 'transfer', NULL, '2025-02-20', 'pending', 'Compte Courant Principal', 'FA-2025-002', v_user_id, 'En attente de règlement'),
    ('OC-2025-003', 'Tech Solutions', 2190.600, 'cash', '2025-02-05', '2025-03-01', 'received', 'Caisse Principale', 'FA-2025-003', v_user_id, 'Paiement comptant');

-- ============================================
-- 17. SUPPLIER PAYMENT ORDERS
-- ============================================
INSERT INTO public.supplier_payment_orders (order_number, supplier, amount, payment_method, payment_date, due_date, status, bank_account, reference, approved_by, approved_at, created_by, note)
VALUES 
    ('OF-2025-001', 'Global Import Export', 36000.000, 'check', '2025-02-10', '2025-02-10', 'paid', 'Compte Courant Principal', 'CHQ-004567', v_user_id, '2025-01-25 10:00:00', v_user_id, 'Commande CMD-2025-001'),
    ('OF-2025-002', 'TechnoSupply SARL', 16750.000, 'transfer', NULL, '2025-02-28', 'approved', 'Compte Courant Principal', 'CMD-2025-002', v_user_id, '2025-02-15 14:30:00', v_user_id, 'Approuvé, en attente de paiement'),
    ('OF-2025-003', 'ElectroDistrib', 7800.000, NULL, NULL, '2025-03-15', 'pending', NULL, 'CMD-2025-003', NULL, NULL, v_user_id, 'En attente d''approbation');

-- ============================================
-- 18. PAYMENT SLIPS
-- ============================================
INSERT INTO public.payment_slips (slip_number, slip_type, bank_account, total_amount, slip_date, value_date, status, created_by, note)
VALUES 
    ('BOR-2025-001', 'deposit', 'Compte Courant Principal', 8629.500, '2025-01-20', '2025-01-21', 'processed', v_user_id, 'Dépôt chèques clients'),
    ('BOR-2025-002', 'check_collection', 'Compte Courant Principal', 2916.500, '2025-01-28', '2025-01-29', 'processed', v_user_id, 'Remise chèque CHQ-002345'),
    ('BOR-2025-003', 'transfer', 'Compte Courant Secondaire', 2000.000, '2025-02-12', '2025-02-12', 'processed', v_user_id, 'Transfert interne');

-- ============================================
-- 19. FISCAL YEARS
-- ============================================
INSERT INTO public.fiscal_years (year_type, fiscal_year, start_date, end_date, is_active, is_closed, created_by, note)
VALUES 
    ('client', '2024', '2024-01-01', '2024-12-31', false, true, v_user_id, 'Exercice clôturé'),
    ('client', '2025', '2025-01-01', '2025-12-31', true, false, v_user_id, 'Exercice en cours'),
    ('supplier', '2024', '2024-01-01', '2024-12-31', false, true, v_user_id, 'Exercice clôturé'),
    ('supplier', '2025', '2025-01-01', '2025-12-31', true, false, v_user_id, 'Exercice en cours');

-- ============================================
-- 20. CLIENT RETURNS (Retenues à la source clients)
-- ============================================
INSERT INTO public.client_returns (client, invoice_number, invoice_amount, retention_rate, retention_amount, retention_date, status, created_by, note)
VALUES 
    ('Société Moderne SARL', 'FA-2025-001', 5713.000, 1.5, 85.695, '2025-02-15', 'received', v_user_id, 'Retenue à la source 1.5%'),
    ('Distribution Plus', 'FA-2025-002', 2916.500, 1.5, 43.748, '2025-02-20', 'pending', v_user_id, 'En attente');

-- ============================================
-- 21. SUPPLIER RETURNS (Retenues à la source fournisseurs)
-- ============================================
INSERT INTO public.supplier_returns (supplier, invoice_number, invoice_amount, retention_rate, retention_amount, retention_date, status, created_by, note)
VALUES 
    ('Global Import Export', 'FACT-GIE-001', 36000.000, 1.5, 540.000, '2025-02-10', 'paid', v_user_id, 'Retenue à la source payée'),
    ('TechnoSupply SARL', 'FACT-TS-002', 16750.000, 1.5, 251.250, '2025-02-28', 'pending', v_user_id, 'En attente de paiement');

RAISE NOTICE 'Données de test insérées avec succès!';
RAISE NOTICE 'USER ID utilisé: %', v_user_id;
RAISE NOTICE 'Nombre de clients: 5';
RAISE NOTICE 'Nombre de fournisseurs: 3';
RAISE NOTICE 'Nombre d''articles: 8';
RAISE NOTICE 'Nombre de factures: 4';
RAISE NOTICE 'Nombre de devis: 3';
RAISE NOTICE 'Nombre de bons de livraison: 3';

END $$;

-- ============================================
-- VERIFICATION DES DONNÉES
-- ============================================

-- Vérifier les totaux
SELECT 
    'Clients' as table_name, COUNT(*) as count FROM public.clients
UNION ALL
SELECT 'Suppliers', COUNT(*) FROM public.suppliers
UNION ALL
SELECT 'Items', COUNT(*) FROM public.items
UNION ALL
SELECT 'Invoices', COUNT(*) FROM public.invoices
UNION ALL
SELECT 'Quotes', COUNT(*) FROM public.quotes
UNION ALL
SELECT 'Delivery Notes', COUNT(*) FROM public.delivery_notes
UNION ALL
SELECT 'Purchase Orders', COUNT(*) FROM public.purchase_orders
UNION ALL
SELECT 'Bank Accounts', COUNT(*) FROM public.bank_accounts
UNION ALL
SELECT 'Checks', COUNT(*) FROM public.checks
UNION ALL
SELECT 'Financial Transactions', COUNT(*) FROM public.financial_transactions
UNION ALL
SELECT 'Stock Movements', COUNT(*) FROM public.stock_movements;
