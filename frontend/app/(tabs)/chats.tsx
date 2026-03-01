import React, { useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity, Image,
  useColorScheme, ActivityIndicator,
} from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { chatService } from '@/utils/api';
import { router, useFocusEffect } from 'expo-router';
import type { Chat, ChatParticipant } from '@/types';

const ChatItem = React.memo(
  ({ item, userId, theme }: { item: Chat; userId: string | undefined; theme: typeof Colors.light }) => {
    const otherUser = item.participants.find((p: ChatParticipant) => p._id !== userId);
    const displayName =
      otherUser?.role === 'donor' ? `Donor (${otherUser.bloodGroup})` : otherUser?.name || 'Unknown';

    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
      <TouchableOpacity
        style={[styles.chatCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item._id } })}
      >
        <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
          {otherUser?.avatar ? (
            <Image source={{ uri: otherUser.avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.avatarText, { color: theme.primary }]}>{displayName.charAt(0)}</Text>
          )}
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, { color: theme.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.chatTime, { color: theme.textSecondary }]}>
              {formatTime(item.updatedAt)}
            </Text>
          </View>
          <Text style={[styles.lastMessage, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.lastMessage?.text || 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
);

export default function ChatsScreen() {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const theme = Colors[colorScheme];
  const { user } = useAuth();

  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    try {
      const response = await chatService.getChats();
      setChats(response.data.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchChats(); }, [fetchChats]));

  const renderChat = useCallback(
    ({ item }: { item: Chat }) => <ChatItem item={item} userId={user?.id} theme={theme} />,
    [user?.id, theme]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>Safe & Private Connections</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item._id}
          renderItem={renderChat}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={80} color={theme.border} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No conversations yet.{'\n'}Find donors or respond to requests to start chatting.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60, paddingHorizontal: Spacing.lg, paddingBottom: 25,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  headerTitle: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  chatCard: {
    flexDirection: 'row', padding: Spacing.md, borderRadius: 20,
    marginBottom: Spacing.md, borderWidth: 1, alignItems: 'center',
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  avatarImage: { width: 60, height: 60, borderRadius: 30 },
  avatarText: { fontSize: 24, fontWeight: 'bold' },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chatName: { fontSize: 18, fontWeight: 'bold', maxWidth: '70%' },
  chatTime: { fontSize: 12 },
  lastMessage: { fontSize: 14 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: Spacing.md, fontSize: 16, textAlign: 'center', lineHeight: 24 },
});
