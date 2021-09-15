import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { useWeb3React } from '@web3-react/core'
import { ChainId } from '@sushiswap/sdk'

import { isAddress, getTokenName, getTokenSymbol, getTokenDecimals, safeAccess } from '../utils'
import { DEFAULT_TOKENS_EXTRA } from './DefaultTokens'

const NAME = 'name'
const SYMBOL = 'symbol'
const DECIMALS = 'decimals'
const EXCHANGE_ADDRESS = 'exchangeAddress'

// the Uniswap Default token list lives here
// https://unpkg.com/quickswap-default-token-list
export const DEFAULT_TOKEN_LIST_URL = ''

const UPDATE = 'UPDATE'
const SET_LIST = 'SET_LIST'

const ETH = {
  ETH: {
    [NAME]: 'MATIC',
    [SYMBOL]: 'MATIC',
    [DECIMALS]: 18,
    [EXCHANGE_ADDRESS]: null
  }
}

export const WETH = {
  1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  42: '0xd0A1E359811322d97991E03f863a0C30C2cF029C',
  137: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  80001: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
}

const EMPTY_LIST = {
  [ChainId.KOVAN]: {},
  [ChainId.MAINNET]: {},
  [ChainId.MATIC]: {},
  [ChainId.MATIC_TESTNET]: {},
}

const TokensContext = createContext()

function useTokensContext() {
  return useContext(TokensContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { chainId, tokenAddress, name, symbol, decimals } = payload
      return {
        ...state,
        [chainId]: {
          ...(safeAccess(state, [chainId]) || {}),
          [tokenAddress]: {
            [NAME]: name,
            [SYMBOL]: symbol,
            [DECIMALS]: decimals
          }
        }
      }
    }
    case SET_LIST: {
      return payload
    }
    default: {
      throw Error(`Unexpected action type in TokensContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, EMPTY_LIST)

  useEffect(() => {
    // fetch(DEFAULT_TOKEN_LIST_URL)
    //   .then(res =>
    //     res.json().then(list => {
    //       const tokenList = list.tokens
    //         .filter(token => !DISABLED_TOKENS[token.symbol])
    // const tokenList = []
    // .concat(DEFAULT_TOKENS_EXTRA)
    const tokenList = DEFAULT_TOKENS_EXTRA
      .reduce(
        (tokenMap, token) => {
          if (tokenMap[token.chainId][token.address] !== undefined) {
            console.warn('Duplicate tokens.')
            return tokenMap
          }

          return {
            ...tokenMap,
            [token.chainId]: {
              ...tokenMap[token.chainId],
              [token.address]: token
            }
          }
        },
        { ...EMPTY_LIST }
      );
    dispatch({ type: SET_LIST, payload: tokenList })
    //   })
    // )
    // .catch(e => console.error(e.message))
  }, [])

  const update = useCallback((chainId, tokenAddress, name, symbol, decimals) => {
    dispatch({ type: UPDATE, payload: { chainId, tokenAddress, name, symbol, decimals } })
  }, [])

  return (
    <TokensContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </TokensContext.Provider>
  )
}

export function useTokenDetails(tokenAddress) {
  const { chainId, library } = useWeb3React()

  const [state, { update }] = useTokensContext()
  const allTokensInNetwork = { ...ETH, ...(safeAccess(state, [chainId]) || {}) }
  const { [NAME]: name, [SYMBOL]: symbol, [DECIMALS]: decimals } = safeAccess(allTokensInNetwork, [tokenAddress]) || {}

  useEffect(() => {
    if (
      isAddress(tokenAddress) &&
      (name === undefined || symbol === undefined || decimals === undefined) &&
      (chainId || chainId === 0) &&
      library
    ) {
      let stale = false

      const namePromise = getTokenName(tokenAddress, library).catch(() => null)
      const symbolPromise = getTokenSymbol(tokenAddress, library).catch(() => null)
      const decimalsPromise = getTokenDecimals(tokenAddress, library).catch(() => null)

      Promise.all([namePromise, symbolPromise, decimalsPromise]).then(
        ([resolvedName, resolvedSymbol, resolvedDecimals]) => {
          if (!stale) {
            update(chainId, tokenAddress, resolvedName, resolvedSymbol, resolvedDecimals)
          }
        }
      )
      return () => {
        stale = true
      }
    }
  }, [tokenAddress, name, symbol, decimals, chainId, library, update])

  return { name, symbol, decimals, chainId }
}

export function useAllTokenDetails(r) {
  const { chainId } = useWeb3React()

  const [state] = useTokensContext()
  const tokenDetails = { ...ETH, ...(safeAccess(state, [chainId]) || {}) }

  return tokenDetails
}
