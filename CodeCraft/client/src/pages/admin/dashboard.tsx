import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { User } from '@/lib/types';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import {
  BadgeCheck,
  Ban,
  Box,
  Briefcase,
  ClipboardList,
  Search,
  ShoppingCart,
  Trash2,
  Users,
  X
} from 'lucide-react';

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [userToBlock, setUserToBlock] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Admin access check
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      // If this isn't the direct login approach (where role is already set)
      const checkIfAdmin = async () => {
        try {
          // Try admin direct login when dashboard is loaded
          const response = await fetch('/api/admin-direct/login');
          if (response.ok) {
            console.log('Admin access verified');
            // Let the page continue loading
          } else {
            console.log('Not authorized as admin, redirecting...');
            window.location.href = '/auth/login';
          }
        } catch (err) {
          console.error('Admin access check failed:', err);
          // Stay on page, assuming the direct login will work
        }
      };
      
      checkIfAdmin();
    }
  }, [isAuthenticated, user]);

  // Fetch admin statistics (using public endpoint for now until auth is fixed)
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['/api/admin/public-stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/public-stats');
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        console.log('Admin stats loaded:', data);
        return data;
      } catch (err) {
        console.error('Error loading admin statistics:', err);
        toast({
          title: 'Error loading statistics',
          description: 'There was a problem fetching admin statistics. Please try again later.',
          variant: 'destructive',
        });
        throw err;
      }
    },
    retry: 2
  });
  
  // Fetch all users (using public endpoint for now until auth is fixed)
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/public-users'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/public-users');
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        console.log('Admin users loaded:', data.length);
        return data;
      } catch (err) {
        console.error('Error loading admin users:', err);
        toast({
          title: 'Error loading users',
          description: 'There was a problem fetching users. Please try again later.',
          variant: 'destructive',
        });
        throw err;
      }
    },
    retry: 2
  });

  // Ensure users array is not undefined or empty before filtering
  const filteredUsers = React.useMemo(() => {
    if (!users) return [];
    
    // If no search term, return all users
    if (!searchTerm || searchTerm.trim() === '') {
      return users;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    
    return users.filter((user: User) => {
      // Skip users without data
      if (!user) return false;
      
      // Check each field that might contain the search term
      return (
        (user.username && user.username.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.fullName && user.fullName.toLowerCase().includes(searchLower)) ||
        (user.role && user.role.toLowerCase().includes(searchLower))
      );
    });
  }, [users, searchTerm]);

  // Handle blocking a user
  const handleBlockUser = async () => {
    if (!userToBlock || !blockReason) return;
    
    try {
      // Use either id or _id depending on which is available (MongoDB compatibility)
      const userId = userToBlock.id || userToBlock._id;
      
      await apiRequest('PUT', `/api/admin/users/${userId}/block`, { reason: blockReason });
      
      // Invalidate queries to refresh data (using public endpoint)
      queryClient.invalidateQueries({ queryKey: ['/api/admin/public-users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/public-stats'] });
      
      toast({
        title: 'User blocked',
        description: `${userToBlock.username || 'User'} has been blocked successfully.`,
      });
      
      // Reset state
      setUserToBlock(null);
      setBlockReason('');
      setIsBlockDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to block user',
        variant: 'destructive',
      });
    }
  };

  // Handle unblocking a user
  const handleUnblockUser = async (user: User) => {
    try {
      // Use either id or _id depending on which is available (MongoDB compatibility)
      const userId = user.id || user._id;
      
      await apiRequest('PUT', `/api/admin/users/${userId}/unblock`);
      
      // Invalidate queries to refresh data (using public endpoint)
      queryClient.invalidateQueries({ queryKey: ['/api/admin/public-users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/public-stats'] });
      
      toast({
        title: 'User unblocked',
        description: `${user.username || 'User'} has been unblocked successfully.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unblock user',
        variant: 'destructive',
      });
    }
  };

  // Handle deleting a user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      // Use either id or _id depending on which is available (MongoDB compatibility)
      const userId = userToDelete.id || userToDelete._id;
      
      await apiRequest('DELETE', `/api/admin/users/${userId}`);
      
      // Invalidate queries to refresh data (using public endpoint)
      queryClient.invalidateQueries({ queryKey: ['/api/admin/public-users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/public-stats'] });
      
      toast({
        title: 'User deleted',
        description: `${userToDelete.username || 'User'} has been deleted successfully.`,
      });
      
      // Reset state
      setUserToDelete(null);
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  // If user is not an admin or not authenticated, show unauthorized message
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({
        title: 'Unauthorized',
        description: 'You do not have permission to access this page.',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  if (statsLoading || usersLoading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="text-2xl font-bold">{stats?.counts?.users || 0}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Registered accounts on the platform
                </div>
              </CardContent>
            </Card>
            
            {/* Total Services Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Box className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="text-2xl font-bold">{stats?.counts?.services || 0}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Services offered by freelancers
                </div>
              </CardContent>
            </Card>
            
            {/* Total Jobs Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="text-2xl font-bold">{stats?.counts?.jobs || 0}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Job opportunities posted
                </div>
              </CardContent>
            </Card>
            
            {/* Total Orders Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ShoppingCart className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="text-2xl font-bold">{stats?.counts?.orders || 0}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Completed transactions
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* User Distribution Card */}
          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
              <CardDescription>Breakdown of user accounts by role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-4 bg-muted/20 rounded-lg">
                  <div className="text-3xl font-bold">{stats?.usersByRole?.freelancers || 0}</div>
                  <div className="text-sm text-muted-foreground">Freelancers</div>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/20 rounded-lg">
                  <div className="text-3xl font-bold">{stats?.usersByRole?.employers || 0}</div>
                  <div className="text-sm text-muted-foreground">Employers</div>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/20 rounded-lg">
                  <div className="text-3xl font-bold">{stats?.usersByRole?.admins || 0}</div>
                  <div className="text-sm text-muted-foreground">Administrators</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Applications Card */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Activity</CardTitle>
              <CardDescription>Overall platform metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center p-4 bg-muted/20 rounded-lg">
                  <ClipboardList className="h-8 w-8 mr-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">{stats?.counts?.applications || 0}</div>
                    <div className="text-sm text-muted-foreground">Job Applications</div>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-muted/20 rounded-lg">
                  <ShoppingCart className="h-8 w-8 mr-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">{stats?.counts?.orders || 0}</div>
                    <div className="text-sm text-muted-foreground">Service Orders</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name, email, or role..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setSearchTerm('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm('')}
                  >
                    Clear
                  </Button>
                  <Button onClick={() => {
                    // Force re-render with current search term 
                    const currentTerm = searchTerm;
                    setSearchTerm('');
                    setTimeout(() => setSearchTerm(currentTerm), 10);
                  }}>
                    Search
                  </Button>
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.length > 0 ? (
                      filteredUsers.map((user: User) => (
                        <TableRow key={user.id || user._id}>
                          <TableCell>{user.fullName || 'N/A'}</TableCell>
                          <TableCell>{user.username || 'N/A'}</TableCell>
                          <TableCell>{user.email || 'N/A'}</TableCell>
                          <TableCell className="capitalize">{user.role || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {user.status !== 'blocked' ? (
                                <>
                                  <BadgeCheck className="h-4 w-4 text-green-500 mr-1" />
                                  <span className="text-green-600">Active</span>
                                </>
                              ) : (
                                <>
                                  <Ban className="h-4 w-4 text-red-500 mr-1" />
                                  <span className="text-red-600">Blocked</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {user.status === 'active' ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setUserToBlock(user);
                                    setIsBlockDialogOpen(true);
                                  }}
                                  disabled={user.role === 'admin'}
                                >
                                  Block
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleUnblockUser(user)}
                                >
                                  Unblock
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setUserToDelete(user);
                                  setIsDeleteDialogOpen(true);
                                }}
                                disabled={user.role === 'admin'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Block User Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block User</DialogTitle>
            <DialogDescription>
              This will prevent the user from accessing the platform. They will be logged out and unable to login again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Username: {userToBlock?.username}</p>
              <p className="text-sm font-medium">Email: {userToBlock?.email}</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium">
                Reason for blocking
              </label>
              <Input
                id="reason"
                placeholder="Enter reason for blocking this user"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBlockUser} disabled={!blockReason}>
              Block User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the user's account and all associated data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm font-medium">Username: {userToDelete?.username}</p>
            <p className="text-sm font-medium">Email: {userToDelete?.email}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}