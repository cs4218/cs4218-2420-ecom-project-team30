import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import Users from './Users';

// Mock Layout component
jest.mock('../../components/Layout', () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="mock-layout">
        <h1 data-testid="mock-layout-title">{title}</h1>
        {children}
      </div>
    );
  };
});

// Mock AdminMenu component
jest.mock('../../components/AdminMenu', () => {
  return function MockAdminMenu() {
    return <div data-testid="mock-admin-menu">Mock AdminMenu</div>;
  };
});

describe('Users Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the Users component correctly', () => {
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    expect(screen.getByTestId('mock-layout')).toBeInTheDocument();
    expect(screen.getByTestId('mock-admin-menu')).toBeInTheDocument();
    expect(screen.getByText('All Users')).toBeInTheDocument();
  });

  test('displays the Layout component with the correct title', () => {
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    expect(screen.getByTestId('mock-layout-title').textContent).toBe(
      'Dashboard - All Users'
    );
  });

  test('displays the AdminMenu component', () => {
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    expect(screen.getByTestId('mock-admin-menu')).toBeInTheDocument();
  });

  test('displays the "All Users" heading', () => {
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    expect(screen.getByText('All Users')).toBeInTheDocument();
  });

  test('ensures correct structure of the page', () => {
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    const layout = screen.getByTestId('mock-layout');
    const adminMenu = screen.getByTestId('mock-admin-menu');
    const heading = screen.getByText('All Users');

    expect(layout).toContainElement(adminMenu);
    expect(layout).toContainElement(heading);
  });
});
