import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    companyId: string;
    managerId?: string;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      companyId: string;
      managerId?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    companyId: string;
    managerId?: string;
  }
}
