import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string;

export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const supabase = hasSupabase
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : (null as any);


