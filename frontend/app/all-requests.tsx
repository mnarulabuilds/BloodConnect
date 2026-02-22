import React, { useState, useCallback, useRef } from 'react';
import {
    StyleSheet, View, Text, FlatList, TouchableOpacity,
    useColorScheme, ActivityIndicator, Animated,
    ScrollView, TextInput, RefreshControl, Platform
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { BLOOD_GROUPS } from '@/constants/data';
import { requestService, chatService } from '@/utils/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────
interface BloodRequest {
    _id: string;
    patientName: string;
    bloodGroup: string;
    hospital: string;
    location: string;
    urgency: 'Normal' | 'Urgent' | 'Critical';
    units: number;
    contact: string;
    status: 'open' | 'completed' | 'cancelled';
    requestor: { _id?: string; name?: string; phone?: string } | string;
    createdAt: string;
}

const URGENCY_CONFIG: Record<string, { bg: string; text: string; icon: string }> = {
    Critical: { bg: '#FFEBEE', text: '#C62828', icon: 'alert-circle' },
    Urgent: { bg: '#FFF3E0', text: '#E65100', icon: 'warning' },
    Normal: { bg: '#E8F5E9', text: '#2E7D32', icon: 'checkmark-circle' },
};

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
    open: { bg: '#E3F2FD', text: '#1565C0' },
    completed: { bg: '#E8F5E9', text: '#2E7D32' },
    cancelled: { bg: '#FFEBEE', text: '#C62828' },
};

const PAGE_SIZE_OPTIONS = [5, 10, 20];
const URGENCY_FILTERS = ['All', 'Critical', 'Urgent', 'Normal'];
const STATUS_FILTERS = ['All', 'open', 'completed', 'cancelled'];

// ─── Skeleton row ─────────────────────────────────────────────────────────
function SkeletonRow({ theme }: { theme: typeof Colors.light }) {
    const pulse = useRef(new Animated.Value(0.4)).current;
    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    return (
        <Animated.View style={[styles.row, { backgroundColor: theme.surface, opacity: pulse }]}>
            {[60, 70, 90, 60, 70].map((w, i) => (
                <View key={i} style={[styles.skeletonCell, { width: w, backgroundColor: theme.border }]} />
            ))}
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────
export default function AllRequestsScreen() {
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const theme = Colors[colorScheme];
    const { showToast } = useToast();
    const { user } = useAuth();

    const [requests, setRequests] = useState<BloodRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [urgencyFilter, setUrgencyFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [bloodGroupFilter, setBloodGroupFilter] = useState('');
    const [searchText, setSearchText] = useState('');
    const [helpingId, setHelpingId] = useState<string | null>(null);

    const fetchRequests = useCallback(async (pg = page, refresh = false) => {
        if (refresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const params: any = { page: pg, limit: pageSize };
            if (urgencyFilter !== 'All') params.urgency = urgencyFilter;
            if (statusFilter !== 'All') params.status = statusFilter;
            if (bloodGroupFilter) params.bloodGroup = bloodGroupFilter;

            const res = await requestService.getRequestsPaginated(params);
            setRequests(res.data.data);
            setTotalPages(res.data.totalPages);
            setTotalCount(res.data.totalCount);
            setPage(pg);
        } catch (err) {
            showToast({ message: 'Failed to load requests', type: 'error' });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [page, pageSize, urgencyFilter, statusFilter, bloodGroupFilter]);

    useFocusEffect(useCallback(() => { fetchRequests(1); }, [urgencyFilter, statusFilter, bloodGroupFilter, pageSize]));

    const handleHelp = async (req: BloodRequest) => {
        const requestorId = typeof req.requestor === 'string' ? req.requestor : req.requestor?._id;
        if (!requestorId) { showToast({ message: 'Cannot open chat for this request.', type: 'error' }); return; }
        if (requestorId === user?.id) { showToast({ message: 'This is your own request.', type: 'info' as any }); return; }

        setHelpingId(req._id);
        try {
            const res = await chatService.startChat(requestorId, req._id);
            router.push({ pathname: '/chat/[id]', params: { id: res.data.data._id } });
        } catch {
            showToast({ message: 'Could not open chat.', type: 'error' });
        } finally {
            setHelpingId(null);
        }
    };

    // Local text search on top of server results
    const displayedRequests = searchText.trim()
        ? requests.filter(r =>
            r.hospital?.toLowerCase().includes(searchText.toLowerCase()) ||
            r.location?.toLowerCase().includes(searchText.toLowerCase()) ||
            r.patientName?.toLowerCase().includes(searchText.toLowerCase())
        )
        : requests;

    // ── Render a table row ─────────────────────────────────────────────
    const renderRow = ({ item, index }: { item: BloodRequest; index: number }) => {
        const urgConf = URGENCY_CONFIG[item.urgency] ?? URGENCY_CONFIG.Normal;
        const stConf = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.open;
        const isOdd = index % 2 === 0;

        return (
            <View style={[
                styles.row,
                { backgroundColor: isOdd ? theme.background : theme.surface },
            ]}>
                {/* Blood Group */}
                <View style={[styles.cell, styles.cellBlood]}>
                    <View style={[styles.bloodBadge, { backgroundColor: theme.primary + '18' }]}>
                        <Text style={[styles.bloodBadgeText, { color: theme.primary }]}>{item.bloodGroup}</Text>
                    </View>
                </View>

                {/* Hospital + Location */}
                <View style={[styles.cell, styles.cellHospital]}>
                    <Text style={[styles.cellPrimary, { color: theme.text }]} numberOfLines={1}>
                        {item.hospital || item.patientName || '—'}
                    </Text>
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={11} color={theme.textSecondary} />
                        <Text style={[styles.cellSecondary, { color: theme.textSecondary }]} numberOfLines={1}>
                            {item.location}
                        </Text>
                    </View>
                </View>

                {/* Urgency badge */}
                <View style={[styles.cell, styles.cellUrgency]}>
                    <View style={[styles.badge, { backgroundColor: urgConf.bg }]}>
                        <Ionicons name={urgConf.icon as any} size={11} color={urgConf.text} />
                        <Text style={[styles.badgeText, { color: urgConf.text }]}>{item.urgency}</Text>
                    </View>
                </View>

                {/* Units */}
                <View style={[styles.cell, styles.cellUnits]}>
                    <Text style={[styles.cellPrimary, { color: theme.text, textAlign: 'center' }]}>{item.units}</Text>
                    <Text style={[styles.cellSecondary, { color: theme.textSecondary, textAlign: 'center' }]}>units</Text>
                </View>

                {/* Status badge */}
                <View style={[styles.cell, styles.cellStatus]}>
                    <View style={[styles.badge, { backgroundColor: stConf.bg }]}>
                        <Text style={[styles.badgeText, { color: stConf.text, textTransform: 'capitalize' }]}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                {/* Action */}
                <View style={[styles.cell, styles.cellAction]}>
                    {item.status === 'open' ? (
                        <TouchableOpacity
                            style={[styles.helpBtn, { backgroundColor: theme.primary }]}
                            onPress={() => handleHelp(item)}
                            disabled={helpingId === item._id}
                        >
                            {helpingId === item._id
                                ? <ActivityIndicator size="small" color="#FFF" />
                                : <Text style={styles.helpBtnText}>Help</Text>
                            }
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.helpBtn, { backgroundColor: theme.border }]}>
                            <Text style={[styles.helpBtnText, { color: theme.textSecondary }]}>—</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <View style={[styles.header, { backgroundColor: theme.primary }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#FFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Blood Requests</Text>
                    <Text style={styles.headerSub}>{totalCount} total requests</Text>
                </View>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/request-blood')}>
                    <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* ── Search ─────────────────────────────────────────────── */}
            <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="search" size={18} color={theme.textSecondary} />
                <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Search hospital, location, patient…"
                    placeholderTextColor={theme.textSecondary}
                    value={searchText}
                    onChangeText={setSearchText}
                />
                {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText('')}>
                        <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* ── Filters row ────────────────────────────────────────── */}
            <View style={styles.filtersSection}>
                {/* Urgency */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>Urgency:</Text>
                    {URGENCY_FILTERS.map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterChip, {
                                backgroundColor: urgencyFilter === f ? theme.primary : theme.surface,
                                borderColor: urgencyFilter === f ? theme.primary : theme.border
                            }]}
                            onPress={() => { setUrgencyFilter(f); setPage(1); }}
                        >
                            <Text style={[styles.filterChipText, { color: urgencyFilter === f ? '#FFF' : theme.text }]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Status */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>Status:</Text>
                    {STATUS_FILTERS.map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterChip, {
                                backgroundColor: statusFilter === f ? theme.primary : theme.surface,
                                borderColor: statusFilter === f ? theme.primary : theme.border
                            }]}
                            onPress={() => { setStatusFilter(f); setPage(1); }}
                        >
                            <Text style={[styles.filterChipText, { color: statusFilter === f ? '#FFF' : theme.text, textTransform: 'capitalize' }]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Blood group */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>Blood:</Text>
                    <TouchableOpacity
                        style={[styles.filterChip, {
                            backgroundColor: !bloodGroupFilter ? theme.primary : theme.surface,
                            borderColor: !bloodGroupFilter ? theme.primary : theme.border
                        }]}
                        onPress={() => { setBloodGroupFilter(''); setPage(1); }}
                    >
                        <Text style={[styles.filterChipText, { color: !bloodGroupFilter ? '#FFF' : theme.text }]}>All</Text>
                    </TouchableOpacity>
                    {BLOOD_GROUPS.map(g => (
                        <TouchableOpacity
                            key={g}
                            style={[styles.filterChip, {
                                backgroundColor: bloodGroupFilter === g ? theme.primary : theme.surface,
                                borderColor: bloodGroupFilter === g ? theme.primary : theme.border
                            }]}
                            onPress={() => { setBloodGroupFilter(bloodGroupFilter === g ? '' : g); setPage(1); }}
                        >
                            <Text style={[styles.filterChipText, { color: bloodGroupFilter === g ? '#FFF' : theme.text }]}>{g}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* ── Table header ───────────────────────────────────────── */}
            <View style={[styles.tableHead, { backgroundColor: theme.primary + 'EE', borderColor: theme.primary }]}>
                <Text style={[styles.headCell, styles.cellBlood, { color: '#FFF' }]}>Group</Text>
                <Text style={[styles.headCell, styles.cellHospital, { color: '#FFF' }]}>Hospital / Location</Text>
                <Text style={[styles.headCell, styles.cellUrgency, { color: '#FFF' }]}>Urgency</Text>
                <Text style={[styles.headCell, styles.cellUnits, { color: '#FFF', textAlign: 'center' }]}>Units</Text>
                <Text style={[styles.headCell, styles.cellStatus, { color: '#FFF' }]}>Status</Text>
                <Text style={[styles.headCell, styles.cellAction, { color: '#FFF', textAlign: 'center' }]}>Action</Text>
            </View>

            {/* ── Table body ─────────────────────────────────────────── */}
            {isLoading ? (
                <ScrollView>
                    {Array.from({ length: pageSize }).map((_, i) => <SkeletonRow key={i} theme={theme} />)}
                </ScrollView>
            ) : (
                <FlatList
                    data={displayedRequests}
                    keyExtractor={item => item._id}
                    renderItem={renderRow}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={() => fetchRequests(1, true)}
                            colors={[theme.primary]}
                            tintColor={theme.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={64} color={theme.border} />
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>No requests found</Text>
                            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                                Try adjusting your filters above
                            </Text>
                        </View>
                    }
                    contentContainerStyle={{ flexGrow: 1 }}
                />
            )}

            {/* ── Footer: pagination controls ────────────────────────── */}
            <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>

                {/* Rows per page */}
                <View style={styles.pageSizeRow}>
                    <Text style={[styles.footerLabel, { color: theme.textSecondary }]}>Per page:</Text>
                    {PAGE_SIZE_OPTIONS.map(n => (
                        <TouchableOpacity
                            key={n}
                            style={[styles.pageSizeChip, {
                                backgroundColor: pageSize === n ? theme.primary : theme.background,
                                borderColor: pageSize === n ? theme.primary : theme.border
                            }]}
                            onPress={() => { setPageSize(n); fetchRequests(1); }}
                        >
                            <Text style={[styles.pageSizeText, { color: pageSize === n ? '#FFF' : theme.text }]}>{n}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Page navigator */}
                <View style={styles.pageNav}>
                    <TouchableOpacity
                        onPress={() => fetchRequests(page - 1)}
                        disabled={page <= 1}
                        style={[styles.pageBtn, { borderColor: theme.border, opacity: page <= 1 ? 0.35 : 1 }]}
                    >
                        <Ionicons name="chevron-back" size={18} color={theme.text} />
                    </TouchableOpacity>

                    <Text style={[styles.pageLabel, { color: theme.text }]}>
                        {page} / {totalPages}
                    </Text>

                    <TouchableOpacity
                        onPress={() => fetchRequests(page + 1)}
                        disabled={page >= totalPages}
                        style={[styles.pageBtn, { borderColor: theme.border, opacity: page >= totalPages ? 0.35 : 1 }]}
                    >
                        <Ionicons name="chevron-forward" size={18} color={theme.text} />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.countLabel, { color: theme.textSecondary }]}>
                    {totalCount} total
                </Text>
            </View>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 56 : 40,
        paddingBottom: 16,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.md,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 1 },

    // Search
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: Spacing.md, marginVertical: Spacing.sm,
        paddingHorizontal: Spacing.md, height: 44,
        borderRadius: 14, borderWidth: 1,
    },
    searchInput: { flex: 1, marginLeft: Spacing.sm, fontSize: 14 },

    // Filters
    filtersSection: { paddingBottom: 4 },
    filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingBottom: 6, gap: 6 },
    filterLabel: { fontSize: 12, fontWeight: '600', marginRight: 2, minWidth: 48 },
    filterChip: {
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 10, borderWidth: 1,
    },
    filterChipText: { fontSize: 12, fontWeight: '600' },

    // Table header
    tableHead: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 10, paddingHorizontal: Spacing.md,
    },
    headCell: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },

    // Table rows
    row: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 12, paddingHorizontal: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    cell: { justifyContent: 'center' },
    cellBlood: { width: 56 },
    cellHospital: { flex: 1, paddingRight: 6 },
    cellUrgency: { width: 80 },
    cellUnits: { width: 46 },
    cellStatus: { width: 76 },
    cellAction: { width: 56, alignItems: 'center' },

    bloodBadge: {
        paddingHorizontal: 6, paddingVertical: 4,
        borderRadius: 8, alignItems: 'center',
    },
    bloodBadgeText: { fontSize: 13, fontWeight: 'bold' },

    locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 2 },
    cellPrimary: { fontSize: 13, fontWeight: '600' },
    cellSecondary: { fontSize: 11 },

    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8,
    },
    badgeText: { fontSize: 10, fontWeight: '700' },

    helpBtn: {
        width: 48, height: 28, borderRadius: 8,
        justifyContent: 'center', alignItems: 'center',
    },
    helpBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

    // Skeleton
    skeletonCell: { height: 16, borderRadius: 8, marginRight: 10 },

    // Empty
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 12 },
    emptySubtitle: { fontSize: 13, marginTop: 6, textAlign: 'center' },

    // Footer
    footer: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.md, paddingVertical: 10,
        borderTopWidth: 1, gap: Spacing.md,
        flexWrap: 'wrap',
    },
    pageSizeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerLabel: { fontSize: 12 },
    pageSizeChip: {
        width: 32, height: 28, borderRadius: 8, borderWidth: 1,
        justifyContent: 'center', alignItems: 'center',
    },
    pageSizeText: { fontSize: 12, fontWeight: '600' },
    pageNav: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center' },
    pageBtn: {
        width: 32, height: 32, borderRadius: 10, borderWidth: 1,
        justifyContent: 'center', alignItems: 'center',
    },
    pageLabel: { fontSize: 14, fontWeight: '700', minWidth: 50, textAlign: 'center' },
    countLabel: { fontSize: 12 },
});
