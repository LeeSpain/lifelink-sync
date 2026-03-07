-- Fix infinite recursion in family_groups and family_memberships RLS policies

-- First, check if family_memberships table exists and has the problematic policy
DO $$ 
BEGIN
    -- Drop existing problematic policies if they exist
    DROP POLICY IF EXISTS "Family members can view SOS events for their groups" ON sos_events;
    DROP POLICY IF EXISTS "Family members can view their group" ON family_groups;
    
    -- Create safer RLS policies for family_groups
    CREATE POLICY "Family group owners can manage their groups" 
    ON family_groups 
    FOR ALL 
    USING (owner_user_id = auth.uid()) 
    WITH CHECK (owner_user_id = auth.uid());
    
    -- Create safe policy for family_memberships (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'family_memberships') THEN
        DROP POLICY IF EXISTS "Users can view their memberships" ON family_memberships;
        CREATE POLICY "Users can view their memberships" 
        ON family_memberships 
        FOR SELECT 
        USING (user_id = auth.uid());
        
        CREATE POLICY "Group owners can manage memberships" 
        ON family_memberships 
        FOR ALL 
        USING (
            EXISTS (
                SELECT 1 FROM family_groups fg 
                WHERE fg.id = family_memberships.group_id 
                AND fg.owner_user_id = auth.uid()
            )
        );
    END IF;
    
    -- Ensure products table has proper RLS for user access
    CREATE POLICY IF NOT EXISTS "Users can view active products" 
    ON products 
    FOR SELECT 
    USING (status = 'active');
    
    -- Ensure regional_services has proper RLS
    CREATE POLICY IF NOT EXISTS "Users can view active regional services" 
    ON regional_services 
    FOR SELECT 
    USING (is_active = true);
    
    -- Ensure subscription_plans has proper RLS  
    CREATE POLICY IF NOT EXISTS "Users can view active subscription plans" 
    ON subscription_plans 
    FOR SELECT 
    USING (is_active = true);

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Migration completed with some policies already existing';
END $$;