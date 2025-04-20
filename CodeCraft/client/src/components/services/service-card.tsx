import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, StarHalf } from 'lucide-react';
import { ServiceWithUser } from '@/lib/types';

interface ServiceCardProps {
  service: ServiceWithUser;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const { id, title, price, image, user } = service;

  // Helper to get initials from username
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // Placeholder for rating data that would come from reviews in a real app
  const rating = {
    value: 4.8,
    count: 24
  };

  // Generate star rating elements
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }

    return stars;
  };

  return (
    <Card className="group relative bg-white rounded-lg shadow-sm overflow-hidden h-full">
      <div className="w-full h-60 bg-gray-200 aspect-w-1 aspect-h-1 rounded-t-lg overflow-hidden group-hover:opacity-90">
        <img
          src={image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643'}
          alt={title}
          className="w-full h-full object-center object-cover"
        />
      </div>
      <CardContent className="p-4">
        <div className="flex items-center mb-2">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={user?.profilePicture} />
            <AvatarFallback>{user ? getInitials(user.username) : 'U'}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-500">{user?.username}</span>
        </div>
        <h3 className="text-base font-medium text-gray-900 line-clamp-2">{title}</h3>
        <div className="flex items-center mt-2">
          {renderStars(rating.value)}
          <span className="text-sm text-gray-500 ml-1">({rating.value})</span>
        </div>
        <div className="mt-3 flex justify-between items-center">
          <p className="text-lg font-semibold text-gray-900">{price} DNT</p>
          <Link href={`/services/${id}`} className="text-primary hover:text-primary-600 text-sm font-medium">
            View Details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;
