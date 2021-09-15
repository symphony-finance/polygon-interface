import { Token, ChainId, JSBI, WNATIVE, Percent } from '@sushiswap/sdk'

import { ethers } from 'ethers'

// @TODO: we should test walletconnect, walletlink before adding
import { injected, fortmatic, portis } from '../connectors'
import { MATIC } from './tokens'

export const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
export const ZERO_PERCENT = new Percent('0')
export const ONE_HUNDRED_PERCENT = new Percent('1')

export const ORDER_GRAPH = {
  42: 'https://api.thegraph.com/subgraphs/name/symphony-finance/symphony-kovan',
  137: 'https://api.thegraph.com/subgraphs/name/symphony-finance/symphony-polygon',
  80001: 'https://api.thegraph.com/subgraphs/name/symphony-finance/symphony-mumbai',
}

export const SYMPHONY_ADDRESSES = {
  [ChainId.KOVAN]: '0x67030de8a710f2E82DDf5aC3DD95de1E4357883B',
  [ChainId.MATIC]: '0xa9938c13F2C446c7dECd9D9Ebee6db8100Ca4157',
  [ChainId.MATIC_TESTNET]: '0x93f5eCBBc2AE8B1b251599904f982092cb1A86aB',
}

export const WETH_GATEWAY_ADDRESSES = {
  [ChainId.KOVAN]: '0xea360D7BD540F1e6566180e06de8aCDd65bbA8ed',
  [ChainId.MATIC]: '0x9756FB4d149e07dF9844282a0aF8F6527e37015B',
  [ChainId.MATIC_TESTNET]: '0xB4c6fd66801762fdfFFB3E0a59B3bf3431d29990',
}

export const WETH_ADDRESSES = {
  [ChainId.KOVAN]: '0xd0A1E359811322d97991E03f863a0C30C2cF029C',
  [ChainId.MATIC]: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  [ChainId.MATIC_TESTNET]: '0x6aA61E359301b2E9a3c3118d409834BDc8b10dC4',
}

export const UNISWAPV2_ADDRESSES = {
  42: {
    FACTORY: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
  },
  137: {
    FACTORY: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32'
  },
  80001: {
    FACTORY: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4'
  },
}

export const GENERIC_GAS_LIMIT_ORDER_EXECUTE = ethers.BigNumber.from(400000)

export const DAI = new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'Dai Stablecoin')
export const USDC = new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD//C')
export const USDT = new Token(ChainId.MAINNET, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD')
export const COMP = new Token(ChainId.MAINNET, '0xc00e94Cb662C3520282E6f5717214004A7f26888', 18, 'COMP', 'Compound')
export const MKR = new Token(ChainId.MAINNET, '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', 18, 'MKR', 'Maker')

const WRAPPED_NATIVE_ONLY = {
  [ChainId.MAINNET]: [WNATIVE[ChainId.MAINNET]],
  [ChainId.KOVAN]: [WNATIVE[ChainId.KOVAN]],
  [ChainId.MATIC]: [WNATIVE[ChainId.MATIC]],
  [ChainId.MATIC_TESTNET]: [WNATIVE[ChainId.MATIC_TESTNET]],
}

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST = {
  ...WRAPPED_NATIVE_ONLY,
  [ChainId.MATIC]: [...WRAPPED_NATIVE_ONLY[ChainId.MATIC], MATIC.USDC, MATIC.WBTC, MATIC.DAI, MATIC.WETH, MATIC.USDT],
  [ChainId.MAINNET]: [...WRAPPED_NATIVE_ONLY[ChainId.MAINNET], DAI, USDC, USDT, COMP, MKR]
}

export const ADDITIONAL_BASES = {
  [ChainId.MATIC]: {
    [MATIC.FRAX.address]: [MATIC.FXS],
    [MATIC.FXS.address]: [MATIC.FRAX],
    [MATIC.DRAX.address]: [MATIC.DMAGIC],
    [MATIC.AXMATIC.address]: [MATIC.DMAGIC],
    //[MATIC.DMAGIC.address]: [MATIC.DRAX, MATIC.AXMATIC],
  },
}

export const CUSTOM_BASES = {
  [ChainId.MATIC]: {
    [MATIC.TEL.address]: [MATIC.SUSHI, MATIC.AAVE],
  },
}

export const BETTER_TRADE_LESS_HOPS_THRESHOLD = new Percent(JSBI.BigInt(50), JSBI.BigInt(10000))

export const NetworkContextName = 'NETWORK'

const TESTNET_CAPABLE_WALLETS = {
  INJECTED: {
    connector: injected,
    name: 'Injected',
    iconName: 'arrow-right.svg',
    description: 'Injected web3 provider.',
    href: null,
    color: '#010101',
    primary: true
  },
  METAMASK: {
    connector: injected,
    name: 'MetaMask',
    iconName: 'metamask.png',
    description: 'Easy-to-use browser extension.',
    href: null,
    color: '#E8831D'
  }
}

export const SUPPORTED_WALLETS = {
  ...TESTNET_CAPABLE_WALLETS,
  ...{
    // WALLET_CONNECT: {
    //   connector: walletconnect,
    //   name: 'WalletConnect',
    //   iconName: 'walletConnectIcon.svg',
    //   description: 'Connect to Trust Wallet, Rainbow Wallet and more...',
    //   href: null,
    //   color: '#4196FC',
    //   mobile: true
    // },
    // WALLET_LINK: {
    //   connector: walletlink,
    //   name: 'Coinbase Wallet',
    //   iconName: 'coinbaseWalletIcon.svg',
    //   description: 'Use Coinbase Wallet app on mobile device',
    //   href: null,
    //   color: '#315CF5'
    // },
    // COINBASE_LINK: {
    //   name: 'Open in Coinbase Wallet',
    //   iconName: 'coinbaseWalletIcon.svg',
    //   description: 'Open in Coinbase Wallet app.',
    //   href: 'https://go.cb-w.com/mtUDhEZPy1',
    //   color: '#315CF5',
    //   mobile: true,
    //   mobileOnly: true
    // },
    Portis: {
      connector: portis,
      name: 'Portis',
      iconName: 'portisIcon.png',
      description: 'Login using Portis hosted wallet',
      href: null,
      color: '#4A6C9B',
      mobile: true
    },
    FORTMATIC: {
      connector: fortmatic,
      name: 'Fortmatic',
      iconName: 'fortmaticIcon.png',
      description: 'Login using Fortmatic hosted wallet',
      href: null,
      color: '#6748FF',
      mobile: true
    }
  }
}

export const MULTICALL_NETWORKS = {
  [ChainId.MAINNET]: '0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441',
  [ChainId.ROPSTEN]: '0x53C43764255c17BD724F74c4eF150724AC50a3ed',
  [ChainId.KOVAN]: '0x2cc8688C5f75E365aaEEb4ea8D6a480405A48D2A',
  [ChainId.RINKEBY]: '0x42Ad527de7d4e9d9d011aC45B31D8551f8Fe9821',
  [ChainId.GÖRLI]: '0x77dCa2C955b15e9dE4dbBCf1246B4B85b651e50e',
  [ChainId.MATIC]: '0x95028E5B8a734bb7E2071F96De89BABe75be9C8E',
  [ChainId.MATIC_TESTNET]: '0x935Bfe9AfaA2Be26049ea4EDE40A3A2243361F87',
}

export const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000"