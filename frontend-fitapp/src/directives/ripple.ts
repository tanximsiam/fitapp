export default {
  mounted(el: HTMLElement) {
    el.style.position = 'relative'
    el.style.overflow = 'hidden'

    el.addEventListener('click', (event: MouseEvent) => {
      const ripple = document.createElement('span')
      const rect = el.getBoundingClientRect()

      const size = Math.max(rect.width, rect.height)
      ripple.style.width = ripple.style.height = `${size}px`

      ripple.style.position = 'absolute'
      ripple.style.borderRadius = '50%'
      ripple.style.background = 'rgba(251, 113, 133, 0.3)'
      ripple.style.left = `${event.clientX - rect.left - size / 2}px`
      ripple.style.top = `${event.clientY - rect.top - size / 2}px`
      ripple.style.pointerEvents = 'none'
      ripple.style.transform = 'scale(0)'
      ripple.style.opacity = '1'
      ripple.style.transition = 'transform 600ms ease, opacity 600ms ease'

      el.appendChild(ripple)

      requestAnimationFrame(() => {
        ripple.style.transform = 'scale(4)'
        ripple.style.opacity = '0'
      })

      setTimeout(() => {
        ripple.remove()
      }, 600)
    })
  },
}
