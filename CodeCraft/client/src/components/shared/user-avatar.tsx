import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/lib/types';

interface UserAvatarProps {
  user: User | undefined | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md',
  className = '' 
}) => {
  // Helper to get initials from username
  const getInitials = (username: string) => {
    if (!username) return 'U';
    return username
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // Determine avatar size based on prop
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16'
  };

  const sizeClass = sizeClasses[size];

  return (
    <Avatar className={`${sizeClass} ${className}`}>
      <AvatarImage src={user?.profilePicture} />
      <AvatarFallback>
        {user ? getInitials(user.username) : 'U'}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
