import React from 'react';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

const ContactFreelancer: React.FC = () => {
  const [, params] = useRoute<{ id: string }>('/contact-freelancer/:id');
  const [, setLocation] = useLocation();

  // This page is a placeholder as per requirement 7 in the spec
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Card className="shadow-md">
        <CardHeader className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-primary mb-4" />
          <CardTitle className="text-2xl font-bold">Contact Freelancer</CardTitle>
          <CardDescription className="text-lg">
            This feature will be added soon
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-700 mb-6">
            This feature will be added soon. In the meantime, contact the freelancer through their contact information in their profile or bio.
          </p>
          <p className="text-gray-700 font-medium">
            With all our appreciation,<br />
            WorkiT Team
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            variant="outline" 
            className="mr-2"
            onClick={() => window.history.back()}
          >
            Back to Service
          </Button>
          <Button onClick={() => setLocation('/')}>
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ContactFreelancer;
