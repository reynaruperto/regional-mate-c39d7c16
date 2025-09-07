import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface IndustryRoleData {
  industry_id: string;
  industry_name: string;
  industry_role_id: string;
  role_name: string;
  state: string;
  area: string;
}

interface Industry {
  industry_id: string;
  industry_name: string;
  industry_roles: {
    industry_role_id: string;
    role_name: string;
  }[];
}

const WHVWorkPreferences = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedIndustryIds, setSelectedIndustryIds] = useState<string[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get user data from navigation state
  const navigationState = location.state as { sub_class?: string; stage?: string } | null;
  const { sub_class, stage } = navigationState || {};

  useEffect(() => {
    if (!sub_class || !stage) {
      toast({
        title: "Missing visa information",
        description: "Please go back and select your visa stage.",
        variant: "destructive"
      });
      navigate('/whv/about-you');
      return;
    }

    fetchData();
  }, [sub_class, stage]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Query the view with proper typing bypass
      const { data: rawData, error } = await (supabase as any)
        .from('v_visa_stage_industries_roles')
        .select('industry_id, industry_name, industry_role_id, role_name, state, area')
        .eq('sub_class', sub_class)
        .eq('stage', stage);

      if (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error loading data",
          description: "Failed to load work preferences data.",
          variant: "destructive"
        });
        return;
      }

      const data = rawData as IndustryRoleData[];

      // Group by industry
      const industriesMap = new Map<string, Industry>();
      const areasSet = new Set<string>();

      data.forEach(item => {
        // Add to areas set
        if (item.area) {
          areasSet.add(item.area);
        }

        // Group by industry
        if (!industriesMap.has(item.industry_id)) {
          industriesMap.set(item.industry_id, {
            industry_id: item.industry_id,
            industry_name: item.industry_name,
            industry_roles: []
          });
        }

        const industry = industriesMap.get(item.industry_id)!;
        
        // Add role if not already exists
        const existingRole = industry.industry_roles.find(r => r.industry_role_id === item.industry_role_id);
        if (!existingRole) {
          industry.industry_roles.push({
            industry_role_id: item.industry_role_id,
            role_name: item.role_name
          });
        }
      });

      setIndustries(Array.from(industriesMap.values()));
      setAreas(Array.from(areasSet).sort());

    } catch (error) {
      console.error('Error in fetchData:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleIndustryToggle = (industryId: string) => {
    setSelectedIndustryIds(prev => {
      const newIds = prev.includes(industryId) 
        ? prev.filter(id => id !== industryId)
        : [...prev, industryId];
      
      // Clear role selections for deselected industries
      if (!newIds.includes(industryId)) {
        const industry = industries.find(i => i.industry_id === industryId);
        if (industry) {
          const roleIdsToRemove = industry.industry_roles.map(r => r.industry_role_id);
          setSelectedRoleIds(prev => prev.filter(id => !roleIdsToRemove.includes(id)));
        }
      }
      
      return newIds;
    });
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleAreaToggle = (area: string) => {
    setSelectedAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const handleSubmit = async () => {
    if (!selectedState || selectedAreas.length === 0 || selectedIndustryIds.length === 0 || selectedRoleIds.length === 0) {
      toast({
        title: "Missing selections",
        description: "Please make all required selections before continuing.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication error",
          description: "Please sign in to continue.",
          variant: "destructive"
        });
        navigate('/whv/login');
        return;
      }

      // Save preferences for each combination
      const preferences = [];
      for (const industryId of selectedIndustryIds) {
        for (const roleId of selectedRoleIds) {
          for (const area of selectedAreas) {
            preferences.push({
              user_id: user.id,
              state: selectedState,
              area: area,
              industry_id: industryId,
              industry_role_id: roleId
            });
          }
        }
      }

      const { error } = await supabase
        .from('maker_preference')
        .insert(preferences);

      if (error) {
        console.error('Error saving preferences:', error);
        toast({
          title: "Error saving preferences",
          description: "Failed to save your work preferences.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Preferences saved!",
        description: "Your work preferences have been saved successfully.",
      });

      navigate('/whv/photo-upload');

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading work preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-black rounded-[2.5rem] p-2 shadow-2xl max-w-sm w-full">
        <div className="bg-white rounded-[2rem] h-[600px] overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <button 
                onClick={() => navigate('/whv/about-you')}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <span className="text-sm text-gray-500">3/5</span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Work Preferences
                  </h1>
                  <p className="text-gray-600 text-sm">
                    Select your preferred work locations and industries
                  </p>
                </div>

                {/* State Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred State *
                  </label>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NSW">New South Wales</SelectItem>
                      <SelectItem value="VIC">Victoria</SelectItem>
                      <SelectItem value="QLD">Queensland</SelectItem>
                      <SelectItem value="WA">Western Australia</SelectItem>
                      <SelectItem value="SA">South Australia</SelectItem>
                      <SelectItem value="TAS">Tasmania</SelectItem>
                      <SelectItem value="ACT">Australian Capital Territory</SelectItem>
                      <SelectItem value="NT">Northern Territory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Areas */}
                {areas.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Areas *
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {areas.map((area) => (
                        <div key={area} className="flex items-center space-x-2">
                          <Checkbox
                            id={`area-${area}`}
                            checked={selectedAreas.includes(area)}
                            onCheckedChange={() => handleAreaToggle(area)}
                          />
                          <label
                            htmlFor={`area-${area}`}
                            className="text-sm text-gray-700 cursor-pointer"
                          >
                            {area}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Industries */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Industries *
                  </label>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {industries.map((industry) => (
                      <div key={industry.industry_id} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`industry-${industry.industry_id}`}
                            checked={selectedIndustryIds.includes(industry.industry_id)}
                            onCheckedChange={() => handleIndustryToggle(industry.industry_id)}
                          />
                          <label
                            htmlFor={`industry-${industry.industry_id}`}
                            className="text-sm font-medium text-gray-700 cursor-pointer"
                          >
                            {industry.industry_name}
                          </label>
                        </div>
                        
                        {/* Roles for selected industry */}
                        {selectedIndustryIds.includes(industry.industry_id) && (
                          <div className="ml-6 space-y-1">
                            {industry.industry_roles.map((role) => (
                              <div key={role.industry_role_id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`role-${role.industry_role_id}`}
                                  checked={selectedRoleIds.includes(role.industry_role_id)}
                                  onCheckedChange={() => handleRoleToggle(role.industry_role_id)}
                                />
                                <label
                                  htmlFor={`role-${role.industry_role_id}`}
                                  className="text-xs text-gray-600 cursor-pointer"
                                >
                                  {role.role_name}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t">
              <Button 
                onClick={handleSubmit}
                className="w-full"
                disabled={!selectedState || selectedAreas.length === 0 || selectedIndustryIds.length === 0 || selectedRoleIds.length === 0}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVWorkPreferences;