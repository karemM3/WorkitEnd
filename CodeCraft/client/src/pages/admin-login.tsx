import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";

/**
 * Admin Login Page Component
 * 
 * This page provides a direct admin login button that will create the admin user
 * (if it doesn't exist) and log them in automatically.
 * 
 * This is useful for development when using in-memory databases that reset on restart.
 */
export default function AdminLoginPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Function to handle the one-click admin login
  const handleDirectAdminLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the direct admin login endpoint
      const response = await fetch('/api/admin-direct/login');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to log in admin user');
      }
      
      const data = await response.json();
      
      // Show success message
      toast({
        title: "Admin login successful",
        description: "You have been logged in as the admin user.",
      });
      
      setSuccess(true);
      
      // Redirect to admin dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/admin/dashboard';
      }, 1500);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Automatically create and login as admin user
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert variant="default" className="bg-green-50 border-green-600 text-green-800">
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                You have been logged in as admin. Redirecting to admin dashboard...
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <p className="text-sm text-center text-muted-foreground">
              This page provides a direct login link that will:
            </p>
            <ul className="text-sm list-disc pl-6 text-muted-foreground">
              <li>Create the admin user if it doesn't exist</li>
              <li>Update the admin password if it already exists</li>
              <li>Automatically log you in as the admin user</li>
            </ul>
            <p className="text-sm font-medium text-center mt-4">
              Admin Credentials:
            </p>
            <div className="bg-muted p-3 rounded text-sm">
              <p><strong>Username:</strong> oussama</p>
              <p><strong>Password:</strong> oussama123</p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3">
          <Button 
            className="w-full" 
            onClick={handleDirectAdminLogin} 
            disabled={loading || success}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {loading ? "Logging in..." : "Login as Admin"}
          </Button>
          
          <div className="text-sm text-center text-muted-foreground">
            <Link to="/auth/login" className="text-primary hover:underline">
              Back to regular login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}