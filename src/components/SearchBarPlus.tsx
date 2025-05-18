export default function SearchBarPlus() {
  return (
    <div className="flex items-center bg-white p-4 shadow rounded mb-4">
      <button className="mr-2 px-3 py-1 bg-gray-100 rounded">Hide Filters</button>
      <input
        type="text"
        placeholder="Search the Plus Library"
        className="flex-1 px-4 py-2 border rounded"
      />
      <select className="ml-2 px-2 py-1 border rounded">
        <option>Trending</option>
        <option>Newest</option>
        <option>Popular</option>
      </select>
    </div>
  );
} 