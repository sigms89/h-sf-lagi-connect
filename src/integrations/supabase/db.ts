// Type-safe wrapper for Supabase client
// Provides access to all tables including those from migrations

import { supabase } from '@/integrations/supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = typeof supabase & { from: (table: string) => any };

/**
 * Get the supabase client with any-typed table access.
 * Use this for tables created in migrations that may not yet be
 * reflected in the auto-generated types.ts file.
 */
export const db = supabase as unknown as AnyClient;

export { supabase };
