import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, BackHandler, ScrollView } from 'react-native';
import client from '../../api/client';

export default function CallRecordScreen({ route, navigation }) {
  // App.js(또는 CallContext)에서 쏴준 데이터 받기!
  const { assignment } = route.params; 
  
  const [duration, setDuration] = useState(0);
  const [resultType, setResultType] = useState('SUCCESS'); // 기본값
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const [callbackDate, setCallbackDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  );
  const [callbackTime, setCallbackTime] = useState('10:00');

  useEffect(() => {
    // 1. 통화 시간 계산 (현재 시간 - 아까 전화 걸러 나갔던 시간)
    const endTime = Date.now();
    const diffSeconds = Math.floor((endTime - assignment.startTime) / 1000);
    setDuration(diffSeconds > 0 ? diffSeconds : 0);

    // 2. 안드로이드 기기 하단의 물리적 '뒤로가기' 버튼 막기 (기록 강제)
    const backAction = () => {
      Alert.alert('경고', '통화 기록을 반드시 저장해야 합니다.');
      return true; // true를 반환하면 뒤로가기가 무시됨
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  // 백엔드로 통화 기록 전송!
  const handleSave = async () => {
    setLoading(true);
    try {
      // POST /api/v1/calls/logs/ (백엔드 명세에 맞춰 필드명 수정 가능성 있음)
      const body = {
        assignment: assignment.assignmentId,
        call_start: new Date(assignment.startTime).toISOString(),
        call_duration: duration,
        result: resultType,
        memo: memo,
      };

      if (resultType === 'CALLBACK') {
        body.callback_scheduled_at = `${callbackDate}T${callbackTime}:00`;
      }

      await client.post('/calls/logs/', body);

      Alert.alert('저장 완료', '통화 기록이 성공적으로 저장되었습니다.', [
        { 
          text: '확인', 
          // 저장 성공하면 다시 배정 리스트(메인 탭)로 쿨하게 돌려보냄
          onPress: () => navigation.navigate('MainTabs') 
        }
      ]);
      
    } catch (error) {
      // 💡 여기가 수정된 부분입니다! 백엔드의 거절 사유를 명확하게 터미널에 찍어줍니다.
      if (error.response) {
        console.error('🚨 백엔드 거절 사유:', error.response.data);
      } else {
        console.error('🚨 기타 에러:', error.message);
      }
      
      Alert.alert('저장 실패', '서버에 기록을 저장하지 못했습니다. 터미널 창을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 결과 선택 버튼을 그리기 위한 컴포넌트
  const ResultButton = ({ title, value, color }) => (
    <TouchableOpacity 
      style={[
        styles.resultBtn, 
        resultType === value ? { backgroundColor: color, borderColor: color } : {}
      ]}
      onPress={() => setResultType(value)}
    >
      <Text style={[styles.resultBtnText, resultType === value ? { color: '#fff' } : { color: '#333' }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>📝 통화 결과 기록</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>👤 고객명: {assignment.customerName}</Text>
        <Text style={styles.infoText}>📞 전화번호: {assignment.customerPhone}</Text>
        <Text style={styles.infoText}>⏱ 예상 통화시간: {duration}초</Text>
      </View>

      <Text style={styles.label}>1. 통화 결과 선택</Text>
      <View style={styles.buttonRow}>
        <ResultButton title="성공 (동의)" value="SUCCESS" color="#4CAF50" />
        <ResultButton title="부재중" value="ABSENCE" color="#FF9800" />
      </View>
      <View style={styles.buttonRow}>
        <ResultButton title="거절" value="REJECT" color="#F44336" />
        <ResultButton title="결번 (오류)" value="INVALID" color="#9E9E9E" />
      </View>
      <View style={styles.buttonRow}>
        <ResultButton title="콜백" value="CALLBACK" color="#1976D2" />
      </View>

      {resultType === 'CALLBACK' && (
        <View style={styles.callbackBox}>
          <Text style={styles.callbackTitle}>콜백 예약 <Text style={styles.callbackSub}>(콜백 선택 시 등장)</Text></Text>
          <View style={styles.callbackRow}>
            <TextInput
              style={styles.callbackInput}
              value={callbackDate}
              onChangeText={setCallbackDate}
              placeholder="YYYY-MM-DD"
              keyboardType="numeric"
            />
            <TextInput
              style={styles.callbackInput}
              value={callbackTime}
              onChangeText={setCallbackTime}
              placeholder="HH:MM"
              keyboardType="numeric"
            />
          </View>
        </View>
      )}

      <Text style={styles.label}>2. 상담 메모 (선택)</Text>
      <TextInput
        style={styles.memoInput}
        placeholder="고객과의 상담 내용을 간략히 적어주세요."
        multiline
        value={memo}
        onChangeText={setMemo}
        autoCorrect={false}
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.saveBtn, loading ? { opacity: 0.7 } : {}]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveBtnText}>{loading ? '저장 중...' : '기록 저장하기'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  infoBox: { backgroundColor: '#f0f4f8', padding: 15, borderRadius: 8, marginBottom: 20 },
  infoText: { fontSize: 16, marginBottom: 5, color: '#333' },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  resultBtn: { flex: 1, padding: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginHorizontal: 5, alignItems: 'center' },
  resultBtnText: { fontWeight: 'bold' },
  memoInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, height: 100, textAlignVertical: 'top', marginBottom: 30 },
  saveBtn: { backgroundColor: '#2196F3', padding: 18, borderRadius: 8, alignItems: 'center', marginBottom: 40 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  callbackBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#DDEEFF' },
  callbackTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12, color: '#1976D2' },
  callbackSub: { fontSize: 12, fontWeight: '400', color: '#888' },
  callbackRow: { flexDirection: 'row', gap: 12 },
  callbackInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 15, textAlign: 'center', backgroundColor: '#F8F8F8' },
});
