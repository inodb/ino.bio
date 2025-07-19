import React from 'react'
import { FacebookIcon } from './facebook-icon'
import { LinkedInIcon } from './linkedin-icon'
import { shareToLinkedIn, shareToFacebook } from '../../utils/share'

import './index.scss'

export const SocialShare = ({ title, author }) => {
  const text = `Recommend on "${title}" written by @${author}`

  const onClickLinkedInIcon = e => {
    e.preventDefault()

    return shareToLinkedIn(window.location.href, text)
  }

  const onClickFacebookIcon = e => {
    e.preventDefault()
    return shareToFacebook(window.location.href, text)
  }

  return (
    <div className="social-share">
      <LinkedInIcon onClick={onClickLinkedInIcon} />
    </div>
  )
}
