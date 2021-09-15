import { Trade, Token, JSBI, Pair, CurrencyAmount, FACTORY_ADDRESS, computePairAddress } from '@sushiswap/sdk'
import flatMap from 'lodash.flatmap'
import { useMemo } from 'react'
import { Interface } from '@ethersproject/abi'
import { parseUnits } from '@ethersproject/units'

import { ADDITIONAL_BASES, BASES_TO_CHECK_TRADES_AGAINST, BETTER_TRADE_LESS_HOPS_THRESHOLD, CUSTOM_BASES, ONE_HUNDRED_PERCENT, ZERO_PERCENT } from '../constants'
import PAIR_ABI from '../constants/abis/pair.json'
import { useActiveWeb3React } from './index'
import { useTokenDetails } from '../contexts/Tokens'

import { useMultipleContractSingleData } from '../state/multicall/hooks'

export const PairState = {
  LOADING: 'LOADING',
  NOT_EXISTS: 'NOT_EXISTS',
  EXISTS: 'EXISTS',
  INVALID: 'INVALID'
}

const ETHER = {
  address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  chainId: 137,
  decimals: 18,
  isNative: false,
  isToken: true,
  name: "Matic Token",
  symbol: "MATIC"
}

const PAIR_INTERFACE = new Interface(PAIR_ABI)

function useAllCommonPairs(currencyA, currencyB) {
  const allCurrencyCombinations = useAllCurrencyCombinations(currencyA, currencyB)

  const allPairs = useV2Pairs(allCurrencyCombinations)

  // only pass along valid pairs, non-duplicated pairs
  return useMemo(
    () =>
      Object.values(
        allPairs
          // filter out invalid pairs
          .filter((result) => Boolean(result[0] === PairState.EXISTS && result[1]))
          // filter out duplicated pairs
          .reduce((memo, [, curr]) => {
            memo[curr.liquidityToken.address] = memo[curr.liquidityToken.address] ?? curr
            return memo
          }, {})
      ),
    [allPairs]
  )
}

const MAX_HOPS = 3

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useTradeExactIn(
  currencyAddressIn,
  currencyAmountIn,
  currencyAddressOut,
  { maxHops = MAX_HOPS } = {}
) {
  const currencyIn = useTokenDetails(currencyAddressIn)

  const currencyOutDetail = useTokenDetails(currencyAddressOut)
  const currencyOut = currencyAddressOut && currencyOutDetail && currencyOutDetail.decimals
    ? currencyAddressOut === 'ETH'
      ? new Token(ETHER.chainId, ETHER.address, ETHER.decimals, ETHER.symbol, ETHER.name)
      : new Token(
        currencyOutDetail.chainId,
        currencyAddressOut,
        currencyOutDetail.decimals,
        currencyOutDetail.symbol,
        currencyOutDetail.name
      )
    : undefined

  const currencyInputAmount = tryParseAmount(
    currencyAmountIn,
    currencyAddressIn
      ? currencyAddressIn === 'ETH'
        ? new Token(ETHER.chainId, ETHER.address, ETHER.decimals, ETHER.symbol, ETHER.name)
        : new Token(currencyIn.chainId, currencyAddressIn, currencyIn.decimals, currencyIn.symbol, currencyIn.name)
      : undefined
  )

  const allowedPairs = useAllCommonPairs(currencyInputAmount ? currencyInputAmount.currency : undefined, currencyOut)

  return useMemo(() => {
    if (currencyInputAmount && currencyOut && allowedPairs.length > 0) {
      if (maxHops === 1) {
        return (
          Trade.bestTradeExactIn(allowedPairs, currencyInputAmount, currencyOut, {
            maxHops: 1,
            maxNumResults: 1,
          })[0] ?? null
        )
      }
      // search through trades with varying hops, find best trade out of them
      let bestTradeSoFar = null
      for (let i = 1; i <= maxHops; i++) {
        const currentTrade =
          Trade.bestTradeExactIn(allowedPairs, currencyInputAmount, currencyOut, {
            maxHops: i,
            maxNumResults: 1,
          })[0] ?? null
        // if current trade is best yet, save it
        if (isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
          bestTradeSoFar = currentTrade
        }
      }
      return bestTradeSoFar
    }

    return null
  }, [allowedPairs, currencyOut, maxHops, currencyInputAmount])
}

export function useV2Pairs(currencies) {
  const tokens = useMemo(
    () => currencies.map(([currencyA, currencyB]) => [currencyA?.wrapped, currencyB?.wrapped]),
    [currencies]
  )

  const pairAddresses = useMemo(
    () =>
      tokens.map(([tokenA, tokenB]) => {
        return tokenA &&
          tokenB &&
          tokenA.chainId === tokenB.chainId &&
          !tokenA.equals(tokenB) &&
          FACTORY_ADDRESS[tokenA.chainId]
          ? computePairAddress({
            factoryAddress: FACTORY_ADDRESS[tokenA.chainId],
            tokenA,
            tokenB,
          })
          : undefined
      }),
    [tokens]
  )

  const results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'getReserves')

  return useMemo(() => {
    return results.map((result, i) => {
      const { result: reserves, loading } = result
      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]
      if (loading) return [PairState.LOADING, null]
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
      if (!reserves) return [PairState.NOT_EXISTS, null]
      const { _reserve0, _reserve1 } = reserves
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      return [
        PairState.EXISTS,
        new Pair(
          CurrencyAmount.fromRawAmount(token0, _reserve0.toString()),
          CurrencyAmount.fromRawAmount(token1, _reserve1.toString())
        ),
      ]
    })
  }, [results, tokens])
}

export function useV2Pair(tokenA, tokenB) {
  const inputs = useMemo(() => [[tokenA, tokenB]], [tokenA, tokenB])
  return useV2Pairs(inputs)[0]
}

export function useAllCurrencyCombinations(currencyA, currencyB) {
  const { chainId } = useActiveWeb3React()

  const [tokenA, tokenB] = chainId ? [currencyA, currencyB] : [undefined, undefined]

  const bases = useMemo(() => {
    if (!chainId) return []

    const common = BASES_TO_CHECK_TRADES_AGAINST[chainId] ?? []
    const additionalA = tokenA ? ADDITIONAL_BASES[chainId]?.[tokenA.address] ?? [] : []
    const additionalB = tokenB ? ADDITIONAL_BASES[chainId]?.[tokenB.address] ?? [] : []

    return [...common, ...additionalA, ...additionalB]
  }, [chainId, tokenA, tokenB])

  const basePairs = useMemo(
    () => flatMap(bases, (base) => bases.map((otherBase) => [base, otherBase])),
    [bases]
  )

  return useMemo(
    () =>
      tokenA && tokenB
        ? [
          // the direct pair
          [tokenA, tokenB],
          // token A against all bases
          ...bases.map((base) => [tokenA, base]),
          // token B against all bases
          ...bases.map((base) => [tokenB, base]),
          // each base against all bases
          ...basePairs,
        ]
          .filter(([t0, t1]) => t0.address !== t1.address)
          .filter(([tokenA, tokenB]) => {
            if (!chainId) return true
            const customBases = CUSTOM_BASES[chainId]

            const customBasesA = customBases?.[tokenA.address]
            const customBasesB = customBases?.[tokenB.address]

            if (!customBasesA && !customBasesB) return true

            if (customBasesA && !customBasesA.find((base) => tokenB.equals(base))) return false
            if (customBasesB && !customBasesB.find((base) => tokenA.equals(base))) return false

            return true
          })
        : [],
    [tokenA, tokenB, bases, basePairs, chainId]
  )
}

export function isTradeBetter(
  tradeA,
  tradeB,
  minimumDelta = ZERO_PERCENT
) {
  if (tradeA && !tradeB) return false
  if (tradeB && !tradeA) return true
  if (!tradeA || !tradeB) return undefined

  if (
    tradeA.tradeType !== tradeB.tradeType ||
    !tradeA.inputAmount.currency.equals(tradeB.inputAmount.currency) ||
    !tradeB.outputAmount.currency.equals(tradeB.outputAmount.currency)
  ) {
    throw new Error('Comparing incomparable trades')
  }

  if (minimumDelta.equalTo(ZERO_PERCENT)) {
    return tradeA.executionPrice.lessThan(tradeB.executionPrice)
  } else {
    return tradeA.executionPrice.asFraction
      .multiply(minimumDelta.add(ONE_HUNDRED_PERCENT))
      .lessThan(tradeB.executionPrice)
  }
}

export function tryParseAmount(value, currency) {
  if (!value || !currency) {
    return undefined
  }
  try {
    const typedValueParsed = parseUnits(value, currency.decimals).toString()
    if (typedValueParsed !== '0') {
      return CurrencyAmount.fromRawAmount(currency, JSBI.BigInt(typedValueParsed))
    }
  } catch (error) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error)
  }
  // necessary for all paths to return a value
  return undefined
}
