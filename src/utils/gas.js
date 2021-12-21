import fetch from 'isomorphic-fetch'
import { BigNumber } from 'ethers'

export async function getGasPrice() {
    let gasPrice = BigNumber.from(10e9);

    // Chain Id should be polygon to fetch gas data
    try {
        gasPrice = BigNumber.from(await getGasTracker());
        gasPrice = gasPrice.add(BigNumber.from(1))
        gasPrice = gasPrice.mul(BigNumber.from(1e9));
    } catch (e) {
        console.log('Error when fetching gas data:', e.message)
    }

    return gasPrice
}

// function getGasStation() {
//     return new Promise(async (resolve, reject) => {
//         try {
//             const res = await fetch('https://gasstation-mainnet.matic.network')
//             const data = await res.json()
//             const gasPrice = Math.ceil(data.fast)
//             resolve(gasPrice)
//         } catch (error) {
//             reject(error)
//         }
//     })
// }

async function getGasTracker() {
    try {
        const res = await fetch(
            'https://gpoly.blockscan.com/gasapi.ashx?apikey=key&method=pendingpooltxgweidata'
        )
        const data = await res.json()
        const gasPrice = Math.ceil(data.result.standardgaspricegwei)
        return gasPrice
    } catch (e) {
        console.log('Error when fetching gas data from gas tracker:', e.message)
        return 0
    }
}
