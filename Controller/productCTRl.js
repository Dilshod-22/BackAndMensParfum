// controllers/productController.js
const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const User = require('../models/User');
const ImageKit = require('imagekit');
const sharp = require('sharp');

// ImageKit konfiguratsiyasi (o‘zgarmaydi)
const imagekit = new ImageKit({
  publicKey: 'public_rAybsQad4S9MYw+BKkmoRhSqD/I=',
  privateKey: 'private_TSz93gxCDXt8uvllKTuxKwJL7a4=',
  urlEndpoint: 'https://ik.imagekit.io/qk82mhvi8',
});

/**
 * 1. getCategory
 *  Avvalo kategoriya ma'lumotlari siz oldin kodda 
 *  qattiq yozilgan edi. Shunga o‘xshab – JSON beramiz.
 */
async function getCategory(req, res) {
  try {
    const category = [
      { name: 'All' },
      { name: 'Yuz va tana parvarishi' },
      { name: 'soch parvarishi' },
      { name: 'Soqol va qirilish' },
      { name: "Og'iz gigiyenasi" },
      { name: "Qo'l va Oyoq parvarishi" },
      { name: 'Atir va hidlar' },
      { name: 'Salomatlik' },
      { name: 'Boshqalar' },
    ];
    res.json(category);
  } catch (err) {
    console.error('getCategory error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
}

/**
 * 2. searchProduct
 */
async function searchProduct(req, res) {
  const { productName } = req.body;
  if (!productName) {
    return res.status(400).json({ message: 'Mahsulot nomi kerak' });
  }
  try {
    const regex = new RegExp(productName, 'i');
    const products = await Product.find({ productname: regex })
      .select('id productname brand count sku price productimage')
      .sort({ productname: 1 });

    res.status(200).json({
      count: products.length,
      products,
    });
  } catch (err) {
    console.error('searchProduct xatosi:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
}

/**
 * 3. uploadThumbnail (helper)
 */
async function uploadThumbnail(fileBuffer) {
  // Bu funksiya o‘zgarmaydi
  try {
    const resizedBuffer = await sharp(fileBuffer)
      .resize(300, 300)
      .jpeg()
      .toBuffer();
    return new Promise((resolve, reject) => {
      imagekit.upload(
        {
          file: resizedBuffer,
          fileName: `thumbnail_${Date.now()}.jpg`,
          folder: '/products/thumbnails',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.url);
        }
      );
    });
  } catch (err) {
    throw new Error('Resize or upload failed: ' + err.message);
  }
}

/**
 * 4. imageFileUploadAssist
 */
async function imageFileUploadAssist(req, res) {
  try {
    if (req.file && req.file.buffer) {
      const thumbnailURl = await uploadThumbnail(req.file.buffer);
      const result = await imagekit.upload({
        file: req.file.buffer,
        fileName: req.file.originalname,
      });
      return res
        .status(200)
        .json({ BasicUrl: result.url, thumbnailUrl: thumbnailURl });
    } else {
      return res.status(400).json({ error: 'No image file provided' });
    }
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ error: 'Image upload failed' });
  }
}

/**
 * 5. createProduct
 */
async function createProduct(req, res) {
  try {
    const {
      productname,
      brand,
      sku,
      ratingproduct,
      price,
      category,
      main_image,
      thumbnailURl,
    } = req.body;

    const productimage = [
      { status: 'main', imageLink: main_image },
      { status: 'thumbnail', imageLink: thumbnailURl },
    ];

    const newProduct = new Product({
      productname,
      brand,
      sku,
      count: 0,
      ratingproduct,
      price,
      category,
      productimage,
    });

    const saved = await newProduct.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Create failed:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * 6. updateProduct
 */
async function updateProduct(req, res) {
  const idKT = req.params.id;
  console.log(idKT);
  
  try {
    const {
      productname,
      brand,
      count,
      sku,
      ratingproduct,
      price,
      category,
      extrainfo,
      main_image,
      thumbnail,
    } = req.body;

    const productimage = [
      { status: 'main', imageLink: main_image },
      { status: 'thumbnail', imageLink: thumbnail },
    ];

    const updated = await Product.findByIdAndUpdate(
      idKT,
      {
        productname,
        brand,
        count,
        sku,
        ratingproduct,
        price,
        category,
        extrainfo: extrainfo || {},
        productimage,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Product topilmadi' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Update failed:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * 7. deleteProduct
 */
async function deleteProduct(req, res) {
  const productId = req.params.id;
  try {
    const removed = await Product.findByIdAndDelete(productId);
    if (!removed) {
      return res.status(404).json({ error: 'Product topilmadi' });
    }
    res.json({ status: 'success', message: 'Product delete successfully' });
  } catch (err) {
    console.error('Delete failed:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * 8. deleteProductImage
 */
async function deleteProductImage(req, res) {
  try {
    const { userID, imageId } = req.body;
    // Agar bu funksiya “productslist” emas, balki “userslist” bilan bog‘liq bo‘lsa:
    // foydalanuvchini topib, shoppingcart yoki productimage massividan filtrlaymiz.

    // Agar siz productslist ichidagi image’ni o‘chirmoqchi bo‘lsangiz:
    const product = await Product.findById(userID);
    if (!product) {
      return res.status(404).json({ error: 'Product topilmadi' });
    }
    product.productimage = product.productimage.filter(
      (img) => img._id.toString() !== imageId
    );
    await product.save();
    res.json({ status: 'success', message: 'Product image delete successfully' });
  } catch (err) {
    console.error('deleteProductImage xatosi:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * 9. getProducts (filter + pagination + sorting)
 */

async function getProducts(req, res) {
  try {
    const {
      page = 1,
      limit = 50,
      category = '',
      search = '',
      minPrice = '',
      maxPrice = '',
      brand = '',
      sortBy = 'datacreate',
      sortOrder = 'ASC',
    } = req.query;

    // Input validation and parsing
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50)); // Cap at 100
    const skip = (parsedPage - 1) * parsedLimit;

    // Build filter object
    const filter = {};
    
    // Category filter
    if (category && category.toLowerCase() !== 'all') {
      filter.category = { $regex: category.trim(), $options: 'i' };
    }
    
    // Search filter (searches in product name)
    console.log(req.query);
    // console.log(category);
    
    if (search && search.trim() && search.trim() !== '') {
      filter.productname = { $regex: search.trim(), $options: 'i' };
    }
    // Brand filter
    // if (brand && brand.trim()) {
    //   filter.brand = { $regex: brand.trim(), $options: 'i' };
    // }
    
    // Price range filter
    const minPriceNum = parseFloat(minPrice);
    const maxPriceNum = parseFloat(maxPrice);
    
    if (!isNaN(minPriceNum) || !isNaN(maxPriceNum)) {
      filter.price = {};
      if (!isNaN(minPriceNum)) {
        filter.price.$gte = minPriceNum;
      }
      if (!isNaN(maxPriceNum)) {
        filter.price.$lte = maxPriceNum;
      }
    }

    // Sorting configuration
    const VALID_SORT_FIELDS = ['_id', 'productname', 'price', 'datacreate', 'brand'];
    const sortField = VALID_SORT_FIELDS.includes(sortBy) ? sortBy : 'datacreate';
    const sortDir = sortOrder.toUpperCase() === 'DESC' ? -1 : 1;
    const sortObj = { [sortField]: sortDir };

    // Execute parallel queries for performance
    const [totalItems, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(parsedLimit)
        .lean() // Use lean() for better performance if you don't need Mongoose documents
    ]);

    const totalPages = Math.ceil(totalItems / parsedLimit);

    // Enhanced response with more metadata
    res.json({
      success: true,
      meta: {
        totalItems,
        totalPages,
        currentPage: parsedPage,
        itemsPerPage: parsedLimit,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1,
        filters: {
          category: category || null,
          search: search || null,
          brand: brand || null,
          priceRange: {
            min: !isNaN(minPriceNum) ? minPriceNum : null,
            max: !isNaN(maxPriceNum) ? maxPriceNum : null
          }
        },
        sorting: {
          field: sortField,
          order: sortOrder.toUpperCase()
        }
      },
      data: products,
    });
  } catch (err) {
    console.error('getProducts error:', err);
    
    // More specific error handling
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid filter parameters' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching products' 
    });
  }
}
async function getProductsAdmin(req, res) {
  try {

    const products = await Product.find();

    // const totalPages = Math.ceil(totalItems / parsedLimit);

    res.json({
      data: products,
    });
  } catch (err) {
    console.error('getProducts xatosi:', err);
    res.status(500).json({ success: false, message: 'Mahsulotlarni olishda xatolik' });
  }
}


/**
 * 10. takeProduct (bitta productni olish)
 */
async function takeProduct(req, res) {
  
  const { id } = req.params;
  // console.log(id);

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product topilmadi' });
    }
    res.json(product);
  } catch (err) {
    console.error('takeProduct xatosi:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * 11. addToShoppingCart (User model) 
 */
async function addToShoppingCart(req, res) {
  try {
    const { productId, userID } = req.body;

    const product = await Product.findById(productId).select('productname price productimage');
    if (!product) {
      return res.status(404).send('Product not found');
    }

    // userID bo‘yicha User topiladi
    const user = await User.findById(userID);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Yangi item JSON
    const mainImageObj = product.productimage.find((img) => img.status === 'thumbnail') || {};
    const newItem = {
      id: product._id,
      productname: product.productname,
      price: product.price,
      main_image: mainImageObj.imageLink || null,
    };

    user.shoppingcart.push(newItem);
    await user.save();

    res.sendStatus(200);
  } catch (err) {
    console.error('addToShoppingCart xatosi:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
}

module.exports = {
  getCategory,
  searchProduct,
  imageFileUploadAssist,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  getProducts,
  takeProduct,
  addToShoppingCart,
  getProductsAdmin
};
