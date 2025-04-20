import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import ServiceCard from '@/components/services/service-card';
import { ServiceWithUser, serviceCategories } from '@/lib/types';

const ServicesList: React.FC = () => {
  // Filter state
  const [category, setCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('any');
  const [deliveryTime, setDeliveryTime] = useState<string>('any-time');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Fetch services
  const { data: services, isLoading, error } = useQuery<ServiceWithUser[]>({
    queryKey: ['/api/services'],
  });

  // Apply filters
  const filteredServices = React.useMemo(() => {
    if (!services) return [];

    return services.filter((service) => {
      // Category filter
      if (category && category !== 'all' && service.category !== category) {
        return false;
      }

      // Price range filter
      if (priceRange && priceRange !== 'any') {
        const [min, max] = priceRange.split('-').map(Number);
        if (min && service.price < min) return false;
        if (max && service.price > max) return false;
      }

      // Delivery time filter
      if (deliveryTime && deliveryTime !== 'any-time' && service.deliveryTime !== deliveryTime) {
        return false;
      }

      // Search term filter (title and description)
      if (
        searchTerm &&
        !service.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !service.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [services, category, priceRange, deliveryTime, searchTerm]);

  // Handle filter reset
  const handleReset = () => {
    setCategory('all');
    setPriceRange('any');
    setDeliveryTime('any-time');
    setSearchTerm('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Browse Services</h1>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg p-4 mb-8 shadow-sm">
        <div className="mb-4">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <Input
            id="search"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-1/3 md:w-1/4 lg:w-1/5">
            <Label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {serviceCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-1/3 md:w-1/4 lg:w-1/5">
            <Label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price Range
            </Label>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger id="price">
                <SelectValue placeholder="Any Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Price</SelectItem>
                <SelectItem value="5-50">5 - 50 DNT</SelectItem>
                <SelectItem value="50-100">50 - 100 DNT</SelectItem>
                <SelectItem value="100-500">100 - 500 DNT</SelectItem>
                <SelectItem value="500-99999">500+ DNT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-1/3 md:w-1/4 lg:w-1/5">
            <Label htmlFor="delivery-time" className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Time
            </Label>
            <Select value={deliveryTime} onValueChange={setDeliveryTime}>
              <SelectTrigger id="delivery-time">
                <SelectValue placeholder="Any Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any-time">Any Time</SelectItem>
                <SelectItem value="Express 24H">Express 24H</SelectItem>
                <SelectItem value="Up to 3 days">Up to 3 days</SelectItem>
                <SelectItem value="Up to 7 days">Up to 7 days</SelectItem>
                <SelectItem value="Anytime">Anytime</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto flex items-end space-x-2">
            <Button type="button" variant="default">
              Apply Filters
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="text-center py-10">
          <p>Loading services...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">
          <p>Error loading services. Please try again later.</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-10">
          <p>No services match your criteria. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicesList;
