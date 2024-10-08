/*
OverView of Code :
1. This is the Home page of the application.
2. It fetches the recent listings for offer, sale and rent.only 6 appears on screen ..for more click on show more.
3.Background image and content
4. Swiper for images(first image of listings will be shown in slider)
5. Listing results for offer, sale and rent
*/

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import SwiperCore from 'swiper';
import 'swiper/css/bundle';
import ListingItem from '../components/ListingItem';
import backgroundImage from '../assets/hpb.jpg'; // Adjust the import path as needed

export default function Home() {
  const [offerListings, setOfferListings] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [rentListings, setRentListings] = useState([]);

  SwiperCore.use([Navigation]); //This is a Swiper module that provides navigation controls (e.g., next and previous buttons) for the slider.
/*he useEffect hook in React is used for handling side effects in functional components. 
  Side effects can include data fetching, subscriptions, manual DOM manipulations, and more.*/
  /*It takes two arguments:
  A function containing the side effect logic.(functions we called :fetchOfferListings,fetchRentListings,fetchSaleListings )
  An optional dependency array that controls when the effect should run ; here : [] means it will run only once when the component is mounted.
  compoonent mounted means the component is first inserted into the DOM  tree
 */
  useEffect(() => {
    const fetchOfferListings = async () => {   // this block is (function definition of offerListings)
      try {
        const res = await fetch('/api/listing/get?offer=true&limit=6');
  /**This line sends a request to the API endpoint /api/listing/get with query parameters offer=true and limit=6. */
  /**await: This keyword waits for the fetch  */
        const data = await res.json();
        setOfferListings(data);// It updates the state with the data fetched from the API.
        fetchRentListings(); //(function calling)Call fetchRentListings after fetching offers to maintain sequencial fetching and avoid dependencies
      } catch (error) {
        console.log(error);
      }
    };

    const fetchRentListings = async () => { // this block is (function definition of RentListings)
      try {
        const res = await fetch('/api/listing/get?type=rent&limit=6');
        const data = await res.json();
        setRentListings(data);
        fetchSaleListings();// (function calling)Call fetchSaleListings after fetching rents to maintain sequencial fetching and avoid dependencies
      } catch (error) {
        console.log(error);
      }
    };

    const fetchSaleListings = async () => {  // this block is (function definition of SaleListings)
      try {
        const res = await fetch('/api/listing/get?type=sale&limit=6');
        const data = await res.json();
        setSaleListings(data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchOfferListings();  //(function calling of offerlisting)This call is made to kick off the entire sequence of data fetching when the component mounts.
  }, []);

  return (
    <div className='relative overflow-hidden'>
      {/* Background Image */}
      <div
        className='absolute inset-0 z-[-1] bg-cover bg-center'
        style={{
          backgroundImage: `url(${backgroundImage})`,
          //filter: 'blur(8px)',
          height: '100vh',
        }}
      ></div>

      {/* Content */}
      <div className='relative z-20'>
        {/* top */}
        <div className='flex flex-col gap-20 p-28 px-3 max-w-6xl mx-auto'>
          <h1 className='text-slate-900 font-bold text-3xl lg:text-6xl'>
            Find your next <span className='text-slate-600'>perfect</span>
            <br />
            place with ease
          </h1>
          <div className='text-gray-700 text-xs sm:text-sm'>
            Kalyani Estate is the best place to find your next perfect place to
            live.
            <br />
            We have a wide range of properties for you to choose from.
          </div>
          <Link
            to={'/search'}
            className='text-xs sm:text-sm text-blue-950 font-bold hover:underline'
          >
            Let's get started...
          </Link>
        </div>

        {/* swiper */}
        <Swiper navigation>
          {offerListings &&
            offerListings.length > 0 &&
            offerListings.map((listing) => (
              <SwiperSlide key={listing._id}>
                <div
                  style={{
                    background: `url(${listing.imageUrls[0]}) center no-repeat`,
                    backgroundSize: 'cover',
                  }}
                  className='h-[500px]'
                ></div>
              </SwiperSlide>
            ))}
        </Swiper>

        {/* listing results for offer, sale and rent */}
        {/* here ,up to 6 listimgs are called from from db using fetch , this data is given ui/frontend from listingitem component , later it is taken in to home.jsx and diaplayed */}
        <div className='max-w-6xl mx-auto p-3 flex flex-col gap-8 my-10'>
          {offerListings && offerListings.length > 0 && (
            <div className=''>
              <div className='my-3'>
                <h2 className='text-2xl font-semibold text-slate-600'>Recent offers</h2>
                <Link className='text-sm text-blue-800 hover:underline' to={'/search?offer=true'}>Show more offers</Link>
              </div>
              <div className='flex flex-wrap gap-4'>
                {offerListings.map((listing) => (
                  <ListingItem listing={listing} key={listing._id} />
                ))}
              </div>
            </div>
          )}
          {rentListings && rentListings.length > 0 && (
            <div className=''>
              <div className='my-3'>
                <h2 className='text-2xl font-semibold text-slate-600'>Recent places for rent</h2>
                <Link className='text-sm text-blue-800 hover:underline' to={'/search?type=rent'}>Show more places for rent</Link>
              </div>
              <div className='flex flex-wrap gap-4'>
                {rentListings.map((listing) => (
                  <ListingItem listing={listing} key={listing._id} />
                ))}
              </div>
            </div>
          )}
          {saleListings && saleListings.length > 0 && (
            <div className=''>
              <div className='my-3'>
                <h2 className='text-2xl font-semibold text-slate-600'>Recent places for sale</h2>
                <Link className='text-sm text-blue-800 hover:underline' to={'/search?type=sale'}>Show more places for sale</Link>
              </div>
              <div className='flex flex-wrap gap-4'>
                {saleListings.map((listing) => (
                  <ListingItem listing={listing} key={listing._id} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
