import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableCell, TableHead, TableHeader, TableRow, TableBody } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BadgeCheck, Settings, Users, Shield, ChevronRight } from 'lucide-react';

export default function AdminProfile() {
  const { user, isLoading } = useAuth();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    // Redirect if not an admin
    if (!isLoading && (!user || user.role !== 'admin')) {
      setLocation('/auth/login');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null; // Redirecting from useEffect
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Profile sidebar */}
        <div className="w-full lg:w-1/3">
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Admin Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-2">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage
                  src={user.profilePicture || ''}
                  alt={user.fullName || user.username}
                />
                <AvatarFallback className="text-xl">
                  {getInitials(user.fullName || user.username)}
                </AvatarFallback>
              </Avatar>
              
              <h2 className="text-2xl font-bold">{user.fullName}</h2>
              <p className="text-gray-500 mb-2">@{user.username}</p>
              
              <Badge className="mb-4" variant="secondary">
                <Shield className="h-3 w-3 mr-1" />
                Administrator
              </Badge>
              
              <Button className="w-full mb-2" onClick={() => setLocation('/profile/edit')}>
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              
              <Button 
                className="w-full" 
                variant="secondary"
                onClick={() => setLocation('/admin/dashboard')}
              >
                <Users className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
          

        </div>
        
        {/* Admin activity */}
        <div className="w-full lg:w-2/3">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Admin Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableHead className="w-1/3">Full Name</TableHead>
                    <TableCell>{user.fullName || 'Not set'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableCell>{user.username}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableCell>{user.email}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableCell>
                      <Badge>Administrator</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                        Active
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <div className="flex justify-between gap-4 mb-6">
            <Card className="w-1/2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={() => setLocation('/admin/dashboard')}>
                    <Users className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setLocation('/profile/edit')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="w-1/2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Platform Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm">All systems operational</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last checked: {new Date().toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Admin Access Log</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{new Date().toLocaleString()}</TableCell>
                    <TableCell>Dashboard Login</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Success
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}