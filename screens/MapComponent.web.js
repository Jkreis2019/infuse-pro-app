import React from 'react'
import { View, Text } from 'react-native'

export default function MapScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0D1B4B', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Map is available on mobile only</Text>
    </View>
  )
}