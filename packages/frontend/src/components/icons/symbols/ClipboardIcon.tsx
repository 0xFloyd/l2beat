import React, { SVGAttributes } from 'react'

import { Icon } from '../Icon'

export function ClipboardIcon(props: SVGAttributes<SVGElement>) {
  return (
    <Icon
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-label="Copy to clipboard icon"
      {...props}
    >
      <path
        d="M4.5999 0.199951C3.9369 0.199951 3.3999 0.736951 3.3999 1.39995V11C3.3999 11.663 3.9369 12.2 4.5999 12.2H12.3999C13.0629 12.2 13.5999 11.663 13.5999 11V4.09995C13.5999 3.94095 13.5369 3.78853 13.4241 3.67573L10.1241 0.375732C10.0113 0.262932 9.8589 0.199951 9.6999 0.199951H4.5999ZM9.3999 1.34253L12.4573 4.39995H9.9999C9.6687 4.39995 9.3999 4.13115 9.3999 3.79995V1.34253ZM1.5999 3.19995C0.936902 3.19995 0.399902 3.73695 0.399902 4.39995V14C0.399902 14.663 0.936902 15.2 1.5999 15.2H9.3999C10.0629 15.2 10.5999 14.663 10.5999 14V13.4H4.5999C3.2763 13.4 2.1999 12.3236 2.1999 11V3.19995H1.5999Z"
        fillOpacity="0.8"
      />
    </Icon>
  )
}
