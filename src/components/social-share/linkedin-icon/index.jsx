import React from 'react'

import './index.scss'

export const LinkedInIcon = ({ onClick }) => (
  <a
    className="resp-sharing-button__link"
    href="#"
    rel="noopener"
    aria-label="Share on LinkedIn"
    onClick={onClick}
  >
    <div className="resp-sharing-button resp-sharing-button--linkedin resp-sharing-button--large">
      <div
        aria-hidden="true"
        className="resp-sharing-button__icon resp-sharing-button__icon--solid"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M6.5 21.5h-5v-13h5v13zM4 6.5C2.5 6.5 1.5 5.3 1.5 4s1-2.4 2.5-2.4c1.6 0 2.5 1.1 2.5 2.4 0 1.3-0.9 2.5-2.5 2.5zM23.5 21.5h-5v-6.3c0-1.8 0-4.1-2.5-4.1s-2.9 2-2.9 4v6.4h-5v-13h4.8v1.8h0.1c0.7-1.3 2.4-2.7 4.9-2.7 5.2 0 6.2 3.4 6.2 7.9v6z"/>
        </svg>
      </div>
      <span className="service-label">Share on LinkedIn</span>
    </div>
  </a>
)