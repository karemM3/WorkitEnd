import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisitorNotificationDialog } from '@/components/shared/visitor-notification';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { JobWithUser } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { FileUpload } from '@/components/ui/file-upload';
import { formatDistanceToNow } from 'date-fns';

// Define application form schema
const applicationSchema = z.object({
  description: z.string().min(20, 'Description must be at least 20 characters'),
  resumeFile: z.any().optional(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

const JobDetail: React.FC = () => {
  const [, params] = useRoute<{ id: string }>('/jobs/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isVisitor } = useAuth();
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [visitorNotifyOpen, setVisitorNotifyOpen] = useState(false);
  const [visitorNotifyMessage, setVisitorNotifyMessage] = useState({
    title: '',
    description: ''
  });

  // Don't attempt to convert MongoDB ObjectID to number
  const jobId = params?.id || '';

  // Fetch job details
  const {
    data: job,
    isLoading,
    error,
  } = useQuery<JobWithUser>({
    queryKey: [`/api/jobs/${jobId}`],
    enabled: !!jobId,
  });

  // Application form
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      description: '',
    },
  });

  // Application mutation
  const applicationMutation = useMutation({
    mutationFn: async (data: ApplicationFormValues) => {
      const formData = new FormData();
      formData.append('description', data.description);
      formData.append('coverLetter', data.description);
      
      if (job && job.budget) {
        formData.append('price', job.budget.toString());
      }
      
      if (data.resumeFile) {
        formData.append('resumeFile', data.resumeFile);
      }

      // Use apiRequest which already handles credentials and error checking
      return await apiRequest('POST', `/api/jobs/${jobId}/applications`, formData, true);
    },
    onSuccess: (data) => {
      // User who submitted the application - their stats/applications need to update
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/applications`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/stats`] });
      }
      
      // Job owner's stats need to update for applications received
      if (job?.userId) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${job.userId}/stats`] });
      }
      
      // Invalidate job applications list
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/applications`] });
      
      // Also invalidate general user data
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      toast({
        title: 'Application Submitted',
        description: 'Your application has been submitted successfully.',
      });
      setApplicationDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      // Check for duplicate application errors
      if (error.message && error.message.includes('duplicate key error') && error.message.includes('userId_1_jobId_1')) {
        toast({
          title: 'Already Applied',
          description: 'You have already applied to this job. You can view your application status in your profile.',
          variant: 'default',
        });
        // Close the dialog since we know what the issue is
        setApplicationDialogOpen(false);
      } 
      // Check for server-specific error code
      else if (error.data && error.data.code === 'DUPLICATE_APPLICATION') {
        toast({
          title: 'Already Applied',
          description: 'You have already applied to this job. You can view your application status in your profile.',
          variant: 'default',
        });
        // Close the dialog since we know what the issue is
        setApplicationDialogOpen(false);
      } 
      // Default error handling
      else {
        toast({
          title: 'Application Error',
          description: error.message || 'An error occurred while submitting your application.',
          variant: 'destructive',
        });
      }
    },
  });

  const onApplicationSubmit = (data: ApplicationFormValues) => {
    applicationMutation.mutate(data);
  };

  // Handle apply button click
  const handleApply = () => {
    if (isVisitor) {
      setVisitorNotifyMessage({
        title: 'Job Applications Unavailable in Visitor Mode',
        description: 'You need to sign up or log in to apply for jobs on WorkiT.'
      });
      setVisitorNotifyOpen(true);
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to apply for this job.',
        variant: 'destructive',
      });
      setLocation('/auth/login');
      return;
    }

    if (user?.id === job?.userId) {
      toast({
        title: 'Cannot Apply',
        description: 'You cannot apply to your own job posting.',
        variant: 'destructive',
      });
      return;
    }

    setApplicationDialogOpen(true);
  };

  // Handle view profile button click
  const handleViewProfile = () => {
    if (job?.user?.id) {
      // Redirect to the profile of the job owner
      setLocation(`/users/${job.user.id}/profile`);
    }
  };

  // Format the createdAt date to "X days/hours ago"
  const formatCreatedDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Generate job type badge color
  const getBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'full-time':
        return 'bg-green-100 text-green-800';
      case 'part-time':
        return 'bg-blue-100 text-blue-800';
      case 'contract':
        return 'bg-purple-100 text-purple-800';
      case 'freelance':
        return 'bg-yellow-100 text-yellow-800';
      case 'internship':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-center">Loading job details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-center text-red-500">Error loading job details. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Job Header */}
            <div className="p-6 border-b">
              <div className="flex items-center mb-4">
                <Avatar className="h-12 w-12 mr-4">
                  <AvatarImage src={job.user?.profilePicture} />
                  <AvatarFallback>
                    {job.user?.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-gray-500">{job.user?.username}</span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="text-sm text-gray-500">{job.location || 'Remote'}</span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="text-sm text-gray-500">Posted {formatCreatedDate(job.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="outline" className={`${getBadgeVariant(job.jobType)} font-medium`}>
                  {job.jobType}
                </Badge>
                <Badge variant="outline" className="bg-primary-100 text-primary-800">
                  {job.category}
                </Badge>
                <Badge variant="outline" className="bg-primary-100 text-primary-800">
                  {job.budget} DNT
                </Badge>
              </div>
            </div>

            {/* Job Image (if available) */}
            {job.image && (
              <div className="w-full h-80 bg-gray-200">
                <img
                  src={job.image}
                  alt={job.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Job Description */}
            <div className="p-6">
              <div className="prose max-w-none">
                <h2 className="text-xl font-semibold mb-2">Job Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
              </div>

              {/* Job Details */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Job Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium">{job.category}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{job.location || 'Remote'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Job Type</p>
                    <p className="font-medium">{job.jobType}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Budget</p>
                    <p className="font-medium">{job.budget} DNT</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          {/* Job Card */}
          <Card className="sticky top-8">
            <CardContent className="p-6">
              <div className="mb-6">
                <p className="text-3xl font-bold">{job.budget} DNT</p>
              </div>

              <div className="space-y-4">
                <Button className="w-full" onClick={handleApply}>
                  Apply Now
                </Button>
              </div>

              {/* Employer Info */}
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-medium mb-4">About the Employer</h3>
                <div className="flex items-center mb-4">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarImage src={job.user?.profilePicture} />
                    <AvatarFallback>
                      {job.user?.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{job.user?.username}</p>
                    <p className="text-sm text-gray-500">
                      {job.user?.role.charAt(0).toUpperCase() + job.user?.role.slice(1)}
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={handleViewProfile}>
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Application Dialog */}
      <Dialog open={applicationDialogOpen} onOpenChange={setApplicationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Job: {job.title}</DialogTitle>
            <DialogDescription>
              Submit your application for this job opportunity with {job.user?.username}.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onApplicationSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Letter <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your relevant experience and why you're interested in this job..."
                        {...field}
                        rows={5}
                      />
                    </FormControl>
                    <FormDescription>
                      Highlight your relevant skills and experience (minimum 20 characters).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resumeFile"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Resume/CV</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <FileUpload
                          id="resume-upload"
                          label="Upload PDF, DOC, or DOCX"
                          accept=".pdf,.doc,.docx"
                          value={value}
                          onChange={onChange}
                          {...fieldProps}
                        />
                        {value && (
                          <span className="ml-2 text-xs text-green-600">
                            ✓ {value instanceof File ? value.name : 'File ready'}
                          </span>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setApplicationDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={applicationMutation.isPending}>
                  {applicationMutation.isPending ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Visitor Notification */}
      <VisitorNotificationDialog
        open={visitorNotifyOpen}
        onOpenChange={setVisitorNotifyOpen}
        title={visitorNotifyMessage.title}
        description={visitorNotifyMessage.description}
      />
    </div>
  );
};

export default JobDetail;