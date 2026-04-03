import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text, View } from 'react-native'

import WelcomeScreen from './screens/WelcomeScreen'
import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'
import HomeScreen from './screens/HomeScreen'
import BookingScreen from './screens/BookingScreen'
import ProfileScreen from './screens/ProfileScreen'
import MapScreen from './screens/MapScreen'
import EmailVerificationScreen from './screens/EmailVerificationScreen'
import AppointmentDetailScreen from './screens/AppointmentDetailScreen'
import DispatcherHomeScreen from './screens/DispatcherHomeScreen'
import TechHomeScreen from './screens/TechHomeScreen'
import NPHomeScreen from './screens/NPHomeScreen'
import ChangePasswordScreen from './screens/ChangePasswordScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs({ route }) {
  const params = route.params

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
        name="BookingTab"
        options={{
          tabBarLabel: 'Book',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>💉</Text>
        }}
      >
        {(props) => <BookingScreen {...props} route={{ ...props.route, params }} />}
      </Tab.Screen>

     <Tab.Screen
  name="ProfileTab"
  options={{
    tabBarLabel: 'Profile',
    tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>👤</Text>
  }}
>
  {(props) => <ProfileScreen {...props} route={{ ...props.route, params }} />}
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
        <Stack.Screen name="DispatcherHome" component={DispatcherHomeScreen} options={{ headerShown: false }} />
<Stack.Screen name="TechHome" component={TechHomeScreen} options={{ headerShown: false }} />
<Stack.Screen name="NPHome" component={NPHomeScreen} options={{ headerShown: false }} />
<Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen
  name="Map"
  component={MapScreen}
  options={{ title: 'Find a company' }}
/>
      </Stack.Navigator>
    </NavigationContainer>
  )
}
