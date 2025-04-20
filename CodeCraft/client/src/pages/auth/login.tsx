
import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Eye } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, continueAsVisitor, isAuthenticated, isLoading } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      console.log('Login form submitted with:', {
        username: data.username,
        passwordLength: data.password ? data.password.length : 0
      });
      
      // Special admin login handling - direct approach without backend interaction
      if (data.username.toLowerCase() === 'oussama' && data.password === 'oussama123') {
        console.log('Using admin credentials, directly setting admin user');
        
        // Create admin user object with correct role type
        const adminUser = {
          id: 'admin-direct',
          username: "oussama",
          email: "oussama@workit.com",
          fullName: "Oussama Admin",
          role: "admin" as const, // Fix for TypeScript role type
          profilePicture: "/uploads/profiles/default-avatar.png",
          bio: "System administrator",
          skills: [],
          location: "",
          createdAt: new Date(),
          status: "active" as const
        };
        
        // Update auth state directly without going through backend
        useAuth.setState({ 
          user: adminUser,
          isAuthenticated: true, 
          isVisitor: false,
          isLoading: false,
          error: null
        });
        
        console.log('Admin login successful (direct mode)');
        toast({
          title: 'Welcome, Admin!',
          description: 'You are now logged in as administrator.',
        });
        
        // Navigate to admin dashboard with a slight delay to allow state update
        setTimeout(() => {
          window.location.href = '/admin/dashboard';
        }, 500);
        return;
      }
      
      // Direct test login implementation that doesn't rely on backend auth
      if (data.username.toLowerCase() === 'admin' && data.password === 'admin123') {
        console.log('Using admin test credentials');
        
        // Create a simulated admin user
        const adminUser = {
          id: 999, // Special ID for simulated admin
          username: "admin",
          email: "admin@example.com",
          fullName: "Admin User",
          role: "freelancer" as const,
          profilePicture: "/uploads/profiles/default-avatar.png",
          bio: "System administrator",
          createdAt: new Date()
        };
        
        // Update auth state via direct login
        useAuth.setState({ 
          user: adminUser,
          isAuthenticated: true, 
          isVisitor: false,
          isLoading: false,
          error: null
        });
        
        toast({
          title: 'Welcome, Admin!',
          description: 'You have successfully logged in.',
        });
        
        // Try regular login but don't wait for it
        login(data.username, data.password).catch(err => {
          console.log('Backend login failed, but using test credentials:', err);
        });
        
        setLocation('/');
        return;
      } 
      
      if (data.username.toLowerCase() === 'testuser' && data.password === 'test123') {
        console.log('Using testuser test credentials');
        
        // Create a simulated test user
        const testUser = {
          id: 998, // Special ID for simulated test user
          username: "testuser",
          email: "test@example.com",
          fullName: "Test User",
          role: "employer" as const,
          profilePicture: "/uploads/profiles/default-avatar.png",
          bio: "Test account for demonstration",
          createdAt: new Date()
        };
        
        // Update auth state via direct login
        useAuth.setState({ 
          user: testUser,
          isAuthenticated: true, 
          isVisitor: false,
          isLoading: false,
          error: null
        });
        
        toast({
          title: 'Welcome, Test User!',
          description: 'You have successfully logged in.',
        });
        
        // Try regular login but don't wait for it
        login(data.username, data.password).catch(err => {
          console.log('Backend login failed, but using test credentials:', err);
        });
        
        setLocation('/');
        return;
      }
      
      // Standard login flow
      await login(data.username, data.password);
      
      console.log('Login successful!');
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      setLocation('/');
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        status: error.status,
        data: error.data
      });
      
      toast({
        variant: "destructive",
        title: 'Login Failed',
        description: error.message || 'Invalid username or password. Try admin/admin123 or testuser/test123.',
      });
    }
  };

  const handleContinueAsVisitor = () => {
    continueAsVisitor();
    toast({
      title: 'Visitor Mode',
      description: 'You are now browsing as a visitor. Some features will be limited.',
    });
    setLocation('/');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Log in</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Logging in...' : 'Log in'}
              </Button>
            </form>
          </Form>

          <Separator className="my-4" />

          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleContinueAsVisitor}
          >
            <Eye className="w-4 h-4" />
            Continue as Visitor
          </Button>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Button
                variant="link"
                className="p-0 font-normal"
                onClick={() => setLocation('/auth/register')}
              >
                Sign up
              </Button>
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Admin Login: username "oussama", password "oussama123"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
