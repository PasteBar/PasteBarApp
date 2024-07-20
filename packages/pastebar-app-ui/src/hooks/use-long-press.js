export function useLongPress() {
  return function (callback) {
    let timeout

    function start(e) {
      if (e.type === 'mousedown' && e.button !== 0) {
        return
      }
      timeout = setTimeout(() => {
        callback()
      }, 1500)
    }

    function clear() {
      timeout && clearTimeout(timeout)
    }

    return {
      onMouseDown: start,
      onTouchStart: start,
      onMouseUp: clear,
      onMouseLeave: clear,
      onTouchMove: clear,
      onTouchEnd: clear,
    }
  }
}
