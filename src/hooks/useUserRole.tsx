import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'mentee' | 'mentor' | 'admin';

export const useUserRole = (userId?: string) => {
  return useQuery({
    queryKey: ['userRole', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }
      
      return data?.map((r) => r.role as UserRole) || [];
    },
    enabled: !!userId,
  });
};

export const useHasRole = (userId: string | undefined, role: UserRole) => {
  const { data: roles } = useUserRole(userId);
  return roles?.includes(role) || false;
};
