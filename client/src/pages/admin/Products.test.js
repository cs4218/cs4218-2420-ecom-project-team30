import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Products from './Products';
import '@testing-library/jest-dom/extend-expect';

// Mock axios
jest.mock('axios');

// Mock toast
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
}));

// Mock Layout component
jest.mock('../../components/Layout', () => {
  return function MockLayout({ children }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

// Mock AdminMenu component
jest.mock('../../components/AdminMenu', () => {
  return function MockAdminMenu() {
    return <div data-testid="mock-admin-menu">Mock AdminMenu</div>;
  };
});

describe('Products Component', () => {
  const mockProducts = [
    {
      _id: '1',
      name: 'Product 1',
      description: 'Description 1',
      slug: 'product-1',
    },
    {
      _id: '2',
      name: 'Product 2',
      description: 'Description 2',
      slug: 'product-2',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the Products component correctly', async () => {
    axios.get.mockResolvedValue({
      data: { success: true, products: mockProducts },
    });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    expect(screen.getByTestId('mock-layout')).toBeInTheDocument();
    expect(screen.getByTestId('mock-admin-menu')).toBeInTheDocument();
    expect(screen.getByText('All Products List')).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getAllByRole('link', { class: 'product-link' })
      ).toHaveLength(mockProducts.length);
    });
  });

  test('calls the API to fetch products on mount', async () => {
    axios.get.mockResolvedValue({
      data: { success: true, products: mockProducts },
    });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product');
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
  });

  test('displays the correct number of product cards when API returns data', async () => {
    axios.get.mockResolvedValue({
      data: { success: true, products: mockProducts },
    });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() => {
      const productCards = screen.getAllByRole('link', {
        class: 'product-link',
      });
      expect(productCards).toHaveLength(mockProducts.length);
    });
  });

  test('handles API errors gracefully and displays an error toast', async () => {
    axios.get.mockResolvedValue({
      data: {
        success: false,
        message: 'Something went wrong in getting products',
      },
    });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Something went wrong in getting products'
      );
    });
  });

  test('handles non-API errors gracefully and displays an error toast', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'));

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Something went wrong in getting products'
      );
    });
  });

  test('each product card has the correct name, description, and image', async () => {
    axios.get.mockResolvedValue({
      data: { success: true, products: mockProducts },
    });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() => {
      mockProducts.forEach((product) => {
        expect(screen.getByText(product.name)).toBeInTheDocument();
        expect(screen.getByText(product.description)).toBeInTheDocument();
        const image = screen.getByAltText(product.name);
        expect(image).toHaveAttribute(
          'src',
          `/api/v1/product/product-photo/${product._id}`
        );
      });
    });
  });

  test('product links navigate to the correct URLs', async () => {
    axios.get.mockResolvedValue({
      data: { success: true, products: mockProducts },
    });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() => {
      mockProducts.forEach((product) => {
        const link = screen.getByText(product.name).closest('a');
        expect(link).toHaveAttribute(
          'href',
          `/dashboard/admin/product/${product.slug}`
        );
      });
    });
  });
});
