import React from 'react'
import classNames from 'classnames'

const CameraOverlay = ({
  width,
  height,
  shapeProps,
  isFlashing,
  onStopFlashing,
}) => {
  const borderProps = {
    strokeWidth: "2",
    stroke: "#fff",
    fill: 'none',
  }

  const classes = classNames(
    'camera-overlay',
    { 'camera-flash': isFlashing },
  )

  const flashingOverlayProps = isFlashing
    ? { fillOpacity: 1, fill: '#ffffff' }
    : {}

  return (
    <svg
      className={classes}
      viewBox={`0 0 ${width} ${height}`}
      onAnimationEnd={onStopFlashing}
    >
      <defs>
        <mask
          id="mask"
          x="0"
          y="0"
          width={'100%'}
          height={'100%'}
        >
          <rect
            x="0"
            y="0"
            width={'100%'}
            height={'100%'}
            fill="#fff"
          />
          <rect
            {...shapeProps}
          />
        </mask>
      </defs>
      <rect
        x="0"
        y="0"
        width={'100%'}
        height={'100%'}
        mask="url(#mask)"
        fillOpacity="0.4"
        {...flashingOverlayProps}
      />
      <rect
        {...shapeProps}
        {...borderProps}
      />
    </svg>
  )
}


export default CameraOverlay
