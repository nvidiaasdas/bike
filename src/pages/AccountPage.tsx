import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMoto } from '@/contexts/MotoContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { User, Package, MapPin, Bike, Check } from 'lucide-react';

const SUPABASE_URL = 'https://cgboawjncqqasijhqgkv.supabase.co';
const API_KEY = 'sb_publishable_3w5FPK8BTYy6JQIuzHcFVA_rWVwrt5_';

export default function AccountPage() {
  const { user, session, signOut } = useAuth();
  const { selected, setSelected } = useMoto();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [garage, setGarage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !session) return;
    const fetchData = async () => {
      try {
        const headers = {
          'apikey': API_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        };

        const [profileRes, ordersRes, addressRes, garageRes] = await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.${user.id}`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/orders?user_id=eq.${user.id}&order=created_at.desc`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/addresses?user_id=eq.${user.id}&order=is_default.desc`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/garage_items?user_id=eq.${user.id}&select=*,moto_variants(id,year_from,year_to,engine,trim,moto_models(id,name,moto_makes(id,name)))`, { headers }),
        ]);

        const profileData = await profileRes.json();
        const ordersData = await ordersRes.json();
        const addressData = await addressRes.json();
        const garageData = await garageRes.json();

        console.log('Profile:', profileData, 'Orders:', ordersData, 'Addresses:', addressData, 'Garage:', garageData);

        if (profileData && profileData.length > 0) setProfile(profileData[0]);
        if (ordersData && Array.isArray(ordersData)) setOrders(ordersData);
        if (addressData && Array.isArray(addressData)) setAddresses(addressData);
        if (garageData && Array.isArray(garageData)) setGarage(garageData);
      } catch (err) {
        console.error('Account data fetch error:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, [user, session]);

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
          <TabsTrigger value="garage"><Bike className="w-4 h-4 mr-1" /> Garaj</TabsTrigger>
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
        <TabsContent value="garage">
          {garage.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bike className="w-12 h-12 mx-auto mb-4" />
              <p>Nu ai motociclete în garaj.</p>
              <Link to="/garage" className="text-primary hover:underline text-sm mt-2 block">Adaugă o motocicletă</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {garage.map(item => {
                const variant = item.moto_variants;
                const makeName = variant?.moto_models?.moto_makes?.name || '';
                const makeId = variant?.moto_models?.moto_makes?.id;
                const modelName = variant?.moto_models?.name || '';
                const modelId = variant?.moto_models?.id;
                const variantLabel = `${variant?.year_from}${variant?.year_to ? `-${variant.year_to}` : ''} ${variant?.engine || ''} ${variant?.trim || ''}`.trim();
                const isSelected = selected?.variantId === String(variant?.id);

                return (
                  <div key={item.id} className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
                    <div>
                      <p className="font-heading font-bold text-sm">{item.nickname || `${makeName} ${modelName}`}</p>
                      <p className="text-xs text-muted-foreground">{variantLabel}</p>
                    </div>
                    <Button
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelected({
                          makeId: String(makeId),
                          makeName,
                          modelId: String(modelId),
                          modelName,
                          variantId: String(variant?.id),
                          variantLabel,
                        });
                        toast.success(`${item.nickname || `${makeName} ${modelName}`} selectată pentru cumpărături`);
                      }}
                      className={isSelected ? 'bg-primary text-primary-foreground' : ''}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4 mr-1" /> Selectată
                        </>
                      ) : (
                        'Selectează pentru cumpărături'
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          {garage.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <Link to="/garage" className="text-primary hover:underline text-sm">Adaugă o nouă motocicletă</Link>
            </div>
          )}
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
