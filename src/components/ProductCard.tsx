import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface Props {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock_qty: number;
    is_oem: boolean;
    condition: string;
    brand?: { name: string } | null;
    images?: { url: string }[];
    product_attributes?: { key: string; value: string }[];
  };
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const imgUrl = product.images?.[0]?.url || '/placeholder.svg';
  const inStock = product.stock_qty > 0;
  const weight = product.product_attributes?.find((attr: any) => attr.key?.toLowerCase() === 'greutate')?.value;

  return (
    <div className="group bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/30 animate-fade-in">
      <Link to={`/product/${product.slug}`} className="block relative aspect-square overflow-hidden bg-muted">
        <img
          src={imgUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 flex gap-1">
          {product.is_oem && (
            <Badge variant="secondary" className="text-xs">OEM</Badge>
          )}
          {product.condition === 'sh' && (
            <Badge variant="outline" className="text-xs bg-card/80">SH</Badge>
          )}
        </div>
        {!inStock && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <span className="font-heading font-bold text-destructive text-sm uppercase">pe comanda</span>
          </div>
        )}
      </Link>

      <div className="p-4">
        {product.brand && (
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{product.brand.name}</span>
        )}
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-heading font-semibold text-sm mt-1 line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="font-heading text-lg font-bold text-primary">
              {Number(product.price).toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground ml-1">RON</span>
          </div>

          <Button
            size="sm"
            disabled={!inStock}
            onClick={() => addItem(product.id, Number(product.price))}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>

        <div className="mt-2">
          {inStock ? (
            <span className="text-xs text-success">● În stoc ({product.stock_qty})</span>
          ) : (
            <span className="text-xs text-destructive">● Pe comanda</span>
          )}
        </div>
      </div>
    </div>
  );
}
