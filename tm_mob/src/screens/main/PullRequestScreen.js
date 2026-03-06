import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';

const QUICK_COUNTS = [10, 20, 30, 50];

const STATUS_CONFIG = {
  PENDING:  { label: '대기 중',  color: '#FF9800' },
  APPROVED: { label: '승인',     color: '#2196F3' },
  REJECTED: { label: '거절',     color: '#F44336' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PullRequestScreen() {
  const [count, setCount] = useState('10');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await client.get('/sales/pull-requests/');
      setRequests(res.data.results ?? res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchRequests().finally(() => setLoading(false));
    }, [fetchRequests])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    const num = parseInt(count, 10);
    if (!num || num <= 0) {
      Alert.alert('입력 오류', '신청 건수를 올바르게 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      await client.post('/sales/pull-requests/', {
        requested_count: num,
        request_note: note.trim(),
      });
      Alert.alert('신청 완료', `${num}건 DB 추가 배정을 신청했습니다.`);
      setNote('');
      setCount('10');
      await fetchRequests();
    } catch (e) {
      Alert.alert('오류', '신청 중 문제가 발생했습니다.');
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }) => {
    const cfg = STATUS_CONFIG[item.status] ?? { label: item.status, color: '#999' };
    let badgeLabel = cfg.label;
    if (item.status === 'APPROVED') badgeLabel = `승인 (${item.approved_count ?? 0}건)`;

    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
          <Text style={styles.cardCount}>신청 {item.requested_count}건</Text>
          {item.status === 'REJECTED' && item.reject_reason ? (
            <Text style={styles.rejectReason}>사유: {item.reject_reason}</Text>
          ) : null}
        </View>
        <View style={[styles.badge, { backgroundColor: cfg.color }]}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      </View>
    );
  };

  const ListHeader = (
    <>
      {/* 신청 카드 */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>DB 추가 신청</Text>

        {/* 빠른 선택 버튼 */}
        <View style={styles.quickRow}>
          {QUICK_COUNTS.map((q) => (
            <TouchableOpacity
              key={q}
              style={[styles.quickBtn, String(q) === count && styles.quickBtnActive]}
              onPress={() => setCount(String(q))}
            >
              <Text style={[styles.quickBtnText, String(q) === count && styles.quickBtnTextActive]}>
                {q}건
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 직접 입력 */}
        <TextInput
          style={styles.input}
          value={count}
          onChangeText={setCount}
          keyboardType="numeric"
          placeholder="수량 직접 입력"
          placeholderTextColor="#aaa"
        />

        {/* 사유 입력 */}
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={note}
          onChangeText={setNote}
          placeholder="요청 사유 (선택)"
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>신청하기</Text>
          }
        </TouchableOpacity>
      </View>

      {/* 내역 헤더 */}
      <Text style={styles.sectionTitle}>최근 신청 내역</Text>
      {loading && <ActivityIndicator style={{ marginTop: 20 }} color="#2196F3" />}
    </>
  );

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        !loading ? <Text style={styles.emptyText}>신청 내역이 없습니다.</Text> : null
      }
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#f0f2f5',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 14,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  quickBtnActive: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  quickBtnText: {
    fontSize: 14,
    color: '#555',
  },
  quickBtnTextActive: {
    color: '#2196F3',
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#222',
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#444',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  cardLeft: {
    flex: 1,
    marginRight: 10,
  },
  cardDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  cardCount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  rejectReason: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 30,
    fontSize: 14,
  },
});
