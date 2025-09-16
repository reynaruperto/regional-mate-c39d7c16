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
            yearsInBusiness: employerData.business_tenure || undefined,
            employeeCount: employerData.employee_count || undefined,
            industryId: employerData.industry_id ? String(employerData.industry_id) : '',
            facilitiesAndExtras: employerFacilities?.map(f => f.facility_id) || [],
          });
        }
      } catch (err: any) {
        toast({ title: 'Error loading data', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, reset, toast]);

  const validateStep1 = async () => {
    const fields: (keyof FormData)[] = ['abn', 'businessPhone', 'addressLine1', 'suburbCity', 'state', 'postcode'];
    return trigger(fields);
  };

  const handleNext = async () => {
    const isValid = await validateStep1();
    if (isValid) setStep(2);
    else {
      toast({ title: 'Validation Error', description: 'Fill all required fields before proceeding.', variant: 'destructive' });
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
        business_tenure: data.yearsInBusiness,
        employee_count: data.employeeCount,
        industry_id: Number(data.industryId),
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId);

      await supabase.from('employer_facility').delete().eq('user_id', userId);
      if (data.facilitiesAndExtras.length > 0) {
        await supabase.from('employer_facility').insert(
          data.facilitiesAndExtras.map(facilityId => ({ user_id: userId, facility_id: facilityId }))
        );
      }

      toast({ title: 'Profile Updated', description: 'Business profile updated successfully.' });
      navigate('/employer/dashboard');
    } catch (err: any) {
      toast({ title: 'Error saving profile', description: err.message, variant: 'destructive' });
    }
  };

  const handleFacilityChange = (facilityId: number, checked: boolean) => {
    const currentFacilities = watchedFacilities;
    if (checked) {
      setValue('facilitiesAndExtras', [...currentFacilities, facilityId]);
    } else {
      setValue('facilitiesAndExtras', currentFacilities.filter(id => id !== facilityId));
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Header */}
          <div className="px-6 pt-16 pb-4 flex items-center justify-between">
            <button type="button" onClick={handleCancel} className="text-[#1E293B] underline">Cancel</button>
            <h1 className="text-lg font-semibold">{step === 1 ? 'Business Registration' : 'About Business'}</h1>
            {step === 2 ? (
              <button type="button" onClick={handleSubmit(onSubmit)} className="flex items-center text-[#1E293B] underline">
                <Check size={16} className="mr-1" /> Save
              </button>
            ) : (
              <div className="w-10" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 px-6 overflow-y-auto pb-24">
            <form id="businessProfileForm" className="space-y-6">
              {step === 1 && (
                <>
                  <div>
                    <Label>ABN *</Label>
                    <Input {...register('abn')} disabled className="bg-gray-100" />
                    {errors.abn && <p className="text-red-500 text-sm">{errors.abn.message}</p>}
                  </div>
                  <div>
                    <Label>Business Website</Label>
                    <Input type="url" {...register('website')} />
                  </div>
                  <div>
                    <Label>Business Phone *</Label>
                    <Input type="tel" {...register('businessPhone')} />
                  </div>
                  <div>
                    <Label>Address Line 1 *</Label>
                    <Input {...register('addressLine1')} />
                  </div>
                  <div>
                    <Label>Address Line 2</Label>
                    <Input {...register('addressLine2')} />
                  </div>
                  <div>
                    <Label>Suburb / City *</Label>
                    <Input {...register('suburbCity')} />
                  </div>
                  <div>
                    <Label>State *</Label>
                    <Controller
                      name="state"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                          <SelectContent>
                            {AUSTRALIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label>Postcode *</Label>
                    <Input maxLength={4} {...register('postcode')} />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <Label>Business Tagline *</Label>
                    <Input {...register('businessTagline')} />
                  </div>
                  <div>
                    <Label>Years in Business *</Label>
                    <Controller
                      name="yearsInBusiness"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select years" /></SelectTrigger>
                          <SelectContent>
                            {YEARS_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label>Employees *</Label>
                    <Controller
                      name="employeeCount"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select employees" /></SelectTrigger>
                          <SelectContent>
                            {EMPLOYEE_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label>Industry *</Label>
                    <Controller
                      name="industryId"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                          <SelectContent>
                            {industries.map(ind => <SelectItem key={ind.industry_id} value={String(ind.industry_id)}>{ind.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label>Facilities & Extras *</Label>
                    {facilities.map(f => (
                      <label key={f.facility_id} className="flex items-center space-x-2 mt-2">
                        <input
                          type="checkbox"
                          checked={watchedFacilities.includes(f.facility_id)}
                          onChange={e => handleFacilityChange(f.facility_id, e.target.checked)}
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
          <div className="px-6 py-4 border-t bg-white flex items-center justify-between relative">
            {step > 1 && (
              <Button type="button" onClick={handleBack} variant="outline">Back</Button>
            )}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex space-x-2">
              {[1, 2].map(n => (
                <div key={n} className={`w-2 h-2 rounded-full ${step === n ? 'bg-[#1E293B]' : 'bg-gray-300'}`} />
              ))}
            </div>
            {step < 2 ? (
              <Button type="button" onClick={handleNext} className="ml-auto bg-[#1E293B] text-white">Next</Button>
            ) : (
              <Button type="button" onClick={handleSubmit(onSubmit)} className="ml-auto bg-[#1E293B] text-white">Finish Setup</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditBusinessProfile;
