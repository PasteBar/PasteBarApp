import { useEffect, useState } from 'react'

function useTimeOutMessage(
  interval = 3000
): [string, React.Dispatch<React.SetStateAction<string>>] {
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(''), interval)
      return () => {
        clearTimeout(timeout)
      }
    }
  }, [message])

  return [message, setMessage]
}

export default useTimeOutMessage
