export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      app_settings: {
        Row: {
          announcement_enabled: boolean;
          announcement_link: string | null;
          announcement_link_label: string | null;
          announcement_message: string | null;
          announcement_title: string | null;
          announcement_version: number;
          auto_approve_enabled: boolean;
          auto_approve_max_amount: number | null;
          auto_withdraw_enabled: boolean;
          auto_withdraw_max_amount: number | null;
          auto_withdraw_ussd_template: string;
          deposit_max_amount: number;
          deposit_min_amount: number;
          id: number;
          mm_webhook_secret: string | null;
          referral_percent: number;
          sendpulse_chat_id: string | null;
          sendpulse_embed_html: string | null;
          site_name: string;
          site_url: string | null;
          smtp_from_email: string | null;
          smtp_from_name: string | null;
          smtp_host: string | null;
          smtp_password: string | null;
          smtp_port: number | null;
          smtp_secure: boolean | null;
          smtp_user: string | null;
          tawk_property_id: string | null;
          tawk_widget_id: string | null;
          tidio_public_key: string | null;
          updated_at: string;
        };
        Insert: {
          announcement_enabled?: boolean;
          announcement_link?: string | null;
          announcement_link_label?: string | null;
          announcement_message?: string | null;
          announcement_title?: string | null;
          announcement_version?: number;
          auto_approve_enabled?: boolean;
          auto_approve_max_amount?: number | null;
          auto_withdraw_enabled?: boolean;
          auto_withdraw_max_amount?: number | null;
          auto_withdraw_ussd_template?: string;
          deposit_max_amount?: number;
          deposit_min_amount?: number;
          id?: number;
          mm_webhook_secret?: string | null;
          referral_percent?: number;
          sendpulse_chat_id?: string | null;
          sendpulse_embed_html?: string | null;
          site_name?: string;
          site_url?: string | null;
          smtp_from_email?: string | null;
          smtp_from_name?: string | null;
          smtp_host?: string | null;
          smtp_password?: string | null;
          smtp_port?: number | null;
          smtp_secure?: boolean | null;
          smtp_user?: string | null;
          tawk_property_id?: string | null;
          tawk_widget_id?: string | null;
          tidio_public_key?: string | null;
          updated_at?: string;
        };
        Update: {
          announcement_enabled?: boolean;
          announcement_link?: string | null;
          announcement_link_label?: string | null;
          announcement_message?: string | null;
          announcement_title?: string | null;
          announcement_version?: number;
          auto_approve_enabled?: boolean;
          auto_approve_max_amount?: number | null;
          auto_withdraw_enabled?: boolean;
          auto_withdraw_max_amount?: number | null;
          auto_withdraw_ussd_template?: string;
          deposit_max_amount?: number;
          deposit_min_amount?: number;
          id?: number;
          mm_webhook_secret?: string | null;
          referral_percent?: number;
          sendpulse_chat_id?: string | null;
          sendpulse_embed_html?: string | null;
          site_name?: string;
          site_url?: string | null;
          smtp_from_email?: string | null;
          smtp_from_name?: string | null;
          smtp_host?: string | null;
          smtp_password?: string | null;
          smtp_port?: number | null;
          smtp_secure?: boolean | null;
          smtp_user?: string | null;
          tawk_property_id?: string | null;
          tawk_widget_id?: string | null;
          tidio_public_key?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      payout_accounts: {
        Row: {
          id: string;
          user_id: string;
          method: string;
          account_name: string;
          account_number: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          method: string;
          account_name: string;
          account_number: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          method?: string;
          account_name?: string;
          account_number?: string;
          is_default?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      deposits: {
        Row: {
          admin_note: string | null;
          amount: number;
          auto_approved_at: string | null;
          auto_note: string | null;
          created_at: string;
          id: string;
          matched_message_id: string | null;
          ocr_amount: number | null;
          ocr_payer: string | null;
          ocr_raw: Json | null;
          ocr_txn_id: string | null;
          ocr_txn_id_norm: string | null;
          payer_phone: string | null;
          payment_method_id: string | null;
          proof_url: string | null;
          reference: string | null;
          reviewed_at: string | null;
          status: Database["public"]["Enums"]["deposit_status"];
          user_id: string;
        };
        Insert: {
          admin_note?: string | null;
          amount: number;
          auto_approved_at?: string | null;
          auto_note?: string | null;
          created_at?: string;
          id?: string;
          matched_message_id?: string | null;
          ocr_amount?: number | null;
          ocr_payer?: string | null;
          ocr_raw?: Json | null;
          ocr_txn_id?: string | null;
          ocr_txn_id_norm?: string | null;
          payer_phone?: string | null;
          payment_method_id?: string | null;
          proof_url?: string | null;
          reference?: string | null;
          reviewed_at?: string | null;
          status?: Database["public"]["Enums"]["deposit_status"];
          user_id: string;
        };
        Update: {
          admin_note?: string | null;
          amount?: number;
          auto_approved_at?: string | null;
          auto_note?: string | null;
          created_at?: string;
          id?: string;
          matched_message_id?: string | null;
          ocr_amount?: number | null;
          ocr_payer?: string | null;
          ocr_raw?: Json | null;
          ocr_txn_id?: string | null;
          ocr_txn_id_norm?: string | null;
          payer_phone?: string | null;
          payment_method_id?: string | null;
          proof_url?: string | null;
          reference?: string | null;
          reviewed_at?: string | null;
          status?: Database["public"]["Enums"]["deposit_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deposits_matched_message_id_fkey";
            columns: ["matched_message_id"];
            isOneToOne: false;
            referencedRelation: "mm_messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deposits_payment_method_id_fkey";
            columns: ["payment_method_id"];
            isOneToOne: false;
            referencedRelation: "payment_methods";
            referencedColumns: ["id"];
          },
        ];
      };
      email_logs: {
        Row: {
          created_at: string;
          error: string | null;
          id: string;
          recipient: string;
          status: string;
          subject: string | null;
          template_key: string | null;
        };
        Insert: {
          created_at?: string;
          error?: string | null;
          id?: string;
          recipient: string;
          status: string;
          subject?: string | null;
          template_key?: string | null;
        };
        Update: {
          created_at?: string;
          error?: string | null;
          id?: string;
          recipient?: string;
          status?: string;
          subject?: string | null;
          template_key?: string | null;
        };
        Relationships: [];
      };
      email_templates: {
        Row: {
          enabled: boolean;
          html_body: string;
          html_body_fr: string | null;
          key: string;
          name: string;
          subject: string;
          subject_fr: string | null;
          updated_at: string;
        };
        Insert: {
          enabled?: boolean;
          html_body: string;
          html_body_fr?: string | null;
          key: string;
          name: string;
          subject: string;
          subject_fr?: string | null;
          updated_at?: string;
        };
        Update: {
          enabled?: boolean;
          html_body?: string;
          html_body_fr?: string | null;
          key?: string;
          name?: string;
          subject?: string;
          subject_fr?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      investments: {
        Row: {
          amount: number;
          daily_roi_percent: number;
          duration_days: number;
          end_date: string;
          id: string;
          is_paused: boolean;
          last_payout_at: string | null;
          plan_id: string;
          start_date: string;
          status: Database["public"]["Enums"]["investment_status"];
          total_earned: number;
          user_id: string;
        };
        Insert: {
          amount: number;
          daily_roi_percent: number;
          duration_days: number;
          end_date: string;
          id?: string;
          is_paused?: boolean;
          last_payout_at?: string | null;
          plan_id: string;
          start_date?: string;
          status?: Database["public"]["Enums"]["investment_status"];
          total_earned?: number;
          user_id: string;
        };
        Update: {
          amount?: number;
          daily_roi_percent?: number;
          duration_days?: number;
          end_date?: string;
          id?: string;
          is_paused?: boolean;
          last_payout_at?: string | null;
          plan_id?: string;
          start_date?: string;
          status?: Database["public"]["Enums"]["investment_status"];
          total_earned?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "investments_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      mm_messages: {
        Row: {
          amount: number | null;
          created_at: string;
          id: string;
          matched_at: string | null;
          matched_deposit_id: string | null;
          payer_number: string | null;
          raw_text: string;
          received_at: string;
          sender: string | null;
          txn_id: string | null;
          txn_id_norm: string | null;
        };
        Insert: {
          amount?: number | null;
          created_at?: string;
          id?: string;
          matched_at?: string | null;
          matched_deposit_id?: string | null;
          payer_number?: string | null;
          raw_text: string;
          received_at?: string;
          sender?: string | null;
          txn_id?: string | null;
          txn_id_norm?: string | null;
        };
        Update: {
          amount?: number | null;
          created_at?: string;
          id?: string;
          matched_at?: string | null;
          matched_deposit_id?: string | null;
          payer_number?: string | null;
          raw_text?: string;
          received_at?: string;
          sender?: string | null;
          txn_id?: string | null;
          txn_id_norm?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mm_messages_matched_deposit_id_fkey";
            columns: ["matched_deposit_id"];
            isOneToOne: false;
            referencedRelation: "deposits";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_methods: {
        Row: {
          account_name: string | null;
          account_number: string | null;
          active: boolean;
          created_at: string;
          id: string;
          instructions: string | null;
          label: string;
          scope: string;
          type: Database["public"]["Enums"]["payment_method_type"];
        };
        Insert: {
          account_name?: string | null;
          account_number?: string | null;
          active?: boolean;
          created_at?: string;
          id?: string;
          instructions?: string | null;
          label: string;
          scope?: string;
          type: Database["public"]["Enums"]["payment_method_type"];
        };
        Update: {
          account_name?: string | null;
          account_number?: string | null;
          active?: boolean;
          created_at?: string;
          id?: string;
          instructions?: string | null;
          label?: string;
          scope?: string;
          type?: Database["public"]["Enums"]["payment_method_type"];
        };
        Relationships: [];
      };
      plans: {
        Row: {
          active: boolean;
          amount_type: string;
          created_at: string;
          daily_roi_percent: number;
          description: string | null;
          duration_days: number;
          fixed_amount: number;
          fixed_daily_profit: number;
          id: string;
          max_amount: number;
          min_amount: number;
          name: string;
          payout_frequency: string;
          profit_type: string;
        };
        Insert: {
          active?: boolean;
          amount_type?: string;
          created_at?: string;
          daily_roi_percent: number;
          description?: string | null;
          duration_days: number;
          fixed_amount?: number;
          fixed_daily_profit?: number;
          id?: string;
          max_amount: number;
          min_amount: number;
          name: string;
          payout_frequency?: string;
          profit_type?: string;
        };
        Update: {
          active?: boolean;
          amount_type?: string;
          created_at?: string;
          daily_roi_percent?: number;
          description?: string | null;
          duration_days?: number;
          fixed_amount?: number;
          fixed_daily_profit?: number;
          id?: string;
          max_amount?: number;
          min_amount?: number;
          name?: string;
          payout_frequency?: string;
          profit_type?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          balance: number;
          created_at: string;
          full_name: string | null;
          id: string;
          is_suspended: boolean;
          kyc_status: string;
          phone: string | null;
          preferred_language: string;
          referral_code: string | null;
          referral_earnings: number;
          referred_by: string | null;
          total_earned: number;
          total_invested: number;
          updated_at: string;
        };
        Insert: {
          balance?: number;
          created_at?: string;
          full_name?: string | null;
          id: string;
          is_suspended?: boolean;
          kyc_status?: string;
          phone?: string | null;
          preferred_language?: string;
          referral_code?: string | null;
          referral_earnings?: number;
          referred_by?: string | null;
          total_earned?: number;
          total_invested?: number;
          updated_at?: string;
        };
        Update: {
          balance?: number;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          is_suspended?: boolean;
          kyc_status?: string;
          phone?: string | null;
          preferred_language?: string;
          referral_code?: string | null;
          referral_earnings?: number;
          referred_by?: string | null;
          total_earned?: number;
          total_invested?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_broadcasts: {
        Row: {
          body: string;
          created_at: string;
          created_by: string | null;
          id: string;
          sent_count: number;
          title: string;
          url: string | null;
        };
        Insert: {
          body: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          sent_count?: number;
          title: string;
          url?: string | null;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          sent_count?: number;
          title?: string;
          url?: string | null;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string;
          endpoint: string;
          id: string;
          p256dh: string;
          updated_at: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          auth: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          p256dh: string;
          updated_at?: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          auth?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          p256dh?: string;
          updated_at?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      receipt_email_queue: {
        Row: {
          attempts: number;
          created_at: string;
          final_status: string;
          id: string;
          kind: string;
          last_error: string | null;
          ref_id: string;
          send_after: string;
          sent_at: string | null;
          user_id: string;
        };
        Insert: {
          attempts?: number;
          created_at?: string;
          final_status: string;
          id?: string;
          kind: string;
          last_error?: string | null;
          ref_id: string;
          send_after?: string;
          sent_at?: string | null;
          user_id: string;
        };
        Update: {
          attempts?: number;
          created_at?: string;
          final_status?: string;
          id?: string;
          kind?: string;
          last_error?: string | null;
          ref_id?: string;
          send_after?: string;
          sent_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number;
          created_at: string;
          description: string | null;
          id: string;
          ref_id: string | null;
          type: Database["public"]["Enums"]["transaction_type"];
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          ref_id?: string | null;
          type: Database["public"]["Enums"]["transaction_type"];
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          ref_id?: string | null;
          type?: Database["public"]["Enums"]["transaction_type"];
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      withdrawals: {
        Row: {
          account_name: string;
          account_number: string;
          admin_note: string | null;
          amount: number;
          auto_attempts: number;
          auto_note: string | null;
          auto_state: string;
          created_at: string;
          dispatched_at: string | null;
          id: string;
          method: Database["public"]["Enums"]["payment_method_type"];
          operator_ref: string | null;
          reviewed_at: string | null;
          status: Database["public"]["Enums"]["withdrawal_status"];
          user_id: string;
        };
        Insert: {
          account_name: string;
          account_number: string;
          admin_note?: string | null;
          amount: number;
          auto_attempts?: number;
          auto_note?: string | null;
          auto_state?: string;
          created_at?: string;
          dispatched_at?: string | null;
          id?: string;
          method: Database["public"]["Enums"]["payment_method_type"];
          operator_ref?: string | null;
          reviewed_at?: string | null;
          status?: Database["public"]["Enums"]["withdrawal_status"];
          user_id: string;
        };
        Update: {
          account_name?: string;
          account_number?: string;
          admin_note?: string | null;
          amount?: number;
          auto_attempts?: number;
          auto_note?: string | null;
          auto_state?: string;
          created_at?: string;
          dispatched_at?: string | null;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method_type"];
          operator_ref?: string | null;
          reviewed_at?: string | null;
          status?: Database["public"]["Enums"]["withdrawal_status"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      public_app_settings: {
        Row: {
          announcement_enabled: boolean | null;
          announcement_link: string | null;
          announcement_link_label: string | null;
          announcement_message: string | null;
          announcement_title: string | null;
          announcement_version: number | null;
          id: number | null;
          referral_percent: number | null;
          sendpulse_chat_id: string | null;
          sendpulse_embed_html: string | null;
          site_name: string | null;
          site_url: string | null;
          tawk_property_id: string | null;
          tawk_widget_id: string | null;
          tidio_public_key: string | null;
        };
        Insert: {
          announcement_enabled?: boolean | null;
          announcement_link?: string | null;
          announcement_link_label?: string | null;
          announcement_message?: string | null;
          announcement_title?: string | null;
          announcement_version?: number | null;
          id?: number | null;
          referral_percent?: number | null;
          sendpulse_chat_id?: string | null;
          sendpulse_embed_html?: string | null;
          site_name?: string | null;
          site_url?: string | null;
          tawk_property_id?: string | null;
          tawk_widget_id?: string | null;
          tidio_public_key?: string | null;
        };
        Update: {
          announcement_enabled?: boolean | null;
          announcement_link?: string | null;
          announcement_link_label?: string | null;
          announcement_message?: string | null;
          announcement_title?: string | null;
          announcement_version?: number | null;
          id?: number | null;
          referral_percent?: number | null;
          sendpulse_chat_id?: string | null;
          sendpulse_embed_html?: string | null;
          site_name?: string | null;
          site_url?: string | null;
          tawk_property_id?: string | null;
          tawk_widget_id?: string | null;
          tidio_public_key?: string | null;
        };
        Relationships: [];
      };
      public_settings: {
        Row: {
          id: number | null;
          site_name: string | null;
          site_url: string | null;
          tidio_public_key: string | null;
        };
        Insert: {
          id?: number | null;
          site_name?: string | null;
          site_url?: string | null;
          tidio_public_key?: string | null;
        };
        Update: {
          id?: number | null;
          site_name?: string | null;
          site_url?: string | null;
          tidio_public_key?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      activate_investment: {
        Args: { _amount: number; _plan_id: string };
        Returns: string;
      };
      activate_investment_v2: {
        Args: { _amount: number; _plan_id: string };
        Returns: Json;
      };
      auto_approve_deposit: {
        Args: { _deposit_id: string; _message_id: string };
        Returns: Json;
      };
      claim_auto_withdrawal: { Args: never; Returns: Json };
      complete_auto_withdrawal: {
        Args: { _id: string; _ref?: string };
        Returns: Json;
      };
      distribute_profits: { Args: never; Returns: undefined };
      fail_auto_withdrawal: {
        Args: { _id: string; _note?: string };
        Returns: Json;
      };
      get_app_settings_admin: {
        Args: never;
        Returns: {
          announcement_enabled: boolean;
          announcement_link: string | null;
          announcement_link_label: string | null;
          announcement_message: string | null;
          announcement_title: string | null;
          announcement_version: number;
          auto_approve_enabled: boolean;
          auto_approve_max_amount: number | null;
          auto_withdraw_enabled: boolean;
          auto_withdraw_max_amount: number | null;
          auto_withdraw_ussd_template: string;
          deposit_max_amount: number;
          deposit_min_amount: number;
          id: number;
          mm_webhook_secret: string | null;
          referral_percent: number;
          sendpulse_chat_id: string | null;
          sendpulse_embed_html: string | null;
          site_name: string;
          site_url: string | null;
          smtp_from_email: string | null;
          smtp_from_name: string | null;
          smtp_host: string | null;
          smtp_password: string | null;
          smtp_port: number | null;
          smtp_secure: boolean | null;
          smtp_user: string | null;
          tawk_property_id: string | null;
          tawk_widget_id: string | null;
          tidio_public_key: string | null;
          updated_at: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "app_settings";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      my_referrals: {
        Args: never;
        Returns: {
          full_name: string;
          invested: number;
          investment_status: string;
          joined_at: string;
          plan_name: string;
          user_id: string;
        }[];
      };
      recent_activity: {
        Args: { _limit?: number };
        Returns: {
          amount: number;
          created_at: string;
          first_name: string;
          kind: string;
        }[];
      };
      referrer_name: { Args: { _code: string }; Returns: string };
      reject_withdrawal: { Args: { _id: string }; Returns: undefined };
      request_withdrawal: {
        Args: {
          _account_name: string;
          _account_number: string;
          _amount: number;
          _method: string;
        };
        Returns: string;
      };
    };
    Enums: {
      app_role: "admin" | "user";
      deposit_status: "pending" | "approved" | "rejected";
      investment_status: "active" | "completed" | "cancelled";
      payment_method_type: "mobile_money" | "bank_transfer" | "crypto";
      transaction_type:
        | "deposit"
        | "investment"
        | "roi"
        | "withdrawal"
        | "adjustment"
        | "profit"
        | "referral"
        | "investment_return"
        | "withdrawal_hold"
        | "withdrawal_refund";
      withdrawal_status: "pending" | "approved" | "rejected" | "paid";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      deposit_status: ["pending", "approved", "rejected"],
      investment_status: ["active", "completed", "cancelled"],
      payment_method_type: ["mobile_money", "bank_transfer", "crypto"],
      transaction_type: [
        "deposit",
        "investment",
        "roi",
        "withdrawal",
        "adjustment",
        "profit",
        "referral",
        "investment_return",
        "withdrawal_hold",
        "withdrawal_refund",
      ],
      withdrawal_status: ["pending", "approved", "rejected", "paid"],
    },
  },
} as const;
