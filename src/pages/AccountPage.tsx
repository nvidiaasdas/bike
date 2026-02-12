import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { User, Package, MapPin } from 'lucide-react';

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, ordersRes, addressRes] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('orders').select('id, status, total, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (addressRes.data) setAddresses(addressRes.data);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (!user) return <Navigate to="/auth" />;

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('user_profiles').update({
      full_name: profile.full_name, phone: profile.phone,
    }).eq('user_id', user.id);
    if (error) toast.error('Eroare la salvare');
    else toast.success('Profil actualizat');
  };

  const statusLabels: Record<string, string> = {
    noua: 'Nouă', in_procesare: 'În procesare', expediata: 'Expediată', anulata: 'Anulată', finalizata: 'Finalizată',
  };
  const statusColors: Record<string, string> = {
    noua: 'bg-warning/20 text-warning', in_procesare: 'bg-primary/20 text-primary',
    expediata: 'bg-success/20 text-success', anulata: 'bg-destructive/20 text-destructive', finalizata: 'bg-success/20 text-success',
  };

  if (loading) return <div className="container py-12"><div className="bg-muted animate-pulse h-64 rounded-lg" /></div>;

  return (
    <div className="container py-8 max-w-3xl">
      <h1 className="font-heading text-3xl font-bold mb-8">Contul Meu</h1>
      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile"><User className="w-4 h-4 mr-1" /> Profil</TabsTrigger>
          <TabsTrigger value="orders"><Package className="w-4 h-4 mr-1" /> Comenzi</TabsTrigger>
          <TabsTrigger value="addresses"><MapPin className="w-4 h-4 mr-1" /> Adrese</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <form onSubmit={updateProfile} className="bg-card rounded-lg border border-border p-6 space-y-4">
            <div><Label>Email</Label><Input value={user.email || ''} disabled className="bg-muted" /></div>
            <div><Label>Nume complet</Label><Input value={profile?.full_name || ''} onChange={e => setProfile({ ...profile, full_name: e.target.value })} /></div>
            <div><Label>Telefon</Label><Input value={profile?.phone || ''} onChange={e => setProfile({ ...profile, phone: e.target.value })} /></div>
            <div className="flex gap-3">
              <Button type="submit" className="bg-primary text-primary-foreground">Salvează</Button>
              <Button type="button" variant="outline" onClick={signOut} className="text-destructive">Deconectare</Button>
            </div>
          </form>
        </TabsContent>
        <TabsContent value="orders">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Package className="w-12 h-12 mx-auto mb-4" />Nu ai comenzi încă.</div>
          ) : (
            <div className="space-y-3">
              {orders.map(o => (
                <div key={o.id} className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
                  <div>
                    <p className="font-heading font-bold text-sm">Comanda #{o.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString('ro-RO')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${statusColors[o.status] || ''}`}>{statusLabels[o.status] || o.status}</span>
                    <span className="font-heading font-bold text-primary">{Number(o.total).toFixed(2)} RON</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="addresses">
          {addresses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><MapPin className="w-12 h-12 mx-auto mb-4" />Nu ai adrese salvate.</div>
          ) : (
            <div className="space-y-3">
              {addresses.map(a => (
                <div key={a.id} className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium uppercase text-muted-foreground">{a.type}</span>
                    {a.is_default && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Implicită</span>}
                  </div>
                  <p className="text-sm font-medium">{a.full_name}</p>
                  <p className="text-sm text-muted-foreground">{a.street}, {a.city}, {a.county}, {a.zip}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
