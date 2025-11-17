import { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { TeluguPattern } from './TeluguPattern';
import { config } from '../utils/config';
import clearCallLogo from '../assets/cc.png';

interface LoginPageProps {
  onBackToWelcome: () => void;
  onLoginSuccess: (username?: string) => void;
  language: 'en' | 'te';
  onToggleLanguage: () => void;
}

export function LoginPage({
  onBackToWelcome,
  onLoginSuccess,
  language,
  onToggleLanguage
}: LoginPageProps) {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  const translations = {
    en: {
      backToWelcome: "Back to Welcome",
      login: "Login",
      signup: "Sign Up",
      email: "Email",
      password: "Password",
      forgotPassword: "Forgot Password?",
      fullName: "Full Name",
      createPassword: "Create Password",
      confirmPassword: "Confirm Password",
      loginButton: "Login",
      signupButton: "Sign Up",
      welcomeBack: "Welcome Back",
      loginDescription: "Enter your credentials to access your account",
      createAccount: "Create Account",
      signupDescription: "Join Clear Call for inclusive communication",
      language: "తెలుగు"
    },
    te: {
      backToWelcome: "స్వాగతానికి తిరిగి",
      login: "లాగిన్",
      signup: "సైన్ అప్",
      email: "ఇమెయిల్",
      password: "పాస్‌వర్డ్",
      forgotPassword: "పాస్‌వర్డ్ మర్చిపోయారా?",
      fullName: "పూర్తి పేరు",
      createPassword: "పాస్‌వర్డ్ సృష్టించండి",
      confirmPassword: "పాస్‌వర్డ్ నిర్ధారించండి",
      loginButton: "లాగిన్",
      signupButton: "సైన్ అప్",
      welcomeBack: "తిరిగి స్వాగతం",
      loginDescription: "మీ ఖాతాను యాక్సెస్ చేయడానికి మీ వివరాలను నమోదు చేయండి",
      createAccount: "ఖాతా సృష్టించండి",
      signupDescription: "సమగ్ర కమ్యూనికేషన్ కోసం క్లియర్ కాల్‌లో చేరండి",
      language: "English"
    }
  };

  const t = translations[language];

  // Clear all past data on mount for a fresh start
  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
    setLoginData({ email: '', password: '' });
    setSignupData({ fullName: '', email: '', password: '', confirmPassword: '' });
    setError('');
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.user && data.token) {
        localStorage.setItem('clearCallToken', data.token);
        localStorage.setItem('clearCallUser', JSON.stringify(data.user));
        onLoginSuccess(data.user.name || data.user.email.split('@')[0]);
      } else {
        setError('Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupData.fullName,
          email: signupData.email,
          password: signupData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      if (data.user && data.token) {
        localStorage.setItem('clearCallToken', data.token);
        localStorage.setItem('clearCallUser', JSON.stringify(data.user));
        onLoginSuccess(signupData.fullName.split(' ')[0]);
      } else {
        setError('Signup failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 dark:from-blue-900 dark:via-blue-800 dark:to-blue-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Button
          variant="ghost"
          onClick={onBackToWelcome}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToWelcome}
        </Button>

        {/* Language Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleLanguage}
          className="bg-white/80 hover:bg-white/90 dark:bg-gray-800/80 dark:hover:bg-gray-700/90"
        >
          {t.language}
        </Button>
      </div>

      {/* Logo */}
      <div className="flex justify-center mb-8">
        <div className="w-20 h-20 rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
          <img
            src={clearCallLogo}
            alt="Clear Call Logo"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">{t.login}</TabsTrigger>
              <TabsTrigger value="signup">{t.signup}</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{t.welcomeBack}</CardTitle>
                  <CardDescription>{t.loginDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                        {error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="email">{t.email}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="bg-white dark:bg-gray-700"
                        placeholder="your@email.com"
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">{t.password}</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={loginData.password}
                          onChange={(e) => {
                            setLoginData({ ...loginData, password: e.target.value });
                            if (error) setError('');
                          }}
                          className="bg-white dark:bg-gray-700 pr-10"
                          disabled={loading}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t.loginButton}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup">
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{t.createAccount}</CardTitle>
                  <CardDescription>{t.signupDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignupSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                        {error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="fullName">{t.fullName}</Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={signupData.fullName}
                        onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                        className="bg-white dark:bg-gray-700"
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signupEmail">{t.email}</Label>
                      <Input
                        id="signupEmail"
                        type="email"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        className="bg-white dark:bg-gray-700"
                        placeholder="your@email.com"
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="createPassword">{t.createPassword}</Label>
                      <div className="relative">
                        <Input
                          id="createPassword"
                          type={showCreatePassword ? "text" : "password"}
                          value={signupData.password}
                          onChange={(e) => {
                            setSignupData({ ...signupData, password: e.target.value });
                            if (error) setError('');
                          }}
                          className="bg-white dark:bg-gray-700 pr-10"
                          disabled={loading}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCreatePassword(!showCreatePassword)}
                          disabled={loading}
                        >
                          {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={signupData.confirmPassword}
                          onChange={(e) => {
                            setSignupData({ ...signupData, confirmPassword: e.target.value });
                            if (error) setError('');
                          }}
                          className="bg-white dark:bg-gray-700 pr-10"
                          disabled={loading}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={loading}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t.signupButton}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer */}
      <div className="relative">
        <TeluguPattern />
        <div className="bg-gradient-to-r from-blue-600/10 to-teal-600/10 dark:from-blue-400/10 dark:to-teal-400/10 p-4">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            © 2025 Clear Call - Inclusive Communication Platform
          </div>
        </div>
      </div>
    </div>
  );
}
