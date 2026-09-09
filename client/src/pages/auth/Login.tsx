import React, { useState } from 'react';
import { useAuth, DEMO_CREDENTIALS } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Mail, Lock, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Role } from '../../types';

export const Login: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const { error: showError, success: showSuccess } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('admin@flowledger.io');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      showSuccess('Welcome to FlowLedger', 'Signed in successfully.');
      navigate(from, { replace: true });
    } catch (err: any) {
      showError('Login Failed', err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRole = async (role: Role) => {
    setIsLoading(true);
    try {
      await switchDemoRole(role);
      showSuccess(`Signed in as ${role}`, `Switched demo persona.`);
      navigate(from, { replace: true });
    } catch (err: any) {
      showError('Login Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <Card className="border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Dashboard
            </Button>
          </form>

          {/* Quick Demo Personas 1-Click Fill */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                1-Click Demo Evaluation
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Select Role</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(DEMO_CREDENTIALS) as Role[]).map((role) => {
                const cred = DEMO_CREDENTIALS[role];
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleQuickRole(role)}
                    disabled={isLoading}
                    className="flex flex-col items-start p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/40 transition-all text-left group active:scale-95"
                  >
                    <div className="w-full flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                        {role}
                      </span>
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <span className="text-[10px] text-slate-400 truncate w-full mt-0.5">
                      {cred.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
