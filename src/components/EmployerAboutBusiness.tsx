import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// ✅ Schema
const formSchema = z.object({
  businessTagline: z.string().min(10, "Please enter at least 10 characters").max(200, "Max 200 characters"),
  yearsInBusiness: z.string().min(1, "Required"),
  employeeCount: z.string().min(1, "Required"),
  industry: z.string().min(1, "Required"),
  jobType: z.array(z.string()).min(1, "Select at least one job type"),
  payRange: z.string().min(1, "Select a pay range"),
  facilitiesAndExtras: z.array(z.string()).min(1, "Select at least one facility"),
});

type FormData = z.infer<typeof formSchema>;

interface Industry {
  industry_id: number;
  name: string;
}

const jobTypes = ["Full-time", "Part-time", "Casual", "Seasonal", "Contract"];
const payRanges = ["$25-30/hour", "$30-35/hour", "$35-40/hour", "$40-45/hour", "$45+/hour"];
const facilitiesExtras = [
  "Accommodation provided", "Meals included", "Transport provided",
  "Training provided", "Equipment provided", "Flexible hours",
  "Career progression", "Team environment", "Other"
];

const EmployerAboutBusiness: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [industries, setIndustries] = useState<Industry[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobType: [],
      facilitiesAndExtras: [],
    },
  });

  // ✅ Load industries from Supabase
  useEffect(() => {
    const loadIndustries = async () => {
      const { data, error } = await supabase
        .from("industry")
        .select("industry_id, name")
        .order("industry_id", { ascending: true });

      if (error) {
        console.error("Error fetching industries:", error);
      } else {
        setIndustries(data || []);
      }
    };

    loadIndustries();
  }, []);

  const watchedFacilities = watch("facilitiesAndExtras") || [];

  const onSubmit = async (data: FormData) => {
    console.log("Business info submitted:", data);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // find industry id from selected name
    const selectedIndustry = industries.find((i) => i.name === data.industry);

    const { error } = await supabase.from("employer").upsert({
      user_id: user.id,
      tagline: data.businessTagline,
      business_tenure: data.yearsInBusiness,
      employee_count: data.employeeCount,
      industry_id: selectedIndustry?.industry_id,
      pay_range: data.payRange,
      updated_at: new Date().toISOString(),
    } as any);

    if (error) {
      console.error("Error saving employer:", error);
      toast({ title: "Error", description: "Could not save business info", variant: "destructive" });
    } else {
      toast({ title: "Business setup complete!", description: "Your employer profile has been created successfully" });
      navigate("/employer/photo-upload");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative bg-white">
            {/* Header */}
            <div className="px-6 pt-16 pb-6">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 bg-gray-100 rounded-xl shadow-sm"
                onClick={() => navigate("/business-registration")}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <div className="flex items-center justify-between mt-6">
                <h1 className="text-2xl font-bold text-gray-900">About Your Business</h1>
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                  <span className="text-sm font-medium text-gray-600">4/5</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-6 pb-20">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Tagline */}
                <div>
                  <Label>
                    Business Tagline <span className="text-red-500">*</span>
                  </Label>
                  <Input placeholder="Quality produce, sustainable farming" {...register("businessTagline")} className="h-14 bg-gray-100 rounded-xl" />
                  {errors.businessTagline && <p className="text-red-500 text-sm">{errors.businessTagline.message}</p>}
                </div>

                {/* Years in Business */}
                <div>
                  <Label>
                    Years in Business <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="yearsInBusiness"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 bg-gray-100 rounded-xl"><SelectValue placeholder="Select years" /></SelectTrigger>
                        <SelectContent>
                          {["<1", "1", "2", "3", "4", "5", "6-10", "11-15", "16-20", "20+"].map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.yearsInBusiness && <p className="text-red-500 text-sm">{errors.yearsInBusiness.message}</p>}
                </div>

                {/* Employee Count */}
                <div>
                  <Label>
                    Employees <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="employeeCount"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 bg-gray-100 rounded-xl"><SelectValue placeholder="Select employees" /></SelectTrigger>
                        <SelectContent>
                          {["1", "2-5", "6-10", "11-20", "21-50", "51-100", "100+"].map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.employeeCount && <p className="text-red-500 text-sm">{errors.employeeCount.message}</p>}
                </div>

                {/* Industry */}
                <div>
                  <Label>
                    Industry <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="industry"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 bg-gray-100 rounded-xl"><SelectValue placeholder="Select industry" /></SelectTrigger>
                        <SelectContent>
                          {industries.map(ind => (
                            <SelectItem key={ind.industry_id} value={ind.name}>{ind.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.industry && <p className="text-red-500 text-sm">{errors.industry.message}</p>}
                </div>

                {/* Job Type */}
                <div>
                  <Label>
                    Job Type <span className="text-red-500">*</span>
                  </Label>
                  {jobTypes.map(type => (
                    <label key={type} className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        value={type}
                        checked={watch("jobType")?.includes(type)}
                        onChange={e => {
                          const current = watch("jobType") || [];
                          if (e.target.checked) setValue("jobType", [...current, type]);
                          else setValue("jobType", current.filter(a => a !== type));
                        }}
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                  {errors.jobType && <p className="text-red-500 text-sm">{errors.jobType.message}</p>}
                </div>

                {/* Pay */}
                <div>
                  <Label>
                    Pay Range <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="payRange"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 bg-gray-100 rounded-xl"><SelectValue placeholder="Select pay" /></SelectTrigger>
                        <SelectContent>
                          {payRanges.map(range => (
                            <SelectItem key={range} value={range}>{range}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.payRange && <p className="text-red-500 text-sm">{errors.payRange.message}</p>}
                </div>

                {/* Facilities */}
                <div>
                  <Label>
                    Facilities & Extras <span className="text-red-500">*</span>
                  </Label>
                  {facilitiesExtras.map(facility => (
                    <label key={facility} className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        value={facility}
                        checked={watchedFacilities.includes(facility)}
                        onChange={e => {
                          const current = watchedFacilities;
                          if (e.target.checked) setValue("facilitiesAndExtras", [...current, facility]);
                          else setValue("facilitiesAndExtras", current.filter(x => x !== facility));
                        }}
                      />
                      <span>{facility}</span>
                    </label>
                  ))}
                  {errors.facilitiesAndExtras && <p className="text-red-500 text-sm">{errors.facilitiesAndExtras.message}</p>}
                </div>

                {/* Continue */}
                <div className="pt-8">
                  <Button type="submit" className="w-full h-14 text-lg rounded-xl bg-slate-800 text-white">
                    Continue
                  </Button>
                </div>

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerAboutBusiness;
