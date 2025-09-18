import React, { useState, useEffect, useRef } from 'react';
import { Camera, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const EmployerEditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Employer fields
  const [givenName, setGivenName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [abn, setAbn] = useState('');
  const [tagline, setTagline] = useState('');
  const [businessTenure, setBusinessTenure] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [mobileNum, setMobileNum] = useState('');
  const [website, setWebsite] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [suburbCity, setSuburbCity] = useState('');
  const [state, setState] = useState('');
  const [postcode, setPostcode] = useState('');
  const [industryId, setIndustryId] = useState<number | null>(null);

  const [email, setEmail] = useState('');
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("No user logged in", error);
        navigate('/employer/sign-in');
        return;
      }
      setUserId(user.id);
      setEmail(user.email ?? '');

      const { data: employer, error: empError } = await supabase
        .from('employer')
        .select(`
          given_name, middle_name, family_name, company_name, abn, tagline,
          business_tenure, employee_count, mobile_num, website,
          profile_photo, address_line1, address_line2, suburb_city,
          state, postcode, industry_id
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (empError) {
        console.error("Error fetching employer profile:", empError);
        return;
      }

      if (!employer) {
        // Auto-create employer row
        await supabase.from('employer').insert({
          user_id: user.id,
          given_name: '',
          family_name: '',
          company_name: '',
          abn: '00000000000',
          business_tenure: 'new', // adjust to enum values
          employee_count: '1-10', // adjust to enum values
          mobile_num: '',
          address_line1: '',
          suburb_city: '',
          state: 'NSW',
          postcode: '0000',
          industry_id: 1,
        });
        return;
      }

      // Populate state
      setGivenName(employer.given_name || '');
      setMiddleName(employer.middle_name || '');
      setFamilyName(employer.family_name || '');
      setCompanyName(employer.company_name || '');
      setAbn(employer.abn || '');
      setTagline(employer.tagline || '');
      setBusinessTenure(employer.business_tenure || '');
      setEmployeeCount(employer.employee_count || '');
      setMobileNum(employer.mobile_num || '');
      setWebsite(employer.website || '');
      setAddressLine1(employer.address_line1 || '');
      setAddressLine2(employer.address_line2 || '');
      setSuburbCity(employer.suburb_city || '');
      setState(employer.state || '');
      setPostcode(employer.postcode || '');
      setIndustryId(employer.industry_id || null);

      if (employer.profile_photo) {
        setPhotoPath(employer.profile_photo);
        const { data: signed } = await supabase
          .storage
          .from('profile_photo')
          .createSignedUrl(employer.profile_photo, 3600);
        if (signed?.signedUrl) setProfilePhoto(signed.signedUrl);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Refresh signed URL
  useEffect(() => {
    if (!photoPath) return;
    const interval = setInterval(async () => {
      const { data: signed } = await supabase
        .storage
        .from('profile_photo')
        .createSignedUrl(photoPath, 3600);
      if (signed?.signedUrl) setProfilePhoto(signed.signedUrl);
    }, 55 * 60 * 1000);
    return () => clearInterval(interval);
  }, [photoPath]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !userId) return;
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid file", description: "Select an image", variant: "destructive" });
        return;
      }

      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase
        .storage
        .from('profile_photo')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('employer')
        .update({ profile_photo: filePath })
        .eq('user_id', userId);
      if (updateError) throw updateError;

      setPhotoPath(filePath);
      const { data: signed } = await supabase
        .storage
        .from('profile_photo')
        .createSignedUrl(filePath, 3600);
      if (signed?.signedUrl) setProfilePhoto(signed.signedUrl);

      toast({ title: "Photo updated", description: "Profile photo updated" });
    } catch (err) {
      console.error(err);
      toast({ title: "Upload failed", description: "Error uploading photo", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    if (!givenName.trim() || !familyName.trim() || !companyName.trim() || !abn.trim()) {
      toast({ title: "Missing fields", description: "Required fields are empty", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('employer').update({
      given_name: givenName,
      middle_name: middleName || null,
      family_name: familyName,
      company_name: companyName,
      abn,
      tagline,
      business_tenure: businessTenure,
      employee_count: employeeCount,
      mobile_num: mobileNum,
      website,
      address_line1: addressLine1,
      address_line2: addressLine2,
      suburb_city: suburbCity,
      state,
      postcode,
      industry_id: industryId,
    }).eq('user_id', userId);

    if (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Update failed", description: "Problem updating profile", variant: "destructive" });
      return;
    }

    toast({ title: "Profile Updated", description: "Employer profile updated successfully" });
    navigate('/employer/dashboard');
  };

  const handleCancel = () => navigate('/employer/dashboard');

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>
          
          <div className="w-full h-full flex flex-col relative bg-gray-100">
            {/* Header */}
            <div className="px-6 pt-16 pb-4 flex items-center justify-between">
              <button onClick={handleCancel} className="text-[#1E293B] font-medium underline">Cancel</button>
              <h1 className="text-lg font-semibold text-gray-900">Edit Employer Profile</h1>
              <button onClick={handleSave} className="flex items-center text-[#1E293B] font-medium underline">
                <Check size={16} className="mr-1" /> Save
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 overflow-y-auto space-y-4">
              {/* Profile Picture */}
              <div>
                <Label>Profile Picture</Label>
                <div className="relative w-24 h-24 mb-3">
                  <button onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#1E293B] hover:opacity-80 transition-opacity">
                    {profilePhoto ? <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" /> :
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">No Photo</div>}
                  </button>
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#1E293B] rounded-full flex items-center justify-center pointer-events-none">
                    <Camera size={16} className="text-white" />
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </div>

              {/* Form Fields */}
              <div>
                <Label>First Name *</Label>
                <Input value={givenName} onChange={e => setGivenName(e.target.value)} />
              </div>
              <div>
                <Label>Middle Name</Label>
                <Input value={middleName} onChange={e => setMiddleName(e.target.value)} />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={familyName} onChange={e => setFamilyName(e.target.value)} />
              </div>
              <div>
                <Label>Company Name *</Label>
                <Input value={companyName} onChange={e => setCompanyName(e.target.value)} />
              </div>
              <div>
                <Label>ABN *</Label>
                <Input value={abn} onChange={e => setAbn(e.target.value)} />
              </div>
              <div>
                <Label>Tagline</Label>
                <Input value={tagline} onChange={e => setTagline(e.target.value)} />
              </div>
              <div>
                <Label>Business Tenure *</Label>
                <Input value={businessTenure} onChange={e => setBusinessTenure(e.target.value)} />
              </div>
              <div>
                <Label>Employee Count *</Label>
                <Input value={employeeCount} onChange={e => setEmployeeCount(e.target.value)} />
              </div>
              <div>
                <Label>Mobile Number *</Label>
                <Input value={mobileNum} onChange={e => setMobileNum(e.target.value)} />
              </div>
              <div>
                <Label>Website</Label>
                <Input value={website} onChange={e => setWebsite(e.target.value)} />
              </div>
              <div>
                <Label>Address Line 1 *</Label>
                <Input value={addressLine1} onChange={e => setAddressLine1(e.target.value)} />
              </div>
              <div>
                <Label>Address Line 2</Label>
                <Input value={addressLine2} onChange={e => setAddressLine2(e.target.value)} />
              </div>
              <div>
                <Label>Suburb/City *</Label>
                <Input value={suburbCity} onChange={e => setSuburbCity(e.target.value)} />
              </div>
              <div>
                <Label>State *</Label>
                <Input value={state} onChange={e => setState(e.target.value)} />
              </div>
              <div>
                <Label>Postcode *</Label>
                <Input value={postcode} onChange={e => setPostcode(e.target.value)} />
              </div>
              <div>
                <Label>Industry ID *</Label>
                <Input type="number" value={industryId ?? ''} onChange={e => setIndustryId(parseInt(e.target.value))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={email} disabled className="bg-gray-100" />
              </div>
            </div>

            <div className="h-20" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerEditProfile;
