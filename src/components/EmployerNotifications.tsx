// src/components/EmployerNotifications.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Heart, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NotificationItem {
  id: number;
  type: "whv_like" | "mutual_match" | "job_update";
  title: string;
  message: string;
  whv_id: string | null;
  job_id: number | null;
  read_at: string | null;
  created_at: string;
}

const EmployerNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [alertNotifications, setAlertNotifications] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [jobPosts, setJobPosts] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");

  // ✅ Fetch employer notifications + jobs
  useEffect(() => {
    const fetchUserAndNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Fetch job posts for dropdown
      const { data: jobs } = await supabase
        .from("job")
        .select("job_id, description, job_status, industry_role(role)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (jobs) setJobPosts(jobs);

      // Fetch all notifications for employer
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user.id)
        .eq("recipient_type", "employer")
        .order("created_at", { ascending: false });

      if (!error && data) setNotifications(data);

      // Fetch notification setting
      const { data: setting } = await supabase
        .from("notification_setting")
        .select("notifications_enabled")
        .eq("user_id", user.id)
        .eq("user_type", "employer")
        .maybeSingle();

      if (setting) setAlertNotifications(setting.notifications_enabled ?? true);
    };

    fetchUserAndNotifications();
  }, []);

  // ✅ Toggle notifications on/off
  const toggleNotifications = async (value: boolean) => {
    setAlertNotifications(value);
    if (!userId) return;

    const { error } = await supabase
      .from("notification_setting")
      .upsert({
        user_id: userId,
        user_type: "employer",
        notifications_enabled: value,
      });

    if (error) console.error("Error updating notification setting:", error);
  };

  // ✅ Handle notification click & route correctly
  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.id) return;

    await supabase.rpc("mark_notification_read", {
      p_notification_id: notification.id,
    });

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
      )
    );

    // Route logic
    if (notification.type === "mutual_match" && notification.whv_id) {
      navigate(`/employer/full-candidate-profile/${notification.whv_id}`, {
        state: { from: "notifications" },
      });
    } else if (notification.type === "whv_like" && notification.whv_id) {
      navigate(`/short-candidate-profile/${notification.whv_id}`, {
        state: { from: "notifications" },
      });
    } else if (notification.type === "job_update" && notification.job_id) {
      navigate(`/employer/job-preview/${notification.job_id}`, {
        state: { from: "notifications" },
      });
    }
  };

  // ✅ Notification icons
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "whv_like":
        return <Heart className="w-5 h-5 text-red-500" />;
      case "mutual_match":
        return <Heart className="w-5 h-5 text-pink-500" />;
      case "job_update":
        return <Bell className="w-5 h-5 text-blue-500" />;
      default:
        return <User className="w-5 h-5 text-gray-500" />;
    }
  };

  // ✅ Filter notifications by job selection
  const filteredNotifications =
    !selectedJobId || selectedJobId === "all"
      ? notifications
      : notifications.filter((n) => n.job_id === Number(selectedJobId));

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
                onClick={() => navigate("/employer/dashboard")}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">
                Notifications
              </h1>
            </div>

            {/* Toggle Setting */}
            <div className="bg-white rounded-2xl p-4 mx-6 mb-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Turn Notifications On/Off
                  </h3>
                  <p className="text-sm text-gray-500">
                    You’ll receive updates about WHV likes and mutual matches
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

            {/* Job Post Selector */}
            <div className="px-6 mb-4">
              <Select
                onValueChange={(val) => setSelectedJobId(val)}
                value={selectedJobId}
              >
                <SelectTrigger className="w-full h-12 border border-gray-300 rounded-xl px-3 bg-white">
                  <SelectValue placeholder="Select a job post to view notifications" />
                </SelectTrigger>
                <SelectContent className="max-h-40 overflow-y-auto text-sm rounded-xl border bg-white shadow-lg">
                  <SelectItem value="all">All Jobs</SelectItem>
                  {jobPosts.map((job) => (
                    <SelectItem
                      key={job.job_id}
                      value={String(job.job_id)}
                      className="py-2 px-3 whitespace-normal break-words leading-snug text-sm"
                    >
                      {job.industry_role?.role || "Unknown Role"} –{" "}
                      {job.description || `Job #${job.job_id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notification List */}
            <div className="flex-1 px-6 overflow-y-auto">
              {!selectedJobId ? (
                <p className="text-center text-gray-500 mt-10">
                  Please select a job post above to view related notifications.
                </p>
              ) : filteredNotifications.length === 0 ? (
                <p className="text-center text-gray-500 mt-10">
                  No notifications found for this job.
                </p>
              ) : (
                filteredNotifications.map((n) => (
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
              <div className="h-20"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerNotifications;
