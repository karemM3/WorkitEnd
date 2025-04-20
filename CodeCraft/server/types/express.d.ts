import { User as UserType } from '@shared/schema';

declare global {
  namespace Express {
    interface User extends UserType {}
  }
}