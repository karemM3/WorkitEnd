import React from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { serviceCategories, currencies } from '@/lib/types';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import FileUpload from '@/components/ui/file-upload';

// Define service form schema
const serviceFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  price: z.coerce.number().positive('Price must be a positive number'),
  currency: z.string().default('TND'),
  category: z.string().min(1, 'Please select a category'),
  deliveryTime: z.string().optional(),
  image: z.any().optional(),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

const CreateService: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Initialize form
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      currency: 'TND',
      category: '',
      deliveryTime: '',
    },
  });

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormValues) => {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('price', data.price.toString());
      formData.append('currency', data.currency);
      formData.append('category', data.category);
      
      if (data.deliveryTime) {
        formData.append('deliveryTime', data.deliveryTime);
      }
      
      if (data.image) {
        formData.append('image', data.image);
      }

      // Use apiRequest which already handles credentials and error checking
      return await apiRequest('POST', '/api/services', formData, true); // true = use FormData
    },
    onSuccess: (data) => {
      // Invalidate main services list
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      
      // Invalidate user's services in profile - more specific pattern
      if (data.userId) {
        queryClient.invalidateQueries({ queryKey: ['/api/users', String(data.userId), 'services'] });
        
        // Invalidate user stats to update the service count - more specific pattern
        queryClient.invalidateQueries({ queryKey: ['/api/users', String(data.userId), 'stats'] });
      }
      
      // Also invalidate global user data
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      toast({
        title: 'Service Created',
        description: 'Your service has been created successfully',
      });
      setLocation('/services');
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
  const onSubmit = (data: ServiceFormValues) => {
    createServiceMutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Create a New Service</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., I will design a professional logo for your business"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Choose a clear, specific title that describes your service.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your service in detail..."
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Explain what you'll deliver, your process, and why clients should choose you.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          step="0.01"
                          placeholder="e.g., 100"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Set a competitive price for your service.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem className="w-32">
                      <FormLabel>Currency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>&nbsp;</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the category that best fits your service.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deliveryTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Time</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select delivery time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Express 24H">Express 24H</SelectItem>
                        <SelectItem value="Up to 3 days">Up to 3 days</SelectItem>
                        <SelectItem value="Up to 7 days">Up to 7 days</SelectItem>
                        <SelectItem value="Anytime">Anytime</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Set realistic expectations for your delivery timeframe.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Service Image</FormLabel>
                    <FormControl>
                      <FileUpload
                        id="service-image"
                        label=""
                        accept="image/*"
                        value={value}
                        onChange={onChange}
                        {...fieldProps}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a high-quality image that represents your service.
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
                onClick={() => setLocation('/services')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createServiceMutation.isPending}
              >
                {createServiceMutation.isPending ? 'Creating...' : 'Create Service'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateService;
