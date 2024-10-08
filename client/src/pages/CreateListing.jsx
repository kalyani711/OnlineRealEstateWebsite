//git add CreateListing.jsx
//useState is a react Hook allows you to declare a state variable and a function to update that variable.
//whenever variable state changes , the data typed gets updated in database
/*let a field username be an example , username is state variable with initial value empty String , when user types something,
the variable state changes and the state variable(Username) attains user entered value*/
//data is stored in component's local state to manipulate form input data within the component.later it is sent to mongodb in backend when we click submit

import { useState } from 'react';
import {
  getDownloadURL, //retrieves the download URL for a file stored in Firebase Storage.
  getStorage,  //provides access to the Firebase Storage service.
  ref,          //function creates a reference to a specific location in Firebase Storage.
  uploadBytesResumable,   //allows you to upload files in chunks in to Firebase store and resume the upload if it gets interrupted.
} from 'firebase/storage';
import { app } from '../firebase'; //Firebase application instance, which you initialize in a separate file (e.g., firebase.js ,to access Firebase services like Storage, Authentication, Firestore, etc., in the application.
import { useSelector } from 'react-redux'; //Select Specific Data and always display recent data.
import { useNavigate } from 'react-router-dom';

export default function CreateListing() {
  const { currentUser } = useSelector((state) => state.user);//this line uses the useSelector hook to access the currentUser from the Redux store and verify if user logged in
  const navigate = useNavigate();
  const [files, setFiles] = useState([]); //files is the state variable, and setFiles is the function to update it.
  const [formData, setFormData] = useState({ //data is stored in component's local state to manipulate form input data within the component.later it is sent to mongodb in backend when we click submit
    imageUrls: [],
    name: '',
    description: '',
    address: '',
    type: 'rent',
    bedrooms: 1,
    bathrooms: 1,
    regularPrice: 50,
    discountPrice: 0,
    offer: false,
    parking: false,
    furnished: false,
  });
  const [imageUploadError, setImageUploadError] = useState(false); //Manages the state for handling errors related to image uploads.
  const [uploading, setUploading] = useState(false);/*Manages the state indicating whether an upload is in progress. It helps in 
  showing a loading indicator or disabling certain UI elements while the upload is happening.*/
  const [error, setError] = useState(false);/*Manages the state for general errors that might occur during the form submission or any other operation. 
  It starts as false and can be set to true if an error occurs.*/
  const [loading, setLoading] = useState(false); /* indicating whether the component is in a loading state. This can be used to display a loading spinner 
  or disable certain parts of the UI while data is being processed or fetched.*/
  console.log(formData);
  const handleImageSubmit = (e) => { //total number of images (existing plus new) does not exceed a maximum limit of 6 images.
    if (files.length > 0 && files.length + formData.imageUrls.length < 7) {
      setUploading(true);
      setImageUploadError(false);
      const promises = [];

      for (let i = 0; i < files.length; i++) {
        promises.push(storeImage(files[i]));  //promises is an array that is used to store multiple promises.
      }
      /*Uses Promise.all to wait until all image upload promises are resolved. When all uploads are successful, 
      it updates the formData state with the new image URLs, concatenating them with the existing URLs.*/
      //see promises and firebase file for more details
      //in below code, it is storing the image in firebase storage and then getting the download url of the image 
      //image submit enabled only when all images are uploaded(by promises)
      Promise.all(promises)
        .then((urls) => {
          setFormData({
            ...formData,
            imageUrls: formData.imageUrls.concat(urls),
          });
          setImageUploadError(false);
          setUploading(false);
        })
        .catch((err) => {
          setImageUploadError('Image upload failed (2 mb max per image)');
          setUploading(false);
        });
    } else {
      setImageUploadError('You can only upload 6 images per listing');
      setUploading(false);
    }
  };
/*storeImage function handles uploading an image to Firebase Storage and returns a promise that resolves 
with the image's download URL. Here's a detailed breakdown:
*/  
const storeImage = async (file) => {
    return new Promise((resolve, reject) => { //creating promise object to handle asynchronous operations
      const storage = getStorage(app); //retrieves the Firebase Storage instance
      const fileName = new Date().getTime() + file.name;
      const storageRef = ref(storage, fileName); //Creates a reference to the location in Firebase Storage where the file will be uploaded. This reference is used to upload the file.
      const uploadTask = uploadBytesResumable(storageRef, file); //the file 'file' is stored at location storageRef in firebase
      //uploadBytesResumable function allows the upload to be paused and resumed if necessary.(in this project ui is not designed for resume ,pause, canbe done if want to)
      uploadTask.on(
        'state_changed',
        (snapshot) => { //snapshot is an object containing information about the upload progress, such as bytes transferred and total bytes.
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`); 
        },
        (error) => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => { //file uploaded and reference - url and sent it through resolve method
            resolve(downloadURL);
          });
        }
      );
    });
  };

  const handleRemoveImage = (index) => { //index in parameter = index that need to be excluded(i.e deleted)
    setFormData({
      ...formData, //spread operator (...formData) is used to create a new object that includes all existing properties of formData
      imageUrls: formData.imageUrls.filter((_, i) => i !== index), //filter is used to create a new array that excludes the image at the specified index
    });
  };

  const handleChange = (e) => {
  //below:This means that when a user selects "sale" or "rent", the type property in the state will be updated to match the selected value.
    if (e.target.id === 'sale' || e.target.id === 'rent') {
      setFormData({
        ...formData,
        type: e.target.id,
      });
    }
//below: When a user checks or unchecks these options, the respective property in the formData state will reflect the current checked state.
    if (
      e.target.id === 'parking' ||
      e.target.id === 'furnished' ||
      e.target.id === 'offer'
    ) {
      setFormData({
        ...formData,
        [e.target.id]: e.target.checked,
      });
    }
//Updates the value of text, number, and textarea inputs in the state.
    if (
      e.target.type === 'number' ||
      e.target.type === 'text' ||
      e.target.type === 'textarea'
    ) {
      setFormData({
        ...formData,
        [e.target.id]: e.target.value,
      });
    }
  };

  const handleSubmit = async (e) => {
//in default behaviour, data directly goes to backend, but here it is stored in local state and then sent to backend
//in default behaviour, page reloads after submission, but here it is prevented
    e.preventDefault();
    try {
      if (formData.imageUrls.length < 1)
        return setError('You must upload at least one image');
      if (+formData.regularPrice < +formData.discountPrice)
        return setError('Discount price must be lower than regular price');
      setLoading(true);
      setError(false);
  //POST request to the /api/listing/create endpoint with the form data.
  //in 'userRef: currentUser._id,' You include userRef: currentUser._id to ensure that the backend knows who created the listing. 
  //This information is crucial for tracking, managing, or restricting access based on the user.
      const res = await fetch('/api/listing/create', { //await: This keyword is used in asynchronous functions to pause the execution of the code until the promise resolves.
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userRef: currentUser._id,
        }),
      });
      const data = await res.json(); //Stores the parsed JSON data in the data variable.
      setLoading(false);
      if (data.success === false) { //if the API response indicates a failure
        setError(data.message);
      }
      navigate(`/listing/${data._id}`);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
    //error.message provides a descriptive string from caught exception. 
  };
  return (
    <main className='p-3 max-w-4xl mx-auto'>
      <h1 className='text-3xl font-semibold text-center my-7'>
        Create a Listing
      </h1>
      <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-4'>
        <div className='flex flex-col gap-4 flex-1'>
          <input
            type='text'
            placeholder='Name'
            className='border p-3 rounded-lg'
            id='name'
            maxLength='62'
            minLength='10'
            required
            onChange={handleChange}
            value={formData.name}
          />
          <textarea
            type='text'
            placeholder='Description'
            className='border p-3 rounded-lg'
            id='description'
            required
            onChange={handleChange}
            value={formData.description}
          />
          <input
            type='text'
            placeholder='Address'
            className='border p-3 rounded-lg'
            id='address'
            required
            onChange={handleChange}
            value={formData.address}
          />
          <div className='flex gap-6 flex-wrap'>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='sale'
                className='w-5'
                onChange={handleChange}
                checked={formData.type === 'sale'}
              />
              <span>Sell</span>
            </div>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='rent'
                className='w-5'
                onChange={handleChange}
                checked={formData.type === 'rent'}
              />
              <span>Rent</span>
            </div>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='parking'
                className='w-5'
                onChange={handleChange}
                checked={formData.parking}
              />
              <span>Parking spot</span>
            </div>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='furnished'
                className='w-5'
                onChange={handleChange}
                checked={formData.furnished}
              />
              <span>Furnished</span>
            </div>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='offer'
                className='w-5'
                onChange={handleChange}
                checked={formData.offer}
              />
              <span>Offer</span>
            </div>
          </div>
          <div className='flex flex-wrap gap-6'>
            <div className='flex items-center gap-2'>
              <input
                type='number'
                id='bedrooms'
                min='1'
                max='10'
                required
                className='p-3 border border-gray-300 rounded-lg'
                onChange={handleChange}
                value={formData.bedrooms}
              />
              <p>Beds</p>
            </div>
            <div className='flex items-center gap-2'>
              <input
                type='number'
                id='bathrooms'
                min='1'
                max='10'
                required
                className='p-3 border border-gray-300 rounded-lg'
                onChange={handleChange}
                value={formData.bathrooms}
              />
              <p>Baths</p>
            </div>
            <div className='flex items-center gap-2'>
              <input
                type='number'
                id='regularPrice'
                min='50'
                max='10000000'
                required
                className='p-3 border border-gray-300 rounded-lg'
                onChange={handleChange}
                value={formData.regularPrice}
              />
              <div className='flex flex-col items-center'>
                <p>Regular price</p>
                {formData.type === 'rent' && (
                  <span className='text-xs'>($ / month)</span>
                )}
              </div>
            </div>
            {formData.offer && (
              <div className='flex items-center gap-2'>
                <input
                  type='number'
                  id='discountPrice'
                  min='0'
                  max='10000000'
                  required
                  className='p-3 border border-gray-300 rounded-lg'
                  onChange={handleChange}
                  value={formData.discountPrice}
                />
                <div className='flex flex-col items-center'>
                  <p>Discounted price</p>

                  {formData.type === 'rent' && (
                    <span className='text-xs'>($ / month)</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className='flex flex-col flex-1 gap-4'>
          <p className='font-semibold'>
            Images:
            <span className='font-normal text-gray-600 ml-2'>
              The first image will be the cover (max 6)
            </span>
          </p>
          <div className='flex gap-4'>
            <input
              onChange={(e) => setFiles(e.target.files)}
              className='p-3 border border-gray-300 rounded w-full'
              type='file'
              id='images'
              accept='image/*'
              multiple
            />
            <button
              type='button'
              disabled={uploading}
              onClick={handleImageSubmit}
              className='p-3 text-green-700 border border-green-700 rounded uppercase hover:shadow-lg disabled:opacity-80'
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          <p className='text-red-700 text-sm'>
            {imageUploadError && imageUploadError}
          </p>
          {formData.imageUrls.length > 0 &&
            formData.imageUrls.map((url, index) => (
              <div
                key={url}
                className='flex justify-between p-3 border items-center'
              >
                <img
                  src={url}
                  alt='listing image'
                  className='w-20 h-20 object-contain rounded-lg'
                />
                <button
                  type='button'
                  onClick={() => handleRemoveImage(index)}
                  className='p-3 text-red-700 rounded-lg uppercase hover:opacity-75'
                >
                  Delete
                </button>
              </div>
            ))}
          <button
            disabled={loading || uploading}
            className='p-3 bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 disabled:opacity-80'
          >
            {loading ? 'Creating...' : 'Create listing'}
          </button>
          {error && <p className='text-red-700 text-sm'>{error}</p>}
        </div>
      </form>
    </main>
  );
}
