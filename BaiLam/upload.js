const AWS = require('aws-sdk');
const fs = require('fs');

AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,

});

const s3 = new AWS.S3();

const imagePath = "PerfectIeltsSpeaking.jpg";

const bucketName = 'that909kk';

function uploadImageToS3(imagePath, bucketName) {
    const imageContent = fs.readFileSync(imagePath);

    const params = {
        Bucket: bucketName,
        Key: imagePath,
        Body: imageContent,
        ACL: 'public-read',
    };

    s3.upload(params, (err, data) => {
        if (err) {
            console.error(err);
        } else {
            console.log('Image uploaded successfully.');
            console.log('Image URL:', data.Location);
        }
    });
}

uploadImageToS3(imagePath, bucketName);