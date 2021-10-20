import fetch from 'isomorphic-fetch'
import { BigNumber } from 'ethers'

export async function getGasPrice() {
    let gasPrice = BigNumber.from(10e9);

    // Chain Id should be polygon to fetch gas data
    try {
        gasPrice = BigNumber.from(await getGasStation());
        gasPrice = gasPrice.add(BigNumber.from(1))
        gasPrice = gasPrice.mul(BigNumber.from(1e9));
    } catch (e) {
        console.log('Error when fetching gas data:', e.message)
    }

    if (gasPrice.gt(BigNumber.from(200e9))) {
        gasPrice = BigNumber.from(100e9)
    }
    return gasPrice
}

function getGasStation() {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await fetch('https://gasstation-mainnet.matic.network')
            const data = await res.json()
            const gasPrice = Math.ceil(data.fast)
            resolve(gasPrice)
        } catch (error) {
            reject(error)
        }
    })
}
