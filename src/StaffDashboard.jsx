import {collection, query, onSnapshot, orderBy, addDoc, doc, deleteDoc, updateDoc} from 'firebase/firestore';
import {useState, useEffect} from 'react';
import { db } from './firebase.js';


const StaffDashboard = () => {
    const [orders, setOrders] = useState([]); // No_1 state
    const [data, setData] = useState([]);

    const [newProduct, setNewProduct] = useState({name: '', ingredients: '', price: '', code: ''});

    const [ imageFile, setImageFile ] = useState(null);

    const [ isUploading, setIsUploading ] = useState(false);

    const [ editId, setEditId ] = useState(null);
    const [ editProduct, setEditProduct ] = useState({name: '', ingredients: '', price: '', code: ''});

    // console.log('Total Orders: ', orders);

    useEffect(() => {
        const ordersCollection = collection(db, 'orders');

        const q = query(ordersCollection, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot)=> {
            let tempOrders = [];
            snapshot.forEach((doc) => {
                const realData = doc.data();
                tempOrders.push({id: doc.id, ...realData});
             });
            setOrders(tempOrders);


         });

        return() => unsubscribe();
    }, []);


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
    }, [])


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
    // Cloudinary logic ////////////////////////////////////////////////

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
            setNewProduct({ name: '', price: '', code: ''});
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
            setImageFile(e.target.files[0]);
        }
    }




    const handleEdit = (sandwich) => {
        setImageFile(null);
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
        <div className="">
            <h1>StaffDashboard</h1>

            
            {
                orders.map( order =>{
                    const itemsMap = order.items;

                    const productIds = Object.keys(itemsMap);

                    return (
                        <div className="">
                            <div key={order.id} className=" grid grid-cols-1 border max-w-md mx-6 my-2 rounded-md bg-slate-100">
                            <h2 className="bg-slate-50  text-emerald-700 font-black" >Order #{order.id.slice(-3)}</h2>
                            {
                                productIds.map(productId => {
                                    const foundProduct = data.find(product => product.id == productId);
                                    const quantity = itemsMap[productId]

                                    if (!foundProduct) {
                                        return <p key={productId} className="italic text-slate-400">[Deleted Item] x {quantity}</p>
                                    }

                                    return(
                                        <p key={productId} className="flex gap-2 text-slate-700 font-black">{foundProduct.name} x <span className="bg-emerald-100 text-emerald-700 ">{quantity}</span></p>
                                    )
                                })

                                
                            }

                            <footer className="text-sm text-gray-500">{order.createdAt?.toDate().toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            }) || 'Loading...' }</footer>
                        </div>
                        </div>
                        
                    )
                })
             
            }


            <div className=" flex justify-center">
                <div className="grid border py-4 px-6 gap-2 rounded">
                    <h2 className="font-black">Add New Product</h2>
                    

                    <input className="border rounded" name="name" value={newProduct.name} onChange={handleChange} type="text" placeholder='Product name' />
                    <input className="border rounded" name="ingredients" value={newProduct.ingredients} onChange={handleChange} type="text" placeholder='Ingredients list' />
                    <input className="border rounded" name="price" value={newProduct.price} onChange={handleChange} type="number" placeholder='Price' />
                    <input className="border rounded" name="code" value={newProduct.code} onChange={handleChange} type="text"  placeholder='Code'/>

                    <input className="border "
                        id="fileInput"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                    />

                    <button className="border m-4 rounded" disabled={isUploading} onClick={handleAddProduct}>
                        {isUploading ? "Uploading..." : "Add Product"}
                    </button>
            
                </div>
                
            </div>


            <div className="product-management">
                
                <h2>Product Management</h2>

                {
                    data.map(sandwich => {
                        const name = sandwich.name;
                        const ingredients = sandwich.ingredients;
                        const code = sandwich.code;
                        const price = sandwich.price;
                        const image =  sandwich.image;


                        return(

                            <div key={sandwich.id}>
                                {
                                    sandwich.id === editId ? (
                                    <>
                                        <input type="file" accept="image/*" onChange={handleFileChange} />
                                        <input name="name" onChange={handleEditChange} value={editProduct.name}/>
                                        <input name="ingredients" onChange={handleEditChange} value={editProduct.ingredients}/>
                                        <input name="code" onChange={handleEditChange} value={editProduct.code}/>
                                        <input name="price" onChange={handleEditChange} value={editProduct.price}/>

                                        <button onClick={handleSave} >Save</button>
                                    </>
                                    ) : (
                                        <>
                                        <div>
                                            <img src={image} alt={name}/>
                                            <p key={name}>{name}</p>
                                            <p key={ingredients}>Ingredients: {ingredients}</p>
                                            <p key={code}>{code}</p>
                                            <p>{price} AED</p>
                                        </div>
                                        <button disabled={editId !== null} onClick={()=> handleEdit(sandwich)}>Edit</button>
                                        </>
                                        
                                    )
                                }
                               
                                <button onClick={()=> handleDelete(sandwich.id)}>Remove</button>
                            </div>
                            
                        )
                    })
                }
            </div>
        </div>
    );
};

export default StaffDashboard;
