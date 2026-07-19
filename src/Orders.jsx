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
  const [expandedOrderId, setExpandedOrderId] = useState(orderId || null);
  const [mapExpandedOrderId, setMapExpandedOrderId] = useState(null);
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
    if (orderId) {
      setExpandedOrderId(orderId);
    }
  }, [orderId]);

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
    return orders.find((order) => order.id === (expandedOrderId || orderId)) || null;
  }, [expandedOrderId, orderId, orders]);

  const expandedMapOrder = useMemo(() => {
    return orders.find((order) => order.id === mapExpandedOrderId) || null;
  }, [mapExpandedOrderId, orders]);

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
          <div className="space-y-4">
            {orders.map((order) => {
              const isActive = selectedOrder?.id === order.id;
              return (
                <div
                  key={order.id}
                  className={`overflow-hidden rounded-[1.5rem] border transition ${isActive ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-white'}`}
                >
                  <button
                    onClick={() => {
                      const nextValue = expandedOrderId === order.id ? null : order.id;
                      setExpandedOrderId(nextValue);
                      if (!nextValue) {
                        setMapExpandedOrderId(null);
                      }
                      if (nextValue) {
                        navigate(`/orders/${nextValue}`, { replace: false });
                      } else {
                        navigate('/orders', { replace: false });
                      }
                    }}
                    className="w-full p-5 text-left"
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

                  {isActive && selectedOrder && (
                    <div className="border-t border-slate-200 bg-white p-5">
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

                        <div className="grid gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
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

                        {selectedOrder.restaurantLocation && (
                          <div>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Delivery Tracking</p>
                                <p className="text-slate-500 text-sm">The route uses Deira as the driver start and your live location as the destination.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setMapExpandedOrderId(order.id)}
                                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                Expand Map
                              </button>
                            </div>

                            <div className="relative rounded-[1.5rem] overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                              <DeliveryMap 
                                startLocation={deiraCenter}
                                endLocation={
                                  liveUserLocation
                                    ? [liveUserLocation.lng, liveUserLocation.lat]
                                    : selectedOrder.deliveryLocation
                                    ? [selectedOrder.deliveryLocation.lng, selectedOrder.deliveryLocation.lat]
                                    : deiraCenter
                                }
                                orderId={selectedOrder.id}
                                height="520px"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {expandedMapOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Tracking map</p>
                <h2 className="text-xl font-black text-slate-900">Order #{expandedMapOrder.id.slice(0, 6)}</h2>
              </div>
              <button
                type="button"
                onClick={() => setMapExpandedOrderId(null)}
                className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
            <div className="h-[80vh] w-full">
              <DeliveryMap
                startLocation={deiraCenter}
                endLocation={
                  liveUserLocation
                    ? [liveUserLocation.lng, liveUserLocation.lat]
                    : expandedMapOrder.deliveryLocation
                    ? [expandedMapOrder.deliveryLocation.lng, expandedMapOrder.deliveryLocation.lat]
                    : deiraCenter
                }
                orderId={expandedMapOrder.id}
                height="100%"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
