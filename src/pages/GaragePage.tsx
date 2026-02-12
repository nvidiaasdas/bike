import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Bike, Plus, Star, Trash2 } from 'lucide-react';

interface GarageItem {
  id: string;
  nickname: string | null;
  is_default: boolean;
  moto_variants: {
    id: string; year_from: number; year_to: number | null; engine: string; trim: string;
    moto_models: { name: string; moto_makes: { name: string } };
  };
}

function GarageBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`px-2 py-1 rounded text-xs font-medium ${className}`}>{children}</span>;
}

export default function GaragePage() {
  const { user } = useAuth();
  const [garage, setGarage] = useState<GarageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [makes, setMakes] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [makeId, setMakeId] = useState('');
  const [modelId, setModelId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    supabase.from('moto_makes').select('id, name').order('name').then(({ data }) => { if (data) setMakes(data); });
  }, []);

  useEffect(() => {
    if (!makeId) return;
    supabase.from('moto_models').select('id, name').eq('make_id', makeId).order('name').then(({ data }) => { if (data) setModels(data); });
    setModelId(''); setVariantId('');
  }, [makeId]);

  useEffect(() => {
    if (!modelId) return;
    supabase.from('moto_variants').select('id, year_from, year_to, engine, trim').eq('model_id', modelId).order('year_from').then(({ data }) => { if (data) setVariants(data); });
    setVariantId('');
  }, [modelId]);

  const fetchGarage = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_garage')
      .select('id, nickname, is_default, moto_variants(id, year_from, year_to, engine, trim, moto_models(name, moto_makes(name)))')
      .eq('user_id', user.id)
      .order('created_at');
    if (data) setGarage(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchGarage(); }, [user]);

  if (!user) return <Navigate to="/auth" />;

  const addMoto = async () => {
    if (!variantId) return;
    const { error } = await supabase.from('user_garage').insert({
      user_id: user.id, moto_variant_id: variantId, nickname: nickname || null, is_default: garage.length === 0,
    });
    if (error) { toast.error('Eroare la adăugare'); return; }
    toast.success('Motocicleta a fost adăugată!');
    setAdding(false); setMakeId(''); setModelId(''); setVariantId(''); setNickname('');
    fetchGarage();
  };

  const setDefault = async (id: string) => {
    await supabase.from('user_garage').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('user_garage').update({ is_default: true }).eq('id', id);
    toast.success('Motocicleta implicită actualizată'); fetchGarage();
  };

  const removeMoto = async (id: string) => {
    await supabase.from('user_garage').delete().eq('id', id);
    toast.success('Motocicleta a fost eliminată'); fetchGarage();
  };

  return (
    <div className="container py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold flex items-center gap-2">
          <Bike className="w-8 h-8 text-primary" /> Garajul Meu
        </h1>
        <Button onClick={() => setAdding(!adding)} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Adaugă
        </Button>
      </div>

      {adding && (
        <div className="bg-card rounded-lg border border-border p-6 mb-6 animate-fade-in">
          <h3 className="font-heading font-bold mb-4">Adaugă motocicleta</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={makeId} onValueChange={setMakeId}>
              <SelectTrigger><SelectValue placeholder="Producător" /></SelectTrigger>
              <SelectContent>{makes.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={modelId} onValueChange={setModelId} disabled={!makeId}>
              <SelectTrigger><SelectValue placeholder="Model" /></SelectTrigger>
              <SelectContent>{models.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={variantId} onValueChange={setVariantId} disabled={!modelId}>
              <SelectTrigger><SelectValue placeholder="Motor / An" /></SelectTrigger>
              <SelectContent>{variants.map(v => <SelectItem key={v.id} value={v.id}>{v.year_from}-{v.year_to || '...'} {v.engine}</SelectItem>)}</SelectContent>
            </Select>
            <Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Poreclă (opțional)" />
          </div>
          <Button onClick={addMoto} disabled={!variantId} className="mt-4 bg-primary text-primary-foreground">Salvează</Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">{[1,2].map(i => <div key={i} className="bg-muted animate-pulse h-24 rounded-lg" />)}</div>
      ) : garage.length === 0 ? (
        <div className="text-center py-16">
          <Bike className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nu ai nicio motocicletă în garaj. Adaugă una!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {garage.map(g => {
            const v = g.moto_variants;
            return (
              <div key={g.id} className={`flex items-center gap-4 p-4 rounded-lg border ${g.is_default ? 'border-primary bg-accent' : 'border-border bg-card'}`}>
                <Bike className={`w-8 h-8 ${g.is_default ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="flex-1">
                  <div className="font-heading font-bold">{v.moto_models.moto_makes.name} {v.moto_models.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {v.year_from}-{v.year_to || 'prezent'} • {v.engine} {v.trim}
                    {g.nickname && ` • "${g.nickname}"`}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!g.is_default && (
                    <Button variant="outline" size="sm" onClick={() => setDefault(g.id)}>
                      <Star className="w-4 h-4 mr-1" /> Implicită
                    </Button>
                  )}
                  {g.is_default && <GarageBadge className="bg-primary text-primary-foreground">Implicită</GarageBadge>}
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeMoto(g.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
