// Extended types for tables not yet in auto-generated types.ts
export interface NotificationRow {
  id: string;
  sender_id: string;
  sender_type: string | null;
  recipient_id: string;
  recipient_type: string | null;
  type: 'job_like' | 'mutual_match' | 'maker_like';
  job_id: number;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface NotificationSettingRow {
  user_id: string;
  user_type: string;
  notifications_enabled: boolean | null;
  created_at: string;
  updated_at: string;
}

// Extend Database type
export interface ExtendedDatabase {
  public: {
    Tables: {
      notifications: {
        Row: NotificationRow;
        Insert: Omit<NotificationRow, 'id' | 'created_at'>;
        Update: Partial<Omit<NotificationRow, 'id'>>;
      };
      notification_setting: {
        Row: NotificationSettingRow;
        Insert: Omit<NotificationSettingRow, 'created_at' | 'updated_at'>;
        Update: Partial<NotificationSettingRow>;
      };
    };
    Functions: {
      mark_notification_read: {
        Args: { p_notification_id: number };
        Returns: void;
      };
    };
  };
}
