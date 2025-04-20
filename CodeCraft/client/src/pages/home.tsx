import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import ServiceCard from '@/components/services/service-card';
import JobCard from '@/components/jobs/job-card';
import { ServiceWithUser, JobWithUser } from '@/lib/types';
import { useAuth } from '@/lib/auth';

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch featured services
  const {
    data: services,
    isLoading: loadingServices,
    error: servicesError
  } = useQuery({
    queryKey: ['/api/services'],
    select: (data: ServiceWithUser[]) => data.slice(0, 3) // Just take first 3 for featured
  });

  // Fetch featured jobs
  const {
    data: jobs,
    isLoading: loadingJobs,
    error: jobsError
  } = useQuery({
    queryKey: ['/api/jobs'],
    select: (data: JobWithUser[]) => data.slice(0, 2) // Just take first 2 for featured
  });

  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <svg
              className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
              fill="currentColor"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polygon points="50,0 100,0 50,100 0,100" />
            </svg>

            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Find the best talent or</span>{' '}
                  <span className="block text-primary xl:inline">work as a freelancer</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  WorkiT connects skilled freelancers with employers looking for quality work. Post a job, offer your
                  services, and grow your business or career.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Button
                      onClick={() => setLocation('/jobs')}
                      className="w-full flex items-center justify-center px-8 py-3 md:py-4 md:text-lg md:px-10"
                    >
                      Find Talent
                    </Button>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Button
                      onClick={() => setLocation('/services')}
                      variant="outline"
                      className="w-full flex items-center justify-center px-8 py-3 md:py-4 md:text-lg md:px-10"
                    >
                      Find Work
                    </Button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2850&q=80"
            alt="People working on laptops"
          />
        </div>
      </div>

      {/* Featured Services Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Featured Services</h2>
            <Link href="/services" className="text-primary hover:text-primary-600 text-sm font-medium">
              View all services →
            </Link>
          </div>

          {loadingServices ? (
            <div className="text-center py-10">Loading services...</div>
          ) : servicesError ? (
            <div className="text-center py-10 text-red-500">Error loading services</div>
          ) : services && services.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">No services available yet</div>
          )}
        </div>
      </div>

      {/* Featured Jobs Section */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Featured Jobs</h2>
            <Link href="/jobs" className="text-primary hover:text-primary-600 text-sm font-medium">
              View all jobs →
            </Link>
          </div>

          {loadingJobs ? (
            <div className="text-center py-10">Loading jobs...</div>
          ) : jobsError ? (
            <div className="text-center py-10 text-red-500">Error loading jobs</div>
          ) : jobs && jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">No jobs available yet</div>
          )}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Getting Started</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              How WorkiT works
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Our platform makes it easy to connect talented freelancers with clients looking for quality services.
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">1. Create an account</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Sign up as a freelancer or employer to get started. Complete your profile and showcase your skills or
                  needs.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">2. Post or find opportunities</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Post services or jobs on the platform, or browse existing opportunities that match your interests.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">3. Collaborate and get paid</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Connect with clients or freelancers, complete projects, and use our secure payment system to get paid.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to start?</span>
            <span className="block text-primary-300">Join our community today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            {!isAuthenticated ? (
              <>
                <div className="inline-flex rounded-md shadow">
                  <Button
                    onClick={() => setLocation('/auth/register')}
                    variant="secondary"
                    className="inline-flex items-center justify-center px-5 py-3 text-base font-medium"
                  >
                    Sign up for free
                  </Button>
                </div>
                <div className="ml-3 inline-flex rounded-md shadow">
                  <Button
                    onClick={() => setLocation('/auth/login')}
                    className="inline-flex items-center justify-center px-5 py-3 text-base font-medium"
                  >
                    Log in
                  </Button>
                </div>
              </>
            ) : (
              <div className="inline-flex rounded-md shadow">
                <Button
                  onClick={() => 
                    setLocation(user?.role === 'freelancer' ? '/services/create' : '/jobs/create')
                  }
                  className="inline-flex items-center justify-center px-5 py-3 text-base font-medium"
                >
                  {user?.role === 'freelancer' ? 'Create a Service' : 'Post a Job'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
