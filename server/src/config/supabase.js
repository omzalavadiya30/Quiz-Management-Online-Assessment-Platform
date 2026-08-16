import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SECRET_KEY, SUPABASE_URL } from "./constants.js";
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY); 
export default supabase;