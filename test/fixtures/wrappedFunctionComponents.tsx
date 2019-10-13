import React from 'react'

const Test = React.memo(
  React.forwardRef((props, ref) => {
    return <div />
  })
)
