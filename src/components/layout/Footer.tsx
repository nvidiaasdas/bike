import { Link } from 'react-router-dom';
import { Bike } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
                <Bike className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-heading text-xl font-bold">
                MOTO<span className="text-primary">PARTS</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Piese și accesorii premium pentru motocicleta ta. Livrare rapidă în toată România.
            </p>
          </div>

          <div>
            <h4 className="font-heading text-sm font-bold uppercase tracking-wider mb-4">Magazin</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/catalog" className="hover:text-primary transition-colors">Toate Piesele</Link>
              <Link to="/catalog?category=motor" className="hover:text-primary transition-colors">Motor</Link>
              <Link to="/catalog?category=frane" className="hover:text-primary transition-colors">Frâne</Link>
              <Link to="/catalog?category=consumabile" className="hover:text-primary transition-colors">Consumabile</Link>
            </div>
          </div>

          <div>
            <h4 className="font-heading text-sm font-bold uppercase tracking-wider mb-4">Cont</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/account" className="hover:text-primary transition-colors">Contul Meu</Link>
              <Link to="/garage" className="hover:text-primary transition-colors">Garajul Meu</Link>
              <Link to="/wishlist" className="hover:text-primary transition-colors">Favorite</Link>
              <Link to="/cart" className="hover:text-primary transition-colors">Coș</Link>
            </div>
          </div>

          <div>
            <h4 className="font-heading text-sm font-bold uppercase tracking-wider mb-4">Informații</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span>Livrare: 1-3 zile lucrătoare</span>
              <span>Plată: Ramburs / Card</span>
              <span>Retur: 14 zile</span>
              <span>Contact: contact@motoparts.ro</span>
            </div>
          </div>
        </div>

        <div className="border-t border-secondary/30 mt-8 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MotoParts. Toate drepturile rezervate.
        </div>
      </div>
    </footer>
  );
}
