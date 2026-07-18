import { useEffect, useMemo, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from './firebase.js';
import { useAuth } from './AuthProvider.jsx';

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const ordersCollection = collection(db, 'orders');
    const ordersQuery = query(
      ordersCollection,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const tempOrders = [];
      snapshot.forEach((doc) => {
        tempOrders.push({ id: doc.id, ...doc.data() });
      });
      setOrders(tempOrders);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const selectedOrder = useMemo(() => {
    return orders.find((order) => order.id === orderId) || null;
  }, [orderId, orders]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Order history</p>
            <h1 className="text-3xl font-black text-slate-900">Your orders</h1>
            <p className="text-slate-500">Browse every order placed with this account and open the details for any one of them.</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Back to shop
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
            Loading your orders…
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
            You have not placed any orders yet.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              {orders.map((order) => {
                const isActive = selectedOrder?.id === order.id;
                return (
                  <button
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className={`w-full rounded-[1.5rem] border p-5 text-left transition ${isActive ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-white'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Order #{order.id.slice(0, 6)}</p>
                        <p className="mt-1 text-lg font-black text-slate-900">
                          {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Recently placed'}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-emerald-600 shadow-sm">
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                      <span>{Object.keys(order.items || {}).length} item(s)</span>
                      <span className="font-black text-slate-900">${order.totalPrice}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
              {selectedOrder ? (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Selected order</p>
                      <h2 className="text-2xl font-black text-slate-900">{selectedOrder.id}</h2>
                    </div>
                    <span className="rounded-full bg-emerald-500 px-3 py-1 text-sm font-semibold text-white">
                      {selectedOrder.status}
                    </span>
                  </div>

                  <div className="grid gap-3 rounded-[1.25rem] border border-slate-200 bg-white p-4 text-sm text-slate-600 sm:grid-cols-2">
                    <div>
                      <p className="font-semibold text-slate-500">Placed</p>
                      <p className="mt-1 text-slate-900">
                        {selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleString() : 'Just now'}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-500">Total</p>
                      <p className="mt-1 text-lg font-black text-slate-900">${selectedOrder.totalPrice}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-500">Account</p>
                      <p className="mt-1 text-slate-900">{selectedOrder.userEmail || 'Guest account'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-500">Items</p>
                      <p className="mt-1 text-slate-900">{Object.keys(selectedOrder.items || {}).length}</p>
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Order items</p>
                    <div className="space-y-2">
                      {Object.entries(selectedOrder.items || {}).map(([itemId, qty]) => (
                        <div key={itemId} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">
                          <span className="font-medium">{itemId}</span>
                          <span className="font-black text-slate-900">x{qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/orders')}
                    className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    View all orders
                  </button>
                </div>
              ) : (
                <div className="flex h-full min-h-[240px] items-center justify-center rounded-[1.25rem] border border-dashed border-slate-200 bg-white text-center text-slate-500">
                  Select an order to see the full details.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
