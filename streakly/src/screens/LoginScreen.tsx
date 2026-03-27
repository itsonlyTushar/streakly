import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  useColorScheme,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { LogIn } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { auth } from '../lib/firebase';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider } from '@react-native-firebase/auth';

export function LoginScreen() {
  const colorScheme = useColorScheme();
  const currentColors = colorScheme === 'dark' ? colors.dark : colors.light;

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '182440499371-rnlgg5k4t607eui2mgr054jctt6jerfp.apps.googleusercontent.com',
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      console.log('Google Login Pressed');
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      const idToken = userInfo.data?.idToken;
      if (!idToken) {
        throw new Error('No ID token found');
      }

      const googleCredential = GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);
      console.log('Successfully signed in with Google');
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in is in progress already');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Play services not available or outdated');
      } else {
        console.error('Google Sign-In Error:', error);
        Alert.alert('Error', 'Something went wrong during Google Sign-In');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <Text style={[styles.logo, { color: currentColors.primary }]}>
            Streakly
          </Text>
          <Text style={[styles.subheadline, { color: currentColors.mutedForeground }]}>
            Minimalist goal tracking + daily notes.
          </Text>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: currentColors.primary }]}
            onPress={handleGoogleLogin}
            activeOpacity={0.8}
          >
            <LogIn color={currentColors.primaryForeground} size={20} style={styles.buttonIcon} />
            <Text style={[styles.buttonText, { color: currentColors.primaryForeground }]}>
              Get Started
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: currentColors.mutedForeground }]}>
          PRIVACY   TERMS   FAQ
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    fontSize: 60,
    fontFamily: 'GravitasOne-Regular',
    letterSpacing: -2,
    marginBottom: 10,
  },
  subheadline: {
    fontSize: 18,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  actionSection: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    letterSpacing: 4,
    fontWeight: '800',
    opacity: 0.5,
  },
});
