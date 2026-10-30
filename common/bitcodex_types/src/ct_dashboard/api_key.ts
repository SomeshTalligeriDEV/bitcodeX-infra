export interface APIKey {
  key_id: string;
  customer_id: string;
  hashed_key: string;
  is_active: boolean;
  /** Owning app (X11); null for keys created before apps existed. */
  app_id?: string | null;
  created_at: Date;
  updated_at: Date;
}
