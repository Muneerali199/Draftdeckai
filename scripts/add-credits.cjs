const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addCredits() {
    console.log('Adding credits to users...');
    const targetEmail = process.argv[2] || process.env.TARGET_EMAIL;

    if (!targetEmail) {
        console.error('Missing target email. Provide it as a command-line argument or set TARGET_EMAIL.');
        process.exit(1);
    }
    try {
        // 1. Get User ID from Auth
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) throw listError;

        const targetUser = users.find(u => u.email === targetEmail);

        if (targetUser) {
            console.log(`Found user: ${targetUser.id} (${targetUser.email})`);

            // Update user_credits for this specific user
            const { error } = await supabase
                .from('user_credits')
                .update({
                    credits_total: 1000,
                    credits_used: 0
                })
                .eq('user_id', targetUser.id);

            if (error) {
                console.error('Error updating credits:', error.message);
            } else {
                console.log('Successfully updated credits for user! (1000 total, 0 used)');
            }
        } else {
            console.log(`User ${targetEmail} not found. Attempting to update ALL records in user_credits...`);

            const { data, error } = await supabase
                .from('user_credits')
                .update({
                    credits_total: 1000,
                    credits_used: 0
                })
                .select();

            if (error) {
                console.error('Error updating all credits:', error.message);
            } else {
                console.log(`Updated credits for ${data.length} users.`);
            }
        }

    } catch (error) {
        console.error('Script failed:', error);
    }
}

addCredits();
