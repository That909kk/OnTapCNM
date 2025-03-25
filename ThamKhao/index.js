const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
require("dotenv").config();
const path = require("path");
const PORT = 3000;
/*
  npm install express
  npm install multer
  npm install aws-sdk
  npm install dotenv
  npm install ejs
  ejs bỏ trong views
*/
const app = express();
app.use(express.urlencoded({ extended: true }))
app.use(express.static('./views'));
app.set('view engine', 'ejs');
app.set('views', './views');


process.env.AWS_SDK_JS_SUPRESS_MAINTENANCE_MODE_MASSAGE = "1";

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
    callback(null, "");
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
  return cb("Error: Pls upload images /jpeg|jpg|png|gif/ only!");
}

app.get("/", async (req, res) => {
  try {
    const params = { TableName: tableName };
    const data = await dynamodb.scan(params).promise();

    console.log("data=", data.Items);
    return res.render("index.ejs", { data: data.Items });

  } catch (error) {
    console.error("Error retrieving data from DynamoDB:", error);
    return res.status(500).send("Internal Server Error");
  }
});
app.post("/save", upload.single("image"), (req, res) => {
  try {
    const maSanPham = req.body.maSanPham;
    const tenSanPham = req.body.tenSanPham;
    const soLuong = Number(req.body.soLuong);
    const file = req.file;

    const paramsS3 = {
      Bucket: bucketName,
      Key: file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    s3.upload(paramsS3, async (err, data) => {
      if (err) {
        console.error("Error uploading to S3:", err);
        return res.send("Internal server error!");
      } else {
        const imageURL = data.Location;

        const paramsDynamoDb = {
          TableName: tableName,
          Item: {
            maSanPham: maSanPham,
            tenSanPham: tenSanPham,
            soLuong: Number(soLuong),
            image: imageURL,
          },
        };

        await dynamodb.put(paramsDynamoDb).promise();
        return res.redirect("/");
      }
    });
  } catch (error) {
    console.error("Error saving data to DynamoDB:", error);
    return res.status(500).send("Internal Server Error");
  }
});

app.post("/delete", upload.fields([]), async (req, res) => {
  const listCheckboxSelected = Object.keys(req.body);

  if (listCheckboxSelected.length === 0) {
    return res.redirect("/");
  }
  try {
    function onDeleteItem(length) {
      //const maSanPham = String(listCheckboxSelected[length]); // Chuyển đổi sang kiểu dữ liệu chuỗi

      const paramsDynamoDb = {
        TableName: tableName,
        Key: {
          maSanPham: String(listCheckboxSelected[length]),
        },
      };
      dynamodb.delete(paramsDynamoDb,(err,data)=> {
        if(err)
        {
          console.log("error=",err);
          return res.send("Internal Server Error");
        }
        else
        {
          if(length>0)
          {
            onDeleteItem(length-1);
          }
          else
          {
            return res.redirect("/");
          }
        }
      });     
    }
    onDeleteItem(listCheckboxSelected.length - 1);
  } catch (error) {
    console.error("Error deleting data from DynamoDB:", error);
    return res.status(500).send("Internal Server Error");
  }
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
});


/*const PORT = 3000;
const app = express();
app.use(express.urlencoded({ extended: true }))
app.use(express.static('./views'));

app.set('view engine', 'ejs');
app.set('views', './views');
app.get('/', (req, resp) => {

    return resp.render('index', { courses })
});
const courses = [{
        id: 1,
        name: 'Cơ sở dữ liệu',
        course_type: 'Cơ sở',
        semester: 'HK1-2020-2021',
        department: 'K.CNTT'
    },
    {
        id: 2,
        name: 'Cấu trúc dữ liệu',
        course_type: 'Cơ sở',
        semester: 'HK1-2020-2021',
        department: 'K.CNTT'
    },
    {
        id: 3,
        name: 'Công nghệ phần mềm',
        course_type: 'Cơ sở ngành',
        semester: 'HK1-2020-2021',
        department: 'K.CNTT'
    },
    {
        id: 4,
        name: 'Công nghệ mới',
        course_type: 'Chuyên ngành',
        semester: 'HK1-2020-2021',
        department: 'K.CNTT'
    },
    {
        id: 5,
        name: 'Đồ án môn học',
        course_type: 'Chuyên ngành',
        semester: 'HK1-2020-2021',
        department: 'K.CNTT'
    }
]
app.post('/save', (req, res) => {
    const id = Number(req.body.id);
    const name = req.body.name;
    const course_type = req.body.course_type;
    const semester = req.body.semester;
    const department = req.body.department;

    const params = {
        "id": id,
        "name": name,
        "course_type": course_type,
        "semester": semester,
        "department": department,
    };
    courses.push(params);

    return res.redirect('/');
});

/*app.post('/delete', (req, res) => {
    const listCheckboxSelected = Object.keys(req.body);

    if (listCheckboxSelected.length <= 0) {
        return res.redirect('/');
    }

    function onDeleteItem(length) {
        const maSanPhamCanXoa = Number(listCheckboxSelected[length]);

        data = data.filter(item => item.id !== maSanPhamCanXoa);
        if (length > 0) {
            console.log('Data delete :: ', JSON.stringify(data));
            onDeleteItem(length - 1);
        } else
            return res.redirect('/');
    }
    onDeleteItem(listCheckboxSelected.length - 1);
});
app.post('/delete', (req, res) => {
    const idToDelete = Number(req.params.id);

    // Lọc ra môn học có id trùng với idToDelete và xóa nó khỏi mảng courses
    courses = courses.filter(course => course.id !== idToDelete);

    // Chuyển hướng trở lại trang chính
    res.redirect('idToDelete');
});*/