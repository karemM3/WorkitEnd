import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import JobCard from '@/components/jobs/job-card';
import { JobWithUser, jobTypes } from '@/lib/types';

const JobsList: React.FC = () => {
  // Filter state
  const [category, setCategory] = useState<string>('all');
  const [jobType, setJobType] = useState<string>('all-types');
  const [location, setLocation] = useState<string>('anywhere');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Fetch jobs
  const { data: jobs, isLoading, error } = useQuery<JobWithUser[]>({
    queryKey: ['/api/jobs'],
  });

  // Apply filters
  const filteredJobs = React.useMemo(() => {
    if (!jobs) return [];

    return jobs.filter((job) => {
      // Category filter
      if (category && category !== 'all' && job.category !== category) {
        return false;
      }

      // Job type filter
      if (jobType && jobType !== 'all-types' && job.jobType !== jobType) {
        return false;
      }

      // Location filter
      if (location && location !== 'anywhere' && job.location !== location) {
        return false;
      }

      // Search term filter (title and description)
      if (
        searchTerm &&
        !job.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !job.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [jobs, category, jobType, location, searchTerm]);

  // Handle filter reset
  const handleReset = () => {
    setCategory('all');
    setJobType('all-types');
    setLocation('anywhere');
    setSearchTerm('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Browse Jobs</h1>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg p-4 mb-8 shadow-sm">
        <div className="mb-4">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <Input
            id="search"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-1/3 md:w-1/4 lg:w-1/5">
            <Label htmlFor="job-category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="job-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Web Development">Web Development</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="Writing">Writing</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Video & Animation">Video & Animation</SelectItem>
                <SelectItem value="Programming & Tech">Programming & Tech</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
                <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-1/3 md:w-1/4 lg:w-1/5">
            <Label htmlFor="job-type" className="block text-sm font-medium text-gray-700 mb-1">
              Job Type
            </Label>
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger id="job-type">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">All Types</SelectItem>
                {jobTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-1/3 md:w-1/4 lg:w-1/5">
            <Label htmlFor="job-location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger id="job-location">
                <SelectValue placeholder="Anywhere" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anywhere">Anywhere</SelectItem>
                <SelectItem value="Remote Only">Remote Only</SelectItem>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="Europe">Europe</SelectItem>
                <SelectItem value="Asia">Asia</SelectItem>
                <SelectItem value="Africa">Africa</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto flex items-end space-x-2">
            <Button type="button" variant="default">
              Find Jobs
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="text-center py-10">
          <p>Loading jobs...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">
          <p>Error loading jobs. Please try again later.</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-10">
          <p>No jobs match your criteria. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
};

export default JobsList;
