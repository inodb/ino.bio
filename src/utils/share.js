export const shareToFacebook = (href, text) => {
  window.FB.ui({
    method: 'share',
    mobile_iframe: true,
    href,
    quote: text,
  })
}

export const shareToLinkedIn = (href, text) => {
  window.open(
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURI(href)}`,
    'sharer',
    'toolbar=0,status=0,width=626,height=436'
  )
}
