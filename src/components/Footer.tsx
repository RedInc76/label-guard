import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/30 py-6 mt-12">
      <div className="container max-w-md mx-auto px-4">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <div className="flex gap-4">
            <Link 
              to="/terms" 
              className="hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Términos y Condiciones
            </Link>
          </div>
          <div className="text-xs text-center">
            © 2025 LabelGuard • Herramienta informativa
          </div>
          <div className="text-xs text-center max-w-sm text-muted-foreground/80">
            Esta aplicación no sustituye el consejo médico profesional
          </div>
        </div>
      </div>
    </footer>
  );
};
