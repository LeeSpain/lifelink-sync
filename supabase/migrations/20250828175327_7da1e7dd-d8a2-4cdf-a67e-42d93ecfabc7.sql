-- Drop all problematic family policies to fix infinite recursion
DROP POLICY IF EXISTS "Group owners can manage memberships" ON family_memberships;
DROP POLICY IF EXISTS "Users can view their memberships" ON family_memberships;
DROP POLICY IF EXISTS "Family group owners can manage their groups" ON family_groups;

-- Create new clean policies
DROP POLICY IF EXISTS "Family group owners manage groups" ON family_groups;
CREATE POLICY "Family group owners manage groups" 
ON family_groups 
FOR ALL 
USING (owner_user_id = auth.uid()) 
WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Users view own memberships" ON family_memberships;
CREATE POLICY "Users view own memberships" 
ON family_memberships 
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners manage group memberships" ON family_memberships;
CREATE POLICY "Owners manage group memberships" 
ON family_memberships 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM family_groups fg 
        WHERE fg.id = family_memberships.group_id 
        AND fg.owner_user_id = auth.uid()
    )
);