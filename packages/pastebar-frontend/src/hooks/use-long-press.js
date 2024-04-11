export function useLongPress() {
  return function (callback) {
    let timeout

    function start() {
      timeout = setTimeout(() => {
        callback()
      }, 1000)
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
