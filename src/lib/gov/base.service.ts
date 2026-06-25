// src/lib/gov/base.service.ts

import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

export class BaseService {
  protected supabase = supabase;

  protected handleError(error: PostgrestError | null): never {
    if (error) {
      throw new Error(error.message);
    }
    throw new Error('An unknown error occurred');
  }

  protected async withErrorHandling<T>(
    operation: () => Promise<{ data: T | null; error: PostgrestError | null }>
  ): Promise<T> {
    const { data, error } = await operation();
    if (error) {
      throw new Error(error.message);
    }
    return data as T;
  }

  protected async withErrorHandlingArray<T>(
    operation: () => Promise<{ data: T[] | null; error: PostgrestError | null }>
  ): Promise<T[]> {
    const { data, error } = await operation();
    if (error) {
      throw new Error(error.message);
    }
    return data || [];
  }
}
