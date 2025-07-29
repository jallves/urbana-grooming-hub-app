
import React from 'react';
import '@testing-library/jest-dom';

// Mock do módulo Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        update: jest.fn(() => Promise.resolve({ data: null, error: null })),
        delete: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    functions: {
      invoke: jest.fn(() => Promise.resolve({ data: null, error: null })),
    },
  },
}));

// Mock do React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
}));

// Mock do Sonner (toast)
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock do Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => 
      React.createElement('div', props, children),
    span: ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => 
      React.createElement('span', props, children),
    button: ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => 
      React.createElement('button', props, children),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
}));

// Mock do Recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => 
    React.createElement('div', {}, children),
  LineChart: ({ children }: { children?: React.ReactNode }) => 
    React.createElement('div', {}, children),
  Line: () => React.createElement('div'),
  XAxis: () => React.createElement('div'),
  YAxis: () => React.createElement('div'),
  CartesianGrid: () => React.createElement('div'),
  Tooltip: () => React.createElement('div'),
  PieChart: ({ children }: { children?: React.ReactNode }) => 
    React.createElement('div', {}, children),
  Pie: () => React.createElement('div'),
  Cell: () => React.createElement('div'),
}));

// Configurações globais para testes
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock do matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
