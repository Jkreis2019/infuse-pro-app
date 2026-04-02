import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import WelcomeScreen from './screens/WelcomeScreen'
import CompanyCodeScreen from './screens/CompanyCodeScreen'
import SignupScreen from './screens/SignupScreen'
import LoginScreen from './screens/LoginScreen'
import HomeScreen from './screens/HomeScreen'

const Stack = createNativeStackNavigator()

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
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CompanyCode"
          component={CompanyCodeScreen}
          options={{ title: 'Find your company' }}
        />
        <Stack.Screen
          name="Signup"
          component={SignupScreen}
          options={{ title: 'Create account' }}
        />
        <Stack.Screen
  name="Login"
  component={LoginScreen}
  options={{ title: 'Log in' }}
/>
<Stack.Screen
  name="Home"
  component={HomeScreen}
  options={{ headerShown: false }}
/>
      </Stack.Navigator>
    </NavigationContainer>
  )
}