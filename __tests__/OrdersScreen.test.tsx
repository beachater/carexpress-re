// __tests__/OrdersScreen.test.tsx
import { render } from '@testing-library/react-native';
import React from 'react';
import OrdersScreen from '../app/patient/orders';

// ✅ Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../context/CartContext', () => ({
  useCart: () => ({
    cart: [
      {
        name: 'Paracetamol',
        price: 20,
        quantity: 2,
        pharmacy_name: 'HealthPlus',
        pharmacy_id: 1,
      },
    ],
    updateQuantity: jest.fn(),
    removeItem: jest.fn(),
  }),
}));

jest.mock('../hooks/useCurrentLocation', () => ({
  __esModule: true,
  default: () => ({
    location: { latitude: 1.0, longitude: 1.0 },
    error: null,
  }),
}));

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: { latitude: 1, longitude: 1 } })),
        })),
      })),
    })),
    auth: {
      getUser: jest.fn(() => ({ data: { user: { id: 'test-id' } } })),
    },
  },
}));

describe('OrdersScreen', () => {
  it('renders order item and price correctly', () => {
    const { getByText, getAllByText } = render(<OrdersScreen />);

    expect(getByText('Order details')).toBeTruthy();
    expect(getByText('Paracetamol')).toBeTruthy();
    expect(getByText('HealthPlus')).toBeTruthy();

    const prices = getAllByText('₱20');
    expect(prices.length).toBeGreaterThan(0);
  });

  it('renders checkout button if cart is not empty', () => {
    const { getByText } = render(<OrdersScreen />);
    expect(getByText('Check Out')).toBeTruthy();
  });
});
