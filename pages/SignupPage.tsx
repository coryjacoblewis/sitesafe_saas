import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import LogoIcon from '../components/icons/LogoIcon';
import { User } from '../types';

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<User['role']>('foreman');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      await signup(email, role);
      navigate(role === 'owner' ? '/dashboard' : '/foreman/dashboard');
    } catch (err) {
      setError('Failed to create an account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-auto text-brand-blue flex justify-center items-center space-x-2">
            <LogoIcon className="h-10 w-10" />
            <span className="text-3xl font-bold">SiteSafe</span>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
          Create a new account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    I am a...
                </label>
                <fieldset className="mt-2">
                    <legend className="sr-only">User role</legend>
                    <div className="grid grid-cols-2 gap-3">
                    <div>
                        <input
                        type="radio"
                        id="role-foreman"
                        name="role"
                        value="foreman"
                        checked={role === 'foreman'}
                        onChange={() => setRole('foreman')}
                        className="sr-only"
                        />
                        <label
                        htmlFor="role-foreman"
                        className={`flex items-center justify-center p-3 text-sm font-medium rounded-md cursor-pointer border ${
                            role === 'foreman' ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-700 border-gray-300'
                        }`}
                        >
                        Foreman
                        </label>
                    </div>
                    <div>
                        <input
                        type="radio"
                        id="role-owner"
                        name="role"
                        value="owner"
                        checked={role === 'owner'}
                        onChange={() => setRole('owner')}
                        className="sr-only"
                        />
                        <label
                        htmlFor="role-owner"
                        className={`flex items-center justify-center p-3 text-sm font-medium rounded-md cursor-pointer border ${
                            role === 'owner' ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-700 border-gray-300'
                        }`}
                        >
                        Owner / Manager
                        </label>
                    </div>
                    </div>
                </fieldset>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white text-gray-900"
                  style={{ colorScheme: 'light' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white text-gray-900"
                  style={{ colorScheme: 'light' }}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white text-gray-900"
                  style={{ colorScheme: 'light' }}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-gray-400"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
          
           <div className="mt-6 text-center">
              <Link to="/" className="font-medium text-brand-blue hover:text-brand-blue-dark">
                Back to main page
              </Link>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
