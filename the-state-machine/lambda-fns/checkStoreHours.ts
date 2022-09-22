exports.handler = async function() {
    const storesAreOpen = Date.now() % 2 == 1;

    return {storesAreOpen};
}