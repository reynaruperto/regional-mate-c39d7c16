import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Business options
const YEARS_OPTIONS = ['<1', '1', '2', '3', '4', '5', '6-10', '11-15', '16-20', '20+'] as const;
const EMPLOYEE_OPTIONS = ['1', '2-5', '6-10', '11-20', '21-50', '51-100', '100+'] as const;

// Interfaces
interface Industry {
  industry_id: number;
  name: string;
}

interface Facility {
  facility_id: number;
  name: string;
}

// Zod Schema for Step 2
const aboutBusinessSchema = z.object({
  businessTagline: z.string().min(10, 'Tagline must be at least 10 characters').max(200, 'Tagline must be less than 200 characters'),
  yearsInBusiness: z.enum(YEARS_OPTIONS).refine(val => val !== undefined, { message: 'Years in business is required' }),
  employeeCount: z.enum(EMPLOYEE_OPTIONS).refine(val => val !== undefined, { message: 'Employee count is required' }),
  industryId: z.string().min(1, 'Industry is required'),
  facilitiesAndExtras: z.array(z.number()).min(1, 'Select at least one facility'),
});

type AboutBusinessData = z.infer<typeof aboutBusinessSchema>;

const AboutBusiness: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AboutBusinessData>({
    resolver: zodResolver(aboutBusinessSchema),
    defaultValues: {
      facilitiesAndExtras: [],
    },
    mode: 'onChange',
  });

  const watchedFacilities = watch('facilitiesAndExtras') || [];

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('No user logged in', userError);
          navigate('/employer/sign-in');
          return;
        }
        setUserId(user.id);

        // Load industries
        const { data: industriesData, error: industriesError } = await supabase
          .from('industry')
          .select('industry_id, name')
          .order('name');

        if (industriesError) throw industriesError;
        setIndustries(industriesData || []);

        // Load facilities
        const { data: facilitiesData, error: facilitiesError } = await supabase
          .from('facility')
          .select('facility_id, name')
          .order('name');

        if (facilitiesError) throw facilitiesError;
        setFacilities(facilitiesData || []);

        // Load employer data
        const { data: employerData, error: employerError } = await supabase
          .from('employer')
          .select('tagline, business_tenure, employee_count, industry_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (employerError) throw employerError;

        // Load employer facilities
        const { data: employerFacilities, error: facilitiesErr } = await supabase
          .from('employer_facility')
          .select('facility_id')
          .eq('user_id', user.id);

        if (facilitiesErr) throw facilitiesErr;

        // Prefill form with existing data
        if (employerData) {
          reset({
            businessTagline: employerData.tagline || '',
            yearsInBusiness: employerData.business_tenure || undefined,
            employeeCount: employerData.employee_count || undefined,
            industryId: employerData.industry_id ? String(employerData.industry_id) : '',
            facilitiesAndExtras: employerFacilities?.map(f => f.facility_id) || [],
          });
        }

      } catch (error: any) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error loading data',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, reset, toast]);

  const handleCancel = () => {
    navigate('/employer/dashboard');
  };

  const handleBack = () => {
    navigate('/employer/business-registration');
  };

  const onSubmit = async (data: AboutBusinessData) => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Update employer data
      const { error: employerError } = await supabase
        .from('employer')
        .update({
          tagline: data.businessTagline,
          business_tenure: data.yearsInBusiness,
          employee_count: data.employeeCount,
          industry_id: Number(data.industryId),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (employerError) throw employerError;

      // Update employer facilities
      // First, delete existing facilities
      const { error: deleteError } = await supabase
        .from('employer_facility')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Insert new facilities
      if (data.facilitiesAndExtras.length > 0) {
        const facilityInserts = data.facilitiesAndExtras.map(facilityId => ({
          user_id: userId,
          facility_id: facilityId,
        }));

        const { error: insertError } = await supabase
          .from('employer_facility')
          .insert(facilityInserts);

        if (insertError) throw insertError;
      }

      toast({
        title: 'Business Profile Complete',
        description: 'Your business profile has been successfully updated.',
      });

      navigate('/employer/dashboard');

    } catch (error: any) {
      console.error('Error saving business profile:', error);
      toast({
        title: 'Error saving profile',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Handle facility checkbox changes
  const handleFacilityChange = (facilityId: number, checked: boolean) => {
    const currentFacilities = watchedFacilities;
    if (checked) {
      setValue('facilitiesAndExtras', [...currentFacilities, facilityId]);
    } else {
      setValue('facilitiesAndExtras', currentFacilities.filter(id => id !== facilityId));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
        <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
          <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex items-center justify-center">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative">
            {/* Header */}
            <div className="px-6 pt-16 pb-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-[#1E293B] font-medium underline"
                >
                  Cancel
                </button>
                <h1 className="text-lg font-semibold text-gray-900">
                  About Business
                </h1>
                <button
                  type="submit"
                  form="aboutBusinessForm"
                  className="flex items-center text-[#1E293B] font-medium underline"
                >
                  <Check size={16} className="mr-1" />
                  Save
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 overflow-y-auto pb-24">
              <form id="aboutBusinessForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Business Tagline */}
                <div>
                  <Label htmlFor="businessTagline" className="text-gray-600 mb-2 block">
                    Business Tagline *
                  </Label>
                  <Input
                    id="businessTagline"
                    placeholder="Quality produce, sustainable farming"
                    {...register('businessTagline')}
                    className="h-12 rounded-xl border-gray-200 bg-white"
                  />
                  {errors.businessTagline && (
                    <p className="text-red-500 text-sm mt-1">{errors.businessTagline.message}</p>
                  )}
                </div>

                {/* Years in Business */}
                <div>
                  <Label className="text-gray-600 mb-2 block">Years in Business *</Label>
                  <Controller
                    name="yearsInBusiness"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white">
                          <SelectValue placeholder="Select years in business" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                          {YEARS_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option} className="hover:bg-gray-100">
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.yearsInBusiness && (
                    <p className="text-red-500 text-sm mt-1">{errors.yearsInBusiness.message}</p>
                  )}
                </div>

                {/* Employee Count */}
                <div>
                  <Label className="text-gray-600 mb-2 block">Number of Employees *</Label>
                  <Controller
                    name="employeeCount"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white">
                          <SelectValue placeholder="Select employee count" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                          {EMPLOYEE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option} className="hover:bg-gray-100">
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.employeeCount && (
                    <p className="text-red-500 text-sm mt-1">{errors.employeeCount.message}</p>
                  )}
                </div>

                {/* Industry */}
                <div>
                  <Label className="text-gray-600 mb-2 block">Industry *</Label>
                  <Controller
                    name="industryId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                          {industries.map((industry) => (
                            <SelectItem
                              key={industry.industry_id}
                              value={String(industry.industry_id)}
                              className="hover:bg-gray-100"
                            >
                              {industry.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.industryId && (
                    <p className="text-red-500 text-sm mt-1">{errors.industryId.message}</p>
                  )}
                </div>

                {/* Facilities & Extras */}
                <div>
                  <Label className="text-gray-600 mb-2 block">Facilities & Extras *</Label>
                  <div className="space-y-3">
                    {facilities.map((facility) => (
                      <label
                        key={facility.facility_id}
                        className="flex items-center space-x-3 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={watchedFacilities.includes(facility.facility_id)}
                          onChange={(e) =>
                            handleFacilityChange(facility.facility_id, e.target.checked)
                          }
                          className="w-4 h-4 text-[#1E293B] border-gray-300 rounded focus:ring-[#1E293B]"
                        />
                        <span className="text-gray-700">{facility.name}</span>
                      </label>
                    ))}
                  </div>
                  {errors.facilitiesAndExtras && (
                    <p className="text-red-500 text-sm mt-1">{errors.facilitiesAndExtras.message}</p>
                  )}
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-white flex items-center justify-between relative">
              {/* Back Button */}
              <Button
                type="button"
                onClick={handleBack}
                variant="outline"
                className="h-10 px-5 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Back
              </Button>

              {/* Step Indicators */}
              <div className="absolute left-1/2 transform -translate-x-1/2 flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                <div className="w-2 h-2 rounded-full bg-[#1E293B]"></div>
              </div>

              {/* Finish Setup Button */}
              <Button
                type="submit"
                form="aboutBusinessForm"
                className="h-10 px-5 rounded-lg bg-[#1E293B] text-white hover:bg-[#1E293B]/90"
              >
                Finish Setup
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutBusiness;