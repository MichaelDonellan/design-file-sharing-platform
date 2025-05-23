-- Script to remove all references to a user and then delete the user
-- Replace 'tammylouise407@gmail.com' with the email of the user to delete

-- First, find the user's ID
DO $$
DECLARE
    user_id_var UUID;
    found_user BOOLEAN := FALSE;
BEGIN
    -- Get user ID from auth.users table
    SELECT id INTO user_id_var
    FROM auth.users
    WHERE email = 'tammylouise407@gmail.com';

    IF user_id_var IS NOT NULL THEN
        found_user := TRUE;
        RAISE NOTICE 'Found user with ID: %', user_id_var;
    ELSE
        RAISE NOTICE 'User not found with email: tammylouise407@gmail.com';
        RETURN;
    END IF;

    -- Delete user's designs
    IF found_user THEN
        -- First, handle design_files
        DELETE FROM design_files
        WHERE design_id IN (SELECT id FROM designs WHERE user_id = user_id_var);
        RAISE NOTICE 'Deleted design files';

        -- Handle design_mockups
        DELETE FROM design_mockups
        WHERE design_id IN (SELECT id FROM designs WHERE user_id = user_id_var);
        RAISE NOTICE 'Deleted design mockups';

        -- Handle design_favorites
        DELETE FROM design_favorites
        WHERE design_id IN (SELECT id FROM designs WHERE user_id = user_id_var);
        RAISE NOTICE 'Deleted design favorites';

        -- Handle reviews for user's designs
        DELETE FROM reviews
        WHERE design_id IN (SELECT id FROM designs WHERE user_id = user_id_var);
        RAISE NOTICE 'Deleted reviews for user designs';

        -- Delete user's designs
        DELETE FROM designs
        WHERE user_id = user_id_var;
        RAISE NOTICE 'Deleted designs';

        -- Delete user's reviews
        DELETE FROM reviews
        WHERE user_id = user_id_var;
        RAISE NOTICE 'Deleted user reviews';

        -- Delete user's favorites
        DELETE FROM design_favorites
        WHERE user_id = user_id_var;
        RAISE NOTICE 'Deleted user favorites';

        -- Delete user's purchases
        DELETE FROM purchases
        WHERE user_id = user_id_var;
        RAISE NOTICE 'Deleted user purchases';

        -- Delete user's store if exists
        DELETE FROM stores
        WHERE user_id = user_id_var;
        RAISE NOTICE 'Deleted user store';

        -- Delete from admin_emails if exists
        DELETE FROM admin_emails
        WHERE email = 'tammylouise407@gmail.com';
        RAISE NOTICE 'Deleted from admin_emails';

        -- Handle any other tables that might reference this user
        -- Add more DELETE statements as needed based on your schema
    END IF;
END $$;

-- After running the above script and ensuring all references are removed,
-- you can delete the user from the auth.users table using Supabase's admin functions
-- Note: This needs to be done through the Supabase dashboard or API
