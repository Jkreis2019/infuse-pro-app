import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

export default function ChartScreen({ route, navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#0D1B4B', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 24 }}>Chart Screen</Text>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ color: '#C9A84C', marginTop: 20 }}>Go Back</Text>
      </TouchableOpacity>
    </View>
  )
}