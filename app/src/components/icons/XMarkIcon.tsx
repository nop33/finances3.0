import type { Component } from 'solid-js'

const XMarkIcon: Component<{ class?: string }> = (props) => (
  <svg class={props.class ?? 'w-5 h-5'} fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
)

export default XMarkIcon
