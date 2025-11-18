import { createGeodesicPolygon, getTranslation } from './helpers';
import { _toLatLng, _toPoint } from './helpers/ModeHelper';

const Utils = {
  calcMiddleLatLng(map, latlng1, latlng2) {
    // calculate the middle coordinates between two markers

    const p1 = map.project(latlng1);
    const p2 = map.project(latlng2);

    return map.unproject(p1._add(p2)._divideBy(2));
  },
  findLayers(map) {
    let layers = [];
    map.eachLayer((layer) => {
      if (
        layer instanceof L.Polyline ||
        layer instanceof L.Marker ||
        layer instanceof L.Circle ||
        layer instanceof L.CircleMarker ||
        layer instanceof L.ImageOverlay
      ) {
        layers.push(layer);
      }
    });

    // filter out layers that don't have the leaflet-geoman instance
    layers = layers.filter((layer) => !!layer.pm);

    // filter out everything that's leaflet-geoman specific temporary stuff
    layers = layers.filter((layer) => !layer._pmTempLayer);

    // filter out everything that ignore leaflet-geoman
    layers = layers.filter(
      (layer) =>
        (!L.PM.optIn && !layer.options.pmIgnore) || // if optIn is not set / true and pmIgnore is not set / true (default)
        (L.PM.optIn && layer.options.pmIgnore === false) // if optIn is true and pmIgnore is false);
    );

    return layers;
  },
  circleToPolygon(circle, sides = 60, withBearing = true) {
    const origin = circle.getLatLng();
    const radius = circle.getRadius();
    const polys = createGeodesicPolygon(origin, radius, sides, 0, withBearing); // these are the points that make up the circle
    const polygon = [];
    for (let i = 0; i < polys.length; i += 1) {
      const geometry = [polys[i].lat, polys[i].lng];
      polygon.push(geometry);
    }
    return L.polygon(polygon, circle.options);
  },
  disablePopup(layer) {
    if (layer.getPopup()) {
      layer._tempPopupCopy = layer.getPopup();
      layer.unbindPopup();
    }
  },
  enablePopup(layer) {
    if (layer._tempPopupCopy) {
      layer.bindPopup(layer._tempPopupCopy);
      delete layer._tempPopupCopy;
    }
  },
  _fireEvent(layer, type, data, propagate = false) {
    layer.fire(type, data, propagate);

    // fire event to all parent layers
    const { groups } = this.getAllParentGroups(layer);
    groups.forEach((group) => {
      group.fire(type, data, propagate);
    });
  },
  getAllParentGroups(layer) {
    const groupIds = [];
    const groups = [];

    // get every group layer once
    const loopThroughParents = (_layer) => {
      for (const _id in _layer._eventParents) {
        if (groupIds.indexOf(_id) === -1) {
          groupIds.push(_id);
          const group = _layer._eventParents[_id];
          groups.push(group);
          loopThroughParents(group);
        }
      }
    };

    // check if the last group fetch is under 1 sec, then we use the groups from before
    if (
      !layer._pmLastGroupFetch ||
      !layer._pmLastGroupFetch.time ||
      new Date().getTime() - layer._pmLastGroupFetch.time > 1000
    ) {
      loopThroughParents(layer);
      layer._pmLastGroupFetch = {
        time: new Date().getTime(),
        groups,
        groupIds,
      };
      return {
        groupIds,
        groups,
      };
    }
    return {
      groups: layer._pmLastGroupFetch.groups,
      groupIds: layer._pmLastGroupFetch.groupIds,
    };
  },
  createGeodesicPolygon,
  getTranslation,
  findDeepCoordIndex(arr, latlng, exact = true) {
    // find latlng in arr and return its location as path
    // thanks for the function, Felix Heck
    let result;

    const run = (path) => (v, i) => {
      const iRes = path.concat(i);

      if (exact) {
        if (v.lat && v.lat === latlng.lat && v.lng === latlng.lng) {
          result = iRes;
          return true;
        }
      } else if (v.lat && L.latLng(v).equals(latlng)) {
        result = iRes;
        return true;
      }

      return Array.isArray(v) && v.some(run(iRes));
    };
    arr.some(run([]));

    let returnVal = {};

    if (result) {
      returnVal = {
        indexPath: result,
        index: result[result.length - 1],
        parentPath: result.slice(0, result.length - 1),
      };
    }

    return returnVal;
  },
  findDeepMarkerIndex(arr, marker) {
    // thanks for the function, Felix Heck
    let result;

    const run = (path) => (v, i) => {
      const iRes = path.concat(i);

      if (v._leaflet_id === marker._leaflet_id) {
        result = iRes;
        return true;
      }

      return Array.isArray(v) && v.some(run(iRes));
    };
    arr.some(run([]));

    let returnVal = {};

    if (result) {
      returnVal = {
        indexPath: result,
        index: result[result.length - 1],
        parentPath: result.slice(0, result.length - 1),
      };
    }

    return returnVal;
  },
  _getIndexFromSegment(coords, segment) {
    if (segment && segment.length === 2) {
      const indexA = this.findDeepCoordIndex(coords, segment[0]);
      const indexB = this.findDeepCoordIndex(coords, segment[1]);
      let newIndex = Math.max(indexA.index, indexB.index);
      if ((indexA.index === 0 || indexB.index === 0) && newIndex !== 1) {
        newIndex += 1;
      }
      return {
        indexA,
        indexB,
        newIndex,
        indexPath: indexA.indexPath,
        parentPath: indexA.parentPath,
      };
    }
    return null;
  },
  // Returns the corners of the rectangle with a given rotation
  // degrees: Between marker A and the marker counterclockwise before. Same for marker B
  _getRotatedRectangle(A, B, rotation, map) {
    const startPoint = _toPoint(map, A);
    const endPoint = _toPoint(map, B);
    const theta = (rotation * Math.PI) / 180;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);

    const width =
      (endPoint.x - startPoint.x) * cos + (endPoint.y - startPoint.y) * sin;
    const height =
      (endPoint.y - startPoint.y) * cos - (endPoint.x - startPoint.x) * sin;
    const x0 = width * cos + startPoint.x;
    const y0 = width * sin + startPoint.y;
    const x1 = -height * sin + startPoint.x;
    const y1 = height * cos + startPoint.y;

    const p0 = _toLatLng(map, startPoint);
    const p1 = _toLatLng(map, { x: x0, y: y0 });
    const p2 = _toLatLng(map, endPoint);
    const p3 = _toLatLng(map, { x: x1, y: y1 });
    return [p0, p1, p2, p3];
  },
  pxRadiusToMeterRadius(radiusInPx, map, center) {
    const pointA = map.project(center);
    const pointB = L.point(pointA.x + radiusInPx, pointA.y);
    return map.distance(map.unproject(pointB), center);
  },
  getMeasurements(layer, map, displayFormat = 'metric') {
    if (!layer || !map) {
      return null;
    }

    const measurements = {};
    const isMetric = displayFormat === 'metric';

    // Helper function to format distance
    const formatDistance = (meters) => {
      if (isMetric) {
        if (meters >= 1000) {
          return `${(meters / 1000).toFixed(2)} km`;
        }
        return `${meters.toFixed(2)} m`;
      } else {
        // Imperial
        const feet = meters * 3.28084;
        if (feet >= 5280) {
          return `${(feet / 5280).toFixed(2)} mi`;
        }
        return `${feet.toFixed(2)} ft`;
      }
    };

    // Helper function to format area
    const formatArea = (sqMeters) => {
      if (isMetric) {
        if (sqMeters >= 10000) {
          return `${(sqMeters / 10000).toFixed(2)} ha`;
        }
        return `${sqMeters.toFixed(2)} m²`;
      } else {
        // Imperial
        const sqFeet = sqMeters * 10.7639;
        if (sqFeet >= 43560) {
          return `${(sqFeet / 43560).toFixed(2)} acres`;
        }
        return `${sqFeet.toFixed(2)} ft²`;
      }
    };

    // Marker or CircleMarker - coordinates
    if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
      const latlng = layer.getLatLng();
      measurements.coordinates = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
    }

    // Circle - radius, area, perimeter
    if (layer instanceof L.Circle) {
      const radius = layer.getRadius();
      measurements.radius = formatDistance(radius);
      measurements.area = formatArea(Math.PI * radius * radius);
      measurements.perimeter = formatDistance(2 * Math.PI * radius);
    }

    // CircleMarker - radius (in pixels, but we can show it)
    if (layer instanceof L.CircleMarker && !(layer instanceof L.Circle)) {
      const radiusPx = layer.getRadius();
      const center = layer.getLatLng();
      const radiusMeters = this.pxRadiusToMeterRadius(radiusPx, map, center);
      measurements.radius = formatDistance(radiusMeters);
      measurements.area = formatArea(Math.PI * radiusMeters * radiusMeters);
      measurements.perimeter = formatDistance(2 * Math.PI * radiusMeters);
    }

    // Polyline - total length, segment length
    if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
      const latlngs = layer.getLatLngs();
      let totalLength = 0;

      for (let i = 0; i < latlngs.length - 1; i++) {
        totalLength += map.distance(latlngs[i], latlngs[i + 1]);
      }

      measurements.totalLength = formatDistance(totalLength);

      // Last segment length
      if (latlngs.length >= 2) {
        const lastSegment = map.distance(
          latlngs[latlngs.length - 2],
          latlngs[latlngs.length - 1]
        );
        measurements.segmentLength = formatDistance(lastSegment);
      }
    }

    // Polygon - area, perimeter, segment length
    if (layer instanceof L.Polygon && !(layer instanceof L.Rectangle)) {
      const latlngs = layer.getLatLngs()[0]; // Get outer ring
      let perimeter = 0;

      // Calculate perimeter
      for (let i = 0; i < latlngs.length; i++) {
        const next = (i + 1) % latlngs.length;
        perimeter += map.distance(latlngs[i], latlngs[next]);
      }

      measurements.perimeter = formatDistance(perimeter);

      // Calculate area using shoelace formula
      const area = this._calculatePolygonArea(latlngs);
      measurements.area = formatArea(area);

      // Last segment length
      if (latlngs.length >= 2) {
        const lastSegment = map.distance(
          latlngs[latlngs.length - 2],
          latlngs[latlngs.length - 1]
        );
        measurements.segmentLength = formatDistance(lastSegment);
      }
    }

    // Rectangle - width, height, area, perimeter
    if (layer instanceof L.Rectangle) {
      const bounds = layer.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const nw = L.latLng(ne.lat, sw.lng);
      const se = L.latLng(sw.lat, ne.lng);

      const width = map.distance(nw, ne);
      const height = map.distance(ne, se);

      measurements.width = formatDistance(width);
      measurements.height = formatDistance(height);
      measurements.area = formatArea(width * height);
      measurements.perimeter = formatDistance(2 * (width + height));
    }

    return measurements;
  },
  _calculatePolygonArea(latlngs) {
    // Calculate area using spherical excess formula for better accuracy
    let area = 0;
    const R = 6378137; // Earth's radius in meters

    if (latlngs.length < 3) {
      return 0;
    }

    for (let i = 0; i < latlngs.length; i++) {
      const p1 = latlngs[i];
      const p2 = latlngs[(i + 1) % latlngs.length];

      area +=
        (p2.lng - p1.lng) *
        (2 +
          Math.sin((p1.lat * Math.PI) / 180) +
          Math.sin((p2.lat * Math.PI) / 180));
    }

    area = (area * R * R) / 2;
    return Math.abs(area);
  },
};

export default Utils;
