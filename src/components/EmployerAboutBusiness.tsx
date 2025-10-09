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

const formSchema = z.object({
  businessTagline: z.string().min(10, "Please enter at least 10 characters").max(200, "Max 200 characters"),
  yearsInBusiness: z.enum(["<1", "1", "2", "3", "4", "5", "6-10", "11-15", "16-20", "20+"]).refine(val => val, {
    message: "Please select years in business",
  }),
  employeeCount: z.enum(["1", "2-5", "6-10", "11-20", "21-50", "51-100", "100+"]).refine(val => val, {
    message: "Please select employee count",
  }),
  industryId: z.string().min(1, "Required"),
  facilitiesAndExtras: z.array(z.string()).min(1, "Select at least one facility"),
});

type FormData = z.infer<typeof formSchema>;

const EmployerAboutBusiness: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [facilities, setFacilities] = useState<{ id: number; name: string }[]>([]);
  const [yearsOptions, setYearsOptions] = useState<string[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<string[]>([]);

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
      facilitiesAndExtras: [],
    },
  });

  const watchedFacilities = watch("facilitiesAndExtras") || [];

  // ✅ Load options and existing data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load dropdown options
        const { data: indData } = await supabase.from("industry").select("industry_id, name");
        if (indData) setIndustries(indData.map(i => ({ id: i.industry_id, name: i.name })));

        const { data: facData } = await supabase.from("facility").select("facility_id, name");
        if (facData) setFacilities(facData.map(f => ({ id: f.facility_id, name: f.name })));

        setYearsOptions(["<1", "1", "2", "3", "4", "5", "6-10", "11-15", "16-20", "20+"] as const);
        setEmployeeOptions(["1", "2-5", "6-10", "11-20", "21-50", "51-100", "100+"] as const);

        // Load existing employer data
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: employerData } = await supabase
          .from("employer")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (employerData) {
          // Pre-populate form fields
          if (employerData.tagline) setValue("businessTagline", employerData.tagline);
          if (employerData.business_tenure) setValue("yearsInBusiness", employerData.business_tenure);
          if (employerData.employee_count) setValue("employeeCount", employerData.employee_count);
          if (employerData.industry_id) setValue("industryId", String(employerData.industry_id));

          // Load existing facilities
          const { data: existingFacilities } = await supabase
            .from("employer_facility")
            .select("facility_id")
            .eq("user_id", user.id);

          if (existingFacilities && facData) {
            const facilityNames = existingFacilities
              .map(ef => facData.find(f => f.facility_id === ef.facility_id)?.name)
              .filter(Boolean) as string[];
            setValue("facilitiesAndExtras", facilityNames);
          }
        }
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };
    loadData();
  }, [setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");

      // ✅ Update employer
      const { error: empError } = await supabase
        .from("employer")
        .update({
          tagline: data.businessTagline,
          business_tenure: data.yearsInBusiness,
          employee_count: data.employeeCount,
          industry_id: Number(data.industryId),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (empError) throw empError;

      // ✅ Replace facilities: delete old → insert new
      await supabase.from("employer_facility").delete().eq("user_id", user.id);

      const selectedFacilityIds = facilities
        .filter(f => watchedFacilities.includes(f.name))
        .map(f => f.id);

      if (selectedFacilityIds.length > 0) {
        const facilityRows = selectedFacilityIds.map(id => ({
          user_id: user.id,
          facility_id: id,
        }));
        const { error: facError } = await supabase.from("employer_facility").insert(facilityRows);
        if (facError) throw facError;
      }

      toast({ title: "Business setup complete!", description: "Your employer profile has been updated successfully" });
      navigate("/employer/photo-upload");
    } catch (error: any) {
      toast({
        title: "Error saving business info",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center p-4" style={{ backgroundColor: "white" }}>
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full rounded-[48px] overflow-hidden relative flex flex-col" style={{ backgroundColor: "white" }}>
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Header */}
          <div className="px-6 pt-16 pb-6">
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 bg-white rounded-xl shadow-sm"
              onClick={() => navigate("/business-registration")}
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </Button>
            <div className="flex items-center justify-between mt-6">
              <h1 className="text-2xl font-bold text-gray-900">About Your Business</h1>
              <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full">
                <span className="text-sm font-medium text-gray-600">4/5</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto px-6 pb-24">
            <form id="businessForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Tagline */}
              <div>
                <Label>Business Tagline <span className="text-red-500">*</span></Label>
                <Input placeholder="Quality produce, sustainable farming" {...register("businessTagline")} className="h-14 bg-white rounded-xl" />
                {errors.businessTagline && <p className="text-red-500 text-sm">{errors.businessTagline.message}</p>}
              </div>

              {/* Years in Business */}
              <div>
                <Label>Years in Business <span className="text-red-500">*</span></Label>
                <Controller
                  name="yearsInBusiness"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-14 bg-white rounded-xl"><SelectValue placeholder="Select years" /></SelectTrigger>
                      <SelectContent>
                        {yearsOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.yearsInBusiness && <p className="text-red-500 text-sm">{errors.yearsInBusiness.message}</p>}
              </div>

              {/* Employees */}
              <div>
                <Label>Employees <span className="text-red-500">*</span></Label>
                <Controller
                  name="employeeCount"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-14 bg-white rounded-xl"><SelectValue placeholder="Select employees" /></SelectTrigger>
                      <SelectContent>
                        {employeeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.employeeCount && <p className="text-red-500 text-sm">{errors.employeeCount.message}</p>}
              </div>

              {/* Industry */}
              <div>
                <Label>Industry <span className="text-red-500">*</span></Label>
                <Controller
                  name="industryId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-14 bg-white rounded-xl"><SelectValue placeholder="Select industry" /></SelectTrigger>
                      <SelectContent>
                        {industries.map(ind => <SelectItem key={ind.id} value={String(ind.id)}>{ind.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.industryId && <p className="text-red-500 text-sm">{errors.industryId.message}</p>}
              </div>

              {/* Facilities */}
              <div>
                <Label>Facilities & Extras <span className="text-red-500">*</span></Label>
                {facilities.map(f => (
                  <label key={f.id} className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      value={f.name}
                      checked={watchedFacilities.includes(f.name)}
                      onChange={e => {
                        const current = watchedFacilities;
                        if (e.target.checked) setValue("facilitiesAndExtras", [...current, f.name]);
                        else setValue("facilitiesAndExtras", current.filter(x => x !== f.name));
                      }}
                    />
                    <span>{f.name}</span>
                  </label>
                ))}
                {errors.facilitiesAndExtras && <p className="text-red-500 text-sm">{errors.facilitiesAndExtras.message}</p>}
              </div>
            </form>
          </div>

          {/* ✅ Fixed footer */}
          <div className="px-6 py-4 border-t bg-white">
            <Button type="submit" form="businessForm" className="w-full h-14 text-lg rounded-xl bg-slate-800 text-white">
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerAboutBusiness;
