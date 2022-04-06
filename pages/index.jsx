import { createClient } from 'contentful'
import Carousel from '../components/Carousel';

export default function Home({products,title}) {
  
  return (

    <main className="min-h-screen w-full h-full py-20 px-5 md:px-20 max-w-[1440px] mx-auto">
      <h1 className='text-7xl text-center '>{title}</h1>
      <Carousel products={products} />
    </main>

  )
}

export const getStaticProps = async (ctx) => {

  const client = createClient({

    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_ACCESS_KEY

  })

  const res = await client.getEntries({content_type: "tokens"});

  const allUnix = res.items.map(item => {

    const publishedAtUNIX = new Date(item.sys.updatedAt).getTime();
    return publishedAtUNIX;

  });

  const sortDates = allUnix.sort(function(a, b) {
    return a - b;
  });

  const lastPublish = res.items.find(item =>  new Date(item.sys.updatedAt).getTime() ===  sortDates[sortDates.length - 1]);

  async function requestProduct(id){

    try {

      if (!String.prototype.replaceAll) {
        String.prototype.replaceAll = function(str, newStr){
      
          // If a regex pattern
          if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
            return this.replace(str, newStr);
          }
      
          // If a string
          return this.replace(new RegExp(str, 'g'), newStr);
      
        };
      }

      // example ID = 5f267ee7-aaa1-4f7d-b9cf-776cdafe71db -> 844412 (each number is string.length of the split)

      const productId = id.toString().trim().replaceAll("'","").replaceAll('"',"");

      const keys = productId.split("-");
      let validCombination = "";

      keys.forEach(key => validCombination += `${key.length}` )

      if(validCombination === "844412"){

        const endpoint = process.env.NEXT_PUBLIC_API_KEY;
        const request = await fetch(endpoint.concat(`/${productId}`));
        const response = await request.json();
        return response.product;      

      }

      return {id};

    } catch (error) {
      return {id};
    }
    
  }

  async function specificProducts(){

    let arrayProducts =  lastPublish.fields.tokens.tokens;
    const allResponses = await Promise.all(arrayProducts.map(id => requestProduct(id)));
    return allResponses;
    
  }

  const [products] = await Promise.all([specificProducts()]);
  
  return {
    props:{
      products,
      title: lastPublish.fields.collectionTitle
    }
  }
}