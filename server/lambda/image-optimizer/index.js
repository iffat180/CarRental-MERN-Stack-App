const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const Jimp = require('jimp');

const s3Client = new S3Client({ region: 'us-east-1' });

const SIZES = {
  large: { width: 1200, height: 800 },
  medium: { width: 800, height: 600 },
  thumb: { width: 400, height: 300 }
};

exports.handler = async (event) => {
  console.log('Image optimizer triggered');

  try {
    const record = event.Records[0];
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    
    console.log(`Processing: ${bucket}/${key}`);
    
    if (!key.startsWith('uploads/')) {
      console.log('Skipping - not in uploads/');
      return { statusCode: 200, body: 'Skipped' };
    }
    
    console.log('Downloading from S3...');
    const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
    const originalImage = await s3Client.send(getCommand);
    
    const chunks = [];
    for await (const chunk of originalImage.Body) {
      chunks.push(chunk);
    }
    const imageBuffer = Buffer.concat(chunks);
    
    console.log(`Original: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
    
    const filename = key.split('/').pop();
    const nameWithoutExt = filename.split('.').slice(0, -1).join('.');
    const ext = filename.split('.').pop();
    
    console.log(`Processing: ${filename}`);
    
    // Load image with Jimp v0.16
    const image = await Jimp.read(imageBuffer);
    
    for (const [sizeName, dimensions] of Object.entries(SIZES)) {
      console.log(`Creating ${sizeName} (${dimensions.width}x${dimensions.height})...`);
      
      try {
        const resized = image.clone()
          .cover(dimensions.width, dimensions.height)
          .quality(70);
        
        const optimizedBuffer = await resized.getBufferAsync(Jimp.MIME_JPEG);
        
        const optimizedSize = (optimizedBuffer.length / 1024).toFixed(2);
        const reduction = ((1 - (optimizedBuffer.length / imageBuffer.length)) * 100).toFixed(1);
        
        console.log(`${sizeName}: ${optimizedSize} KB (${reduction}% smaller)`);
        
        const optimizedKey = `optimized/${nameWithoutExt}-${sizeName}.${ext}`;
        
        const putCommand = new PutObjectCommand({
          Bucket: bucket,
          Key: optimizedKey,
          Body: optimizedBuffer,
          ContentType: 'image/jpeg',
          CacheControl: 'max-age=31536000'
        });
        
        await s3Client.send(putCommand);
        console.log(`Uploaded: ${optimizedKey}`);
        
      } catch (err) {
        console.error(`Error processing ${sizeName}:`, err);
      }
    }
    
    console.log('✅ Complete!');
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Success', original: key })
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};