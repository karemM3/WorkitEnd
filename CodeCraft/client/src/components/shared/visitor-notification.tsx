import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type VisitorNotificationProps = {
  feature: string;
  action?: string;
};

/**
 * A reusable component that displays a notification for visitors
 * about features that require authentication
 */
export const VisitorNotification = ({
  feature,
  action = "use this feature",
}: VisitorNotificationProps) => {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Visitor Access Restricted</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          You need to be logged in to {action}. Visitors can browse the platform but cannot interact with it (e.g., 
          creating jobs, ordering services, applying to positions, or leaving reviews).
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="outline" asChild>
            <Link href="/auth/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/register">Create an Account</Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

/**
 * A toast-style notification component for visitors
 */
export const VisitorToastNotification = ({
  feature,
  action = "use this feature",
}: VisitorNotificationProps) => {
  return (
    <div className="p-4 rounded-md bg-destructive text-destructive-foreground">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-medium">Visitor Access Restricted</h3>
          <p className="text-sm mt-1">
            You need to be logged in to {action}. Please create an account or log in to continue.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * A dialog notification component for visitors
 */
interface VisitorNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  action?: string;
  title?: string;
  description?: string;
}

export const VisitorNotificationDialog = ({
  feature,
  action = "use this feature",
  open,
  onOpenChange,
  title = "Visitor Access Restricted",
  description,
}: VisitorNotificationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {description || `You need to be logged in to ${action}. Visitors can browse the platform but cannot interact with it.`}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm">
          Creating an account allows you to access all features including creating jobs, ordering services, 
          applying to positions, and leaving reviews.
        </p>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="sm:flex-1"
            asChild
            onClick={() => onOpenChange(false)}
          >
            <Link href="/auth/login">Log In</Link>
          </Button>
          <Button
            className="sm:flex-1"
            asChild
            onClick={() => onOpenChange(false)}
          >
            <Link href="/auth/register">Create an Account</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};