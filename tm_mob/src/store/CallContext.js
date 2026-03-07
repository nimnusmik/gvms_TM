// src/store/CallContext.js
// 스마트폰의 상태(AppState)를 감시하다가, 앱이 다시 활성화되었을 때 "방금 전화 걸러 나갔던 놈이네!" 하면 기록 화면으로 멱살을 잡고 끌고 옵니다.
import React, { createContext, useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as RootNavigation from '../navigation/RootNavigation';

export const CallContext = createContext();

export const CallProvider = ({ children }) => {
  // 전화 중인 배정 정보(고객)를 담는 곳
  const [pendingCall, setPendingCall] = useState(null); 
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // 스마트폰 화면 상태 변화 감지 리스너
    const subscription = AppState.addEventListener('change', nextAppState => {
      
      // 앱이 백그라운드(통화 앱)에 있다가 다시 액티브(우리 앱)로 돌아온 순간!
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // 그리고 만약 전화를 걸고 나갔던 기록(pendingCall)이 있다면?
        if (pendingCall) {
          console.log("📞 통화 종료 감지! 기록 화면으로 이동합니다.");
          
          // 1. 강제로 통화 기록 화면으로 이동시키며 방금 전화한 고객 정보를 넘김
          RootNavigation.navigate('CallRecord', { assignment: pendingCall });
          
          // 2. 이동 후에는 상태를 비워줌 (무한루프 방지)
          setPendingCall(null); 
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [pendingCall]);

  return (
    <CallContext.Provider value={{ pendingCall, setPendingCall }}>
      {children}
    </CallContext.Provider>
  );
};