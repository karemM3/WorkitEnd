import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVisitorProtection } from '@/hooks/use-visitor-protection';
import { VisitorNotification, VisitorNotificationDialog } from '@/components/shared/visitor-notification';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const VisitorDemoPage: React.FC = () => {
  const { checkAccess, dialogOpen, setDialogOpen, notificationInfo } = useVisitorProtection();
  const { isAuthenticated, isVisitor, continueAsVisitor, user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('inline');

  // Function to simulate a protected action
  const handleProtectedAction = (
    action: string,
    method: 'toast' | 'inline' | 'dialog' = 'inline'
  ) => {
    if (method === 'toast') {
      checkAccess({
        action: action,
        feature: 'demo feature',
        showToast: true,
        showDialog: false
      });
    } else if (method === 'dialog') {
      checkAccess({
        action: action,
        title: 'Action Requires Login',
        description: `You need to be logged in to ${action}.`,
        feature: 'demo feature',
        showDialog: true,
        showToast: false
      });
    } else {
      // Inline notification - just return the status
      const canProceed = checkAccess({
        action: action,
        feature: 'demo feature',
        showDialog: false,
        showToast: false
      });
      
      if (canProceed) {
        toast({
          title: 'Success!',
          description: `You have permission to ${action}`,
        });
      }
    }
  };

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-2">Visitor Mode Demo</h1>
      <p className="text-muted-foreground mb-8">
        This page demonstrates how visitor mode works throughout the WorkiT platform.
        Try different actions to see how the system responds to visitor access.
      </p>
      
      <div className="p-4 mb-6 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Current Status</h2>
        <p>You are currently: <span className="font-medium">{isAuthenticated ? 'Logged In' : (isVisitor ? 'Browsing as Visitor' : 'Not Logged In')}</span></p>
        {isAuthenticated && (
          <p className="mt-1">Logged in as: <span className="font-medium">{user?.username}</span></p>
        )}
        {!isAuthenticated && !isVisitor && (
          <Button className="mt-4" onClick={continueAsVisitor}>Continue as Visitor</Button>
        )}
      </div>
      
      <Tabs defaultValue="inline" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inline">Inline Notifications</TabsTrigger>
          <TabsTrigger value="toast">Toast Notifications</TabsTrigger>
          <TabsTrigger value="dialog">Dialog Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Inline Notification Demo</CardTitle>
              <CardDescription>
                Shows an embedded notification when visitors try to use protected features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <Button onClick={() => handleProtectedAction('create a job posting', 'inline')}>
                  Post a Job
                </Button>
                
                <Button onClick={() => handleProtectedAction('offer a service', 'inline')}>
                  Create Service Listing
                </Button>
                
                <Button onClick={() => handleProtectedAction('submit an application', 'inline')}>
                  Apply to a Job
                </Button>
                
                {!isAuthenticated && isVisitor && (
                  <div className="mt-4">
                    <VisitorNotification 
                      feature="inline notification" 
                      action="perform these actions"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="toast" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Toast Notification Demo</CardTitle>
              <CardDescription>
                Shows a toast notification when visitors try to use protected features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <Button onClick={() => handleProtectedAction('leave a review', 'toast')}>
                  Write a Review
                </Button>
                
                <Button onClick={() => handleProtectedAction('contact a freelancer', 'toast')}>
                  Contact Freelancer
                </Button>
                
                <Button onClick={() => handleProtectedAction('save to favorites', 'toast')}>
                  Save to Favorites
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dialog" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dialog Notification Demo</CardTitle>
              <CardDescription>
                Shows a dialog notification when visitors try to use protected features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <Button onClick={() => handleProtectedAction('book this service', 'dialog')}>
                  Book a Service
                </Button>
                
                <Button onClick={() => handleProtectedAction('make a payment', 'dialog')}>
                  Make Payment
                </Button>
                
                <Button onClick={() => handleProtectedAction('send a message', 'dialog')}>
                  Message User
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Visitor Notification Dialog */}
      <VisitorNotificationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={notificationInfo.title}
        description={notificationInfo.description}
        action={notificationInfo.action}
        feature={notificationInfo.feature}
      />
    </div>
  );
};

export default VisitorDemoPage;