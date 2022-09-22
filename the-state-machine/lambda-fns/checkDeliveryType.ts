exports.handler = async function(customerInfo:any) {
    console.log("Processing pizza order:", JSON.stringify(customerInfo, undefined, 2));
    
    let canDeliver = false;
    
    if(customerInfo.addressType === 'post'){
        canDeliver = true;
    } else if(customerInfo.addressType === 'email'){
        canDeliver = true;
    } else if(customerInfo.addressType === 'physical'){
        canDeliver = false;
    }

    return {canDeliver};
}