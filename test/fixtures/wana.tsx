import React from 'react'
import { withAuto } from 'wana'

// Some comment
const A = withAuto(() => {
  return <div />
})

// Some comment
export const B = withAuto(() => <div />)
