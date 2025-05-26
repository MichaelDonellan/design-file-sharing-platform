import { Link } from 'react-router-dom';

export default function TopNavBar({ user }) {
  return (
    <nav className="bg-white shadow sticky top-0 z-50 flex items-center justify-between px-4 h-16">
      <div className="flex items-center space-x-6">
        <Link to="/" className="text-2xl font-bold text-blue-600">DesignBundles</Link>
        <Link to="/plus" className="font-semibold border-b-2 border-yellow-400 pb-1">Plus Products</Link>
        <Link to="/easy-edits" className="font-semibold text-gray-600 hover:text-blue-600">Easy Edits</Link>
        <Link to="/ai-library" className="font-semibold text-gray-600 hover:text-blue-600">AI Library</Link>
        <Link to="/bonuses" className="font-semibold text-gray-600 hover:text-blue-600">Bonuses</Link>
      </div>
      <div className="flex items-center space-x-4">
        <button className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded font-semibold">Membership details</button>
        <Link to="/account">
          <img src={user?.avatar_url || '/default-avatar.png'} alt="Account" className="w-8 h-8 rounded-full border" />
        </Link>
      </div>
    </nav>
  );
} 