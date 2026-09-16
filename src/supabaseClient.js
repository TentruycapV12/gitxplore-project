import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://awwiskafsxllxszitofx.supabase.co';
const supabaseAnonKey = 'sb_publishable_FII4Fisp5luvFOXnl4gIiw_6BuSRfvU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);