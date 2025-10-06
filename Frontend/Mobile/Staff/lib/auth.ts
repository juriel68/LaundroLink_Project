import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the shape of the user object
interface UserSession {
  UserID: string;
  UserEmail: string;
  UserRole: string;
  ShopID: string;
  ShopName: string;
}

// This will hold the user data in memory while the app is running
let currentUser: UserSession | null = null;

/**
 * Saves the user data to memory and persistent storage after login.
 */
export const login = async (user: UserSession): Promise<void> => {
  currentUser = user;
  try {
    await AsyncStorage.setItem('user_session', JSON.stringify(user));
  } catch (e) {
    console.error("Failed to save user session.", e);
  }
};

/**
 * Retrieves the currently logged-in user's data.
 */
export const getCurrentUser = (): UserSession | null => {
  return currentUser;
};

/**
 * Checks storage on app start to see if a user was already logged in.
 */
export const loadUserFromStorage = async (): Promise<UserSession | null> => {
  try {
    const userJson = await AsyncStorage.getItem('user_session');
    if (userJson) {
      currentUser = JSON.parse(userJson);
      return currentUser;
    }
  } catch (e) {
    console.error("Failed to load user session.", e);
  }
  return null;
};

/**
 * Clears the user data from memory and storage on logout.
 */
export const logout = async (): Promise<void> => {
  currentUser = null;
  try {
    await AsyncStorage.removeItem('user_session');
  } catch (e) {
    console.error("Failed to remove user session.", e);
  }
};