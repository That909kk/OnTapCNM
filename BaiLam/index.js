const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
require('dotenv').config();
const path = require('path');
const PORT = 3000;


const app = express();
app.use(express.urlencoded({ extended: false }))
app.use(express.static('./views'));
app.set('view engine', 'ejs');
app.set('views', './views');


AWS.config.update({
    region: process.env.REGION,
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
});
const s3 = new AWS.S3();
const bucketName = process.env.S3_BUCKET_NAME;
const tableName = process.env.DYNAMODB_TABLE_NAME;
const dynamodb = new AWS.DynamoDB.DocumentClient();

const storage = multer.memoryStorage({
    destination(req, file, callback) {
        callback(null, '');
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 2000000 },
    fileFilter(req, file, cb) {
        checkFileType(file, cb);
    },
});

function checkFileType(file, cb) {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
        return cb(null, true);
    }
    return cb('Error: Pls upload images /jpeg|jpg|png|gif/ only!');

}
app.get('/', async(req, res) => {
    try {
        const params = { TableName: tableName };
        const data = await dynamodb.scan(params).promise();
        console.log(data);
        res.render('index', { data: data.Items });
    } catch (error) {
        console.log("Error retrivieng data", error);
        return res.status(500).send("Internal Server Error");
    }
});

app.post('/save', upload.single('img'), async(req, res) => {
    try {
        const ISBN = req.body.ISBN;
        const tenbai = req.body.tenbai;
        const tacgia = req.body.tacgia;
        const trang = Number(req.body.trang);
        const namxb = Number(req.body.namxb);
        const file = req.file;
        const S3_params = {
            Bucket: bucketName,
            Key: file.originalname,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
        };
        s3.upload(S3_params, async(err, data) => {
            if (err) {
                console.error(err);
            } else {
                const img = data.Location;
                const paramsDynamoDB = {
                    TableName: tableName,
                    Item: {
                        ISBN: ISBN,
                        tenbai: tenbai,
                        tacgia: tacgia,
                        trang: trang,
                        namxb: namxb,
                        img: img,
                    }
                };
                await dynamodb.put(paramsDynamoDB).promise();
                console.log("Data saved to DynamoDB");
                return res.redirect('/');
            }
        }, );
    } catch (error) {
        console.log("Error uploading image", error);
        return res.status(500).send("Internal Server Error");
    }
});

app.post('/delete', upload.fields([]), async(req, res) => {
    const listCheckboxSelected = Object.keys(req.body);

    if (listCheckboxSelected.length === 0) {
        return res.redirect('/');
    }
    try {
        function onDeleteItem(length) {
            const params = {
                TableName: tableName,
                Key: {
                    ISBN: listCheckboxSelected[length],
                }
            };
            dynamodb.delete(params, (err, data) => {
                if (err) {
                    console.error("Error deleting item", err);
                } else {
                    if (length > 0) {
                        onDeleteItem(length - 1);
                    } else {
                        return res.redirect('/');
                    }
                }
            });
        }
        onDeleteItem(listCheckboxSelected.length - 1);
    } catch (error) {
        console.log("Error deleting item", error);
        return res.status(500).send("Internal Server Error");
    }
});





app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});