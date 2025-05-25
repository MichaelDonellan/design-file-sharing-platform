import { Fragment, useEffect, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Link } from 'react-router-dom';
import { User, Settings, LogOut, Shield, Star, ShoppingBag, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Store as StoreType } from '../types';

export default function UserMenu() {
  const { user, signOut, isAdmin } = useAuth();
  const [store, setStore] = useState<StoreType | null>(null);

  useEffect(() => {
    async function fetchStore() {
      if (!user) return;

      const { data } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setStore(data);
    }

    fetchStore();
  }, [user]);

  if (!user) return null;

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
          {user.email.charAt(0).toUpperCase()}
        </div>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-1 py-1 flex flex-col gap-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/dashboard/profile"
                  className={`$
                    active ? 'bg-gray-100' : ''
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900`}
                >
                  <User className="mr-2 h-5 w-5" />
                  My Profile
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/dashboard/favorites"
                  className={`$
                    active ? 'bg-gray-100' : ''
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900`}
                >
                  <Star className="mr-2 h-5 w-5" />
                  Favorites
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/dashboard/orders"
                  className={`$
                    active ? 'bg-gray-100' : ''
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900`}
                >
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  My Orders
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/dashboard/settings"
                  className={`$
                    active ? 'bg-gray-100' : ''
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900`}
                >
                  <Settings className="mr-2 h-5 w-5" />
                  Settings
                </Link>
              )}
            </Menu.Item>
            {isAdmin && (
              <Menu.Item>
                {({ active }) => (
                  <Link
                    to="/admin"
                    className={`$
                      active ? 'bg-gray-100' : ''
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900`}
                  >
                    <Shield className="mr-2 h-5 w-5" />
                    Admin
                  </Link>
                )}
              </Menu.Item>
            )}
            {store && (
              <Menu.Item>
                {({ active }) => (
                  <Link
                    to="/dashboard/seller"
                    className={`$
                      active ? 'bg-gray-100' : ''
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900`}
                  >
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    Seller Dashboard
                  </Link>
                )}
              </Menu.Item>
            )}
          </div>
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => signOut()}
                  className={`$
                    active ? 'bg-gray-100' : ''
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-red-600`}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Logout
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
                    <Shield className="mr-2 h-5 w-5" />
                    Admin Dashboard
                  </Link>
                )}
              </Menu.Item>
            )}
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/dashboard/store"
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900`}
                >
                  <Store className="mr-2 h-5 w-5" />
                  {store ? 'My Store' : 'Create Store'}
                </Link>
              )}
            </Menu.Item>
            {store && (
              <>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/dashboard/seller"
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900`}
                    >
                      <BarChart3 className="mr-2 h-5 w-5" />
                      Seller Dashboard
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/dashboard/insights"
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900`}
                    >
                      <LineChart className="mr-2 h-5 w-5" />
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/dashboard/settings"
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900`}
                >
                  <Settings className="mr-2 h-5 w-5" />
                  Settings
                </Link>
              )}
            </Menu.Item>
            {isAdmin && (
              <Menu.Item>
                {({ active }) => (
                  <Link
                    to="/admin"
                    className={`${
                      active ? 'bg-gray-100' : ''
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900`}
                  >
                    <Shield className="mr-2 h-5 w-5" />
                    Admin
                  </Link>
                )}
              </Menu.Item>
            )}
            {store && (
              <Menu.Item>
                {({ active }) => (
                  <Link
                    to="/dashboard/seller"
                    className={`${
                      active ? 'bg-gray-100' : ''
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900`}
                  >
                    <Shield className="mr-2 h-5 w-5" />
                    Seller Dashboard
                  </Link>
                )}
              </Menu.Item>
            )}
          </div>
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => signOut()}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-red-600`}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Sign Out
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}