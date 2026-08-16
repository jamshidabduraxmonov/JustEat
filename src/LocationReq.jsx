




export default function LocationReq({requestLocation, locationPermission}){
    
    return (
  <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-emerald-600 to-slate-900 flex items-center justify-center px-6 py-10">

    <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl grid md:grid-cols-2">

      {/* Left Side */}
      <div className="relative flex flex-col justify-center p-10 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">

        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-black/10 blur-3xl"></div>

        <p className="tracking-[0.35em] text-emerald-100 text-sm font-bold">
          QuickOrdr
        </p>

        <h1 className="mt-4 text-5xl font-black leading-tight">
          You're almost<br />
          ready to order.
        </h1>

        <p className="mt-6 max-w-sm text-lg leading-7 text-emerald-50">
          We need your location so we can deliver your food to the right place.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">

          <div className="rounded-full bg-white/15 backdrop-blur px-4 py-2">
            📍 Fast Delivery
          </div>

          <div className="rounded-full bg-white/15 backdrop-blur px-4 py-2">
            🚗 Live Tracking
          </div>

          <div className="rounded-full bg-white/15 backdrop-blur px-4 py-2">
            🍔 Fresh Food
          </div>

        </div>

      </div>

      {/* Right Side */}

      <div className="flex items-center justify-center bg-slate-50 p-10">

        <div className="w-full max-w-sm text-center">

          <div className="text-7xl mb-5">
            📍
          </div>

          <h2 className="text-3xl font-black text-slate-800">
            Enable Location
          </h2>

          <p className="mt-4 text-slate-500 leading-7">
            Location access is required before you can place an order.
          </p>

          {locationPermission === "denied" && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              We couldn't access your location. Please allow location permission and try again.
            </div>
          )}

          {locationPermission === "unsupported" && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Your browser doesn't support location services.
            </div>
          )}

          <button
            onClick={requestLocation}
            className="mt-8 w-full rounded-2xl bg-emerald-500 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-400/30 transition hover:bg-emerald-600 active:scale-95"
          >
            Enable Location
          </button>

        </div>

      </div>

    </div>

  </div>
);
}