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
      addresses: {
        Row: {
          city: string | null
          country: string | null
          county: string | null
          created_at: string
          full_name: string | null
          id: string
          is_default: boolean | null
          phone: string | null
          street: string | null
          type: Database["public"]["Enums"]["address_type"]
          user_id: string
          zip: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          county?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_default?: boolean | null
          phone?: string | null
          street?: string | null
          type?: Database["public"]["Enums"]["address_type"]
          user_id: string
          zip?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          county?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_default?: boolean | null
          phone?: string | null
          street?: string | null
          type?: Database["public"]["Enums"]["address_type"]
          user_id?: string
          zip?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          id: string
          price_snapshot: number
          product_id: string
          qty: number
        }
        Insert: {
          cart_id: string
          id?: string
          price_snapshot: number
          product_id: string
          qty?: number
        }
        Update: {
          cart_id?: string
          id?: string
          price_snapshot?: number
          product_id?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      compatibilities: {
        Row: {
          id: string
          moto_variant_id: string
          product_id: string
        }
        Insert: {
          id?: string
          moto_variant_id: string
          product_id: string
        }
        Update: {
          id?: string
          moto_variant_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compatibilities_moto_variant_id_fkey"
            columns: ["moto_variant_id"]
            isOneToOne: false
            referencedRelation: "moto_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compatibilities_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_total: number | null
          starts_at: string | null
          type: Database["public"]["Enums"]["coupon_type"]
          used_count: number | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_total?: number | null
          starts_at?: string | null
          type?: Database["public"]["Enums"]["coupon_type"]
          used_count?: number | null
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_total?: number | null
          starts_at?: string | null
          type?: Database["public"]["Enums"]["coupon_type"]
          used_count?: number | null
          value?: number
        }
        Relationships: []
      }
      moto_makes: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      moto_models: {
        Row: {
          created_at: string
          id: string
          make_id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          make_id: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          make_id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "moto_models_make_id_fkey"
            columns: ["make_id"]
            isOneToOne: false
            referencedRelation: "moto_makes"
            referencedColumns: ["id"]
          },
        ]
      }
      moto_variants: {
        Row: {
          created_at: string
          engine: string | null
          id: string
          model_id: string
          trim: string | null
          year_from: number
          year_to: number | null
        }
        Insert: {
          created_at?: string
          engine?: string | null
          id?: string
          model_id: string
          trim?: string | null
          year_from: number
          year_to?: number | null
        }
        Update: {
          created_at?: string
          engine?: string | null
          id?: string
          model_id?: string
          trim?: string | null
          year_from?: number
          year_to?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "moto_variants_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "moto_models"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          name_snapshot: string
          order_id: string
          product_id: string | null
          qty: number
          sku_snapshot: string | null
          unit_price: number
        }
        Insert: {
          id?: string
          name_snapshot: string
          order_id: string
          product_id?: string | null
          qty?: number
          sku_snapshot?: string | null
          unit_price: number
        }
        Update: {
          id?: string
          name_snapshot?: string
          order_id?: string
          product_id?: string | null
          qty?: number
          sku_snapshot?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          awb: string | null
          billing_address: Json | null
          coupon_code: string | null
          created_at: string
          discount: number
          id: string
          payment_method: string | null
          shipping_address: Json | null
          shipping_cost: number
          shipping_method: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          track_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          awb?: string | null
          billing_address?: Json | null
          coupon_code?: string | null
          created_at?: string
          discount?: number
          id?: string
          payment_method?: string | null
          shipping_address?: Json | null
          shipping_cost?: number
          shipping_method?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          track_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          awb?: string | null
          billing_address?: Json | null
          coupon_code?: string | null
          created_at?: string
          discount?: number
          id?: string
          payment_method?: string | null
          shipping_address?: Json | null
          shipping_cost?: number
          shipping_method?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          track_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_attributes: {
        Row: {
          id: string
          key: string
          product_id: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          product_id: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          product_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          sort_order: number | null
          url: string
        }
        Insert: {
          id?: string
          product_id: string
          sort_order?: number | null
          url: string
        }
        Update: {
          id?: string
          product_id?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string | null
          category_id: string | null
          condition: Database["public"]["Enums"]["product_condition"]
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_oem: boolean | null
          name: string
          price: number
          search_vector: unknown
          sku: string | null
          slug: string
          stock_qty: number
          updated_at: string
          vat_rate: number
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          condition?: Database["public"]["Enums"]["product_condition"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_oem?: boolean | null
          name: string
          price?: number
          search_vector?: unknown
          sku?: string | null
          slug: string
          stock_qty?: number
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          condition?: Database["public"]["Enums"]["product_condition"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_oem?: boolean | null
          name?: string
          price?: number
          search_vector?: unknown
          sku?: string | null
          slug?: string
          stock_qty?: number
          updated_at?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_alerts: {
        Row: {
          created_at: string
          id: string
          notified_at: string | null
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notified_at?: string | null
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notified_at?: string | null
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_garage: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          moto_variant_id: string
          nickname: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          moto_variant_id: string
          nickname?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          moto_variant_id?: string
          nickname?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_garage_moto_variant_id_fkey"
            columns: ["moto_variant_id"]
            isOneToOne: false
            referencedRelation: "moto_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      address_type: "livrare" | "facturare"
      app_role: "admin" | "client"
      coupon_type: "fixed" | "percent"
      order_status:
        | "noua"
        | "in_procesare"
        | "expediata"
        | "anulata"
        | "finalizata"
      product_condition: "nou" | "sh"
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
      address_type: ["livrare", "facturare"],
      app_role: ["admin", "client"],
      coupon_type: ["fixed", "percent"],
      order_status: [
        "noua",
        "in_procesare",
        "expediata",
        "anulata",
        "finalizata",
      ],
      product_condition: ["nou", "sh"],
    },
  },
} as const
