import React from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ServiceWithUser, JobWithUser, UserWithStats } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import ServiceCard from '@/components/services/service-card';

// Helper function to get initials from username
const getInitials = (name?: string) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

const UserProfile: React.FC = () => {
  const [, params] = useRoute<{ id: string }>('/users/:id/profile');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  // Check URL query parameters for active tab
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get('tab');
  
  // Get the user ID from the route params
  const userId = params?.id;

  if (!userId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-center">User not found</p>
      </div>
    );
  }

  // Fetch user details
  const {
    data: user,
    isLoading: loadingUser,
    error: userError,
  } = useQuery<UserWithStats>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

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

  // Fetch user stats
  const {
    data: userStats,
    isLoading: loadingStats,
    error: statsError
  } = useQuery<any>({
    queryKey: [`/api/users/${userId}/stats`],
    enabled: !!userId,
    retry: 3,
    onError: (error) => {
      console.error('Error fetching user stats:', error);
    }
  });

  // Default tab based on role or query parameter
  const defaultTab = tabParam || (user?.role === 'freelancer' ? 'services' : 'jobs');

  if (loadingUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-center">Loading user profile...</p>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-center text-red-500">Error loading user profile.</p>
      </div>
    );
  }

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
          {/* Only show edit button when viewing own profile */}
          {currentUser?.id === userId && (
            <div className="ml-auto">
              <Button onClick={() => setLocation('/profile/edit')}>Edit Profile</Button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content - Services/Jobs/Applications */}
        <div className="md:col-span-2">
          <Tabs defaultValue={defaultTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-2">
              {user.role === 'freelancer' ? (
                <TabsTrigger value="services">Services</TabsTrigger>
              ) : (
                <TabsTrigger value="jobs">Jobs</TabsTrigger>
              )}
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>

            {/* Services Tab (Freelancer) */}
            {user.role === 'freelancer' && (
              <TabsContent value="services">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Services</h2>
                </div>

                {loadingServices ? (
                  <p>Loading services...</p>
                ) : services && services.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {services.map((service) => (
                      <ServiceCard key={service.id} service={{ ...service, user }} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-10 text-center">
                      <p className="mb-4">This user hasn't created any services yet.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}

            {/* Jobs Tab (Employer) */}
            {user.role === 'employer' && (
              <TabsContent value="jobs">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Jobs</h2>
                </div>

                {loadingJobs ? (
                  <p>Loading jobs...</p>
                ) : jobs && jobs.length > 0 ? (
                  <div className="space-y-6">
                    {jobs.map((job) => (
                      <Card key={job.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-6" onClick={() => setLocation(`/jobs/${job.id}`)}>
                          <div className="flex items-center mb-4">
                            <div>
                              <h3 className="text-lg font-medium">{job.title}</h3>
                              <p className="text-sm text-gray-500">{job.location || 'Remote'}</p>
                            </div>
                            <div className="ml-auto">
                              <Badge>{job.budget} DNT</Badge>
                            </div>
                          </div>
                          <p className="text-gray-700 line-clamp-2 mb-4">{job.description}</p>
                          <div className="flex justify-between items-center">
                            <Badge variant="outline">{job.jobType}</Badge>
                            <span className="text-sm text-gray-500">
                              Posted on {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-10 text-center">
                      <p className="mb-4">This user hasn't posted any jobs yet.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}

            {/* About Tab */}
            <TabsContent value="about">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">About {user.username}</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900">Bio</h3>
                      <p className="mt-1 text-gray-700">{user.bio || 'No bio provided.'}</p>
                    </div>
                    
                    {user.skills && user.skills.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-900">Skills</h3>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {user.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {user.location && (
                      <div>
                        <h3 className="font-medium text-gray-900">Location</h3>
                        <p className="mt-1 text-gray-700">{user.location}</p>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-medium text-gray-900">Member Since</h3>
                      <p className="mt-1 text-gray-700">
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - User Stats */}
        <div>
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Stats</h3>
              
              {loadingStats ? (
                <div className="grid grid-cols-1 gap-4">
                  <div className="animate-pulse bg-gray-200 p-4 rounded-md h-24"></div>
                  <div className="animate-pulse bg-gray-200 p-4 rounded-md h-24"></div>
                  <div className="animate-pulse bg-gray-200 p-4 rounded-md h-24"></div>
                  <div className="animate-pulse bg-gray-200 p-4 rounded-md h-24"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {user?.role === 'freelancer' ? (
                    <>
                      <div className="bg-primary-50 p-4 rounded-md">
                        <p className="text-primary font-semibold text-2xl">
                          {(userStats && !statsError) ? userStats.activeServices || 0 : 0}
                        </p>
                        <p className="text-sm text-gray-500">Active Services</p>
                      </div>
                      <div className="bg-primary-50 p-4 rounded-md">
                        <p className="text-primary font-semibold text-2xl">
                          {(userStats && !statsError) ? userStats.jobApplications || 0 : 0}
                        </p>
                        <p className="text-sm text-gray-500">Job Applications</p>
                      </div>
                      <div className="bg-primary-50 p-4 rounded-md">
                        <p className="text-primary font-semibold text-2xl">
                          {(userStats && !statsError) ? userStats.ordersReceived || 0 : 0}
                        </p>
                        <p className="text-sm text-gray-500">Orders Received</p>
                      </div>
                      <div className="bg-primary-50 p-4 rounded-md">
                        <p className="text-primary font-semibold text-2xl">
                          {(userStats && !statsError) ? userStats.positiveReviews || 0 : 0}
                        </p>
                        <p className="text-sm text-gray-500">Positive Reviews</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-primary-50 p-4 rounded-md">
                        <p className="text-primary font-semibold text-2xl">
                          {(userStats && !statsError) ? userStats.activeJobs || 0 : 0}
                        </p>
                        <p className="text-sm text-gray-500">Active Jobs</p>
                      </div>
                      <div className="bg-primary-50 p-4 rounded-md">
                        <p className="text-primary font-semibold text-2xl">
                          {(userStats && !statsError) ? userStats.applicationsReceived || 0 : 0}
                        </p>
                        <p className="text-sm text-gray-500">Applications Received</p>
                      </div>
                      <div className="bg-primary-50 p-4 rounded-md">
                        <p className="text-primary font-semibold text-2xl">
                          {(userStats && !statsError) ? userStats.ordersMade || 0 : 0}
                        </p>
                        <p className="text-sm text-gray-500">Orders Made</p>
                      </div>
                      <div className="bg-primary-50 p-4 rounded-md">
                        <p className="text-primary font-semibold text-2xl">
                          {(userStats && !statsError) ? (userStats.reviewsGiven || userStats.totalReviews || 0) : 0}
                        </p>
                        <p className="text-sm text-gray-500">Reviews Given</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;