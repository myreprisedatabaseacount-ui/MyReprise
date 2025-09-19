'use client';

import { ReactNode } from 'react';
import { UserSidebar } from '../../../components/user/UserSidebar';
import { UserTopBar } from '../../../components/user/UserTopBar';

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen overflow-hidden flex w-full bg-white">
      <UserSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <UserTopBar />
        <main className="flex-1 p-4 md:p-6 bg-white overflow-y-auto">
          <div className="max-w-7xl mx-auto mt-14">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


