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

// Enum mapping functions  
const mapDbBusinessTenureToForm = (dbValue: any): string => {
  const mapping: Record<string, string> = {
    "Less than 1 year": "<1",
    "1-2 years": "1",
    "3-5 years": "3", 
    "5-10 years": "6-10",
    "10+ years": "20+"
  };
  return mapping[dbValue] || "1";
};

const mapFormBusinessTenureToDb = (formValue: any): "Less than 1 year" | "1-2 years" | "3-5 years" | "5-10 years" | "10+ years" => {
  const mapping: Record<string, "Less than 1 year" | "1-2 years" | "3-5 years" | "5-10 years" | "10+ years"> = {
    "<1": "Less than 1 year",
    "1": "1-2 years", 
    "2": "1-2 years",
    "3": "3-5 years",
    "4": "3-5 years",
    "5": "3-5 years",
    "6-10": "5-10 years",
    "11-15": "10+ years",
    "16-20": "10+ years",
    "20+": "10+ years"
  };
  return mapping[formValue] || "1-2 years";
};

const mapDbEmployeeCountToForm = (dbValue: any): string => {
  const mapping: Record<string, string> = {
    "1-10": "1",
    "11-50": "11-20",
    "51-200": "21-50", 
    "201-500": "51-100",
    "501-1000": "100+",
    "1000+": "100+"
  };
  return mapping[dbValue] || "1";
};

const mapFormEmployeeCountToDb = (formValue: any): "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+" => {
  const mapping: Record<string, "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+"> = {
    "1": "1-10",
    "2-5": "1-10",
    "6-10": "1-10",
    "11-20": "11-50",
    "21-50": "51-200",
    "51-100": "201-500", 
    "100+": "1000+"
  };
  return mapping[formValue] || "1-10";
};

// Australian States
const AUSTRALIAN_STATES = [
  'Australian Capital Territory',
  'New South Wales',
  'Northern Territory',
  'Queensland',
  'South Australia',
  'Tasmania',
  'Victoria',
  'Western Australia',
] as const;

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

// Zod Schema
const formSchema = z.object({
  abn: z.string().length(11, 'ABN must be 11 digits').regex(/^\d+$/, 'ABN must be numeric'),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  businessPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  addressLine1: z.string().min(1, 'Address Line 1 is required'),
  addressLine2: z.string().optional(),
  suburbCity: z.string().min(1, 'Suburb/City is required'),
  state: z.enum(AUSTRALIAN_STATES),
  postcode: z.string().length(4, 'Postcode must be 4 digits').regex(/^\d+$/, 'Postcode must be numeric'),
  businessTagline: z.string().min(10, 'Tagline must be at least 10 characters').max(200, 'Tagline must be less than 200 characters'),
  yearsInBusiness: z.enum(YEARS_OPTIONS),
  employeeCount: z.enum(EMPLOYEE_OPTIONS),
  industryId: z.string().min(1, 'Industry is required'),
  facilitiesAndExtras: z.array(z.number()).min(1, 'Select at least one facility'),
});

type FormData = z.infer<typeof formSchema>;

const EditBusinessProfile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
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
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { facilitiesAndExtras: [] },
    mode: 'onChange',
  });

  const watchedFacilities = watch('facilitiesAndExtras') || [];

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          navigate('/employer/sign-in');
          return;
        }
        setUserId(user.id);

        const { data: industriesData } = await supabase.from('industry').select('industry_id, name').order('name');
        setIndustries(industriesData || []);

        const { data: facilitiesData } = await supabase.from('facility').select('facility_id, name').order('name');
        setFacilities(facilitiesData || []);

        const { data: employerData } = await supabase.from('employer').select('*').eq('user_id', user.id).maybeSingle();
        const { data: employerFacilities } = await supabase.from('employer_facility').select('facility_id').eq('user_id', user.id);

        if (employerData) {
          reset({
            abn: employerData.abn || '',
            website: employerData.website || '',
            businessPhone: employerData.mobile_num || '',
            addressLine1: employerData.address_line1 || '',
            addressLine2: employerData.address_line2 || '',
            suburbCity: employerData.suburb_city || '',
            state: employerData.state || undefined,
            postcode: employerData.postcode || '',
            businessTagline: employerData.tagline || '',
            yearsInBusiness: mapDbBusinessTenureToForm(employerData.business_tenure) as "<1" | "1" | "2" | "3" | "4" | "5" | "6-10" | "11-15" | "16-20" | "20+",
            employeeCount: mapDbEmployeeCountToForm(employerData.employee_count) as "1" | "6-10" | "2-5" | "11-20" | "21-50" | "51-100" | "100+",
            industryId: employerData.industry_id ? String(employerData.industry_id) : '',
            facilitiesAndExtras: employerFacilities?.map(f => f.facility_id) || [],
          });
        }
      } catch (error: any) {
        toast({ title: 'Error loading data', description: error.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [navigate, reset, toast]);

  const validateCurrentStep = async () => {
    if (step === 1) {
      const step1Fields: (keyof FormData)[] = ['abn', 'businessPhone', 'addressLine1', 'suburbCity', 'state', 'postcode'];
      return await trigger(step1Fields);
    }
    return true;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) setStep(2);
    else {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly before proceeding.',
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => setStep(1);
  const handleCancel = () => navigate('/employer/dashboard');

  const onSubmit = async (data: FormData) => {
    if (!userId) return;

    try {
      await supabase.from('employer').update({
        abn: data.abn,
        website: data.website || null,
        mobile_num: data.businessPhone,
        address_line1: data.addressLine1,
        address_line2: data.addressLine2 || null,
        suburb_city: data.suburbCity,
        state: data.state,
        postcode: data.postcode,
        tagline: data.businessTagline,
        business_tenure: mapFormBusinessTenureToDb(data.yearsInBusiness),
        employee_count: mapFormEmployeeCountToDb(data.employeeCount),
        industry_id: Number(data.industryId),
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId);

      await supabase.from('employer_facility').delete().eq('user_id', userId);
      if (data.facilitiesAndExtras.length > 0) {
        await supabase.from('employer_facility').insert(
          data.facilitiesAndExtras.map(facilityId => ({ user_id: userId, facility_id: facilityId }))
        );
      }

      toast({ title: 'Profile Updated', description: 'Your business profile has been successfully updated.' });
      navigate('/employer/dashboard');
    } catch (error: any) {
      toast({ title: 'Error saving profile', description: error.message, variant: 'destructive' });
    }
  };

  const handleFacilityChange = (facilityId: number, checked: boolean) => {
    const currentFacilities = watchedFacilities;
    setValue('facilitiesAndExtras', checked ? [...currentFacilities, facilityId] : currentFacilities.filter(id => id !== facilityId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
        <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
          <div className="w-full h-full bg-white rounded-[48px] flex items-center justify-center">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Header */}
          <div className="px-6 pt-16 pb-4 flex items-center justify-between">
            <button onClick={handleCancel} className="text-[#1E293B] font-medium underline">Cancel</button>
            <h1 className="text-lg font-semibold">{step === 1 ? 'Business Registration' : 'About Business'}</h1>
            {step === 2 ? (
              <button type="button" onClick={handleSubmit(onSubmit)} className="flex items-center text-[#1E293B] font-medium underline">
                <Check size={16} className="mr-1" /> Save
              </button>
            ) : (
              <div className="w-12"></div>
            )}
          </div>

          {/* Form */}
          <div className="flex-1 px-6 overflow-y-auto pb-20">
            <form id="businessProfileForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <>
                  {/* ABN */}
                  <div>
                    <Label>ABN *</Label>
                    <Input {...register('abn')} disabled className="h-12 rounded-xl bg-gray-100" />
                    {errors.abn && <p className="text-red-500 text-sm">{errors.abn.message}</p>}
                  </div>
                  {/* Website */}
                  <div>
                    <Label>Website</Label>
                    <Input {...register('website')} className="h-12 rounded-xl bg-white" />
                  </div>
                  {/* Phone */}
                  <div>
                    <Label>Business Phone *</Label>
                    <Input {...register('businessPhone')} className="h-12 rounded-xl bg-white" />
                  </div>
                  {/* Address 1 */}
                  <div>
                    <Label>Address Line 1 *</Label>
                    <Input {...register('addressLine1')} className="h-12 rounded-xl bg-white" />
                  </div>
                  {/* Address 2 */}
                  <div>
                    <Label>Address Line 2</Label>
                    <Input {...register('addressLine2')} className="h-12 rounded-xl bg-white" />
                  </div>
                  {/* Suburb */}
                  <div>
                    <Label>Suburb / City *</Label>
                    <Input {...register('suburbCity')} className="h-12 rounded-xl bg-white" />
                  </div>
                  {/* State */}
                  <div>
                    <Label>State *</Label>
                    <Controller
                      name="state"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="h-12 rounded-xl bg-white">
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
                  </div>
                  {/* Postcode */}
                  <div>
                    <Label>Postcode *</Label>
                    <Input {...register('postcode')} className="h-12 rounded-xl bg-white" />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  {/* Tagline */}
                  <div>
                    <Label>Business Tagline *</Label>
                    <Input {...register('businessTagline')} className="h-12 rounded-xl bg-white" />
                  </div>
                  {/* Years */}
                  <div>
                    <Label>Years in Business *</Label>
                    <Controller
                      name="yearsInBusiness"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="h-12 rounded-xl bg-white">
                            <SelectValue placeholder="Select years" />
                          </SelectTrigger>
                          <SelectContent>
                            {YEARS_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  {/* Employees */}
                  <div>
                    <Label>Employees *</Label>
                    <Controller
                      name="employeeCount"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="h-12 rounded-xl bg-white">
                            <SelectValue placeholder="Select employees" />
                          </SelectTrigger>
                          <SelectContent>
                            {EMPLOYEE_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  {/* Industry */}
                  <div>
                    <Label>Industry *</Label>
                    <Controller
                      name="industryId"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="h-12 rounded-xl bg-white">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {industries.map((i) => (
                              <SelectItem key={i.industry_id} value={String(i.industry_id)}>
                                {i.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  {/* Facilities */}
                  <div>
                    <Label>Facilities & Extras *</Label>
                    {facilities.map((f) => (
                      <label key={f.facility_id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={watchedFacilities.includes(f.facility_id)}
                          onChange={(e) => handleFacilityChange(f.facility_id, e.target.checked)}
                        />
                        <span>{f.name}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-white flex items-center relative">
            {step > 1 && (
              <Button type="button" onClick={handleBack} variant="outline" className="h-10 px-5 text-sm">
                Back
              </Button>
            )}

            {/* Progress lines */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex space-x-2 w-24">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className={`h-1 flex-1 rounded-full ${step >= n ? 'bg-[#1E293B]' : 'bg-gray-300'}`}
                />
              ))}
            </div>

            {step < 2 ? (
              <Button type="button" onClick={handleNext} className="ml-auto h-10 px-5 bg-[#1E293B] text-white text-sm">
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit(onSubmit)} className="ml-auto h-10 px-5 bg-[#1E293B] text-white text-sm">
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
