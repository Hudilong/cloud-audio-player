'use client';

import React from 'react';

function MainContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div>{children}</div>;
}

export default MainContent;
