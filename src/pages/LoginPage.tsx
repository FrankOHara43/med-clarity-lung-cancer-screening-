import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '@/services/authService';
import { toast } from '@/components/ui/use-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(formData.email, formData.password);
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
      navigate('/');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to login';
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">Med Clarity Dashboard</h1>
          <p className="text-muted-foreground text-sm">Oncology Patient Management System</p>
        </div>

        <div className="clinical-card">
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Login</h2>
              <p className="text-xs text-muted-foreground">Enter your credentials to access the dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full px-3 py-2 border rounded-sm bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.email ? 'border-red-500' : 'border-border'
                  }`}
                  disabled={loading}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-3 py-2 border rounded-sm bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.password ? 'border-red-500' : 'border-border'
                  }`}
                  disabled={loading}
                />
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-2 rounded-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
