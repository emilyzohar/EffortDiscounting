const AWS = require("aws-sdk");

exports.handler = async (event, context) => {
  const s3 = new AWS.S3({
    accessKeyId: process.env.key_id,
    secretAccessKey: process.env.secret_key,
  });

  const csvContent = event.body; // CSV content from the client

  // Generate a timestamp to include in the filename
  const date = new Date();
  const timestamp = date.toISOString();

  const filenameFromHeader = event.headers['x-filename']; // new
  const filename = filenameFromHeader ? filenameFromHeader : new Date().toISOString();//new



  try {
    const result = await s3
      .upload({
        Bucket: "effortmindset",
        Key: `${filename}.csv`, // before: Key: `trial_results_${timestamp}.csv`,
        Body: csvContent,
        ACL: "private",
        ContentEncoding: "utf8", // required
        ContentType: `text/csv`,
      })
      .promise();

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
};




// const AWS = require('aws-sdk');

// exports.handler = async function(event, context, callback) {
//     const csvContent = event.body; // The CSV content received from the frontend

//     // Extract the filename (SID) from headers
//     const filenameFromHeader = event.headers['x-filename'];
//     const filename = filenameFromHeader ? filenameFromHeader : new Date().toISOString();

//     // Configure AWS SDK with your credentials and the desired endpoint URL
//     AWS.config.update({
//         accessKeyId: process.env.key_id,
//         secretAccessKey: process.env.secret_key,
//         region: process.env.region,
//         s3ForcePathStyle: true,
//         endpoint: process.env.endpoint,
//     });

//     const s3 = new AWS.S3();
//     const bucketName = process.env.AWS_BUCKET_NAME;
//     const filePath = `${filename}`;

//     const params = {
//         Bucket: bucketName,
//         Key: filePath,
//         Body: csvContent,
//     };

//     try {
//         const response = await s3.upload(params).promise();
//         return {
//             statusCode: 200,
//             body: JSON.stringify({ message: 'File uploaded successfully' }),
//         };
//     } catch (error) {
//         return {
//             statusCode: 500,
//             body: JSON.stringify({ error: 'An error occurred during file upload' }),
//         };
//     }
// };
