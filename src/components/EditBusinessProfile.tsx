import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Options
const yearsOptions = ["<1", "1", "2", "3", "4", "5", "6-10", "11-15", "16-20", "20+"] as const;
const employeeOptions = ["1", "2-5", "6-10", "11-20", "21-50", "51-100", "100+"] as const;

const AUSTRALIAN_STATES = [
  "Australian Capital Territory",
  "New South Wales",
  "Northern Territory",
  "Queensland",
  "South Australia",
  "Tasmania",
  "Victoria",
  "Western Australia",
] as const;

// Schema
const formSchema = z.object({
  abn: z.string().length(11, "ABN must be 11 digits").regex(/^\d+$/, "ABN must be numeric"),
  website: z.string().url().optional().or(z.literal("")),
  businessPhone: z.string().min(10, "Enter a valid phone number"),
  addressLine1: z.string().min(2, "Address line 1 required"),
  addressLine2: z.string().optional(),
  suburbCity: z.string().min(2, "Suburb / City required"),
  state: z.enum(AUSTRALIAN_STATES),
  postCode: z.string().length(4, "Postcode must be 4 digits").regex(/^\d+$/, "Must be numeric"),
  businessTagline: z.string().min(10, "At least 10 characters").max(200),
  yearsInBusiness: z.enum(yearsOptions),
  employeeCount: z.enum(employeeOptions),
  industryId: z.string().min(1, "Select an industry"),
  facilitiesAndExtras: z.array(z.string()).min(1, "Select at least one facility"),
});

type FormData = z.infer<typeof formSchema>;

const EditBusinessProfile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);

  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [facilities, setFacilities] = useState<{ id: number; name: string }[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { facilitiesAndExtras: [] },
  });

  const watchedFacilities = watch("facilitiesAndExtras") || [];

  // Load options + employer data
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/employer/sign-in");
        return;
      }

      // Options
      const { data: indData } = await supabase.from("industry").select("industry_id, name");
      if (indData) setIndustries(indData.map(i => ({ id: i.industry_id, name: i.name })));

      const { data: facData } = await supabase.from("facility").select("facility_id, name");
      if (facData) setFacilities(facData.map(f => ({ id: f.facility_id, name: f.name })));

      // Employer
      const { data: employer } = await supabase.from("employer").select("*").eq("user_id", user.id).maybeSingle();
      if (employer) {
        reset({
          abn: employer.abn,
          website: employer.website || "",
          businessPhone: employer.mobile_num || "",
          addressLine1: employer.address_line1 || "",
          addressLine2: employer.address_line2 || "",
          suburbCity: employer.suburb_city || "",
          state: employer.state,
          postCode: employer.postcode || "",
          businessTagline: employer.tagline || "",
          yearsInBusiness: employer.business_tenure,
          employeeCount: employer.employee_count,
          industryId: employer.industry_id ? String(employer.industry_id) : "",
        });
      }

      // Prefill facilities
      const { data: empFacilities } = await supabase.from("employer_facility").select("facility_id").eq("user_id", user.id);
      if (empFacilities && facData) {
        const selectedFacilities = facData
          .filter(f => empFacilities.some((e: any) => e.facility_id === f.facility_id))
          .map(f => f.name);
        setValue("facilitiesAndExtras", selectedFacilities);
      }
    };
    loadData();
  }, [navigate, reset, setValue]);

  // Save
  const onSubmit = async (data: FormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");

      await supabase.from("employer").update({
        tagline: data.businessTagline,
        business_tenure: data.yearsInBusiness,
        employee_count: data.employeeCount,
        industry_id: Number(data.industryId),
        website: data.website || null,
        mobile_num: data.businessPhone,
        address_line1: data.addressLine1,
        address_line2: data.addressLine2 || null,
        suburb_city: data.suburbCity,
        state: data.state,
        postcode: data.postCode,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id);

      // Replace facilities
      await supabase.from("employer_facility").delete().eq("user_id", user.id);
      const selectedFacilityIds = facilities.filter(f => data.facilitiesAndExtras.includes(f.name)).map(f => f.id);
      if (selectedFacilityIds.length > 0) {
        await supabase.from("employer_facility").insert(
          selectedFacilityIds.map(id => ({ user_id: user.id, facility_id: id }))
        );
      }

      toast({ title: "Profile Updated", description: "Business profile updated successfully" });
      navigate("/employer/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Header */}
          <div className="px-6 pt-16 pb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/employer/dashboard")}
              className="text-[#1E293B] underline"
            >
              Cancel
            </button>
            <h1 className="text-lg font-semibold">
              {step === 1 ? "Business Registration" : "About Business"}
            </h1>
            {step === 2 ? (
              <button
                type="submit"
                form="editForm"
                className="text-[#1E293B] underline"
              >
                Save
              </button>
            ) : (
              <div className="w-10" />
            )}
          </div>

          {/* Form - fields only */}
          <div className="flex-1 px-6 overflow-y-auto pb-20">
            <form id="editForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <>
                  <div>
                    <Label htmlFor="abn">Australian Business Number (ABN)</Label>
                    <Input id="abn" {...register("abn")} disabled />
                    {errors.abn && <p className="text-red-500 text-sm">{errors.abn.message}</p>}
                  </div>
                  <div>
                    <Label>Business Website</Label>
                    <Input id="website" type="url" {...register("website")} />
                    {errors.website && <p className="text-red-500 text-sm">{errors.website.message}</p>}
                  </div>
                  <div>
                    <Label>Business Phone Number *</Label>
                    <Input id="businessPhone" type="tel" {...register("businessPhone")} />
                    {errors.businessPhone && <p className="text-red-500 text-sm">{errors.businessPhone.message}</p>}
                  </div>
                  <div>
                    <Label>Business Address Line 1 *</Label>
                    <Input id="addressLine1" {...register("addressLine1")} />
                    {errors.addressLine1 && <p className="text-red-500 text-sm">{errors.addressLine1.message}</p>}
                  </div>
                  <div>
                    <Label>Address Line 2</Label>
                    <Input id="addressLine2" {...register("addressLine2")} />
                  </div>
                  <div>
                    <Label>Suburb / City *</Label>
                    <Input id="suburbCity" {...register("suburbCity")} />
                    {errors.suburbCity && <p className="text-red-500 text-sm">{errors.suburbCity.message}</p>}
                  </div>
                  <div>
                    <Label>State *</Label>
                    <Controller
                      name="state"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a state" />
                          </SelectTrigger>
                          <SelectContent>
                            {AUSTRALIAN_STATES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.state && <p className="text-red-500 text-sm">{errors.state.message}</p>}
                  </div>
                  <div>
                    <Label>Post Code *</Label>
                    <Input
                      id="postCode"
                      maxLength={4}
                      {...register("postCode")}
                      onChange={(e) => {
                        e.target.value = e.target.value.replace(/\D/g, "");
                        register("postCode").onChange(e);
                      }}
                    />
                    {errors.postCode && <p className="text-red-500 text-sm">{errors.postCode.message}</p>}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <Label>Business Tagline *</Label>
                    <Input id="businessTagline" {...register("businessTagline")} />
                    {errors.businessTagline && <p className="text-red-500 text-sm">{errors.businessTagline.message}</p>}
                  </div>
                  <div>
                    <Label>Years in Business *</Label>
                    <Controller
                      name="yearsInBusiness"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select years" />
                          </SelectTrigger>
                          <SelectContent>
                            {yearsOptions.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.yearsInBusiness && <p className="text-red-500 text-sm">{errors.yearsInBusiness.message}</p>}
                  </div>
                  <div>
                    <Label>Employees *</Label>
                    <Controller
                      name="employeeCount"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employees" />
                          </SelectTrigger>
                          <SelectContent>
                            {employeeOptions.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.employeeCount && <p className="text-red-500 text-sm">{errors.employeeCount.message}</p>}
                  </div>
                  <div>
                    <Label>Industry *</Label>
                    <Controller
                      name="industryId"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {industries.map((ind) => (
                              <SelectItem key={ind.id} value={String(ind.id)}>{ind.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.industryId && <p className="text-red-500 text-sm">{errors.industryId.message}</p>}
                  </div>
                  <div>
                    <Label>Facilities & Extras *</Label>
                    {facilities.map((f) => (
                      <label key={f.id} className="flex items-center space-x-2 mt-2">
                        <input
                          type="checkbox"
                          value={f.name}
                          checked={watchedFacilities.includes(f.name)}
                          onChange={(e) => {
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
                </>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-white flex items-center relative">
            {step > 1 && (
              <Button
                type="button"
                onClick={() => setStep((step - 1) as 1 | 2)}
                className="h-10 px-5 rounded-lg bg-gray-200 text-gray-700 text-sm"
              >
                Back
              </Button>
            )}

            <div className="absolute left-1/2 transform -translate-x-1/2 flex space-x-2 w-24">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full ${step === i ? "bg-[#1E293B]" : "bg-gray-300"}`}
                />
              ))}
            </div>

            {step < 2 ? (
              <Button
                type="button"
                onClick={() => setStep((step + 1) as 1 | 2)}
                className="ml-auto h-10 px-5 rounded-lg bg-[#1E293B] text-white text-sm"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                form="editForm"
                className="ml-auto h-10 px-5 rounded-lg bg-[#1E293B] text-white text-sm"
              >
                Finish Setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditBusinessProfile;
