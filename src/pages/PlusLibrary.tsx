import SidebarCategories from '../components/SidebarCategories';
import SearchBarPlus from '../components/SearchBarPlus';
import ProductGridPlus from '../components/ProductGridPlus';

const mockProducts = [
  {
    id: 1,
    name: 'SVG Floral Bundle',
    category: 'Crafters',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 2,
    name: 'Modern Script Font',
    category: 'Script Fonts',
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 3,
    name: 'Watercolor Graphics',
    category: 'Graphics',
    image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 4,
    name: 'Minimalist Template',
    category: 'Templates',
    image: 'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?auto=format&fit=crop&w=400&q=80',
  },
];

export default function PlusLibrary() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarCategories />
      <main className="flex-1">
        <SearchBarPlus />
        <ProductGridPlus products={mockProducts} />
      </main>
    </div>
  );
} 