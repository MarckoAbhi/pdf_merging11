import { Shield, Lock, Unlock, Layers, FileDown, ArrowRightLeft, Mail, Github, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

const toolLinks = [
  { href: '/encrypt', label: 'Encrypt PDF', icon: Lock },
  { href: '/unlock', label: 'Unlock PDF', icon: Unlock },
  { href: '/merge', label: 'Merge PDFs', icon: Layers },
  { href: '/compress', label: 'Compress PDF', icon: FileDown },
  { href: '/convert', label: 'Convert PDF', icon: ArrowRightLeft },
];

const companyLinks = [
  { href: '/about', label: 'About Us' },
  { href: '/about', label: 'Privacy Policy' },
  { href: '/about', label: 'Terms of Service' },
  { href: '/about', label: 'Contact' },
];

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl gradient-primary">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                PDF<span className="text-gradient">Protect</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Free, secure, and fast PDF tools. Encrypt, unlock, merge, compress, and convert your documents with military-grade security.
            </p>
            <div className="flex items-center gap-3">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
              <a 
                href="mailto:contact@pdfprotect.com"
                className="p-2 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* PDF Tools */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">PDF Tools</h3>
            <ul className="space-y-3">
              {toolLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link 
                      to={link.href}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter / CTA */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Why Choose Us?</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                100% Free, No Hidden Fees
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                No Signup Required
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                Files Never Leave Your Device
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                Military-Grade Encryption
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                Support for Large Files (500MB)
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PDFProtect. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Made with ❤️ for your privacy and security
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
