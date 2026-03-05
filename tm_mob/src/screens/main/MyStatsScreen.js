import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, Alert, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, G } from 'react-native-svg';
import client from '../../api/client';

// 도넛 차트 컴포넌트
const DonutChart = ({ segments, size = 180, strokeWidth = 28 }) => {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let accumulated = 0;

  return (
    <Svg width={size} height={size}>
      <G rotation="-90" origin={`${cx}, ${cy}`}>
        {total === 0 ? (
          <Circle cx={cx} cy={cy} r={r} stroke="#E0E0E0" strokeWidth={strokeWidth} fill="none" />
        ) : (
          segments.map((seg, i) => {
            if (seg.value === 0) return null;
            const arcLen = (seg.value / total) * circumference;
            const dashOffset = -accumulated;
            accumulated += arcLen;
            return (
              <Circle
                key={i}
                cx={cx} cy={cy} r={r}
                stroke={seg.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${arcLen} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
              />
            );
          })
        )}
      </G>
    </Svg>
  );
};

const PERIODS = [
  { label: '오늘', key: 'today' },
  { label: '이번 주', key: 'week' },
  { label: '이번 달', key: 'month' },
  { label: '직접 설정', key: 'custom' },
];

function getDateRange(periodKey) {
  const today = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  if (periodKey === 'today') {
    return { start: fmt(today), end: fmt(today) };
  }
  if (periodKey === 'week') {
    const day = today.getDay(); // 0=Sun
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((day + 6) % 7));
    return { start: fmt(monday), end: fmt(today) };
  }
  if (periodKey === 'month') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: fmt(first), end: fmt(today) };
  }
  return null; // custom
}

export default function MyStatsScreen({ navigation }) {
  const [stats, setStats] = useState({ total: 0, success: 0, absence: 0, reject: 0, invalid: 0 });
  const [goalStats, setGoalStats] = useState({ total: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const fetchStats = async (selectedPeriod, cStart, cEnd) => {
    try {
      let start, end;
      if (selectedPeriod === 'custom') {
        const dateRx = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRx.test(cStart) || !dateRx.test(cEnd)) {
          Alert.alert('알림', '날짜를 YYYY-MM-DD 형식으로 입력해주세요.');
          setLoading(false);
          setRefreshing(false);
          return;
        }
        start = cStart;
        end = cEnd;
      } else {
        const range = getDateRange(selectedPeriod);
        start = range.start;
        end = range.end;
      }

      const isToday = start === end && start === new Date().toISOString().slice(0, 10);
      const params = { start_date: start, end_date: end };

      const requests = [client.get('/agents/me/stats/', { params })];
      if (isToday) requests.push(client.get('/sales/today-stats/'));

      const results = await Promise.all(requests);
      const data = results[0].data;
      setStats({
        total:   data.today_total   || 0,
        success: data.today_success || 0,
        absence: data.today_absence || 0,
        reject:  data.today_reject  || 0,
        invalid: data.today_invalid || 0,
      });
      if (isToday && results[1]) {
        setGoalStats({ total: results[1].data.total || 0, completed: results[1].data.completed || 0 });
      } else {
        setGoalStats({ total: 0, completed: 0 });
      }
    } catch (error) {
      console.error('통계 가져오기 실패:', error);
      Alert.alert('알림', '통계 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchStats(period, customStart, customEnd);
  }, []));

  const onPeriodChange = (key) => {
    setPeriod(key);
    if (key !== 'custom') {
      setLoading(true);
      fetchStats(key, customStart, customEnd);
    }
  };

  const onApplyCustom = () => {
    setLoading(true);
    fetchStats('custom', customStart, customEnd);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats(period, customStart, customEnd);
  };

  const getPeriodLabel = () => {
    if (period === 'today') return '오늘의 작업 현황';
    if (period === 'week') return '이번 주 작업 현황';
    if (period === 'month') return '이번 달 작업 현황';
    if (period === 'custom' && customStart && customEnd) return `${customStart} ~ ${customEnd}`;
    return '기간별 작업 현황';
  };

  const getSummaryLabel = () => {
    if (period === 'today') return '오늘 총 통화 건수';
    if (period === 'week') return '이번 주 총 통화 건수';
    if (period === 'month') return '이번 달 총 통화 건수';
    return '기간 총 통화 건수';
  };

  if (loading && !refreshing) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2196F3" /></View>;
  }

  const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : '0.0';
  const goalProgress = goalStats.total > 0 ? Math.min(goalStats.completed / goalStats.total, 1) : 0;
  const goalPercent = Math.round(goalProgress * 100);

  const segments = [
    { label: '성공',   value: stats.success, color: '#4CAF50', status: 'SUCCESS'  },
    { label: '부재중', value: stats.absence,  color: '#FF9800', status: 'ABSENCE'  },
    { label: '거절',   value: stats.reject,   color: '#F44336', status: 'REJECT'   },
    { label: '결번',   value: stats.invalid,  color: '#BDBDBD', status: 'INVALID'  },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.headerTitle}>작업 현황</Text>

      {/* 기간 선택 탭 */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
            onPress={() => onPeriodChange(p.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.periodBtnText, period === p.key && styles.periodBtnTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 직접 설정 입력 */}
      {period === 'custom' && (
        <View style={styles.customDateRow}>
          <TextInput
            style={styles.dateInput}
            placeholder="시작일 (YYYY-MM-DD)"
            placeholderTextColor="#aaa"
            value={customStart}
            onChangeText={setCustomStart}
            keyboardType="numeric"
            maxLength={10}
          />
          <Text style={styles.dateSep}>~</Text>
          <TextInput
            style={styles.dateInput}
            placeholder="종료일 (YYYY-MM-DD)"
            placeholderTextColor="#aaa"
            value={customEnd}
            onChangeText={setCustomEnd}
            keyboardType="numeric"
            maxLength={10}
          />
          <TouchableOpacity style={styles.applyBtn} onPress={onApplyCustom} activeOpacity={0.7}>
            <Text style={styles.applyBtnText}>조회</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 상단 메인 요약 카드 */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>{getSummaryLabel()}</Text>
        <Text style={styles.summaryValue}>{stats.total} 건</Text>
        <Text style={styles.successRate}>
          현재 성공률: {successRate}%{'  '}
          <Text style={styles.successRateDetail}>({stats.success}/{stats.total})</Text>
        </Text>

        {goalStats.total > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>목표 달성</Text>
              <Text style={styles.progressPercent}>{goalStats.completed} / {goalStats.total}건 ({goalPercent}%)</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${goalPercent}%` }]} />
            </View>
          </View>
        )}
      </View>

      {/* 도넛 차트 카드 */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{getPeriodLabel()} - 통화 결과 분포</Text>
        <View style={styles.chartBody}>
          {/* 도넛 + 중앙 텍스트 */}
          <View style={styles.donutWrapper}>
            <DonutChart segments={segments} />
            <View style={styles.donutCenter}>
              <Text style={styles.donutCenterValue}>{stats.total}</Text>
              <Text style={styles.donutCenterLabel}>건</Text>
            </View>
          </View>

          {/* 우측 범례 */}
          <View style={styles.legendList}>
            {segments.map((seg) => {
              const pct = stats.total > 0 ? ((seg.value / stats.total) * 100).toFixed(1) : '0.0';
              return (
                <TouchableOpacity
                  key={seg.label}
                  style={styles.legendItem}
                  onPress={() => navigation.navigate('배정 리스트', { filterStatus: seg.status })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
                  <View style={styles.legendTexts}>
                    <Text style={styles.legendLabel}>{seg.label}</Text>
                    <Text style={[styles.legendCount, { color: seg.color }]}>{seg.value}건</Text>
                  </View>
                  <Text style={styles.legendPct}>{pct}%</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <Text style={styles.footerText}>화면을 아래로 당기면 새로고침 됩니다.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4', padding: 15 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' },

  summaryCard: {
    backgroundColor: '#2196F3',
    padding: 25,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
  },
  summaryLabel: { color: '#fff', fontSize: 16, marginBottom: 5 },
  summaryValue: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 6 },
  successRate: { color: '#E3F2FD', fontSize: 14, fontWeight: '600', marginBottom: 16 },
  successRateDetail: { color: '#BBDEFB', fontWeight: '400' },
  progressSection: { width: '100%', marginTop: 4 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { color: '#E3F2FD', fontSize: 13 },
  progressPercent: { color: '#E3F2FD', fontSize: 13, fontWeight: '600' },
  progressBarTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: 8, backgroundColor: '#fff', borderRadius: 4 },

  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
    elevation: 2,
  },
  chartTitle: { fontSize: 14, fontWeight: '700', color: '#555', marginBottom: 16 },
  chartBody: { flexDirection: 'row', alignItems: 'center' },

  donutWrapper: { width: 180, height: 180, justifyContent: 'center', alignItems: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutCenterValue: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  donutCenterLabel: { fontSize: 13, color: '#888' },

  legendList: { flex: 1, paddingLeft: 16, gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendTexts: { flex: 1 },
  legendLabel: { fontSize: 12, color: '#666' },
  legendCount: { fontSize: 15, fontWeight: '700' },
  legendPct: { fontSize: 12, color: '#aaa', minWidth: 38, textAlign: 'right' },

  footerText: { textAlign: 'center', color: '#999', marginTop: 10, marginBottom: 20, fontSize: 12 },

  periodRow: { flexDirection: 'row', marginBottom: 14, gap: 6 },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  periodBtnActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  periodBtnText: { fontSize: 12, color: '#666', fontWeight: '500' },
  periodBtnTextActive: { color: '#fff', fontWeight: '700' },

  customDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 6,
  },
  dateInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 12,
    backgroundColor: '#fff',
    color: '#333',
  },
  dateSep: { color: '#666', fontSize: 14, fontWeight: '600' },
  applyBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 40,
    justifyContent: 'center',
  },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
