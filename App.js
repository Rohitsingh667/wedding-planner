import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const STORAGE_KEY = 'wedding_guests_v1';

async function fetchRandomUserName() {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch('https://randomuser.me/api/', { signal: controller.signal });
    if (!res.ok) throw new Error('Network error while fetching random user.');
    const data = await res.json();
    const u = data?.results?.[0];
    const first = u?.name?.first;
    const last = u?.name?.last;
    if (!first || !last) throw new Error('Received incomplete user data.');
    return `${first} ${last}`.replace(/\s+/g, ' ').trim();
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Request timed out. Please try again.');
    throw e;
  } finally {
    clearTimeout(id);
  }
}

function createGuest(name, rsvp) {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name, rsvp };
}

export default function App() {
  const [guests, setGuests] = useState([]);
  const [name, setName] = useState('');
  const [rsvp, setRsvp] = useState('Maybe');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState('');
  const [loadingRandom, setLoadingRandom] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setGuests(parsed);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(guests)); } catch {}
    })();
  }, [guests]);

  const totals = useMemo(() => ({
    total: guests.length,
    confirmed: guests.filter(g => g.rsvp === 'Yes').length,
  }), [guests]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return guests.filter(g => {
      const matchesSearch = !s || g.name.toLowerCase().includes(s);
      const matchesFilter = filter === 'All' || g.rsvp === filter;
      return matchesSearch && matchesFilter;
    });
  }, [guests, search, filter]);

  const onAdd = () => {
    if (!name.trim()) { setError('Please enter a name.'); return; }
    setError('');
    setGuests(prev => [createGuest(name.trim(), rsvp), ...prev]);
    setName('');
    setRsvp('Maybe');
  };

  const onDelete = (id) => {
    setGuests(prev => prev.filter(g => g.id !== id));
  };

  const onAddRandom = async () => {
    try {
      setLoadingRandom(true); setError('');
      const n = await fetchRandomUserName();
      setGuests(prev => [createGuest(n, 'Maybe'), ...prev]);
    } catch (e) {
      setError(e.message || 'Unable to add random guest right now.');
    } finally { setLoadingRandom(false); }
  };

  const RsvpButton = ({ value }) => (
    <TouchableOpacity
      onPress={() => setRsvp(value)}
      style={[styles.pill, rsvp === value && styles.pillActive]}
    >
      <Text style={[styles.pillText, rsvp === value && styles.pillTextActive]}>{value}</Text>
    </TouchableOpacity>
  );

  const FilterButton = ({ value }) => (
    <TouchableOpacity
      onPress={() => setFilter(value)}
      style={[styles.pill, filter === value && styles.pillActive]}
    >
      <Text style={[styles.pillText, filter === value && styles.pillTextActive]}>{value}</Text>
    </TouchableOpacity>
  );

  const Badge = ({ status }) => (
    <View style={[styles.badge, status === 'Yes' && styles.badgeYes, status === 'No' && styles.badgeNo, status === 'Maybe' && styles.badgeMaybe]}>
      <Text style={styles.badgeText}>{status}</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.name}>{item.name}</Text>
        <Badge status={item.rsvp} />
      </View>
      <TouchableOpacity style={styles.dangerBtn} onPress={() => onDelete(item.id)}>
        <Text style={styles.dangerBtnText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Wedding Planner</Text>
        <View style={styles.statsStrip}>
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Total Guests</Text>
            <Text style={styles.statsValue}>{totals.total}</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Confirmed (Yes)</Text>
            <Text style={styles.statsValue}>{totals.confirmed}</Text>
          </View>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Add Guest</Text>
        <View style={styles.formRow}>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter guest name"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>RSVP</Text>
          <View style={styles.pillRow}>
            <RsvpButton value="Yes" />
            <RsvpButton value="No" />
            <RsvpButton value="Maybe" />
          </View>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={onAdd}>
          <Text style={styles.primaryBtnText}>Add Guest</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={styles.rowBetween}>
          <TouchableOpacity style={styles.darkBtn} onPress={onAddRandom} disabled={loadingRandom}>
            <Text style={styles.darkBtnText}>{loadingRandom ? 'Adding…' : 'Add Random Guest'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toolsRow}>
          <View style={[styles.fieldBlock, styles.flex1]}>
            <Text style={styles.label}>Search</Text>
            <TextInput
              style={styles.input}
              placeholder="Search guests by name"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <View style={[styles.fieldBlock, styles.flex1]}>
            <Text style={styles.label}>Filter</Text>
            <View style={styles.pillRow}>
              <FilterButton value="All" />
              <FilterButton value="Yes" />
              <FilterButton value="No" />
              <FilterButton value="Maybe" />
            </View>
          </View>
        </View>

        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={filtered}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyHint}>No guests yet.</Text>}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa', padding: 16 },
  header: { marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#1f2937' },
  statsStrip: { flexDirection: 'row', gap: 12, marginTop: 8 },
  statsCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 1 },
  statsLabel: { color: '#6b7280', fontSize: 12 },
  statsValue: { fontSize: 20, fontWeight: '700' },

  panel: { backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 1 },
  sectionTitle: { fontWeight: '600', marginBottom: 6, color: '#111827' },
  formRow: { flexDirection: 'row', gap: 12 },
  fieldBlock: { marginBottom: 10 },
  label: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, backgroundColor: '#fff', minWidth: 220 },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#fff' },
  pillActive: { borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.1)' },
  pillText: { color: '#1f2937' },
  pillTextActive: { color: '#2563eb', fontWeight: '600' },
  primaryBtn: { backgroundColor: '#2563eb', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, alignSelf: 'flex-start' },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  darkBtn: { backgroundColor: '#111827', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  darkBtnText: { color: '#fff', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toolsRow: { flexDirection: 'row', gap: 12, marginTop: 10, flexWrap: 'wrap' },
  flex1: { flex: 1, minWidth: 220 },
  errorBanner: { backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1, padding: 10, borderRadius: 10, marginTop: 12 },
  errorText: { color: '#991b1b' },
  list: { gap: 10, paddingVertical: 12 },
  row: { backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontWeight: '600', color: '#1f2937' },
  badge: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeYes: { backgroundColor: '#dcfce7' },
  badgeNo: { backgroundColor: '#fee2e2' },
  badgeMaybe: { backgroundColor: '#e0f2fe' },
  dangerBtn: { backgroundColor: '#ef4444', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  dangerBtnText: { color: '#fff', fontWeight: '600' },
  emptyHint: { color: '#6b7280', textAlign: 'center', marginTop: 20 }
});
