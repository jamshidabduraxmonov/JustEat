import {useState, useEffect} from 'react';
import { db } from './firebase.js';
import {onSnapshot} from 'firebase/firestore';

import {collection, addDoc, serverTimestamp} from 'firebase/firestore';
import StaffDashboard from './StaffDashboard.jsx';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {Menu} from './Menu.jsx';


export function ProductCard({ name, onAdd, price, onRemove, image, code, id, clearProduct, ingredients }) {

  const [ count, setCount ] = useState(0);


  function addUp(){
    setCount(count  + 1);
    onAdd(price, id);
    return count;
  }

  function takeDown() {
    if(count > 0){
      setCount(count -1);
      onRemove(price, id);
      return count;
    }
    
  }

  return(
    <div className={`bg-white border rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all flex flex-col gap-4
      ${count > 0 ? 'ring-2 ring-emerald-500 scale-[1.02]' : 'border-slate-200'} 
      `}
    
    onClick={()=> {
      if(count === 0) {
        addUp();
      }else if(count > 0){
        clearProduct(id, price);
        setCount(0);
      }
    }}>
      <img className="w-full h-48 object-cover rounded-2xl bg-slate-100 " src={image} alt={name} />
      <div className="flex justify-between items-start">
        <h3 className="name">{name}</h3>
        <span className="font-black">{price} AED</span>
      </div>

      <p className='text-sm text-slate-500 line-clamp-2'>Ingredients: {ingredients}</p>
      
      {count > 0 && (
        <div className="mt-auto bg-slate-50 flex items-center justify-between p-2 rounded-xl border border-slate-100 ">

          <button className="w-10 h-10 bg-white border border-slate-200 rounded-lg shadow-sm active:scale-90"
          
          onClick={(e) => {
            e.stopPropagation();
            addUp();
            }}>+</button>


          <h3>{count}</h3>



          <button className="w-10 h-10 bg-white border border-slate-200 rounded-lg shadow-sm active:scale-90"
          
          onClick={(e) =>{
            e.stopPropagation();
            takeDown();
          }}>-</button>

        </div>)
      
      }

    </div>
  )

}




/* To build the confirmation content and switches after 'Confirm' button:
     1. We need a new state called 'isConfirmed' which is initially false
     2. 'Confirm button at the end of the popup
     3. The button sets the 'isConfirmed' to 'true'
     4. if 'isConfirmed' is false, when order button pressed the popup should
              should show the list of products and total price
     5. Else it shows the code of the products.

*/



export default function MainMenu() {

  const [ total, setTotal ] = useState(0); // Total price
  const [ itemCount, setItemCount] = useState(0); // Total quantity of products
  
  const [ sandwiches, setSandwiches ] = useState([]); // All the products in it

  const [ cartContents, setCartContents ] = useState({}); // All the chosen items to be bought

  const [ isPopupOpen, setIsPopupOpen ] = useState(false); 

  const [ isConfirmed, setIsConfirmed ] = useState(false);

  const [ isBusy, setIsBusy ] = useState(false);

  const [ orderId, setOrderId] = useState("");

  const productRef = collection(db, 'products');

  useEffect( () => {
    onSnapshot(productRef, (snapshot)=> {
      let tempProducts = [];
      snapshot.forEach((doc) => {
        const realData = doc.data();
        tempProducts.push({id: doc.id, ...realData});
        setSandwiches(tempProducts);
      })
    })
  }, [])

  function addToTotal(price, id) {

    const numericPrice = Number(price);

    setTotal(total + numericPrice);
    setItemCount(itemCount + 1);
    
    // To get the quantity of this codet
    const currentQty = cartContents[id] || 0;

    setCartContents({
      ...cartContents,
      [id]: currentQty + 1
    });
  }

  function removeFromTotal(price, id){
    const numericPrice = Number(price);

    setTotal(total - numericPrice);
    setItemCount(itemCount - 1);

    const currentQty = cartContents[id] || 0;

    if(currentQty > 1) {
      let tempContent = {...cartContents};

      tempContent = {...tempContent, 
        [id]: currentQty - 1
      };

      setCartContents(tempContent);

    }else {
      let temp = {...cartContents}
      delete temp[id];
      setCartContents(temp);
    }
  } 



  let codeKeys = Object.keys(cartContents);
   


  const handleOrder = async() => {
    try{
      setIsBusy(true);
      const collectionRef = collection(db, "orders");
      const newOrder = {
        items: cartContents,
        totalPrice: total,
        status: "pending",
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collectionRef, newOrder);
      console.log("Success! Order ID:", docRef.id);
      if(docRef.id) {
        setOrderId(docRef.id);
        setIsConfirmed(true);
      }
    }catch(errors){
        console.error(errors);
        alert("Something went wrong. Please try again or tell the cashier!");
    }finally{
      setIsBusy(false);
    }
}



const clearProduct = (id, price) => {
    const qty = cartContents[id];
    setTotal(
      total - (price * qty)
    )

    const newBag = {...cartContents};
    delete newBag[id];

    setCartContents(newBag);
    setItemCount(itemCount - qty);
}



 useEffect( () => {
  console.log(`Total: ${total}$ - ${itemCount} products`);
}, [total]);

useEffect( () => {
  console.log('The Product code: ', cartContents)
}, [cartContents]);

useEffect( () => {
  console.log("Order Button: ", isPopupOpen);
}, [isPopupOpen]);
    
  

 return (
  <BrowserRouter>
    <div className="app-container pb-40"> 
      <Routes>
        <Route path='/' element={
          <>
      
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-slate-50 ">
              <Menu sandwiches={sandwiches} addToTotal={addToTotal} removeFromTotal={removeFromTotal} clearProduct={clearProduct}/>
            </div>

            
            {total > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t p-4 pb-8 z-50">
                <div className="max-w-md mx-auto flex gap-3">
                    <button className="flex-1 bg-emerald-500 text-white rounded-2xl py-4 px-6 flex justify-between items-center shadow-2xl shadow-emerald-400 active:scale-95 transition-all" 
                      onClick={() => setIsPopupOpen(true)}>
                     <span className='font-bold'>View Order({itemCount})</span> 
                     <span className="font-black bg-emerald-600/50 px-3 py-1 rounded-lg">
                      ${total}
                     </span>
                    </button>
                    <button className="px-6 bg-slate-100 text-slate-500 font-semibold rounded-2xl py-4 hover:bg-slate-200 active:scale-95 transition-all " onClick={() => window.location.reload()}>
                      Clear All
                    </button>
                </div>
              </div>
            )}

          

{isPopupOpen && (
  <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
    
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />

    <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6">
      {isConfirmed === false ? (
        <>
          
          <button 
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xl p-2"
            onClick={() => setIsPopupOpen(false)}
          >
            x
          </button>

        
          <h3 className="text-2xl font-black text-slate-800 mb-1">Your Order</h3>
          
          
          <p className="text-slate-500 text-sm mb-6">Review your items before confirming</p>
          
        
          <div className="space-y-3 mb-8">
            {codeKeys.map((key) => {
              const spcProduct = sandwiches.find((item) => item.id === key);
              const name = spcProduct.name;
              const price = spcProduct.price;
              const qty = cartContents[spcProduct.id];

              return (
                <p key={name} className="flex justify-between items-center text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-medium">{name} ({qty})</span>
                  <span className="font-bold text-emerald-600">${qty * price}</span>
                </p>
              )
            })}
          </div>

          
          <h3 className="text-xl font-black text-slate-900 border-t pt-4 mb-6 flex justify-between">
            <span>Total:</span>
            <span>${total}</span>
          </h3>

          
          <button 
            className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-100 active:scale-95 transition-all disabled:opacity-50"
            onClick={() => { handleOrder() }} 
            disabled={isBusy}
          >
            {isBusy ? "Sending..." : "Confirm"}
          </button>
        </>
      ) : ( 
        <>
          <button 
            className="absolute top-4 right-4 text-slate-400 font-bold text-xl"
            onClick={() => {setIsPopupOpen(false); window.location.reload()}}
          >
            x
          </button>
          
          <h3 className="text-2xl font-black text-slate-800 mb-2">Order Confirmed</h3>
          
          <p className="text-slate-500 mb-6">Show these codes to the cashier:</p>
          
          <div className="bg-slate-900 text-emerald-400 p-6 rounded-2xl font-mono text-center space-y-2 mb-4">
            {codeKeys.map((codeKey) => {
              const spcProduct = sandwiches.find(item => item.id === codeKey);
              const code = spcProduct.code;

              return (
                <p key={spcProduct.id} className="text-xl tracking-widest uppercase">
                  {code} ({cartContents[spcProduct.id]})
                </p>
              )
            })}
          </div>
        </>
      )}
    </div>
  </div>
)}
          </>
        }/>

        <Route path="/admin" element={<StaffDashboard />} />
      </Routes>
    </div>
  </BrowserRouter>
);



}

