import React, { useEffect, useState } from "react";
import { ArrowLeft, Heart, Bell, Info, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  job_id?: number;
  is_read: boolean;
  created_at: string;
}

const WHVNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [whvId, setWhvId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [alertNotifications, setAlertNotifications] = useState(true);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch WHV ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // ✅ Fetch notifications + settings
  useEffect(() => {
    const fetchData = async () => {
      if (!whvId) return;
      setLoading(true);

      try {
        // Fetch notification setting
        const { data: settings } = await (supabase as any)
          .from("notification_setting")
          .select("notifications_enabled")
          .eq("user_id", whvId)
          .eq("user_type", "whv")
          .maybeSingle();

        if (settings?.notifications_enabled !== undefined) {
          setAlertNotifications(settings.notifications_enabled);
        }

        // Fetch notifications
        const { data: notifData, error } = await (supabase as any)
          .from("notifications")
          .select("id, type, title, message, job_id, read_at, created_at")
          .eq("recipient_id", whvId)
          .eq("recipient_type", "whv")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setNotifications(
          (notifData || []).map((n) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            job_id: n.job_id,
            is_read: !!n.read_at,
            created_at: n.created_at,
          }))
        );
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [whvId]);

  // ✅ Toggle notifications on/off
  const handleToggle = async (value: boolean) => {
    if (!whvId) return;
    setAlertNotifications(value);

    await (supabase as any)
      .from("notification_setting")
      .upsert({
        user_id: whvId,
        user_type: "whv",
        notifications_enabled: value,
      });
  };

  // ✅ Mark notification as read
  const markAsRead = async (id: number) => {
    await (supabase as any)
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .catch(console.error);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  // ✅ Handle notification click
  const handleNotificationClick = async (notification: NotificationItem) => {
    await markAsRead(notification.id);

    if (notification.type === "job_like") {
      // Employer liked WHV profile → view job preview
      navigate(`/whv/job-preview/${notification.job_id}`, {
        state: { from: "notifications" },
      });
    } else if (notification.type === "mutual_match") {
      // Mutual match → open full job
      navigate(`/whv/job-full/${notification.job_id}`, {
        state: { from: "notifications" },
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "job_like":
        return <Heart className="w-5 h-5 text-red-500" />;
      case "mutual_match":
        return <User className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {/* iPhone Frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
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

          {/* Content */}
          <div className="flex-1 px-6 overflow-y-auto">
            {/* Notification Toggle */}
            <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Turn Notifications On/Off
                  </h3>
                  <p className="text-sm text-gray-500">
                    You’ll be notified about important updates
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">
                    {alertNotifications ? "ON" : "OFF"}
                  </span>
                  <Switch
                    checked={alertNotifications}
                    onCheckedChange={handleToggle}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
              <p className="text-center text-gray-500 mt-10">
                No notifications yet
              </p>
            ) : (
              <div className="space-y-4">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow text-left ${
                      n.is_read ? "opacity-70" : ""
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
                          <h4 className="font-semibold text-gray-900">
                            {n.title}
                          </h4>
                          {!n.is_read && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full ml-2"></div>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="h-20" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVNotifications;
