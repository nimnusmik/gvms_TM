import React, { useState } from 'react';
import { TouchableOpacity, Alert, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

import { setLogoutCallback } from '../api/client';
import LoginScreen from '../screens/auth/LoginScreen';
import AssignmentsScreen from '../screens/main/AssignmentsScreen';
import MyStatsScreen from '../screens/main/MyStatsScreen';
import PullRequestScreen from '../screens/main/PullRequestScreen';

// 🌟 새로 추가할 통화 기록 화면 임포트
import CallRecordScreen from '../screens/main/CallRecordScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ setIsAuthenticated }) {
  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
          setIsAuthenticated(false);
        },
      },
    ]);
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === '배정 리스트') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'DB 신청') {
            iconName = focused ? 'download' : 'download-outline';
          } else if (route.name === '내 현황') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15, gap: 4 }}>
            <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
            <Text style={{ color: '#e74c3c', fontSize: 14 }}>로그아웃</Text>
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen name="배정 리스트" component={AssignmentsScreen} />
      <Tab.Screen name="DB 신청" component={PullRequestScreen} />
      <Tab.Screen name="내 현황" component={MyStatsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 토큰 만료 시 자동 로그아웃
  React.useEffect(() => {
    setLogoutCallback(() => setIsAuthenticated(false));
    return () => setLogoutCallback(null);
  }, []);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
        </Stack.Screen>
      ) : (
        // 로그인 성공 시 접근 가능한 화면들 묶음
        <Stack.Group>
          {/* 기본 탭 화면 */}
          <Stack.Screen name="MainTabs">
            {(props) => <MainTabs {...props} setIsAuthenticated={setIsAuthenticated} />}
          </Stack.Screen>
          {/* 🌟 통화 기록 화면 (탭 바 없이 전체 화면으로 띄우기 위함) */}
          <Stack.Screen 
            name="CallRecord" 
            component={CallRecordScreen} 
            // 뒤로가기 제스처 막기 (기록 입력을 강제하기 위함)
            options={{ gestureEnabled: false }} 
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}