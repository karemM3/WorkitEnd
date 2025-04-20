// User types
export interface User {
  id: number | string;
  _id?: string; // For MongoDB compatibility
  username: string;
  email: string;
  fullName: string;
  role: 'freelancer' | 'employer' | 'admin';
  status?: 'active' | 'blocked';
  blockedReason?: string;
  bio?: string;
  profilePicture?: string;
  createdAt: Date;
}

// Service types
export interface Service {
  id: number;
  userId: number;
  title: string;
  description: string;
  price: number;
  currency?: string;
  category: string;
  status: 'active' | 'inactive';
  image?: string;
  deliveryTime?: string;
  createdAt: Date;
  user?: User;
}

export interface ServiceWithUser extends Service {
  user: User;
}

// Job types
export interface Job {
  id: number;
  userId: number;
  title: string;
  description: string;
  budget: number;
  currency?: string;
  category: string;
  location?: string;
  jobType: string;
  status: 'open' | 'closed';
  image?: string;
  createdAt: Date;
  user?: User;
}

export interface JobWithUser extends Job {
  user: User;
}

// Application types
export interface Application {
  id: number;
  jobId: number;
  userId: number;
  description: string;
  coverLetter?: string; // Field from MongoDB schema
  resumeFile?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  user?: User;
  job?: Job;
}

// Order types
export interface Order {
  id: number;
  serviceId: number;
  buyerId: number;
  sellerId: number;
  paymentMethod: 'card' | 'bank_transfer';
  totalPrice: number;
  status: string;
  createdAt: Date;
  service?: Service;
}

// Review types
export interface Review {
  id: number;
  serviceId: number;
  userId: number;
  rating: number;
  comment?: string;
  createdAt: Date;
  user?: User;
}

// Form types
export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  role: 'freelancer' | 'employer';
}

export interface ServiceForm {
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  deliveryTime?: string;
  image?: File;
}

export interface JobForm {
  title: string;
  description: string;
  budget: number;
  currency: string;
  category: string;
  location?: string;
  jobType: string;
  image?: File;
}

export interface ApplicationForm {
  description: string;
  resumeFile?: File;
}

export interface ReviewForm {
  rating: number;
  comment?: string;
}

// Category options
export const serviceCategories = [
  'Web Development',
  'Mobile Development',
  'Design',
  'Writing',
  'Marketing',
  'Video & Animation',
  'Music & Audio',
  'Programming & Tech',
  'Business',
  'Lifestyle',
  'Other'
];

export const jobTypes = [
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Internship'
];

export const serviceStatuses = [
  'active',
  'inactive'
];

export const jobStatuses = [
  'open',
  'closed'
];

export const applicationStatuses = [
  'pending',
  'approved',
  'rejected'
];

export const paymentMethods = [
  { value: 'card', label: 'Card Payment' },
  { value: 'bank_transfer', label: 'Bank Transfer' }
];

export const currencies = [
  { value: 'TND', label: 'Tunisian Dinar (DNT)', symbol: 'DNT' },
  // Keep other currencies for future compatibility but set TND as the only active one
];
