import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

export const supabase =
  env.SUPABASE_URL && env.SUPABASE_SECRET_KEY
    ? createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
        auth: {
          persistSession: false,
        },
      })
    : null;
