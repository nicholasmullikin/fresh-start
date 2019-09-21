const stream = require('stream');
const mongoose = require('mongoose');
const multer = require('multer');
const Jimp = require('jimp');

const quantity = 20;
const plantSchema = new mongoose.Schema({
  plantName: String,
  plantID: {type: String, unique: true},
  plantDescription: String,
  quantity: Number,
  location: {
    type: {type: String, default: 'Point', enum: ['Point']},
    coordinates: [Number],
    // index: '2dsphere',
  },
  user: String,
  pictures: [],
  contact_info: {
    email: String,
    phone_number: String,
  },
  plantTaxa: String,
  plantZone: String,
  price: String,
  plantType: String,
  createdAt: {type: Date, expires: 7 * 24 * 3600, default: Date.now},

}, {timestamps: true});

plantSchema.index({location: '2dsphere'});
// plantSchema.index({"expireAt": 1}, {expireAfterSeconds: 1});

/**
 * Get all plant info
 */

plantSchema.statics.getAll = function(callback) {
  return this.find(callback);
};
plantSchema.statics.getPlantsInLocation = function(lat, lon, dist, page, callback) {
  return this.find(
      {
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [lon, lat],
            },
            $minDistance: 0,
            $maxDistance: dist,
          },
        },
      },
      null,
      {skip: page * quantity, maxscan: quantity},
      callback
  );
};


function uploadFile(readStream, name) {
  const {Storage} = require('@google-cloud/storage');
  // Creates a client
  const storage = new Storage({keyFilename: 'plant-app-e8af8-firebase-adminsdk-h015c-910f583b54.json'});
  const bucketName = 'gs://plant-app-e8af8.appspot.com';

  const myBucket = storage.bucket(bucketName);
  const file = myBucket.file(name);
  readStream.pipe(file.createWriteStream(
      {
        metadata: {
          cacheControl: 'public, max-age=31536000',
          contentDisposition: 'inline',
          contentType: 'image/png',
        },
      }
  ))
      .on('error', (err) => {
        console.log(err);
      })
      .on('finish', () => {
        file
            .makePublic()
            .catch((err) => {
              console.error('ERROR:', err);
            });
      });
}

function deleteFile(name) {
  // name = name.substring(name.indexOf(), name.length);
  const {Storage} = require('@google-cloud/storage');

  // Creates a client
  const storage = new Storage({keyFilename: 'plant-app-e8af8-firebase-adminsdk-h015c-910f583b54.json'});
  const bucketName = storage.bucket('gs://plant-app-e8af8.appspot.com');


  const file = bucketName.file(name);
  file
      .delete()
      .catch((err) => {
        if (err) {
          console.log(err);
        }
      });
}


plantSchema.statics.saveImage = (buffer, blobName) => new Promise((resolve, reject) => {
  Jimp.read(buffer).then((thumbnail) => {
    const widthInPixels = 300;

    const quality = 60;
    const deflateLevel = 9;
    thumbnail.resize(widthInPixels, Jimp.AUTO);
    thumbnail.quality(quality);
    thumbnail.rgba(false);
    thumbnail.deflateLevel(deflateLevel);

    (new Promise((resolve, reject) => {
      thumbnail.getBuffer(Jimp.MIME_PNG, (error, buf) => (error ? reject(error) : resolve(buf)));
    })).then((buf) => {
      const readStream = stream.PassThrough();
      readStream.end(buf);
      uploadFile(readStream, blobName);
    });
  }).catch((err) => {
    if (err) {
      console.log(err);
    }
  });
}).catch((err) => {
  if (err) {
    console.log(err);
  }
});

plantSchema.statics.deleteImage = (filename) => {
  const img = filename.substring(filename.indexOf('.appspot.com/') + 13);
  deleteFile(img);
};

plantSchema.statics.plantUpload = multer(
    {inMemory: true}
)
    .fields([{
      name: 'gallery',
      maxCount: 8,
    }]);

plantSchema.statics.isObjectId = (n) => mongoose.Types.ObjectId.isValid(n);

const Plant = mongoose.model('Plant', plantSchema);
module.exports = Plant;
