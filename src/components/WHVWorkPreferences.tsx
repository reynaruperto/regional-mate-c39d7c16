import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const WHVWorkPreferences = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Work Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Select your work preferences to help employers find you.
            </p>
            
            <div className="flex justify-between pt-6">
              <Button variant="outline">Back</Button>
              <Button>Continue</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WHVWorkPreferences;