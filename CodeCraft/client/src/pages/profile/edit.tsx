import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import FileUpload from '@/components/ui/file-upload';
import PasswordChangeForm from '@/components/password-change-form';

// Define profile edit form schema
const profileEditSchema = z.object({
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  profilePicture: z.any().optional(),
});

type ProfileEditValues = z.infer<typeof profileEditSchema>;

const EditProfile: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, checkAuth } = useAuth();

  // Initialize form
  const form = useForm<ProfileEditValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      bio: user?.bio || '',
    },
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      setLocation('/auth/login');
    }
  }, [user, setLocation]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileEditValues) => {
      // Create FormData for file upload
      const formData = new FormData();
      
      if (data.bio !== undefined) {
        formData.append('bio', data.bio || '');
      }
      
      if (data.profilePicture && data.profilePicture instanceof File) {
        formData.append('profilePicture', data.profilePicture);
      }

      console.log('Submitting profile update:', {
        bio: data.bio,
        hasProfilePicture: !!data.profilePicture,
        profilePictureType: data.profilePicture instanceof File ? 'File' : typeof data.profilePicture
      });

      // Use apiRequest which already handles credentials and error checking
      return await apiRequest('PUT', `/api/users/${user?.id}`, formData, true); // true = use FormData
    },
    onSuccess: () => {
      checkAuth(); // Refresh auth state
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });
      setLocation('/profile');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: ProfileEditValues) => {
    updateProfileMutation.mutate(data);
  };

  // Helper to get initials from username
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  if (!user) {
    return null; // Will redirect due to useEffect
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>

      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex flex-col items-center space-y-4 mb-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user.profilePicture} />
                    <AvatarFallback className="text-2xl">{getInitials(user.username)}</AvatarFallback>
                  </Avatar>
                  
                  <FormField
                    control={form.control}
                    name="profilePicture"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem className="w-full max-w-sm">
                        <FormControl>
                          <FileUpload
                            id="profile-picture"
                            label="Profile Picture"
                            accept="image/*"
                            value={value || user.profilePicture}
                            onChange={onChange}
                            {...fieldProps}
                          />
                        </FormControl>
                        <FormDescription>
                          Upload a new profile picture.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <FormLabel>Username</FormLabel>
                    <Input
                      value={user.username}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Username cannot be changed.
                    </p>
                  </div>

                  <div>
                    <FormLabel>Email</FormLabel>
                    <Input
                      value={user.email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Email cannot be changed.
                    </p>
                  </div>

                  <div>
                    <FormLabel>Account Type</FormLabel>
                    <Input
                      value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about yourself..."
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Share information about your skills, experience, or services.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/profile')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Password Change Form */}
        <PasswordChangeForm />
      </div>
    </div>
  );
};

export default EditProfile;
