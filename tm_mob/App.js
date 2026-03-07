// App.js (프로젝트 최상위)
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

// 방금 만든 파일들 임포트
import { CallProvider } from './src/store/CallContext';
import { navigationRef } from './src/navigation/RootNavigation';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <CallProvider>
        {/* ref={navigationRef}를 꼭 넣어줘야 CallContext에서 조종할 수 있습니다! */}
        <NavigationContainer ref={navigationRef}>
          <AppNavigator />
        </NavigationContainer>
      </CallProvider>
    </SafeAreaProvider>
  );
}