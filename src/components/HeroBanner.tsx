import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import RegisterPanel from './RegisterPanel';

export default function HeroBanner() {
  const [showRegister, setShowRegister] = useState(false);
  return (
    <>
      <section className="relative bg-blue-100 py-8 overflow-hidden w-screen max-w-none p-0 m-0" style={{marginTop: 0, marginLeft: 'calc(50% - 50vw)', width: '100vw'}}>
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 p-0 m-0">
        {/* Left collage */}
        <div className="flex flex-col items-center gap-4 md:gap-8">
          <img src="/hero-collage-left.png" alt="Summer Project Collage" className="w-32 md:w-40 rounded-xl shadow-lg rotate-[-8deg] border-4 border-white" />
          <img src="/hero-shirt.png" alt="T-shirt" className="w-32 md:w-40 rounded-xl shadow-lg rotate-[4deg] border-4 border-white -mt-4" />
        </div>
        {/* Center content */}
        <div className="flex-1 flex flex-col items-center text-center gap-3 md:gap-6">
          <div className="flex items-center gap-2">
            <span className="bg-pink-200 text-pink-900 px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wider">Craft Under the Sun</span>
            <span className="bg-yellow-300 text-yellow-900 px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wider">Summer Projects for Small Prices</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-yellow-900 mt-2 mb-1">Get Started Here</h1>
          <button
            className="inline-block bg-pink-500 hover:bg-pink-600 text-white font-bold text-lg px-8 py-3 rounded-lg shadow transition"
            onClick={() => setShowRegister(true)}
          >
            Get Started Here
          </button>

        </div>
        {/* Right collage */}
        <div className="flex flex-col items-center gap-4 md:gap-8">
          <img src="/hero-collage-right.png" alt="Spark your 4th of July!" className="w-32 md:w-40 rounded-xl shadow-lg rotate-[6deg] border-4 border-white" />
          <img src="/hero-shirt-usa.png" alt="USA Shirt" className="w-32 md:w-40 rounded-xl shadow-lg rotate-[-4deg] border-4 border-white -mt-4" />
        </div>
      </div>
    </section>
    <RegisterPanel isOpen={showRegister} onClose={() => setShowRegister(false)} />
    </>
  );
}

