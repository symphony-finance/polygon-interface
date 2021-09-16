import React from 'react'
import styled from 'styled-components'
import { darken } from 'polished'

import { Link } from '../../theme'
import SocialLinks from '../SocialLinks'

const FooterFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const FooterElement = styled.div`
  margin: 1.25rem;
  display: flex;
  min-width: 0;
  display: flex;
  align-items: center;
`

const FooterSocial = styled.div`
  margin: 1.25rem;
`

const Title = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.uniswapPink};

  :hover {
    cursor: pointer;
  }
  #link {
    text-decoration-color: ${({ theme }) => theme.uniswapPink};
  }

  #title {
    display: inline;
    font-size: 1.1rem;
    margin-right: 12px;
    font-weight: 400;
    color: ${({ theme }) => theme.uniswapPink};
    :hover {
      color: ${({ theme }) => darken(0.2, theme.uniswapPink)};
    }
  }
`

export default function Footer() {
  return (
    <FooterFrame>
      <FooterElement>
        <Title>
          <Link
            id="link"
            rel="noopener noreferrer"
            target="_blank"
            href="https://symphonyfi.gitbook.io/docs/"
          >
            <h1 id="title">About </h1>
          </Link>
          <Link
            id="link"
            rel="noopener noreferrer"
            target="_blank"
            href="https://symphonyfi.gitbook.io/docs/how-to-use-it"
          >
            <h1 id="title">Docs </h1>
          </Link>
          <Link
            id="link"
            rel="noopener noreferrer"
            target="_blank"
            href="https://symphonyfi.gitbook.io/docs/developers/audit"
          >
            <h1 id="title">Audit </h1>
          </Link>
        </Title>
      </FooterElement>
      <FooterSocial>
        <SocialLinks />
      </FooterSocial>
    </FooterFrame>
  )
}
