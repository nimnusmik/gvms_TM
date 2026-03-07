import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, BackHandler, ScrollView, Modal, ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import client from '../../api/client';
import { getRecordingUploadUrl, uploadFileToS3, confirmRecordingUpload } from '../../api/recordingApi';

// TODO: 실기기 배포 전 아래 목록으로 되돌리기
// const ALLOWED_MIME_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/aac', 'audio/ogg'];
const ALLOWED_MIME_TYPES = null; // null = 모든 파일 허용 (에뮬레이터 테스트용)

function RecordingUploadModal({ visible, uploadState, pickedFile, uploadError, onPickFile, onUpload, onSkip, onDone, onRetry, onTestUpload }) {
  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <Text style={modalStyles.title}>녹음 파일 업로드</Text>

          {(uploadState === 'idle') && (
            <>
              {pickedFile ? (
                <>
                  <View style={modalStyles.fileInfo}>
                    <Text style={modalStyles.fileName} numberOfLines={1}>{pickedFile.name}</Text>
                    <Text style={modalStyles.fileSize}>{formatSize(pickedFile.size)}</Text>
                  </View>
                  <TouchableOpacity style={modalStyles.btnPrimary} onPress={onUpload}>
                    <Text style={modalStyles.btnPrimaryText}>업로드 시작</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={modalStyles.btnOutline} onPress={onPickFile}>
                    <Text style={modalStyles.btnOutlineText}>다른 파일 선택</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={modalStyles.btnGreen} onPress={onPickFile}>
                  <Text style={modalStyles.btnPrimaryText}>파일 선택하기</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={modalStyles.btnSkip} onPress={onSkip}>
                <Text style={modalStyles.btnSkipText}>건너뛰기</Text>
              </TouchableOpacity>
              {/* TODO: 실기기 배포 전 제거 */}
              <TouchableOpacity style={modalStyles.btnTest} onPress={onTestUpload}>
                <Text style={modalStyles.btnTestText}>[테스트] 더미 파일로 업로드</Text>
              </TouchableOpacity>
            </>
          )}

          {(uploadState === 'picking' || uploadState === 'uploading') && (
            <View style={modalStyles.centerBlock}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={modalStyles.statusText}>
                {uploadState === 'picking' ? '파일 선택 중...' : '업로드 중...'}
              </Text>
            </View>
          )}

          {uploadState === 'success' && (
            <View style={modalStyles.centerBlock}>
              <Text style={modalStyles.successIcon}>✓</Text>
              <Text style={modalStyles.successText}>업로드 완료!</Text>
              <TouchableOpacity style={modalStyles.btnPrimary} onPress={onDone}>
                <Text style={modalStyles.btnPrimaryText}>확인</Text>
              </TouchableOpacity>
            </View>
          )}

          {uploadState === 'error' && (
            <>
              <Text style={modalStyles.errorText}>{uploadError || '업로드 중 오류가 발생했습니다.'}</Text>
              <TouchableOpacity style={modalStyles.btnPrimary} onPress={onRetry}>
                <Text style={modalStyles.btnPrimaryText}>다시 시도</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalStyles.btnSkip} onPress={onSkip}>
                <Text style={modalStyles.btnSkipText}>건너뛰기</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function CallRecordScreen({ route, navigation }) {
  const { assignment } = route.params;

  const [duration, setDuration] = useState(0);
  const [resultType, setResultType] = useState('SUCCESS');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const [callbackDate, setCallbackDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  );
  const [callbackTime, setCallbackTime] = useState('10:00');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [savedCallLogId, setSavedCallLogId] = useState(null);
  const [uploadState, setUploadState] = useState('idle');
  const [uploadError, setUploadError] = useState(null);
  const [pickedFile, setPickedFile] = useState(null);

  useEffect(() => {
    const endTime = Date.now();
    const diffSeconds = Math.floor((endTime - assignment.startTime) / 1000);
    setDuration(diffSeconds > 0 ? diffSeconds : 0);

    const backAction = () => {
      Alert.alert('경고', '통화 기록을 반드시 저장해야 합니다.');
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
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

      const response = await client.post('/calls/logs/', body);
      const newCallLogId = response.data.id;

      if (resultType === 'SUCCESS') {
        setSavedCallLogId(newCallLogId);
        setUploadState('idle');
        setPickedFile(null);
        setShowUploadModal(true);
      } else {
        Alert.alert('저장 완료', '통화 기록이 저장되었습니다.', [
          { text: '확인', onPress: () => navigation.navigate('MainTabs') }
        ]);
      }
    } catch (error) {
      if (error.response) {
        console.error('백엔드 거절 사유:', error.response.data);
      } else {
        console.error('기타 에러:', error.message);
      }
      Alert.alert('저장 실패', '서버에 기록을 저장하지 못했습니다. 터미널 창을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestUpload = async () => {
    if (!savedCallLogId) return;
    setUploadState('uploading');
    setUploadError(null);
    try {
      const dummyFilename = `test_recording_${savedCallLogId}.mp3`;
      const uploadInfo = await getRecordingUploadUrl(savedCallLogId, {
        filename: dummyFilename,
        contentType: 'audio/mpeg',
        sizeBytes: 1024,
      });
      console.log('[TEST] presigned URL:', uploadInfo.upload_url);
      // 1KB 더미 바이너리 생성 후 XHR로 업로드
      const dummyBytes = new Uint8Array(1024);
      const blob = new Blob([dummyBytes], { type: 'audio/mpeg' });
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadInfo.upload_url);
        xhr.setRequestHeader('Content-Type', 'audio/mpeg');
        xhr.timeout = 60000;
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`S3 PUT failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error('XHR network error'));
        xhr.ontimeout = () => reject(new Error('Upload timed out'));
        xhr.send(blob);
      });
      await confirmRecordingUpload(savedCallLogId, uploadInfo.key);
      setUploadState('success');
    } catch (error) {
      console.error('테스트 업로드 에러:', error.response?.data || error.message);
      setUploadState('error');
      setUploadError('테스트 업로드에 실패했습니다.');
    }
  };

  const handlePickFile = async () => {
    setUploadState('picking');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setUploadState('idle');
        return;
      }

      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'application/octet-stream';

      if (ALLOWED_MIME_TYPES && !ALLOWED_MIME_TYPES.includes(mimeType)) {
        setUploadState('error');
        setUploadError('지원되지 않는 파일 형식입니다.');
        return;
      }

      setPickedFile(asset);
      setUploadState('idle');
    } catch (error) {
      setUploadState('error');
      setUploadError('파일 선택 중 오류가 발생했습니다.');
    }
  };

  const handleUpload = async () => {
    if (!pickedFile) return;
    setUploadState('uploading');
    setUploadError(null);

    try {
      const uploadInfo = await getRecordingUploadUrl(savedCallLogId, {
        filename: pickedFile.name,
        contentType: pickedFile.mimeType,
        sizeBytes: pickedFile.size,
      });

      await uploadFileToS3(uploadInfo.upload_url, pickedFile.uri, pickedFile.mimeType);

      await confirmRecordingUpload(savedCallLogId, uploadInfo.key);

      setUploadState('success');
    } catch (error) {
      console.error('업로드 에러:', error.response?.data || error.message);
      setUploadState('error');
      setUploadError('업로드에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleSkipUpload = () => {
    setShowUploadModal(false);
    navigation.navigate('MainTabs');
  };

  const handleDoneAfterUpload = () => {
    setShowUploadModal(false);
    navigation.navigate('MainTabs');
  };

  const handleRetryUpload = () => {
    setUploadState('idle');
    setUploadError(null);
  };

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
      <Text style={styles.title}>통화 결과 기록</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>고객명: {assignment.customerName}</Text>
        <Text style={styles.infoText}>전화번호: {assignment.customerPhone}</Text>
        <Text style={styles.infoText}>예상 통화시간: {duration}초</Text>
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

      <RecordingUploadModal
        visible={showUploadModal}
        uploadState={uploadState}
        pickedFile={pickedFile}
        uploadError={uploadError}
        onPickFile={handlePickFile}
        onUpload={handleUpload}
        onSkip={handleSkipUpload}
        onDone={handleDoneAfterUpload}
        onRetry={handleRetryUpload}
        onTestUpload={handleTestUpload}
      />
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

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#222' },
  fileInfo: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, marginBottom: 16 },
  fileName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  fileSize: { fontSize: 12, color: '#888' },
  btnPrimary: { backgroundColor: '#2196F3', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  btnGreen: { backgroundColor: '#4CAF50', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  btnOutline: { borderWidth: 1, borderColor: '#2196F3', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  btnOutlineText: { color: '#2196F3', fontSize: 16, fontWeight: '600' },
  btnSkip: { padding: 12, alignItems: 'center' },
  btnSkipText: { color: '#999', fontSize: 14 },
  centerBlock: { alignItems: 'center', paddingVertical: 20 },
  statusText: { marginTop: 12, fontSize: 15, color: '#555' },
  successIcon: { fontSize: 56, color: '#4CAF50' },
  successText: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50', marginTop: 8, marginBottom: 20 },
  errorText: { color: '#F44336', fontSize: 14, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  btnTest: { marginTop: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, borderStyle: 'dashed' },
  btnTestText: { color: '#aaa', fontSize: 12 },
});
