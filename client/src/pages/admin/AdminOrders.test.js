import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminOrders from '../../pages/admin/AdminOrders';
import { useAuth } from '../../context/auth';
import axios from 'axios';
import toast from 'react-hot-toast';
import moment from 'moment';
import '@testing-library/jest-dom';
import React from 'react';
import { message } from 'antd';

// Mock dependencies
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [
    {
      token: 'mock-token',
      user: {
        name: 'Admin',
        email: 'admin@example.com',
        phone: '123-456-7890',
      },
    },
  ]),
}));

jest.mock('../../components/Layout', () => {
  return function MockLayout({ children }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

jest.mock('../../components/AdminMenu', () => {
  return function MockAdminMenu() {
    return <div data-testid="mock-admin-menu">Mock AdminMenu</div>;
  };
});

jest.mock('moment', () => {
  return (date) => ({
    fromNow: () => 'a few seconds ago',
  });
});

jest.mock('antd', () => {
  const mockSelect = ({
    children,
    onChange,
    defaultValue,
    'data-testid': testId,
  }) => (
    <select
      data-testid={testId}
      onChange={(e) => onChange(e.target.value)}
      value={defaultValue}
    >
      {children}
    </select>
  );

  mockSelect.Option = ({ children, value }) => (
    <option value={value}>{children}</option>
  );

  return { Select: mockSelect };
});

jest.mock('axios');
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

describe('AdminOrders Component', () => {
  const mockOrders = [
    {
      _id: 'order1',
      status: 'Processing',
      buyer: { name: 'John Doe' },
      createAt: new Date().toISOString(),
      payment: { success: true },
      products: [
        {
          _id: 'prod1',
          name: 'Laptop',
          description:
            'A great laptop with amazing features and specifications',
          price: 1000,
        },
      ],
    },
    {
      _id: 'order2',
      status: 'Not Process',
      buyer: { name: 'Jane Smith' },
      createAt: new Date().toISOString(),
      payment: { success: false },
      products: [
        {
          _id: 'prod2',
          name: 'Phone',
          description: 'A smartphone with great camera',
          price: 500,
        },
        {
          _id: 'prod3',
          name: 'Charger',
          description: 'Fast charging adapter',
          price: 50,
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the component with layout and admin menu', () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    render(<AdminOrders />);

    expect(screen.getByTestId('mock-layout')).toBeInTheDocument();
    expect(screen.getByTestId('mock-admin-menu')).toBeInTheDocument();
    expect(screen.getByText('All Orders')).toBeInTheDocument();
  });

  test('does not fetch orders when auth token is missing', async () => {
    useAuth.mockImplementationOnce(() => [{ user: {} }]);
    render(<AdminOrders />);

    expect(axios.get).not.toHaveBeenCalled();
  });

  test('displays error state when API call fails', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    axios.get.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<AdminOrders />);

    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
    });

    consoleLogSpy.mockRestore();
  });

  test('displays error toast when API returns unsuccessful response', async () => {
    // Mock unsuccessful API response
    axios.get.mockResolvedValueOnce({
      data: {
        success: false,
        message: 'Failed to fetch orders',
      },
    });

    // Mock auth context to include token
    useAuth.mockImplementationOnce(() => [
      {
        token: 'mock-token',
        user: {
          name: 'Admin',
          email: 'admin@example.com',
          phone: '123-456-7890',
        },
      },
    ]);

    render(<AdminOrders />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to fetch orders');
    });

    // Verify that orders were not set (component should show empty state)
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  test('displays multiple orders with their products and truncated descriptions', async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(<AdminOrders />);

    // Wait for buyers to be displayed
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // Check product names
    expect(screen.getByText('Laptop')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Charger')).toBeInTheDocument();

    // Check truncated descriptions using substring matching
    const laptopDesc = mockOrders[0].products[0].description.substring(0, 30);
    const phoneDesc = mockOrders[1].products[0].description.substring(0, 30);
    const chargerDesc = mockOrders[1].products[1].description.substring(0, 30);

    expect(screen.getByText(laptopDesc)).toBeInTheDocument();
    expect(screen.getByText(phoneDesc)).toBeInTheDocument();
    expect(screen.getByText(chargerDesc)).toBeInTheDocument();
  });

  test('displays correct payment status for each order', async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(<AdminOrders />);

    await waitFor(() => {
      const successStatuses = screen.getAllByText('Success');
      expect(successStatuses).toHaveLength(1);
    });

    const failedStatuses = screen.getAllByText('Failed');
    expect(failedStatuses).toHaveLength(1);
  });

  test('handles status update successfully', async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const statusDropdowns = screen.getAllByRole('combobox');
    fireEvent.change(statusDropdowns[0], { target: { value: 'Shipped' } });

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/v1/auth/order-status/order1',
        { status: 'Shipped' }
      );
    });

    expect(axios.get).toHaveBeenCalledTimes(2); // Initial load + refresh after update
  });

  test('handles failed status update', async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockResolvedValueOnce({
      data: { success: false, message: 'Error updating status' },
    });

    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const statusDropdowns = screen.getAllByRole('combobox');
    fireEvent.change(statusDropdowns[0], { target: { value: 'Shipped' } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error updating status');
    });
  });

  test('handles non-API related failed status update', async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockRejectedValueOnce(new Error('Network Error'));

    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const statusDropdowns = screen.getAllByRole('combobox');
    fireEvent.change(statusDropdowns[0], { target: { value: 'Shipped' } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Something went wrong in updating status'
      );
    });
  });

  test('displays correct product quantities', async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(<AdminOrders />);

    await waitFor(() => {
      const quantities = screen.getAllByRole('cell');
      expect(quantities[5]).toHaveTextContent('1'); // First order has 1 product
    });

    await waitFor(() => {
      const quantities = screen.getAllByRole('cell');
      expect(quantities[11]).toHaveTextContent('2'); // Second order has 2 products
    });
  });

  test('displays formatted timestamps', async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(<AdminOrders />);

    await waitFor(() => {
      const timestamps = screen.getAllByText('a few seconds ago');
      expect(timestamps).toHaveLength(2); // One for each order
    });
  });
});
