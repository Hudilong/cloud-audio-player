'use client';

import { useSession } from 'next-auth/react';
import React from 'react';
import MobileTabs from './MobileTabs';

function MainContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = useSession();
  return (
    <div>
      {session.status === 'authenticated' && <MobileTabs />}
      {children}
    </div>
  );
}

export default MainContent;
