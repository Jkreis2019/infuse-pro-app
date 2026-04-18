import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text, View, TouchableOpacity, TextInput, ActivityIndicator, Image } from 'react-native'
import { useState, useCallback, useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

import WelcomeScreen from './screens/WelcomeScreen'
import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'
import HomeScreen from './screens/HomeScreen'
import MembershipsScreen from './screens/MembershipsScreen'
import BookingScreen from './screens/BookingScreen'
import ProfileScreen from './screens/ProfileScreen'
import { Platform } from 'react-native'
const MapScreen = Platform.OS === 'web' 
  ? () => null 
  : require('./screens/MapScreen').default
import EmailVerificationScreen from './screens/EmailVerificationScreen'
import AppointmentDetailScreen from './screens/AppointmentDetailScreen'
import DispatcherHomeScreen from './screens/DispatcherHomeScreen'
import AdminHomeScreen from './screens/AdminHomeScreen'
import PendingApprovalScreen from './screens/PendingApprovalScreen'
import FreeListingScreen from './screens/FreeListingScreen'
import ChatScreen from './screens/ChatScreen'
import ChatContactsScreen from './screens/ChatContactsScreen'
import DispatcherMessagingScreen from './screens/DispatcherMessagingScreen'
import PatientDispatchChatScreen from './screens/PatientDispatchChatScreen'
import BookingChatScreen from './screens/BookingChatScreen'
import TechHomeScreen from './screens/TechHomeScreen'
import TechMessagingScreen from './screens/TechMessagingScreen'
import NPHomeScreen from './screens/NPHomeScreen'
import SoloHomeScreen from './screens/SoloHomeScreen'
import ChangePasswordScreen from './screens/ChangePasswordScreen'
import ResetPasswordScreen from './screens/ResetPasswordScreen'
import ForgotPasswordScreen from './screens/ForgotPasswordScreen'
import ClinicHomeScreen from './screens/ClinicHomeScreen'
import ClinicTechScreen from './screens/ClinicTechScreen'
import ChartScreen from './screens/ChartScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const API_URL = 'https://api.infusepro.app'

function MainTabs({ route }) {
  const initialParams = route.params
  const [params, setParams] = useState(initialParams)

  const refreshCompany = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/auth/my-companies`, {
        headers: { Authorization: `Bearer ${params.token}` }
      })
      const data = await res.json()
      if (data.companies && data.companies.length > 0) {
        const c = data.companies[0]
        setParams(prev => ({
          ...prev,
          company: {
            id: c.id,
            name: c.name,
            code: c.code,
            primaryColor: c.primary_color,
            secondaryColor: c.secondary_color,
            location: c.location,
            phone: c.phone,
            bio: c.bio
          }
        }))
      } else {
        // No linked company — reset to defaults
        setParams(prev => ({
          ...prev,
          company: {
            name: 'Infuse Pro',
            primaryColor: '#C9A84C',
            secondaryColor: '#0D1B4B'
          }
        }))
      }
    } catch (err) {
      console.error('Refresh company error:', err)
    }
  }, [params.token])

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#162260', borderTopColor: 'rgba(201,168,76,0.2)' },
        tabBarActiveTintColor: params?.company?.primaryColor || '#C9A84C',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
      }}
    >
      <Tab.Screen
        name="HomeTab"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🏠</Text>
        }}
      >
        {(props) => <HomeScreen {...props} route={{ ...props.route, params }} />}
      </Tab.Screen>

      <Tab.Screen
        name="ProfileTab"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>👤</Text>
        }}
      >
        {(props) => <ProfileScreen {...props} route={{ ...props.route, params }} onCompanyChange={refreshCompany} />}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device')
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token — permission denied')
    return null
  }

  if (Platform.OS === 'web') return null
  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: '824f080c-a62b-417d-8d02-4554a9578672'
  })).data

  console.log('Expo push token:', token)
  return token
}

const TIMEOUTS = {
  admin: 15 * 60 * 1000,
  owner: 15 * 60 * 1000,
  dispatcher: 15 * 60 * 1000,
  np: 15 * 60 * 1000,
  solo: 60 * 60 * 1000,
  tech: 60 * 60 * 1000,
  guest: null,
  super_admin: 15 * 60 * 1000
}

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('')
  const notificationListener = useRef()
  const responseListener = useRef()
  const inactivityTimer = useRef(null)
  const warningTimer = useRef(null)
  const navigationRef = useRef(null)
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [isLocked, setIsLocked] = useState(false)
  const [lockPassword, setLockPassword] = useState('')
  const [lockError, setLockError] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [lockToken, setLockToken] = useState(null)
  const [lockCompany, setLockCompany] = useState(null)
  const [lockTime, setLockTime] = useState(null)

  const LOCK_ROLES = ['admin', 'owner', 'dispatcher', 'np']

  const startInactivityTimer = useCallback((role) => {
    const timeout = TIMEOUTS[role]
    if (!timeout) return // guests never timeout
    setShowInactivityWarning(false)
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    if (warningTimer.current) clearTimeout(warningTimer.current)
    if (LOCK_ROLES.includes(role)) {
      // Lock screen instead of logout for these roles
      inactivityTimer.current = setTimeout(() => {
        setShowInactivityWarning(false)
        setIsLocked(true)
        setLockTime(new Date())
      }, timeout)
    } else {
      warningTimer.current = setTimeout(() => setShowInactivityWarning(true), timeout - 60 * 1000)
      inactivityTimer.current = setTimeout(() => {
        setShowInactivityWarning(false)
        if (navigationRef.current) navigationRef.current.reset({ index: 0, routes: [{ name: 'Login' }] })
      }, timeout)
    }
  }, [])

  const resetInactivityTimer = useCallback(() => {
    if (userRole) startInactivityTimer(userRole)
  }, [userRole, startInactivityTimer])

  useEffect(() => {
    const { sessionManager } = require('./utils/sessionManager')
    sessionManager.setOnLogin((role, token, company) => { setUserRole(role); setLockToken(token); setLockCompany(company) })
    sessionManager.setOnActivity(() => resetInactivityTimer())
    sessionManager.setOnLock(() => { setIsLocked(true); setLockTime(new Date()) })
    if (userRole) startInactivityTimer(userRole)
    const sub = AppState.addEventListener('change', state => { if (state === 'active') resetInactivityTimer() })
    return () => { sub.remove(); clearTimeout(inactivityTimer.current); clearTimeout(warningTimer.current) }
  }, [userRole, resetInactivityTimer])

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) setExpoPushToken(token)
    })

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Push received:', notification)
    })

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Push tapped:', response)
    })

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current)
      Notifications.removeNotificationSubscription(responseListener.current)
    }
  }, [])

  return (
    <>
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerStyle: { backgroundColor: '#0D1B4B' },
          headerTintColor: '#C9A84C',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#0D1B4B' },
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Log in' }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create account' }} />
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: 'Appointment', headerShown: true }} />
        <Stack.Screen name="Home" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Book Appointment', headerShown: true }} />
        <Stack.Screen name="Memberships" component={MembershipsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DispatcherHome" component={DispatcherHomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FreeListing" component={FreeListingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ChatContacts" component={ChatContactsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DispatcherMessaging" component={DispatcherMessagingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PatientDispatchChat" component={PatientDispatchChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BookingChat" component={BookingChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ClinicHome" component={ClinicHomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ClinicTechHome" component={ClinicTechScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Chart" component={ChartScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TechMessaging" component={TechMessagingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TechHome" options={{ headerShown: false }}>
  {(props) => <TechHomeScreen {...props} rootNavigation={props.navigation} />}
</Stack.Screen>
        <Stack.Screen name="NPHome" component={NPHomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SoloHome" component={SoloHomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
    {showInactivityWarning && (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 9999 }}>
        <View style={{ backgroundColor: '#0D1B4B', borderRadius: 20, padding: 28, width: '100%', maxWidth: 380, borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)' }}>
          <Text style={{ color: '#C9A84C', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8 }}>SESSION TIMEOUT</Text>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 8 }}>Still there?</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24, lineHeight: 20 }}>You'll be automatically logged out in 1 minute due to inactivity.</Text>
          <TouchableOpacity style={{ backgroundColor: '#C9A84C', borderRadius: 12, padding: 16, alignItems: 'center' }} onPress={resetInactivityTimer}>
            <Text style={{ color: '#0D1B4B', fontWeight: '700', fontSize: 15 }}>Keep me logged in</Text>
          </TouchableOpacity>
        </View>
      </View>
    )}

    {/* Lock Screen */}
    {isLocked && (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0D1B4B', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 99999 }}>
        <View style={{ alignItems: 'center', width: '100%', maxWidth: 380 }}>
          {lockCompany?.logoUrl ? (
            <Image source={{ uri: lockCompany.logoUrl }} style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 16 }} />
          ) : (
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(201,168,76,0.2)', borderWidth: 2, borderColor: '#C9A84C', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#C9A84C', fontSize: 32 }}>🔒</Text>
            </View>
          )}
          <Text style={{ color: '#C9A84C', fontSize: 13, fontWeight: '700', letterSpacing: 2, marginBottom: 8 }}>SCREEN LOCKED</Text>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 4 }}>{lockCompany?.name || 'Infuse Pro'}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 40 }}>
            Locked at {lockTime ? lockTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 10, alignSelf: 'flex-start' }}>Enter your password to unlock</Text>
          <TextInput
            style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: lockError ? '#e53e3e' : 'rgba(255,255,255,0.15)', marginBottom: 8, outlineStyle: 'none' }}
            value={lockPassword}
            onChangeText={(t) => { setLockPassword(t); setLockError('') }}
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.3)"
            secureTextEntry
          />
          {lockError ? <Text style={{ color: '#e53e3e', fontSize: 13, marginBottom: 8, alignSelf: 'flex-start' }}>{lockError}</Text> : null}
          <TouchableOpacity
            style={{ width: '100%', backgroundColor: '#C9A84C', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16, opacity: unlocking ? 0.6 : 1 }}
            disabled={unlocking}
            onPress={async () => {
              if (!lockPassword) return setLockError('Please enter your password')
              setUnlocking(true)
              try {
                const res = await fetch('https://api.infusepro.app/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: lockCompany?.userEmail, password: lockPassword, companyCode: lockCompany?.code })
                })
                const data = await res.json()
                if (data.token) {
                  setIsLocked(false)
                  setLockPassword('')
                  setLockError('')
                  resetInactivityTimer()
                } else {
                  setLockError('Incorrect password')
                }
              } catch (e) {
                setLockError('Network error')
              } finally {
                setUnlocking(false)
              }
            }}
          >
            {unlocking ? <ActivityIndicator color="#0D1B4B" /> : <Text style={{ color: '#0D1B4B', fontWeight: '700', fontSize: 16 }}>Unlock</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setIsLocked(false); if (navigationRef.current) navigationRef.current.reset({ index: 0, routes: [{ name: 'Login' }] }) }}>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Sign out instead</Text>
          </TouchableOpacity>
        </View>
      </View>
    )}
    </>
  )
}