const mongoose = require('mongoose');
const fileType = require('file-type');
const lusca = require('lusca');
const geoip = require('geoip-lite');
const {check, oneOf, validationResult} = require('express-validator/check');
const xssFilters = require('xss-filters');
const https = require('https');
const uuidv1 = require('uuid/v1');
const User = require('../models/User');
const Plant = require('../models/Plant');
/**
 * GET /plant/view/:id
 * Show the info of a plant.
 */
exports.plantInfo = (req, res) => {
  if (!Plant.isObjectId(req.params.id)) {
    req.flash('errors', {
      msg: 'Not a valid plant id',
    });
    return res.redirect('back');
  }
  Plant.findOne({
    _id: mongoose.Types.ObjectId(req.params.id),
  }, (err, plant) => {
    if (err) return res.redirect('/');
    if (plant === null || plant.plantName === null) {
      res.redirect('/');
    }
    return res.render('plant/plant_info', {
      title: plant.plantName,
      name: 'plant_info',
      array: plant,
    });
  });
};


/**
 * GET /plant/new/
 * New Plant Page
 */
exports.newPlant = (req, res) => {
  if (!req.user) {
    req.flash('errors', {
      msg: 'You must be logged in to create a posting',
    });
    req.session.returnTo = '/plant/new/';
    return res.redirect('/login');
  }
  const geo = geoip.lookup(getIP(req));
  // console.log(req.user);
  return res.render('plant/new_plant', {
    title: 'New Plant',
    results: geo,
  });
};

/**
 * POST /plant/new/
 * Page one of making a new plant
 */
exports.checkPostPlant = [
  check('lat', 'Lat - Map error').isFloat({min: -90.0, max: 90.0}),
  check('lng', 'Long - Map error').isFloat({min: -180.0, max: 180.0}),
  check('plantName', 'Name must be between 3 and 100 characters').isLength({min: 4, max: 100}),
  check('plantTaxa', 'Taxa must be less than 100 characters').isLength({max: 100}),
  check('plantZone', 'Zone is invalid').isLength({max: 100}),
  check('plantDescription', 'Plant Description must be at least 4 characters long').isLength({min: 4}),
  check('quantity', 'Number is invalid').isInt({min: 1, max: 999}),
  check('price', 'Price must be less than 100 characters').isLength({max: 100}),
  check('plantType', 'Plant type must be less than 100 characters').isLength({max: 100}),
  oneOf([
    check('email', 'Email is invalid').isEmail(),
    check('phone_number', 'Phone number is invalid').isMobilePhone('any'),
  ]),
];
exports.postPlant = (req, res) => {
  if (!req.user) {
    req.flash('errors', {
      msg: 'You must be logged in to create a posting',
    });
    req.session.returnTo = '/plant/new/';
    return res.redirect('/login');
  }
  const errors = validationResult(req).mapped();
  if (Object.getOwnPropertyNames(errors).length) {
    const prop = Object.getOwnPropertyNames(errors); // get list of objects in error response
    req.flash('errors', errors[prop[0]]); // access property name with [x] notation
    return res.redirect('back');
  }

  User.findById(req.user.id, (err) => {
    if (err) {
      console.log(err);
    }
  }).then((user) => {
    const date = new Date();
    const difference = (date.getTime() - last_upload(user.uploads).getTime());
    /* if (difference < 60000) {
          req.flash('errors', {
            msg: 'Please wait another ' + Math.round((60000 - difference )/ 1000) + ' seconds'
          });
          res.redirect('/plant');
        } */
    if (true) {
      temp_date = new Date();
      // console.log(temp_date);
      temp_date.setDate(temp_date.getDate() + 7);
      // console.log(temp_date);
      req.body.plantName = xssFilters.inHTMLData(req.body.plantName);
      req.body.plantDescription = xssFilters.inHTMLData(req.body.plantDescription);
      req.body.quantity = xssFilters.inHTMLData(req.body.quantity);
      req.body.lat = xssFilters.inHTMLData(req.body.lat);
      req.body.lng = xssFilters.inHTMLData(req.body.lng);
      req.body.plantTaxa = xssFilters.inHTMLData(req.body.plantTaxa);
      req.body.plantZone = xssFilters.inHTMLData(req.body.plantZone);
      req.body.email = xssFilters.inHTMLData(req.body.email);
      req.body.phone_number = xssFilters.inHTMLData(req.body.phone_number);
      req.body.price = xssFilters.inHTMLData(req.body.price);
      req.body.plantType = xssFilters.inHTMLData(req.body.plantType);
      const plant = new Plant({
        plantName: req.body.plantName,
        plantDescription: req.body.plantDescription,
        quantity: req.body.quantity,
        location: {type: 'Point', coordinates: [req.body.lat, req.body.lng]},
        plantID: uuidv1(),
        user: req.user._id,
        plantTaxa: req.body.plantTaxa,
        plantZone: req.body.plantZone,
        contact_info:
                    {
                      email: req.body.email,
                      phone_number: req.body.phone_number,
                    },
        price: req.body.price,
        plantType: req.body.plantType,
        expireAt: temp_date,
      });

      plant.save((err, plant) => {
        if (err) {
          req.flash('errors', err);
          return res.redirect('back');
        }
        return res.redirect(`/plant/upload/${plant._id}`);
      });
    }
  }, (err) => {
    console.log(err);
  });
};


/**
 * GET /plant/upload/:id
 * Page 2 of plant form (upload page)
 */
exports.newPlantImages = (req, res) => {
  if (!req.user) {
    req.flash('errors', {
      msg: 'You must be logged in to create a posting',
    });
    req.session.returnTo = '/plant';
    return res.redirect('/login');
  }
  Plant.findOne({
    _id: mongoose.Types.ObjectId(req.params.id),
  }, (err, plant) => {
    if (err) {
      return handleError(err);
    }
    if (plant === null) {
      return res.redirect('/');
    }
    if (plant.user.toString() !== req.user._id.toString()) {
      req.flash('errors', {
        msg: 'You are not the owner!',
      });
      return res.redirect('/');
    }
    return res.render('plant/new_plant_files', {
      title: 'New Post - Image Upload',
      name: 'new_plant',
    });
  });
};

/**
 * POST /plant/upload/:id
 * Page 2 of plant form (upload page)
 */
exports.postNewPlantImages = (req, res) => {
  if (!Plant.isObjectId(req.params.id)) {
    // console.log("jo")
    req.flash('errors', {
      msg: 'Not a valid plant id',
    });
    return res.redirect('back');
  }
  if (!req.user) {
    req.flash('errors', {
      msg: 'You must be logged in to create a posting',
    });
    req.session.returnTo = '/plant';
    return res.redirect('/login');
  }
  User.findById(req.user.id, (err, user) => {
    if (err) {
      console.log(err);
    }
    const date = new Date();
    if (!user) {
      req.flash('errors', {
        msg: 'User error',
      });
      return res.redirect('back');
    }
    const difference = (date.getTime() - last_upload(user.uploads).getTime());
    /* if (difference < 60000) {
          req.flash('errors', {
            msg: 'Please wait another ' + Math.round((60000 - difference )/ 1000) + ' seconds'
          });
          return res.redirect('/plant');
        } */
    if (true) {
      Plant.plantUpload(req, res, (err) => {
        if (err) {
          console.log(err);
          req.flash('errors', {
            msg: 'Upload error',
          });
          return res.redirect('back');
        }

        lusca.csrf()(req, res, (error) => {
          if (error) {
            console.log(error);
          }
        });
        const new_plant = {pictures: []};
        let total_size = 0;
        if (req.files.gallery) {
          for (let i = 0; i < req.files.gallery.length; i++) {
            total_size += req.files.gallery[i].size;
            if (req.files.gallery[i].size > 1024 * 1024 * 10) {
              req.flash('errors', {
                msg: 'Image is too big! (10 MB max)',
              });
              delete req.files.gallery[i].buffer;
              return res.redirect(`/plant/upload/${req.params.id}`);
            }
            const filetypes = /(jpg|jpeg|png|gif|tif)/;
            const infoFile = fileType(req.files.gallery[i].buffer);
            if (infoFile === null) {
              req.flash('errors', {
                msg: 'Only images are allowed (e.g. jpg jpeg png gif tif)',
              });
              delete req.files.gallery[i].buffer;
              return res.redirect(`/plant/upload/${req.params.id}`);
            }
            const mimetype = filetypes.test(infoFile.mime);
            const extname = filetypes.test(infoFile.ext);
            if (!mimetype || !extname) {
              req.flash('errors', {
                msg: 'Only images are allowed (e.g. jpg jpeg png gif tif)',
              });
              delete req.files.gallery[i].buffer;
              return res.redirect(`/plant/upload/${req.params.id}`);
            }

            const current_date = Date.now().toString();
            // req.files.gallery[i].path = path.join(__dirname, '/../uploads/plantImages', req.user._id.toString() + '-' + current_date + '.' + ext);
            const name = `${req.user._id.toString()}-${current_date}.` + 'png';
            const urlBegin = 'https://storage.googleapis.com/plant-app-e8af8.appspot.com/';
            Plant.on('error', (err) => {
              console.log(err);
            });
            Plant.saveImage(req.files.gallery[i].buffer, name);
            // console.log(new_plant.pictures);
            new_plant.pictures.push(urlBegin + name);
            delete req.files.gallery[i].buffer;
            if (i + 1 === req.files.gallery.length) {
              const date = new Date();
              user.uploads.push({
                time: date,
                size: total_size,
              });
              user.save((err) => {
                if (err) {
                  console.log(err);
                }
              });

              Plant.findByIdAndUpdate(req.params.id, new_plant, (err) => {
                // console.log("plant");
                if (err) {
                  console.log(err);
                  req.flash('errors', {msg: err});
                  return res.redirect(`/plant/upload/${req.params.id}`);
                }
                return res.redirect('/');
              });
            }
          }
        }
      });
    }
  });
};


/**
 * GET /plant/edit/:id
 * Edit Plant page
 */
exports.editPlant = (req, res) => {
  if (!Plant.isObjectId(req.params.id)) {
    // console.log("jo")
    req.flash('errors', {
      msg: 'Not a valid plant id',
    });
    return res.redirect('back');
  }
  Plant.findOne({
    _id: mongoose.Types.ObjectId(req.params.id),
  }, (err, plant) => {
    if (err) {
      return handleError(err);
    }
    if (plant === null) {
      return res.redirect('/');
    }
    if (plant.user.toString() !== req.user._id.toString() && !req.user.admin) {
      req.flash('errors', {
        msg: 'You are not the owner!',
      });
      return res.redirect('/');
    }
    return res.render('plant/edit_plant', {
      title: 'Edit Posting',
      array: plant,
    });
  });
};

/**
 * POST /plant/edit/:id
 * Change a posting
 */
exports.checkPostPlantEdit = [
  check('lat', 'Map error').isFloat({min: -90.0, max: 90.0}),
  check('lng', 'Map error').isFloat({min: -180.0, max: 180.0}),
  check('plantName', 'Name must be between 3 and 100 characters').isLength({min: 4, max: 100}),
  check('plantTaxa', 'Taxa must be less than 100 characters').isLength({max: 100}),
  check('price', 'Price must be less than 100 characters').isLength({max: 100}),
  check('plantZone', 'Zone is invalid').isLength({max: 4}),
  check('plantDescription', 'Plant Description must be at least 4 characters long').isLength({min: 4}),
  check('quantity', 'Number is invalid').isInt({min: 1, max: 999}),
  check('plantType', 'Plant type must be less than 100 characters').isLength({max: 100}),
  oneOf([
    check('email', 'Email is invalid').isEmail(),
    check('phone_number', 'Phone number is invalid').isMobilePhone('any'),
  ]),
];
exports.postPlantEdit = (req, res) => {
  if (!req.user) {
    req.flash('errors', {
      msg: 'You must be logged in to edit a posting',
    });
    req.session.returnTo = '/plant';
    return res.redirect('/login');
  }

  const errors = validationResult(req).mapped();
  if (Object.getOwnPropertyNames(errors).length) {
    const prop = Object.getOwnPropertyNames(errors); // get list of objects in error response
    req.flash('errors', errors[prop[0]]); // access property name with [x] notation
    console.log(errors[prop[0]]);
    return res.redirect('back');
  }

  User.findById(req.user.id, (err, user) => {
    if (err) {
      console.log(err);
    }
    // if (checkIfUserIsOwner(user, req.params.id)) {
    //     req.flash('errors', {
    //         msg: 'You are not the owner!'
    //     });
    //     req.session.returnTo = '/plant';
    //     return res.redirect('/login');
    // }
    /* let date = new Date();
        let difference = (date.getTime() - last_upload(response.uploads).getTime());
         if (difference < 60000) {
          req.flash('errors', {
            msg: 'Please wait another ' + Math.round((60000 - difference )/ 1000) + ' seconds'
          });
           return res.redirect('/plant');
        } */

    Plant.findById(req.params.id, (err, response) => {
      if (err) {
        console.log(err);
        // TODO add redirect
      }
      if (response.user.toString() !== req.user._id.toString() && req.user.admin !== true) {
        req.flash('errors', {
          msg: 'You are not the owner!',
        });
        return res.redirect('/');
      }
      req.body.plantName = xssFilters.inHTMLData(req.body.plantName);
      req.body.plantDescription = xssFilters.inHTMLData(req.body.plantDescription);
      req.body.quantity = xssFilters.inHTMLData(req.body.quantity);
      req.body.lat = xssFilters.inHTMLData(req.body.lat);
      req.body.lng = xssFilters.inHTMLData(req.body.lng);
      req.body.plantTaxa = xssFilters.inHTMLData(req.body.plantTaxa);
      req.body.plantZone = xssFilters.inHTMLData(req.body.plantZone);
      req.body.email = xssFilters.inHTMLData(req.body.email);
      req.body.phone_number = xssFilters.inHTMLData(req.body.phone_number);
      req.body.price = xssFilters.inHTMLData(req.body.price);
      const new_plant = {
        plantName: req.body.plantName || response.plantName,
        plantDescription: req.body.plantDescription || response.plantDescription,
        quantity: req.body.quantity || response.quantity,
        location:
                    {
                      type: 'Point',
                      coordinates:
                            [
                              req.body.lat || response.location.coordinates[0],
                              req.body.lng || response.location.coordinates[1],
                            ],
                    },
        plantTaxa: req.body.plantTaxa || response.plantTaxa,
        plantZone: req.body.plantZone || response.plantZone,
        price: req.body.price || response.price,
        contact_info:
                    {
                      email: req.body.email || response.contact_info.email,
                      phone_number: req.body.phone_number || response.contact_info.phone_number,
                    },
        plantType: req.body.plantType || response.plantType,

      };
      if (req.user.admin && req.body.admin) {
        new_plant.pictures = JSON.parse(req.body.pictures);
      }
      Plant.findByIdAndUpdate(response._id, new_plant, (err) => {
        if (err) {
          console.log(err);
          req.flash('errors', {msg: 'Update failed'});
          return res.redirect('back');
        }

        return res.redirect(`/plant/editUpload/${req.params.id}`);
      });
    });
  });
};

/**
 * GET /plant/editUpload/:id
 * Edit Plant page - images
 */
exports.editPlantImages = (req, res) => {
  if (!Plant.isObjectId(req.params.id)) {
    // console.log("jo");
    req.flash('errors', {
      msg: 'Not a valid plant id',
    });
    return res.redirect('back');
  }
  Plant.findOne({
    _id: mongoose.Types.ObjectId(req.params.id),
  }, (err, plant) => {
    if (err) {
      return handleError(err);
    }
    if (plant === null) {
      return res.redirect('/');
    }
    if (plant.user.toString() !== req.user._id.toString() && !req.user.admin) {
      req.flash('errors', {
        msg: 'You are not the owner!',
      });
      return res.redirect('/');
    }
    return res.render('plant/edit_plant_files', {
      title: 'Edit Posting',
      array: plant,
    });
  });
};

/**
 * POST /plant/editUpload/:id
 * Change a posting - images
 */
exports.postPlantEditImages = (req, res) => {
  if (!Plant.isObjectId(req.params.id)) {
    req.flash('errors', {
      msg: 'Not a valid plant id',
    });
    return res.redirect('back');
  }

  if (!req.user) {
    req.flash('errors', {
      msg: 'You must be logged in to edit a posting',
    });
    req.session.returnTo = '/plant';
    return res.redirect('/login');
  }

  const errors = validationResult(req).mapped();
  console.log(errors);
  if (Object.getOwnPropertyNames(errors).length) {
    const prop = Object.getOwnPropertyNames(errors); // get list of objects in error response
    req.flash('errors', errors[prop[0]]); // access property name with [x] notation
    return res.redirect('back');
  }
  User.findById(req.user.id, (err) => {
    if (err) {
      console.log(err);
    }
  }).then((user) => {
    if (checkIfUserIsOwner(user, req.params.id.toString()) && req.user.admin) {
      req.flash('errors', {
        msg: 'You are not the owner!',
      });
      req.session.returnTo = '/plant';
      return res.redirect('/login');
    }
    /* let date = new Date();
        let difference = (date.getTime() - last_upload(user.uploads).getTime());
         if (difference < 60000) {
          req.flash('errors', {
            msg: 'Please wait another ' + Math.round((60000 - difference )/ 1000) + ' seconds'
          });
           return res.redirect('/plant');
        } */

    Plant.findById(req.params.id, (err, response) => {
      if (err) {
        console.log(err);
        req.flash('errors', {
          msg: 'Error finding plant',
        });
        return res.redirect('back');
      }
      Plant.plantUpload(req, res, (err) => {
        if (err) {
          console.log(err);
        }
        lusca.csrf()(req, res, (error) => {
          if (error) {
            console.log(error);
            req.flash('errors', {
              msg: 'Please reload page',
            });
            return res.redirect('back');
          }
        });
        const new_plant = {pictures: []};
        const final_images = response.pictures;
        // console.log(final_images);
        let t = req.body.files_deleted;
        if (typeof t !== 'undefined' && t.length !== 0) {
          t = JSON.parse(t);
          // console.log(t[0]);
          for (let c = 0; c < t.length; c++) {
            Plant.deleteImage(t[c]);
            final_images.splice(final_images.indexOf(t[c]), 1);
          }
        }
        new_plant.pictures = final_images;

        // console.log(final_images);
        // console.log(new_plant);

        if (req.files.gallery) {
          let total_size = 0;
          const imgAmount = req.files.gallery.length;
          for (let i = 0; i < imgAmount; i++) {
            total_size += req.files.gallery[i].size;
            if (req.files.gallery[i].size > 1024 * 1024 * 10) {
              req.flash('errors', {
                msg: 'Image is too big! (10 MB max)',
              });
              delete req.files.gallery[i].buffer;
              return res.redirect('/plant');
            }
            const filetypes = /(jpg|jpeg|png|gif|tif)/;
            const infoFile = fileType(req.files.gallery[i].buffer);
            if (infoFile === null) {
              req.flash('errors', {
                msg: 'Only images are allowed (e.g. jpg jpeg png gif tif)',
              });
              delete req.files.gallery[i].buffer;
              return res.redirect('/plant');
            }
            const mimetype = filetypes.test(infoFile.mime);
            const extname = filetypes.test(infoFile.ext);
            if (!mimetype || !extname) {
              req.flash('errors', {
                msg: 'Only images are allowed (e.g. jpg jpeg png gif tif)',
              });
              delete req.files.gallery[i].buffer;
              return res.redirect('/plant');
            }

            Plant.on('error', (err) => {
              console.log(err);
            });
            const current_date = Date.now().toString();
            const name = `${req.user._id.toString()}-${current_date}.` + 'png';
            const urlBegin = 'https://storage.googleapis.com/plant-app-e8af8.appspot.com/';
            Plant.saveImage(req.files.gallery[i].buffer, name);
            delete req.files.gallery[i].buffer;
            final_images.push(urlBegin + name);
            if (i + 1 === imgAmount) {
              new_plant.pictures = final_images;
              const date = new Date();
              user.uploads.push({
                time: date,
                size: total_size,
              });
              user.save((err) => {
                if (err) {
                  console.log(err);
                }
              });
              Plant.findByIdAndUpdate(response._id, new_plant, (err) => {
                if (err) {
                  console.log(err);
                  req.flash('errors', {msg: err});
                  return res.redirect('back');
                }
                return res.redirect('/');
              });
            }
          }
        } else {
          Plant.findByIdAndUpdate(response._id, new_plant, (err) => {
            if (err) {
              console.log(err);
              req.flash('errors', {msg: err});
              return res.redirect('back');
            }
            return res.redirect('/');
          });
        }
      });
    });
  }, (error) => {
    console.log(error);
  });
};


/**
 * GET /plant/postings
 * Show all posting by a user
 */
exports.plantListings = (req, res) => {
  if (!req.user) {
    req.flash('errors', {
      msg: 'You must be logged in to view your postings',
    });
    req.session.returnTo = '/postings';
    return res.redirect('/login');
  }
  Plant.find({
    user: req.user._id,
  }, (err, plants) => res.render('plant/postings', {
    title: 'Your Postings',
    array: plants,
  }));
};

/**
 * DELETE /plant/edit/:id
 * Remove a posting
 */
exports.deletePlant = (req, res) => {
  Plant.findOne({_id: mongoose.Types.ObjectId(req.params.id)}, (err, plant) => {
    if (err) return handleError(err);

    User.findById(mongoose.mongo.ObjectId(plant.user), (err, user) => {
      if (err) {
        console.log(err);
        return res.sendStatus(402);
      }
      if (user) {
        if (plant === null) {
          res.redirect('/');
        }
        for (let i = 0; i < plant.pictures.length; i++) {
          Plant.deleteImage(plant.pictures[i]);
        }
        Plant.findByIdAndRemove(mongoose.mongo.ObjectId(req.params.id), (err) => {
          console.log(err);
        });
      }
    });
  });
  res.sendStatus(303);
};

/**
 * POST /plant/view/:id
 * Get contact info for a plant
 */
exports.getContactInformation = (req, res) => { // TODO: add captcha here
  if (!Plant.isObjectId(req.body.plant_id)) {
    req.flash('errors', {
      msg: 'Not a valid plant id',
    });
    return res.redirect('back');
  }
  if (!req.user) {
    req.flash('errors', {
      msg: 'You must be logged in to see contact info',
    });
    return res.sendStatus(401);
  }
  verifyRecaptcha(req.body['g-recaptcha-response'], (success) => {
    if (success) {
      Plant.findById(req.params.id, (err, plant) => {
        if (err) {
          console.log(err);
          return res.sendStatus(402);
        }
        User.findById(mongoose.mongo.ObjectId(plant.user), (err, user) => {
          if (err) {
            console.log(err);
            return res.sendStatus(402);
          }
          if (user) {
            return res.render('plant/plant_info', {
              title: plant.plantName,
              name: 'plant_info',
              array: plant,
              user_info: plant.contact_info,
            });
          }
        });
      });
    } else {
      req.flash('errors', {
        msg: 'Captcha failed',
      });
      return res.redirect('back');
    }
  });
};


/**
 * GET /admin
 * Admin Page
 */
exports.adminPage = (req, res) => {
  User.findById(mongoose.mongo.ObjectId(req.user._id), (err, user) => {
    if (err) {
      console.log(err);
      // return res.sendStatus(402);
    }
    if (user.admin) {
      return res.render('plant/admin', {
        title: 'admin',
        name: 'plant_info',
        array: 'plant',
      });
    }

    return res.render('not_found');
  });
};
/**
 * GET /admin/data
 * Admin Page for data
 */
exports.adminPageData = (req, res) => {
  if (!Plant.isObjectId(req.body.id)) {
    return res.send(JSON.stringify({
      msg: 'Not a valid plant id',
    }));
  }

  User.findById(mongoose.mongo.ObjectId(req.user._id), (err, user) => {
    if (err) {
      console.log(err);
      // return res.sendStatus(402);
    }
    if (user.admin) {
      if (!Plant.isObjectId(req.body.id)) {
        return res.send(JSON.stringify({
          msg: 'Not a valid plant id',
        }));
      }
      Plant.findById(req.body.id, (err, plant) => {
        if (err) {
          console.log(err);
          return res.sendStatus(402);
        }
        return res.send(JSON.stringify(plant));
      });
    } else {
      return res.render('not_found');
    }
  });
};


/*

Helper Functions
 */
const SECRET = '6LfpOm0UAAAAAKlM_pVAdE2pWFMTEeGdP5YcSqwf';

// Helper function to make API call to recatpcha and check response
function verifyRecaptcha(key, callback) {
  https.get(`https://www.google.com/recaptcha/api/siteverify?secret=${SECRET}&response=${key}`, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk.toString();
    });
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(data);
        callback(parsedData.success);
      } catch (e) {
        callback(false);
      }
    });
  });
}


function checkIfUserIsOwner(user, plantId) {
  for (let i = 0; i < user.uploads.length; i++) {
    if (user.uploads[i] === plantId) {
      return true;
    }
  }
  return false;
}

function last_upload(array) {
  const len = array.length;
  let most_recent_date = new Date(0);
  for (let i = 0; i < len; i++) {
    if (array[i].time.getTime() > most_recent_date.getTime()) {
      most_recent_date = array[i].time;
    }
  }
  return most_recent_date;
}

function getIP(req) {
  let headers = '';
  let remoteAddress = '';
  let socket = '';
  let conRemoteAddress = '';
  if (typeof req.headers['x-forwarded-for'] !== 'undefined') {
    headers = req.headers['x-forwarded-for'].split(',').pop();
  }
  if (typeof req.connection.remoteAddress !== 'undefined') {
    remoteAddress = req.connection.remoteAddress;
  }
  if (typeof req.socket.remoteAddress !== 'undefined') {
    socket = req.socket.remoteAddress;
  }
  if (typeof req.connection.socket !== 'undefined') {
    if (typeof req.connection.socket.remoteAddress !== 'undefined') {
      conRemoteAddress = req.connection.socket.remoteAddress;
    }
  }
  if ((headers || remoteAddress || socket || conRemoteAddress) === '::1') {
    return '69.74.60.146';
  }
  return headers || remoteAddress || socket || conRemoteAddress;
}
