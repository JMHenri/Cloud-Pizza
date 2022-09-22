exports.handler = async function(customerInfo:any) {
    console.log("Processing pizza order:", JSON.stringify(customerInfo, undefined, 2));
    
    let storesAreOpen = true;

    return {storesAreOpen};
}