import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Shield, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  showStrength?: boolean;
  confirmPassword?: boolean;
  confirmValue?: string;
  onConfirmChange?: (value: string) => void;
}

const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-destructive' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-warning' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-accent' };
  return { score, label: 'Strong', color: 'bg-success' };
};

export const PasswordInput = ({
  value,
  onChange,
  label = 'Password',
  placeholder = 'Enter password',
  showStrength = false,
  confirmPassword = false,
  confirmValue = '',
  onConfirmChange,
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = useMemo(() => getPasswordStrength(value), [value]);
  const passwordsMatch = confirmPassword && value && confirmValue && value === confirmValue;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password" className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          {label}
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Eye className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </div>

        {showStrength && value && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    i <= strength.score ? strength.color : 'bg-border'
                  )}
                />
              ))}
            </div>
            <p className={cn(
              'text-xs font-medium',
              strength.score <= 1 ? 'text-destructive' :
              strength.score <= 2 ? 'text-warning' :
              strength.score <= 3 ? 'text-accent' : 'text-success'
            )}>
              Password strength: {strength.label}
            </p>
          </motion.div>
        )}
      </div>

      {confirmPassword && onConfirmChange && (
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              value={confirmValue}
              onChange={(e) => onConfirmChange(e.target.value)}
              placeholder="Confirm password"
              className={cn(
                'pr-16',
                confirmValue && (passwordsMatch ? 'border-success' : 'border-destructive')
              )}
            />
            <div className="absolute right-0 top-0 h-full flex items-center gap-1 px-2">
              {confirmValue && (
                passwordsMatch ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <X className="w-4 h-4 text-destructive" />
                )
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-transparent"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          {confirmValue && !passwordsMatch && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
        </div>
      )}
    </div>
  );
};
