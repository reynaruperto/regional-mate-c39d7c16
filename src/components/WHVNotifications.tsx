// src/components/WHVNotifications.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Heart, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface NotificationItem {
  id: number;
  type: "job_like" | "maker_like" | "mutual_match";
  title: string;
  message: string;
  job_id: number | null;
  read_at: string | null;
  created_at: string;
}

const WHVNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [alertNotifications, setAlertNotifications] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ Fetch user and notifications
  useEffect(() => {
    const fetchUserAndNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Fetch notifications
      const { data: notifData, error: notifErr } = await (supabase as any)
        .from("notifications")
        .select("*")
        .eq("recipient_id", user.id)
        .eq("recipient_type", "whv")
        .order("created_at", { ascending: false });

      if (!notifErr && notifData) setNotifications(notifData);

      // Fetch notification setting
      const { data: setting } = await (supabase as any)
        .from("notification_setting")
        .select("notifications_enabled")
        .eq("user_id", user.id)
        .eq("user_type", "whv")
        .maybeSingle();

      if (setting) setAlertNotifications(setting.notifications_enabled ?? true);
    };

    fetchUserAndNotifications();
  }, []);

  // ✅ Real-time notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newNotif = payload.new as any;
          if (newNotif?.recipient_id === userId) {
            if (payload.eventType === "INSERT") {
              setNotifications((prev) => [newNotif, ...prev]);
            } else if (payload.eventType === "UPDATE") {
              setNotifications((prev) =>
                prev.map((n) => (n.id === newNotif.id ? newNotif : n))
              );
            } else if (payload.eventType === "DELETE") {
              setNotifications((prev) =>
                prev.filter((n) => n.id !== payload.old.id)
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // ✅ Toggle notification setting
  const toggleNotifications = async (value: boolean) => {
    setAlertNotifications(value);
    if (!userId) return;

    const { error } = await (supabase as any)
      .from("notification_setting")
      .upsert({
        user_id: userId,
        user_type: "whv",
        notifications_enabled: value,
      });

    if (error) console.error("Error updating setting:", error);
  };

  // ✅ Mark as read & navigate to correct screen
  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.id) return;

    // Mark as read
    await (supabase as any).rpc("mark_notification_read", {
      p_notification_id: notification.id,
    });

    // Update UI
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
      )
    );

    // Navigate by type
    if (notification.job_id) {
      switch (notification.type) {
        case "mutual_match":
        case "job_like":
          navigate(`/whv/job-full/${notification.job_id}`, {
            state: { from: "notifications" },
          });
          break;
        case "maker_like":
          navigate(`/whv/job/${notification.job_id}`, {
            state: { from: "notifications" },
          });
          break;
        default:
          break;
      }
    }
  };

  // ✅ Notification icons
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "job_like":
        return <Heart className="w-5 h-5 text-red-500" />;
      case "maker_like":
        return <User className="w-5 h-5 text-green-500" />;
      case "mutual_match":
        return <Heart className="w-5 h-5 text-pink-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          {/* Top Bar */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative bg-gray-200">
            {/* Header */}
            <div className="px-6 pt-16 pb-4 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 bg-white rounded-xl shadow-sm mr-4"
                onClick={() => navigate("/whv/dashboard")}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">
                Notifications
              </h1>
            </div>

            {/* Toggle */}
            <div className="bg-white rounded-2xl p-4 mx-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Turn Notifications On/Off
                  </h3>
                  <p className="text-sm text-gray-500">
                    You’ll be notified about likes and mutual matches
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">
                    {alertNotifications ? "ON" : "OFF"}
                  </span>
                  <Switch
                    checked={alertNotifications}
                    onCheckedChange={toggleNotifications}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 px-6 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-gray-500 mt-10">
                  No notifications yet.
                </p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow text-left mb-3 ${
                      n.read_at ? "opacity-70" : ""
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="mr-4 mt-1 flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          {getNotificationIcon(n.type)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <h4
                            className={`font-semibold ${
                              n.type === "mutual_match"
                                ? "text-pink-600"
                                : "text-gray-900"
                            }`}
                          >
                            {n.title || "Notification"}
                          </h4>
                          {!n.read_at && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full ml-2"></div>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
              <div className="h-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVNotifications;
