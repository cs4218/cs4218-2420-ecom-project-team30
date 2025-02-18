import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import ProductDetails from './ProductDetails';

// mock modules
jest.mock('axios');

// mocks for contexts/hooks in Header
jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock('../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
}));
    
jest.mock('../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));  
    
jest.mock('../hooks/useCategory', () => jest.fn(() => []));

const PRODUCT = {
  _id: 'productid',
  category: {
    _id: 'catid',
    name: 'category name'
  },
  name: 'product name',
  description: 'product desc',
  price: 1.00,
};

const RELATED_PRODUCT_1 = {
  _id: 'relatedproductid',
  category: {
    _id: 'catid',
    name: 'category name'
  },
  name: 'related product name',
  description: 'product desc',
  price: 2.00,
};

const RELATED_PRODUCT_2 = {
  _id: 'relatedproductid2',
  category: {
    _id: 'catid',
    name: 'category name'
  },
  name: 'related product name 2',
  description: 'product desc 2',
  price: 3.00,
};

describe('ProductDetails', () => {

  beforeEach(() => {
    jest.clearAllMocks();

    axios.get.mockResolvedValueOnce({
      data: {
        product: PRODUCT
      }
    });

    axios.get.mockResolvedValueOnce({ 
      data: {
        products: [ RELATED_PRODUCT_1, RELATED_PRODUCT_2 ]
      }
    });

    // console.log(axios.get.mock.calls)
  })


  it('renders page', async () => {

    const {getByText, getByRole} = render(
      <MemoryRouter initialEntries={['/product/slooge']}>
        <Routes>
          <Route path="/product/:slug" element={<ProductDetails />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => expect(getByText('Name : product name')).toBeInTheDocument())

    expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product/slooge');
    expect(axios.get).toHaveBeenCalledWith('/api/v1/product/related-product/productid/catid');

  })

  it('Redirects to the related product page', async () => {

    // mock axios for navigated page

    axios.get.mockResolvedValueOnce({ 
      data: {
        product: RELATED_PRODUCT_2,
      }
    });

    axios.get.mockResolvedValueOnce({ 
      data: {
        products: []
      }
    });

    const {getByText, getAllByText, container} = render(
      <MemoryRouter initialEntries={['/product/slooge']}>
        <Routes>
          <Route path="/product/:slug" element={<ProductDetails />} />
        </Routes>
      </MemoryRouter>
    )

    // console.log(JSON.stringify(await Promise.all(axios.get.mock.results.map(r => r.value))));
    
    
    await waitFor(() => expect(getByText('Name : product name')).toBeInTheDocument());
    
    const related = getAllByText("More Details");
    expect(related.length).toBe(2);
    
    fireEvent.click(related[1]);
    await waitFor(() => expect(getByText('Name : related product name 2')).toBeInTheDocument())

  })


})

