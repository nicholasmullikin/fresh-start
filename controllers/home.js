const Plant = require('../models/Plant');

/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  res.render('home', {
    title: 'Home',
  });
};
/**
 * GET /api/plants
 * Plants that are in range
 */
exports.getPlantsInRange = (req, res) => {
  const results_to_send = {};
  if (!isFloat(req.query.lat) || req.query.lat < -90 || req.query.lat > 90) {
    return res.status(416).send('Error - request is out of range');
  }
  if (!isFloat(req.query.lng) || req.query.lng < -180 || req.query.lng > 180) {
    return res.status(416).send('Error - request is out of range');
  }
  if (!isFloat(req.query.dist) || req.query.dist < 0 || req.query.dist > 10000000000) {
    return res.status(416).send('Error - request is out of range');
  }
  if (!isFloat(req.query.page) || req.query.page < 0 || req.query.page > 1000) {
    return res.status(416).send('Error - request is out of range');
  }

  Plant.getPlantsInLocation(req.query.lat, req.query.lng, req.query.dist, req.query.page, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(402);
    }
    if (result != undefined) {
      for (let i = 0; i < result.length; i++) {
        results_to_send[i] = {
          plantName: result[i].plantName,
          plantDescription: result[i].plantDescription,
          page: `/plant/view/${result[i]._id}`,
        };
        if (result[i].pictures.length !== 0) {
          results_to_send[i].pictureLoc = result[i].pictures[0];
          // results_to_send[i].pictureLoc = "/plantImages/" + result[i].pictures[0].path.substr(result[i].pictures[0].path.lastIndexOf("\\") + 1);
        } else {
          results_to_send[i].pictureLoc = '';
        }
      }
      return res.status(250).send(results_to_send);
    }
  });

  return res.status(403);
};


function isFloat(n) {
  return n !== '' && !isNaN(n) && Math.round(n) !== n;
}
