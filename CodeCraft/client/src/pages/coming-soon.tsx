import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, ChevronLeft, Clock } from 'lucide-react';

interface FeatureInfo {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const featureMap: Record<string, FeatureInfo> = {
  'contact-applicant': {
    title: 'Contact Applicant',
    description: 'Direct messaging with job applicants will be available soon. This feature will allow you to communicate with potential freelancers before making a hiring decision.',
    icon: <Calendar className="h-12 w-12 text-primary mb-4" />
  },
  'contact-employer': {
    title: 'Contact Employer',
    description: 'Direct messaging with employers will be available soon. This feature will allow you to communicate with employers about job details and application status.',
    icon: <Calendar className="h-12 w-12 text-primary mb-4" />
  },
  'default': {
    title: 'Feature Coming Soon',
    description: 'This feature is currently under development and will be available in a future update. Thank you for your patience!',
    icon: <Clock className="h-12 w-12 text-primary mb-4" />
  }
};

const ComingSoon: React.FC = () => {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const feature = searchParams.get('feature') || 'default';
  
  const featureInfo = featureMap[feature] || featureMap.default;
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Card className="overflow-hidden border-none shadow-lg">
        <CardContent className="flex flex-col items-center text-center p-10">
          {featureInfo.icon}
          
          <h1 className="text-3xl font-bold mb-4">{featureInfo.title}</h1>
          
          <div className="max-w-lg mx-auto mb-8">
            <p className="text-gray-600 mb-4">
              {featureInfo.description}
            </p>
            <p className="text-gray-600">
              We're working hard to bring you the best experience possible. Check back soon!
            </p>
          </div>
          
          <div className="flex justify-center mt-4">
            <Button 
              variant="outline" 
              className="flex items-center"
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComingSoon;