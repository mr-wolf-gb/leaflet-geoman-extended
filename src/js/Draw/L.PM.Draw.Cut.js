import lineIntersect from '@turf/line-intersect';
import lineSplit from '@turf/line-split';
import booleanContains from '@turf/boolean-contains';
import get from 'lodash/get';
import Draw from './L.PM.Draw';
import {
  difference,
  flattenPolyline,
  groupToMultiLineString,
  intersect,
} from '../helpers/turfHelper';

Draw.Cut = Draw.Polygon.extend({
  initialize(map) {
    this._map = map;
    this._shape = 'Cut';
    this.toolbarButtonName = 'cutPolygon';
  },
  _finishShape() {
    // if self intersection is not allowed, do not finish the shape!
    if (!this.options.allowSelfIntersection) {
      this._handleSelfIntersection(true, this._layer.getLatLngs()[0]);

      if (this._doesSelfIntersect) {
        return;
      }
    }

    // If snap finish is required but the last marker wasn't snapped, do not finish the shape!
    if (
      this.options.requireSnapToFinish &&
      !this._hintMarker._snapped &&
      !this._isFirstLayer()
    ) {
      return;
    }

    // get coordinates
    const coords = this._layer.getLatLngs();

    // Require at least 3 points to form a cutting polygon
    if (coords.length < 3) {
      return;
    }

    // Create cutting polygon
    const cuttingLayer = L.polygon(coords, this.options.pathOptions);

    // Store snapping info
    cuttingLayer._latlngInfos = this._layer._latlngInfo;

    // Perform the cut
    this.cut(cuttingLayer);

    // clean up snapping states
    this._cleanupSnapping();

    // remove the first vertex from "other snapping layers"
    if (this._tempSnapLayerIndex !== undefined) {
      this._otherSnapLayers.splice(this._tempSnapLayerIndex, 1);
      delete this._tempSnapLayerIndex;
    }

    const hintMarkerLatLng = this._hintMarker.getLatLng();

    // disable drawing
    this.disable();
    if (this.options.continueDrawing) {
      this.enable();
      this._hintMarker.setLatLng(hintMarkerLatLng);
    }
  },
  cut(cuttingLayer) {
    const all = this._map._layers;
    const _latlngInfos = cuttingLayer._latlngInfos || [];

    // Find all layers that can be cut
    const layersToCut = Object.keys(all)
      .map((l) => all[l])
      .filter((l) => l.pm)
      .filter((l) => !l._pmTempLayer)
      .filter(
        (l) =>
          (!L.PM.optIn && !l.options.pmIgnore) ||
          (L.PM.optIn && l.options.pmIgnore === false)
      )
      .filter((l) => l instanceof L.Polyline || l instanceof L.Circle)
      .filter((l) => l !== cuttingLayer)
      .filter((l) => l.pm.options.allowCutting)
      .filter((l) => {
        if (
          this.options.layersToCut &&
          L.Util.isArray(this.options.layersToCut) &&
          this.options.layersToCut.length > 0
        ) {
          return this.options.layersToCut.indexOf(l) > -1;
        }
        return true;
      })
      .filter((l) => !this._layerGroup.hasLayer(l))
      .filter((l) => {
        try {
          // For circles, always check intersection since they need special handling
          if (l instanceof L.Circle) {
            // Check if cutting layer intersects with circle bounds
            const circleBounds = l.getBounds();
            const cuttingBounds = cuttingLayer.getBounds();
            return circleBounds.intersects(cuttingBounds);
          }

          const lineInter =
            !!lineIntersect(cuttingLayer.toGeoJSON(15), l.toGeoJSON(15))
              .features.length > 0;

          if (
            lineInter ||
            (l instanceof L.Polyline && !(l instanceof L.Polygon))
          ) {
            return lineInter;
          }
          return !!intersect(cuttingLayer.toGeoJSON(15), l.toGeoJSON(15));
        } catch (e) {
          return false;
        }
      });

    // Cut each layer
    layersToCut.forEach((layerToCut) => {
      this._cutSingleLayer(cuttingLayer, layerToCut, _latlngInfos);
    });

    // Remove the cutting layer (it was just for cutting, not to be kept)
    cuttingLayer._pmTempLayer = true;
    cuttingLayer.remove();
  },
  _cutSingleLayer(cuttingLayer, layerToCut, _latlngInfos) {
    // Prepare the layer for cutting
    let preparedLayer;
    if (layerToCut instanceof L.Circle) {
      preparedLayer = layerToCut;
    } else if (layerToCut instanceof L.Polygon) {
      preparedLayer = L.polygon(layerToCut.getLatLngs());
      const coords = preparedLayer.getLatLngs();

      // Add snapping points for precise cuts
      _latlngInfos.forEach((info) => {
        if (info && info.snapInfo) {
          const { latlng } = info;
          const closest = this._calcClosestLayer(latlng, [preparedLayer]);
          if (
            closest &&
            closest.segment &&
            closest.distance < this.options.snapDistance
          ) {
            const { segment } = closest;
            if (segment && segment.length === 2) {
              const { indexPath, parentPath, newIndex } =
                L.PM.Utils._getIndexFromSegment(coords, segment);
              const coordsRing =
                indexPath.length > 1 ? get(coords, parentPath) : coords;
              coordsRing.splice(newIndex, 0, latlng);
            }
          }
        }
      });
    } else {
      preparedLayer = layerToCut;
    }

    // Perform the cut operation
    const cutResult = this._performCut(cuttingLayer, preparedLayer);

    if (!cutResult) {
      return;
    }

    // Convert result to Leaflet layers
    const resultLayers = this._convertCutResultToLayers(cutResult, layerToCut);

    if (resultLayers.length === 0) {
      return;
    }

    // Remove the original layer
    layerToCut._pmTempLayer = true;
    layerToCut.remove();
    layerToCut.removeFrom(this._map.pm._getContainingLayer());

    // Add each result layer independently
    resultLayers.forEach((newLayer) => {
      // Add to map
      this._setPane(newLayer, 'layerPane');
      this._finishLayer(newLayer);
      newLayer.addTo(this._map.pm._getContainingLayer());

      // Attach context menu to the new layer
      if (this._map.pm.Toolbar && this._map.pm.Toolbar._contextMenu) {
        this._map.pm.Toolbar._contextMenu.attachLayerContextMenu(newLayer);
      }

      // Fire events
      this._fireCut(layerToCut, newLayer, layerToCut);
      this._fireCut(this._map, newLayer, layerToCut);
    });

    // Fire edit event on original layer
    if (layerToCut.pm) {
      layerToCut.pm._fireEdit();
    }
  },
  _performCut(cuttingLayer, layerToCut) {
    let result;

    if (layerToCut instanceof L.Circle) {
      // Convert circle to polygon approximation for cutting
      // Create a polygon with many points to approximate the circle
      const center = layerToCut.getLatLng();
      const radius = layerToCut.getRadius();
      const points = 64; // Number of points to approximate circle
      const circlePoints = [];

      for (let i = 0; i < points; i++) {
        const angle = (i * 360) / points;
        const point = this._computeDestinationPoint(center, radius, angle);
        circlePoints.push(point);
      }

      // Create a temporary polygon from the circle points
      const circlePolygon = L.polygon(circlePoints);
      result = difference(
        circlePolygon.toGeoJSON(15),
        cuttingLayer.toGeoJSON(15)
      );
    } else if (layerToCut instanceof L.Polygon) {
      // Cut polygon
      result = difference(layerToCut.toGeoJSON(15), cuttingLayer.toGeoJSON(15));
    } else {
      // Cut polyline
      const features = flattenPolyline(layerToCut);
      const fg = L.geoJSON();

      features.forEach((feature) => {
        const lineDiff = lineSplit(feature, cuttingLayer.toGeoJSON(15));

        let group;
        if (lineDiff && lineDiff.features.length > 0) {
          group = L.geoJSON(lineDiff);
        } else {
          group = L.geoJSON(feature);
        }

        group.getLayers().forEach((lay) => {
          if (!booleanContains(cuttingLayer.toGeoJSON(15), lay.toGeoJSON(15))) {
            lay.addTo(fg);
          }
        });
      });

      if (features.length > 1) {
        result = groupToMultiLineString(fg);
      } else {
        result = fg.toGeoJSON(15);
      }
    }

    return result;
  },
  _convertCutResultToLayers(cutResult, originalLayer) {
    const layers = [];

    // Check if the result is a MultiPolygon or MultiLineString
    if (cutResult && cutResult.type) {
      if (cutResult.type === 'MultiPolygon') {
        // MultiPolygon - create separate polygon for each
        cutResult.coordinates.forEach((polyCoords) => {
          // Convert GeoJSON coordinates to LatLngs
          const latlngs = this._geoJsonCoordsToLatLngs(polyCoords);
          const newLayer = L.polygon(latlngs, originalLayer.options);
          layers.push(newLayer);
        });
        return layers;
      } else if (cutResult.type === 'MultiLineString') {
        // MultiLineString - create separate polyline for each
        cutResult.coordinates.forEach((lineCoords) => {
          const latlngs = this._geoJsonCoordsToLatLngs(lineCoords);
          const newLayer = L.polyline(latlngs, originalLayer.options);
          layers.push(newLayer);
        });
        return layers;
      } else if (cutResult.type === 'GeometryCollection') {
        // GeometryCollection - process each geometry
        cutResult.geometries.forEach((geom) => {
          const subLayers = this._convertCutResultToLayers(geom, originalLayer);
          layers.push(...subLayers);
        });
        return layers;
      } else if (cutResult.type === 'FeatureCollection') {
        // FeatureCollection - process each feature
        cutResult.features.forEach((feature) => {
          const subLayers = this._convertCutResultToLayers(
            feature.geometry,
            originalLayer
          );
          layers.push(...subLayers);
        });
        return layers;
      }
    }

    // Fallback: use L.geoJSON to convert
    const geoJsonLayer = L.geoJSON(cutResult);
    const resultLayers = geoJsonLayer.getLayers
      ? geoJsonLayer.getLayers()
      : [geoJsonLayer];

    // Create new independent layers from the result
    resultLayers.forEach((tempLayer) => {
      let newLayer;
      const latlngs = tempLayer.getLatLngs();

      // Check if this is a polygon with multiple rings (holes)
      // If so, treat each ring as a separate polygon
      if (tempLayer instanceof L.Polygon && Array.isArray(latlngs[0])) {
        // Multiple rings - create separate polygon for each outer ring
        latlngs.forEach((ring) => {
          if (Array.isArray(ring) && ring.length > 0) {
            const ringLayer = L.polygon([ring], originalLayer.options);
            layers.push(ringLayer);
          }
        });
      } else if (tempLayer instanceof L.Polygon) {
        newLayer = L.polygon(latlngs, originalLayer.options);
        layers.push(newLayer);
      } else if (tempLayer instanceof L.Polyline) {
        newLayer = L.polyline(latlngs, originalLayer.options);
        layers.push(newLayer);
      }
    });

    return layers;
  },
  _geoJsonCoordsToLatLngs(coords, levelsDeep = 0) {
    // Convert GeoJSON coordinates to Leaflet LatLngs
    const latlngs = [];

    for (let i = 0; i < coords.length; i++) {
      const coord = coords[i];

      if (Array.isArray(coord) && typeof coord[0] === 'number') {
        // This is a coordinate pair [lng, lat]
        latlngs.push(L.latLng(coord[1], coord[0]));
      } else if (Array.isArray(coord)) {
        // This is a nested array, recurse
        latlngs.push(this._geoJsonCoordsToLatLngs(coord, levelsDeep + 1));
      }
    }

    return latlngs;
  },
  _computeDestinationPoint(latlng, distance, bearing) {
    // Compute a destination point given a starting point, distance (in meters), and bearing (in degrees)
    const R = 6371000; // Earth's radius in meters
    const lat1 = (latlng.lat * Math.PI) / 180;
    const lon1 = (latlng.lng * Math.PI) / 180;
    const bearingRad = (bearing * Math.PI) / 180;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distance / R) +
        Math.cos(lat1) * Math.sin(distance / R) * Math.cos(bearingRad)
    );

    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(bearingRad) * Math.sin(distance / R) * Math.cos(lat1),
        Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
      );

    return L.latLng((lat2 * 180) / Math.PI, (lon2 * 180) / Math.PI);
  },
  _change: L.Util.falseFn,
});
