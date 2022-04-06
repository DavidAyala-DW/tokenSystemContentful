import React,{useState, useEffect, useCallback} from 'react'
import Image from "next/image";
import Link from "next/link";
import {intervalToDuration} from "date-fns";


function CustomProductViewer({ product }) {

  const [saleType, setSaleType] = useState("");
  const [productInfo,setProductInfo] = useState(product)
  const [countDown, setCountDown] = useState("");
  const [inventory, setInventory] = useState("");
  const [saleTypeStatus, setSaleTypeStatus] = useState("normal");

  const handleCountDown = function (salesEndAt){

    const lastDate = new Date(salesEndAt).getTime();
    const currentDate = new Date();

    let duration = intervalToDuration({
      start: lastDate, 
      end: currentDate,
    })

    const {years,months,days,hours,minutes,seconds} = duration;
    let countDown = "";

    years>0 && (years>=10 ? countDown+= years+"yrs " : countDown+= 0+years+"yrs ");
    months>0 && (months>=10 ? countDown+= months+"mo " : countDown+= 0+months+"mo ");
    days>=10 ? countDown+= days+"d " : countDown+= 0+days+"d ";
    hours>=10 ? countDown+= hours+"h " : countDown+= 0+hours+"h ";
    minutes>=10 ? countDown+= minutes+"m " : countDown+= 0+minutes+"m ";
    seconds>=10 ? countDown+= seconds+"s " : countDown+= 0+seconds+"s ";

    const liveAt = new Date(productInfo.liveAt).getTime();
    
    if([years,months,days,hours,minutes,seconds].every(element => element <= 0)){

      setSaleTypeStatus("reload");
      return "Checking status ..."

    } 

    if( productInfo.auctions.length != 0 ){

      if(currentDate > liveAt && productInfo.auctions[0].info.bids.length>0){
        setSaleTypeStatus("liveAt");
      }

    }

    if( [years,months,days].every(element => element <= 0)  && hours<=1 ){

      if(currentDate > liveAt && productInfo.auctions[0].info.bids.length>0){
        setSaleTypeStatus("closeUp");
      }
      
    }

    return countDown;

  };


  const countDownFunction = useCallback( handleCountDown,[productInfo]);

  function getActualBid(array){

    let timeArray = [];
    array.forEach( bid => {
      const date = new Date(bid.createdAt).getTime();
      timeArray = [...timeArray, date];
    });
  
    const lastBid = Math.max(...timeArray);
  
    const lastPrice = array.filter(child => {
  
      const childUNIX = new Date(child.createdAt).getTime();
      return childUNIX == lastBid;
  
    } );

    return lastPrice[0].amount;
  
  }

  useEffect( () => {

    const saleTypes = {

      LIMITED_EDITION : "Limited edition",
      AUCTION : "Auction",
      OFF_CHAIN_AUCTION : "Auction",
      OPEN_CHAIN_AUCTION : "Auction",
      OPEN_EDITION : "Open edition"
  
    }

    setSaleType(saleTypes[productInfo.saleType]);

    let interval;

    if(saleTypes[productInfo.saleType] == "Auction" || saleTypes[productInfo.saleType] == "Open edition"){

      if(productInfo?.auctions[0]?.info?.ended === false || (saleTypes[productInfo.saleType] == "Open edition" && new Date(productInfo.salesEndAt).getTime() >  new Date().getTime())){

        if(saleTypeStatus != "reload"){
          interval = setInterval(() => {
            setCountDown(countDownFunction(productInfo.salesEndAt,interval) )
          }, 1000);
        }

      }else{
        setCountDown("Closed")
      }
      
    }

    if(saleTypes[productInfo.saleType] == "Limited edition"){

      if(productInfo.totalSold === productInfo.totalAvailable){
        setInventory("Sold Out");
      }else{
        setInventory(`${productInfo.totalAvailable - productInfo.totalSold } of ${productInfo.totalAvailable} left`); 
      }

    }

    return () => clearInterval(interval); // Always clear intervals and events in useeffect to evit event propagation

  }, [productInfo,countDownFunction,saleTypeStatus]);

  useEffect(() => {

    if(saleTypeStatus === "reload" ){

      setTimeout( () => {

        async function reloadComponent(){

          const request = await fetch(process.env.NEXT_PUBLIC_API_KEY+`/${product.id}`);
          const response = await request.json();
          setProductInfo(response.product);
          setSaleTypeStatus("normal");

        }
        
        reloadComponent();



      }, 60000);

    }

  }, [saleTypeStatus,product]);

  return (

    <div className='w-full flex flex-col items-start select-none'>

      <Link href={productInfo?.purchaseLink} passHref>
        
        <a className='w-full relative pb-[calc(100%*1)] max-h-[312px]'>

          <div className="absolute inset-0 w-full flex flex-col justify-center items-center">

            <div className='relative shadow-2xl w-full h-full flex max-h-full justify-center max-w-full transition-transform duration-200 ease-[ease-in-out] md:hover:scale-105'>

              {
                productInfo?.tokenMetadata?.animation_url != undefined ? (

                  <video loop muted playsInline autoPlay  className='object-cover h-full min-w-full max-h-full object-center w-full rounded-xl  mx-auto' >

                    <source src={productInfo.tokenMetadata.animation_url} />
                    <source src={productInfo.tokenMetadata.image} />
                    <p>Your browser Dont support videos</p>
                    
                  </video>

                ) :

                (

                  <Image
                    className='object-cover h-full w-full object-center rounded-xl'
                    src={productInfo?.tokenMetadata?.image}
                    alt={productInfo?.tokenMetadata?.title}
                    layout="fill"
                    quality={100}
                  />

                )

              }

            </div>       

          </div>

        </a>

      </Link>

      <section className='w-full flex flex-col items-start'>

        <div className={`flex w-full justify-between border-standard ${saleTypeStatus == "liveAt"? "liveActionColor" : ""}  ${saleTypeStatus == "closeUp" ? "closeUP text-white" : ""} rounded-lg my-5 border-2 px-2 space-x-2`}>

          <p className='flex items-center'>

            {
              saleType != "Auction" || saleTypeStatus == "normal"  ? (

                <>
                  {saleType}
                </>

              ) : saleTypeStatus == "liveAt" || saleTypeStatus == "reload" ? (

                <>

                  Live auction

                  <span className='ml-2 h-2.5 mt-1.5 w-2.5 rounded-full liveActionBg animate-pulse transition-all block'>
                  </span>

                </>

              ) : saleTypeStatus == "closeUp" ? (
                <>
                  Live auction
                </>
              ) : null
                
            }
            
          </p>

          <p>
            {
              saleType === "Auction" || saleType === "Open edition"  ? (

                <>
                  {countDown}
                </>
                
              ): (
                <>
                  {inventory}
                </>
              )
            }
          </p>

        </div>

        <div className='w-full flex flex-col space-y-5 items-start'>

          <h2 className="text-xl leading-[1.15] font-bold ">
            <Link href={productInfo?.purchaseLink}>
              {productInfo?.tokenMetadata?.name}
            </Link>
          </h2>

          <h3>
            <Link passHref href={`https://www.bitski.com/${productInfo?.username}`}>

              <a className='flex items-center space-x-2'>

                <Image
                  className='rounded-full object-cover '
                  src={`https://www.bitski.com/${productInfo?.username}/image`}
                  alt={""}
                  width={20}
                  height={20}
                />

                <p className='text-[#93979F] '>&#64;{productInfo?.username}</p>

              </a>

            </Link>
          </h3>

          <p className='font-bold text-[1.125rem]'>

            {
              saleType !== "Auction" ? (
                <>
                  ${productInfo?.prices[0]?.price}
                </>
              ) : (saleTypeStatus == "normal" || saleTypeStatus == "reload") && (countDown != "Closed" || productInfo.auctions[0].info.bids.length == 0) ? (
                <>
                  ${productInfo.auctions[0].info.minBid}
                </>
              ) : (
                <>
                  ${getActualBid(productInfo.auctions[0].info.bids)}

                  { countDown != "Closed" ? (

                    <span className="text-sm ml-2 text-[#93979f]">
                     Current bid
                    </span>

                  ): ""}
                  
                </>
                
              )
              
            }

          </p>

        </div>

      </section>

    </div>

  )
}

export default CustomProductViewer