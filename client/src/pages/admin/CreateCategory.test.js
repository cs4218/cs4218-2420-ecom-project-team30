import React from 'react';
import {
  within,
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import axios from 'axios';
import CreateCategory from './CreateCategory';
import { BrowserRouter } from 'react-router-dom';
import toast from 'react-hot-toast';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('axios');

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock('antd', () => {
  const actAntd = jest.requireActual('antd');
  const mockForSelect = ({ children, onChange, 'data-testid': testId }) => (
    <select data-testid={testId} onChange={(e) => onChange(e.target.value)}>
      {children}
    </select>
  );

  mockForSelect.Option = ({ children, value, 'data-testid': testId }) => (
    <option value={value} data-testid={testId}>
      {children}
    </option>
  );

  // Add Modal mock
  const Modal = ({ children, visible, onCancel }) => {
    return visible ? (
      <div role="dialog">
        <button onClick={onCancel} aria-label="Close modal">
          X
        </button>
        {children}
      </div>
    ) : null;
  };

  return { ...actAntd, Select: mockForSelect, Modal };
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

describe('CreateCategory Component', () => {
  const mockCategories = [
    { _id: '1', name: 'Electronics' },
    { _id: '2', name: 'Clothing' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders component properly', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(
      <BrowserRouter>
        <CreateCategory />
      </BrowserRouter>
    );

    // Ensure header exists
    expect(screen.getByText('Manage Category')).toBeInTheDocument();

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });
    expect(screen.getByText('Clothing')).toBeInTheDocument();
  });

  test('fetches and displays categories on mount', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(
      <BrowserRouter>
        <CreateCategory />
      </BrowserRouter>
    );

    // Wait for API call to be made
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
    expect(screen.getByText('Clothing')).toBeInTheDocument();
  });

  test('shows error toast when fetching categories fails', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: false, message: 'Error fetching categories' },
    });

    render(
      <BrowserRouter>
        <CreateCategory />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error fetching categories');
    });
  });

  test('shows non-API error toast when fetching categories fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <BrowserRouter>
        <CreateCategory />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Something went wrong in getting category'
      );
    });
  });

  test('handles category creation successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(
      <BrowserRouter>
        <CreateCategory />
      </BrowserRouter>
    );

    // Simulate input change
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Books' },
    });

    // Click submit button
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/v1/category/create-category',
        { name: 'Books' }
      );
    });

    expect(toast.success).toHaveBeenCalledWith('Books is created');
  });

  test('handles category creation failure', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: 'Error creating category' },
    });

    render(
      <BrowserRouter>
        <CreateCategory />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Books' },
    });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error creating category');
    });
  });

  test('handles non-API category creation failure', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });
    axios.post.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <BrowserRouter>
        <CreateCategory />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Books' },
    });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Something went wrong in input form'
      );
    });
  });

  test('handles category update successfully', async () => {
    // First API call for initial categories load
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    // Second API call after update
    axios.put.mockResolvedValueOnce({
      data: { success: true },
    });

    render(
      <BrowserRouter>
        <CreateCategory />
      </BrowserRouter>
    );

    // Wait for categories to load and table to be populated
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    // Find and click the Edit button within the row containing 'Electronics'
    const tableRows = screen.getAllByRole('row');
    const electronicsRow = tableRows.find((row) =>
      row.textContent.includes('Electronics')
    );
    const editButton = within(electronicsRow).getByText('Edit');
    fireEvent.click(editButton);

    // Get all inputs and find the one with the value 'Electronics'
    const inputs = screen.getAllByRole('textbox');
    const modalInput = inputs.find((input) => input.value === 'Electronics');

    // Ensure we found the modal input
    expect(modalInput).toBeInTheDocument();

    // Change category name in modal
    fireEvent.change(modalInput, {
      target: { value: 'Updated Electronics' },
    });

    // Find and click the Submit button within the modal
    const submitButtons = screen.getAllByText('Submit');
    // Get the last Submit button (which should be in the modal)
    const modalSubmitButton = submitButtons[submitButtons.length - 1];
    fireEvent.click(modalSubmitButton);

    // Verify API call
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/v1/category/update-category/1',
        { name: 'Updated Electronics' }
      );
    });

    // Verify success message
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Updated Electronics is updated'
      );
    });
  });

  test('handles category update failure', async () => {
    // Mock initial categories load
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    // Mock the update failure
    axios.put.mockResolvedValueOnce({
      data: { success: false, message: 'Error updating category' },
    });

    render(
      <BrowserRouter>
        <CreateCategory />
      </BrowserRouter>
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    // Find and click the Edit button for Electronics
    const tableRows = screen.getAllByRole('row');
    const electronicsRow = tableRows.find((row) =>
      row.textContent.includes('Electronics')
    );
    const editButton = within(electronicsRow).getByText('Edit');
    fireEvent.click(editButton);

    // Get the modal input (the one with 'Electronics' value)
    const inputs = screen.getAllByRole('textbox');
    const modalInput = inputs.find((input) => input.value === 'Electronics');
    expect(modalInput).toBeInTheDocument();

    // Change the input value
    fireEvent.change(modalInput, {
      target: { value: 'Updated Electronics' },
    });

    // Find and click the Submit button in the modal
    const submitButtons = screen.getAllByText('Submit');
    const modalSubmitButton = submitButtons[submitButtons.length - 1];
    fireEvent.click(modalSubmitButton);

    // Verify error message
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error updating category');
    });
  });

  test('handles non-APi related category update failure', async () => {
    // Mock initial categories load
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    // Mock the update failure
    axios.put.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <BrowserRouter>
        <CreateCategory />
      </BrowserRouter>
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    // Find and click the Edit button for Electronics
    const tableRows = screen.getAllByRole('row');
    const electronicsRow = tableRows.find((row) =>
      row.textContent.includes('Electronics')
    );
    const editButton = within(electronicsRow).getByText('Edit');
    fireEvent.click(editButton);

    // Get the modal input (the one with 'Electronics' value)
    const inputs = screen.getAllByRole('textbox');
    const modalInput = inputs.find((input) => input.value === 'Electronics');
    expect(modalInput).toBeInTheDocument();

    // Change the input value
    fireEvent.change(modalInput, {
      target: { value: 'Updated Electronics' },
    });

    // Find and click the Submit button in the modal
    const submitButtons = screen.getAllByText('Submit');
    const modalSubmitButton = submitButtons[submitButtons.length - 1];
    fireEvent.click(modalSubmitButton);

    // Verify error message
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Something went wrong in updating category'
      );
    });
  });

  test('handles category deletion successfully', async () => {
    // Mock initial categories load
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    // Mock deletion success
    axios.delete.mockResolvedValueOnce({
      data: { success: true },
    });

    render(
      <BrowserRouter>
        <CreateCategory />
      </BrowserRouter>
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    // Find and click Delete button for Electronics
    const tableRows = screen.getAllByRole('row');
    const electronicsRow = tableRows.find((row) =>
      row.textContent.includes('Electronics')
    );
    const deleteButton = within(electronicsRow).getByText('Delete');
    fireEvent.click(deleteButton);

    // Verify API call
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        '/api/v1/category/delete-category/1'
      );
    });

    // Verify success message
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('category is deleted');
    });
  });

  test('handles category deletion failure', async () => {
    // Mock initial categories load
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    // Mock the delete failure
    axios.delete.mockResolvedValueOnce({
      data: { success: false, message: 'Error deleting category' },
    });

    render(
      <BrowserRouter>
        <CreateCategory />
      </BrowserRouter>
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    // Find and click the Delete button for Electronics
    const tableRows = screen.getAllByRole('row');
    const electronicsRow = tableRows.find((row) =>
      row.textContent.includes('Electronics')
    );
    const deleteButton = within(electronicsRow).getByText('Delete');
    fireEvent.click(deleteButton);

    // Verify error message
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error deleting category');
    });

    // Verify the delete API was called with the correct ID
    expect(axios.delete).toHaveBeenCalledWith(
      '/api/v1/category/delete-category/1'
    );
  });

  test('handles non-API related category deletion failure', async () => {
    // Mock initial categories load
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    // Mock the delete failure
    axios.delete.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <BrowserRouter>
        <CreateCategory />
      </BrowserRouter>
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    // Find and click the Delete button for Electronics
    const tableRows = screen.getAllByRole('row');
    const electronicsRow = tableRows.find((row) =>
      row.textContent.includes('Electronics')
    );
    const deleteButton = within(electronicsRow).getByText('Delete');
    fireEvent.click(deleteButton);

    // Verify error message
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Something went wrong in deleting category'
      );
    });

    // Verify the delete API was called with the correct ID
    expect(axios.delete).toHaveBeenCalledWith(
      '/api/v1/category/delete-category/1'
    );
  });

  test('closes modal when clicking the modal close button (X)', async () => {
    // Mock initial categories load
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(
      <BrowserRouter>
        <CreateCategory />
      </BrowserRouter>
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    // Click Edit button to open modal
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Verify modal is open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Find and click the close button
    const closeButton = screen.getByRole('button', { name: /close modal/i });
    fireEvent.click(closeButton);

    // Verify modal is closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
