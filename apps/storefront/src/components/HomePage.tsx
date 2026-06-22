import { ShoppingBag } from "lucide-react";
import {
  ProductsListingView,
  ProductsListingViewProps,
} from "./ProductsListingView";

const Homepage: React.FC<ProductsListingViewProps> = ({
  onAddToCart,
  onNavigate,
}) => {
  console.log("Homepage render", { onAddToCart, onNavigate });
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Hero Banner */}
      <div className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-tr from-indigo-900 via-indigo-800 to-indigo-950 px-8 py-16 text-white shadow-lg text-center sm:text-left">
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold backdrop-blur-sm">
            ✨ Summer Gala Launch Nepal
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-none">
            Complete E-Commerce Catalogue
          </h1>
          <p className="max-w-lg text-sm text-indigo-100 leading-normal">
            Connect high performance electronics, organic food packs, and
            premium woolen cardigans.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 opacity-10 sm:opacity-20 pointer-events-none flex items-center justify-center pr-12">
          <ShoppingBag size={240} />
        </div>
      </div>
      <ProductsListingView onAddToCart={onAddToCart} onNavigate={onNavigate} />
    </div>
  );
};

export default Homepage;
