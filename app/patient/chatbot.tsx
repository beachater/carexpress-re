import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Background from '../../components/Background';

export default function ChatbotScreen() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string; timestamp: string }[]>([
    {
      sender: 'bot',
      text: '👋 Hi there! You can ask about symptoms, diseases, medications, and more.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: input, timestamp: userTimestamp },
    ]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://192.168.100.180:8000/chat', {




























































































































































































































































































































































































































































































































































































































































































































































































































































































































        
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });

      const data = await response.json();

      const botTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: data?.response || 'No response received.', timestamp: botTimestamp },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: '❌ Server error. Please try again later.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
  ref={scrollViewRef}
  contentContainerStyle={styles.messages}
  keyboardShouldPersistTaps="handled"
  showsVerticalScrollIndicator={false}
>
  {/* <Text style={styles.header}>Find the <Text style={styles.bold}>Care You Need</Text></Text> */}

  {messages.map((msg, index) => (
    <View
      key={index}
      style={[
        styles.messageContainer,
        msg.sender === 'user' ? styles.alignRight : styles.alignLeft,
      ]}
    >
      <View style={styles.profileCircle}>
        <Text style={styles.profileInitial}>
          {msg.sender === 'user' ? 'U' : 'C'}
        </Text>
      </View>

      <View
        style={[
          styles.messageBubble,
          msg.sender === 'user' ? styles.userBubble : styles.botBubble,
          styles.shadow,
        ]}
      >
        <Text style={styles.messageText}>{msg.text}</Text>
        <Text style={styles.timestamp}>{msg.timestamp}</Text>
      </View>
    </View>
  ))}

  {isTyping && (
    <View style={[styles.messageContainer, styles.alignLeft]}>
      <View style={styles.profileCircle}>
        <Text style={styles.profileInitial}>C</Text>
      </View>
      <View style={[styles.botBubble, styles.shadow]}>
        <Text style={styles.messageText}>🩺 Bot is thinking...</Text>
      </View>
    </View>
  )}
</ScrollView>  {/* ✅ make sure this closing tag is present */}


          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Ask a health-related question..."
              value={input}
              onChangeText={setInput}
              placeholderTextColor="#999"
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  messages: {
    paddingHorizontal: 16,
    paddingBottom: 90,
    paddingTop: 10,
  },
  header: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
    fontWeight: '600',
  },
  bold: {
    color: '#27ae60',
    fontWeight: 'bold',
  },
  messageContainer: {
  flexDirection: 'row',
  marginBottom: 10,
  paddingHorizontal: 1,
},

alignLeft: {
  justifyContent: 'flex-start',
},

alignRight: {
  justifyContent: 'flex-end',
  flexDirection: 'row-reverse',
},

messageBubble: {
  maxWidth: '85%', // more breathing room
  padding: 14,
  borderRadius: 18,
},
  userBubble: {
    backgroundColor: '#d1f2eb',
    borderTopRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  timestamp: {
  fontSize: 11,
  color: '#888',
  marginTop: 6,
  textAlign: 'right',
  paddingRight: 2,
},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#27ae60',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  profileCircle: {
  width: 30,
  height: 30,
  borderRadius: 15,
  backgroundColor: '#27ae60',
  alignItems: 'center',
  justifyContent: 'center',
  marginHorizontal: 6, // smaller margin for tighter layout
},
  profileInitial: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
