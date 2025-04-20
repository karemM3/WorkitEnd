import React, { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ServiceWithUser } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Mock payment form schema
const paymentFormSchema = z.object({
  cardName: z.string().min(3, 'Card holder name is required'),
  cardNumber: z.string()
    .refine(
      (val) => val.length === 16 && /^\d{16}$/.test(val),
      { message: 'Card number must be exactly 16 digits' }
    ),
  expiry: z.string().min(5, 'Expiry date is required (MM/YY)')
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: 'Format must be MM/YY' }),
  cvc: z.string().min(3, 'CVC is required')
    .regex(/^\d{3,4}$/, { message: 'CVC must be 3-4 digits' }),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

const PaymentPage = () => {
  const [, params] = useRoute('/payment/:serviceId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const serviceId = params?.serviceId;
  
  const { data: service, isLoading } = useQuery<ServiceWithUser>({
    queryKey: ['/api/services', serviceId],
    queryFn: async () => {
      return await apiRequest('GET', `/api/services/${serviceId}`);
    },
    enabled: !!serviceId,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (formData: PaymentFormValues) => {
      if (!service || !user) throw new Error("Missing service or user data");
      
      const orderData = {
        serviceId: service.id,
        buyerId: user.id,
        sellerId: service.userId,
        paymentMethod: 'card',
        totalPrice: service.price,
        status: 'paid', // Set to paid immediately since this is a demo
        paymentDetails: {
          cardName: formData.cardName,
          cardNumberLast4: formData.cardNumber.slice(-4), // Only store last 4 digits for security
          expiryDate: formData.expiry
        }
      };
      
      console.log("Creating order with data:", orderData);
      return await apiRequest('POST', '/api/orders', orderData);
    },
    onSuccess: (data) => {
      console.log("Order created successfully:", data);
      
      // Invalidate buyer's orders and stats
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/orders`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/stats`] });
      
      // Invalidate seller's orders and stats
      if (service?.userId) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${service.userId}/orders`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${service.userId}/stats`] });
      }
      
      // Also invalidate global orders data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      setIsSuccess(true);
      toast({
        title: 'Payment successful',
        description: 'Your order has been placed successfully!',
      });
      
      // Redirect to the orders tab in the profile
      setTimeout(() => {
        setLocation('/profile?tab=orders');
      }, 3000);
    },
    onError: (error: Error) => {
      console.error("Order creation failed:", error);
      toast({
        title: 'Payment failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsProcessing(false);
    },
  });

  // Initialize form
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cardName: '',
      cardNumber: '',
      expiry: '',
      cvc: '',
    },
  });

  const onSubmit = async (data: PaymentFormValues) => {
    if (!service || !user) {
      toast({
        title: 'Error',
        description: 'Missing service or user information',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate card number is exactly 16 digits (should already be validated by Zod)
    if (data.cardNumber.length !== 16 || !/^\d{16}$/.test(data.cardNumber)) {
      toast({
        title: 'Invalid Card Number',
        description: 'Please enter a valid 16-digit card number',
        variant: 'destructive',
      });
      return;
    }
    
    // Simulate payment processing
    setIsProcessing(true);
    
    try {
      // For demo purposes, we'll just wait 2 seconds to simulate processing
      setTimeout(() => {
        createOrderMutation.mutate(data);
      }, 2000);
    } catch (error) {
      setIsProcessing(false);
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Service not found</h1>
        <Button onClick={() => setLocation('/services')}>Back to Services</Button>
      </div>
    );
  }

  // Always return DNT for Tunisian Dinar as per requirement
  const getCurrencySymbol = (currency?: string) => {
    return 'DNT'; // Tunisian Dinar Symbol
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {isSuccess ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
                <CardDescription>
                  Your order has been placed successfully. Redirecting to your profile...
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" onClick={() => setLocation('/profile?tab=orders')}>
                  Go to My Orders
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>
                  Enter your payment information to complete the purchase.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="cardName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cardholder Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="4242 4242 4242 4242" 
                              maxLength={16} 
                              onKeyPress={(e) => {
                                // Allow only numbers
                                if (!/[0-9]/.test(e.key)) {
                                  e.preventDefault();
                                }
                                // Limit to 16 digits
                                const input = e.currentTarget as HTMLInputElement;
                                if (input.value.replace(/\s+/g, '').length >= 16) {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => {
                                // Remove any non-digit characters
                                const value = e.target.value.replace(/\D/g, '');
                                // Limit to 16 digits
                                const limitedValue = value.slice(0, 16);
                                // Update the field value
                                field.onChange(limitedValue);
                              }}
                              value={field.value}
                            />
                          </FormControl>
                          <FormDescription>
                            Card number must be exactly 16 digits
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="expiry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date</FormLabel>
                            <FormControl>
                              <Input placeholder="MM/YY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cvc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CVC</FormLabel>
                            <FormControl>
                              <Input placeholder="123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full mt-4"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Pay ${service.price.toFixed(2)} ${getCurrencySymbol(service.currency || 'TND')}`
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">{service.title}</h3>
                <p className="text-sm text-muted-foreground">By {service.user?.username}</p>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span>{service.price.toFixed(2)} {getCurrencySymbol(service.currency || 'TND')}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-2">
                  <span>Total:</span>
                  <span>{service.price.toFixed(2)} {getCurrencySymbol(service.currency || 'TND')}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 text-sm text-muted-foreground">
              <p>
                By completing this purchase, you agree to the terms and conditions of WorkiT.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;