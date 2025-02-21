import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UpdateProduct from './UpdateProduct';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import '@testing-library/jest-dom';
import toast from 'react-hot-toast';
import { message } from 'antd';

// Mock dependencies
jest.mock('axios');

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock('antd', () => {
  const actAntd = jest.requireActual('antd');
  const mockForSelect = ({
    children,
    onChange,
    value,
    'data-testid': testId,
  }) => (
    <select
      data-testid={testId || 'mock-select'}
      value={value}
      onChange={(e) => {
        // Call onChange with the value directly, not the event
        onChange(e.target.value);
      }}
    >
      {children}
    </select>
  );

  mockForSelect.Option = ({ children, value, 'data-testid': testId }) => (
    <option value={value} data-testid={testId}>
      {children}
    </option>
  );

  return { ...actAntd, Select: mockForSelect };
});

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

describe('UpdateProduct Component', () => {
  const mockProduct = {
    success: true,
    product: {
      _id: '123',
      name: 'Test Product',
      description: 'Test Description',
      price: 100,
      quantity: 5,
      shipping: 1,
      category: { _id: 'cat1', name: 'Category 1' },
    },
  };

  const mockCategories = {
    success: true,
    category: [
      { _id: 'cat1', name: 'Category 1' },
      { _id: 'cat2', name: 'Category 2' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock URL.createObjectURL
    URL.createObjectURL = jest.fn(() => 'mocked-url');
  });

  test('fetches and displays product details', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.get.mockResolvedValueOnce({ data: mockCategories });

    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>
    );

    expect(axios.get).toHaveBeenCalledWith(
      '/api/v1/product/get-product/undefined'
    ); // Default params.slug is undefined
    expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  test('shows error toast when fetching product fails', async () => {
    // Mock the axios.get response to return success: false
    axios.get.mockResolvedValueOnce({
      data: {
        success: false,
        message: 'Product Not Found',
      },
    });

    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Product Not Found');
    });
  });

  test('shows non-API error toast when fetching product fails', async () => {
    // Mock the axios.get response to return success: false
    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Something went wrong in getting product'
      );
    });
  });

  test('shows error toast when fetching categories fails', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.get.mockResolvedValueOnce({
      data: { success: false, message: 'Category Not Found' },
    });

    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Category Not Found');
    });
  });

  test('shows non-API error toast when fetching categories fails', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Something went wrong in getting category'
      );
    });
  });

  test('updates state when form inputs change', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.get.mockResolvedValueOnce({ data: mockCategories });

    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>
    );

    const nameInput = screen.getByPlaceholderText('write a name');
    fireEvent.change(nameInput, { target: { value: 'Updated Product' } });
    expect(nameInput.value).toBe('Updated Product');

    const priceInput = screen.getByPlaceholderText('write a Price');
    fireEvent.change(priceInput, { target: { value: '200' } });
    expect(priceInput.value).toBe('200');
  });

  test('updates product successfully', async () => {
    // Mock API responses
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.get.mockResolvedValueOnce({ data: mockCategories });

    // Updated mock response to match API structure
    axios.put.mockResolvedValueOnce({
      data: {
        success: true,
        product: {
          _id: '123',
          name: 'Updated Product Name',
          price: '200',
        },
        message: 'Product Updated Successfully',
      },
    });

    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>
    );

    // Wait for the initial data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });

    // Simulate form changes
    fireEvent.change(screen.getByPlaceholderText('write a name'), {
      target: { value: 'Updated Product Name' },
    });

    fireEvent.change(screen.getByPlaceholderText('write a Price'), {
      target: { value: '200' },
    });

    // Click update button
    fireEvent.click(screen.getByText('UPDATE PRODUCT'));

    // Verify API call
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        `/api/v1/product/update-product/${mockProduct.product._id}`,
        expect.any(FormData)
      );
    });

    // Wait for and verify success message
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Product Updated Successfully'
      );
    });

    // Optionally verify that the form was reset or UI was updated
    await waitFor(() => {
      expect(
        screen.getByDisplayValue('Updated Product Name')
      ).toBeInTheDocument();
    });
  });

  test('shows error toast if product update fails', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.get.mockResolvedValueOnce({ data: mockCategories });
    axios.put.mockResolvedValueOnce({
      data: {
        success: false,
        message: 'Product Not Updated',
      },
    });

    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('UPDATE PRODUCT'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Product Not Updated');
    });
  });

  test('shows non-API error toast if product update fails', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.get.mockResolvedValueOnce({ data: mockCategories });
    axios.put.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('UPDATE PRODUCT'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Something went wrong in updating product'
      );
    });
  });

  test('deletes product successfully after confirmation', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.get.mockResolvedValueOnce({ data: mockCategories });
    axios.delete.mockResolvedValueOnce({ data: { success: true } });

    window.prompt = jest.fn().mockReturnValue('yes');

    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>
    );

    // Wait for the product details to be loaded
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('DELETE PRODUCT'));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        '/api/v1/product/delete-product/123'
      );
    });

    expect(toast.success).toHaveBeenCalledWith('Product Deleted Successfully');
  });

  test('does not delete product if user cancels confirmation', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.get.mockResolvedValueOnce({ data: mockCategories });

    window.prompt = jest.fn().mockReturnValue(null);

    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('DELETE PRODUCT'));

    expect(axios.delete).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  test('shows error toast if product deletion fails', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.get.mockResolvedValueOnce({ data: mockCategories });
    axios.delete.mockResolvedValueOnce({
      data: { success: false, message: 'Cannot delete product' },
    });

    window.prompt = jest.fn().mockReturnValue('yes');

    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('DELETE PRODUCT'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Cannot delete product');
    });
  });

  test('shows non-API error toast if product deletion fails', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.get.mockResolvedValueOnce({ data: mockCategories });
    axios.delete.mockRejectedValueOnce(new Error('Network Error'));

    window.prompt = jest.fn().mockReturnValue('yes');

    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('DELETE PRODUCT'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Something went wrong in deleting product'
      );
    });
  });

  test('handles file upload correctly', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.get.mockResolvedValueOnce({ data: mockCategories });

    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Upload Photo')).toBeInTheDocument();
    });

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText('Upload Photo');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('test.png')).toBeInTheDocument();
    });

    expect(screen.getByAltText('product_photo')).toHaveAttribute(
      'src',
      'mocked-url'
    );
  });

  test('handles all form input changes', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.get.mockResolvedValueOnce({ data: mockCategories });

    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('write a name')).toBeInTheDocument();
    });

    // Test description change
    const descriptionInput = screen.getByPlaceholderText('write a description');
    fireEvent.change(descriptionInput, {
      target: { value: 'New description' },
    });
    expect(descriptionInput.value).toBe('New description');

    // Test quantity change
    const quantityInput = screen.getByPlaceholderText('write a quantity');
    fireEvent.change(quantityInput, { target: { value: '10' } });
    expect(quantityInput.value).toBe('10');

    // Test category select
    const categorySelect = screen.getAllByTestId('mock-select')[0];
    fireEvent.change(categorySelect, { target: { value: 'cat2' } });
    expect(categorySelect.value).toBe('cat2');

    // Test shipping select
    const shippingSelect = screen.getAllByTestId('mock-select')[1];
    fireEvent.change(shippingSelect, { target: { value: '0' } });
    expect(shippingSelect.value).toBe('0');
  });

  test('updates product with photo successfully', async () => {
    // Mock API responses
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.get.mockResolvedValueOnce({ data: mockCategories });
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Upload Photo')).toBeInTheDocument();
    });

    // Upload photo
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText('Upload Photo');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Update text fields
    fireEvent.change(screen.getByPlaceholderText('write a name'), {
      target: { value: 'Updated Name' },
    });

    fireEvent.change(screen.getByPlaceholderText('write a description'), {
      target: { value: 'Updated Description' },
    });

    fireEvent.change(screen.getByPlaceholderText('write a Price'), {
      target: { value: '200' },
    });

    fireEvent.change(screen.getByPlaceholderText('write a quantity'), {
      target: { value: '15' },
    });

    // Direct state updates for Select components
    const categorySelect = screen.getAllByTestId('mock-select')[0];
    fireEvent.change(categorySelect, { target: { value: 'cat2' } });

    const shippingSelect = screen.getAllByTestId('mock-select')[1];
    fireEvent.change(shippingSelect, { target: { value: '1' } });

    // Submit form
    fireEvent.click(screen.getByText('UPDATE PRODUCT'));

    // Verify the FormData content
    await waitFor(() => {
      const formData = axios.put.mock.calls[0][1];
      expect(formData.get('name')).toBe('Updated Name');
      expect(formData.get('description')).toBe('Updated Description');
      expect(formData.get('price')).toBe('200');
      expect(formData.get('quantity')).toBe('15');
      expect(formData.get('category')).toBe('cat2');
      expect(formData.get('shipping')).toBe('1');
      expect(formData.get('photo')).toBeInstanceOf(File);
    });

    expect(toast.success).toHaveBeenCalledWith('Product Updated Successfully');
  });

  test('handles shipping selection correctly', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.get.mockResolvedValueOnce({ data: mockCategories });

    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('mock-select')[1]).toBeInTheDocument();
    });

    // Get the shipping select component
    const shippingSelect = screen.getAllByTestId('mock-select')[1];

    // Change shipping value and verify the update
    fireEvent.change(shippingSelect, { target: { value: '1' } });

    // Submit form to verify the shipping value is correctly set in FormData
    fireEvent.click(screen.getByText('UPDATE PRODUCT'));

    await waitFor(() => {
      const formData = axios.put.mock.calls[0][1];
      expect(formData.get('shipping')).toBe('1');
    });
  });

  test('displays existing product photo when no new photo is uploaded', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.get.mockResolvedValueOnce({ data: mockCategories });

    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>
    );

    await waitFor(() => {
      const productImage = screen.getByAltText('product_photo');
      expect(productImage).toHaveAttribute(
        'src',
        `/api/v1/product/product-photo/${mockProduct.product._id}`
      );
    });
  });

  test('handles product with shipping disabled correctly', async () => {
    // Mock product with shipping set to false/0
    const mockProductNoShipping = {
      success: true,
      product: {
        _id: '123',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        quantity: 5,
        shipping: 0, // Set shipping to 0/false
        category: { _id: 'cat1', name: 'Category 1' },
      },
    };

    axios.get.mockResolvedValueOnce({ data: mockProductNoShipping });
    axios.get.mockResolvedValueOnce({ data: mockCategories });

    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getAllByTestId('mock-select')[1]).toBeInTheDocument();
    });

    // Verify that shipping is set to "0"
    const shippingSelect = screen.getAllByTestId('mock-select')[1];
    expect(shippingSelect.value).toBe('0');

    // Update shipping and submit to verify the value persists
    fireEvent.change(shippingSelect, { target: { value: '0' } });
    fireEvent.click(screen.getByText('UPDATE PRODUCT'));

    await waitFor(() => {
      const formData = axios.put.mock.calls[0][1];
      expect(formData.get('shipping')).toBe('0');
    });
  });
});
