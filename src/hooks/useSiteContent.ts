
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type SiteContentValue<T> = {
  key: string;
  value: T;
};

// Local Json type compatible with Supabase expectations
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export function useSiteContent<T>(key: string, defaults?: T) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["site_content", key],
    queryFn: async () => {
      console.log("[useSiteContent] fetching", key);
      const { data, error } = await supabase
        .from("site_content")
        .select("key, value")
        .eq("key", key)
        .maybeSingle();

      if (error) {
        console.warn("[useSiteContent] fetch error", error);
        // If row not found or any error, return defaults if provided
        return (defaults ? { key, value: defaults } : null) as SiteContentValue<T> | null;
      }

      if (!data) {
        // No row exists yet; return defaults if provided
        return (defaults ? { key, value: defaults } : null) as SiteContentValue<T> | null;
      }

      return data as SiteContentValue<T>;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (value: T) => {
      console.log("[useSiteContent] saving", key, value);
      const payload = { key, value: (value as unknown) as Json };
      const { error } = await supabase
        .from("site_content")
        .upsert(payload, { onConflict: "key" });
      if (error) throw error;
      return value;
    },
    onSuccess: (value) => {
      console.log("[useSiteContent] saved ok", key);
      queryClient.setQueryData(["site_content", key], { key, value } as SiteContentValue<T>);
    },
    meta: {
      onError: (error: unknown) => {
        console.error("[useSiteContent] save error meta", error);
      },
    },
  });

  // Realtime updates: keep the query in sync
  useEffect(() => {
    const channel = supabase
      .channel(`site_content_${key}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_content", filter: `key=eq.${key}` },
        (payload) => {
          console.log("[useSiteContent] realtime payload", payload);
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const row = payload.new as { key: string; value: T };
            queryClient.setQueryData(["site_content", key], row);
          }
          if (payload.eventType === "DELETE") {
            // On delete, fall back to defaults in local cache if provided
            if (defaults) {
              queryClient.setQueryData(["site_content", key], { key, value: defaults } as SiteContentValue<T>);
            } else {
              queryClient.removeQueries({ queryKey: ["site_content", key] });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("[useSiteContent] realtime status", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [key, defaults, queryClient]);

  return {
    value: (data?.value as T | undefined) ?? (defaults as T | undefined),
    isLoading,
    error,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}

