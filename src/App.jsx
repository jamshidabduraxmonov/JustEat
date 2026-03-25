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
      
      {count > 0 && (<div>
          <h3>{count}</h3>

          <button onClick={(e) => {
            e.stopPropagation();
            addUp();
            }}>+</button>

          <button onClick={(e) =>{
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
    <div className="app-container"> 
      <Routes>
        <Route path='/' element={
          <>
      
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              <Menu sandwiches={sandwiches} addToTotal={addToTotal} removeFromTotal={removeFromTotal} clearProduct={clearProduct}/>
            </div>

            
            {total > 0 && (
              <div className="order-controls">
                <button className="orderBtn" onClick={() => setIsPopupOpen(true)}>
                  Order({itemCount}) - ${total}
                </button>
                <button className="clearBtn" onClick={() => window.location.reload()}>
                  Clear All
                </button>
              </div>
            )}

            {isPopupOpen && (
              <div className="popup">
                <div className="popup-box">
                   {isConfirmed=== false ? (
            <>
              <button onClick={()=> setIsPopupOpen(false)}>x</button>
              <h3>List of Products</h3>
              {
                codeKeys.map((key)=> {
                  const spcProduct = sandwiches.find((item) => item.id === key);
                  const name = spcProduct.name;
                  const price = spcProduct.price;

                  return(
                    <p key={name}>{name}({cartContents[spcProduct.id]}) - ${price} - ${cartContents[spcProduct.id] * price}</p>
                  )
                })
              }

              <h3>Total: ${total}</h3>

              <button onClick={() => { handleOrder() }} disabled={isBusy}>{isBusy ? "Sending..." : "Comfirm"}</button>
            </>
            
          ) : ( 
            <>
              <button onClick={()=> {setIsPopupOpen(false); window.location.reload()}}>x</button>
              <h3>Order Confirmed</h3>
              <p>Show these codes to the cashier:</p>
              {
                codeKeys.map((codeKey)=> {
                  const spcProduct = sandwiches.find(item => item.id === codeKey);
                  const code = spcProduct.code;

                  return(
                    <p key={spcProduct.id}>{code}({cartContents[spcProduct.id]})</p>
                  )
                })
              }
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

