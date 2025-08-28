-- ============================================================================
-- CREDIT CARDS COMPLETE SETUP - MATCHING USER SCHEMA
-- ============================================================================
-- This script creates the credit_cards table matching the user's schema

-- Step 1: Create the credit_cards table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.credit_cards (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NULL,
    card_number_hash character varying(255) NOT NULL,
    card_type character varying(50) NULL,
    expiry_month integer NULL,
    expiry_year integer NULL,
    is_active boolean NULL DEFAULT true,
    created_at timestamp without time zone NULL DEFAULT CURRENT_TIMESTAMP,
    card_number character varying(19) NOT NULL,
    status character varying(20) NOT NULL DEFAULT 'available'::character varying,
    price numeric(10, 2) NOT NULL DEFAULT 0.00,
    imported_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT credit_cards_pkey PRIMARY KEY (id),
    CONSTRAINT credit_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON public.credit_cards USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_credit_cards_status ON public.credit_cards(status);
CREATE INDEX IF NOT EXISTS idx_credit_cards_price ON public.credit_cards(price);
CREATE INDEX IF NOT EXISTS idx_credit_cards_imported_at ON public.credit_cards(imported_at);
CREATE INDEX IF NOT EXISTS idx_credit_cards_card_number ON public.credit_cards(card_number);

-- Step 3: Add unique constraint on card_number to prevent duplicates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'credit_cards' 
        AND constraint_name = 'unique_card_number'
        AND constraint_type = 'UNIQUE'
    ) THEN
        -- Add unique constraint on card_number
        ALTER TABLE public.credit_cards ADD CONSTRAINT unique_card_number UNIQUE (card_number);
        RAISE NOTICE 'Unique constraint unique_card_number added successfully';
    ELSE
        RAISE NOTICE 'Unique constraint unique_card_number already exists';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Unique constraint already exists';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding constraint: %', SQLERRM;
END $$;

-- Step 4: Create the update_month function if it doesn't exist
CREATE OR REPLACE FUNCTION update_month()
RETURNS TRIGGER AS $$
BEGIN
    -- This function can be customized based on your needs
    -- For now, it's a placeholder that can be extended
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create the trigger
DROP TRIGGER IF EXISTS trg_update_month ON public.credit_cards;
CREATE TRIGGER trg_update_month 
    BEFORE INSERT OR UPDATE ON public.credit_cards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_month();

-- Step 6: Check if the table was created successfully
SELECT 'Table credit_cards created/verified successfully' as status;

-- Step 7: Check for existing duplicates before adding constraint
SELECT 'Checking for existing duplicates...' as status;

SELECT card_number, COUNT(*) as count
FROM public.credit_cards 
GROUP BY card_number 
HAVING COUNT(*) > 1;

-- Step 8: Verify the constraint was added
SELECT 
    constraint_name,
    constraint_type,
    table_name,
    column_name
FROM information_schema.table_constraints 
WHERE table_name = 'credit_cards' 
AND constraint_type = 'UNIQUE';

-- Step 9: Verify all indexes were created
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename = 'credit_cards' 
ORDER BY indexname;

-- Step 10: Show final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'credit_cards' 
ORDER BY ordinal_position;

-- Step 11: Create a view for available credit cards (for users to purchase)
CREATE OR REPLACE VIEW available_credit_cards AS
SELECT 
    id,
    card_number,
    card_type,
    expiry_month,
    expiry_year,
    price,
    status,
    imported_at
FROM public.credit_cards 
WHERE status = 'available'
AND is_active = true
AND imported_at IS NOT NULL;

-- Step 12: Final verification
SELECT 
    'Credit cards setup complete!' as message,
    (SELECT COUNT(*) FROM public.credit_cards) as total_cards,
    (SELECT COUNT(*) FROM public.credit_cards WHERE status = 'available') as available_cards,
    (SELECT COUNT(*) FROM public.credit_cards WHERE status = 'sold') as sold_cards;
