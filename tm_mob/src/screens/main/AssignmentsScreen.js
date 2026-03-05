import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Alert, Pressable } from 'react-native';
import client from '../../api/client';
import { CallContext } from '../../store/CallContext';

const BLOCK_COUNT = 15;

function GoalCard({ total, completed }) {
  const [remainingTime, setRemainingTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(18, 30, 0, 0);
      const diff = end - now;
      if (diff <= 0) { setRemainingTime('종료'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemainingTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const filledBlocks = total > 0 ? Math.round((completed / total) * BLOCK_COUNT) : 0;

  return (
    <View style={goalStyles.card}>
      <View style={goalStyles.header}>
        <Text style={goalStyles.title}>📊 오늘의 목표</Text>
        <Text style={goalStyles.time}>(남은 시간 {remainingTime})</Text>
      </View>
      <View style={goalStyles.progressRow}>
        {Array.from({ length: BLOCK_COUNT }, (_, i) => (
          <View key={i} style={[goalStyles.block, i < filledBlocks ? goalStyles.blockFilled : goalStyles.blockEmpty]} />
        ))}
        <Text style={goalStyles.percentage}> {percentage}% 달성</Text>
      </View>
      <Text style={goalStyles.stats}>
        목표: {total}건{'  |  '}완료: {completed}건{'  |  '}잔여: {total - completed}건
      </Text>
    </View>
  );
}

const goalStyles = StyleSheet.create({
  card: { backgroundColor: '#fff', margin: 10, marginBottom: 4, padding: 16, borderRadius: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 },
  title: { fontSize: 16, fontWeight: 'bold' },
  time: { fontSize: 13, color: '#888' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  block: { width: 16, height: 16, borderRadius: 2, marginRight: 3 },
  blockFilled: { backgroundColor: '#1976D2' },
  blockEmpty: { backgroundColor: '#DDEEFF' },
  percentage: { fontSize: 14, fontWeight: '600', color: '#1976D2', marginLeft: 4 },
  stats: { fontSize: 13, color: '#555' },
});

export default function AssignmentsScreen({ route, navigation }) {
  const filterStatus = route?.params?.filterStatus ?? null;

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [goalStats, setGoalStats] = useState({ total: 0, completed: 0 });
  const currentPage = useRef(1);
  const hasMore = useRef(false);
  const isFetching = useRef(false);

  const { setPendingCall } = useContext(CallContext);

  useEffect(() => {
    fetchAssignments();
    fetchGoalStats();
  }, [filterStatus]);

  const fetchGoalStats = async () => {
    try {
      const response = await client.get('/sales/today-stats/');
      setGoalStats({ total: response.data.total, completed: response.data.completed });
    } catch (error) {
      console.error('목표 통계 로드 실패:', error);
    }
  };

  const buildQuery = (page = 1) => {
    let q = `/sales/?stage=1ST&assigned_today=1&page=${page}`;
    if (filterStatus) q += `&status=${filterStatus}`;
    return q;
  };

  const fetchAssignments = async () => {
    try {
      currentPage.current = 1;
      const response = await client.get(buildQuery(1));
      const data = response.data.results ?? response.data;
      setAssignments(data);
      setTotalCount(response.data.count ?? data.length);
      hasMore.current = !!response.data.next;
    } catch (error) {
      console.error('배정 리스트 가져오기 실패:', error);
      Alert.alert('오류', '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreAssignments = async () => {
    if (!hasMore.current || isFetching.current) return;
    isFetching.current = true;
    setLoadingMore(true);
    try {
      const nextPage = currentPage.current + 1;
      const response = await client.get(buildQuery(nextPage));
      const data = response.data.results ?? response.data;
      setAssignments(prev => [...prev, ...data]);
      currentPage.current = nextPage;
      hasMore.current = !!response.data.next;
    } catch (error) {
      console.error('추가 데이터 로드 실패:', error);
    } finally {
      setLoadingMore(false);
      isFetching.current = false;
    }
  };

  // 전화 걸기 버튼을 눌렀을 때 실행되는 함수
  const handleCall = (item) => {
    // 💡 중요: 백엔드 모델에 따라 customer_name, phone_number 필드명은 실제 API 응답에 맞춰 수정해야 할 수 있습니다!
    const customerName = item.customer_name || item.customer?.name || '고객';
    const customerPhone = item.customer_phone || item.customer?.phone || '01000000000';

    if (!customerPhone) {
      Alert.alert('알림', '전화번호가 없습니다.');
      return;
    }

    // 1. 앱한테 "나 지금 이 사람한테 전화 건다!" 하고 기억시킴 (나중에 돌아올 때를 대비)
    setPendingCall({
      assignmentId: item.id,
      customerName: customerName,
      customerPhone: customerPhone,
      startTime: Date.now(), // 전화 시작 시간 기록
    });

    // 2. 실제 스마트폰의 다이얼(통화 앱) 화면으로 튕겨냄!
    Linking.openURL(`tel:${customerPhone}`).catch(() => {
      Alert.alert('에러', '전화를 걸 수 없는 기기입니다.');
    });
  };

  const getStatusIndicator = (status) => {
    switch (status) {
      case 'ASSIGNED': return { color: '#4CAF50', label: '대기' };
      case 'TRYING':   return { color: '#FF9800', label: '통화중' };
      case 'SUCCESS':  return { color: '#2196F3', label: '성공' };
      case 'BUY':      return { color: '#9C27B0', label: '구매' };
      case 'HOLD':     return { color: '#FF9800', label: '보류' };
      case 'CALLBACK': return { color: '#1976D2', label: '콜백' };
      case 'REJECT':   return { color: '#9E9E9E', label: '거절' };
      case 'INVALID':  return { color: '#9E9E9E', label: '결번' };
      default:         return { color: '#9E9E9E', label: status };
    }
  };

  const isProcessed = (status) => !['ASSIGNED', 'TRYING'].includes(status);

  // 리스트의 각 줄(카드)을 어떻게 보여줄지 정의
  const renderItem = ({ item }) => {
    const indicator = getStatusIndicator(item.status);
    const processed = isProcessed(item.status);

    return (
      <View style={[styles.card, processed && styles.cardProcessed]}>
        <View style={[styles.statusDot, { backgroundColor: indicator.color }]} />
        <View style={styles.info}>
          <Text style={[styles.name, processed && styles.textProcessed]}>
            {item.customer?.name || `고객 #${item.id}`}
          </Text>
          <View style={styles.subRow}>
            <Text style={[styles.phone, processed && styles.textProcessed]}>
              {item.customer?.phone || '번호 없음'}
            </Text>
            {item.customer?.category_1 ? (
              <Text style={[styles.category, processed && styles.textProcessed]}>
                {item.customer.category_1}
              </Text>
            ) : null}
            <Text style={[styles.statusLabel, { color: indicator.color }]}>
              {indicator.label}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.callButton, processed && styles.callButtonProcessed]}
          onPress={() => handleCall(item)}
        >
          <Text style={styles.callButtonText}>📞 전화걸기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayStr = days[today.getDay()];

  const filterLabels = { SUCCESS: '성공', ABSENCE: '부재중', REJECT: '거절', INVALID: '결번' };
  const filterColors = { SUCCESS: '#4CAF50', ABSENCE: '#FF9800', REJECT: '#F44336', INVALID: '#9E9E9E' };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.dateText}>{dateStr} ({dayStr})</Text>
      </View>

      {filterStatus && (
        <View style={[styles.filterBadge, { backgroundColor: filterColors[filterStatus] + '22', borderColor: filterColors[filterStatus] }]}>
          <Text style={[styles.filterBadgeText, { color: filterColors[filterStatus] }]}>
            필터: {filterLabels[filterStatus] ?? filterStatus}
          </Text>
          <TouchableOpacity onPress={() => navigation.setParams({ filterStatus: null })} style={styles.filterClear}>
            <Text style={[styles.filterClearText, { color: filterColors[filterStatus] }]}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {assignments.length === 0 ? (
        <View style={styles.centered}>
          <Text>현재 배정된 고객이 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={assignments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          onEndReached={fetchMoreAssignments}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={<GoalCard total={goalStats.total} completed={goalStats.completed} />}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 16 }} /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  topHeader: { alignItems: 'center', backgroundColor: '#fff', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' },
  dateText: { fontSize: 17, fontWeight: '700', color: '#111' },
  filterBadge: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10, marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start' },
  filterBadgeText: { fontSize: 13, fontWeight: '600' },
  filterClear: { marginLeft: 6, padding: 2 },
  filterClearText: { fontSize: 13, fontWeight: '700' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#ddd' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, marginHorizontal: 10, marginTop: 10, borderRadius: 8, elevation: 2 },
  cardProcessed: { backgroundColor: '#F5F5F5', opacity: 0.8 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  info: { flex: 1, justifyContent: 'center' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  name: { fontSize: 16, fontWeight: 'bold' },
  textProcessed: { color: '#9E9E9E' },
  phone: { fontSize: 14, color: '#666' },
  statusLabel: { fontSize: 12, fontWeight: '600' },
  category: { fontSize: 12, color: '#888', backgroundColor: '#F0F0F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  callButton: { backgroundColor: '#4CAF50', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, justifyContent: 'center' },
  callButtonProcessed: { backgroundColor: '#BDBDBD' },
  callButtonText: { color: '#fff', fontWeight: 'bold' },
});
