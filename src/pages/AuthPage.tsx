import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Bike, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('Email invalid'),
  password: z.string().min(6, 'Minim 6 caractere'),
});

const registerSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, 'Numele trebuie să aibă minim 2 caractere').max(100),
});

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Prevent duplicate submissions
    if (loading) return;

    try {
      if (isLogin) {
        loginSchema.parse({ email, password });
      } else {
        registerSchema.parse({ email, password, fullName });
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach(e => { fieldErrors[e.path[0] as string] = e.message; });
        setErrors(fieldErrors);
        return;
      }
    }

    setLoading(true);
    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error('Email sau parolă incorectă');
      } else {
        toast.success('Autentificare reușită!');
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from);
      }
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        if (error.message?.includes('rate')) {
          toast.error('Prea multe încercări. Încearcă din nou peste câteva minute.');
        } else {
          toast.error(error.message || 'Eroare la înregistrare');
        }
      } else {
        toast.success('Cont creat! Conectează-te cu datele tale.');
        setEmail('');
        setPassword('');
        setFullName('');
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary m-6">
        <ArrowLeft className="w-4 h-4" /> Înapoi acasă
      </Link>
      <div className="flex-1 flex items-center justify-center py-12">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center">
              <Bike className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-heading text-2xl font-bold">
              MOTO<span className="text-primary">PARTS</span>
            </span>
          </div>

          <h1 className="font-heading text-2xl font-bold text-center mb-6">
            {isLogin ? 'Conectează-te' : 'Creează un cont'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="fullName">Nume complet</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Ion Popescu"
                />
                {errors.fullName && <p className="text-destructive text-xs mt-1">{errors.fullName}</p>}
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@exemplu.ro"
              />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password">Parolă</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minim 6 caractere"
              />
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
              {loading ? 'Se încarcă...' : isLogin ? 'Conectează-te' : 'Creează cont'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setErrors({}); }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? 'Nu ai cont? Înregistrează-te' : 'Ai deja un cont? Conectează-te'}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
