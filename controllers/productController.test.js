import * as controllers from './productController'
import productModel from "../models/productModel"
import * as fs from 'fs'

jest.mock('dotenv')
jest.mock('braintree')
jest.mock('mongoose')
jest.mock('fs')
// jest.mock('../../models/productModel', () => (function () {
//   this.findOne = jest.fn(() => this);
//   this.select = jest.fn(() => this);
//   this.populate = jest.fn(() => this);
// }))
jest.mock("../models/productModel", () => {
  const def = jest.fn();
  def.find = jest.fn(() => def);
  def.findById = jest.fn(() => def);
  def.findByIdAndDelete = jest.fn(() => def);
  def.findOne = jest.fn(() => def);
  def.select = jest.fn(() => def);
  def.limit = jest.fn(() => def);
  def.populate = jest.fn(() => def);
  def.sort = jest.fn(() => def);
  def.then = jest.fn();

  return { 
    __esModule: true,
    default: def,
  };
})


const res = {
  status: jest.fn(() => res),
  send: jest.fn(),
  set: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks();
})

describe('Given getSingleProductController', () => {

  it('When receiving a request for a product', async () => {
    const req = {
      params: {
        slug: 'slug'
      }
    }
    const product = { _id: 'id' };
    productModel.populate.mockResolvedValueOnce(product);

    await controllers.getSingleProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status).not.toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Single Product Fetched",
      product
    });

    expect(productModel.findOne).toHaveBeenCalledWith({slug: 'slug'})
    expect(productModel.select).toHaveBeenCalledWith('-photo')
    expect(productModel.populate).toHaveBeenCalledWith('category')
  })

  it('When an error is thrown while getting a product', async () => {
    const req = {
      params: {
        slug: 'slug'
      }
    }

    const err = { message: 'populate error' }
    productModel.populate.mockRejectedValueOnce(err);

    await controllers.getSingleProductController(req, res);


    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Eror while getitng single product",
      error: err,
    });
    
  })

})

describe('Given createProductController', () => {
  
  function createDefaultRequest() {
    const details = {
      name: 'product name',
      description: 'product description',
      price: 'product price',
      category: 'product category',
      quantity: 'product quantity',
      shipping: 'product shipping',
    }
    const photo = {
      path: 'photo path',
      size: 300,
      type: 'photo type',
    }

    return {
      fields: details,
      files: { photo },
    };
  }

  it('When sent a request to create a product', async () => {
    const req = createDefaultRequest()
    
    const document = {
      ...req.fields,
      photo: req.files.photo,
      save: jest.fn(),
    }

    productModel.mockReturnValueOnce(document);
    fs.readFileSync.mockReturnValueOnce('photo data')

    await controllers.createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product Created Successfully",
      products: document,
    });

  })

  it('When sent as photo with size > 1 MB', async () => {

    const req = createDefaultRequest();
    req.files.photo.size = 1000001;

    await controllers.createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ 
      error: "photo is Required and should be less then 1mb" 
    });
    expect(productModel).not.toHaveBeenCalled();

  })

  it('When the document fails to save', async () => {

    const req = createDefaultRequest();
    
    const document = {
      ...req.fields,
      photo: req.files.photo,
      save: jest.fn().mockRejectedValueOnce({message: 'error thrown by save()'}),
    }
    productModel.mockReturnValueOnce(document);
    fs.readFileSync.mockReturnValueOnce('photo data')

    await controllers.createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ 
      error: { message: "error thrown by save()" },
      message: "Error in crearing product",
      success: false,
    });
  })
})

describe('Given getProductController', () => {

  it('When sent a request to get products', async () => {
    productModel.then.mockImplementationOnce(res => {
      res([]);
    });

    await controllers.getProductController({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      counTotal: 0,
      message: "ALlProducts ",
      products: [],
    });

  })
  
  it('When sent a request, but an error occurs when retriving products', async () => {
    productModel.then.mockImplementationOnce((_, rej) => {
      rej({message: 'error retrieving product'});
    });

    await controllers.getProductController({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Erorr in getting products",
      error: 'error retrieving product',
    });

  })
})

describe('Given productPhotoController', () => {
  const req = {
    params: {
      pid: 'product id'
    }
  };

  it('When sent a request for a photo', async () => {
    const document = {
      photo: {
        data: 'photo data',
        contentType: 'photo content type',
      }
    }
    productModel.then.mockImplementationOnce(res => {
      res(document);
    });

    await controllers.productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.set).toHaveBeenCalledWith("Content-type", document.photo.contentType);
    expect(res.send).toHaveBeenCalledWith(document.photo.data);
  })
  
  it('When sent a request for a photo, but an error occurs when retrieving it', async () => {
    const error = { message: 'error retrieving photo' };
    productModel.then.mockImplementationOnce((_, rej) => {
      rej(error);
    });

    await controllers.productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Erorr while getting photo",
      error: error,
    });

  })
})


describe('Given deleteProductController', () => {
  const req = {
    params: {
      id: 'product id'
    }
  }

  it('When sent a request to delete a product', async () => {
    productModel.then.mockImplementationOnce(res => {
      res();
    });

    await controllers.deleteProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product Deleted successfully",
    });

  })
  
  it('When sent a request, but an error occurs when deleting products', async () => {
    const error = { message: 'error deleting product' }
    productModel.then.mockImplementationOnce((_, rej) => {
      rej(error);
    });

    await controllers.deleteProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while deleting product",
      error,
    });

  })
})

