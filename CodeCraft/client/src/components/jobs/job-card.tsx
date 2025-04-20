import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { JobWithUser } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: JobWithUser;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const { id, title, description, budget, location, jobType, image, createdAt, user } = job;

  // Helper to get initials from username
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
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

  // Format the createdAt date to "X days/hours ago"
  const formatCreatedDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <Card className="bg-white shadow-sm rounded-lg p-0 mb-4">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between">
          <div className="mb-4 sm:mb-0">
            <div className="flex items-center">
              <Avatar className="h-12 w-12 mr-4">
                <AvatarImage src={user?.profilePicture} />
                <AvatarFallback>{user ? getInitials(user.username) : 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                <div className="mt-1 flex items-center flex-wrap">
                  <span className="text-sm text-gray-500">{user?.username}</span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-sm text-gray-500">{location || 'Remote'}</span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-sm text-gray-500">{budget} DNT</span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
            </div>
            <div className="mt-4 flex flex-wrap">
              {/* Tags would go here in a real app */}
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 mr-2 mb-2">
                {job.category}
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:items-end justify-between">
            <Badge
              variant="outline"
              className={`${getBadgeVariant(jobType)} font-medium whitespace-nowrap`}
            >
              {jobType}
            </Badge>
            <div className="mt-2 sm:mt-0">
              <span className="text-sm text-gray-500">
                Posted {formatCreatedDate(createdAt)}
              </span>
            </div>
            <div className="mt-4">
              <Link href={`/jobs/${id}`} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                View Details
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCard;
