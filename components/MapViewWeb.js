import React from 'react'
import { View, Text } from 'react-native'
export default function MapView({ children, style }) {
  return <View style={[style, { backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: 'rgba(255,255,255,0.3)' }}>Map unavailable on web</Text></View>
}
export function Marker() { return null }