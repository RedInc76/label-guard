import { ReactNode } from 'react';
import { Navigation } from './Navigation';
import { InitialDisclaimerDialog } from './InitialDisclaimerDialog';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <InitialDisclaimerDialog />
      <main className="pb-20">
        {children}
      </main>
      <Navigation />
    </div>
  );
};