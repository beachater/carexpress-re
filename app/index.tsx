// import { useEffect } from 'react'
// import { useRouter, useRootNavigationState } from 'expo-router'

// export default function Home() {
//   const router = useRouter()
//   const navigationState = useRootNavigationState()

//   useEffect(() => {
//     if (!navigationState?.key) return // ⛔️ Navigation not ready yet
//     router.replace('/role-select' as any) // ✅ Only navigate when ready
//   }, [navigationState])

//   return null
// }
// import { router } from 'expo-router'

// router.replace('/role-select')

// export default function Home() {
//   return null
// }
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
export const screenOptions = {
  headerShown: false,
}


export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/role-select')
    }, 0)
    return () => clearTimeout(timeout)
  }, [])

  return null
}
