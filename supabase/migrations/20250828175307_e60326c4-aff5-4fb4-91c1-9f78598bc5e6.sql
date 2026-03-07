-- Fix infinite recursion in family RLS policies step by step

-- Drop problematic policies first
DROP POLICY IF EXISTS "Family members can view SOS events for their groups" ON sos_events;
DROP POLICY IF EXISTS "Family members can view their group" ON family_groups;

-- Fix family_groups policies
DROP POLICY IF EXISTS "Family members can view their group" ON family_groups;
CREATE POLICY "Family group owners can manage their groups" 
ON family_groups 
FOR ALL 
USING (owner_user_id = auth.uid()) 
WITH CHECK (owner_user_id = auth.uid());

-- Fix family_memberships policies (if table exists)
-- First check if the table exists and drop problematic policies
DO $$ 
BEGIN
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
END $$;