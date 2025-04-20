import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ServiceCard from '@/components/services/service-card';
import JobCard from '@/components/jobs/job-card';
import { ServiceWithUser, JobWithUser, Application, Order } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  BriefcaseIcon, 
  CalendarIcon, 
  CheckCircle, 
  ChevronRight, 
  Eye, 
  FileIcon,
  FileText, 
  Mail, 
  MessageSquare, 
  User as UserIcon, 
  XCircle 
} from 'lucide-react';

// Application Card Component for freelancers
const ApplicationCard = ({ 
  application, 
  setLocation 
}: { 
  application: Application; 
  setLocation: (path: string) => void 
}) => {
  return (
    <Card key={application.id} className="overflow-hidden">
      <div className="border-b border-gray-100 bg-gray-50 px-6 py-3 flex justify-between items-center">
        <h3 className="text-lg font-medium">
          {application.job?.title || 'Job Title'}
        </h3>
        <Badge
          variant={
            application.status === 'approved'
              ? 'default'
              : application.status === 'rejected'
              ? 'destructive'
              : 'outline'
          }
          className="capitalize"
        >
          {application.status}
        </Badge>
      </div>
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center text-sm text-gray-500">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Applied on {new Date(application.createdAt).toLocaleDateString()}
          </div>
          
          <div className="mt-2">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Your Cover Letter:</h4>
            <p className="text-gray-600 text-sm">{application.description}</p>
          </div>
          
          {application.resumeFile && (
            <div className="flex items-center text-sm">
              <FileText className="mr-2 h-4 w-4" />
              <span>Resume: </span>
              <a 
                href={application.resumeFile} 
                target="_blank" 
                rel="noreferrer"
                className="text-primary hover:underline ml-1"
              >
                View Uploaded Resume
              </a>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation(`/jobs/${application.jobId}`)}
              className="flex items-center"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Job Details
            </Button>
            
            {application.status === 'approved' && (
              <Button 
                size="sm" 
                className="flex items-center"
                onClick={() => window.location.href = '/coming-soon?feature=contact-employer'}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact Employer
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Applicant Card Component for employers
const ApplicantCard = ({ 
  application, 
  handleUpdateApplicationStatus,
  isPending
}: { 
  application: Application; 
  handleUpdateApplicationStatus: (id: string | number, status: 'approved' | 'rejected') => void;
  isPending: boolean;
}) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src={application.user?.profilePicture} />
                <AvatarFallback>
                  {application.user?.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">{application.user?.username}</h4>
                <p className="text-sm text-gray-500">
                  Applied {new Date(application.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
                          
            <div className="mt-4">
              <div className="flex items-center mb-1">
                <h4 className="text-sm font-medium text-gray-700">Application Status</h4>
                <Badge 
                  variant={
                    application.status === 'approved'
                      ? 'default'
                      : application.status === 'rejected'
                      ? 'destructive'
                      : 'outline'
                  }
                  className="ml-3 capitalize"
                >
                  {application.status}
                </Badge>
              </div>
              
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Cover Letter</h4>
                <Card className="border border-gray-200">
                  <CardContent className="p-3">
                    {/* Check both coverLetter and description fields as they may be used interchangeably */}
                    {(application.coverLetter || application.description) ? (
                      <p className="text-gray-600 text-sm whitespace-pre-wrap">{application.coverLetter || application.description}</p>
                    ) : (
                      <div className="text-center py-3 text-gray-500 bg-gray-50 rounded">
                        <p>No cover letter provided.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
                          
            {/* Resume/CV Display Section */}
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Resume/CV</h4>
                {application.resumeFile ? (
                  <Card className="border border-gray-200 hover:border-primary transition-colors">
                    <CardContent className="p-3 flex items-center">
                      <div className="flex-1 flex items-center">
                        <FileText className="h-6 w-6 mr-3 text-blue-500" />
                        <div>
                          <p className="text-gray-700 font-medium">Applicant CV/Resume</p>
                          <p className="text-xs text-gray-500">
                            {application.resumeFile.split('.').pop()?.toUpperCase() || 'FILE'}
                          </p>
                        </div>
                      </div>
                      <a 
                        href={application.resumeFile} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View CV
                      </a>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border border-gray-200">
                    <CardContent className="p-3 flex items-center justify-center text-gray-500 bg-gray-50">
                      <FileIcon className="h-5 w-5 mr-2 opacity-50" />
                      <span>No resume file provided</span>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
              {application.user?.email && (
                <div className="bg-gray-50 rounded-md border border-gray-200 px-3 py-2 text-sm flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{application.user.email}</span>
                </div>
              )}
              
              {application.user && (
                <div className="bg-gray-50 rounded-md border border-gray-200 px-3 py-2 text-sm flex items-center">
                  <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                  <a 
                    href={`/users/${application.userId}/profile`}
                    className="text-blue-600 hover:underline"
                  >
                    View Profile
                  </a>
                </div>
              )}
            </div>
          </div>
                        
          <div className="mt-4 md:mt-0 md:ml-4 flex flex-col items-end">
            {application.status === 'pending' ? (
              <div className="flex flex-col gap-2 mt-2">
                <Button
                  size="sm"
                  className="w-full flex items-center justify-center"
                  onClick={() => handleUpdateApplicationStatus(application.id, 'approved')}
                  disabled={isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full flex items-center justify-center"
                  onClick={() => handleUpdateApplicationStatus(application.id, 'rejected')}
                  disabled={isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            ) : application.status === 'approved' ? (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex items-center mt-2"
                onClick={() => window.location.href = '/coming-soon?feature=contact-applicant'}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact Applicant
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const userId = user?.id;
  
  // Check URL query parameters for active tab
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get('tab');
  
  // Default tab based on role or query parameter
  const defaultTab = tabParam || (user?.role === 'freelancer' ? 'services' : 'jobs');

  // Redirect if not logged in
  if (!userId) {
    setLocation('/auth/login');
    return null;
  }

  // Fetch user services
  const {
    data: services,
    isLoading: loadingServices,
  } = useQuery<ServiceWithUser[]>({
    queryKey: [`/api/users/${userId}/services`],
    enabled: !!userId && user?.role === 'freelancer',
  });

  // Fetch user jobs
  const {
    data: jobs,
    isLoading: loadingJobs,
  } = useQuery<JobWithUser[]>({
    queryKey: [`/api/users/${userId}/jobs`],
    enabled: !!userId && user?.role === 'employer',
  });

  // Fetch user applications (for freelancer)
  const {
    data: applications,
    isLoading: loadingApplications,
  } = useQuery<Application[]>({
    queryKey: [`/api/users/${userId}/applications`],
    enabled: !!userId && user?.role === 'freelancer',
  });

  // Fetch job applications (for employer's jobs)
  const {
    data: jobApplications,
    isLoading: loadingJobApplications,
  } = useQuery<{ [key: number]: Application[] }>({
    queryKey: ['jobApplications'],
    enabled: !!userId && user?.role === 'employer' && !!jobs,
    queryFn: async () => {
      if (!jobs || jobs.length === 0) return {};
      
      const applicationsByJob: { [key: number]: Application[] } = {};
      
      for (const job of jobs) {
        try {
          const apps = await apiRequest('GET', `/api/jobs/${job.id}/applications`);
          applicationsByJob[job.id] = apps;
        } catch (error) {
          console.error(`Error fetching applications for job ${job.id}:`, error);
        }
      }
      
      return applicationsByJob;
    },
  });

  // Update application status mutation
  const updateApplicationMutation = useMutation({
    mutationFn: ({ id, status }: { id: string | number; status: string }) => {
      return apiRequest('PUT', `/api/applications/${id}/status`, { status });
    },
    onSuccess: (data) => {
      // Invalidate job applications
      if (jobs) {
        jobs.forEach(job => {
          queryClient.invalidateQueries({ queryKey: [`/api/jobs/${job.id}/applications`] });
        });
      }
      
      // Invalidate employer's stats (current user)
      if (userId) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/stats`] });
      }
      
      // Invalidate the applicant's stats
      if (data && data.userId) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${data.userId}/stats`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${data.userId}/applications`] });
      }
      
      // Invalidate general user data
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      toast({
        title: 'Application Updated',
        description: 'The application status has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Fetch user orders
  const {
    data: orders,
    isLoading: loadingOrders,
  } = useQuery<Order[]>({
    queryKey: [`/api/users/${userId}/orders`],
    enabled: !!userId,
  });
  
  // Fetch user stats for the counter
  const {
    data: userStats,
    isLoading: loadingStats,
  } = useQuery<{
    activeServices?: number;
    activeJobs?: number;
    jobApplications?: number;
    applicationsReceived?: number;
    ordersMade: number;
    ordersReceived: number;
  }>({
    queryKey: [`/api/users/${userId}/stats`],
    enabled: !!userId,
  });

  // Helper to get initials from username
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // Handle application status update
  const handleUpdateApplicationStatus = (id: string | number, status: 'approved' | 'rejected') => {
    updateApplicationMutation.mutate({ id, status });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Profile Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user?.profilePicture} />
            <AvatarFallback className="text-2xl">{user ? getInitials(user.username) : ''}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{user?.username}</h1>
            <p className="text-gray-500">{user?.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {user?.role}
              </Badge>
            </div>
            <p className="mt-4 text-gray-700 max-w-2xl">
              {user?.bio || 'No bio provided yet.'}
            </p>
          </div>
          <div className="ml-auto">
            <Button onClick={() => setLocation('/profile/edit')}>Edit Profile</Button>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue={defaultTab} className="mt-8">
        <TabsList className="mb-8 grid w-full md:w-auto grid-cols-2 md:grid-cols-4">
          {user?.role === 'freelancer' && (
            <TabsTrigger value="services">My Services</TabsTrigger>
          )}
          {user?.role === 'employer' && (
            <TabsTrigger value="jobs">My Jobs</TabsTrigger>
          )}
          {user?.role === 'freelancer' && (
            <TabsTrigger value="applications">My Applications</TabsTrigger>
          )}
          {user?.role === 'employer' && (
            <TabsTrigger value="job-applications">Job Applications</TabsTrigger>
          )}
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* Services Tab (Freelancer) */}
        {user?.role === 'freelancer' && (
          <TabsContent value="services">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">My Services</h2>
              <Button onClick={() => setLocation('/services/create')}>
                Create New Service
              </Button>
            </div>

            {loadingServices ? (
              <p>Loading your services...</p>
            ) : services && services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={{ ...service, user: user }} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="mb-4">You haven't created any services yet.</p>
                  <Button onClick={() => setLocation('/services/create')}>
                    Create Your First Service
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Jobs Tab (Employer) */}
        {user?.role === 'employer' && (
          <TabsContent value="jobs">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">My Jobs</h2>
              <Button onClick={() => setLocation('/jobs/create')}>
                Post New Job
              </Button>
            </div>

            {loadingJobs ? (
              <p>Loading your jobs...</p>
            ) : jobs && jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={{ ...job, user: user }} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="mb-4">You haven't posted any jobs yet.</p>
                  <Button onClick={() => setLocation('/jobs/create')}>
                    Post Your First Job
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Applications Tab (Freelancer) */}
        {user?.role === 'freelancer' && (
          <TabsContent value="applications">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">My Job Applications</h2>
              <Button onClick={() => setLocation('/jobs')} variant="outline">
                Find More Jobs
              </Button>
            </div>
            
            {loadingApplications ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : applications && applications.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <p className="text-sm text-gray-500">Total Applications</p>
                      <p className="text-3xl font-bold mt-2">{applications.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <p className="text-sm text-gray-500">Approved</p>
                      <p className="text-3xl font-bold mt-2 text-green-600">
                        {applications.filter(app => app.status === 'approved').length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <p className="text-sm text-gray-500">Pending</p>
                      <p className="text-3xl font-bold mt-2 text-amber-500">
                        {applications.filter(app => app.status === 'pending').length}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <Tabs defaultValue="all" className="mb-6">
                  <TabsList>
                    <TabsTrigger value="all">All Applications</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="mt-4">
                    <div className="space-y-4">
                      {applications.map((application) => (
                        <ApplicationCard key={application.id} application={application} setLocation={setLocation} />
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="pending" className="mt-4">
                    <div className="space-y-4">
                      {applications.filter(app => app.status === 'pending').map((application) => (
                        <ApplicationCard key={application.id} application={application} setLocation={setLocation} />
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="approved" className="mt-4">
                    <div className="space-y-4">
                      {applications.filter(app => app.status === 'approved').map((application) => (
                        <ApplicationCard key={application.id} application={application} setLocation={setLocation} />
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="rejected" className="mt-4">
                    <div className="space-y-4">
                      {applications.filter(app => app.status === 'rejected').map((application) => (
                        <ApplicationCard key={application.id} application={application} setLocation={setLocation} />
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="mb-4">You haven't applied to any jobs yet.</p>
                  <Button onClick={() => setLocation('/jobs')}>
                    Browse Jobs
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Job Applications Tab (Employer) */}
        {user?.role === 'employer' && (
          <TabsContent value="job-applications">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Applications to My Jobs</h2>
              <Button onClick={() => setLocation('/jobs/create')} variant="outline">
                Post New Job
              </Button>
            </div>

            {loadingJobApplications || loadingJobs ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : jobs && jobs.length > 0 && jobApplications ? (
              <div>
                {/* Stats Summary */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <p className="text-sm text-gray-500">Total Jobs</p>
                      <p className="text-3xl font-bold mt-2">{jobs.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <p className="text-sm text-gray-500">Total Applications</p>
                      <p className="text-3xl font-bold mt-2">
                        {Object.values(jobApplications).reduce((acc, apps) => acc + apps.length, 0)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <p className="text-sm text-gray-500">Pending</p>
                      <p className="text-3xl font-bold mt-2 text-amber-500">
                        {Object.values(jobApplications).reduce(
                          (acc, apps) => acc + apps.filter(app => app.status === 'pending').length, 0
                        )}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <p className="text-sm text-gray-500">Approved</p>
                      <p className="text-3xl font-bold mt-2 text-green-600">
                        {Object.values(jobApplications).reduce(
                          (acc, apps) => acc + apps.filter(app => app.status === 'approved').length, 0
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Jobs Accordion */}
                <div className="space-y-6">
                  {jobs.map((job) => {
                    const apps = jobApplications[job.id] || [];
                    const pendingCount = apps.filter(app => app.status === 'pending').length;
                    const approvedCount = apps.filter(app => app.status === 'approved').length;
                    const rejectedCount = apps.filter(app => app.status === 'rejected').length;
                    
                    return (
                      <Card key={job.id} className="overflow-hidden">
                        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                          <div>
                            <div className="flex items-center">
                              <h3 className="text-lg font-medium">{job.title}</h3>
                              {pendingCount > 0 && (
                                <Badge variant="outline" className="ml-3 bg-amber-50">
                                  {pendingCount} new
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Budget: {job.budget} DNT • Posted on {new Date(job.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="mt-2 md:mt-0 flex space-x-3">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setLocation(`/jobs/${job.id}`)}
                            >
                              View Job
                            </Button>
                          </div>
                        </div>
                        
                        <CardContent className="p-6">
                          <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="border border-gray-100 rounded p-3 text-center">
                              <p className="text-sm text-gray-500">Total</p>
                              <p className="font-bold">{apps.length} Applicants</p>
                            </div>
                            <div className="border border-gray-100 rounded p-3 text-center">
                              <p className="text-sm text-gray-500">Pending Review</p>
                              <p className="font-bold text-amber-500">{pendingCount}</p>
                            </div>
                            <div className="border border-gray-100 rounded p-3 text-center">
                              <p className="text-sm text-gray-500">Approved</p>
                              <p className="font-bold text-green-600">{approvedCount}</p>
                            </div>
                          </div>
                          
                          <Tabs defaultValue="all">
                            <TabsList className="mb-4">
                              <TabsTrigger value="all">All Applicants</TabsTrigger>
                              <TabsTrigger value="pending">Pending</TabsTrigger>
                              <TabsTrigger value="approved">Approved</TabsTrigger>
                              <TabsTrigger value="rejected">Rejected</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="all">
                              {apps.length > 0 ? (
                                <div className="space-y-4">
                                  {apps.map((application) => (
                                    <ApplicantCard
                                      key={application.id}
                                      application={application}
                                      handleUpdateApplicationStatus={handleUpdateApplicationStatus}
                                      isPending={updateApplicationMutation.isPending}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  No applications received for this job yet.
                                </div>
                              )}
                            </TabsContent>
                            
                            <TabsContent value="pending">
                              {apps.filter(app => app.status === 'pending').length > 0 ? (
                                <div className="space-y-4">
                                  {apps.filter(app => app.status === 'pending').map((application) => (
                                    <ApplicantCard
                                      key={application.id}
                                      application={application}
                                      handleUpdateApplicationStatus={handleUpdateApplicationStatus}
                                      isPending={updateApplicationMutation.isPending}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  No pending applications for this job.
                                </div>
                              )}
                            </TabsContent>
                            
                            <TabsContent value="approved">
                              {apps.filter(app => app.status === 'approved').length > 0 ? (
                                <div className="space-y-4">
                                  {apps.filter(app => app.status === 'approved').map((application) => (
                                    <ApplicantCard
                                      key={application.id}
                                      application={application}
                                      handleUpdateApplicationStatus={handleUpdateApplicationStatus}
                                      isPending={updateApplicationMutation.isPending}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  No approved applications for this job.
                                </div>
                              )}
                            </TabsContent>
                            
                            <TabsContent value="rejected">
                              {apps.filter(app => app.status === 'rejected').length > 0 ? (
                                <div className="space-y-4">
                                  {apps.filter(app => app.status === 'rejected').map((application) => (
                                    <ApplicantCard
                                      key={application.id}
                                      application={application}
                                      handleUpdateApplicationStatus={handleUpdateApplicationStatus}
                                      isPending={updateApplicationMutation.isPending}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  No rejected applications for this job.
                                </div>
                              )}
                            </TabsContent>
                          </Tabs>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="mb-4">You haven't posted any jobs yet.</p>
                  <Button onClick={() => setLocation('/jobs/create')}>
                    Post Your First Job
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Orders Tab */}
        <TabsContent value="orders">
          <h2 className="text-xl font-semibold mb-6">My Orders</h2>

          {loadingOrders ? (
            <p>Loading your orders...</p>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between">
                      <div>
                        <h3 className="text-lg font-medium">
                          {order.service?.title || 'Service Title'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Ordered on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        <div className="mt-2">
                          <p className="font-medium">Amount: {order.totalPrice} DNT</p>
                          <p className="text-sm text-gray-500">
                            Payment Method: {order.paymentMethod === 'card' ? 'Card Payment' : 'Bank Transfer'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0">
                        <Badge
                          variant={
                            order.status === 'completed'
                              ? 'default'
                              : order.status === 'cancelled'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="mb-4">You haven't made any orders yet.</p>
                <Button onClick={() => setLocation('/services')}>
                  Browse Services
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Account Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="font-medium">{user?.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Type</p>
                    <p className="font-medium capitalize">{user?.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-medium">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <Button onClick={() => setLocation('/profile/edit')} className="w-full">
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Stats</h3>
                
                {loadingStats ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="animate-pulse bg-gray-200 p-4 rounded-md h-24"></div>
                    <div className="animate-pulse bg-gray-200 p-4 rounded-md h-24"></div>
                    <div className="animate-pulse bg-gray-200 p-4 rounded-md h-24"></div>
                    <div className="animate-pulse bg-gray-200 p-4 rounded-md h-24"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {user?.role === 'freelancer' ? (
                      <>
                        <div className="bg-primary-50 p-4 rounded-md">
                          <p className="text-primary font-semibold text-2xl">
                            {userStats?.activeServices || 0}
                          </p>
                          <p className="text-sm text-gray-500">Active Services</p>
                        </div>
                        <div className="bg-primary-50 p-4 rounded-md">
                          <p className="text-primary font-semibold text-2xl">
                            {userStats?.jobApplications || 0}
                          </p>
                          <p className="text-sm text-gray-500">Job Applications</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-primary-50 p-4 rounded-md">
                          <p className="text-primary font-semibold text-2xl">
                            {userStats?.activeJobs || 0}
                          </p>
                          <p className="text-sm text-gray-500">Active Jobs</p>
                        </div>
                        <div className="bg-primary-50 p-4 rounded-md">
                          <p className="text-primary font-semibold text-2xl">
                            {userStats?.applicationsReceived || 0}
                          </p>
                          <p className="text-sm text-gray-500">Applications Received</p>
                        </div>
                      </>
                    )}
                    <div className="bg-primary-50 p-4 rounded-md">
                      <p className="text-primary font-semibold text-2xl">
                        {userStats?.ordersMade || 0}
                      </p>
                      <p className="text-sm text-gray-500">Orders Made</p>
                    </div>
                    <div className="bg-primary-50 p-4 rounded-md">
                      <p className="text-primary font-semibold text-2xl">
                        {userStats?.ordersReceived || 0}
                      </p>
                      <p className="text-sm text-gray-500">Orders Received</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;