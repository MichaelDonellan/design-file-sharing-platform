import { Link } from 'react-router-dom';

const designCategories = [
  { name: 'SVGs', count: 0 },
  { name: 'Images', count: 0 },
  { name: 'Fonts', count: 0 },
  { name: 'Bundles', count: 0 },
  { name: 'Templates', count: 0 },
  { name: 'Laser Cutting', count: 0 },
  { name: 'Sublimation', count: 0 },
];

const fontCategories: { name: string; count: number }[] = [];

export default function SidebarCategories() {
  return (
    <aside className="w-64 bg-white border-r p-4 hidden md:block">
      <button className="mb-4 px-3 py-1 bg-gray-100 rounded">Hide Filters</button>
      <div>
        <h3 className="font-bold text-lg mb-2">Design Categories</h3>
        {designCategories.map(cat => (
          <Link key={cat.name} to={`/category/${cat.name.toLowerCase()}`} className="flex justify-between items-center py-1 text-gray-700 hover:text-blue-600">
            <span>{cat.name}</span>
            <span className="text-xs text-gray-400">{cat.count}</span>
            <span className="ml-1">{'>'}</span>
          </Link>
        ))}
      </div>
      <div className="mt-6">
        <h3 className="font-bold text-lg mb-2">Font Categories</h3>
        {fontCategories.map(cat => (
          <Link key={cat.name} to={`/category/${cat.name.toLowerCase()}`} className="flex justify-between items-center py-1 text-gray-700 hover:text-blue-600">
            <span>{cat.name}</span>
            <span className="text-xs text-gray-400">{cat.count}</span>
            <span className="ml-1">{'>'}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
} 