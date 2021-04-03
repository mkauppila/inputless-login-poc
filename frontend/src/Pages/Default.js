import { useEffect, useState } from "react"

export const Default = () => {
  const [loginCode, setLoginCode] = useState(null)
  const [authenticationToken, setAuthenticationToken] = useState(null)

  useEffect(() => {
    const fetchLoginCode = async () => {
      console.log("fetch login code")
      const result = await fetch("http://localhost:8000/loginCode")
      const json = await result.json()
      setLoginCode(json.loginCode)
    }
    fetchLoginCode()
  }, [])

  if (loginCode) {
    console.log("has login start polling for autentiation")
    // FIXME having multiple intervals polling at the same time
    const poller = setInterval(async () => {
      console.log("poll for the authentication code")
      try {
        const result = await fetch("http://localhost:8000/authenticationCode")
        const json = await result.json()
        console.log("json ", json)
        setAuthenticationToken(json.authenticationToken)

        console.log("clear up")
        clearInterval(poller)
      } catch (error) {
        // omit all errors
      }
    }, 1000)
  }

  const formatLoginCode = (loginCode) => {
    return String(loginCode).split("").join(" ")
  }

  return (
    <main>
      <h3>The login code</h3>
      {loginCode ? (
        <pre>{formatLoginCode(loginCode)}</pre>
      ) : (
        <p>Fetching login code</p>
      )}
      {authenticationToken ?? "No token"}
    </main>
  )
}
