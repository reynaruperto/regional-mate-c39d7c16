// src/components/EmployerNotifications.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Heart, User } from "lucide-react";
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
  type: "whv_like" | "mutual_match";
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
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch employer job posts + settings
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: jobs } = await supabase
        .from("job")
        .select("job_id, description, job_status, industry_role(role)")
        .eq("user_id", user.id)
        .eq("job_status", "active");
      setJobPosts(jobs || []);

      const { data: setting } = await supabase
        .from("notification_setting" as any)
        .select("notifications_enabled")
        .eq("user_id", user.id)
        .eq("user_type", "employer")
        .maybeSingle() as any;
      setAlertNotifications(setting?.notifications_enabled ?? true);
    };
    fetchInitialData();
  }, []);

  // ✅ Fetch notifications when a job is selected
  useEffect(() => {
    if (!userId || !selectedJobId) return;

    const fetchNotifications = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("notifications" as any)
        .select("*")
        .eq("recipient_id", userId)
        .eq("recipient_type", "employer")
        .eq("job_id", selectedJobId)
        .order("created_at", { ascending: false }) as any;

      if (!error && data) setNotifications(data as any);
      setLoading(false);
    };

    fetchNotifications();
  }, [userId, selectedJobId]);

  // ✅ Toggle notification setting
  const toggleNotifications = async (value: boolean) => {
    setAlertNotifications(value);
    if (!userId) return;
    await supabase.from("notification_setting" as any).upsert({
      user_id: userId,
      user_type: "employer",
      notifications_enabled: value,
    } as any);
  };

  // ✅ Handle notification click
  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.id) return;
    await (supabase.rpc as any)("mark_notification_read", { p_notification_id: n.id });

    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
    );

    if (n.type === "mutual_match" && n.whv_id) {
      navigate(`/employer/full-candidate-profile/${n.whv_id}`, {
        state: { from: "notifications" },
      });
    } else if (n.type === "whv_like" && n.whv_id) {
      navigate(`/short-candidate-profile/${n.whv_id}`, {
        state: { from: "notifications" },
      });
    }
  };

  // ✅ Notification icons
  const getIcon = (type: string) => {
    return type === "mutual_match" ? (
      <Heart className="w-5 h-5 text-pink-500" />
    ) : (
      <Heart className="w-5 h-5 text-red-500" />
    );
  };

  // ✅ Dropdown classes (same as BrowseCandidates)
  const dropdownClasses =
    "w-[var(--radix-select-trigger-width)] max-w-full max-h-40 overflow-y-auto text-sm rounded-xl border bg-white shadow-lg";
  const itemClasses =
    "py-2 px-3 whitespace-normal break-words leading-snug text-sm";

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
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
            <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
          </div>

          {/* Job Selector */}
          <div className="px-6 mb-4">
            <Select
              onValueChange={(v) => setSelectedJobId(Number(v))}
              value={selectedJobId ? String(selectedJobId) : ""}
            >
              <SelectTrigger className="w-full h-12 border border-gray-300 rounded-xl px-3 bg-white">
                <SelectValue placeholder="Select a job post first" />
              </SelectTrigger>
              <SelectContent className={dropdownClasses}>
                {jobPosts.map((job) => (
                  <SelectItem
                    key={job.job_id}
                    value={String(job.job_id)}
                    className={itemClasses}
                  >
                    {job.industry_role?.role || "Unknown Role"} –{" "}
                    {job.description || `Job #${job.job_id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Toggle Setting */}
          <div className="bg-white rounded-2xl p-4 mx-6 mb-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Turn Notifications On/Off
                </h3>
                <p className="text-sm text-gray-500">
                  Get alerts for likes and mutual matches
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
            {!selectedJobId ? (
              <div className="text-center text-gray-600 mt-10">
                <p>Please select a job post above to view notifications.</p>
              </div>
            ) : loading ? (
              <div className="text-center text-gray-600 mt-10">Loading...</div>
            ) : notifications.length === 0 ? (
              <p className="text-center text-gray-500 mt-10">
                No notifications for this job post.
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
                        {getIcon(n.type)}
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
                          <div className="w-2 h-2 bg-orange-500 rounded-full ml-2" />
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
  );
};

export default EmployerNotifications;
