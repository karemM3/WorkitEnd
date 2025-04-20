import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Star, StarHalf } from 'lucide-react';
import { ServiceWithUser, Review } from '@/lib/types';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(5, 'Review comment must be at least 5 characters'),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

const ServiceDetail: React.FC = () => {
  const [, params] = useRoute<{ id: string }>('/services/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isVisitor } = useAuth();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [visitorNotifyOpen, setVisitorNotifyOpen] = useState(false);
  const [visitorNotifyMessage, setVisitorNotifyMessage] = useState({
    title: '',
    description: ''
  });

  // Don't attempt to convert MongoDB ObjectID to number
  const serviceId = params?.id || '';

  // Fetch service details
  const {
    data: service,
    isLoading,
    error,
  } = useQuery<ServiceWithUser>({
    queryKey: [`/api/services/${serviceId}`],
    enabled: !!serviceId,
  });

  // Fetch service reviews
  const {
    data: reviews,
    isLoading: loadingReviews,
  } = useQuery<Review[]>({
    queryKey: [`/api/services/${serviceId}/reviews`],
    enabled: !!serviceId,
  });

  // Create review mutation
  const reviewMutation = useMutation({
    mutationFn: (data: ReviewFormValues) => {
      return apiRequest('POST', `/api/services/${serviceId}/reviews`, {
        ...data,
        serviceId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}/reviews`] });
      toast({
        title: 'Review Submitted',
        description: 'Your review has been submitted successfully.',
      });
      setReviewDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to submit review: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Review form
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: '',
    },
  });

  const onReviewSubmit = (data: ReviewFormValues) => {
    reviewMutation.mutate(data);
  };

  // Handle order button click
  const handleOrderNow = () => {
    if (isVisitor) {
      setVisitorNotifyMessage({
        title: 'Order Unavailable in Visitor Mode',
        description: 'You need to sign up or log in to order services on WorkiT.'
      });
      setVisitorNotifyOpen(true);
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to order this service.',
        variant: 'destructive',
      });
      setLocation('/auth/login');
      return;
    }

    if (user?.id === service?.userId) {
      toast({
        title: 'Cannot Order Own Service',
        description: 'You cannot order your own service.',
        variant: 'destructive',
      });
      return;
    }

    setLocation(`/payment/${serviceId}`);
  };

  // Handle contact button click
  const handleContactFreelancer = () => {
    if (isVisitor) {
      setVisitorNotifyMessage({
        title: 'Messaging Unavailable in Visitor Mode',
        description: 'You need to sign up or log in to contact freelancers on WorkiT.'
      });
      setVisitorNotifyOpen(true);
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to contact this freelancer.',
        variant: 'destructive',
      });
      setLocation('/auth/login');
      return;
    }

    setLocation(`/contact-freelancer/${service?.userId}`);
  };

  // Handle view profile button click
  const handleViewProfile = () => {
    if (service?.user?.id) {
      // Redirect to the profile of the service owner
      setLocation(`/users/${service.user.id}/profile`);
    }
  };

  // Calculate average rating
  const averageRating = React.useMemo(() => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((acc, review) => acc + review.rating, 0);
    return total / reviews.length;
  }, [reviews]);

  // Helper function to get currency symbol
  // Always return DNT for Tunisian Dinar as per requirement
  const getCurrencySymbol = (currency?: string) => {
    return 'DNT'; // Tunisian Dinar Symbol
  };

  // Helper to render star rating
  const renderStarRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-5 w-5 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="h-5 w-5 fill-yellow-400 text-yellow-400" />);
    }

    // Add empty stars to make total of 5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-star-${i}`} className="h-5 w-5 text-gray-300" />);
    }

    return stars;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-center">Loading service details...</p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-center text-red-500">Error loading service details. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Service Image */}
            <div className="w-full h-96 bg-gray-200">
              <img
                src={service.image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643'}
                alt={service.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Service Title and Rating */}
            <div className="p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{service.title}</h1>
              
              <div className="flex items-center mb-6">
                <div className="flex mr-2">
                  {renderStarRating(averageRating)}
                </div>
                <span className="text-sm text-gray-500">{averageRating.toFixed(1)} ({reviews?.length || 0} reviews)</span>
              </div>

              {/* Service Description */}
              <div className="prose max-w-none">
                <h2 className="text-xl font-semibold mb-2">About This Service</h2>
                <p className="text-gray-700 whitespace-pre-line">{service.description}</p>
              </div>

              {/* Service Details */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Service Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium">{service.category}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Delivery Time</p>
                    <p className="font-medium">{service.deliveryTime || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="mt-12">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Reviews</h2>
                  {isAuthenticated && user?.id !== service.userId && (
                    <Button variant="outline" onClick={() => setReviewDialogOpen(true)}>
                      Write a Review
                    </Button>
                  )}
                  {isVisitor && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setVisitorNotifyMessage({
                          title: 'Reviews Unavailable in Visitor Mode',
                          description: 'You need to sign up or log in to write reviews on WorkiT.'
                        });
                        setVisitorNotifyOpen(true);
                      }}
                    >
                      Write a Review
                    </Button>
                  )}
                </div>

                {loadingReviews ? (
                  <p>Loading reviews...</p>
                ) : reviews && reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b pb-6 last:border-0">
                        <div className="flex items-center mb-2">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={review.user?.profilePicture} />
                            <AvatarFallback>
                              {review.user?.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{review.user?.username}</p>
                            <div className="flex items-center">
                              <div className="flex mr-2">
                                {renderStarRating(review.rating)}
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 mt-2">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No reviews yet. Be the first to review this service!</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          {/* Service Card */}
          <Card className="sticky top-8">
            <CardContent className="p-6">
              <div className="mb-6">
                <p className="text-3xl font-bold">
                  {service.price} {getCurrencySymbol(service.currency)}
                </p>
              </div>

              <div className="space-y-4">
                <Button className="w-full" onClick={handleOrderNow}>
                  Order Now
                </Button>
                <Button className="w-full" variant="outline" onClick={handleContactFreelancer}>
                  Contact Freelancer
                </Button>
              </div>

              {/* Seller Info */}
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-medium mb-4">About the Seller</h3>
                <div className="flex items-center mb-4">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarImage src={service.user?.profilePicture} />
                    <AvatarFallback>
                      {service.user?.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{service.user?.username}</p>
                    <p className="text-sm text-gray-500">
                      {service.user?.role.charAt(0).toUpperCase() + service.user?.role.slice(1)}
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your experience with this service to help others make better decisions.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onReviewSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => field.onChange(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-8 w-8 ${
                                field.value >= star
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormDescription>Select a rating from 1 to 5 stars</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comment</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share your experience with this service..."
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={reviewMutation.isPending}>
                  {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
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

export default ServiceDetail;
