import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import AdminDashboard from './AdminDashboard';

// Mock required hooks with the correct admin details
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [
    {
      user: {
        name: 'Admin',
        email: 'admin@example.com',
        phone: '123-456-7890',
      },
    },
  ]),
}));

// Mock the Layout component
jest.mock('../../components/Layout', () => {
  return function MockLayout({ children }) {
    return (
      <div data-testid="mock-layout">
        {children} {/* Render the children passed to Layout */}
      </div>
    );
  };
});

// Mock the AdminMenu component
jest.mock('../../components/AdminMenu', () => {
  return function MockAdminMenu() {
    return <div data-testid="mock-admin-menu">Mock AdminMenu</div>;
  };
});

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test case with correct admin details
  test('renders AdminDashboard with admin details', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Admin Name : Admin/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Admin Email : admin@example.com/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Admin Contact : 123-456-7890/i)
    ).toBeInTheDocument();
  });

  // Test case with empty admin details
  test('renders empty admin data as blank space', () => {
    // Dynamically modify the useAuth mock for this test
    const useAuth = require('../../context/auth').useAuth;
    useAuth.mockImplementation(() => [
      {
        user: {
          name: '',
          email: '',
          phone: '',
        },
      },
    ]);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    // Check if empty values are rendered as blank space
    expect(screen.getByText(/Admin Name/i).textContent).toBe(' Admin Name : ');
    expect(screen.getByText(/Admin Email/i).textContent).toBe(
      ' Admin Email : '
    );
    expect(screen.getByText(/Admin Contact/i).textContent).toBe(
      ' Admin Contact : '
    );
  });

  // Test case with undefined fields
  test('renders undefined fields as blank space', () => {
    // Dynamically modify the useAuth mock for this test
    const useAuth = require('../../context/auth').useAuth;
    useAuth.mockImplementation(() => [
      {
        user: {
          name: undefined,
          email: undefined,
          phone: undefined,
        },
      },
    ]);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    // Check if undefined values are rendered as blank space
    expect(screen.getByText(/Admin Name/i).textContent).toBe(' Admin Name : ');
    expect(screen.getByText(/Admin Email/i).textContent).toBe(
      ' Admin Email : '
    );
    expect(screen.getByText(/Admin Contact/i).textContent).toBe(
      ' Admin Contact : '
    );
  });

  // Test case with no authentication data (logged-out state)
  test('renders nothing when user is not authenticated', () => {
    // Dynamically modify the useAuth mock for this test
    const useAuth = require('../../context/auth').useAuth;
    useAuth.mockImplementation(() => [
      {
        user: null, // Simulate logged-out state
      },
    ]);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    // Check if no admin details are rendered
    expect(screen.getByText(/Admin Name/i).textContent).toBe(' Admin Name : ');
    expect(screen.getByText(/Admin Email/i).textContent).toBe(
      ' Admin Email : '
    );
    expect(screen.getByText(/Admin Contact/i).textContent).toBe(
      ' Admin Contact : '
    );
  });

  // Test case to check if Layout is rendered correctly
  test('renders Layout component correctly', () => {
    // Dynamically modify the useAuth mock for this test
    const useAuth = require('../../context/auth').useAuth;
    useAuth.mockImplementation(() => [
      {
        user: {
          name: 'Admin',
          email: 'admin@example.com',
          phone: '123-456-7890',
        },
      },
    ]);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    // Check if the Layout component is rendered
    const layoutElement = screen.getByTestId('mock-layout');
    expect(layoutElement).toBeInTheDocument();

    // Check if the AdminMenu component is rendered inside the Layout
    const adminMenuElement = screen.getByTestId('mock-admin-menu');
    expect(adminMenuElement).toBeInTheDocument();

    // Check if the admin details are rendered inside the Layout
    expect(screen.getByText(/Admin Name : Admin/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Admin Email : admin@example.com/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Admin Contact : 123-456-7890/i)
    ).toBeInTheDocument();
  });
});
