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

// Zod Schema for Step 1
const businessRegistrationSchema = z.object({
  abn: z.string().length(11, 'ABN must be 11 digits').regex(/^\d+$/, 'ABN must be numeric'),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  businessPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  addressLine1: z.string().min(1, 'Address Line 1 is required'),
  addressLine2: z.string().optional(),
  suburbCity: z.string().min(1, 'Suburb/City is required'),
  state: z.enum(AUSTRALIAN_STATES).refine(val => val !== undefined, { message: 'State is required' }),
  postcode: z.string().length(4, 'Postcode must be 4 digits').regex(/^\d+$/, 'Postcode must be numeric'),
});

type BusinessRegistrationData = z.infer<typeof businessRegistrationSchema>;

const BusinessRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BusinessRegistrationData>({
    resolver: zodResolver(businessRegistrationSchema),
    mode: 'onChange',
  });

  // Load existing data
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('No user logged in', userError);
          navigate('/employer/sign-in');
          return;
        }
        setUserId(user.id);

        // Load employer data
        const { data: employerData, error: employerError } = await supabase
          .from('employer')
          .select('abn, website, mobile_num, address_line1, address_line2, suburb_city, state, postcode')
          .eq('user_id', user.id)
          .maybeSingle();

        if (employerError) throw employerError;

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

  const onSubmit = async (data: BusinessRegistrationData) => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('employer')
        .update({
          abn: data.abn,
          website: data.website || null,
          mobile_num: data.businessPhone,
          address_line1: data.addressLine1,
          address_line2: data.addressLine2 || null,
          suburb_city: data.suburbCity,
          state: data.state,
          postcode: data.postcode,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Business Registration Saved',
        description: 'Your business registration details have been saved successfully.',
      });

      // Navigate to next step
      navigate('/employer/about-business');
    } catch (error: any) {
      console.error('Error saving business registration:', error);
      toast({
        title: 'Error saving registration',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleNext = async () => {
    // Just navigate without saving
    navigate('/employer/about-business');
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
                  Business Registration
                </h1>
                <button
                  type="submit"
                  form="businessRegistrationForm"
                  className="flex items-center text-[#1E293B] font-medium underline"
                >
                  <Check size={16} className="mr-1" />
                  Save
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 overflow-y-auto pb-24">
              <form id="businessRegistrationForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* ABN */}
                <div>
                  <Label htmlFor="abn" className="text-gray-600 mb-2 block">
                    Australian Business Number (ABN) *
                  </Label>
                  <Input
                    id="abn"
                    {...register('abn')}
                    disabled
                    className="h-12 rounded-xl border-gray-200 bg-gray-100 cursor-not-allowed"
                  />
                  {errors.abn && (
                    <p className="text-red-500 text-sm mt-1">{errors.abn.message}</p>
                  )}
                </div>

                {/* Website */}
                <div>
                  <Label htmlFor="website" className="text-gray-600 mb-2 block">
                    Business Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    {...register('website')}
                    className="h-12 rounded-xl border-gray-200 bg-white"
                  />
                  {errors.website && (
                    <p className="text-red-500 text-sm mt-1">{errors.website.message}</p>
                  )}
                </div>

                {/* Business Phone */}
                <div>
                  <Label htmlFor="businessPhone" className="text-gray-600 mb-2 block">
                    Business Phone Number *
                  </Label>
                  <Input
                    id="businessPhone"
                    type="tel"
                    placeholder="0412345678"
                    {...register('businessPhone')}
                    className="h-12 rounded-xl border-gray-200 bg-white"
                  />
                  {errors.businessPhone && (
                    <p className="text-red-500 text-sm mt-1">{errors.businessPhone.message}</p>
                  )}
                </div>

                {/* Address Line 1 */}
                <div>
                  <Label htmlFor="addressLine1" className="text-gray-600 mb-2 block">
                    Address Line 1 *
                  </Label>
                  <Input
                    id="addressLine1"
                    placeholder="123 Main Street"
                    {...register('addressLine1')}
                    className="h-12 rounded-xl border-gray-200 bg-white"
                  />
                  {errors.addressLine1 && (
                    <p className="text-red-500 text-sm mt-1">{errors.addressLine1.message}</p>
                  )}
                </div>

                {/* Address Line 2 */}
                <div>
                  <Label htmlFor="addressLine2" className="text-gray-600 mb-2 block">
                    Address Line 2
                  </Label>
                  <Input
                    id="addressLine2"
                    placeholder="Unit 4"
                    {...register('addressLine2')}
                    className="h-12 rounded-xl border-gray-200 bg-white"
                  />
                </div>

                {/* Suburb/City */}
                <div>
                  <Label htmlFor="suburbCity" className="text-gray-600 mb-2 block">
                    Suburb / City *
                  </Label>
                  <Input
                    id="suburbCity"
                    placeholder="Sydney"
                    {...register('suburbCity')}
                    className="h-12 rounded-xl border-gray-200 bg-white"
                  />
                  {errors.suburbCity && (
                    <p className="text-red-500 text-sm mt-1">{errors.suburbCity.message}</p>
                  )}
                </div>

                {/* State */}
                <div>
                  <Label className="text-gray-600 mb-2 block">State *</Label>
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white">
                          <SelectValue placeholder="Select a state" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                          {AUSTRALIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state} className="hover:bg-gray-100">
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.state && (
                    <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
                  )}
                </div>

                {/* Postcode */}
                <div>
                  <Label htmlFor="postcode" className="text-gray-600 mb-2 block">
                    Postcode *
                  </Label>
                  <Input
                    id="postcode"
                    placeholder="2000"
                    maxLength={4}
                    {...register('postcode')}
                    className="h-12 rounded-xl border-gray-200 bg-white"
                    onChange={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, '');
                      register('postcode').onChange(e);
                    }}
                  />
                  {errors.postcode && (
                    <p className="text-red-500 text-sm mt-1">{errors.postcode.message}</p>
                  )}
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-white flex items-center justify-between relative">
              {/* Step Indicators */}
              <div className="absolute left-1/2 transform -translate-x-1/2 flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#1E293B]"></div>
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              </div>

              {/* Next Button */}
              <Button
                type="button"
                onClick={handleNext}
                className="h-10 px-5 rounded-lg bg-[#1E293B] text-white hover:bg-[#1E293B]/90 ml-auto"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessRegistration;