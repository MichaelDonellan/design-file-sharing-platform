export default function ProductGridPlus({ products }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
      {products.map(product => (
        <div key={product.id} className="bg-white rounded shadow hover:shadow-lg transition">
          <img src={product.image} alt={product.name} className="w-full h-32 object-cover rounded-t" />
          <div className="p-2">
            <h3 className="font-semibold text-sm">{product.name}</h3>
            <p className="text-xs text-gray-500">{product.category}</p>
            <button className="mt-2 w-full bg-yellow-300 text-yellow-900 rounded py-1">Download</button>
          </div>
        </div>
      ))}
    </div>
  );
} 