import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, useColorScheme, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { chatService } from '@/utils/api';
import type { Message, Chat } from '@/types';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const theme = Colors[colorScheme];
  const { user } = useAuth();
  const { socket, joinChat, sendMessage: sendSocketMessage } = useChat();

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchChatDetails();
    fetchMessages();
    joinChat(id as string);
  }, [id]);

  useEffect(() => {
    if (socket) {
      const handler = (newMessage: Message) => {
        if (newMessage.senderId !== user?.id) {
          setMessages((prev) => [...prev, newMessage]);
        }
      };
      socket.on('receive_message', handler);
      return () => { socket.off('receive_message', handler); };
    }
  }, [socket, user]);

  const fetchChatDetails = async () => {
    try {
      const response = await chatService.getChatById(id as string);
      setChat(response.data.data);
    } catch (error) {
      console.error('Error fetching chat details:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await chatService.getMessages(id as string);
      setMessages(response.data.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');

    const tempMessage: Message = {
      _id: Date.now().toString(),
      chatId: id as string,
      senderId: user?.id || '',
      text,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      await chatService.sendMessage(id as string, text);
      sendSocketMessage(id as string, text);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [inputText, id, user, sendSocketMessage]);

  const otherUser = chat?.participants.find((p) => p._id !== user?.id);
  const displayName =
    otherUser?.role === 'donor' ? `Donor (${otherUser.bloodGroup})` : otherUser?.name || 'Chat';

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isMine = item.senderId === user?.id;
      return (
        <View style={[styles.messageWrapper, isMine ? styles.myMessageWrapper : styles.otherMessageWrapper]}>
          <View
            style={[
              styles.messageBubble,
              {
                backgroundColor: isMine ? theme.primary : theme.surface,
                borderColor: theme.border,
                borderWidth: isMine ? 0 : 1,
              },
            ]}
          >
            <Text style={[styles.messageText, { color: isMine ? '#FFF' : theme.text }]}>{item.text}</Text>
            <Text
              style={[styles.messageTime, { color: isMine ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}
            >
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      );
    },
    [user, theme]
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={[styles.headerAvatar, { backgroundColor: theme.primary + '20' }]}>
          <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{displayName.charAt(0)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: theme.text }]}>{displayName}</Text>
          <Text style={[styles.headerStatus, { color: socket?.connected ? theme.success : theme.textSecondary }]}>
            {socket?.connected ? 'Online' : 'Connecting...'}
          </Text>
        </View>
        <TouchableOpacity style={styles.callBtn}>
          <Ionicons name="call-outline" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={styles.messageList}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={15}
      />

      <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TextInput
          style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
          placeholder="Type a message..."
          placeholderTextColor={theme.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: theme.primary, opacity: inputText.trim() ? 1 : 0.5 }]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 15,
    paddingHorizontal: Spacing.md, borderBottomWidth: 1,
  },
  backBtn: { padding: 5 },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20, marginHorizontal: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: 'bold' },
  headerStatus: { fontSize: 12 },
  callBtn: { padding: 5 },
  messageList: { padding: Spacing.md, paddingBottom: 20 },
  messageWrapper: { marginVertical: 4, flexDirection: 'row' },
  myMessageWrapper: { justifyContent: 'flex-end' },
  otherMessageWrapper: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '80%', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20 },
  messageText: { fontSize: 16, lineHeight: 22 },
  messageTime: { fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 30 : Spacing.sm, borderTopWidth: 1,
  },
  input: { flex: 1, borderRadius: 25, paddingHorizontal: 15, paddingVertical: 10, fontSize: 16, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});
