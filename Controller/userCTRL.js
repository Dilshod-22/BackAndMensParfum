// controllers/userController.js
const User = require("../models/User");

// 1. Barcha foydalanuvchilarni olish
// GET /api/users
async function getAllUser(req, res) {
  try {
    const users = await User.find().sort({ _id: 1 });
    res.status(200).json(users);
  } catch (err) {
    console.error("Error in getAllUser:", err);
    res.status(500).json({ error: "Server xatosi" });
  }
}

// 2. Foydalanuvchi login qilish
// POST /api/users/login
async function loginUser(req, res) {
  const { email, password } = req.body;
  // console.log("mashi");
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email va parol kiritilishi shart" });
  }

  try {
    const user = await User.findOne({ email, password_hash: password }).select(
      "username role email preferred_language profile_image_url address phone_number"
    );
    if (!user) {
      return res.status(401).json({ error: "Email yoki parol noto‘g‘ri" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Error in loginUser:", err);
    res.status(500).json({ error: "Server xatosi" });
  }
}

// 3. Foydalanuvchini qidirish
// POST /api/users/search
async function searchUser(req, res) {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Qidirish uchun username kiritilishi shart" });
  }

  try {
    const regex = new RegExp(username, "i");
    const users = await User.find({ username: regex })
      .select("username email phone_number profile_image_url registration_date preferred_language")
      .sort({ username: 1 });

    res.status(200).json({
      count: users.length,
      users,
    });
  } catch (err) {
    console.error("Error in searchUser:", err);
    res.status(500).json({ error: "Server xatosi" });
  }
}

// 4. Yangi foydalanuvchi yaratish
// POST /api/users
async function createUser(req, res) {
  console.log(req.body);
  
  const { username, email, password_hash, phone_number } = req.body;
  if (!username || !email || !password_hash) {
    return res.status(400).json({ error: "Username, email va parol kiritilishi shart" });
  }

  try {
    const newUser = new User({
      username,
      email,
      password_hash,
      phone_number: phone_number || null,
    });
    const saved = await newUser.save();
    res.status(201).json({
      message: "User muvaffaqiyatli yaratildi",
      user: {
        id: saved._id,
        username: saved.username,
        email: saved.email,
        phone_number: saved.phone_number,
        preferred_language: saved.preferred_language,
      },
    });
  } catch (err) {
    console.error("Error in createUser:", err);
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
      return res.status(400).json({ error: "Email allaqachon mavjud" });
    }
    res.status(500).json({ error: "Server xatosi" });
  }
}

// 5. Foydalanuvchini yangilash
// PUT /api/users/:id
async function updateUser(req, res) {
  // console.log("keldi");
  
  const userId = req.params.id;
  console.log(req.body);
  
  const updates = req.body;

  // if (Object.keys(updates).length === 0) {
  //   return res.status(400).json({ error: "Yangilash uchun ma'lumot kiritilmadi" });
  // }

  // Ruxsat etiladigan maydonlar
  const allowedFields = [
    "username",
    "email",
    "phone_number",
    "profile_image_url",
    "preferred_language",
    "address",
    "birth_date",
    "is_active",
  ];
  const sanitized = {};
  for (const key of Object.keys(updates)) {
    if (allowedFields.includes(key)) {
      sanitized[key] = updates[key];
    }
  }
  if (Object.keys(sanitized).length === 0) {
    return res.status(400).json({ error: "Ruxsat etilmagan maydon yangilanmoqda" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: sanitized },
      { new: true, runValidators: true }
    ).select("username email phone_number profile_image_url preferred_language birth_date is_active address");

    if (!updatedUser) {
      return res.status(404).json({ error: "User topilmadi" });
    }
    res.status(200).json({
      message: "User muvaffaqiyatli yangilandi",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error in updateUser:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Server xatosi" });
  }
}

// 6. Foydalanuvchini o‘chirish
// DELETE /api/users/:id
async function deleteUser(req, res) {
  const { id } = req.params;

  try {
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "User topilmadi" });
    }
    res.status(200).json({ message: "User muvaffaqiyatli o‘chirildi", deletedId: deleted._id });
  } catch (err) {
    console.error("Error in deleteUser:", err);
    res.status(500).json({ error: "Server xatosi" });
  }
}
async function addToWishlist(req, res) {
  console.log(req.params.id);
  
  const userId = req.params.id;
  const {
    id,
    productname,
    productBrand,
    count,
    price,
    main_image,
    category
  } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const newItem = {
      id,
      productname,
      productBrand,
      count,
      price,
      main_image,
      category
    };

    user.shoppingcart.push(newItem);

    await user.save();

    res.status(200).json({ message: 'Item added to cart', shoppingcart: user.shoppingcart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getUserCart(req, res) {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Guruhlash va count jamlash
    const mergedCart = [];

    const map = new Map();

    for (const item of user.shoppingcart) {
      const key = item.id.toString();

      if (map.has(key)) {
        // count ni qo‘shish
        map.get(key).count += item.count;
      } else {
        // nusxa olish (chuqur emas)
        map.set(key, { ...item.toObject() });
      }
    }

    for (const value of map.values()) {
      mergedCart.push(value);
    }

    res.status(200).json({ shoppingcart: mergedCart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function removeItemFromCart(req, res) {
  const { userId, productId } = req.query;
  console.log(req.query);
  

  try {
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    // filter orqali mahsulotni olib tashlaymiz
    const updatedCart = user.shoppingcart.filter(
      (item) => item.id.toString() !== productId
    );

    user.shoppingcart = updatedCart;
    await user.save();

    res.status(200).json({ message: 'Item removed from cart', shoppingcart: user.shoppingcart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}



module.exports = {
  getAllUser,
  loginUser,
  searchUser,
  createUser,
  updateUser,
  deleteUser,
  addToWishlist,
  getUserCart,
  removeItemFromCart
};
