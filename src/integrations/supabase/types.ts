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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cash_movements: {
        Row: {
          amount: number
          company_id: string | null
          created_at: string
          id: string
          reason: string
          session_id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          company_id?: string | null
          created_at?: string
          id?: string
          reason: string
          session_id: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          company_id?: string | null
          created_at?: string
          id?: string
          reason?: string
          session_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_register_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_register_sessions: {
        Row: {
          closed_at: string | null
          closing_balance: number | null
          company_id: string | null
          created_at: string
          difference: number | null
          expected_balance: number | null
          id: string
          notes: string | null
          opened_at: string
          opening_balance: number
          status: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          closing_balance?: number | null
          company_id?: string | null
          created_at?: string
          difference?: number | null
          expected_balance?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_balance?: number
          status?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          closing_balance?: number | null
          company_id?: string | null
          created_at?: string
          difference?: number | null
          expected_balance?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_balance?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_register_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_register_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          company_id: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          company_id?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          access_expires_at: string | null
          address: string | null
          cnpj: string
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          access_expires_at?: string | null
          address?: string | null
          cnpj: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          access_expires_at?: string | null
          address?: string | null
          cnpj?: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_permissions: {
        Row: {
          company_id: string
          created_at: string
          enabled: boolean
          id: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          permission_key?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          display_order: number | null
          id: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          url?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      order_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["order_status"] | null
          notes: string | null
          old_status: Database["public"]["Enums"]["order_status"] | null
          order_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["order_status"] | null
          notes?: string | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["order_status"] | null
          notes?: string | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_photos: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          id: string
          order_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          id?: string
          order_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_photos_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_services: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          quantity: number
          service_id: string | null
          service_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          quantity?: number
          service_id?: string | null
          service_name: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          quantity?: number
          service_id?: string | null
          service_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_services_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          company_id: string | null
          cost: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          min_stock: number
          name: string
          price: number
          sku: string | null
          stock: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_stock?: number
          name: string
          price?: number
          sku?: string | null
          stock?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_stock?: number
          name?: string
          price?: number
          sku?: string | null
          stock?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_address: string | null
          company_cnpj: string | null
          company_id: string | null
          company_logo_url: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_address?: string | null
          company_cnpj?: string | null
          company_id?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_address?: string | null
          company_cnpj?: string | null
          company_id?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          item_name: string
          item_type: string
          product_id: string | null
          quantity: number
          sale_id: string
          service_id: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_name: string
          item_type: string
          product_id?: string | null
          quantity?: number
          sale_id: string
          service_id?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          item_name?: string
          item_type?: string
          product_id?: string | null
          quantity?: number
          sale_id?: string
          service_id?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          client_id: string | null
          company_id: string | null
          created_at: string
          discount: number
          id: string
          installments: number | null
          notes: string | null
          payment_method: string
          sale_number: number
          subtotal: number
          total: number
          user_id: string
        }
        Insert: {
          client_id?: string | null
          company_id?: string | null
          created_at?: string
          discount?: number
          id?: string
          installments?: number | null
          notes?: string | null
          payment_method: string
          sale_number?: number
          subtotal?: number
          total?: number
          user_id: string
        }
        Update: {
          client_id?: string | null
          company_id?: string | null
          created_at?: string
          discount?: number
          id?: string
          installments?: number | null
          notes?: string | null
          payment_method?: string
          sale_number?: number
          subtotal?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          client_id: string | null
          company_id: string | null
          completed_at: string | null
          created_at: string
          delivered_at: string | null
          device_imei: string | null
          device_model: string
          diagnosis: string | null
          estimated_value: number | null
          final_value: number | null
          id: string
          internal_notes: string | null
          observations: string | null
          order_number: number
          reported_issue: string
          status: Database["public"]["Enums"]["order_status"]
          technician_id: string | null
          updated_at: string
          user_id: string
          warranty_days: number | null
        }
        Insert: {
          client_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          device_imei?: string | null
          device_model: string
          diagnosis?: string | null
          estimated_value?: number | null
          final_value?: number | null
          id?: string
          internal_notes?: string | null
          observations?: string | null
          order_number?: number
          reported_issue: string
          status?: Database["public"]["Enums"]["order_status"]
          technician_id?: string | null
          updated_at?: string
          user_id: string
          warranty_days?: number | null
        }
        Update: {
          client_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          device_imei?: string | null
          device_model?: string
          diagnosis?: string | null
          estimated_value?: number | null
          final_value?: number | null
          id?: string
          internal_notes?: string | null
          observations?: string | null
          order_number?: number
          reported_issue?: string
          status?: Database["public"]["Enums"]["order_status"]
          technician_id?: string | null
          updated_at?: string
          user_id?: string
          warranty_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          estimated_time: number | null
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          estimated_time?: number | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          estimated_time?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string
          company_id: string | null
          created_at: string
          description: string
          id: string
          payment_method: string | null
          reference_id: string | null
          reference_type: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          company_id?: string | null
          created_at?: string
          description: string
          id?: string
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          company_id?: string | null
          created_at?: string
          description?: string
          id?: string
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_safe"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      clients_safe: {
        Row: {
          address: string | null
          company_id: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string | null
          name: string | null
          notes: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: never
          company_id?: string | null
          cpf?: never
          created_at?: string | null
          email?: never
          id?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: never
          company_id?: string | null
          cpf?: never
          created_at?: string | null
          email?: never
          id?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      companies_safe: {
        Row: {
          access_expires_at: string | null
          address: string | null
          cnpj: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          access_expires_at?: string | null
          address?: string | null
          cnpj?: never
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          access_expires_at?: string | null
          address?: string | null
          cnpj?: never
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_cnpj_exists: { Args: { _cnpj: string }; Returns: boolean }
      company_exists_by_cnpj: { Args: { _cnpj: string }; Returns: boolean }
      get_company_id_by_cnpj: { Args: { _cnpj: string }; Returns: string }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_accessible: { Args: { _company_id: string }; Returns: boolean }
      is_email_associated_with_cnpj: {
        Args: { _email: string }
        Returns: boolean
      }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
      login_company_by_cnpj: {
        Args: { p_cnpj: string }
        Returns: {
          access_expires_at: string
          id: string
          is_active: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "tecnico" | "caixa" | "superadmin"
      order_status:
        | "em_analise"
        | "aguardando_autorizacao"
        | "aguardando_pecas"
        | "em_andamento"
        | "concluido"
        | "entregue"
        | "pago"
      transaction_type: "entrada" | "saida"
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
    Enums: {
      app_role: ["admin", "tecnico", "caixa", "superadmin"],
      order_status: [
        "em_analise",
        "aguardando_autorizacao",
        "aguardando_pecas",
        "em_andamento",
        "concluido",
        "entregue",
        "pago",
      ],
      transaction_type: ["entrada", "saida"],
    },
  },
} as const
