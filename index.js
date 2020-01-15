const csv = require('csvtojson');
const fs = require('fs');
const { basename } = require('path');
const { reverseGeocode, toGeoJson } = require('./util.js');

async function main(exportFolderPath = './export', targetYear = 2019) {
  const activitiesMetadata = await csv().fromFile(
    `${exportFolderPath}/activities.csv`,
  );

  const paths = [];
  let totalDistance = 0;

  for (let i = 0; i < activitiesMetadata.length; ++i) {
    const activityMetadata = activitiesMetadata[i];
    const { Distance, Filename } = activityMetadata;
    const activityType = activityMetadata['Activity Type'];
    const activityFileName = basename(Filename, '.gz');

    // Parse activity file into GeoJSON.
    const path = await toGeoJson(
      `${exportFolderPath}/activities/${activityFileName}`,
    );
    const [features] = path.features;
    const { geometry, properties } = features;
    const { coordinates } = geometry;
    const { time } = properties;

    // Determine date and year of activity.
    const date = new Date(time);
    const year = date.getFullYear();

    // Only include activities with path data during the target year.
    if (coordinates.length > 0 && year === targetYear) {
      const distance = parseFloat(Distance);
      const [[long, lat]] = coordinates;

      // Figure out what city the activity was in and increment total distance.
      const place = await reverseGeocode(long, lat);
      totalDistance += distance;

      paths.push({
        ...path,
        activityType,
        date: date.toLocaleDateString(),
        distance,
        place,
      });
    }
  }

  fs.writeFileSync(`./paths.json`, JSON.stringify({ paths, totalDistance }));
}

main();
