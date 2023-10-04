const fs = require('fs');
const axios = require('axios');

const mantle_agni_subgraph_link = "https://graph.fusionx.finance/subgraphs/name/mantle-agni"

async function getRangeAPY() {
    const response = await axios.get("https://rangeprotocol-public.s3.ap-southeast-1.amazonaws.com/data/RangeAPY.json");
    return response.data.data;
}

/**
 * Queries subgraph for users that are participating as LPs
 * @param {*} subgraph link for subgraph
 * @returns JSON subgraph query of each vault and their LPs
 */
async function getLPHoldersForEachVault(subgraph) {
    const result = await axios.post(subgraph, {
        query: `{
            vaults {
                id
                name
                totalSupply
                userBalances(where: {balance_gt: "0"}) {
                  address
                  balance
                }
            }
        }`
    })

    return result;
}

/**
 * Calculates the notional value of each LP
 * @param {*} vaultData a vault's data from subgraph query
 * @param {*} userData an LPs data from a specified vault
 * @returns notional value of all of a LPs positions for a given network on Range Protocol
 */
async function testHelper(vaultData, userData) {
    // Get userBalance
    let userBalance = userData.balance;

    // Get vault total supply
    let totalSupply = vaultData.totalSupply;

    // Get vault ID
    let targetVault = vaultData.id;
    
    // Get current notional
    let rangeAPYQuery = await getRangeAPY();
    let current_notional = rangeAPYQuery.find(e => e.vault.toLowerCase() == targetVault).current_notional;

    return (current_notional/totalSupply)*userBalance;
}

/**
 * Get the eligibility statistics of each LP for each vault
 * @returns a JSON object of each LP and their respective, address, notional value, Mantle Journey multiplier
 */
async function test() {
    let LPs = await getLPHoldersForEachVault(mantle_agni_subgraph_link);
    let iterable = LPs.data.data.vaults;

    let result = [];
    /**
     * {
     *  addres: 0x123123123
     *  points: 0
     *  notional: 0
     * }
     */

    for (let i = 0; i < iterable.length; i++) {
        console.log(iterable[i].name);
        for (let j = 0; j < iterable[i].userBalances.length; j++) {
            let thisUser = iterable[i].userBalances[j];
            console.log("@@@@@@@@@@@@@@@ Processing: " + thisUser.address);
            let mj = await testHelper(iterable[i], thisUser);
            
            let isExist = result.find(e=>e.address == thisUser.address)
            if (isExist) {
                // Exists
                console.log("Address exists");
                if (mj >= 50) {
                    isExist.points = isExist.points+1;
                    isExist.notional = isExist.notional+mj;
                }
            } else {
                // Does not exist
                let newEntry = {
                    address: thisUser.address,
                    points: mj >= 50 ? 1 : 0,
                    notional: mj
                }
                result.push(newEntry);
            }
        }
    }
    fs.appendFileSync('results.json', JSON.stringify(result),'utf-8');
    return result;
}

test();