import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

/**
 * A hook to handle visitor access restrictions and notifications
 */
export function useVisitorProtection() {
  const { isAuthenticated, isVisitor } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // State for dialog-based notifications
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notificationInfo, setNotificationInfo] = useState({
    title: 'Visitor Access Restricted',
    description: 'You need to be logged in to use this feature.',
    action: 'use this feature',
    feature: 'this feature'
  });

  /**
   * Check if the user can perform a protected action
   * @param options Configuration options
   * @returns Boolean indicating whether the user can proceed
   */
  const checkAccess = ({
    feature = 'this feature',
    action = 'use this feature',
    title = 'Visitor Access Restricted',
    description,
    redirectTo,
    showToast = false,
    showDialog = true,
  }: {
    feature?: string;
    action?: string;
    title?: string;
    description?: string;
    redirectTo?: string;
    showToast?: boolean;
    showDialog?: boolean;
  } = {}) => {
    // If user is authenticated, they always have access
    if (isAuthenticated) return true;

    // If visitor, show appropriate notification
    if (isVisitor) {
      if (showToast) {
        toast({
          variant: "destructive",
          title: title,
          description: description || `You need to be logged in to ${action}.`,
        });
      }
      
      if (showDialog) {
        setNotificationInfo({
          title,
          description: description || `You need to be logged in to ${action}.`,
          action,
          feature
        });
        setDialogOpen(true);
      }
      
      if (redirectTo) {
        setLocation(redirectTo);
      }
      
      return false;
    }
    
    // If neither authenticated nor visitor, redirect to login
    setLocation('/auth/login');
    return false;
  };

  return {
    checkAccess,
    isVisitor,
    isAuthenticated,
    dialogOpen,
    setDialogOpen,
    notificationInfo
  };
}