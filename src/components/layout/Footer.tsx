import { Shield, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg gradient-primary">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">
              PDF<span className="text-gradient">Protect</span>
            </span>
          </Link>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <p className="flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-destructive fill-destructive" /> for your privacy
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} PDFProtect</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
