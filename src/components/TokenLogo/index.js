import React, { useState } from 'react'
import styled from 'styled-components'
import { isAddress } from '../../utils'

// import { ReactComponent as EthereumLogo } from '../../assets/images/ethereum-logo.svg'

const TOKEN_ICON_API = address =>
  `https://raw.githubusercontent.com/sushiswap/assets/master/blockchains/polygon/assets/${isAddress(address)}/logo.png`
const BAD_IMAGES = {}

const Image = styled.img`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  background-color: white;
  border-radius: 1rem;
`

const Emoji = styled.span`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
`

// const StyledEthereumLogo = styled(EthereumLogo)`
//   width: ${({ size }) => size};
//   height: ${({ size }) => size};
// `

export default function TokenLogo({ address, logoURI, size = '1rem', ...rest }) {
  const [error, setError] = useState(false)

  let path = ''
  if (address === 'ETH') {
    // return <StyledEthereumLogo size={size} />
    path = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0/logo.png"
  } else if (!error && !BAD_IMAGES[address]) {
    path = logoURI === "" || logoURI === undefined ? TOKEN_ICON_API(address) : logoURI;
  } else {
    return (
      <Emoji {...rest} size={size}>
        <span style={{ lineHeight: 0 }} role="img" aria-label="Thinking">
          🌕
        </span>
      </Emoji>
    )
  }

  return (
    <Image
      {...rest}
      alt={address}
      src={path}
      size={size}
      onError={() => {
        BAD_IMAGES[address] = true
        setError(true)
      }}
    />
  )
}
