import classNames from 'classnames'
import { DivProps } from 'react-html-props'

export interface HeaderLinkTextProps extends DivProps {}

export const HeaderLinkText = ({ ...divProps }: HeaderLinkTextProps) => {
  return (
    <div
      {...divProps}
      className={classNames(divProps.className)}
      style={{
        color: '#000000',
        fontFamily: 'Arial,sans-serif',
        fontSize: '14px',
        fontStyle: 'normal',
        fontWeight: 550,
        lineHeight: '18px',
        textAlign: 'center',
        ...divProps.style,
      }}
    >
      {divProps.children}
    </div>
  )
}
