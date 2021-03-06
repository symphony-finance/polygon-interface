import { getTokenReserves, getMarketDetails } from '@uniswap/sdk'
// import { getTokenReserves, getMarketDetails } from '@sushiswap/sdk';
import axios from "axios";
import BigNumber from "bignumber.js";
import { tokenList } from "./tokenList";
import { getMedian, getMean } from './math'

const coingeckoApi = "https://api.coingecko.com/api/v3";

const DAI = 'DAI'
const USDC = 'USDC'
const TUSD = 'TUSD'

const USD_STABLECOINS = [DAI, USDC, TUSD]

const USD_STABLECOIN_ADDRESSES = [
  '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  '0x8dd5fbCe2F6a956C3022bA3663759011Dd51e73E'
]

function forEachStablecoin(runner) {
  return USD_STABLECOINS.map((stablecoin, index) => runner(index, stablecoin))
}

export async function getUSDPrice(library) {
  return Promise.all(forEachStablecoin(i => getTokenReserves(USD_STABLECOIN_ADDRESSES[i], library))).then(reserves => {
    const ethReserves = forEachStablecoin(i => reserves[i].ethReserve.amount)
    const marketDetails = forEachStablecoin(i => getMarketDetails(reserves[i], undefined))

    const ethPrices = forEachStablecoin(i => marketDetails[i].marketRate.rateInverted)

    const [median, medianWeights] = getMedian(ethPrices)
    const [mean, meanWeights] = getMean(ethPrices)
    const [weightedMean, weightedMeanWeights] = getMean(ethPrices, ethReserves)

    const ethPrice = getMean([median, mean, weightedMean])[0]
    const _stablecoinWeights = [
      getMean([medianWeights[0], meanWeights[0], weightedMeanWeights[0]])[0],
      getMean([medianWeights[1], meanWeights[1], weightedMeanWeights[1]])[0],
      getMean([medianWeights[2], meanWeights[2], weightedMeanWeights[2]])[0]
    ]
    const stablecoinWeights = forEachStablecoin((i, stablecoin) => ({
      [stablecoin]: _stablecoinWeights[i]
    })).reduce((accumulator, currentValue) => ({ ...accumulator, ...currentValue }), {})

    return [ethPrice, stablecoinWeights]
  })
}

export const getTokenValueInUsd = async (address, amount) => {
    try {
        const tokenData = tokenList[address]
        const name = tokenData.coingeckoId;
        
        const res = await axios.get(
            `${coingeckoApi}/simple/price?ids=${name}&vs_currencies=usd`
        )

        if (res.data) {
            const tokenPriceInUsd = new BigNumber(res.data[name].usd)

            const inputAmount = new BigNumber(amount.toString()).dividedBy(
                new BigNumber(10).exponentiatedBy(new BigNumber(tokenData.decimals))
            );

            return tokenPriceInUsd.times(inputAmount);
        } else {
            return undefined
        }
    } catch(e) {
        console.log(`Price Coingecko:: ${e.message}`);
        return undefined
    }
};

