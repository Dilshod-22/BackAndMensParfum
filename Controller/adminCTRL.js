const asyncHandler = require("express-async-handler");
const pool = require("../config/dbConnection");


const getBaseInfo = asyncHandler(async (req, res) => {
    try {
        let newQuery = `SELECT 'Users' AS table_name, COUNT(*) AS item_count FROM usersList WHERE role='users'                 
                    UNION
                    SELECT 'Customers' AS table_name, COUNT(*) AS item_count FROM usersList WHERE role='customer'
                    UNION
                    SELECT 'Products', COUNT(*) FROM productsList
                    UNION
                    SELECT 'Orders', COUNT(*) FROM orders;
`;
        info = await pool.query(newQuery);
        res.send(info.rows).end();
    } catch (err) {
        console.log("error");

        res.end();
    }
});

module.exports = {
    getBaseInfo,
};
