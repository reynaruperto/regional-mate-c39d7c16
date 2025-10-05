import React, { useState, useEffect } from "react";
import { ArrowLeft, Heart, User, Bell, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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

interface EmployerJob {
  job_id: number;
  role: string;
}

const EmployerNotifications: React.FC = () => {
  const navigate = useNavigate();

  const [alertNotifications, setAlertNotifications] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);

  // ✅ Fetch user, jobs, notifications, and settings
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Employer jobs
      const { data: jobData } = await supabase
        .from("job")
        .select("job_id, role")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setJobs(jobData || []);

      // Notifications
      const { data: notifData } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user.id)
        .eq("recipient_type", "employer")
        .order("created_at", { ascending: false });
      setNotifications(notifData || []);

      // Notification setting
      const { data: setting } = await supabase
        .from("notification_setting")
        .select("notifications_enabled")
        .eq("user_id", user.id)
        .eq("user_type", "employer")
        .maybeSingle();
      if (setting) setAlertNotifications(setting.notifications_enabled ?? true);
    };
    loadData();
  }, []);

  // ✅ Toggle notifications
  const toggleNotifications = async (value: boolean) => {
    setAlertNotifications(value);
    if (!userId) return;
    await supabase.from("notification_setting").upsert({
      user_id: userId,
      user_type: "employer",
      notifications_enabled: value,
    });
  };

  // ✅ Handle notification click
  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.id) return;

    await supabase.rpc("mark_notification_read", {
      p_notification_id: n.id,
    });
    setNotifications((prev) =>
      prev.map((x) =>
        x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x
      )
    );

    const type = n.type?.toLowerCase().trim();
    if (type === "mutual_match" && n.whv_id) {
      navigate(`/employer/full-candidate-profile/${n.whv_id}`, {
        state: { from: "notifications" },
      });
    } else if (type === "whv_like" && n.whv_id) {
      // Require job context if liking back
      if (!selectedJob) {
        alert("Select one of your job posts first.");
        return;
      }
      navigate(`/short-candidate-profile/${n.whv_id}`, {
        state: { from: "notifications", job_id: selectedJob },
      });
    } else if (type === "job_update" && n.job_id) {
      navigate(`/employer/job-preview/${n.job_id}`, {
        state: { from: "notifications" },
      });
    }
  };

  // ✅ Icons
  const getNotificationIcon = (t: string) => {
    switch (t) {
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

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 pt-16 pb-4 flex items-center justify-between">
            <button
              onClick={() => navigate("/employer/dashboard")}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-[#1E293B]" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              Notifications
            </h1>
            <div className="w-10" />
          </div>

          {/* Job dropdown */}
          {jobs.length > 0 && (
            <div className="mx-6 mb-4">
              <label className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                <Briefcase size={14} /> Select Job Post
              </label>
              <Select
                onValueChange={(v) => setSelectedJob(Number(v))}
                value={selectedJob ? String(selectedJob) : undefined}
              >
                <SelectTrigger className="w-full bg-gray-50 border border-gray-300 rounded-lg">
                  <SelectValue placeholder="Select a job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((j) => (
                    <SelectItem key={j.job_id} value={String(j.job_id)}>
                      {j.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Toggle */}
          <div className="bg-gray-50 rounded-2xl p-4 mx-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Turn Notifications On/Off
                </h3>
                <p className="text-sm text-gray-500">
                  Updates about WHV likes and matches
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

          {/* Notifications list */}
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
            <div className="h-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerNotifications;
