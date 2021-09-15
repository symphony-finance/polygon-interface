import React, { createContext, useContext, useState, useMemo } from 'react'
// import { ethers } from 'ethers'
// import { useBlockNumber } from './Application'

const GasContext = createContext()

function useGasContext() {
  return useContext(GasContext)
}

export default function Provider({ children }) {
  const [gasPrice, setGasPrice] = useState()

  // const globalBlockNumber = useBlockNumber()

  // useEffect(() => {
  //   fetch("https://gasstation-mainnet.matic.network").then((res) => {
  //     res.json().then(gasInfo => {
  //       try {
  //         console.log(Math.ceil(gasInfo.fast) * 10 ** 9)
  //         setGasPrice(ethers.BigNumber.from(Math.ceil(gasInfo.fast) * 10 ** 9))
  //       } catch { }
  //     })
  //   })
  // }, [globalBlockNumber])

  return (
    <GasContext.Provider value={useMemo(() => [gasPrice, { setGasPrice }], [gasPrice, setGasPrice])}>
      {children}
    </GasContext.Provider>
  )
}

export function useGasPrice() {
  const [gasPrice] = useGasContext()
  return gasPrice
}
