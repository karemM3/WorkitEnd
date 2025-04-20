import { useEffect } from 'react';
import { Switch, Route, useLocation } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from './lib/auth';

// Layout
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

// Pages
import Home from '@/pages/home';
import ServicesList from '@/pages/services/index';
import ServiceDetail from '@/pages/services/service-detail';
import CreateService from '@/pages/services/create-service';
import JobsList from '@/pages/jobs/index';
import JobDetail from '@/pages/jobs/job-detail';
import CreateJob from '@/pages/jobs/create-job';
import Login from '@/pages/auth/login';
import Register from '@/pages/auth/register';
import Profile from '@/pages/profile/index';
import EditProfile from '@/pages/profile/edit';
import UserProfile from '@/pages/users/[id]/profile';
import About from '@/pages/about';
import ContactFreelancer from '@/pages/contact-freelancer';
import Payment from '@/pages/payment';
import NotFound from '@/pages/not-found';
import VisitorDemo from '@/pages/visitor-demo';
import ComingSoon from '@/pages/coming-soon';
import AdminDashboard from '@/pages/admin/dashboard';
import AdminProfile from '@/pages/admin/profile';

function Router() {
  const { checkAuth, isAuthenticated, user } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Switch>
          {/* Public routes */}
          <Route path="/" component={Home} />
          <Route path="/services" component={ServicesList} />
          <Route path="/jobs" component={JobsList} />
          <Route path="/auth/login" component={Login} />
          <Route path="/auth/register" component={Register} />
          <Route path="/about" component={About} />
          <Route path="/visitor-demo" component={VisitorDemo} />

          {/* Protected routes */}
          <Route path="/services/create">
            {isAuthenticated && user?.role === 'freelancer' ? <CreateService /> : <Login />}
          </Route>
          <Route path="/jobs/create">
            {isAuthenticated && user?.role === 'employer' ? <CreateJob /> : <Login />}
          </Route>
          
          {/* Detail routes (must be after more specific routes) */}
          <Route path="/services/:id" component={ServiceDetail} />
          <Route path="/jobs/:id" component={JobDetail} />
          <Route path="/profile">
            {isAuthenticated ? <Profile /> : <Login />}
          </Route>
          <Route path="/profile/edit">
            {isAuthenticated ? <EditProfile /> : <Login />}
          </Route>

          {/* Admin routes */}
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/profile" component={AdminProfile} />

          {/* Special routes */}
          <Route path="/contact-freelancer/:id" component={ContactFreelancer} />
          <Route path="/payment/:serviceId" component={Payment} />
          <Route path="/users/:id/profile" component={UserProfile} />
          <Route path="/coming-soon" component={ComingSoon} />

          {/* Fallback */}
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
