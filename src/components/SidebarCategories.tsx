import { Link } from 'react-router-dom';

const designCategories = [
  { name: 'Crafters', count: 2115000 },
  { name: 'Graphics', count: 505900 },
  { name: 'Photos', count: 37800 },
  { name: 'Add ons', count: 10800 },
  { name: 'Templates', count: 37100 },
];

const fontCategories = [
  { name: 'Regular', count: 10300 },
  { name: 'Script Fonts', count: 12600 },
  { name: 'Seasonal', count: 1900 },
  { name: 'Web Fonts', count: 6400 },
];

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