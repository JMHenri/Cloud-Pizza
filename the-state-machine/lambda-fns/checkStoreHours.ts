exports.handler = async function(customerInfo:any) {
  try {
      console.log("Processing pizza order:", JSON.stringify(customerInfo, undefined, 2));
      
      let containsPineapple = false;
      
      if(customerInfo.homeType === 'ip'){
          //todo - post request pizza delivery.
          containsPineapple = true;
      } else if(customerInfo.homeType === 'email'){
          //todo - ses pizza delivery
      } else if(customerInfo.homeType === 'house'){
          //todo - house pizza lambda
      }

      return {'containsPineapple': containsPineapple}
  } catch (e) {
      console.error(e);
  }
}