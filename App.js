import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import { useState, useCallback } from 'react'

import WelcomeScreen from './screens/WelcomeScreen'
import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'
import HomeScreen from './screens/HomeScreen'
import BookingScreen from './screens/BookingScreen'
import ProfileScreen from './screens/ProfileScreen'
import { Platform } from 'react-native'
const MapScreen = () => null
import EmailVerificationScreen from './screens/EmailVerificationScreen'
import AppointmentDetailScreen from './screens/AppointmentDetailScreen'
import DispatcherHomeScreen from './screens/DispatcherHomeScreen'
import AdminHomeScreen from './screens/AdminHomeScreen'
import ChatScreen from './screens/ChatScreen'
import ChatContactsScreen from './screens/ChatContactsScreen'
import DispatcherMessagingScreen from './screens/DispatcherMessagingScreen'
import PatientDispatchChatScreen from './screens/PatientDispatchChatScreen'
import BookingChatScreen from './screens/BookingChatScreen'
import TechHomeScreen from './screens/TechHomeScreen'
import NPHomeScreen from './screens/NPHomeScreen'
import ChangePasswordScreen from './screens/ChangePasswordScreen'
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

export default function App() {
  return (
    <NavigationContainer>
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
        <Stack.Screen name="DispatcherHome" component={DispatcherHomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ChatContacts" component={ChatContactsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DispatcherMessaging" component={DispatcherMessagingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PatientDispatchChat" component={PatientDispatchChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BookingChat" component={BookingChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ClinicHome" component={ClinicHomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ClinicTechHome" component={ClinicTechScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Chart" component={ChartScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TechHome" options={{ headerShown: false }}>
  {(props) => <TechHomeScreen {...props} rootNavigation={props.navigation} />}
</Stack.Screen>
        <Stack.Screen name="NPHome" component={NPHomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Find a company' }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}