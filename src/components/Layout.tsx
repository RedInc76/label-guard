import { ReactNode } from 'react';
import { Navigation } from './Navigation';
import { InitialDisclaimerDialog } from './InitialDisclaimerDialog';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-subtle to-background">
      <InitialDisclaimerDialog />
      <main className="pb-28">
        {children}
      </main>
      <Navigation />
    </div>
  );
};