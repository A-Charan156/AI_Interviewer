
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    console.warn('Invalid Supabase URL. Please check your .env.local file.');
    throw new Error('Invalid Supabase URL: ' + supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
