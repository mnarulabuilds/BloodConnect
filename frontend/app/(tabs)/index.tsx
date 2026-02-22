import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, useColorScheme, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Link, useFocusEffect, router } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { requestService, chatService, donorService } from '@/utils/api';

interface BloodRequest {
  _id: string;
  patientName: string;
  bloodGroup: string;
  hospital: string;
  location: string;
  urgency: string;
  units: number;
  requestor: any;
}

export default function HomeScreen() {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const theme = Colors[colorScheme];
  const { user } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [donorCount, setDonorCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const [requestsRes, statsRes] = await Promise.all([
        requestService.getRequests(),
        donorService.getStats()
      ]);
      setRequests(requestsRes.data.data.slice(0, 3));
      setDonorCount(statsRes.data.totalDonors);
      setSavedCount(statsRes.data.totalSaved);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast({ message: 'Failed to load data', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [])
  );

  const QuickAction = ({ title, icon, color, href }: { title: string; icon: any; color: string; href: string }) => (
    <Link href={href as any} asChild>
      <TouchableOpacity style={styles.actionCard}>
        <View style={[styles.actionIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={28} color="#FFF" />
        </View>
        <Text style={[styles.actionText, { color: theme.text }]}>{title}</Text>
      </TouchableOpacity>
    </Link>
  );

  const handleHelp = async (recipientId: string, requestId: string) => {
    try {
      const response = await chatService.startChat(recipientId, requestId);
      router.push({
        pathname: '/chat/[id]',
        params: { id: response.data.data._id }
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      showToast({ message: 'Could not open chat. Please try again.', type: 'error' });
    }
  };

  const urgentCount = requests.filter(r => r.urgency === 'Critical' || r.urgency === 'Urgent').length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Premium Header with Stats */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Friend'}!</Text>
            <Text style={styles.subGreeting}>Your blood can save lives today.</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{donorCount.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Donors</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{urgentCount}</Text>
            <Text style={styles.statLabel}>Urgent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{savedCount}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.actionsGrid}>
          <QuickAction title="Find Donors" icon="search" color="#4CAF50" href="/donors" />
          <QuickAction title="Request Blood" icon="medkit" color="#FF9800" href="/request-blood" />
          <QuickAction title="Profile" icon="person" color="#2196F3" href="/profile" />
          <QuickAction title="Chats" icon="chatbubbles" color="#9C27B0" href="/chats" />
        </View>

        <View style={styles.emergencyCard}>
          <BlurView intensity={80} style={styles.blurContainer} tint={colorScheme === 'dark' ? 'dark' : 'light'}>
            <View style={styles.emergencyHeader}>
              <View style={styles.emergencyIcon}>
                <Ionicons name="alert-circle" size={32} color={theme.error} />
              </View>
              <View>
                <Text style={[styles.emergencyTitle, { color: theme.text }]}>Emergency Requests</Text>
                <Text style={[styles.emergencySubtitle, { color: theme.textSecondary }]}>Immediate help needed nearby</Text>
              </View>
            </View>

            {isLoading ? (
              <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 20 }} />
            ) : requests.length > 0 ? (
              requests.map((request) => (
                <View key={request._id} style={[styles.requestItem, { borderBottomColor: theme.border }]}>
                  <View style={styles.bloodTypeCircle}>
                    <Text style={styles.bloodTypeText}>{request.bloodGroup}</Text>
                  </View>
                  <View style={styles.requestInfo}>
                    <Text style={[styles.requestUser, { color: theme.text }]} numberOfLines={1}>
                      {request.hospital || request.patientName || 'Anonymous Patient'}
                    </Text>
                    <Text style={[styles.requestLoc, { color: theme.textSecondary }]}>
                      {request.location} • {request.urgency}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.donateBtn}
                    onPress={() => handleHelp(typeof request.requestor === 'string' ? request.requestor : request.requestor._id, request._id)}
                  >
                    <Text style={styles.donateBtnText}>Help</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={{ textAlign: 'center', color: theme.textSecondary, marginVertical: 20 }}>
                No active requests found.
              </Text>
            )}

            <TouchableOpacity style={styles.viewAllBtn}>
              <Text style={{ color: theme.primary, fontWeight: 'bold' }}>View All Requests</Text>
            </TouchableOpacity>
          </BlurView>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.lg }]}>Why Donate?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.infoScroll}>
          <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
            <Ionicons name="heart" size={32} color={theme.primary} />
            <Text style={[styles.infoCardTitle, { color: theme.text }]}>Save Lives</Text>
            <Text style={[styles.infoCardDesc, { color: theme.textSecondary }]}>One donation can save up to 3 lives.</Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
            <Ionicons name="fitness" size={32} color="#4CAF50" />
            <Text style={[styles.infoCardTitle, { color: theme.text }]}>Stay Healthy</Text>
            <Text style={[styles.infoCardDesc, { color: theme.textSecondary }]}>Regular donation helps iron balance.</Text>
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greeting: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subGreeting: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
  },
  content: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  actionCard: {
    width: '23%',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  emergencyCard: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  blurContainer: {
    padding: Spacing.md,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emergencyIcon: {
    marginRight: Spacing.sm,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emergencySubtitle: {
    fontSize: 12,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  bloodTypeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: '#EF5350',
  },
  bloodTypeText: {
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 18,
  },
  requestInfo: {
    flex: 1,
  },
  requestUser: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  requestLoc: {
    fontSize: 12,
  },
  donateBtn: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  donateBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  viewAllBtn: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  infoScroll: {
    paddingBottom: Spacing.md,
  },
  infoCard: {
    width: 160,
    padding: Spacing.md,
    borderRadius: 20,
    marginRight: Spacing.md,
  },
  infoCardTitle: {
    fontWeight: 'bold',
    marginTop: Spacing.sm,
    fontSize: 16,
  },
  infoCardDesc: {
    fontSize: 12,
    marginTop: 4,
  }
});
