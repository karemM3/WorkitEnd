import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Eye, Menu, PlusSquare, UserCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const Navbar: React.FC = () => {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isVisitor, logout } = useAuth();
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and desktop navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary">
                WorkiT
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/" className="border-primary text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Home
              </Link>
              <Link href="/services" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Services
              </Link>
              <Link href="/jobs" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Jobs
              </Link>
              <Link href="/about" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                About
              </Link>
              {isVisitor && (
                <Link href="/visitor-demo" className="border-transparent text-blue-500 hover:border-blue-300 hover:text-blue-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  <Eye className="h-3 w-3 mr-1" />
                  Visitor Demo
                </Link>
              )}
            </div>
          </div>

          {/* User menu (desktop) */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                {/* Hide Create button for admin users */}
                {user.role !== 'admin' && (
                  <DropdownMenu open={createMenuOpen} onOpenChange={setCreateMenuOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="default" size="sm">
                        <PlusSquare className="h-4 w-4 mr-2" />
                        Create
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {user.role === 'freelancer' && (
                        <DropdownMenuItem onClick={() => setLocation('/services/create')}>
                          Create Service
                        </DropdownMenuItem>
                      )}
                      {user.role === 'employer' && (
                        <DropdownMenuItem onClick={() => setLocation('/jobs/create')}>
                          Post a Job
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-0">
                      <Avatar>
                        <AvatarImage src={user.profilePicture} />
                        <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLocation(user.role === 'admin' ? `/admin/profile` : `/profile`)}>
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation('/profile/edit')}>
                      Edit Profile
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem onClick={() => setLocation('/admin/dashboard')}>
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : isVisitor ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm">
                  <Eye className="h-4 w-4 mr-2" />
                  <span>Visitor Mode</span>
                </div>
                <Button variant="ghost" onClick={() => setLocation('/auth/login')}>
                  Log in
                </Button>
                <Button onClick={() => setLocation('/auth/register')}>Sign up</Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => setLocation('/auth/login')}>
                  Log in
                </Button>
                <Button onClick={() => setLocation('/auth/register')}>Sign up</Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="py-4 flex flex-col space-y-4">
                  <Link href="/" className="text-base font-medium text-gray-900">
                    Home
                  </Link>
                  <Link href="/services" className="text-base font-medium text-gray-900">
                    Services
                  </Link>
                  <Link href="/jobs" className="text-base font-medium text-gray-900">
                    Jobs
                  </Link>
                  <Link href="/about" className="text-base font-medium text-gray-900">
                    About
                  </Link>
                  {isVisitor && (
                    <Link href="/visitor-demo" className="text-base font-medium text-blue-600 flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      Visitor Demo
                    </Link>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    {isAuthenticated && user ? (
                      <>
                        <div className="flex items-center space-x-3 mb-4">
                          <Avatar>
                            <AvatarImage src={user.profilePicture} />
                            <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.username}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Link href={user.role === 'admin' ? "/admin/profile" : "/profile"} className="text-base font-medium text-gray-900">
                            Profile
                          </Link>
                          {/* Hide create links for admin users */}
                          {user.role !== 'admin' && (
                            <>
                              {user.role === 'freelancer' && (
                                <Link href="/services/create" className="text-base font-medium text-gray-900">
                                  Create Service
                                </Link>
                              )}
                              {user.role === 'employer' && (
                                <Link href="/jobs/create" className="text-base font-medium text-gray-900">
                                  Post a Job
                                </Link>
                              )}
                            </>
                          )}
                          {user.role === 'admin' && (
                            <Link href="/admin/dashboard" className="text-base font-medium text-gray-900">
                              Admin Dashboard
                            </Link>
                          )}
                          <Button variant="destructive" onClick={handleLogout}>
                            Logout
                          </Button>
                        </div>
                      </>
                    ) : isVisitor ? (
                      <>
                        <div className="flex items-center space-x-2 mb-4 bg-blue-50 text-blue-600 p-2 rounded-md">
                          <Eye className="h-4 w-4" />
                          <span className="text-sm font-medium">Visitor Mode</span>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Button
                            variant="outline"
                            onClick={() => setLocation('/auth/login')}
                            className="w-full"
                          >
                            Log in
                          </Button>
                          <Button
                            onClick={() => setLocation('/auth/register')}
                            className="w-full"
                          >
                            Sign up
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col space-y-2">
                        <Button
                          variant="outline"
                          onClick={() => setLocation('/auth/login')}
                          className="w-full"
                        >
                          Log in
                        </Button>
                        <Button
                          onClick={() => setLocation('/auth/register')}
                          className="w-full"
                        >
                          Sign up
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
