import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import client from '../../api/client'; // 우리가 만든 API 통신 도구

export default function LoginScreen({ setIsAuthenticated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // 로딩 뱅글뱅글 상태

  const handleLogin = async () => {
    // 1. 빈칸 검사
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    
    try {
      // 2. 백엔드(Django)로 로그인 요청 
      // POST /api/v1/auth/login/ (tm_mob 기존 이슈 해결: login_id 대신 email 전송)
      const response = await client.post('/auth/login/', {
        email: email,
        password: password,
      });

      // 3. 백엔드가 준 JWT 토큰 꺼내기
      // (백엔드 응답 구조가 다르면 이 부분을 access_token 등으로 수정해야 할 수 있습니다)
      const { access, refresh } = response.data; 

      // 4. 토큰을 앱의 안전한 금고(SecureStore)에 저장
      await SecureStore.setItemAsync('accessToken', access);
      if (refresh) {
        await SecureStore.setItemAsync('refreshToken', refresh);
      }

      // 5. 저장 완료되면 메인 화면으로 뿅!
      setIsAuthenticated(true);

    } catch (error) {
      console.error('로그인 에러:', error);
      // 에러 메시지 띄우기
      Alert.alert('로그인 실패', '이메일이나 비밀번호를 확인하거나, 서버가 켜져 있는지 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TM 관리 시스템</Text>

      <TextInput
        style={styles.input}
        placeholder="이메일 (예: test@example.com)"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none" // 첫 글자 대문자 자동변환 방지
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry // 비밀번호 *** 처리
      />

      {/* 로딩 중일 때는 뱅글뱅글 스피너, 아닐 때는 로그인 버튼 표시 */}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="로그인" onPress={handleLogin} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 40, textAlign: 'center', color: '#333' },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 15, 
    marginBottom: 15, 
    borderRadius: 8,
    backgroundColor: '#f9f9f9'
  },
});