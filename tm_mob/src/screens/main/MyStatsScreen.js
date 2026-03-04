import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';

export default function MyStatsScreen() {
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    absence: 0,
    reject: 0,
    invalid: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 1. 통계 데이터 가져오기 로직
  const fetchStats = async () => {
    try {
      // 내 통계 전용 API (관리자 카드와 동일한 기준)
      const response = await client.get('/agents/me/stats/');
      const data = response.data;

      setStats({
        total: data.today_total || 0,
        success: data.today_success || 0,
        absence: data.today_absence || 0,
        reject: data.today_reject || 0,
        invalid: data.today_invalid || 0,
      });

    } catch (error) {
      console.error('통계 가져오기 실패:', error);
      Alert.alert('알림', '통계 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 🌟 사용자가 이 화면(탭)을 누르고 들어올 때마다 자동으로 최신화 (새로고침)
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchStats();
    }, [])
  );

  // 아래로 당겨서 새로고침 (Pull-to-refresh)
  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.headerTitle}>📊 오늘의 작업 현황</Text>

      {/* 상단 메인 요약 카드 */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>오늘 총 통화 건수</Text>
        <Text style={styles.summaryValue}>{stats.total} 건</Text>
      </View>

      {/* 2x2 통계 그리드 */}
      <View style={styles.gridContainer}>
        <StatBox title="성공 (동의)" count={stats.success} color="#4CAF50" />
        <StatBox title="부재중" count={stats.absence} color="#FF9800" />
        <StatBox title="거절" count={stats.reject} color="#F44336" />
        <StatBox title="결번/오류" count={stats.invalid} color="#9E9E9E" />
      </View>
      
      <Text style={styles.footerText}>화면을 아래로 당기면 새로고침 됩니다.</Text>
    </ScrollView>
  );
}

// 작은 통계 박스를 그려주는 재사용 컴포넌트
const StatBox = ({ title, count, color }) => (
  <View style={[styles.statBox, { borderTopColor: color, borderTopWidth: 4 }]}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={[styles.statCount, { color: color }]}>{count}건</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4', padding: 15 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  
  summaryCard: {
    backgroundColor: '#2196F3',
    padding: 25,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3, // 안드로이드 그림자
  },
  summaryLabel: { color: '#fff', fontSize: 16, marginBottom: 5 },
  summaryValue: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    backgroundColor: '#fff',
    width: '48%', // 한 줄에 2개씩 배치
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 2,
  },
  statTitle: { fontSize: 14, color: '#666', marginBottom: 10, fontWeight: 'bold' },
  statCount: { fontSize: 24, fontWeight: 'bold' },
  
  footerText: { textAlign: 'center', color: '#999', marginTop: 20, fontSize: 12 }
});
