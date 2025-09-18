// src/pages/employer/EmployerJobPreview.tsx
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  User,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface JobDetails {
  job_id: number;
  role: string;
  description: string;
  employment_type: string;
  salary_range: string;
  req_experience: string;
  state: string;
  suburb_city: string;
  postcode: string;
  start_date: string;
  job_status: string;
  company_name: string;
  tagline: string;
  company_photo: string | null;
  facilities: string[];
}

const EmployerJobPreview: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { toast } = useToast();
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoPath, setPhotoPath] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;

      try {
        const { data, error } = await supabase
          .from("job")
          .select(
            `
            job_id,
            description,
            employment_type,
            salary_range,
            req_experience,
            state,
            suburb_city,
            postcode,
            start_date,
            job_status,
            industry_role ( role ),
            profile:user_id (
              user_id,
              employer (
                company_name,
                tagline,
                profile_photo
              )
            )
          `
          )
          .eq("job_id", parseInt(jobId))
          .maybeSingle();

        // 🔎 Debug log
        console.log("Job fetch result:", data);

        if (error) {
          toast({ title: "Error loading job", description: error.message });
          return;
        }

        if (!data) {
          setJobDetails(null);
          return;
        }

        const employer = data.profile?.employer?.[0] || null;
        const employerUserId = data.profile?.user_id;

        // Fetch facilities separately
        let facilities: string[] = [];
        if (employerUserId) {
          const { data: facilityRows } = await supabase
            .from("employer_facility")
            .select(`facility ( name )`)
            .eq("user_id", employerUserId);

          facilities =
            facilityRows?.map((f: any) => f.facility?.name).filter(Boolean) ||
            [];
        }

        // Handle company photo
        let signedPhoto: string | null = null;
        if (employer?.profile_photo) {
          const photoValue = employer.profile_photo;
          if (photoValue.startsWith("http")) {
            signedPhoto = photoValue;
          } else {
            setPhotoPath(photoValue);
            const { data: signed } = await supabase.storage
              .from("profile_photo")
              .createSignedUrl(photoValue, 3600);
            signedPhoto = signed?.signedUrl ?? null;
          }
        }

        setJobDetails({
          job_id: data.job_id,
          description: data.description || "No description available",
          employment_type: data.employment_type || "Not specified",
          salary_range: data.salary_range || "Not specified",
          req_experience: data.req_experience || "Not specified",
          state: data.state,
          suburb_city: data.suburb_city,
          postcode: data.postcode,
          start_date: data.start_date,
          job_status: data.job_status,
          role: data.industry_role?.role || "Unknown Role",
          company_name: employer?.company_name || "Unknown Company",
          tagline: employer?.tagline || "No tagline provided",
          company_photo: signedPhoto,
          facilities,
        });
      } catch (error) {
        console.error("Error fetching job:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {loading ? <p>Loading…</p> : <pre>{JSON.stringify(jobDetails, null, 2)}</pre>}
    </div>
  );
};

export default EmployerJobPreview;
