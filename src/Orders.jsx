import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from './firebase.js';
import { useAuth } from './AuthProvider.jsx';
import DeliveryMap from './DeliveryMap.jsx';

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liveUserLocation, setLiveUserLocation] = useState(null);
  const watchIdRef = useRef(null);
  const deiraCenter = [55.309, 25.265];

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

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not available in this browser.');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setLiveUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('Geolocation watch failed:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const selectedOrder = useMemo(() => {
    return orders.find((order) => order.id === orderId) || null;
  }, [orderId, orders]);

  const isDelivered = useMemo(() => {
    if (!selectedOrder) return false;
    if (selectedOrder.status === 'delivered') return true;
    const startedAt = selectedOrder.startedAt?.toDate?.().getTime();
    const duration = (selectedOrder.estimatedDurationSeconds ?? 150) * 1000;
    return startedAt ? Date.now() - startedAt >= duration : false;
  }, [selectedOrder]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto w-full max-w-[95vw]">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Order history</p>
            <h1 className="mt-2 text-4xl font-black text-white">Your orders</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Click any order for a dedicated page with a large delivery map and bold, readable details.</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex rounded-full border border-emerald-400 bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Back to shop
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-[1.5rem] border border-slate-700 bg-slate-900/95 p-5 text-center text-slate-300">
            Loading your orders…
          </div>
        ) : orderId ? (
          selectedOrder ? (
            <div className="space-y-5">
              <div className="rounded-[1.5rem] border border-slate-700 bg-slate-900/95 p-4 shadow-[0_25px_70px_rgba(0,0,0,0.65)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Your order</p>
                    <h1 className="mt-2 text-3xl font-black text-white">Ready for pickup or delivery</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Your food is being prepared and sent on its way. You can follow the live route below and see when it reaches you.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Current status</p>
                    <p className="mt-1 font-black text-white">{isDelivered ? 'Delivered successfully' : selectedOrder.status === 'delivering' ? 'On the way' : selectedOrder.status}</p>
                  </div>
                </div>
              </div>

              <div className="mx-auto w-full max-w-[95vw] rounded-[1.75rem] border border-slate-700 bg-slate-900/95 shadow-[0_35px_90px_rgba(0,0,0,0.7)]">
                <div className="px-5 py-4 border-b border-slate-700 bg-slate-800">
                  <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Live tracking</p>
                  <h2 className="mt-2 text-2xl font-black text-white">Your delivery journey</h2>
                </div>
                {isDelivered && (
                  <div className="border-b border-slate-700 bg-emerald-950/70 px-5 py-4 text-emerald-100">
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Delivery complete</p>
                    <p className="mt-2 text-lg font-bold">Your order has arrived and the delivery is complete.</p>
                  </div>
                )}
                <div className="h-[60vh] w-full">
                  <DeliveryMap
                    startLocation={deiraCenter}
                    endLocation={
                      selectedOrder.deliveryLocation
                        ? [selectedOrder.deliveryLocation.lng, selectedOrder.deliveryLocation.lat]
                        : deiraCenter
                    }
                    orderId={selectedOrder.id}
                    order={selectedOrder}
                    height="60vh"
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-slate-700 bg-slate-900/95 p-4 shadow-lg">
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">What you ordered</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-800 p-4">
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Placed</p>
                        <p className="mt-2 text-lg font-bold text-white">{selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleString() : 'Just now'}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-800 p-4">
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Total paid</p>
                        <p className="mt-2 text-lg font-bold text-white">${selectedOrder.totalPrice}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-800 p-4">
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Your account</p>
                        <p className="mt-2 text-lg font-bold text-white">{selectedOrder.userEmail || 'Guest account'}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-800 p-4">
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Items</p>
                        <p className="mt-2 text-lg font-bold text-white">{Object.keys(selectedOrder.items || {}).length} items</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-700 bg-slate-900/95 p-4 shadow-lg">
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Your items</p>
                    <div className="mt-4 space-y-3">
                      {Object.entries(selectedOrder.items || {}).map(([itemId, qty]) => (
                        <div key={itemId} className="flex items-center justify-between rounded-2xl bg-slate-800 p-3">
                          <span className="font-semibold text-slate-100">{itemId}</span>
                          <span className="font-black text-emerald-300">{qty}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-slate-700 bg-slate-900/95 p-4 shadow-lg">
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Delivery details</p>
                    <div className="mt-4 space-y-4 text-slate-200">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Pickup point</p>
                        <p className="mt-1 text-lg font-bold text-white">Deira center</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Delivery address</p>
                        <p className="mt-1 text-lg font-bold text-white">{selectedOrder.deliveryLocation ? 'Your saved delivery location' : 'Location pending'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">What to expect</p>
                        <p className="mt-1 text-lg font-bold text-emerald-300">{isDelivered ? 'Arrived and completed' : 'Your rider is on the way'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-700 bg-slate-900/95 p-4 shadow-lg">
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Helpful info</p>
                    <p className="mt-3 leading-6 text-slate-300">Track your delivery live on the map above. Once it reaches your location, the order will be marked as completed automatically.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-slate-700 bg-slate-900/95 p-5 text-center text-slate-300">
              Order not found. Return to your order list to select a valid order.
            </div>
          )
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="w-full rounded-[1.5rem] border border-slate-700 bg-slate-900/95 px-4 py-4 text-left transition hover:border-emerald-400 hover:bg-slate-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Order #{order.id.slice(0, 6)}</p>
                    <p className="mt-2 text-xl font-black text-white">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Recently placed'}</p>
                  </div>
                  <span className="rounded-full border border-emerald-400 bg-emerald-500 px-3 py-1 text-sm font-semibold text-slate-950">{order.status}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
                  <span>{Object.keys(order.items || {}).length} item(s)</span>
                  <span className="text-lg font-black text-white">${order.totalPrice}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
