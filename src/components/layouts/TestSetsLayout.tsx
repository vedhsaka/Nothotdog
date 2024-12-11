import React from 'react';
import Sidebar from '../navigation/Sidebar';
import { Header } from '../navigation/Header';

interface TestSetsLayoutProps {
  children: React.ReactNode;
}

export function TestSetsLayout({ children }: TestSetsLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}