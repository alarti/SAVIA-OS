export type UserData = {
  username: string;
  name: string;
  avatar: string;
  isGuest?: boolean;
  role?: string;
};

const DEFAULT_PASSWORDS: Record<string, string> = {
  root: 'password',
  user: 'L!b%TW@Qktjr1n',
  guest: '',
};

export const DEFAULT_USERS: Record<string, UserData> = {
  root: { username: 'root', name: 'Superusuario (Root)', avatar: 'bg-red-500', role: 'Administrador' },
  user: { username: 'user', name: 'Usuario Principal', avatar: 'bg-blue-500', role: 'Usuario Estándar' },
  guest: { username: 'guest', name: 'Invitado (Restringido)', avatar: 'bg-emerald-500', isGuest: true, role: 'Invitado' },
};

export function getStoredPasswords(): Record<string, string> {
  try {
    const saved = localStorage.getItem('savia_os_passwords');
    if (saved) {
      return { ...DEFAULT_PASSWORDS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error reading passwords from localStorage', e);
  }
  return DEFAULT_PASSWORDS;
}

export function saveUserPassword(username: string, newPass: string): boolean {
  try {
    const current = getStoredPasswords();
    current[username] = newPass;
    localStorage.setItem('savia_os_passwords', JSON.stringify(current));
    return true;
  } catch (e) {
    console.error('Error saving password', e);
    return false;
  }
}

export function verifyUserPassword(username: string, passAttempt: string): boolean {
  const passes = getStoredPasswords();
  if (username === 'guest') {
    return passAttempt === ''; // Guest password is strictly empty string
  }
  const expected = passes[username] ?? 'password';
  return passAttempt === expected;
}
