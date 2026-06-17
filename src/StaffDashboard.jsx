import {collection, query, onSnapshot, orderBy, addDoc, doc, deleteDoc, updateDoc} from 'firebase/firestore';
import {useState, useEffect} from 'react';
import { db } from './firebase.js';
import sound from './assets/notify.wav'


const StaffDashboard = () => {  
    const [orders, setOrders] = useState([]); // No_1 state
    const [data, setData] = useState([]);

    const [newProduct, setNewProduct] = useState({name: '', ingredients: '', price: '', code: '', category: ''});

    const [ imageFile, setImageFile ] = useState(null);

    const [ isUploading, setIsUploading ] = useState(false);

    const [ editId, setEditId ] = useState(null);

    const [ editProduct, setEditProduct ] = useState({name: '', ingredients: '', price: '', code: '', category: ''});

    const [preview, setPreview ] = useState(null);

    const [notification, setNotification] = useState(false);

    // console.log('Total Orders: ', orders);

    useEffect(() => {
        const ordersCollection = collection(db, 'orders');  // collection address

        const q = query(ordersCollection, orderBy('createdAt', 'desc')); // destructuring the data list on descending pattern

        const unsubscribe = onSnapshot(q, (snapshot)=> { // Transferring back the data using onSnapshot listeners
            let tempOrders = []; 
            snapshot.forEach((doc) => {
                const realData = doc.data(); // Retrieving the data
                tempOrders.push({id: doc.id, ...realData}); // using spread operator to push realData with doc id
             });
            setOrders(tempOrders);
            
            console.log("notification: ", notification);
            if(notification === true) {
                notify();
            }

         });

        return() => unsubscribe();
    }, []);


    async function notify() {
        const audio = new Audio(sound);
        await audio.play();
    }

    if(notification) {
        notify();
    }


    useEffect(() => {
        const productsCollection = collection(db, 'products');
        const unsubscribe2 = onSnapshot(productsCollection, (snapshot) => {
            let tempProducts = [];
            snapshot.forEach((doc)=> {
                const realData = doc.data();
                tempProducts.push({id: doc.id, ...realData});
            });

                setData(tempProducts);

        });

        return() => unsubscribe2();
    }, []);


    async function handleDelete(productId) {
        const docRef = doc(db, 'products', productId);
        await deleteDoc(docRef);
    }

    
    const handleChange = (e) => {
        
        const keyName = e.target.name;
        const val = e.target.value;

        setNewProduct((prev) => ({
            ...prev,
            [keyName]: val
        }));
    }

    const handleEditChange = (e) => {

        const keyName = e.target.name;
        const val = e.target.value;

        setEditProduct((prev) => ({
            ...prev,
            [keyName]: val
        }));
    }

   const handleAddProduct = async() => {
    // Cloudinary logic 

        if(!imageFile) return alert("Please, select an image first!");

        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('upload_preset', 'Quick_order');

        try {
            // 3. Upload to Cloudinary
            const resp = await fetch("https://api.cloudinary.com/v1_1/dano4bou5/image/upload", {
                method: "POST",
                body: formData
            });
            const fileData = await resp.json();
            console.log("Image Data: ", fileData);
            const imageUrl = fileData.secure_url; // This is the webLink to my photo!
            
            // FireBase/FireStore logic ///////////////////////////////////////

            const collectionRef = collection(db, 'products');

            const finalData = {
                ...newProduct,
                price: Number(newProduct.price)
            }

            const docRef= await addDoc(collectionRef,{
                ...finalData,
                image: imageUrl
            });
            console.log(docRef.id);
            setNewProduct({ name: '', ingredients: '', price: '', code: '', category: ''});
            setImageFile(null);
            document.getElementById('fileInput').value = "";

            setIsUploading(false);

            alert("Product added successfully!");
        } catch(error) {
            console.error("Upload failed: ", error);
        }

    }

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);

            setPreview(URL.createObjectURL(file));
        }
    }




    const handleEdit = (sandwich) => {
        setImageFile(null);
        setPreview(null);
        setEditId(sandwich.id);
        setEditProduct(sandwich);
    }


    const handleSave = async() => {

        if(!editProduct.name || !editProduct.code || !editProduct.price ){
            alert("Please fill all blanks!");
            return;
        }

        setIsUploading(true);
        let finalImageUrl = editProduct.image || '';

        
            try {
                if(imageFile !== null) {
                
                const formData = new FormData();
                formData.append('file', imageFile);
                formData.append('upload_preset', 'Quick_order');

                const resp = await fetch('https://api.cloudinary.com/v1_1/dano4bou5/image/upload', {
                    method: 'POST',
                    body: formData
                });

                const fileData = await resp.json();
                console.log("New Image uploaded!");
                const imgUrl = fileData.secure_url;
                finalImageUrl = imgUrl;
            }

                    const docRef = doc(db, 'products', editId);
                    const finalEditProduct = {
                        ...editProduct,
                        price: Number(editProduct.price) 
                    }
                    await updateDoc(docRef, {...finalEditProduct, image: finalImageUrl});

                
                
                setEditId(null);
                setImageFile(null);
            }catch(error) {
                console.error(error);
                alert("Oops! Something went wrong! Please try again!");
                return;
            }finally{
                setIsUploading(false);
            }
        




    
    }



    return (
    <div className="bg-gray-50 p-6 min-h-screen pb-12 font-sans">
        
        <h1 className="text-center text-3xl font-black text-gray-900 pt-10 pb-6 tracking-tight">Staff Dashboard</h1>

        <div>
            {notification ? (
                <button className="bg-green-600" onClick={()=> {setNotification(false)}}>Notification On</button>
            ) : (<button className="bg-red-600" onClick={()=> {setNotification(true)}}>Notification Off</button>)
            }
           
        </div>


        <h3 className="text-2xl text-center p-4 font-bold text-gray-900">Live Orders</h3>
        <div className="h-[500px] border rounded-md mx-14 overflow-y-auto w-full max-w-md mx-auto border-x border-gray-600 bg-white shadow-sm scrollbar-hide p-6 flex flex-col gap-4">
             {
                orders.map( order =>{
                    const itemsMap = order.items;
                    const productIds = Object.keys(itemsMap);

                    return (
                        <div className="border rounded-xl border-amber-600" key={order.id}>
                            <div className="p-4 flex flex-col space-y-3">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 self-start px-2 py-1 rounded-full" >Order #{order.id.slice(-3)}</h2>
                            <div className="space-y-1">
                            {
                                productIds.map(productId => {
                                    const foundProduct = data.find(product => product.id == productId);
                                    const quantity = itemsMap[productId]

                                    if (!foundProduct) {
                                        return <p key={productId} className="text-sm italic text-gray-400">[Deleted Item] × {quantity}</p>
                                    }

                                    return(
                                        <p key={productId} className="flex  justify-between items-center text-gray-800 font-medium">
                                            <span>{foundProduct.name}</span>
                                            <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded">{quantity}</span>
                                        </p>
                                    )
                                })
                            }
                            </div>

                            <footer className="text-[10px] uppercase font-bold text-gray-400 pt-2 border-t border-gray-50">{order.createdAt?.toDate().toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            }) || 'Loading...' }</footer>
                        </div>
                        </div>
                    )
                })
            }
        </div>
       
        <div className="flex justify-center mt-10 mb-8 px-4">
            <div className="w-full max-w-md grid bg-white border border-gray-200 p-6 gap-4 rounded-xl shadow-sm">
                <h2 className="font-bold text-lg text-gray-800 border-b pb-2">Add New Product</h2>
                
                <input className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" name="name" value={newProduct.name} onChange={handleChange} type="text" placeholder='Product name' />
                <input className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" name="ingredients" value={newProduct.ingredients} onChange={handleChange} type="text" placeholder='Ingredients list' />
                <input className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" name="price" value={newProduct.price} onChange={handleChange} type="number" placeholder='Price' />
                <input className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" name="code" value={newProduct.code} onChange={handleChange} type="text"  placeholder='Code'/>

                <input className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border-2 border-dashed border-gray-200 rounded-lg p-2"
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                />



                <div className="grid gap-2">
                    <span className="text-sm font-bold text-slate-500 ml-1">Category</span>
                    
                    {/* THE TRACK */}
                    <div className="flex bg-slate-100 p-1 rounded-xl w-full">
                        
                        {/* SEGMENT 1 */}
                        <label className="flex-1">
                        <input type="radio" name="category" value="sandwiches" onChange={handleChange} className="sr-only peer" />
                        <div className="text-center py-2 rounded-lg cursor-pointer text-sm font-bold text-slate-500 transition-all
                                        peer-checked:bg-white peer-checked:text-emerald-600 peer-checked:shadow-sm">
                            Sandwiches
                        </div>
                        </label>

                        {/* SEGMENT 2 */}
                        <label className="flex-1">
                        <input type="radio" name="category" value="bakery" onChange={handleChange} className="sr-only peer" />
                        <div className="text-center py-2 rounded-lg cursor-pointer text-sm font-bold text-slate-500 transition-all
                                        peer-checked:bg-white peer-checked:text-emerald-600 peer-checked:shadow-sm">
                            Bakery
                        </div>
                        </label>

                        {/* SEGMENT 3 */}
                        <label className="flex-1">
                        <input type="radio" name="category" value="starbucks" onChange={handleChange} className="sr-only peer" />
                        <div className="text-center py-2 rounded-lg cursor-pointer text-sm font-bold text-slate-500 transition-all
                                        peer-checked:bg-white peer-checked:text-emerald-600 peer-checked:shadow-sm">
                            Coffee
                        </div>
                        </label>

                    </div>
                </div>

                
                <button className="w-full py-3 rounded-lg bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-[0.98] transition-transform disabled:opacity-50" disabled={isUploading} onClick={handleAddProduct}>
                    {isUploading ? "Uploading..." : "Add Product"}
                </button>
            </div>
        </div>

        <div className="mt-12 py-4">
    <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">Product Management</h2>


    <div className="h-[600px] overflow-y-auto w-full max-w-2xl mx-auto border border-gray-200 bg-white shadow-inner rounded-xl p-2 space-y-2">
        {
            data.map(sandwich => {
                const name = sandwich.name;
                const ingredients = sandwich.ingredients;
                const code = sandwich.code;
                const price = sandwich.price;
                const image = sandwich.image;

                return (
                    <div className="w-full bg-white border border-gray-100 rounded-lg shadow-sm hover:border-emerald-200 transition-colors" key={sandwich.id}>
                        {
                            sandwich.id === editId ? (
                                <div className="flex flex-col p-4 space-y-3 bg-slate-50 rounded-lg">
                                    <div className="flex gap-4">
                                        <div className="relative w-24 h-24 shrink-0">
                                            <img className="w-full h-full object-cover rounded-md border border-gray-200" src={!preview ? image : preview} alt={name} />
                                            <input className="absolute inset-0 opacity-0 cursor-pointer" type="file" accept="image/*" onChange={handleFileChange} />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <input className="w-full border border-gray-300 rounded px-2 py-1 text-sm font-bold" name="name" onChange={handleEditChange} value={editProduct.name} placeholder="Name" />
                                            <input className="w-full border border-gray-300 rounded px-2 py-1 text-xs" name="ingredients" onChange={handleEditChange} value={editProduct.ingredients} placeholder="Ingredients" />
                                            <div className="flex gap-2">
                                                <input className="w-full border border-emerald-400 rounded px-2 py-1 text-xs font-bold text-emerald-700" name="code" onChange={handleEditChange} value={editProduct.code} placeholder="PLU" />
                                                <input className="w-full border border-gray-300 rounded px-2 py-1 text-xs" name="price" onChange={handleEditChange} value={editProduct.price} placeholder="Price" />
                                            </div>
                                            
                                        </div>
                                        <div className="">
                        
                                            {/* SEGMENT 1 */}
                                            <label className="flex-1">
                                            <input type="radio" name="category" value="sandwiches" onChange={handleEditChange} className="sr-only peer" />
                                            <div className="text-center py-2 rounded-lg cursor-pointer text-sm font-bold text-slate-500 transition-all
                                                            peer-checked:bg-white peer-checked:text-emerald-600 peer-checked:shadow-sm">
                                                Sandwiches
                                            </div>
                                            </label>

                                            {/* SEGMENT 2 */}
                                            <label className="flex-1">
                                            <input type="radio" name="category" value="bakery" onChange={handleEditChange} className="sr-only peer" />
                                            <div className="text-center py-2 rounded-lg cursor-pointer text-sm font-bold text-slate-500 transition-all
                                                            peer-checked:bg-white peer-checked:text-emerald-600 peer-checked:shadow-sm">
                                                Bakery
                                            </div>
                                            </label>

                                            {/* SEGMENT 3 */}
                                            <label className="flex-1">
                                            <input type="radio" name="category" value="starbucks" onChange={handleEditChange} className="sr-only peer" />
                                            <div className="text-center py-2 rounded-lg cursor-pointer text-sm font-bold text-slate-500 transition-all
                                                            peer-checked:bg-white peer-checked:text-emerald-600 peer-checked:shadow-sm">
                                                Coffee
                                            </div>
                                            </label>

                                        </div>
                                    </div>
                                    <button className="w-full bg-emerald-600 text-white py-2 rounded font-bold text-xs" onClick={handleSave}>{isUploading ? 'Uploading...' : 'Save Changes'}</button>
                                </div>
                            ) : (
                                <div className="flex items-center p-3 gap-4">
                                    
                                    <img className="w-16 h-16 object-cover rounded-md border border-gray-100 shrink-0" src={image} alt={name} />

                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-emerald-600 text-white text-[11px] font-black px-2 py-0.5 rounded shadow-sm shrink-0">PLU: {code}</span>
                                            <p className="font-bold text-gray-900 truncate">{name}</p>
                                        </div>
                                        <p className="text-[11px] text-gray-500 line-clamp-1">{ingredients}</p>
                                        <p className="text-xs font-black text-gray-700 mt-0.5">{price} AED</p>
                                    </div>

                                    
                                    <div className="flex flex-col gap-1 shrink-0">
                                        <button className="bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 px-3 py-1.5 rounded font-bold text-[10px] uppercase transition-colors" disabled={editId !== null} onClick={() => handleEdit(sandwich)}>Edit</button>
                                        <button className="bg-red-50 hover:bg-red-100 text-red-500 px-3 py-1.5 rounded font-bold text-[10px] uppercase transition-colors" onClick={() => handleDelete(sandwich.id)}>Del</button>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                )
            })
        }
    </div>
</div>
    </div>
);
};

export default StaffDashboard;
