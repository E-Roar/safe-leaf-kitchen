import { createClient } from '@supabase/supabase-js'

// Mock implementation to prevent console errors and crash until full rollout
export const supabase = {
  from: (table: string) => ({
    select: (columns: string = '*') => {
      const mockQuery = {
        order: (column: string) => Promise.resolve({ data: null, error: { message: "Supabase disabled" } }),
        eq: (column: string, value: any) => Promise.resolve({ data: null, error: { message: "Supabase disabled" } }),
        neq: (column: string, value: any) => Promise.resolve({ data: null, error: { message: "Supabase disabled" } }),
        in: (column: string, values: any[]) => Promise.resolve({ data: null, error: { message: "Supabase disabled" } }),
        then: (resolve: any) => resolve({ data: null, error: { message: "Supabase disabled" } })
      };
      
      // Allow it to be awaitable directly like `await supabase.from('x').select('*')`
      (mockQuery as any).then = function(resolve: any) {
         return resolve({ data: null, error: { message: "Supabase disabled" } });
      };
      
      return mockQuery;
    },
    insert: (data: any) => Promise.resolve({ data: null, error: { message: "Supabase disabled" } }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: { message: "Supabase disabled" } })
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: { message: "Supabase disabled" } })
    })
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  }
} as any;
