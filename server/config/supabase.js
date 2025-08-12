const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ldryyqggdllmvdkcyrst.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxkcnl5cWdnZGxsbXZka2N5cnN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgxMTkyOSwiZXhwIjoyMDY5Mzg3OTI5fQ.1kcnOnUeYS2mN7YD0ikNdJ0ym0fWsFgtPp-axG39ji4';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase; 