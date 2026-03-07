export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          category: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          priority: string
          read_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          category?: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_model_settings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      auth_failures: {
        Row: {
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          email: string | null
          failure_reason: string
          id: string
          ip_address: unknown
          last_attempt_at: string | null
          user_agent: string | null
        }
        Insert: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          email?: string | null
          failure_reason: string
          id?: string
          ip_address?: unknown
          last_attempt_at?: string | null
          user_agent?: string | null
        }
        Update: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          email?: string | null
          failure_reason?: string
          id?: string
          ip_address?: unknown
          last_attempt_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      auto_reply_queue: {
        Row: {
          category_id: string | null
          confidence_score: number
          conversation_id: string
          created_at: string
          generated_reply: string
          id: string
          original_message_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scheduled_send_at: string | null
          sent_at: string | null
          status: string
          template_used: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          confidence_score?: number
          conversation_id: string
          created_at?: string
          generated_reply: string
          id?: string
          original_message_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_send_at?: string | null
          sent_at?: string | null
          status?: string
          template_used?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          confidence_score?: number
          conversation_id?: string
          created_at?: string
          generated_reply?: string
          id?: string
          original_message_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_send_at?: string | null
          sent_at?: string | null
          status?: string
          template_used?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          content: string
          content_id: string | null
          created_at: string
          excerpt: string | null
          featured_image: string | null
          featured_image_alt: string | null
          id: string
          keywords: string[] | null
          meta_description: string | null
          published_at: string | null
          reading_time: number | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          content: string
          content_id?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          featured_image_alt?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          published_at?: string | null
          reading_time?: number | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          content?: string
          content_id?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          featured_image_alt?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          published_at?: string | null
          reading_time?: number | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "marketing_content"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_campaigns: {
        Row: {
          channel: string
          completed_at: string | null
          content_template: string
          created_at: string
          created_by: string | null
          delivered_count: number | null
          description: string | null
          failed_count: number | null
          id: string
          name: string
          scheduled_at: string | null
          sent_count: number | null
          started_at: string | null
          status: string
          subject_template: string | null
          target_criteria: Json
          template_id: string | null
          total_recipients: number | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          channel: string
          completed_at?: string | null
          content_template: string
          created_at?: string
          created_by?: string | null
          delivered_count?: number | null
          description?: string | null
          failed_count?: number | null
          id?: string
          name: string
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string
          subject_template?: string | null
          target_criteria?: Json
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          channel?: string
          completed_at?: string | null
          content_template?: string
          created_at?: string
          created_by?: string | null
          delivered_count?: number | null
          description?: string | null
          failed_count?: number | null
          id?: string
          name?: string
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string
          subject_template?: string | null
          target_criteria?: Json
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      business_hours: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
        }
        Relationships: []
      }
      campaign_analytics: {
        Row: {
          campaign_id: string
          created_at: string
          date: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_value: number
          platform: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          date?: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_value: number
          platform: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          date?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_value?: number
          platform?: string
        }
        Relationships: []
      }
      campaign_recipients: {
        Row: {
          campaign_id: string
          created_at: string
          delivered_at: string | null
          email: string | null
          error_message: string | null
          id: string
          name: string | null
          phone: string | null
          sent_at: string | null
          status: string
          user_id: string | null
          variables_used: Json | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          delivered_at?: string | null
          email?: string | null
          error_message?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          sent_at?: string | null
          status?: string
          user_id?: string | null
          variables_used?: Json | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          delivered_at?: string | null
          email?: string | null
          error_message?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          sent_at?: string | null
          status?: string
          user_id?: string | null
          variables_used?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "bulk_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_permissions: {
        Row: {
          can_view_devices: boolean | null
          can_view_history: boolean | null
          can_view_location: boolean | null
          created_at: string | null
          family_user_id: string
          id: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          can_view_devices?: boolean | null
          can_view_history?: boolean | null
          can_view_location?: boolean | null
          created_at?: string | null
          family_user_id: string
          id?: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          can_view_devices?: boolean | null
          can_view_history?: boolean | null
          can_view_location?: boolean | null
          created_at?: string | null
          family_user_id?: string
          id?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      communication_analytics: {
        Row: {
          category_breakdown: Json | null
          channel: string
          created_at: string
          date: string
          id: string
          metric_type: string
          metric_value: number
          user_breakdown: Json | null
        }
        Insert: {
          category_breakdown?: Json | null
          channel: string
          created_at?: string
          date: string
          id?: string
          metric_type: string
          metric_value: number
          user_breakdown?: Json | null
        }
        Update: {
          category_breakdown?: Json | null
          channel?: string
          created_at?: string
          date?: string
          id?: string
          metric_type?: string
          metric_value?: number
          user_breakdown?: Json | null
        }
        Relationships: []
      }
      communication_preferences: {
        Row: {
          created_at: string
          email_notifications: boolean | null
          id: string
          marketing_emails: boolean | null
          phone_number: string | null
          preferred_channel: string | null
          updated_at: string
          user_id: string
          whatsapp_notifications: boolean | null
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          phone_number?: string | null
          preferred_channel?: string | null
          updated_at?: string
          user_id: string
          whatsapp_notifications?: boolean | null
        }
        Update: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          phone_number?: string | null
          preferred_channel?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_notifications?: boolean | null
        }
        Relationships: []
      }
      competitor_analysis: {
        Row: {
          analysis_date: string | null
          avg_engagement_rate: number | null
          competitor_handle: string
          competitor_name: string
          created_at: string | null
          follower_count: number | null
          id: string
          metadata: Json | null
          platform: string
          posting_frequency: number | null
          top_content_types: string[] | null
          trending_hashtags: string[] | null
        }
        Insert: {
          analysis_date?: string | null
          avg_engagement_rate?: number | null
          competitor_handle: string
          competitor_name: string
          created_at?: string | null
          follower_count?: number | null
          id?: string
          metadata?: Json | null
          platform: string
          posting_frequency?: number | null
          top_content_types?: string[] | null
          trending_hashtags?: string[] | null
        }
        Update: {
          analysis_date?: string | null
          avg_engagement_rate?: number | null
          competitor_handle?: string
          competitor_name?: string
          created_at?: string | null
          follower_count?: number | null
          id?: string
          metadata?: Json | null
          platform?: string
          posting_frequency?: number | null
          top_content_types?: string[] | null
          trending_hashtags?: string[] | null
        }
        Relationships: []
      }
      connections: {
        Row: {
          accepted_at: string | null
          contact_user_id: string | null
          created_at: string | null
          escalation_priority: number | null
          id: string
          invite_email: string | null
          invite_token: string | null
          invited_at: string | null
          notify_channels: Json | null
          owner_id: string
          preferred_language: string | null
          relationship: string | null
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          contact_user_id?: string | null
          created_at?: string | null
          escalation_priority?: number | null
          id?: string
          invite_email?: string | null
          invite_token?: string | null
          invited_at?: string | null
          notify_channels?: Json | null
          owner_id: string
          preferred_language?: string | null
          relationship?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          contact_user_id?: string | null
          created_at?: string | null
          escalation_priority?: number | null
          id?: string
          invite_email?: string | null
          invite_token?: string | null
          invited_at?: string | null
          notify_channels?: Json | null
          owner_id?: string
          preferred_language?: string | null
          relationship?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          admin_response: string | null
          created_at: string
          email: string
          id: string
          ip_address: string | null
          message: string
          name: string
          responded_at: string | null
          responded_by: string | null
          session_id: string | null
          status: string
          subject: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          message: string
          name: string
          responded_at?: string | null
          responded_by?: string | null
          session_id?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          message?: string
          name?: string
          responded_at?: string | null
          responded_by?: string | null
          session_id?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      content_ab_tests: {
        Row: {
          campaign_id: string | null
          confidence_level: number | null
          ended_at: string | null
          id: string
          metadata: Json | null
          started_at: string | null
          statistical_significance: boolean | null
          status: string | null
          test_name: string
          traffic_split: number | null
          variant_a_content_id: string | null
          variant_b_content_id: string | null
          winner_variant: string | null
        }
        Insert: {
          campaign_id?: string | null
          confidence_level?: number | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          statistical_significance?: boolean | null
          status?: string | null
          test_name: string
          traffic_split?: number | null
          variant_a_content_id?: string | null
          variant_b_content_id?: string | null
          winner_variant?: string | null
        }
        Update: {
          campaign_id?: string | null
          confidence_level?: number | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          statistical_significance?: boolean | null
          status?: string | null
          test_name?: string
          traffic_split?: number | null
          variant_a_content_id?: string | null
          variant_b_content_id?: string | null
          winner_variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_ab_tests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_ab_tests_variant_a_content_id_fkey"
            columns: ["variant_a_content_id"]
            isOneToOne: false
            referencedRelation: "marketing_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_ab_tests_variant_b_content_id_fkey"
            columns: ["variant_b_content_id"]
            isOneToOne: false
            referencedRelation: "marketing_content"
            referencedColumns: ["id"]
          },
        ]
      }
      content_approval_workflow: {
        Row: {
          approval_status: string
          approved_at: string | null
          assigned_to: string | null
          content_id: string
          created_at: string
          id: string
          rejected_at: string | null
          reviewer_notes: string | null
          updated_at: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          assigned_to?: string | null
          content_id: string
          created_at?: string
          id?: string
          rejected_at?: string | null
          reviewer_notes?: string | null
          updated_at?: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          assigned_to?: string | null
          content_id?: string
          created_at?: string
          id?: string
          rejected_at?: string | null
          reviewer_notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      content_generation_requests: {
        Row: {
          campaign_id: string | null
          completed_at: string | null
          content_type: string
          created_at: string | null
          error_message: string | null
          generated_content: string | null
          generated_image_url: string | null
          generation_metadata: Json | null
          id: string
          platform: string
          prompt: string
          status: string | null
        }
        Insert: {
          campaign_id?: string | null
          completed_at?: string | null
          content_type: string
          created_at?: string | null
          error_message?: string | null
          generated_content?: string | null
          generated_image_url?: string | null
          generation_metadata?: Json | null
          id?: string
          platform: string
          prompt: string
          status?: string | null
        }
        Update: {
          campaign_id?: string | null
          completed_at?: string | null
          content_type?: string
          created_at?: string | null
          error_message?: string | null
          generated_content?: string | null
          generated_image_url?: string | null
          generation_metadata?: Json | null
          id?: string
          platform?: string
          prompt?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_generation_requests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      content_moderation: {
        Row: {
          ai_analysis: Json | null
          confidence_score: number | null
          content_id: string | null
          created_at: string | null
          flagged_reasons: string[] | null
          id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_type: string
          status: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          confidence_score?: number | null
          content_id?: string | null
          created_at?: string | null
          flagged_reasons?: string[] | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_type: string
          status?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          confidence_score?: number | null
          content_id?: string | null
          created_at?: string | null
          flagged_reasons?: string[] | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_type?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_moderation_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "marketing_content"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          conversation_id: string
          id: string
          is_active: boolean | null
          role: string
          unassigned_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          conversation_id: string
          id?: string
          is_active?: boolean | null
          role?: string
          unassigned_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          conversation_id?: string
          id?: string
          is_active?: boolean | null
          role?: string
          unassigned_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_assignments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "unified_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_categories: {
        Row: {
          ai_confidence_threshold: number | null
          auto_assign_to_user: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          keywords: string[] | null
          name: string
          priority_level: number | null
          response_template_id: string | null
          updated_at: string
        }
        Insert: {
          ai_confidence_threshold?: number | null
          auto_assign_to_user?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          name: string
          priority_level?: number | null
          response_template_id?: string | null
          updated_at?: string
        }
        Update: {
          ai_confidence_threshold?: number | null
          auto_assign_to_user?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          name?: string
          priority_level?: number | null
          response_template_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      conversation_handovers: {
        Row: {
          conversation_id: string
          created_at: string
          from_user_id: string | null
          handover_type: string
          id: string
          initiated_by: string | null
          notes: string | null
          reason: string | null
          to_user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          from_user_id?: string | null
          handover_type: string
          id?: string
          initiated_by?: string | null
          notes?: string | null
          reason?: string | null
          to_user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          from_user_id?: string | null
          handover_type?: string
          id?: string
          initiated_by?: string | null
          notes?: string | null
          reason?: string | null
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_handovers_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "unified_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          content: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_type: string
          metadata?: Json | null
          session_id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_notes: {
        Row: {
          created_at: string | null
          created_by: string
          customer_id: string
          id: string
          is_important: boolean | null
          note_text: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          customer_id: string
          id?: string
          is_important?: boolean | null
          note_text: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          customer_id?: string
          id?: string
          is_important?: boolean | null
          note_text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_regional_services: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          auto_renew: boolean | null
          created_at: string | null
          customer_id: string
          deactivated_at: string | null
          end_date: string | null
          id: string
          notes: string | null
          price_override: number | null
          service_id: string
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          auto_renew?: boolean | null
          created_at?: string | null
          customer_id: string
          deactivated_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          price_override?: number | null
          service_id: string
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          auto_renew?: boolean | null
          created_at?: string | null
          customer_id?: string
          deactivated_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          price_override?: number | null
          service_id?: string
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_regional_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "regional_services"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_tag_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string
          customer_id: string
          id: string
          tag_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by: string
          customer_id: string
          id?: string
          tag_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string
          customer_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "customer_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_tags: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      devices_flic_buttons: {
        Row: {
          created_at: string
          flic_uuid: string
          id: string
          last_voltage: number | null
          name: string | null
          owner_user: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          flic_uuid: string
          id?: string
          last_voltage?: number | null
          name?: string | null
          owner_user: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          flic_uuid?: string
          id?: string
          last_voltage?: number | null
          name?: string | null
          owner_user?: string
          updated_at?: string
        }
        Relationships: []
      }
      devices_flic_events: {
        Row: {
          button_id: string
          event: string
          id: string
          ts: string
        }
        Insert: {
          button_id: string
          event: string
          id?: string
          ts?: string
        }
        Update: {
          button_id?: string
          event?: string
          id?: string
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_flic_events_button_id_fkey"
            columns: ["button_id"]
            isOneToOne: false
            referencedRelation: "devices_flic_buttons"
            referencedColumns: ["id"]
          },
        ]
      }
      email_automation_settings: {
        Row: {
          created_at: string
          description: string | null
          email_template: string
          id: string
          is_enabled: boolean
          last_run_at: string | null
          name: string
          next_run_at: string | null
          recipient_filter: string
          trigger_config: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          email_template: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          recipient_filter?: string
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          email_template?: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          recipient_filter?: string
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          click_count: number | null
          content: string | null
          content_id: string | null
          created_at: string
          created_by: string | null
          id: string
          metadata: Json | null
          name: string
          open_count: number | null
          recipient_count: number | null
          scheduled_at: string | null
          sender_email: string | null
          sender_name: string | null
          sent_at: string | null
          sent_count: number | null
          status: string
          subject: string
          template_id: string | null
          template_name: string
          text_content: string | null
          tracking_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          click_count?: number | null
          content?: string | null
          content_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          name: string
          open_count?: number | null
          recipient_count?: number | null
          scheduled_at?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject: string
          template_id?: string | null
          template_name: string
          text_content?: string | null
          tracking_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          click_count?: number | null
          content?: string | null
          content_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          open_count?: number | null
          recipient_count?: number | null
          scheduled_at?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject?: string
          template_id?: string | null
          template_name?: string
          text_content?: string | null
          tracking_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "marketing_content"
            referencedColumns: ["id"]
          },
        ]
      }
      email_delivery_log: {
        Row: {
          bounce_reason: string | null
          bounced_at: string | null
          campaign_id: string | null
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_status: string
          email_queue_id: string | null
          id: string
          opened_at: string | null
          provider_message_id: string | null
          provider_response: Json | null
          recipient_email: string
          retry_count: number | null
          updated_at: string | null
        }
        Insert: {
          bounce_reason?: string | null
          bounced_at?: string | null
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_status?: string
          email_queue_id?: string | null
          id?: string
          opened_at?: string | null
          provider_message_id?: string | null
          provider_response?: Json | null
          recipient_email: string
          retry_count?: number | null
          updated_at?: string | null
        }
        Update: {
          bounce_reason?: string | null
          bounced_at?: string | null
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_status?: string
          email_queue_id?: string | null
          id?: string
          opened_at?: string | null
          provider_message_id?: string | null
          provider_response?: Json | null
          recipient_email?: string
          retry_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_delivery_log_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_delivery_log_email_queue_id_fkey"
            columns: ["email_queue_id"]
            isOneToOne: false
            referencedRelation: "email_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          campaign_id: string | null
          clicked_at: string | null
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          opened_at: string | null
          provider_message_id: string | null
          recipient_email: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          provider_message_id?: string | null
          recipient_email: string
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          provider_message_id?: string | null
          recipient_email?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          automation_id: string | null
          body: string
          campaign_id: string | null
          created_at: string
          error_message: string | null
          id: string
          priority: number
          recipient_email: string
          recipient_user_id: string | null
          scheduled_at: string
          sent_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          automation_id?: string | null
          body: string
          campaign_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          priority?: number
          recipient_email: string
          recipient_user_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          automation_id?: string | null
          body?: string
          campaign_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          priority?: number
          recipient_email?: string
          recipient_user_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "email_automation_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_template: string
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          subject_template: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          body_template: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject_template: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          body_template?: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject_template?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string
          priority: number
          relationship: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone: string
          priority?: number
          relationship?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string
          priority?: number
          relationship?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      emergency_escalation_log: {
        Row: {
          action_taken: string
          created_at: string
          event_id: string
          id: string
          metadata: Json | null
          provider_id: string
          response_time_ms: number | null
          service_request_id: string | null
          success: boolean
        }
        Insert: {
          action_taken: string
          created_at?: string
          event_id: string
          id?: string
          metadata?: Json | null
          provider_id: string
          response_time_ms?: number | null
          service_request_id?: string | null
          success?: boolean
        }
        Update: {
          action_taken?: string
          created_at?: string
          event_id?: string
          id?: string
          metadata?: Json | null
          provider_id?: string
          response_time_ms?: number | null
          service_request_id?: string | null
          success?: boolean
        }
        Relationships: []
      }
      emergency_service_requests: {
        Row: {
          additional_info: string | null
          created_at: string
          emergency_type: string
          event_id: string
          id: string
          location_data: Json | null
          provider_id: string
          provider_name: string
          request_timestamp: string
          response_data: Json | null
          severity: string
          status: string
          updated_at: string
          user_profile: Json | null
        }
        Insert: {
          additional_info?: string | null
          created_at?: string
          emergency_type: string
          event_id: string
          id?: string
          location_data?: Json | null
          provider_id: string
          provider_name: string
          request_timestamp?: string
          response_data?: Json | null
          severity: string
          status?: string
          updated_at?: string
          user_profile?: Json | null
        }
        Update: {
          additional_info?: string | null
          created_at?: string
          emergency_type?: string
          event_id?: string
          id?: string
          location_data?: Json | null
          provider_id?: string
          provider_name?: string
          request_timestamp?: string
          response_data?: Json | null
          severity?: string
          status?: string
          updated_at?: string
          user_profile?: Json | null
        }
        Relationships: []
      }
      emergency_test_results: {
        Row: {
          created_at: string
          detailed_results: Json | null
          duration_ms: number
          failure_reason: string | null
          id: string
          performance_metrics: Json | null
          steps_completed: number
          success: boolean
          test_id: string
          test_scenario: string
          test_timestamp: string
          test_type: string
          total_steps: number
        }
        Insert: {
          created_at?: string
          detailed_results?: Json | null
          duration_ms: number
          failure_reason?: string | null
          id?: string
          performance_metrics?: Json | null
          steps_completed?: number
          success?: boolean
          test_id: string
          test_scenario: string
          test_timestamp?: string
          test_type: string
          total_steps?: number
        }
        Update: {
          created_at?: string
          detailed_results?: Json | null
          duration_ms?: number
          failure_reason?: string | null
          id?: string
          performance_metrics?: Json | null
          steps_completed?: number
          success?: boolean
          test_id?: string
          test_scenario?: string
          test_timestamp?: string
          test_type?: string
          total_steps?: number
        }
        Relationships: []
      }
      error_tracking: {
        Row: {
          created_at: string
          error_message: string
          error_timestamp: string
          error_type: string
          id: string
          metadata: Json | null
          severity: string | null
          stack_trace: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message: string
          error_timestamp?: string
          error_type: string
          id?: string
          metadata?: Json | null
          severity?: string | null
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string
          error_timestamp?: string
          error_type?: string
          id?: string
          metadata?: Json | null
          severity?: string | null
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      family_alerts: {
        Row: {
          alert_data: Json | null
          alert_type: string
          created_at: string | null
          delivered_at: string | null
          event_id: string
          family_user_id: string
          id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          alert_data?: Json | null
          alert_type?: string
          created_at?: string | null
          delivered_at?: string | null
          event_id: string
          family_user_id: string
          id?: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          alert_data?: Json | null
          alert_type?: string
          created_at?: string | null
          delivered_at?: string | null
          event_id?: string
          family_user_id?: string
          id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_alerts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "sos_events"
            referencedColumns: ["id"]
          },
        ]
      }
      family_groups: {
        Row: {
          created_at: string | null
          id: string
          owner_seat_quota: number
          owner_user_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          owner_seat_quota?: number
          owner_user_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          owner_seat_quota?: number
          owner_user_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      family_invites: {
        Row: {
          accepted_at: string | null
          billing_type: string
          contact_id: string | null
          created_at: string
          expires_at: string
          group_id: string | null
          id: string
          invite_token: string
          invitee_email: string
          invitee_name: string
          inviter_email: string
          inviter_user_id: string
          name: string | null
          phone: string | null
          relationship: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          billing_type?: string
          contact_id?: string | null
          created_at?: string
          expires_at: string
          group_id?: string | null
          id?: string
          invite_token?: string
          invitee_email: string
          invitee_name: string
          inviter_email: string
          inviter_user_id: string
          name?: string | null
          phone?: string | null
          relationship?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          billing_type?: string
          contact_id?: string | null
          created_at?: string
          expires_at?: string
          group_id?: string | null
          id?: string
          invite_token?: string
          invitee_email?: string
          invitee_name?: string
          inviter_email?: string
          inviter_user_id?: string
          name?: string | null
          phone?: string | null
          relationship?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_invites_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "emergency_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_invites_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      family_memberships: {
        Row: {
          billing_status: string | null
          billing_type: string
          created_at: string | null
          group_id: string
          id: string
          status: string
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_status?: string | null
          billing_type: string
          created_at?: string | null
          group_id: string
          id?: string
          status: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_status?: string | null
          billing_type?: string
          created_at?: string | null
          group_id?: string
          id?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      family_notifications: {
        Row: {
          client_id: string | null
          delivered: boolean | null
          event_id: string | null
          id: string
          language: string | null
          message: string | null
          message_type: string | null
          sent_at: string | null
          sent_by: string | null
        }
        Insert: {
          client_id?: string | null
          delivered?: boolean | null
          event_id?: string | null
          id?: string
          language?: string | null
          message?: string | null
          message_type?: string | null
          sent_at?: string | null
          sent_by?: string | null
        }
        Update: {
          client_id?: string | null
          delivered?: boolean | null
          event_id?: string | null
          id?: string
          language?: string | null
          message?: string | null
          message_type?: string | null
          sent_at?: string | null
          sent_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "regional_sos_events"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_enrollments: {
        Row: {
          created_at: string
          current_step: number
          enrolled_at: string
          id: string
          last_sent_at: string | null
          lead_id: string
          next_send_at: string
          sequence_id: string
          status: string
        }
        Insert: {
          created_at?: string
          current_step?: number
          enrolled_at?: string
          id?: string
          last_sent_at?: string | null
          lead_id: string
          next_send_at: string
          sequence_id: string
          status?: string
        }
        Update: {
          created_at?: string
          current_step?: number
          enrolled_at?: string
          id?: string
          last_sent_at?: string | null
          lead_id?: string
          next_send_at?: string
          sequence_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_enrollments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "followup_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_send_log: {
        Row: {
          created_at: string
          enrollment_id: string
          error_message: string | null
          id: string
          queued_email_id: string | null
          status: string
          step_order: number
        }
        Insert: {
          created_at?: string
          enrollment_id: string
          error_message?: string | null
          id?: string
          queued_email_id?: string | null
          status: string
          step_order: number
        }
        Update: {
          created_at?: string
          enrollment_id?: string
          error_message?: string | null
          id?: string
          queued_email_id?: string | null
          status?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "followup_send_log_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "followup_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_sequences: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      followup_steps: {
        Row: {
          body_template: string
          created_at: string
          delay_minutes: number
          id: string
          sequence_id: string
          step_order: number
          subject_template: string
        }
        Insert: {
          body_template: string
          created_at?: string
          delay_minutes: number
          id?: string
          sequence_id: string
          step_order: number
          subject_template: string
        }
        Update: {
          body_template?: string
          created_at?: string
          delay_minutes?: number
          id?: string
          sequence_id?: string
          step_order?: number
          subject_template?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "followup_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      gmail_token_access_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gmail_tokens: {
        Row: {
          access_token: string
          created_at: string
          email_address: string | null
          expires_at: string
          id: string
          last_refreshed_at: string | null
          refresh_count: number | null
          refresh_token: string
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          email_address?: string | null
          expires_at: string
          id?: string
          last_refreshed_at?: string | null
          refresh_count?: number | null
          refresh_token: string
          scope?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          email_address?: string | null
          expires_at?: string
          id?: string
          last_refreshed_at?: string | null
          refresh_count?: number | null
          refresh_token?: string
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      homepage_analytics: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          page_context: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          page_context?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          page_context?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          activity_type: string
          completed_at: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          lead_id: string
          metadata: Json | null
          scheduled_at: string | null
          subject: string | null
        }
        Insert: {
          activity_type: string
          completed_at?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          scheduled_at?: string | null
          subject?: string | null
        }
        Update: {
          activity_type?: string
          completed_at?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          scheduled_at?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_files: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          lead_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          lead_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          lead_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_files_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_intelligence_runs: {
        Row: {
          created_at: string
          extracted_count: number
          id: string
          model: string | null
          saved_count: number
          source_type: string
          source_value: string
          summary: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_count?: number
          id?: string
          model?: string | null
          saved_count?: number
          source_type: string
          source_value: string
          summary?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_count?: number
          id?: string
          model?: string | null
          saved_count?: number
          source_type?: string
          source_value?: string
          summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lead_tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          company_name: string | null
          conversation_summary: string | null
          created_at: string
          deal_value: number | null
          email: string | null
          id: string
          interest_level: number | null
          job_title: string | null
          last_contacted_at: string | null
          lead_score: number | null
          lead_source: string | null
          linkedin_url: string | null
          metadata: Json | null
          next_follow_up_at: string | null
          notes: string | null
          phone: string | null
          probability: number | null
          recommended_plan: string | null
          session_id: string
          status: string | null
          tags: string[] | null
          timezone: string | null
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_name?: string | null
          conversation_summary?: string | null
          created_at?: string
          deal_value?: number | null
          email?: string | null
          id?: string
          interest_level?: number | null
          job_title?: string | null
          last_contacted_at?: string | null
          lead_score?: number | null
          lead_source?: string | null
          linkedin_url?: string | null
          metadata?: Json | null
          next_follow_up_at?: string | null
          notes?: string | null
          phone?: string | null
          probability?: number | null
          recommended_plan?: string | null
          session_id: string
          status?: string | null
          tags?: string[] | null
          timezone?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_name?: string | null
          conversation_summary?: string | null
          created_at?: string
          deal_value?: number | null
          email?: string | null
          id?: string
          interest_level?: number | null
          job_title?: string | null
          last_contacted_at?: string | null
          lead_score?: number | null
          lead_source?: string | null
          linkedin_url?: string | null
          metadata?: Json | null
          next_follow_up_at?: string | null
          notes?: string | null
          phone?: string | null
          probability?: number | null
          recommended_plan?: string | null
          session_id?: string
          status?: string | null
          tags?: string[] | null
          timezone?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      live_locations: {
        Row: {
          accuracy: number | null
          battery_level: number | null
          created_at: string
          family_group_id: string | null
          heading: number | null
          id: string
          last_seen: string
          latitude: number
          longitude: number
          speed: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          battery_level?: number | null
          created_at?: string
          family_group_id?: string | null
          heading?: number | null
          id?: string
          last_seen?: string
          latitude: number
          longitude: number
          speed?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy?: number | null
          battery_level?: number | null
          created_at?: string
          family_group_id?: string | null
          heading?: number | null
          id?: string
          last_seen?: string
          latitude?: number
          longitude?: number
          speed?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      live_presence: {
        Row: {
          battery: number | null
          is_paused: boolean | null
          last_seen: string | null
          lat: number | null
          lng: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          battery?: number | null
          is_paused?: boolean | null
          last_seen?: string | null
          lat?: number | null
          lng?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          battery?: number | null
          is_paused?: boolean | null
          last_seen?: string | null
          lat?: number | null
          lng?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      location_pings: {
        Row: {
          accuracy: number | null
          battery: number | null
          captured_at: string
          id: string
          lat: number
          lng: number
          source: string | null
          speed: number | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          battery?: number | null
          captured_at?: string
          id?: string
          lat: number
          lng: number
          source?: string | null
          speed?: number | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          battery?: number | null
          captured_at?: string
          id?: string
          lat?: number
          lng?: number
          source?: string | null
          speed?: number | null
          user_id?: string
        }
        Relationships: []
      }
      marketing_analytics: {
        Row: {
          campaign_id: string
          content_id: string
          created_at: string
          id: string
          metric_type: string
          metric_value: number | null
          platform: string
          recorded_at: string | null
        }
        Insert: {
          campaign_id: string
          content_id: string
          created_at?: string
          id?: string
          metric_type: string
          metric_value?: number | null
          platform: string
          recorded_at?: string | null
        }
        Update: {
          campaign_id?: string
          content_id?: string
          created_at?: string
          id?: string
          metric_type?: string
          metric_value?: number | null
          platform?: string
          recorded_at?: string | null
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          budget_estimate: number | null
          command_input: string
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          error_message: string | null
          id: string
          scheduled_at: string | null
          status: string
          target_audience: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          budget_estimate?: number | null
          command_input: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          error_message?: string | null
          id?: string
          scheduled_at?: string | null
          status?: string
          target_audience?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          budget_estimate?: number | null
          command_input?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          error_message?: string | null
          id?: string
          scheduled_at?: string | null
          status?: string
          target_audience?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_content: {
        Row: {
          body_text: string | null
          campaign_id: string
          content_sections: Json | null
          content_type: string
          created_at: string
          engagement_metrics: Json | null
          featured_image_alt: string | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          keywords: string[] | null
          meta_description: string | null
          platform: string
          posted_at: string | null
          reading_time: number | null
          scheduled_time: string | null
          seo_score: number | null
          seo_title: string | null
          slug: string | null
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          body_text?: string | null
          campaign_id: string
          content_sections?: Json | null
          content_type: string
          created_at?: string
          engagement_metrics?: Json | null
          featured_image_alt?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          keywords?: string[] | null
          meta_description?: string | null
          platform: string
          posted_at?: string | null
          reading_time?: number | null
          scheduled_time?: string | null
          seo_score?: number | null
          seo_title?: string | null
          slug?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          body_text?: string | null
          campaign_id?: string
          content_sections?: Json | null
          content_type?: string
          created_at?: string
          engagement_metrics?: Json | null
          featured_image_alt?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          keywords?: string[] | null
          meta_description?: string | null
          platform?: string
          posted_at?: string | null
          reading_time?: number | null
          scheduled_time?: string | null
          seo_score?: number | null
          seo_title?: string | null
          slug?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          steps: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          steps?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          steps?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_notes: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          is_internal: boolean | null
          note_text: string
          order_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          is_internal?: boolean | null
          note_text: string
          order_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          is_internal?: boolean | null
          note_text?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          id: string
          product_id: string | null
          quantity: number
          status: string
          stripe_payment_intent_id: string | null
          total_price: number
          unit_price: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          product_id?: string | null
          quantity?: number
          status?: string
          stripe_payment_intent_id?: string | null
          total_price: number
          unit_price: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          product_id?: string | null
          quantity?: number
          status?: string
          stripe_payment_intent_id?: string | null
          total_price?: number
          unit_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_users: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          language: string | null
          organization_id: string | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          organization_id?: string | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          organization_id?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          locale_default: string | null
          name: string
          region: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          locale_default?: string | null
          name: string
          region?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          locale_default?: string | null
          name?: string
          region?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          created_at: string
          id: string
          metric_type: string
          test_timestamp: string
          values: Json
        }
        Insert: {
          created_at?: string
          id?: string
          metric_type: string
          test_timestamp?: string
          values?: Json
        }
        Update: {
          created_at?: string
          id?: string
          metric_type?: string
          test_timestamp?: string
          values?: Json
        }
        Relationships: []
      }
      phone_verifications: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          max_attempts: number
          method: string
          phone_number: string
          status: string
          user_id: string
          verification_code: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          max_attempts?: number
          method?: string
          phone_number: string
          status?: string
          user_id: string
          verification_code: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          max_attempts?: number
          method?: string
          phone_number?: string
          status?: string
          user_id?: string
          verification_code?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      place_events: {
        Row: {
          event: string
          id: string
          occurred_at: string
          place_id: string
          user_id: string
        }
        Insert: {
          event: string
          id?: string
          occurred_at?: string
          place_id: string
          user_id: string
        }
        Update: {
          event?: string
          id?: string
          occurred_at?: string
          place_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_events_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          created_at: string | null
          created_by: string | null
          family_group_id: string
          id: string
          lat: number
          lng: number
          name: string
          radius_m: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          family_group_id: string
          id?: string
          lat: number
          lng: number
          name: string
          radius_m?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          family_group_id?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          radius_m?: number
        }
        Relationships: [
          {
            foreignKeyName: "places_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      posting_queue: {
        Row: {
          content_id: string
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          platform: string
          platform_post_id: string | null
          posted_at: string | null
          retry_count: number | null
          scheduled_time: string
          status: string
          updated_at: string
        }
        Insert: {
          content_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          platform: string
          platform_post_id?: string | null
          posted_at?: string | null
          retry_count?: number | null
          scheduled_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          content_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          platform?: string
          platform_post_id?: string | null
          posted_at?: string | null
          retry_count?: number | null
          scheduled_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          name: string
          sort_order: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          name: string
          sort_order?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          coming_soon_url: string | null
          compatibility: string[] | null
          created_at: string
          currency: string | null
          description: string | null
          dimensions: Json | null
          features: string[] | null
          id: string
          images: Json | null
          inventory_count: number | null
          name: string
          price: number
          sku: string | null
          sort_order: number | null
          status: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          category_id?: string | null
          coming_soon_url?: string | null
          compatibility?: string[] | null
          created_at?: string
          currency?: string | null
          description?: string | null
          dimensions?: Json | null
          features?: string[] | null
          id?: string
          images?: Json | null
          inventory_count?: number | null
          name: string
          price: number
          sku?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          category_id?: string | null
          coming_soon_url?: string | null
          compatibility?: string[] | null
          created_at?: string
          currency?: string | null
          description?: string | null
          dimensions?: Json | null
          features?: string[] | null
          id?: string
          images?: Json | null
          inventory_count?: number | null
          name?: string
          price?: number
          sku?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          allergies: string[] | null
          blood_type: string | null
          call_center_number: string | null
          care_transfer_date: string | null
          care_transfer_error: string | null
          care_transfer_status: string | null
          country: string | null
          country_code: string | null
          created_at: string
          date_of_birth: string | null
          emergency_contacts: Json | null
          emergency_numbers: string[]
          first_name: string | null
          has_spain_call_center: boolean
          id: string
          language_preference: string | null
          last_name: string | null
          location_sharing_enabled: boolean | null
          medical_conditions: string[] | null
          medications: string[] | null
          organization_id: string | null
          phone: string | null
          preferred_language: string | null
          profile_completion_percentage: number | null
          role: string
          subscription_regional: boolean | null
          transferred_to_care: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          allergies?: string[] | null
          blood_type?: string | null
          call_center_number?: string | null
          care_transfer_date?: string | null
          care_transfer_error?: string | null
          care_transfer_status?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contacts?: Json | null
          emergency_numbers?: string[]
          first_name?: string | null
          has_spain_call_center?: boolean
          id?: string
          language_preference?: string | null
          last_name?: string | null
          location_sharing_enabled?: boolean | null
          medical_conditions?: string[] | null
          medications?: string[] | null
          organization_id?: string | null
          phone?: string | null
          preferred_language?: string | null
          profile_completion_percentage?: number | null
          role?: string
          subscription_regional?: boolean | null
          transferred_to_care?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          allergies?: string[] | null
          blood_type?: string | null
          call_center_number?: string | null
          care_transfer_date?: string | null
          care_transfer_error?: string | null
          care_transfer_status?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contacts?: Json | null
          emergency_numbers?: string[]
          first_name?: string | null
          has_spain_call_center?: boolean
          id?: string
          language_preference?: string | null
          last_name?: string | null
          location_sharing_enabled?: boolean | null
          medical_conditions?: string[] | null
          medications?: string[] | null
          organization_id?: string | null
          phone?: string | null
          preferred_language?: string | null
          profile_completion_percentage?: number | null
          role?: string
          subscription_regional?: boolean | null
          transferred_to_care?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action_type: string
          attempt_count: number
          blocked_until: string | null
          created_at: string
          id: string
          identifier: string
          updated_at: string
          window_start: string
        }
        Insert: {
          action_type: string
          attempt_count?: number
          blocked_until?: string | null
          created_at?: string
          id?: string
          identifier: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          action_type?: string
          attempt_count?: number
          blocked_until?: string | null
          created_at?: string
          id?: string
          identifier?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      regional_audit_log: {
        Row: {
          action: string | null
          changes: Json | null
          created_at: string | null
          id: string
          organization_id: string | null
          target_id: string | null
          target_table: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          changes?: Json | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          target_id?: string | null
          target_table?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          changes?: Json | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          target_id?: string | null
          target_table?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regional_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      regional_devices: {
        Row: {
          battery_level: number | null
          client_id: string | null
          created_at: string | null
          device_name: string | null
          device_type: string | null
          id: string
          is_active: boolean | null
          last_ping_at: string | null
          updated_at: string | null
        }
        Insert: {
          battery_level?: number | null
          client_id?: string | null
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          last_ping_at?: string | null
          updated_at?: string | null
        }
        Update: {
          battery_level?: number | null
          client_id?: string | null
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          last_ping_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      regional_emergency_contacts: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          name: string | null
          phone: string | null
          priority: number | null
          relation: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          priority?: number | null
          relation?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          priority?: number | null
          relation?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      regional_services: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          features: string[] | null
          id: string
          is_active: boolean
          is_popular: boolean
          name: string
          price: number
          region: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name: string
          price?: number
          region: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name?: string
          price?: number
          region?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      regional_sos_events: {
        Row: {
          assigned_operator: string | null
          client_id: string | null
          created_at: string | null
          emergency_type: string | null
          id: string
          lat: number | null
          lng: number | null
          organization_id: string | null
          priority: string | null
          source: string | null
          status: string | null
          triggered_at: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_operator?: string | null
          client_id?: string | null
          created_at?: string | null
          emergency_type?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          organization_id?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          triggered_at?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_operator?: string | null
          client_id?: string | null
          created_at?: string | null
          emergency_type?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          organization_id?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          triggered_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regional_sos_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_selections: {
        Row: {
          created_at: string
          currency: string
          id: string
          registration_completed: boolean | null
          selected_products: Json | null
          selected_regional_services: Json | null
          session_id: string
          subscription_plans: Json | null
          total_product_amount: number | null
          total_subscription_amount: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          registration_completed?: boolean | null
          selected_products?: Json | null
          selected_regional_services?: Json | null
          session_id: string
          subscription_plans?: Json | null
          total_product_amount?: number | null
          total_subscription_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          registration_completed?: boolean | null
          selected_products?: Json | null
          selected_regional_services?: Json | null
          session_id?: string
          subscription_plans?: Json | null
          total_product_amount?: number | null
          total_subscription_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      riven_campaign_metrics_daily: {
        Row: {
          campaign_id: string
          created_at: string
          emails_failed: number
          emails_sent: number
          id: string
          metric_date: string
          replies_received: number
          reply_rate: number
          social_posts_failed: number
          social_posts_posted: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          emails_failed?: number
          emails_sent?: number
          id?: string
          metric_date: string
          replies_received?: number
          reply_rate?: number
          social_posts_failed?: number
          social_posts_posted?: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          emails_failed?: number
          emails_sent?: number
          id?: string
          metric_date?: string
          replies_received?: number
          reply_rate?: number
          social_posts_failed?: number
          social_posts_posted?: number
        }
        Relationships: []
      }
      riven_lead_engagement: {
        Row: {
          last_campaign_id: string | null
          last_reply_at: string | null
          last_touch_at: string | null
          lead_id: string
          total_replies: number
          updated_at: string
        }
        Insert: {
          last_campaign_id?: string | null
          last_reply_at?: string | null
          last_touch_at?: string | null
          lead_id: string
          total_replies?: number
          updated_at?: string
        }
        Update: {
          last_campaign_id?: string | null
          last_reply_at?: string | null
          last_touch_at?: string | null
          lead_id?: string
          total_replies?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "riven_lead_engagement_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      riven_settings: {
        Row: {
          ai_model: string
          auto_approve_content: boolean | null
          brand_voice: string | null
          content_guidelines: string | null
          created_at: string
          default_budget: number | null
          id: string
          max_tokens: number | null
          preferred_posting_times: Json | null
          temperature: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_model?: string
          auto_approve_content?: boolean | null
          brand_voice?: string | null
          content_guidelines?: string | null
          created_at?: string
          default_budget?: number | null
          id?: string
          max_tokens?: number | null
          preferred_posting_times?: Json | null
          temperature?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_model?: string
          auto_approve_content?: boolean | null
          brand_voice?: string | null
          content_guidelines?: string | null
          created_at?: string
          default_budget?: number | null
          id?: string
          max_tokens?: number | null
          preferred_posting_times?: Json | null
          temperature?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      routing_rules: {
        Row: {
          action_config: Json
          action_type: string
          conditions: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          priority: number | null
          updated_at: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          priority?: number | null
          updated_at?: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          priority?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          risk_score: number | null
          session_id: string | null
          severity: string | null
          source_component: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          risk_score?: number | null
          session_id?: string | null
          severity?: string | null
          source_component?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          risk_score?: number | null
          session_id?: string | null
          severity?: string | null
          source_component?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_product_compatibility: {
        Row: {
          compatibility_notes: string | null
          created_at: string
          id: string
          product_id: string | null
          service_name: string
        }
        Insert: {
          compatibility_notes?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          service_name: string
        }
        Update: {
          compatibility_notes?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          service_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_product_compatibility_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      sla_breaches: {
        Row: {
          actual_minutes: number | null
          breach_type: string
          breached_at: string | null
          conversation_id: string | null
          created_at: string | null
          escalated_to: string | null
          escalation_sent_at: string | null
          id: string
          resolved_at: string | null
          sla_setting_id: string | null
          target_minutes: number
        }
        Insert: {
          actual_minutes?: number | null
          breach_type: string
          breached_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          escalated_to?: string | null
          escalation_sent_at?: string | null
          id?: string
          resolved_at?: string | null
          sla_setting_id?: string | null
          target_minutes: number
        }
        Update: {
          actual_minutes?: number | null
          breach_type?: string
          breached_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          escalated_to?: string | null
          escalation_sent_at?: string | null
          id?: string
          resolved_at?: string | null
          sla_setting_id?: string | null
          target_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "sla_breaches_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "unified_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_breaches_sla_setting_id_fkey"
            columns: ["sla_setting_id"]
            isOneToOne: false
            referencedRelation: "sla_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_settings: {
        Row: {
          business_hours_only: boolean | null
          channel: string | null
          created_at: string | null
          description: string | null
          escalate_to_user_id: string | null
          escalation_after_minutes: number | null
          escalation_enabled: boolean | null
          first_response_target_minutes: number
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          resolution_target_minutes: number
          updated_at: string | null
        }
        Insert: {
          business_hours_only?: boolean | null
          channel?: string | null
          created_at?: string | null
          description?: string | null
          escalate_to_user_id?: string | null
          escalation_after_minutes?: number | null
          escalation_enabled?: boolean | null
          first_response_target_minutes?: number
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          resolution_target_minutes?: number
          updated_at?: string | null
        }
        Update: {
          business_hours_only?: boolean | null
          channel?: string | null
          created_at?: string | null
          description?: string | null
          escalate_to_user_id?: string | null
          escalation_after_minutes?: number | null
          escalation_enabled?: boolean | null
          first_response_target_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          resolution_target_minutes?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      social_media_accounts: {
        Row: {
          access_token: string | null
          account_name: string
          account_status: string | null
          client_id: string | null
          client_secret: string | null
          connection_status: string
          created_at: string
          follower_count: number | null
          id: string
          is_active: boolean | null
          last_connected: string | null
          last_sync_at: string | null
          last_synced_at: string | null
          oauth_state: string | null
          page_id: string | null
          page_name: string | null
          platform: string
          platform_name: string | null
          platform_user_id: string | null
          platform_username: string | null
          posting_permissions: Json | null
          rate_limits: Json | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          access_token?: string | null
          account_name: string
          account_status?: string | null
          client_id?: string | null
          client_secret?: string | null
          connection_status?: string
          created_at?: string
          follower_count?: number | null
          id?: string
          is_active?: boolean | null
          last_connected?: string | null
          last_sync_at?: string | null
          last_synced_at?: string | null
          oauth_state?: string | null
          page_id?: string | null
          page_name?: string | null
          platform: string
          platform_name?: string | null
          platform_user_id?: string | null
          platform_username?: string | null
          posting_permissions?: Json | null
          rate_limits?: Json | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          access_token?: string | null
          account_name?: string
          account_status?: string | null
          client_id?: string | null
          client_secret?: string | null
          connection_status?: string
          created_at?: string
          follower_count?: number | null
          id?: string
          is_active?: boolean | null
          last_connected?: string | null
          last_sync_at?: string | null
          last_synced_at?: string | null
          oauth_state?: string | null
          page_id?: string | null
          page_name?: string | null
          platform?: string
          platform_name?: string | null
          platform_user_id?: string | null
          platform_username?: string | null
          posting_permissions?: Json | null
          rate_limits?: Json | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      social_media_analytics: {
        Row: {
          clicks: number | null
          comments: number | null
          content_id: string | null
          cost_per_engagement: number | null
          ctr: number | null
          data_date: string | null
          engagement: number | null
          engagement_rate: number | null
          id: string
          impressions: number | null
          likes: number | null
          platform: string
          platform_post_id: string | null
          raw_analytics_data: Json | null
          reach: number | null
          saves: number | null
          shares: number | null
          synced_at: string | null
          video_views: number | null
        }
        Insert: {
          clicks?: number | null
          comments?: number | null
          content_id?: string | null
          cost_per_engagement?: number | null
          ctr?: number | null
          data_date?: string | null
          engagement?: number | null
          engagement_rate?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          platform: string
          platform_post_id?: string | null
          raw_analytics_data?: Json | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          synced_at?: string | null
          video_views?: number | null
        }
        Update: {
          clicks?: number | null
          comments?: number | null
          content_id?: string | null
          cost_per_engagement?: number | null
          ctr?: number | null
          data_date?: string | null
          engagement?: number | null
          engagement_rate?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          platform?: string
          platform_post_id?: string | null
          raw_analytics_data?: Json | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          synced_at?: string | null
          video_views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_analytics_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "marketing_content"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_engagement: {
        Row: {
          content_id: string
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          platform: string
          platform_post_id: string
          recorded_at: string
        }
        Insert: {
          content_id: string
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value?: number
          platform: string
          platform_post_id: string
          recorded_at?: string
        }
        Update: {
          content_id?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          platform?: string
          platform_post_id?: string
          recorded_at?: string
        }
        Relationships: []
      }
      social_media_oauth: {
        Row: {
          access_token: string
          connection_status: string
          created_at: string
          expires_at: string | null
          follower_count: number | null
          id: string
          last_used_at: string | null
          metadata: Json | null
          permissions: Json | null
          platform: string
          platform_account_id: string | null
          platform_name: string | null
          platform_user_id: string
          platform_username: string | null
          refresh_token: string | null
          scope: string | null
          token_expires_at: string | null
          token_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          connection_status?: string
          created_at?: string
          expires_at?: string | null
          follower_count?: number | null
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          permissions?: Json | null
          platform: string
          platform_account_id?: string | null
          platform_name?: string | null
          platform_user_id: string
          platform_username?: string | null
          refresh_token?: string | null
          scope?: string | null
          token_expires_at?: string | null
          token_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          connection_status?: string
          created_at?: string
          expires_at?: string | null
          follower_count?: number | null
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          permissions?: Json | null
          platform?: string
          platform_account_id?: string | null
          platform_name?: string | null
          platform_user_id?: string
          platform_username?: string | null
          refresh_token?: string | null
          scope?: string | null
          token_expires_at?: string | null
          token_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_media_oauth_state: {
        Row: {
          code_verifier: string
          created_at: string
          expires_at: string
          id: string
          platform: string
          state: string
          user_id: string
        }
        Insert: {
          code_verifier: string
          created_at?: string
          expires_at: string
          id?: string
          platform: string
          state: string
          user_id: string
        }
        Update: {
          code_verifier?: string
          created_at?: string
          expires_at?: string
          id?: string
          platform?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      social_media_posting_queue: {
        Row: {
          content_id: string
          created_at: string
          engagement_metrics: Json | null
          error_message: string | null
          id: string
          max_retries: number | null
          oauth_account_id: string | null
          platform: string
          platform_post_id: string | null
          posted_at: string | null
          retry_count: number | null
          scheduled_time: string
          status: string
          updated_at: string
        }
        Insert: {
          content_id: string
          created_at?: string
          engagement_metrics?: Json | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          oauth_account_id?: string | null
          platform: string
          platform_post_id?: string | null
          posted_at?: string | null
          retry_count?: number | null
          scheduled_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          content_id?: string
          created_at?: string
          engagement_metrics?: Json | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          oauth_account_id?: string | null
          platform?: string
          platform_post_id?: string | null
          posted_at?: string | null
          retry_count?: number | null
          scheduled_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_platform_configs: {
        Row: {
          api_version: string | null
          client_id: string | null
          client_secret: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          platform: string
          rate_limits: Json | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          api_version?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          platform: string
          rate_limits?: Json | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_version?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          rate_limits?: Json | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      sos_acknowledgements: {
        Row: {
          acknowledged_at: string | null
          event_id: string
          family_user_id: string
          id: string
          message: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          event_id: string
          family_user_id: string
          id?: string
          message?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          event_id?: string
          family_user_id?: string
          id?: string
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sos_acknowledgements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "sos_events"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_actions: {
        Row: {
          action_type: string | null
          actor_user_id: string | null
          created_at: string | null
          event_id: string | null
          id: string
          payload: Json | null
        }
        Insert: {
          action_type?: string | null
          actor_user_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          payload?: Json | null
        }
        Update: {
          action_type?: string | null
          actor_user_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sos_actions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "regional_sos_events"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_call_attempts: {
        Row: {
          attempt_order: number
          call_sid: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          error: string | null
          id: string
          incident_id: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          attempt_order?: number
          call_sid?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          error?: string | null
          id?: string
          incident_id: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_order?: number
          call_sid?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          error?: string | null
          id?: string
          incident_id?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sos_call_attempts_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "sos_incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_event_access: {
        Row: {
          access_scope: string | null
          event_id: string | null
          expires_at: string | null
          granted_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          access_scope?: string | null
          event_id?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          access_scope?: string | null
          event_id?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sos_event_access_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "sos_events"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_events: {
        Row: {
          address: string | null
          created_at: string | null
          group_id: string | null
          id: string
          metadata: Json | null
          resolved_at: string | null
          status: string
          trigger_location: Json | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          status?: string
          trigger_location?: Json | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          status?: string
          trigger_location?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sos_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_incidents: {
        Row: {
          calls_initiated: number
          completed_at: string | null
          contact_emails_sent: number
          created_at: string
          error: string | null
          id: string
          location: string | null
          notes: string | null
          status: string
          triggered_via: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calls_initiated?: number
          completed_at?: string | null
          contact_emails_sent?: number
          created_at?: string
          error?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          status?: string
          triggered_via?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calls_initiated?: number
          completed_at?: string | null
          contact_emails_sent?: number
          created_at?: string
          error?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          status?: string
          triggered_via?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sos_locations: {
        Row: {
          accuracy: number | null
          address: string | null
          created_at: string | null
          event_id: string
          id: string
          lat: number
          lng: number
        }
        Insert: {
          accuracy?: number | null
          address?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          lat: number
          lng: number
        }
        Update: {
          accuracy?: number | null
          address?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          lat?: number
          lng?: number
        }
        Relationships: [
          {
            foreignKeyName: "sos_locations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "sos_events"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_history: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string
          id: string
          metadata: Json | null
          new_end_date: string | null
          previous_end_date: string | null
          previous_tier: string | null
          reason: string | null
          subscription_tier: string | null
          user_id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_end_date?: string | null
          previous_end_date?: string | null
          previous_tier?: string | null
          reason?: string | null
          subscription_tier?: string | null
          user_id: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_end_date?: string | null
          previous_end_date?: string | null
          previous_tier?: string | null
          reason?: string | null
          subscription_tier?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_interval: string
          created_at: string
          currency: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean
          is_popular: boolean
          name: string
          price: number
          region: string | null
          sort_order: number | null
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          billing_interval?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name: string
          price: number
          region?: string | null
          sort_order?: number | null
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_interval?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name?: string
          price?: number
          region?: string | null
          sort_order?: number | null
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_health_checks: {
        Row: {
          auth_status: string
          check_timestamp: string
          created_at: string
          database_status: string
          emergency_status: string
          id: string
          overall_status: string
          payment_status: string
          performance_data: Json | null
          storage_status: string
        }
        Insert: {
          auth_status: string
          check_timestamp?: string
          created_at?: string
          database_status: string
          emergency_status: string
          id?: string
          overall_status: string
          payment_status: string
          performance_data?: Json | null
          storage_status: string
        }
        Update: {
          auth_status?: string
          check_timestamp?: string
          created_at?: string
          database_status?: string
          emergency_status?: string
          id?: string
          overall_status?: string
          payment_status?: string
          performance_data?: Json | null
          storage_status?: string
        }
        Relationships: []
      }
      training_data: {
        Row: {
          answer: string
          audience: string | null
          category: string
          confidence_score: number | null
          created_at: string
          created_by: string | null
          id: string
          last_used_at: string | null
          question: string
          status: string
          tags: string[] | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          answer: string
          audience?: string | null
          category?: string
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_used_at?: string | null
          question: string
          status?: string
          tags?: string[] | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          answer?: string
          audience?: string | null
          category?: string
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_used_at?: string | null
          question?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      unified_conversations: {
        Row: {
          ai_category: string | null
          ai_sentiment: string | null
          ai_suggested_reply: string | null
          assigned_to: string | null
          category_id: string | null
          channel: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          external_id: string | null
          id: string
          last_activity_at: string | null
          last_message_at: string | null
          metadata: Json | null
          priority: number | null
          response_due_at: string | null
          status: string
          subject: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          ai_category?: string | null
          ai_sentiment?: string | null
          ai_suggested_reply?: string | null
          assigned_to?: string | null
          category_id?: string | null
          channel: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          last_activity_at?: string | null
          last_message_at?: string | null
          metadata?: Json | null
          priority?: number | null
          response_due_at?: string | null
          status?: string
          subject?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          ai_category?: string | null
          ai_sentiment?: string | null
          ai_suggested_reply?: string | null
          assigned_to?: string | null
          category_id?: string | null
          channel?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          last_activity_at?: string | null
          last_message_at?: string | null
          metadata?: Json | null
          priority?: number | null
          response_due_at?: string | null
          status?: string
          subject?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      unified_messages: {
        Row: {
          ai_confidence_score: number | null
          attachments: Json | null
          content: string
          content_type: string | null
          conversation_id: string
          created_at: string
          direction: string
          external_message_id: string | null
          id: string
          is_ai_generated: boolean | null
          metadata: Json | null
          sender_email: string | null
          sender_name: string | null
          sender_phone: string | null
          status: string | null
        }
        Insert: {
          ai_confidence_score?: number | null
          attachments?: Json | null
          content: string
          content_type?: string | null
          conversation_id: string
          created_at?: string
          direction: string
          external_message_id?: string | null
          id?: string
          is_ai_generated?: boolean | null
          metadata?: Json | null
          sender_email?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          status?: string | null
        }
        Update: {
          ai_confidence_score?: number | null
          attachments?: Json | null
          content?: string
          content_type?: string | null
          conversation_id?: string
          created_at?: string
          direction?: string
          external_message_id?: string | null
          id?: string
          is_ai_generated?: boolean | null
          metadata?: Json | null
          sender_email?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unified_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "unified_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_metrics: {
        Row: {
          created_at: string
          date: string
          id: string
          metrics: Json
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          metrics?: Json
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          metrics?: Json
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      video_analytics: {
        Row: {
          browser: string | null
          created_at: string
          device_type: string | null
          event_type: string
          id: string
          ip_address: unknown
          referrer: string | null
          session_id: string | null
          total_video_duration_seconds: number | null
          user_agent: string | null
          user_id: string | null
          user_location: Json | null
          video_id: string
          video_position_seconds: number | null
          video_title: string
          watch_duration_seconds: number | null
          youtube_id: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          referrer?: string | null
          session_id?: string | null
          total_video_duration_seconds?: number | null
          user_agent?: string | null
          user_id?: string | null
          user_location?: Json | null
          video_id: string
          video_position_seconds?: number | null
          video_title: string
          watch_duration_seconds?: number | null
          youtube_id?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          referrer?: string | null
          session_id?: string | null
          total_video_duration_seconds?: number | null
          user_agent?: string | null
          user_id?: string | null
          user_location?: Json | null
          video_id?: string
          video_position_seconds?: number | null
          video_title?: string
          watch_duration_seconds?: number | null
          youtube_id?: string | null
        }
        Relationships: []
      }
      whatsapp_accounts: {
        Row: {
          access_token: string
          business_account_id: string
          created_at: string
          created_by: string | null
          display_name: string | null
          encrypted_access_token: string | null
          id: string
          is_active: boolean
          phone_number: string
          phone_number_id: string
          status: string
          updated_at: string
          webhook_verify_token: string
        }
        Insert: {
          access_token: string
          business_account_id: string
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          encrypted_access_token?: string | null
          id?: string
          is_active?: boolean
          phone_number: string
          phone_number_id: string
          status?: string
          updated_at?: string
          webhook_verify_token?: string
        }
        Update: {
          access_token?: string
          business_account_id?: string
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          encrypted_access_token?: string | null
          id?: string
          is_active?: boolean
          phone_number?: string
          phone_number_id?: string
          status?: string
          updated_at?: string
          webhook_verify_token?: string
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          contact_name: string | null
          created_at: string
          id: string
          is_business_initiated: boolean
          last_message_at: string
          metadata: Json
          phone_number: string
          status: string
          updated_at: string
          user_id: string | null
          whatsapp_account_id: string | null
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          id?: string
          is_business_initiated?: boolean
          last_message_at?: string
          metadata?: Json
          phone_number: string
          status?: string
          updated_at?: string
          user_id?: string | null
          whatsapp_account_id?: string | null
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          id?: string
          is_business_initiated?: boolean
          last_message_at?: string
          metadata?: Json
          phone_number?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          whatsapp_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_whatsapp_account_id_fkey"
            columns: ["whatsapp_account_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          ai_session_id: string | null
          content: string | null
          conversation_id: string
          created_at: string
          direction: string
          error_message: string | null
          id: string
          is_ai_generated: boolean
          media_mime_type: string | null
          media_url: string | null
          message_type: string
          metadata: Json
          status: string
          timestamp: string
          whatsapp_message_id: string | null
        }
        Insert: {
          ai_session_id?: string | null
          content?: string | null
          conversation_id: string
          created_at?: string
          direction: string
          error_message?: string | null
          id?: string
          is_ai_generated?: boolean
          media_mime_type?: string | null
          media_url?: string | null
          message_type: string
          metadata?: Json
          status?: string
          timestamp?: string
          whatsapp_message_id?: string | null
        }
        Update: {
          ai_session_id?: string | null
          content?: string | null
          conversation_id?: string
          created_at?: string
          direction?: string
          error_message?: string | null
          id?: string
          is_ai_generated?: boolean
          media_mime_type?: string | null
          media_url?: string | null
          message_type?: string
          metadata?: Json
          status?: string
          timestamp?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_encrypted: boolean
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_encrypted?: boolean
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_encrypted?: boolean
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      workflow_executions: {
        Row: {
          conversation_id: string | null
          created_at: string
          email_template_id: string
          error_message: string | null
          executed_at: string | null
          id: string
          status: string
          user_id: string | null
          variables_used: Json | null
          workflow_trigger_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          email_template_id: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          status?: string
          user_id?: string | null
          variables_used?: Json | null
          workflow_trigger_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          email_template_id?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          status?: string
          user_id?: string | null
          variables_used?: Json | null
          workflow_trigger_id?: string
        }
        Relationships: []
      }
      workflow_stages: {
        Row: {
          campaign_id: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          output_data: Json | null
          stage_name: string
          stage_order: number
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          output_data?: Json | null
          stage_name: string
          stage_order: number
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          output_data?: Json | null
          stage_name?: string
          stage_order?: number
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      workflow_steps: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          started_at: string | null
          status: string
          step_name: string
          step_order: number
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string
          step_name: string
          step_order: number
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string
          step_name?: string
          step_order?: number
          workflow_id?: string
        }
        Relationships: []
      }
      workflow_triggers: {
        Row: {
          created_at: string
          delay_minutes: number | null
          description: string | null
          email_template_id: string
          id: string
          is_active: boolean
          name: string
          priority: number | null
          trigger_conditions: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delay_minutes?: number | null
          description?: string | null
          email_template_id: string
          id?: string
          is_active?: boolean
          name: string
          priority?: number | null
          trigger_conditions?: Json
          trigger_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delay_minutes?: number | null
          description?: string | null
          email_template_id?: string
          id?: string
          is_active?: boolean
          name?: string
          priority?: number | null
          trigger_conditions?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      communication_metrics_summary: {
        Row: {
          avg_resolution_time: number | null
          avg_response_time: number | null
          channel: string | null
          date: string | null
          total_conversations: number | null
          total_messages: number | null
        }
        Relationships: []
      }
      v_owner_active_connection_counts: {
        Row: {
          active_count: number | null
          owner_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_admin_role: { Args: { target_user_id: string }; Returns: boolean }
      check_admin_setup_allowed: { Args: never; Returns: boolean }
      check_spain_rule: { Args: { p_user_id: string }; Returns: boolean }
      cleanup_expired_oauth_states: { Args: never; Returns: undefined }
      cleanup_old_security_data: { Args: never; Returns: undefined }
      cleanup_stuck_campaigns: { Args: never; Returns: undefined }
      create_email_campaign_from_content: {
        Args: { p_campaign_name?: string; p_content_id: string }
        Returns: string
      }
      get_communication_metrics_summary: {
        Args: never
        Returns: {
          avg_resolution_time: number
          avg_response_time: number
          channel: string
          date: string
          total_conversations: number
          total_messages: number
        }[]
      }
      get_user_family_group_id: { Args: never; Returns: string }
      get_user_family_membership_group_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      get_video_analytics_summary: {
        Args: never
        Returns: {
          avg_watch_time_minutes: number
          completion_rate: number
          top_countries: Json
          total_views: number
          total_watch_time_minutes: number
          unique_viewers: number
          video_id: string
          video_title: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_family_group_owner: { Args: { group_id: string }; Returns: boolean }
      is_family_member_of_group: {
        Args: { group_id: string }
        Returns: boolean
      }
      is_sales: { Args: never; Returns: boolean }
      log_enhanced_security_event: {
        Args: {
          p_event_type: string
          p_metadata?: Json
          p_risk_score?: number
          p_severity?: string
          p_source_component?: string
          p_user_id: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: { p_event_type: string; p_metadata?: Json; p_user_id: string }
        Returns: undefined
      }
      track_auth_failure: {
        Args: {
          p_email: string
          p_failure_reason: string
          p_ip_address: unknown
          p_user_agent?: string
        }
        Returns: boolean
      }
      upsert_live_location: {
        Args: {
          p_accuracy?: number
          p_battery_level?: number
          p_family_group_id: string
          p_heading?: number
          p_latitude: number
          p_longitude: number
          p_speed?: number
          p_status?: string
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
