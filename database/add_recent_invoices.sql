-- Add recent invoices for September 2025 - January 2026
-- Run this script in Supabase SQL Editor

DO $$ 
DECLARE
    v_user_id uuid;
    v_client1_id uuid;
    v_client2_id uuid;
    v_client3_id uuid;
BEGIN
    -- Get existing user and client IDs
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'electrika@gmail.com' LIMIT 1;
    
    SELECT id INTO v_client1_id FROM public.clients WHERE user_id = v_user_id ORDER BY created_at LIMIT 1;
    SELECT id INTO v_client2_id FROM public.clients WHERE user_id = v_user_id ORDER BY created_at OFFSET 1 LIMIT 1;
    SELECT id INTO v_client3_id FROM public.clients WHERE user_id = v_user_id ORDER BY created_at OFFSET 2 LIMIT 1;
    
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

    -- January 2026 invoices
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

    RAISE NOTICE '✅ Successfully added 10 new invoices for Sep 2025 - Jan 2026';
END $$;
