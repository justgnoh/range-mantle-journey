const axios = require('axios');

const mantle_agni_subgraph_link = "https://graph.fusionx.finance/subgraphs/name/mantle-agni"
const args = process.argv.slice(2);

// Input Address can be arbitrary
// let input_address = "0x6D81FBdba7Cc3AFB7926F80C734965746b297668";
let input_address = args[0];

// Gets the RangeAPY notional value
/**
 * Fetches the RangeAPY.json of all vaults in Range Protocol
 * @returns Subgraph query results
 */
async function getRangeAPY() {
    const response = await axios.get("https://rangeprotocol-public.s3.ap-southeast-1.amazonaws.com/data/RangeAPY.json");
    // console.log(response.data.data);
    return response.data.data;
}

/**
 * Gets the LP Balances for each vault they are participating in
 * @param {String} subgraph link to subgraph
 * @param {String} addressToValidate address to be queried
 * @returns raw subgraph query results
 */
async function getBalances(subgraph, addressToValidate) {
    const result = await axios.post(subgraph, {
        query: `{
            user(id: "${addressToValidate}") {
                vaultBalances {
                    balance
                    vault {
                      totalSupply
                      id
                    }
                  }
              }
        }`
    })

    return result;
}

/**
 * Validates the multiplier of Mantle Journey miles for each valid LP position in Range Vaults
 * @param {*} balanceQuery 
 * @param {*} currentVaultNotionalQuery 
 * @returns 
 */
async function validateMJ(balanceQuery, currentVaultNotionalQuery) {
    let validMJCounter = 0;
    
    // Process balanceQuery
    let vaultBalances = balanceQuery.user.vaultBalances;
    
    for (let v = 0; v < vaultBalances.length; v++) {
        let targetVault = vaultBalances[v].vault.id;
        let userBalance = vaultBalances[v].balance;
        let totalSupply = vaultBalances[v].vault.totalSupply;

        // Process Notional Value
        // TODO: Why is it not detecting? A: Needed lower case
        let notional = currentVaultNotionalQuery.find(e => e.vault.toLowerCase() == targetVault).current_notional;
        console.log("Notional: " + notional);
        console.log("User Balance: " + userBalance);
        console.log("Total Supply of Vault: " + totalSupply);
        console.log("targetVault: " + targetVault);

        // Sanity Check
        console.log((notional/totalSupply)*userBalance);
        
        // Check if user's balance LP position has a notional value of >$50
        if ((notional/totalSupply)*userBalance >= 50) {
            validMJCounter++;
        }
    }
    return validMJCounter;
}


// Driver Function
async function main(address) {
    let balanceQuery = await getBalances(mantle_agni_subgraph_link, address);
    let rangeAPYQuery = await getRangeAPY();
    let result = await validateMJ(balanceQuery.data.data,rangeAPYQuery);
    console.log(result);
}

main(input_address);