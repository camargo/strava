const fetch = require('node-fetch');
const fs = require('fs');
const togeojson = require('@mapbox/togeojson');
const { DOMParser } = require('xmldom');
const FitParser = require('fit-file-parser').default;

/**
 * Transform a '.fit' file imported from FitParser into GeoJSON.
 */
function fitToGeoJson(data) {
  const geo = {
    features: [],
    type: 'FeatureCollection',
  };

  if (data && data.records) {
    const feature = {
      geometry: {
        coordinates: [],
        type: 'LineString',
      },
      properties: {
        name: data.sport ? data.sport.name : '',
        time: data.file_id.time_created,
      },
      type: 'Feature',
    };

    for (let i = 0; i < data.records.length; ++i) {
      const record = data.records[i];

      if (record.position_long && record.position_lat && record.altitude) {
        feature.geometry.coordinates.push([
          record.position_long,
          record.position_lat,
          record.altitude,
        ]);
      }
    }

    geo.features.push(feature);
  }

  return geo;
}

/**
 * Transform a '.gpx' or '.fit' file into GeoJSON.
 */
function toGeoJson(filePath) {
  return new Promise(resolve => {
    if (filePath.includes('.gpx')) {
      const file = fs.readFileSync(filePath, 'utf8');
      const path = togeojson.gpx(
        new DOMParser().parseFromString(file, 'text/xml'),
      );
      resolve(path);
    } else if (filePath.includes('.fit')) {
      const file = fs.readFileSync(filePath);
      const fitParser = new FitParser({
        elapsedRecordField: true,
        force: true,
        lengthUnit: 'mi',
        mode: 'both',
        speedUnit: 'mph',
        temperatureUnit: 'fahrenheit',
      });
      fitParser.parse(file, (_, data) => {
        const path = fitToGeoJson(data);
        resolve(path);
      });
    }
  });
}

/**
 * Get a place (city and country) given a longitude and latitude (i.e. a reverse geocode).
 * @note You must pass in a Mapbox token for this function to work properly.
 */
async function reverseGeocode(long, lat, token = '') {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${long},${lat}.json?access_token=${token}`;
  const res = await fetch(url);
  const { features } = await res.json();
  const [{ place_name }] = features.filter(({ id }) => id.includes('place'));
  return place_name;
}

module.exports = {
  reverseGeocode,
  toGeoJson,
};
