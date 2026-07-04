import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

type UserRole = 'customer' | 'agency' | 'driver';

const roleOptions: Array<{ label: string; value: UserRole }> = [
  { label: 'Customer', value: 'customer' },
  { label: 'Agency', value: 'agency' },
  { label: 'Driver', value: 'driver' },
];

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      await signIn(email.trim(), password, role);
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'Unable to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in as customer, agency, or driver</Text>

        <View style={styles.segmented}>
          {roleOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.segmentButton, role === option.value && styles.segmentButtonActive]}
              onPress={() => setRole(option.value)}
            >
              <Text style={[styles.segmentText, role === option.value && styles.segmentTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.forgotPasswordText}>Need an account?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    color: '#f8fafc',
  },
  subtitle: {
    textAlign: 'center',
    color: '#cbd5e1',
    marginBottom: 28,
  },
  segmented: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#38bdf8',
  },
  segmentText: {
    color: '#cbd5e1',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#082f49',
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    marginBottom: 8,
    color: '#e2e8f0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#111827',
    color: '#f8fafc',
  },
  button: {
    backgroundColor: '#38bdf8',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#082f49',
    fontSize: 16,
    fontWeight: '800',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: '#7dd3fc',
  },
});

export default LoginScreen;
