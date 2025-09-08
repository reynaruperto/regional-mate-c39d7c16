import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WHVWorkPreferences = () => {
  const navigate = useNavigate();

  const workTypes = [
    'Hospitality',
    'Agriculture',
    'Construction',
    'Tourism',
    'Retail',
    'Healthcare',
    'Education',
    'Office/Admin'
  ];

  const handleBack = () => {
    navigate(-1);
  };

  const handleNext = () => {
    navigate('/whv/about-you');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Work Preferences</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What type of work are you interested in?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {workTypes.map((workType) => (
              <div key={workType} className="flex items-center space-x-2">
                <Checkbox id={workType} />
                <Label htmlFor={workType}>{workType}</Label>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="mt-6">
          <Button onClick={handleNext} className="w-full">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WHVWorkPreferences;