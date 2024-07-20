import * as React from 'react'
import { MessageSquareText } from 'lucide-react'

import ToolTip from '~/components/atoms/tooltip'
import { CUSTOM_ICON_NAMES, CustomIcon } from '~/components/icons'

type ClipIconProps = {
  iconVisibility: string | null | undefined
  children?: React.ReactNode
  description: string | null | undefined
  className?: string
  icon: string | null | undefined
  pathType?: string | null | undefined
  size?: number
  isBoard?: boolean
  color?: string | null | undefined
  isHover: boolean | undefined
}

const ClipIcon: React.FC<ClipIconProps> = ({
  iconVisibility,
  isBoard = false,
  className,
  description,
  color = 'text-slate-500 dark:text-slate-400',
  size = 16,
  icon,
  pathType,
  children = null,
}) => {
  if (iconVisibility === 'none') {
    return null
  }

  if ((iconVisibility === 'always' || !iconVisibility) && !isBoard) {
    return (
      <span className={`${color}`}>
        {icon ? (
          <CustomIcon
            size={16}
            name={icon as (typeof CUSTOM_ICON_NAMES)[number]}
            className={`${color}`}
          />
        ) : (
          children
        )}
      </span>
    )
  }

  if (iconVisibility === 'always' || isBoard) {
    return (
      <span className={`${color}`}>
        <ToolTip
          isCompact
          text={description || pathType}
          isDisabled={!pathType && !description}
          side="right"
          align="end"
          alignOffset={30}
          maxWidth={180}
          sideOffset={-10}
          asChild
        >
          {icon ? (
            <CustomIcon
              size={size}
              name={icon as (typeof CUSTOM_ICON_NAMES)[number]}
              className={`${color} ${className}`}
            />
          ) : (
            children
          )}
        </ToolTip>
      </span>
    )
  }

  return null
}

export default ClipIcon
