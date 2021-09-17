import fetch from 'isomorphic-fetch'
import { BigNumber } from 'ethers'

export async function getGasPrice() {
    let gasPrice = BigNumber.from(0)

    try {
        const [resGasStation] = await Promise.all([
            getGasStation(),
        ]);
        gasPrice = BigNumber.from(resGasStation.toNumber());

        if (gasPrice.toNumber() > 200000000000) {
            return BigNumber.from(0)
        }
    } catch (e) {
        console.log('Error when fetching gas data:', e.message)
    }
    return gasPrice
}

async function getGasStation() {
    let gasPrice = BigNumber.from(0)

    try {
        const res = await fetch('https://gasstation-mainnet.matic.network')
        const data = await res.json()
        gasPrice = BigNumber.from(Math.ceil(data.standard) + 1)
    } catch (e) {
        console.log('Error when fetching gas data:', e.message)
    }

    return gasPrice.mul(BigNumber.from(1e9))
}
